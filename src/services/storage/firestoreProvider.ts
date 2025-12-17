import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { StorageProvider } from './index'
import type { VocabList, Settings } from '@/types'

export function createFirestoreProvider(uid: string): StorageProvider {
  if (!db) throw new Error('Firestore not initialized')

  const listsRef = collection(db, 'users', uid, 'lists')
  const settingsDocRef = doc(db, 'users', uid, 'settings', 'user')

  return {
    async loadLists(): Promise<VocabList[]> {
      const snapshot = await getDocs(listsRef)
      return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as VocabList))
    },

    async saveList(list: VocabList): Promise<void> {
      await setDoc(doc(listsRef, list.id), list)
    },

    async deleteList(id: string): Promise<void> {
      await deleteDoc(doc(listsRef, id))
    },

    async saveLists(lists: VocabList[]): Promise<void> {
      const batch = writeBatch(db!)
      lists.forEach((list) => {
        batch.set(doc(listsRef, list.id), list)
      })
      await batch.commit()
    },

    async loadSettings(): Promise<Settings | null> {
      const snap = await getDoc(settingsDocRef)
      return snap.exists() ? (snap.data() as Settings) : null
    },

    async saveSettings(settings: Settings): Promise<void> {
      // Don't store API key in cloud for security
      const cloudSettings = { ...settings, apiKey: '' }
      await setDoc(settingsDocRef, cloudSettings)
    },

    async clearAll(): Promise<void> {
      const snapshot = await getDocs(listsRef)
      const batch = writeBatch(db!)
      snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref))
      batch.delete(settingsDocRef)
      await batch.commit()
    },
  }
}
