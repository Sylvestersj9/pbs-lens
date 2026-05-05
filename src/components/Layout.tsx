import { Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <span className="text-lg font-bold text-primary">PBS Lens</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={signOut}>
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
