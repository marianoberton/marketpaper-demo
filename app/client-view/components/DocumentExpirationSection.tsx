'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  CheckCircle, 
  FileText,
  AlertTriangle
} from 'lucide-react'
import { 
  getProjectById, 
  calculateInhibitionReportDaysRemaining,
  calculateDomainReportDaysRemaining,
  calculateInsurancePolicyDaysRemaining,
  formatInhibitionReportStatus,
  formatDomainReportStatus,
  formatInsurancePolicyStatus,
  getProjectDocuments,
  type Project 
} from '@/lib/construction'
import { 
  DOCUMENT_EXPIRATION_CONFIG,
  calculateExpirationDate,
  calculateDaysUntilExpiration,
  type DocumentExpirationConfig
} from '@/lib/document-expiration-config'
import { createClient } from '@/utils/supabase/client'

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
        // Obtener datos del proyecto usando la misma función que el backoffice
        const project = await getProjectById(projectId)
        
        if (!project) {
          setError('Proyecto no encontrado')
          return
        }

        const validExpirations: ExpirationData[] = []

        // Calcular vigencia del Informe de Inhibición usando la misma lógica del backoffice
        if (project.inhibition_report_upload_date) {
          const daysRemaining = calculateInhibitionReportDaysRemaining(project.inhibition_report_upload_date)
          
          if (daysRemaining !== null && daysRemaining > 0) {
            const uploadDate = new Date(project.inhibition_report_upload_date)
            const expiryDate = new Date(uploadDate.getTime() + (90 * 24 * 60 * 60 * 1000))
            
            validExpirations.push({
              id: `inhibition-report-${project.id}`,
              section_name: 'Informe de Inhibición',
              expiration_date: expiryDate.toISOString(),
              days_remaining: daysRemaining,
              status: daysRemaining <= 15 ? 'critical' : daysRemaining <= 30 ? 'warning' : 'normal'
            })
          }
        }

        // Calcular vigencia del Informe de Dominio usando la misma lógica del backoffice
        if (project.domain_report_upload_date) {
          const daysRemaining = calculateDomainReportDaysRemaining(project.domain_report_upload_date)
          
          if (daysRemaining > 0) {
            const uploadDate = new Date(project.domain_report_upload_date)
            const expiryDate = new Date(uploadDate.getTime() + (90 * 24 * 60 * 60 * 1000))
            
            validExpirations.push({
              id: `domain-report-${project.id}`,
              section_name: 'Informe de Dominio',
              expiration_date: expiryDate.toISOString(),
              days_remaining: daysRemaining,
              status: daysRemaining <= 10 ? 'critical' : daysRemaining <= 30 ? 'warning' : 'normal'
            })
          }
        }

        // Calcular vigencia de la Póliza de Seguro usando la misma lógica del backoffice
        if (project.insurance_policy_expiry_date) {
          const daysRemaining = calculateInsurancePolicyDaysRemaining(project.insurance_policy_expiry_date)
          
          if (daysRemaining > 0) {
            validExpirations.push({
              id: `insurance-policy-${project.id}`,
              section_name: 'Póliza de Seguro',
              expiration_date: project.insurance_policy_expiry_date,
              days_remaining: daysRemaining,
              status: daysRemaining <= 30 ? 'critical' : daysRemaining <= 60 ? 'warning' : 'normal'
            })
          }
        }

        // Obtener documentos del proyecto desde project_documents
        const supabase = createClient()
        
        // Primero, obtener documentos marcados como completados para excluirlos
        // Consultar tanto project_expiration_dates como project_stage_completions
        const [expirationCompletedResult, stageCompletedResult] = await Promise.all([
          supabase
            .from('project_expiration_dates')
            .select('section_name')
            .eq('project_id', projectId)
            .not('completed_at', 'is', null),
          supabase
            .from('project_stage_completions')
            .select('stage_name')
            .eq('project_id', projectId)
            .eq('completed', true)
        ])

        const completedSectionNames = new Set()
        
        // Agregar secciones completadas desde project_expiration_dates
        if (expirationCompletedResult.data) {
          expirationCompletedResult.data.forEach(item => {
            completedSectionNames.add(item.section_name)
          })
        }
        
        // Agregar etapas completadas desde project_stage_completions
        if (stageCompletedResult.data) {
          stageCompletedResult.data.forEach(item => {
            completedSectionNames.add(item.stage_name)
          })
        }

        console.log('Secciones completadas (excluidas de vigencias):', Array.from(completedSectionNames))

        const { data: projectDocuments, error: docsError } = await supabase
          .from('project_documents')
          .select('*')
          .eq('project_id', projectId)
          .not('upload_date', 'is', null)

        if (docsError) {
          console.error('Error fetching project documents:', docsError)
        } else if (projectDocuments) {
          // Procesar cada documento que tenga fecha de carga
          for (const doc of projectDocuments) {
            if (!doc.upload_date || !doc.section_name) continue

            // Excluir secciones completadas
            if (completedSectionNames.has(doc.section_name)) {
              console.log(`Excluyendo sección completada: ${doc.section_name}`)
              continue
            }

            // Buscar configuración de vencimiento para esta sección
            const config = DOCUMENT_EXPIRATION_CONFIG.find(
              config => config.sectionName === doc.section_name
            )

            if (config) {
              try {
                // Calcular fecha de vencimiento usando la configuración
                const expirationDate = calculateExpirationDate(
                  doc.upload_date, 
                  doc.section_name, 
                  project.project_type || ''
                )
                
                // Calcular días restantes
                const expirationInfo = calculateDaysUntilExpiration(expirationDate)
                
                // Solo incluir si no está vencido y tiene días restantes positivos
                if (!expirationInfo.isExpired && expirationInfo.days > 0) {
                  let status: 'expired' | 'critical' | 'warning' | 'normal' = 'normal'
                  
                  if (expirationInfo.isExpired) {
                    status = 'expired'
                  } else if (expirationInfo.days <= 7) {
                    status = 'critical'
                  } else if (expirationInfo.isExpiringSoon) {
                    status = 'warning'
                  }

                  validExpirations.push({
                    id: `${doc.section_name.toLowerCase().replace(/\s+/g, '-')}-${project.id}`,
                    section_name: doc.section_name,
                    expiration_date: expirationDate,
                    days_remaining: expirationInfo.days,
                    status
                  })
                }
              } catch (error) {
                console.error(`Error calculating expiration for ${doc.section_name}:`, error)
              }
            }
          }
        }

        // Obtener fechas de carga desde project_upload_dates
        const { data: uploadDates, error: uploadError } = await supabase
          .from('project_upload_dates')
          .select('*')
          .eq('project_id', projectId)

        if (uploadError) {
          console.error('Error fetching upload dates:', uploadError)
        } else if (uploadDates) {
          // Procesar cada fecha de carga
          for (const uploadDate of uploadDates) {
            if (!uploadDate.upload_date || !uploadDate.section_name) continue

            // Evitar duplicados (ya procesados desde project_documents)
            const alreadyExists = validExpirations.some(
              exp => exp.section_name === uploadDate.section_name
            )
            if (alreadyExists) continue

            // Excluir secciones completadas
            if (completedSectionNames.has(uploadDate.section_name)) {
              console.log(`Excluyendo sección completada: ${uploadDate.section_name}`)
              continue
            }

            // Buscar configuración de vencimiento para esta sección
            const config = DOCUMENT_EXPIRATION_CONFIG.find(
              config => config.sectionName === uploadDate.section_name
            )

            if (config) {
              try {
                // Calcular fecha de vencimiento usando la configuración
                const expirationDate = calculateExpirationDate(
                  uploadDate.upload_date, 
                  uploadDate.section_name, 
                  project.project_type || ''
                )
                
                // Calcular días restantes
                const expirationInfo = calculateDaysUntilExpiration(expirationDate)
                
                // Solo incluir si no está vencido y tiene días restantes positivos
                if (!expirationInfo.isExpired && expirationInfo.days > 0) {
                  let status: 'expired' | 'critical' | 'warning' | 'normal' = 'normal'
                  
                  if (expirationInfo.isExpired) {
                    status = 'expired'
                  } else if (expirationInfo.days <= 7) {
                    status = 'critical'
                  } else if (expirationInfo.isExpiringSoon) {
                    status = 'warning'
                  }

                  validExpirations.push({
                    id: `${uploadDate.section_name.toLowerCase().replace(/\s+/g, '-')}-${project.id}`,
                    section_name: uploadDate.section_name,
                    expiration_date: expirationDate,
                    days_remaining: expirationInfo.days,
                    status
                  })
                }
              } catch (error) {
                console.error(`Error calculating expiration for ${uploadDate.section_name}:`, error)
              }
            }
          }
        }

        // Ordenar por días restantes (menor a mayor)
        validExpirations.sort((a, b) => a.days_remaining - b.days_remaining)
        
        console.log('Vigencias calculadas:', validExpirations)
        
        setExpirations(validExpirations)
      } catch (err) {
        console.error('Error:', err)
        setError('Error al cargar las fechas de vencimiento')
      } finally {
        setLoading(false)
      }
    }

    fetchExpirations()
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
                  {expiration.section_name === 'Demolición' 
                    ? 'Plazo para finalizar demolición'
                    : expiration.section_name === 'Permiso de Demolición - Informe'
                    ? 'Plazo para cargar documento "Demolición"'
                    : `Vence: ${new Date(expiration.expiration_date).toLocaleDateString('es-AR')}`
                  }
                </p>
                {(expiration.section_name === 'Demolición' || expiration.section_name === 'Permiso de Demolición - Informe') && (
                  <p className="text-xs text-gray-500">
                    Vence: {new Date(expiration.expiration_date).toLocaleDateString('es-AR')}
                  </p>
                )}
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