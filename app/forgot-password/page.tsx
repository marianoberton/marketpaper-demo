'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth-layout'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        throw resetError
      }

      setIsSuccess(true)
    } catch (err: any) {
      console.error('Reset password error:', err)
      setError(err.message || 'Error al enviar el email. Intentalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            ¡Email enviado!
          </h1>
          <p className="text-muted-foreground mb-6">
            Hemos enviado un enlace de recuperacion a <strong className="text-foreground">{email}</strong>.
            Revisa tu bandeja de entrada y segui las instrucciones.
          </p>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              ¿No recibiste el email? Revisa tu carpeta de spam o
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setIsSuccess(false)
                setEmail('')
              }}
              className="w-full"
            >
              Intentar de nuevo
            </Button>

            <Link href="/login" className="block">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio de sesion
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          ¿Olvidaste tu contrasena?
        </h1>
        <p className="text-muted-foreground">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contrasena
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="h-11"
            required
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !email}
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          {isLoading ? 'Enviando...' : 'Enviar enlace de recuperacion'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="text-primary hover:underline inline-flex items-center gap-2 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio de sesion
        </Link>
      </div>
    </AuthLayout>
  )
}
