import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const ADMIN_EMAIL = 'sylvestersj9@gmail.com'

export default function Admin() {
  const { user } = useAuth()
  const [email, setEmail] = useState('nora-edwards@outlook.com')
  const [loading, setLoading] = useState(false)

  if (user?.email !== ADMIN_EMAIL) {
    return <div className="text-center py-12 text-muted-foreground">Access denied</div>
  }

  const handleSeed = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('seed-nora-data', {
        body: { email },
      })

      if (error) throw error
      toast.success(data.message || 'Data seeded successfully')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Admin: Seed Demo Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="User email to seed"
          />
        </div>
        <Button onClick={handleSeed} disabled={loading}>
          {loading ? 'Seeding...' : 'Seed Data'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Seeds MR (13 incidents, review periods, full PBS plan), JT (4 incidents), and KL (no incidents) for the specified user.
        </p>
      </CardContent>
    </Card>
  )
}
