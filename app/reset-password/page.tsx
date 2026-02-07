'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react'

function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'url(/assets/preview-patronFOMO.png)',
          backgroundSize: '300px',
          backgroundRepeat: 'repeat',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/horizontalSVG-black.svg" alt="FOMO" className="h-12 dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/horizontalSVG-white.svg" alt="FOMO" className="h-12 hidden dark:block" />
        </div>

        <div className="bg-card rounded-xl border border-border p-8 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setIsValidSession(!!session)
    }

    checkSession()
  }, [])

  const validatePassword = () => {
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres'
    }
    if (password !== confirmPassword) {
      return 'Las contraseñas no coinciden'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validatePassword()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        throw updateError
      }

      setIsSuccess(true)

      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      console.error('Update password error:', err)
      setError(err.message || 'Error al actualizar la contraseña. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isValidSession === null) {
    return (
      <AuthPageShell>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AuthPageShell>
    )
  }

  // Invalid session
  if (!isValidSession) {
    return (
      <AuthPageShell>
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-destructive" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Enlace inválido o expirado
          </h1>
          <p className="text-muted-foreground mb-6">
            El enlace de recuperación ha expirado o no es válido.
            Por favor solicita uno nuevo.
          </p>

          <div className="space-y-3">
            <Link href="/forgot-password" className="block">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Solicitar nuevo enlace
              </Button>
            </Link>

            <Link href="/login" className="block">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio de sesión
              </Button>
            </Link>
          </div>
        </div>
      </AuthPageShell>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <AuthPageShell>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            ¡Contraseña actualizada!
          </h1>
          <p className="text-muted-foreground mb-6">
            Tu contraseña ha sido actualizada correctamente.
            Serás redirigido al inicio de sesión...
          </p>

          <Link href="/login" className="block">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Ir al inicio de sesión
            </Button>
          </Link>
        </div>
      </AuthPageShell>
    )
  }

  // Form state
  return (
    <AuthPageShell>
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="h-6 w-6 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Nueva contraseña
        </h1>
        <p className="text-muted-foreground">
          Ingresa tu nueva contraseña
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="h-11 pr-10"
              required
              disabled={isLoading}
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la contraseña"
            className="h-11"
            required
            disabled={isLoading}
            minLength={8}
          />
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !password || !confirmPassword}
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="text-primary hover:underline inline-flex items-center gap-2 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio de sesión
        </Link>
      </div>
    </AuthPageShell>
  )
}
