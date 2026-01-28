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
      <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm shadow-2xl border-0">
        <div className="text-center mb-8">
          <div className="mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="140" height="58" viewBox="0 0 46.83 19.27" className="mx-auto">
              <defs>
                <style>{`.cls-1,.cls-2,.cls-3{fill:#0f172a;}.cls-2{font-size:11.64px;letter-spacing:0.08em;}.cls-2,.cls-3{font-family:ConcertOne-Regular, Concert One;}.cls-3{font-size:6.47px;letter-spacing:0.2em;}`}</style>
              </defs>
              <g id="Capa_2" data-name="Capa 2">
                <g id="Capa_1-2" data-name="Capa 1">
                  <path className="cls-1" d="M7.07,3.23C6.27,3.51,6,4,5.76,5.32c-.07.42-.17.9-.21,1s-.07.3-.08.35-.09.27-.2.51c-.41.91-1.06,1.45-3,2.48a4.91,4.91,0,0,0-1.55,1,2.45,2.45,0,0,0-.57.84A3.71,3.71,0,0,0,0,12.76a4.36,4.36,0,0,0,.2,1.12c.2.43.4.59.65.5a.5.5,0,0,0,.25-.23c0-.15.07-.21-.05-.62a2.3,2.3,0,0,1,0-1.68,1.79,1.79,0,0,1,.7-.88,3,3,0,0,1,1.32-.38,4.48,4.48,0,0,1,1.77.51A7.45,7.45,0,0,1,7,13.27c.79,1.07,1.13,1.31,1.86,1.32a1.6,1.6,0,0,0,1.22-.49,1.71,1.71,0,0,0,.54-1.33,1.59,1.59,0,0,0-.4-1.18,1.71,1.71,0,0,0-2-.42,1.86,1.86,0,0,1-.9.14,1.83,1.83,0,0,1-1.7-2,1.92,1.92,0,0,1,.54-1.45A4.27,4.27,0,0,1,7.79,6.83,2.46,2.46,0,0,0,9,5.79,2.43,2.43,0,0,0,9.24,5,1.73,1.73,0,0,0,9,4.08a2.06,2.06,0,0,0-.88-.79A1.93,1.93,0,0,0,7.07,3.23Z" />
                  <text className="cls-2" transform="translate(12.66 9.8) rotate(0.21)">FOMO</text>
                  <text className="cls-3" transform="translate(13.32 16.18) rotate(0.21)">DIGITAL</text>
                </g>
              </g>
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Iniciar Sesión
          </h1>
          <p className="text-gray-600">
            Accede a tu workspace empresarial
          </p>
        </div>

        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="maria.gonzalez@fomodemo.com"
              className="h-11 border-gray-300 focus:border-brilliant-blue focus:ring-brilliant-blue"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="TestUser123!"
              className="h-11 border-gray-300 focus:border-brilliant-blue focus:ring-brilliant-blue"
              required
            />
          </div>

          <Button
            formAction={login}
            className="w-full h-11 bg-gradient-to-r from-brilliant-blue to-plum hover:from-brilliant-blue/90 hover:to-plum/90 text-white font-medium transition-all duration-200"
          >
            Acceder al Workspace
          </Button>

          {params?.message && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              <span className="font-medium">Error:</span> {params.message}
            </div>
          )}
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-gray-600">
            <Link href="/forgot-password" className="text-blue-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          <p className="text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Registrarse
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
} 