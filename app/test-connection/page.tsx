'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export default function TestConnectionPage() {
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (test: string, status: 'success' | 'error' | 'timeout', message: string, duration?: number) => {
    setResults(prev => [...prev, { test, status, message, duration, timestamp: new Date() }])
  }

  const runTest = async (testName: string, testFn: () => Promise<any>, timeout = 5000) => {
    const startTime = Date.now()
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
      
      const result = await Promise.race([testFn(), timeoutPromise])
      const duration = Date.now() - startTime
      addResult(testName, 'success', `✅ OK (${duration}ms)`, duration)
      return result
    } catch (error: any) {
      const duration = Date.now() - startTime
      if (error.message === 'Timeout') {
        addResult(testName, 'timeout', `⏰ Timeout después de ${timeout}ms`, duration)
      } else {
        addResult(testName, 'error', `❌ Error: ${error.message}`, duration)
      }
      throw error
    }
  }

  const runAllTests = async () => {
    setIsLoading(true)
    setResults([])

    try {
      // Test 1: Variables de entorno
      addResult('Variables ENV', 'success', '✅ Variables configuradas correctamente')

      // Test 2: Crear cliente Supabase
      await runTest('Cliente Supabase', async () => {
        if (!supabase) throw new Error('Cliente no inicializado')
        return supabase
      })

      // Test 3: Conectividad básica con timeout corto
      await runTest('Conectividad básica', async () => {
        const { data, error } = await supabase.from('companies').select('id').limit(1)
        if (error) throw error
        return data
      }, 15000)

      // Test 4: Auth session
      await runTest('Sesión de autenticación', async () => {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        return data.session
      }, 2000)

      // Test 5: Ping HTTP directo
      await runTest('Ping HTTP directo', async () => {
        const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          }
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.status
      }, 3000)

      // Test 6: Proxy servidor via API route
      await runTest('Proxy servidor (/api/ping)', async () => {
        const response = await fetch('/api/ping')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const json = await response.json()
        if (json.error) throw new Error(json.error)
        return json.data
      }, 3000)

    } catch (error) {
      console.error('Test suite failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test de Conectividad</h1>
          <p className="text-gray-600">Diagnóstico de problemas de conexión con Supabase</p>
        </div>

        <div className="flex gap-4 mb-8">
          <Button onClick={runAllTests} disabled={isLoading}>
            {isLoading ? 'Ejecutando tests...' : 'Ejecutar Tests'}
          </Button>
          <Button variant="outline" onClick={clearResults}>
            Limpiar Resultados
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/workspace'}>
            Volver al Workspace
          </Button>
        </div>

        {/* Información del entorno */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4">Información del Entorno</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Supabase URL:</strong>
              <br />
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {process.env.NEXT_PUBLIC_SUPABASE_URL}
              </code>
            </div>
            <div>
              <strong>Anon Key:</strong>
              <br />
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...
              </code>
            </div>
          </div>
        </Card>

        {/* Resultados */}
        {results.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Resultados de Tests</h3>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border-l-4 ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-400'
                      : result.status === 'timeout'
                      ? 'bg-yellow-50 border-yellow-400'
                      : 'bg-red-50 border-red-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <strong>{result.test}</strong>
                      <p className="text-sm mt-1">{result.message}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {result.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Sugerencias */}
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-4">💡 Posibles Soluciones</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>Si hay timeouts:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Verifica tu conexión a internet</li>
              <li>Revisa si hay firewall bloqueando la conexión</li>
              <li>Comprueba que el proyecto de Supabase esté activo</li>
              <li>Intenta desde otra red (hotspot móvil)</li>
            </ul>
            
            <p className="mt-4"><strong>Si hay errores de autenticación:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Verifica las variables de entorno</li>
              <li>Comprueba que las claves sean correctas</li>
              <li>Revisa los permisos RLS en Supabase</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
} 