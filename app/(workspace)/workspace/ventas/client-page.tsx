'use client'

import { useState, useCallback, DragEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    TrendingUp,
    Plus,
    DollarSign,
    Building2,
    Calendar,
    MoreHorizontal,
    UserPlus,
    FileText,
    Trophy,
    XCircle,
    GripVertical
} from 'lucide-react'

// Types
interface Deal {
    id: string
    title: string
    company: string
    value: number
    contact: string
    contactAvatar?: string
    createdAt: string
    stage: 'prospecto' | 'presupuesto_enviado' | 'ganado' | 'perdido'
    probability: number
}

interface Column {
    id: 'prospecto' | 'presupuesto_enviado' | 'ganado' | 'perdido'
    title: string
    color: string
    bgColor: string
    icon: any
}

// Pipeline stages configuration
const COLUMNS: Column[] = [
    {
        id: 'prospecto',
        title: 'Prospecto de Cliente',
        color: 'text-state-info',
        bgColor: 'bg-state-info-muted border-state-info',
        icon: UserPlus
    },
    {
        id: 'presupuesto_enviado',
        title: 'Presupuesto Enviado',
        color: 'text-state-warning',
        bgColor: 'bg-state-warning-muted border-state-warning',
        icon: FileText
    },
    {
        id: 'ganado',
        title: 'Ganado',
        color: 'text-state-success',
        bgColor: 'bg-state-success-muted border-state-success',
        icon: Trophy
    },
    {
        id: 'perdido',
        title: 'Perdido',
        color: 'text-state-error',
        bgColor: 'bg-state-error-muted border-state-error',
        icon: XCircle
    }
]

// Mock data
const INITIAL_DEALS: Deal[] = [
    {
        id: '1',
        title: 'Implementación ERP',
        company: 'TechCorp SA',
        value: 45000,
        contact: 'María García',
        createdAt: '2024-01-15',
        stage: 'prospecto',
        probability: 20
    },
    {
        id: '2',
        title: 'Consultoría Digital',
        company: 'Innovatech',
        value: 28000,
        contact: 'Carlos López',
        createdAt: '2024-01-18',
        stage: 'prospecto',
        probability: 30
    },
    {
        id: '3',
        title: 'Sistema de Facturación',
        company: 'Comercial Norte',
        value: 15000,
        contact: 'Ana Martínez',
        createdAt: '2024-01-10',
        stage: 'presupuesto_enviado',
        probability: 60
    },
    {
        id: '4',
        title: 'Migración Cloud',
        company: 'DataSoft',
        value: 62000,
        contact: 'Roberto Sánchez',
        createdAt: '2024-01-20',
        stage: 'presupuesto_enviado',
        probability: 75
    },
    {
        id: '5',
        title: 'App Móvil',
        company: 'StartupXYZ',
        value: 35000,
        contact: 'Laura Fernández',
        createdAt: '2024-01-05',
        stage: 'ganado',
        probability: 100
    },
    {
        id: '6',
        title: 'Rediseño Web',
        company: 'MediaGroup',
        value: 8000,
        contact: 'Pedro Gómez',
        createdAt: '2024-01-12',
        stage: 'perdido',
        probability: 0
    }
]

