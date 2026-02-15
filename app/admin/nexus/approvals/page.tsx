'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Clock,
} from 'lucide-react'
import { nexusApi } from '@/lib/nexus/api'
import type { NexusApproval } from '@/lib/nexus/types'
import { toast } from 'sonner'

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<NexusApproval[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    nexusApi
      .listApprovals('pending')
      .then((res) => setApprovals(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleApprove(id: string) {
    try {
      await nexusApi.approveAction(id)
      setApprovals((prev) => prev.filter((a) => a.id !== id))
      toast.success('Aprobado')
    } catch {
      toast.error('Error al aprobar')
    }
  }

  async function handleDeny(id: string) {
    try {
      await nexusApi.denyAction(id)
      setApprovals((prev) => prev.filter((a) => a.id !== id))
      toast.success('Rechazado')
    } catch {
      toast.error('Error al rechazar')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/nexus">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aprobaciones</h1>
          <p className="text-muted-foreground">
            Herramientas de alto riesgo que requieren autorización humana
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : approvals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No hay aprobaciones pendientes</p>
          <p className="text-sm">Todo está al día</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <Card key={approval.id} className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-yellow-500" />
                    <div>
                      <CardTitle className="text-base font-mono">
                        {approval.toolId}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(approval.createdAt).toLocaleString('es-AR')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {approval.projectId.slice(0, 8)}...
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(approval.id)}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeny(approval.id)}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded bg-muted p-3 text-xs font-mono">
                  {JSON.stringify(approval.action, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
