'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { 
  getUrgencyStyles, 
  getChannelIcon, 
  getPriorityStyles,
  type ActionPlan,
  type ActionStep 
} from '@/lib/hubspot/ai-action-plan'
import { 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface ActionPlanCardProps {
  plan: ActionPlan | null
  loading?: boolean
  onRegenerate?: () => void
  compact?: boolean
}

export function ActionPlanCard({ 
  plan, 
  loading = false, 
  onRegenerate,
  compact = false 
}: ActionPlanCardProps) {
  const [expandedSteps, setExpandedSteps] = useState<number[]>([])
  const [copiedStep, setCopiedStep] = useState<number | null>(null)

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <Skeleton className="h-5 w-48" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!plan) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">
            No hay plan de acción disponible
          </p>
          {onRegenerate && (
            <Button variant="outline" size="sm" className="mt-3" onClick={onRegenerate}>
              <Sparkles className="h-4 w-4 mr-1" />
              Generar Plan
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const urgencyStyles = getUrgencyStyles(plan.urgency)

  const toggleStep = (order: number) => {
    setExpandedSteps(prev => 
      prev.includes(order) 
        ? prev.filter(o => o !== order)
        : [...prev, order]
    )
  }

  const copyTemplate = async (step: ActionStep) => {
    if (!step.template) return
    await navigator.clipboard.writeText(step.template)
    setCopiedStep(step.order)
    toast.success('Mensaje copiado al portapapeles')
    setTimeout(() => setCopiedStep(null), 2000)
  }

  return (
    <Card className={`${urgencyStyles.border} border-l-4`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{urgencyStyles.icon}</span>
            <CardTitle className="text-base">Plan de Acción</CardTitle>
            <Badge 
              variant="outline" 
              className={`${urgencyStyles.bg} ${urgencyStyles.text} text-xs`}
            >
              {plan.urgency === 'urgent' ? 'Urgente' : plan.urgency === 'normal' ? 'Normal' : 'Bajo'}
            </Badge>
          </div>
          {onRegenerate && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRegenerate}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>{plan.summary}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Next Steps */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Próximos Pasos
          </h4>
          
          <div className="space-y-2">
            {plan.nextSteps.map((step) => {
              const priorityStyles = getPriorityStyles(step.priority)
              const isExpanded = expandedSteps.includes(step.order)
              const hasTemplate = !!step.template

              return (
                <Collapsible 
                  key={step.order} 
                  open={isExpanded}
                  onOpenChange={() => hasTemplate && toggleStep(step.order)}
                >
                  <div className="rounded-lg border bg-muted/30 overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <div className={`p-3 flex items-start gap-3 ${hasTemplate ? 'cursor-pointer hover:bg-muted/50' : ''}`}>
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                          {step.order}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span>{getChannelIcon(step.channel)}</span>
                            <span className="font-medium text-sm">{step.action}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{step.timing}</span>
                            <span>•</span>
                            <span className={priorityStyles.text}>
                              Prioridad {priorityStyles.label}
                            </span>
                          </div>
                        </div>
                        {hasTemplate && (
                          <div className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                    </CollapsibleTrigger>

                    {hasTemplate && (
                      <CollapsibleContent>
                        <div className="px-3 pb-3 pt-1 border-t">
                          <div className="relative">
                            <div className="bg-background rounded-md p-3 text-sm text-muted-foreground border">
                              {step.template}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                copyTemplate(step)
                              }}
                            >
                              {copiedStep === step.order ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    )}
                  </div>
                </Collapsible>
              )
            })}
          </div>
        </div>

        {!compact && (
          <>
            {/* Suggested Approach */}
            {plan.suggestedApproach && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Estrategia Sugerida
                </h4>
                <p className="text-sm text-muted-foreground pl-5">
                  {plan.suggestedApproach}
                </p>
              </div>
            )}

            {/* Risk Assessment */}
            {plan.riskAssessment && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Análisis de Riesgo
                </h4>
                <p className="text-sm text-muted-foreground pl-5">
                  {plan.riskAssessment}
                </p>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="text-xs text-muted-foreground text-right pt-2 border-t">
          Generado: {new Date(plan.generatedAt).toLocaleString('es-AR', { 
            dateStyle: 'short', 
            timeStyle: 'short' 
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for inline display
export function ActionPlanBadge({ plan }: { plan: ActionPlan | null }) {
  if (!plan) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        Sin plan
      </Badge>
    )
  }

  const urgencyStyles = getUrgencyStyles(plan.urgency)

  return (
    <Badge 
      variant="outline" 
      className={`${urgencyStyles.bg} ${urgencyStyles.text} ${urgencyStyles.border} gap-1`}
    >
      <span>{urgencyStyles.icon}</span>
      <span>{plan.nextSteps.length} acciones</span>
    </Badge>
  )
}
