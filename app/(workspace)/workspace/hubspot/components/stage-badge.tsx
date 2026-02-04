'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STAGE_STYLES: Record<string, string> = {
  'contacto inicial': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'envío de presupuesto': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'envio de presupuesto': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'seguimiento/negociación - 14': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'seguimiento/negociacion - 14': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'seguimiento/negociación -14': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'seguimiento/negociacion -14': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'seguimiento/negociación +14': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'seguimiento/negociacion +14': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'seguimiento/negociación + 14': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'seguimiento/negociacion + 14': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'confirmado/orden recibida': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'cierre ganado': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'cierre perdido': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

interface StageBadgeProps {
  label: string
  className?: string
}

export function StageBadge({ label, className }: StageBadgeProps) {
  const normalized = label.toLowerCase().trim()
  const style = STAGE_STYLES[normalized] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'

  return (
    <Badge
      variant="secondary"
      className={cn('font-normal border-0 whitespace-nowrap', style, className)}
    >
      {label}
    </Badge>
  )
}
