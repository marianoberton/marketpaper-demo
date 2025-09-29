import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'

export default async function ClientLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-xl border border-gray-200">
        <div className="text-center mb-8">
          <div className="mb-6">
            <Image
              src="/inted.png"
              alt="INTED"
              width={160}
              height={60}
              className="mx-auto"
            />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Portal del Cliente
          </h1>
          <p className="text-gray-600">
            Accede a la información de tu proyecto
          </p>
        </div>

        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu.email@ejemplo.com"
              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <Button 
            formAction={login} 
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200"
          >
            Acceder al Portal
          </Button>

          {params?.message && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              <span className="font-medium">Error:</span> {params.message}
            </div>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <p>¿Necesitas ayuda?</p>
            <p className="mt-1">Contacta a tu gestor de proyecto</p>
          </div>
        </div>
      </Card>
    </div>
  )
}