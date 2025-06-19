'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

// Helper para añadir timeout a las promesas
const withTimeout = <T,>(
  promise: Promise<T>,
  ms: number,
  timeoutError = new Error('Timeout')
): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(timeoutError)
    }, ms)
  })
  return Promise.race([promise, timeout])
}

export default function SetupDbPage() {
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (
    step: string,
    status: 'success' | 'error' | 'info' | 'timeout',
    message: string
  ) => {
    setResults(prev => [
      ...prev,
      { step, status, message, timestamp: new Date() },
    ])
  }

  const setupBasicTables = async () => {
    setIsLoading(true)
    setResults([])

    try {
      addResult(
        'Inicio',
        'info',
        '🚀 Iniciando verificación de base de datos (timeout de 5s)...'
      )

      // Verificar si las tablas existen con timeout
      const checkTable = async (tableName: string) => {
        try {
          const promise = new Promise((resolve, reject) => {
            supabase.from(tableName).select('id').limit(1).then(result => {
              if (result.error) reject(result.error);
              else resolve(result);
            });
          });
          await withTimeout(promise, 5000);
          addResult(`Tabla ${tableName}`, 'success', '✅ Existe y es accesible');
          return true;
        } catch (error: any) {
          if (error.message === 'Timeout') {
            addResult(
              `Tabla ${tableName}`,
              'timeout',
              '⏰ Timeout. La conexión a Supabase falló.'
            )
          } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
            addResult(`Tabla ${tableName}`, 'info', `ℹ️ No existe (esto es normal si no has ejecutado el SQL)`)
          } else {
            addResult(
              `Tabla ${tableName}`,
              'error',
              `❌ Error: ${error.message}`
            )
          }
          return false
        }
      }

      // Verificar tablas principales
      const companiesExists = await checkTable('companies')
      await checkTable('user_profiles')
      await checkTable('leads')

      // Resumen final
      if (companiesExists) {
        addResult(
          'Estado Final',
          'success',
          '🎉 ¡La tabla principal "companies" existe! El resto pueden crearse.'
        )
        addResult(
          'Instrucciones',
          'info',
          '📋 Ve a tu dashboard de Supabase > SQL Editor y ejecuta el archivo supabase-multitenant-setup.sql para crear el resto de tablas.'
        )
      } else {
        addResult(
          'Estado Final',
          'error',
          '⚠️ La tabla "companies" no existe o la conexión falló. Es el primer paso.'
        )
      }
    } catch (error: any) {
      addResult('Error', 'error', `💥 Error general: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    setIsLoading(true)
    setResults([])

    try {
      addResult('Test', 'info', '🔍 Probando conexión (timeout de 5s)...')

      const testTable = async (tableName: string) => {
        try {
          const promise = new Promise((resolve, reject) => {
            supabase.from(tableName).select('id').limit(1).then(result => {
              if (result.error) reject(result.error);
              else resolve(result);
            });
          });
          await withTimeout(promise, 5000);
          addResult(tableName, 'success', `✅ Tabla ${tableName} accesible`);
        } catch(error: any) {
          if (error.message === 'Timeout') {
            addResult(tableName, 'timeout', `⏰ Timeout al consultar ${tableName}`);
          } else {
            addResult(tableName, 'error', `❌ Error en ${tableName}: ${error.message}`);
          }
        }
      }

      await testTable('companies');
      await testTable('leads');

    } catch (error: any) {
      addResult('Error', 'error', `💥 ${error.message}`)
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Setup Base de Datos
          </h1>
          <p className="text-gray-600">
            Diagnóstico y configuración de la base de datos de FOMO CRM
          </p>
        </div>

        <div className="flex gap-4 mb-8">
          <Button onClick={setupBasicTables} disabled={isLoading}>
            {isLoading ? 'Verificando...' : '🔍 Verificar Estado DB'}
          </Button>
          <Button
            variant="outline"
            onClick={testConnection}
            disabled={isLoading}
          >
            ⚡ Test Rápido
          </Button>
          <Button variant="outline" onClick={clearResults}>
            Limpiar
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/workspace')}
          >
            Ir al Workspace
          </Button>
        </div>
        
        {/* Resultados */}
        {results.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Resultados del Diagnóstico</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border-l-4 ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-400'
                      : result.status === 'error'
                      ? 'bg-red-50 border-red-400'
                      : result.status === 'timeout'
                      ? 'bg-yellow-50 border-yellow-400'
                      : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <strong>{result.step}</strong>
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

        {/* Guía de solución */}
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-4">
            📋 Plan de Acción
          </h3>
          <div className="text-sm text-blue-700 space-y-3">
            <div>
              <strong className="text-blue-900">Paso 1: Diagnosticar</strong>
              <p>
                Usa el botón "Verificar Estado DB". Si ves errores de "Timeout",
                hay un problema de conexión entre tu PC y Supabase (puede ser
                firewall, VPN, o un problema de red).
              </p>
            </div>
            <div>
              <strong className="text-blue-900">Paso 2: Crear Tablas Manualmente</strong>
              <p>
                Si la conexión funciona pero las tablas no existen, debes crearlas.
              </p>
              <div className="bg-blue-100 p-3 rounded mt-2">
                <p className="font-mono text-xs">
                  1. Ve a <strong>supabase.com</strong> → Tu proyecto
                  <br />
                  2. Abre <strong>SQL Editor</strong> → New query
                  <br />
                  3. Copia el contenido de{' '}
                  <code>supabase-multitenant-setup.sql</code>
                  <br />
                  4. Haz clic en <strong>RUN</strong> (ignora errores de "ya existe")
                </p>
              </div>
            </div>
             <div>
              <strong className="text-blue-900">Paso 3: Verifica de Nuevo</strong>
              <p>
                Después de ejecutar el SQL, vuelve aquí y haz clic en "Verificar Estado DB" de nuevo. Todo debería aparecer en verde.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 