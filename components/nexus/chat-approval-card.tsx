'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react'

interface ChatApprovalCardProps {
  approvalId: string
  tool: string
  action: unknown
  onApprove: (id: string) => void
  onDeny: (id: string) => void
}

export function ChatApprovalCard({
  approvalId,
  tool,
  action,
  onApprove,
  onDeny,
}: ChatApprovalCardProps) {
  return (
    <div className="rounded-lg border-2 border-yellow-500/50 bg-yellow-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-yellow-500" />
        <span className="font-medium">Approval Required</span>
        <Badge variant="secondary">{tool}</Badge>
      </div>

      <pre className="overflow-x-auto rounded bg-muted p-2 text-xs font-mono">
        {JSON.stringify(action, null, 2)}
      </pre>

      <div className="flex gap-2">
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700"
          onClick={() => onApprove(approvalId)}
        >
          <CheckCircle2 className="mr-1 h-4 w-4" />
          Approve
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onDeny(approvalId)}>
          <XCircle className="mr-1 h-4 w-4" />
          Deny
        </Button>
      </div>
    </div>
  )
}
