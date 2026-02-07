'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/components/workspace-context'

interface Tema {
  id: string
  title: string
  status: string
  priority: string
  reference_code: string | null
  due_date: string | null
  created_at: string
}

interface ClientTemasSectionProps {
  temas: Tema[]
  clientName: string
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  nuevo_expediente: { label: 'Nuevo', variant: 'secondary' },
  en_proceso: { label: 'En proceso', variant: 'default' },
  seguimiento: { label: 'Seguimiento', variant: 'default' },
  observado: { label: 'Observado', variant: 'outline' },
  subsanacion: { label: 'Subsanación', variant: 'outline' },
  aprobado: { label: 'Aprobado', variant: 'secondary' },
  completado: { label: 'Completado', variant: 'secondary' },
  finalizado: { label: 'Finalizado', variant: 'secondary' },
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  alta: { label: 'Alta', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  media: { label: 'Media', className: 'bg-primary/10 text-primary border-primary/20' },
  baja: { label: 'Baja', className: 'bg-muted text-muted-foreground' },
}

export function ClientTemasSection({ temas, clientName }: ClientTemasSectionProps) {
  const router = useRouter()
  const { companyId } = useWorkspace()

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Temas asociados</h2>
        <span className="text-sm text-muted-foreground">
          {temas.length} tema{temas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {temas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No hay temas asociados a {clientName}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {temas.map((tema) => {
            const statusCfg = STATUS_CONFIG[tema.status] || { label: tema.status, variant: 'secondary' as const }
            const priorityCfg = PRIORITY_CONFIG[tema.priority]

            return (
              <Card
                key={tema.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => router.push(`/workspace/temas?company_id=${companyId}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{tema.title}</span>
                        {tema.reference_code && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {tema.reference_code}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusCfg.variant} className="text-xs">
                          {statusCfg.label}
                        </Badge>
                        {priorityCfg && (
                          <Badge variant="outline" className={`text-xs ${priorityCfg.className}`}>
                            {priorityCfg.label}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-shrink-0 ml-4">
                      {tema.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(tema.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
