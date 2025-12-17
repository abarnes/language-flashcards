import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useVocabStore } from '@/stores/vocabStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { createLocalStorageProvider } from '@/services/storage/localStorageProvider'
import { createFirestoreProvider } from '@/services/storage/firestoreProvider'
import { isFirebaseConfigured } from '@/services/firebase'
import { AuthContext } from '@/hooks/useAuth'
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
        previousLists = state.lists
        firestore.saveLists(state.lists).catch((err) => {
          console.error('Failed to save lists to Firestore:', err)
        })
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
          // Load from Firestore
          const [lists, settings] = await Promise.all([
            firestore.loadLists(),
            firestore.loadSettings(),
          ])

          useVocabStore.getState()._hydrate(lists)
          if (settings) {
            // Keep local apiKey, merge other settings
            const localSettings = useSettingsStore.getState().settings
            useSettingsStore.getState()._hydrate({
              ...settings,
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
