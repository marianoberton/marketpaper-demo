'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'expired':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'critical':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default:
      return 'bg-green-100 text-green-800 border-green-200'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'expired':
      return <AlertTriangle className="h-4 w-4" />
    case 'critical':
      return <AlertTriangle className="h-4 w-4" />
    case 'warning':
      return <Clock className="h-4 w-4" />
    default:
      return <CheckCircle className="h-4 w-4" />
  }
}

const getStatusText = (status: string, daysRemaining: number) => {
  if (status === 'expired') {
    return `Vencido hace ${Math.abs(daysRemaining)} días`
  } else if (daysRemaining === 0) {
    return 'Vence hoy'
  } else if (daysRemaining === 1) {
    return 'Vence mañana'
  } else {
    return `${daysRemaining} días restantes`
  }
}

export default function DocumentExpirationSection({ projectId }: DocumentExpirationSectionProps) {
  const [expirations, setExpirations] = useState<ExpirationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExpirations = async () => {
      try {
        const supabase = createClient()
        
        // Obtener fechas de vencimiento del proyecto
        const { data, error } = await supabase
          .from('project_expiration_summary')
          .select('*')
          .eq('project_id', projectId)
          .order('days_remaining', { ascending: true })

        if (error) {
          console.error('Error fetching expirations:', error)
          setError('Error al cargar las fechas de vencimiento')
          return
        }

        setExpirations(data || [])
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
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
        <span className="ml-2 text-slate-600">Cargando vigencias...</span>
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
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No hay fechas de vencimiento registradas</h3>
        <p className="text-slate-600">Las fechas de vencimiento de los documentos aparecerán aquí cuando estén disponibles.</p>
      </div>
    )
  }

  // Separar por estado para mejor organización
  const expiredDocs = expirations.filter(exp => exp.status === 'expired')
  const criticalDocs = expirations.filter(exp => exp.status === 'critical')
  const warningDocs = expirations.filter(exp => exp.status === 'warning')
  const normalDocs = expirations.filter(exp => exp.status === 'normal')

  return (
    <div className="space-y-6">
      {/* Resumen de estado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{expiredDocs.length}</div>
          <div className="text-sm text-red-600">Vencidos</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">{criticalDocs.length}</div>
          <div className="text-sm text-orange-600">Críticos</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{warningDocs.length}</div>
          <div className="text-sm text-yellow-600">Advertencia</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{normalDocs.length}</div>
          <div className="text-sm text-green-600">Vigentes</div>
        </div>
      </div>

      {/* Lista de documentos */}
      <div className="space-y-3">
        {expirations.map((expiration) => (
          <div
            key={expiration.id}
            className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${getStatusColor(expiration.status)}`}>
                {getStatusIcon(expiration.status)}
              </div>
              <div>
                <h4 className="font-medium text-slate-900">{expiration.section_name}</h4>
                <p className="text-sm text-slate-600">
                  Vence: {new Date(expiration.expiration_date).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge 
                variant="outline" 
                className={`${getStatusColor(expiration.status)} border`}
              >
                {getStatusText(expiration.status, expiration.days_remaining)}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Alertas importantes */}
      {(expiredDocs.length > 0 || criticalDocs.length > 0) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            <strong>Atención:</strong> Hay documentos vencidos o próximos a vencer que requieren renovación inmediata.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}