'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Verificar si el usuario ya está logueado
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Si está logueado, redirigir al workspace
        router.push('/workspace')
      }
    }
    
    checkUser()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brilliant-blue to-plum flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 bg-white/90 backdrop-blur text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔥 FOMO Platform
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Plataforma Empresarial Multi-Tenant
          </p>
          <p className="text-gray-500">
            Analytics + Workspace Operativo + IA Workers
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <Button asChild className="w-full" size="lg">
            <Link href="/login">
              Iniciar Sesión
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href="/register">
              Crear Cuenta
            </Link>
          </Button>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500 mb-4">
            ¿Necesitas configurar una empresa?
          </p>
          <Button asChild variant="ghost" size="sm">
            <Link href="/setup">
              Configuración de Empresa
            </Link>
          </Button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left">
          <h3 className="font-semibold text-gray-900 mb-2">✨ Características:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 📊 Dashboard Analytics completo</li>
            <li>• 💼 Workspace operativo (CRM, documentos, equipo)</li>
            <li>• 🏢 Sistema multi-tenant</li>
            <li>• 🔐 Aislamiento total de datos por empresa</li>
            <li>• 🤖 Preparado para IA Workers</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
