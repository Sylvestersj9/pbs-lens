import { useState, useEffect } from 'react'
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function Auth() {
  const [searchParams] = useSearchParams()
  const isReset = searchParams.get('reset') === 'true'

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'new-password'>(
    isReset ? 'new-password' : 'signin'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, signInWithGoogle, resetPassword, updatePassword, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isReset && user) setMode('new-password')
  }, [isReset, user])

  if (user && mode !== 'new-password') {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (mode === 'forgot') {
      const { error } = await resetPassword(email)
      setLoading(false)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Password reset email sent — check your inbox')
        setMode('signin')
      }
      return
    }

    if (mode === 'new-password') {
      const { error } = await updatePassword(password)
      setLoading(false)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Password updated')
        navigate('/', { replace: true })
      }
      return
    }

    const { error } = mode === 'signup'
      ? await signUp(email, password)
      : await signIn(email, password)
    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else if (mode === 'signup') {
      toast.success('Check your email for a confirmation link')
    } else {
      navigate('/', { replace: true })
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithGoogle()
      if (error) toast.error(error.message)
    } catch {
      toast.error('Failed to start Google sign-in')
    }
  }

  const title = {
    signin: 'Sign in to your account',
    signup: 'Create your account',
    forgot: 'Reset your password',
    'new-password': 'Set a new password',
  }[mode]

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">PBS Lens</div>
          <CardTitle className="text-lg font-normal text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== 'new-password' && (
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}
            {mode !== 'forgot' && (
              <div>
                <Label htmlFor="password">
                  {mode === 'new-password' ? 'New Password' : 'Password'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? 'Loading...'
                : mode === 'signup'
                ? 'Sign Up'
                : mode === 'forgot'
                ? 'Send Reset Link'
                : mode === 'new-password'
                ? 'Update Password'
                : 'Sign In'}
            </Button>
          </form>

          {(mode === 'signin' || mode === 'signup') && (
            <>
              <div className="mt-4">
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                  Continue with Google
                </Button>
              </div>
              {mode === 'signin' && (
                <p className="mt-3 text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-muted-foreground hover:text-primary hover:underline"
                  >
                    Forgot your password?
                  </button>
                </p>
              )}
            </>
          )}

          {mode !== 'new-password' && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {mode === 'forgot' ? (
                <>
                  Remember your password?{' '}
                  <button type="button" onClick={() => setMode('signin')} className="text-primary hover:underline">
                    Sign in
                  </button>
                </>
              ) : mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setMode('signin')} className="text-primary hover:underline">
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setMode('signup')} className="text-primary hover:underline">
                    Sign up
                  </button>
                </>
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
