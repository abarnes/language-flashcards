import { User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useAuthContext } from '@/hooks/useAuth'

export function AuthButton() {
  const { user, signOut, isLoading } = useAuthStore()
  const { isFirebaseEnabled, showAuthModal } = useAuthContext()

  if (!isFirebaseEnabled) return null

  if (user) {
    return (
      <Button variant="ghost" size="sm" onClick={signOut} disabled={isLoading}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    )
  }

  return (
    <Button variant="ghost" size="sm" onClick={showAuthModal}>
      <User className="h-4 w-4 mr-2" />
      Sign In
    </Button>
  )
}
