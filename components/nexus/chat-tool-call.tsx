'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, Wrench } from 'lucide-react'

interface ChatToolCallProps {
  tool: string
  input: unknown
  output?: unknown
  status: 'running' | 'success' | 'error'
  durationMs?: number
}

export function ChatToolCall({ tool, input, output, status, durationMs }: ChatToolCallProps) {
  return (
    <div className="rounded-lg border bg-card p-3 text-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono font-medium">{tool}</span>
        </div>
        <div className="flex items-center gap-2">
          {durationMs !== undefined && (
            <span className="text-xs text-muted-foreground">{durationMs}ms</span>
          )}
          {status === 'running' && (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running
            </Badge>
          )}
          {status === 'success' && (
            <Badge variant="default" className="gap-1 bg-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Done
            </Badge>
          )}
          {status === 'error' && (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              Error
            </Badge>
          )}
        </div>
      </div>

      {input != null ? (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Input
          </summary>
          <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 font-mono">
            {JSON.stringify(input, null, 2)}
          </pre>
        </details>
      ) : null}

      {output != null ? (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Output
          </summary>
          <pre
            className={cn(
              'mt-1 overflow-x-auto rounded p-2 font-mono',
              status === 'error' ? 'bg-destructive/10' : 'bg-muted',
            )}
          >
            {JSON.stringify(output, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  )
}
