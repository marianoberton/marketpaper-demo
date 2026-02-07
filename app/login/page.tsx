import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth-layout'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams
  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Iniciar Sesion
        </h1>
        <p className="text-muted-foreground">
          Accede a tu workspace empresarial
        </p>
      </div>

      <form className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nombre@empresa.com"
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contrasena</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            className="h-11"
            required
          />
        </div>

        <Button
          formAction={login}
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          Acceder al Workspace
        </Button>

        {params?.message && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-center text-sm">
            <span className="font-medium">Error:</span> {params.message}
          </div>
        )}
      </form>

      <div className="mt-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          <Link href="/forgot-password" className="text-primary hover:underline">
            ¿Olvidaste tu contrasena?
          </Link>
        </p>
        <p className="text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Registrarse
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
