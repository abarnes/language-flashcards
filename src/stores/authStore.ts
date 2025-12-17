import { create } from 'zustand'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '@/services/firebase'

interface AuthState {
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null

  // Actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void

  // Internal
  _setUser: (user: User | null) => void
  _setInitialized: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: false,
  isInitialized: !isFirebaseConfigured, // If no Firebase, we're immediately "initialized"
  error: null,

  signIn: async (email, password) => {
    if (!auth) return
    set({ isLoading: true, error: null })
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const message = getFirebaseErrorMessage(err)
      set({ error: message })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  signUp: async (email, password) => {
    if (!auth) return
    set({ isLoading: true, error: null })
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const message = getFirebaseErrorMessage(err)
      set({ error: message })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  signOut: async () => {
    if (!auth) return
    set({ isLoading: true })
    try {
      await firebaseSignOut(auth)
    } finally {
      set({ isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
  _setUser: (user) => set({ user }),
  _setInitialized: () => set({ isInitialized: true }),
}))

// Set up auth listener
if (auth) {
  onAuthStateChanged(auth, (user) => {
    useAuthStore.getState()._setUser(user)
    useAuthStore.getState()._setInitialized()
  })
}

// Helper to get user-friendly error messages
function getFirebaseErrorMessage(err: unknown): string {
  const error = err as { code?: string; message?: string }
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists'
    case 'auth/invalid-email':
      return 'Invalid email address'
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled'
    case 'auth/weak-password':
      return 'Password is too weak (minimum 6 characters)'
    case 'auth/user-disabled':
      return 'This account has been disabled'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later'
    default:
      return error.message || 'An error occurred'
  }
}