export default function VentasClientPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const companyId = searchParams.get('company_id')
    const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS)
    const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value)
    }

    // Get initials
    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
    }

    // Calculate column totals
    const getColumnStats = (columnId: string) => {
        const columnDeals = deals.filter(d => d.stage === columnId)
        const total = columnDeals.reduce((sum, d) => sum + d.value, 0)
        return { count: columnDeals.length, total }
    }

    // Drag handlers
    const handleDragStart = (e: DragEvent<HTMLDivElement>, deal: Deal) => {
        setDraggedDeal(deal)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', deal.id)
        // Add visual feedback
        if (e.currentTarget) {
            e.currentTarget.style.opacity = '0.5'
        }
    }

    const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
        setDraggedDeal(null)
        setDragOverColumn(null)
        if (e.currentTarget) {
            e.currentTarget.style.opacity = '1'
        }
    }

    const handleDragOver = (e: DragEvent<HTMLDivElement>, columnId: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverColumn(columnId)
    }

    const handleDragLeave = () => {
        setDragOverColumn(null)
    }

    const handleDrop = (e: DragEvent<HTMLDivElement>, targetColumn: string) => {
        e.preventDefault()
        setDragOverColumn(null)

        if (!draggedDeal) return

        // Update deal stage
        setDeals(prev => prev.map(deal => {
            if (deal.id === draggedDeal.id) {
                let probability = deal.probability
                if (targetColumn === 'ganado') probability = 100
                else if (targetColumn === 'perdido') probability = 0
                else if (targetColumn === 'presupuesto_enviado') probability = 60
                else if (targetColumn === 'prospecto') probability = 25

                return { ...deal, stage: targetColumn as Deal['stage'], probability }
            }
            return deal
        }))

        setDraggedDeal(null)
    }

    // Calculate pipeline totals
    const pipelineValue = deals
        .filter(d => !['ganado', 'perdido'].includes(d.stage))
        .reduce((sum, d) => sum + d.value, 0)

    const wonValue = deals
        .filter(d => d.stage === 'ganado')
        .reduce((sum, d) => sum + d.value, 0)

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Pipeline de Ventas</h1>
                        <p className="text-muted-foreground">Gestiona tus oportunidades de negocio</p>
                    </div>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Oportunidad
                </Button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pipeline Activo</p>
                                <p className="text-2xl font-bold text-primary">{formatCurrency(pipelineValue)}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Ventas Ganadas</p>
                                <p className="text-2xl font-bold text-state-success">{formatCurrency(wonValue)}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-state-success-muted flex items-center justify-center">
                                <Trophy className="h-6 w-6 text-state-success" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Oportunidades</p>
                                <p className="text-2xl font-bold text-foreground">{deals.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {COLUMNS.map((column) => {
                    const stats = getColumnStats(column.id)
                    const Icon = column.icon
                    const isOver = dragOverColumn === column.id

                    return (
                        <div
                            key={column.id}
                            className={`rounded-xl border-2 transition-all duration-200 ${isOver
                                ? 'border-primary bg-primary/10 scale-[1.02]'
                                : `border-border bg-card`
                                }`}
                            onDragOver={(e) => handleDragOver(e, column.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column.id)}
                        >
                            {/* Column Header */}
                            <div className={`p-4 border-b ${column.bgColor} rounded-t-xl`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon className={`h-5 w-5 ${column.color}`} />
                                        <h3 className={`font-semibold ${column.color}`}>{column.title}</h3>
                                    </div>
                                    <Badge variant="secondary" className="font-medium">
                                        {stats.count}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {formatCurrency(stats.total)}
                                </p>
                            </div>

                            {/* Cards Container */}
                            <div className="p-3 space-y-3 min-h-[400px]">
                                {deals
                                    .filter(deal => deal.stage === column.id)
                                    .map((deal) => (
                                        <div
                                            key={deal.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, deal)}
                                            onDragEnd={handleDragEnd}
                                            onClick={() => router.push(`/workspace/ventas/${deal.id}${companyId ? `?company_id=${companyId}` : ''}`)}
                                            className={`bg-card rounded-lg border border-border p-4 cursor-pointer shadow-sm hover:shadow-md hover:border-primary transition-all duration-200 ${draggedDeal?.id === deal.id ? 'opacity-50 rotate-2' : ''
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
                                                    <h4 className="font-medium text-foreground text-sm">{deal.title}</h4>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </div>

                                            <div className="flex items-center gap-2 mb-3">
                                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">{deal.company}</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={deal.contactAvatar} />
                                                        <AvatarFallback className="text-[10px] bg-muted">
                                                            {getInitials(deal.contact)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs text-muted-foreground">{deal.contact}</span>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                                                <span className="text-sm font-bold text-foreground">
                                                    {formatCurrency(deal.value)}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${deal.probability >= 75 ? 'border-state-success text-state-success' :
                                                        deal.probability >= 50 ? 'border-state-warning text-state-warning' :
                                                            'border-state-neutral text-state-neutral'
                                                        }`}
                                                >
                                                    {deal.probability}%
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}

                                {/* Empty state */}
                                {deals.filter(d => d.stage === column.id).length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                        <Icon className="h-8 w-8 mb-2 opacity-50" />
                                        <p className="text-sm">Sin oportunidades</p>
                                        <p className="text-xs">Arrastrá aquí para mover</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
