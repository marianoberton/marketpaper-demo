'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STAGE_STYLES: Record<string, string> = {
  'contacto inicial': 'bg-state-info-muted text-state-info',
  'envío de presupuesto': 'bg-state-in-progress-muted text-state-in-progress',
  'envio de presupuesto': 'bg-state-in-progress-muted text-state-in-progress',
  'seguimiento/negociación - 14': 'bg-state-warning-muted text-state-warning',
  'seguimiento/negociacion - 14': 'bg-state-warning-muted text-state-warning',
  'seguimiento/negociación -14': 'bg-state-warning-muted text-state-warning',
  'seguimiento/negociacion -14': 'bg-state-warning-muted text-state-warning',
  'seguimiento/negociación +14': 'bg-accent-foreground/20 text-accent-foreground',
  'seguimiento/negociacion +14': 'bg-accent-foreground/20 text-accent-foreground',
  'seguimiento/negociación + 14': 'bg-accent-foreground/20 text-accent-foreground',
  'seguimiento/negociacion + 14': 'bg-accent-foreground/20 text-accent-foreground',
  'confirmado/orden recibida': 'bg-state-success-muted text-state-success',
  'cierre ganado': 'bg-state-success-muted text-state-success',
  'cierre perdido': 'bg-state-error-muted text-state-error',
}

interface StageBadgeProps {
  label: string
  className?: string
}

export function StageBadge({ label, className }: StageBadgeProps) {
  const normalized = label.toLowerCase().trim()
  const style = STAGE_STYLES[normalized] || 'bg-state-neutral-muted text-state-neutral'

  return (
    <Badge
      variant="secondary"
      className={cn('font-normal border-0 whitespace-nowrap', style, className)}
    >
      {label}
    </Badge>
  )
}
