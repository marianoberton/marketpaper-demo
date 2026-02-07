'use client'

import { DragEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Building2,
    Calendar,
    GripVertical,
    MoreHorizontal,
    Trophy,
    XCircle,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface Opportunity {
    id: string
    company_id: string
    title: string
    description: string | null
    client_id: string | null
    assigned_to: string | null
    quote_id: string | null
    stage: 'calificacion' | 'propuesta' | 'negociacion' | 'cierre'
    outcome: 'won' | 'lost' | null
    probability: number
    estimated_value: number
    weighted_value: number
    currency: string
    expected_close_date: string | null
    closed_at: string | null
    loss_reason: string | null
    position_order: number
    created_at: string
    updated_at: string
    client: { id: string; name: string } | null
    assignee: { id: string; full_name: string; avatar_url: string | null } | null
}

interface OpportunityCardProps {
    opportunity: Opportunity
    isDragged: boolean
    onDragStart: (e: DragEvent<HTMLDivElement>, opp: Opportunity) => void
    onDragEnd: (e: DragEvent<HTMLDivElement>) => void
    onEdit: (opp: Opportunity) => void
    onDelete: (opp: Opportunity) => void
    onDuplicate: (opp: Opportunity) => void
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value)
}

const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
}

const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: 'short',
    }).format(new Date(date))
}

export default function OpportunityCard({
    opportunity,
    isDragged,
    onDragStart,
    onDragEnd,
    onEdit,
    onDelete,
    onDuplicate,
}: OpportunityCardProps) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, opportunity)}
            onDragEnd={onDragEnd}
            className={`bg-card rounded-lg border border-border p-4 cursor-pointer shadow-sm hover:shadow-md hover:border-primary transition-all duration-200 ${isDragged ? 'opacity-50 rotate-2' : ''}`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab shrink-0" />
                    <h4 className="font-medium text-foreground text-sm truncate">{opportunity.title}</h4>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(opportunity)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(opportunity)}>Duplicar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(opportunity)}>Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {opportunity.client && (
                <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">{opportunity.client.name}</span>
                </div>
            )}

            {opportunity.assignee && (
                <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-5 w-5">
                        <AvatarImage src={opportunity.assignee.avatar_url || undefined} />
                        <AvatarFallback className="text-[9px] bg-muted">
                            {getInitials(opportunity.assignee.full_name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate">{opportunity.assignee.full_name}</span>
                </div>
            )}

            {opportunity.expected_close_date && (
                <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{formatDate(opportunity.expected_close_date)}</span>
                </div>
            )}

            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                    {formatCurrency(Number(opportunity.estimated_value))}
                </span>
                <div className="flex items-center gap-1.5">
                    {opportunity.stage === 'cierre' && opportunity.outcome && (
                        <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 ${opportunity.outcome === 'won'
                                ? 'border-state-success text-state-success bg-state-success-muted'
                                : 'border-state-error text-state-error bg-state-error-muted'
                                }`}
                        >
                            {opportunity.outcome === 'won' ? (
                                <><Trophy className="h-3 w-3 mr-0.5" /> Ganada</>
                            ) : (
                                <><XCircle className="h-3 w-3 mr-0.5" /> Perdida</>
                            )}
                        </Badge>
                    )}
                    {opportunity.stage !== 'cierre' && (
                        <Badge
                            variant="outline"
                            className={`text-xs ${opportunity.probability >= 75 ? 'border-state-success text-state-success' :
                                opportunity.probability >= 50 ? 'border-state-warning text-state-warning' :
                                    'border-state-neutral text-state-neutral'
                                }`}
                        >
                            {opportunity.probability}%
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    )
}
