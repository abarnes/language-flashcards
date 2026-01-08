import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useVocabStore } from '@/stores/vocabStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { createLocalStorageProvider } from '@/services/storage/localStorageProvider'
import { createFirestoreProvider } from '@/services/storage/firestoreProvider'
import { isFirebaseConfigured } from '@/services/firebase'
import { AuthContext } from '@/hooks/useAuth'
import type { VocabList } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AuthModal } from './AuthModal'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isInitialized } = useAuthStore()
  const [showMigrationDialog, setShowMigrationDialog] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [localDataCount, setLocalDataCount] = useState(0)
  const [isMigrating, setIsMigrating] = useState(false)
  const previousUserRef = useRef<string | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const showAuthModal = useCallback(() => setAuthModalOpen(true), [])

  const setupFirestorePersistence = useCallback((uid: string) => {
    const firestore = createFirestoreProvider(uid)
    let previousLists = useVocabStore.getState().lists
    let previousSettings = useSettingsStore.getState().settings

    // Subscribe to vocab store changes
    const unsubVocab = useVocabStore.subscribe((state) => {
      if (state.lists !== previousLists) {
        // Detect deleted lists and remove them from Firestore
        const currentIds = new Set(state.lists.map((l) => l.id))
        const deletedLists = previousLists.filter((l) => !currentIds.has(l.id))

        // Delete removed lists from Firestore
        for (const list of deletedLists) {
          firestore.deleteList(list.id).catch((err) => {
            console.error('Failed to delete list from Firestore:', err)
          })
        }

        previousLists = state.lists

        // Save the remaining lists
        if (state.lists.length > 0) {
          firestore.saveLists(state.lists).catch((err) => {
            console.error('Failed to save lists to Firestore:', err)
          })
        }
      }
    })

    // Subscribe to settings store changes
    const unsubSettings = useSettingsStore.subscribe((state) => {
      if (state.settings !== previousSettings) {
        previousSettings = state.settings
        firestore.saveSettings(state.settings).catch((err) => {
          console.error('Failed to save settings to Firestore:', err)
        })
      }
    })

    unsubscribeRef.current = () => {
      unsubVocab()
      unsubSettings()
    }
  }, [])

  // Handle auth state changes
  useEffect(() => {
    if (!isInitialized) return

    const currentUserId = user?.uid ?? null
    const previousUserId = previousUserRef.current

    // Only act on actual changes
    if (currentUserId === previousUserId) return
    previousUserRef.current = currentUserId

    // Clean up previous Firestore subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    async function handleAuthChange() {
      // Wait for zustand persist to finish rehydrating from localStorage
      // This prevents race conditions where we overwrite localStorage data
      // before it's been loaded into the store
      const waitForHydration = async () => {
        const stores = [useVocabStore, useSettingsStore]
        await Promise.all(
          stores.map((store) =>
            store.persist.hasHydrated()
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  const unsub = store.persist.onFinishHydration(() => {
                    unsub()
                    resolve()
                  })
                })
          )
        )
      }
      await waitForHydration()
      const localStorage = createLocalStorageProvider()

      if (currentUserId) {
        // User just signed in
        const firestore = createFirestoreProvider(currentUserId)

        // Check for local data to migrate
        const localLists = await localStorage.loadLists()
        const firestoreLists = await firestore.loadLists()

        if (localLists.length > 0 && firestoreLists.length === 0) {
          // First-time sign in with local data - prompt migration
          setLocalDataCount(localLists.length)
          setShowMigrationDialog(true)
        } else {
          // Merge localStorage and Firestore data by timestamp
          // Firestore is the source of truth for what exists
          const currentState = useVocabStore.getState().lists

          // Helper to get lastModified with backward compatibility
          const getLastModified = (list: VocabList) =>
            list.lastModified ?? list.createdAt ?? 0

          // Build a map of all lists by ID
          const localMap = new Map(currentState.map((l) => [l.id, l]))
          const firestoreMap = new Map(firestoreLists.map((l) => [l.id, l]))

          // Merge strategy:
          // - If in both: keep the one with newer lastModified
          // - If only in Firestore: include it (created on another device)
          // - If only in localStorage: DON'T include (was deleted on another device)
          //   Exception: if it was created very recently (within last 30 seconds),
          //   it might just not have synced yet
          const now = Date.now()
          const RECENT_THRESHOLD = 30 * 1000 // 30 seconds

          const mergedLists: VocabList[] = []

          // Process all Firestore lists first (source of truth for existence)
          for (const [id, remote] of firestoreMap) {
            const local = localMap.get(id)
            if (local) {
              // Both exist - keep the one with newer lastModified
              const localTime = getLastModified(local)
              const remoteTime = getLastModified(remote)
              mergedLists.push(localTime >= remoteTime ? local : remote)
            } else {
              // Only in Firestore - include it
              mergedLists.push(remote)
            }
          }

          // Only add localStorage-only lists if they were created very recently
          // (haven't had time to sync yet)
          for (const [id, local] of localMap) {
            if (!firestoreMap.has(id)) {
              const createdAt = local.createdAt ?? 0
              if (now - createdAt < RECENT_THRESHOLD) {
                // Recently created, probably just hasn't synced yet
                mergedLists.push(local)
              }
              // Otherwise, it was deleted on another device - don't restore
            }
          }

          // Update state with merged lists
          useVocabStore.getState()._hydrate(mergedLists)

          // Sync merged result to Firestore (only if there are new local items)
          const newLocalItems = mergedLists.filter(
            (l) => !firestoreMap.has(l.id)
          )
          if (newLocalItems.length > 0) {
            firestore.saveLists(mergedLists).catch((err) => {
              console.error('Failed to sync merged lists to Firestore:', err)
            })
          }

          // Load settings from Firestore if available
          const firestoreSettings = await firestore.loadSettings()
          if (firestoreSettings) {
            // Keep local apiKey, merge other settings
            const localSettings = useSettingsStore.getState().settings
            useSettingsStore.getState()._hydrate({
              ...firestoreSettings,
              apiKey: localSettings.apiKey, // Keep local API key
            })
          }

          // Set up Firestore persistence
          setupFirestorePersistence(currentUserId)
        }
      } else {
        // User signed out - reload from localStorage
        const [lists, settings] = await Promise.all([
          localStorage.loadLists(),
          localStorage.loadSettings(),
        ])

        useVocabStore.getState()._hydrate(lists)
        if (settings) {
          useSettingsStore.getState()._hydrate(settings)
        }
      }
    }

    handleAuthChange()
  }, [user?.uid, isInitialized, setupFirestorePersistence])

  const handleMigrate = async () => {
    if (!user) return

    setIsMigrating(true)
    try {
      const localStorage = createLocalStorageProvider()
      const firestore = createFirestoreProvider(user.uid)

      const localLists = await localStorage.loadLists()
      const localSettings = await localStorage.loadSettings()

      // Save to Firestore
      await firestore.saveLists(localLists)
      if (localSettings) {
        await firestore.saveSettings(localSettings)
      }

      // The store already has the data (was loaded from localStorage)
      // Just set up Firestore persistence going forward
      setupFirestorePersistence(user.uid)
    } catch (err) {
      console.error('Migration failed:', err)
    } finally {
      setIsMigrating(false)
      setShowMigrationDialog(false)
    }
  }

  const handleSkipMigration = () => {
    if (!user) return

    // Don't migrate, load Firestore (empty) and set up persistence
    useVocabStore.getState()._hydrate([])
    setShowMigrationDialog(false)
    setupFirestorePersistence(user.uid)
  }

  // Show loading state while Firebase initializes
  if (!isInitialized && isFirebaseConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isFirebaseEnabled: isFirebaseConfigured, showAuthModal }}>
      {children}

      {/* Migration Dialog */}
      <Dialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Migrate Local Data?</DialogTitle>
            <DialogDescription>
              You have {localDataCount} vocabulary list{localDataCount !== 1 ? 's' : ''} stored
              locally. Would you like to migrate them to your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleSkipMigration} disabled={isMigrating}>
              Start Fresh
            </Button>
            <Button onClick={handleMigrate} disabled={isMigrating}>
              {isMigrating ? 'Migrating...' : 'Migrate Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </AuthContext.Provider>
  )
}
