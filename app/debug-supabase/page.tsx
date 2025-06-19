'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'

export default function DebugSupabasePage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(testName)
    try {
      console.log(`Running test: ${testName}`)
      const result = await testFn()
      console.log(`Test ${testName} completed:`, result)
      setResults((prev: any) => ({
        ...prev,
        [testName]: { success: true, data: result }
      }))
    } catch (error: any) {
      console.error(`Test ${testName} failed:`, error)
      setResults((prev: any) => ({
        ...prev,
        [testName]: { success: false, error: error.message || 'Unknown error' }
      }))
    } finally {
      setLoading(null)
    }
  }

  const testConnection = async () => {
    console.log('Testing Supabase connection...')
    
    // Test básico más simple
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('Connection test error:', error)
      throw new Error(`Connection failed: ${error.message}`)
    }
    
    console.log('Connection test successful:', data)
    return `✅ Connection successful! Found ${data?.length || 0} companies`
  }

  const testSimpleQuery = async () => {
    console.log('Testing simple query...')
    
    try {
      // Test más básico: verificar que las variables de entorno están correctas
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!url || !key) {
        throw new Error('Environment variables missing')
      }
      
      console.log('Environment check OK')
      
      // Test de conexión básica con timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      )
      
      const testPromise = supabase.auth.getSession()
      
      console.log('Attempting connection...')
      const result = await Promise.race([testPromise, timeoutPromise])
      
      console.log('Connection result:', result)
      return `✅ Basic connection successful - environment vars OK and Supabase responding`
       
    } catch (err: any) {
      console.error('Simple test failed:', err)
      
      // Dar más información sobre el error
      if (err.message.includes('timeout')) {
        return `❌ Connection timeout - check your SUPABASE_URL and network connection`
      }
      
      if (err.message.includes('Environment')) {
        return `❌ Environment variables missing - check your .env.local file`
      }
      
      throw new Error(`Basic test failed: ${err.message}`)
    }
  }

  const checkTables = async () => {
    console.log('Checking tables...')
    
    const tables = [
      'companies',
      'user_profiles', 
      'super_admins',
    ]

    const results: any = {}
    
    for (const table of tables) {
      try {
        console.log(`Checking table: ${table}`)
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1)
        
        if (error) {
          results[table] = `❌ ${error.message}`
          console.error(`Table ${table} error:`, error)
        } else {
          results[table] = '✅ Exists'
          console.log(`Table ${table} OK`)
        }
      } catch (err: any) {
        results[table] = `❌ ${err.message}`
        console.error(`Table ${table} exception:`, err)
      }
    }

    return results
  }

  const checkSuperAdmins = async () => {
    console.log('Checking super admins...')
    const { data, error } = await supabase
      .from('super_admins')
      .select('id, email, status')
    
    if (error) {
      console.error('Super admins error:', error)
      throw error
    }
    console.log('Super admins found:', data)
    return data || []
  }

  const checkUserProfile = async () => {
    if (!session) throw new Error('No session found - please log in first')
    
    console.log('Checking user profile for:', session.user.email)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*, companies(*)')
      .eq('id', session.user.id)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('User profile error:', error)
      throw error
    }
    console.log('User profile:', data)
    return data || 'No profile found - this is normal for new users'
  }

  const checkCompanies = async () => {
    console.log('Checking companies...')
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, status')
      .limit(5)
    
    if (error) {
      console.error('Companies error:', error)
      throw error
    }
    console.log('Companies found:', data)
    return data || []
  }

  const createSuperAdmin = async () => {
    if (!session) throw new Error('No session found - please log in first')

    console.log('Creating super admin for:', session.user.email)
    const response = await fetch('/api/create-super-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: session.user.id,
        email: session.user.email,
      }),
    })

    const responseData = await response.json()
    console.log('Super admin creation response:', responseData)

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to create super admin')
    }

    return responseData
  }

  const resetData = async () => {
    if (!confirm('¿Estás seguro? Esto eliminará TODOS los datos de prueba.')) {
      return 'Cancelled by user'
    }

    console.log('Resetting test data...')
    const tables = ['activities', 'pipeline', 'contacts', 'leads', 'campaigns']
    const results = []

    for (const table of tables) {
      try {
        console.log(`Clearing table: ${table}`)
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', 'never-match') // Delete all

        results.push(`${table}: ${error ? `❌ ${error.message}` : '✅ Cleared'}`)
      } catch (err: any) {
        results.push(`${table}: ❌ Error - ${err.message}`)
      }
    }

    console.log('Reset results:', results)
    return results
  }

  const testEnvironment = async () => {
    console.log('Testing environment variables...')
    
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    const results = {
      url: url ? `✅ Set: ${url.substring(0, 30)}...` : '❌ Missing',
      key: key ? `✅ Set: ${key.length} characters` : '❌ Missing',
      urlFormat: url && url.includes('supabase.co') ? '✅ Valid format' : '❌ Invalid format',
      keyFormat: key && key.startsWith('eyJ') ? '✅ Valid JWT format' : '❌ Invalid JWT format'
    }
    
    console.log('Environment test results:', results)
    
    if (!url || !key) {
      throw new Error('Missing required environment variables')
    }
    
    if (!url.includes('supabase.co')) {
      throw new Error('SUPABASE_URL format seems incorrect')
    }
    
    if (!key.startsWith('eyJ')) {
      throw new Error('SUPABASE_ANON_KEY format seems incorrect (should be JWT)')
    }
    
    return results
  }

  const testDirectConnection = async () => {
    console.log('Testing direct Supabase connection...')
    
    try {
      // Test 1: Verificar que podemos crear el cliente
      console.log('Step 1: Creating Supabase client...')
      const testClient = supabase
      console.log('Client created successfully')
      
      // Test 2: Intentar operación simple sin timeout
      console.log('Step 2: Attempting simple query...')
      const startTime = Date.now()
      
      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
      
      const endTime = Date.now()
      console.log(`Query completed in ${endTime - startTime}ms`)
      
      if (error) {
        console.error('Query error:', error)
        return `❌ Query failed: ${error.message}`
      }
      
      console.log('Query successful:', data)
      return `✅ Direct connection successful! Query took ${endTime - startTime}ms`
      
    } catch (err: any) {
      console.error('Direct connection test failed:', err)
      return `❌ Direct connection failed: ${err.message}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">🔧 Debug Supabase Multi-Tenant</h1>
          
          <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
            <strong>Session Status:</strong> {session ? `✅ Logged in as ${session.user.email}` : '❌ No session'}
          </div>

          {loading && (
            <div className="mb-4 p-4 bg-yellow-50 rounded border border-yellow-200">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                <span>Running test: <strong>{loading}</strong></span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => runTest('simpleQuery', testSimpleQuery)}
              disabled={!!loading}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-medium">🔗 Test Simple Query</div>
                <div className="text-sm opacity-75">Basic Supabase connection</div>
              </div>
            </Button>

            <Button
              onClick={() => runTest('connection', testConnection)}
              disabled={!!loading}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-medium">📊 Test Companies Table</div>
                <div className="text-sm opacity-75">Check companies table access</div>
              </div>
            </Button>

            <Button
              onClick={() => runTest('tables', checkTables)}
              disabled={!!loading}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-medium">📋 Check Tables</div>
                <div className="text-sm opacity-75">Verify all tables exist</div>
              </div>
            </Button>

            <Button
              onClick={() => runTest('superAdmins', checkSuperAdmins)}
              disabled={!!loading}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-medium">👑 Check Super Admins</div>
                <div className="text-sm opacity-75">List all super admins</div>
              </div>
            </Button>

            <Button
              onClick={() => runTest('userProfile', checkUserProfile)}
              disabled={!!loading}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-medium">👤 Check User Profile</div>
                <div className="text-sm opacity-75">Your current profile</div>
              </div>
            </Button>

            <Button
              onClick={() => runTest('companies', checkCompanies)}
              disabled={!!loading}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-medium">🏢 Check Companies</div>
                <div className="text-sm opacity-75">List all companies</div>
              </div>
            </Button>

            <Button
              onClick={() => runTest('createSuperAdmin', createSuperAdmin)}
              disabled={!!loading}
              variant="outline"
              className="h-auto p-4 text-left border-green-300 text-green-700 hover:bg-green-50"
            >
              <div>
                <div className="font-medium">⭐ Make Me Super Admin</div>
                <div className="text-sm opacity-75">Create super admin role</div>
              </div>
            </Button>

            <Button
              onClick={() => runTest('environment', testEnvironment)}
              disabled={!!loading}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-medium">🌐 Test Environment Variables</div>
                <div className="text-sm opacity-75">Verify environment variables</div>
              </div>
            </Button>

            <Button
              onClick={() => runTest('directConnection', testDirectConnection)}
              disabled={!!loading}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-medium">🔗 Test Direct Connection</div>
                <div className="text-sm opacity-75">Test direct Supabase connection</div>
              </div>
            </Button>
          </div>
        </Card>

        {Object.keys(results).length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">📊 Results</h2>
            <div className="space-y-4">
              {Object.entries(results).map(([key, result]: [string, any]) => (
                <div key={key} className="border rounded p-4">
                  <h3 className="font-medium mb-2">
                    {result.success ? '✅' : '❌'} {key}
                  </h3>
                  {result.success ? (
                    <pre className="bg-green-50 p-2 rounded text-sm overflow-auto max-h-48">
                      {typeof result.data === 'object' 
                        ? JSON.stringify(result.data, null, 2)
                        : result.data
                      }
                    </pre>
                  ) : (
                    <pre className="bg-red-50 p-2 rounded text-sm text-red-700 max-h-48 overflow-auto">
                      {result.error}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">📝 Setup Instructions</h2>
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <strong>Step 1:</strong> Configurar Variables de Entorno
              <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded">
{`# En .env.local
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key`}
              </pre>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <strong>Step 2:</strong> Ejecutar Script SQL
              <p className="mt-1">En Supabase SQL Editor, ejecuta el archivo completo <code>supabase-super-admin-setup.sql</code></p>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <strong>Step 3:</strong> Verificar Setup
              <p className="mt-1">Usa el botón "Test Simple Query" primero, luego los demás tests.</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">🎯 Variables de Entorno</h2>
          <div className="text-sm space-y-2">
            <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
            <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
            <p><strong>SUPABASE_SERVICE_ROLE_KEY:</strong> Solo disponible en servidor</p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">🐛 Debug Console</h2>
          <div className="text-sm text-gray-600">
            <p>Abre las herramientas de desarrollador (F12) y mira la consola para ver logs detallados de cada test.</p>
            <p>Si un botón se queda "colgado", revisa la consola para ver el error exacto.</p>
          </div>
        </Card>
      </div>
    </div>
  )
} 