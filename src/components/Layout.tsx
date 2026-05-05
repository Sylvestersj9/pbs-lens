import { Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const NORA_EMAIL = 'nora-edwards@outlook.com'

export default function Layout() {
  const { user, signOut } = useAuth()
  const isNora = user?.email === NORA_EMAIL

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      toast.error('Failed to sign out. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        {isNora ? (
          <img src="/nec-consulting-logo.svg" alt="NEC Consulting" className="h-8 object-contain" />
        ) : (
          <span className="text-lg font-bold text-primary">PBS Lens</span>
        )}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
