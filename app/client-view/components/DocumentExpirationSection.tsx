'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  CheckCircle, 
  FileText,
  AlertTriangle
} from 'lucide-react'

interface ExpirationData {
  id: string
  section_name: string
  expiration_date: string
  days_remaining: number
  status: 'expired' | 'critical' | 'warning' | 'normal'
}

interface DocumentExpirationSectionProps {
  projectId: string
}

export default function DocumentExpirationSection({ projectId }: DocumentExpirationSectionProps) {
  const [expirations, setExpirations] = useState<ExpirationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExpirations = async () => {
      try {
        const supabase = createClient()
        
        // Obtener fechas de vencimiento del proyecto - solo documentos vigentes (días > 0)
        const { data, error } = await supabase
          .from('project_expiration_summary')
          .select('*')
          .eq('project_id', projectId)
          .gt('days_remaining', 0) // Solo documentos con días restantes > 0 (vigentes)
          .order('days_remaining', { ascending: true })

        if (error) {
          console.error('Error fetching expirations:', error)
          setError('Error al cargar las fechas de vencimiento')
          return
        }

        // Filtro adicional en el cliente para asegurar que solo se muestren días positivos
        const validExpirations = (data || []).filter(exp => exp.days_remaining > 0)
        
        console.log('Datos recibidos:', data)
        console.log('Datos filtrados:', validExpirations)
        
        setExpirations(validExpirations)
      } catch (err) {
        console.error('Error:', err)
        setError('Error al cargar las fechas de vencimiento')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchExpirations()
    }
  }, [projectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1B293F]"></div>
        <span className="ml-2 text-gray-600 text-sm">Cargando vigencias...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (expirations.length === 0) {
    return (
      <div className="text-center py-6">
        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 text-sm">No hay documentos vigentes registrados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="p-1.5 rounded-full bg-green-100">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-medium text-green-800 text-sm">Documentos en Regla</h3>
          <p className="text-xs text-green-600">Todos los documentos mostrados están vigentes</p>
        </div>
      </div>

      {/* Lista de documentos vigentes */}
      <div className="space-y-2">
        {expirations.map((expiration) => (
          <div
            key={expiration.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">{expiration.section_name}</h4>
                <p className="text-xs text-gray-600">
                  Vence: {new Date(expiration.expiration_date).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge 
                variant="outline" 
                className={`text-xs font-semibold px-3 py-1 ${
                  expiration.days_remaining <= 30 
                    ? 'bg-red-50 text-red-700 border-red-300' 
                    : expiration.days_remaining <= 90 
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-300' 
                    : 'bg-green-50 text-green-700 border-green-300'
                }`}
              >
                {expiration.days_remaining} días restantes
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}