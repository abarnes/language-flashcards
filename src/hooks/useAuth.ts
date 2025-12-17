import { createContext, useContext } from 'react'

export interface AuthContextValue {
  isFirebaseEnabled: boolean
  showAuthModal: () => void
}

export const AuthContext = createContext<AuthContextValue>({
  isFirebaseEnabled: false,
  showAuthModal: () => {},
})

export const useAuthContext = () => useContext(AuthContext)
