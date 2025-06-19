import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams
  return (
    <div className="min-h-screen bg-gradient-to-br from-brilliant-blue to-plum flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-white/90 backdrop-blur">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            FOMO Platform
          </h1>
          <p className="text-gray-600">
            Inicia sesión en tu workspace
          </p>
        </div>

        <form className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Tu contraseña"
              required
            />
          </div>

          <Button formAction={login} className="w-full">
            Iniciar Sesión
          </Button>

          {params?.message && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-center">
              {params.message}
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Registrarse
            </Link>
          </p>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-gray-500 text-sm">
            ¿Eres admin?{' '}
            <Link href="/setup" className="text-blue-600 hover:underline">
              Configurar empresa
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
} 