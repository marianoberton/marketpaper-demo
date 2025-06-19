'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { checkAndFixUserProfile } from './actions'

export default function FixUserPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFixProfile = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    const response = await checkAndFixUserProfile()

    if (response.success) {
      setResult(response)
    } else {
      setError(response.error || 'An unknown server error occurred.')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Reparación de Perfil de Usuario
          </h1>
          <p className="text-gray-600">
            Usa este botón si tienes problemas para acceder a tu workspace después de iniciar sesión.
          </p>
        </div>

        <div className="text-center mb-6">
          <Button 
            onClick={handleFixProfile}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Reparando...' : 'Verificar y Reparar Mi Perfil'}
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded text-green-700">
            <strong>¡Éxito!</strong>
            <p className="font-semibold">{result.message}</p>
            <pre className="mt-2 text-xs overflow-auto whitespace-pre-wrap">
              {result.data ? JSON.stringify(result.data, null, 2) : ''}
            </pre>
          </div>
        )}
      </Card>
    </div>
  )
} 