'use client'

import { useState, useEffect, useCallback, DragEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Target,
    Plus,
    DollarSign,
    FileText,
    HandCoins,
    Trophy,
    TrendingUp,
    Loader2,
    RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { useWorkspace } from '@/components/workspace-context'
import OpportunityCard, { type Opportunity } from './components/OpportunityCard'
import OpportunityForm, { type OpportunityFormData } from './components/OpportunityForm'
import CloseDialog from './components/CloseDialog'

interface Column {
    id: 'calificacion' | 'propuesta' | 'negociacion' | 'cierre'
    title: string
    color: string
    bgColor: string
    icon: React.ElementType
}

const COLUMNS: Column[] = [
    {
        id: 'calificacion',
        title: 'Calificacion',
        color: 'text-state-info',
        bgColor: 'bg-state-info-muted border-state-info',
        icon: Target,
    },
    {
        id: 'propuesta',
        title: 'Propuesta',
        color: 'text-state-warning',
        bgColor: 'bg-state-warning-muted border-state-warning',
        icon: FileText,
    },
    {
        id: 'negociacion',
        title: 'Negociacion',
        color: 'text-state-info',
        bgColor: 'bg-state-info-muted border-state-info',
        icon: HandCoins,
    },
    {
        id: 'cierre',
        title: 'Cierre',
        color: 'text-state-success',
        bgColor: 'bg-state-success-muted border-state-success',
        icon: Trophy,
    },
]

interface Client {
    id: string
    name: string
}

interface TeamMember {
    id: string
    full_name: string
}

interface Stats {
    pipelineValue: number
    weightedValue: number
    wonValue: number
    totalCount: number
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

export default function OportunidadesClientPage() {
    const searchParams = useSearchParams()
    const paramCompanyId = searchParams.get('company_id')
    const { companyId: ctxCompanyId } = useWorkspace()
    const companyId = paramCompanyId || ctxCompanyId

    // Data
    const [opportunities, setOpportunities] = useState<Opportunity[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
    const [stats, setStats] = useState<Stats>({ pipelineValue: 0, weightedValue: 0, wonValue: 0, totalCount: 0 })
    const [loading, setLoading] = useState(true)

    // Drag state
    const [draggedOpp, setDraggedOpp] = useState<Opportunity | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

    // Dialog state
    const [showForm, setShowForm] = useState(false)
    const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null)
    const [closeDialogOpp, setCloseDialogOpp] = useState<Opportunity | null>(null)
    // Pending drop info for close dialog
    const [pendingCloseOpp, setPendingCloseOpp] = useState<Opportunity | null>(null)

    const buildUrl = (path: string) => {
        const base = path
        return companyId ? `${base}?company_id=${companyId}` : base
    }

    // Fetch opportunities
    const fetchOpportunities = useCallback(async () => {
        try {
            const res = await fetch(buildUrl('/api/workspace/oportunidades'))
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const json = await res.json()
            if (json.success) {
                setOpportunities(json.data || [])
                setStats(json.stats || { pipelineValue: 0, weightedValue: 0, wonValue: 0, totalCount: 0 })
            }
        } catch (err) {
            console.error('Error fetching opportunities:', err)
            toast.error('Error al cargar oportunidades')
        } finally {
            setLoading(false)
        }
    }, [companyId])

    // Fetch clients for form dropdown
    const fetchClients = useCallback(async () => {
        try {
            const res = await fetch(buildUrl('/api/workspace/crm'))
            if (!res.ok) return
            const json = await res.json()
            if (json.success && json.data) {
                setClients(json.data.map((c: any) => ({ id: c.id, name: c.name })))
            }
        } catch (err) {
            console.error('Error fetching clients:', err)
        }
    }, [companyId])

    // Fetch team members for form dropdown
    const fetchTeamMembers = useCallback(async () => {
        try {
            const res = await fetch(buildUrl('/api/workspace/settings/team'))
            if (!res.ok) return
            const json = await res.json()
            if (json.data) {
                setTeamMembers(json.data.map((m: any) => ({ id: m.id, full_name: m.full_name || m.email })))
            }
        } catch (err) {
            console.error('Error fetching team:', err)
        }
    }, [companyId])

    useEffect(() => {
        fetchOpportunities()
        fetchClients()
        fetchTeamMembers()
    }, [fetchOpportunities, fetchClients, fetchTeamMembers])

    // -- Drag & Drop Handlers --

    const handleDragStart = (e: DragEvent<HTMLDivElement>, opp: Opportunity) => {
        setDraggedOpp(opp)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', opp.id)
        if (e.currentTarget) {
            e.currentTarget.style.opacity = '0.5'
        }
    }

    const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
        setDraggedOpp(null)
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

        if (!draggedOpp || draggedOpp.stage === targetColumn) {
            setDraggedOpp(null)
            return
        }

        if (targetColumn === 'cierre') {
            // Show close dialog to choose won/lost
            setPendingCloseOpp(draggedOpp)
            setCloseDialogOpp(draggedOpp)
            setDraggedOpp(null)
            return
        }

        // Move to non-cierre stage
        moveToStage(draggedOpp, targetColumn)
        setDraggedOpp(null)
    }

    const moveToStage = async (opp: Opportunity, stage: string, outcome?: 'won' | 'lost', lossReason?: string) => {
        const prevOpportunities = [...opportunities]

        // Optimistic update
        setOpportunities(prev => prev.map(o => {
            if (o.id === opp.id) {
                const prob = stage === 'cierre'
                    ? (outcome === 'won' ? 100 : 0)
                    : stage === 'calificacion' ? 25 : stage === 'propuesta' ? 50 : 75
                return {
                    ...o,
                    stage: stage as Opportunity['stage'],
                    outcome: stage === 'cierre' ? (outcome || null) : null,
                    probability: prob,
                    loss_reason: outcome === 'lost' ? (lossReason || null) : null,
                    closed_at: stage === 'cierre' ? new Date().toISOString() : null,
                }
            }
            return o
        }))

        try {
            const body: Record<string, unknown> = { stage }
            if (outcome) body.outcome = outcome
            if (lossReason) body.loss_reason = lossReason

            const res = await fetch(`/api/workspace/oportunidades/${opp.id}/stage`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            const json = await res.json()
            if (!json.success) {
                throw new Error(json.error)
            }

            // Update with server response
            setOpportunities(prev => prev.map(o => o.id === opp.id ? json.data : o))
            recalcStats()
            toast.success('Oportunidad actualizada')
        } catch (err) {
            // Rollback
            setOpportunities(prevOpportunities)
            toast.error('Error al mover la oportunidad')
        }
    }

    const handleCloseDialogConfirm = async (outcome: 'won' | 'lost', lossReason?: string) => {
        if (!pendingCloseOpp) return
        await moveToStage(pendingCloseOpp, 'cierre', outcome, lossReason)
        setPendingCloseOpp(null)
    }

    // -- CRUD --

    const handleCreate = async (data: OpportunityFormData) => {
        const body: Record<string, unknown> = {
            title: data.title,
            description: data.description || null,
            client_id: data.client_id && data.client_id !== 'none' ? data.client_id : null,
            assigned_to: data.assigned_to && data.assigned_to !== 'none' ? data.assigned_to : null,
            estimated_value: data.estimated_value,
            expected_close_date: data.expected_close_date || null,
            stage: data.stage,
        }

        const res = await fetch(buildUrl('/api/workspace/oportunidades'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        const json = await res.json()
        if (!json.success) {
            toast.error(json.error || 'Error al crear oportunidad')
            throw new Error(json.error)
        }

        setOpportunities(prev => [json.data, ...prev])
        recalcStats()
        toast.success('Oportunidad creada')
    }

    const handleUpdate = async (data: OpportunityFormData) => {
        if (!editingOpp) return

        const body: Record<string, unknown> = {
            title: data.title,
            description: data.description || null,
            client_id: data.client_id && data.client_id !== 'none' ? data.client_id : null,
            assigned_to: data.assigned_to && data.assigned_to !== 'none' ? data.assigned_to : null,
            estimated_value: data.estimated_value,
            expected_close_date: data.expected_close_date || null,
        }

        const res = await fetch(`/api/workspace/oportunidades/${editingOpp.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        const json = await res.json()
        if (!json.success) {
            toast.error(json.error || 'Error al actualizar oportunidad')
            throw new Error(json.error)
        }

        setOpportunities(prev => prev.map(o => o.id === editingOpp.id ? json.data : o))
        recalcStats()
        setEditingOpp(null)
        toast.success('Oportunidad actualizada')
    }

    const handleDelete = async (opp: Opportunity) => {
        if (!confirm('¿Eliminar esta oportunidad?')) return

        const res = await fetch(`/api/workspace/oportunidades/${opp.id}`, {
            method: 'DELETE',
        })

        const json = await res.json()
        if (!json.success) {
            toast.error(json.error || 'Error al eliminar')
            return
        }

        setOpportunities(prev => prev.filter(o => o.id !== opp.id))
        recalcStats()
        toast.success('Oportunidad eliminada')
    }

    const handleDuplicate = async (opp: Opportunity) => {
        const body = {
            title: `[Copia] ${opp.title}`,
            description: opp.description,
            client_id: opp.client_id,
            assigned_to: opp.assigned_to,
            estimated_value: opp.estimated_value,
            expected_close_date: opp.expected_close_date,
            stage: 'calificacion',
        }

        const res = await fetch(buildUrl('/api/workspace/oportunidades'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        const json = await res.json()
        if (json.success) {
            setOpportunities(prev => [json.data, ...prev])
            recalcStats()
            toast.success('Oportunidad duplicada')
        } else {
            toast.error('Error al duplicar')
        }
    }

    const handleEdit = (opp: Opportunity) => {
        setEditingOpp(opp)
        setShowForm(true)
    }

    const recalcStats = () => {
        // Will be updated on next fetch, but for now recalculate locally
        setOpportunities(prev => {
            const active = prev.filter(o => o.stage !== 'cierre')
            const won = prev.filter(o => o.stage === 'cierre' && o.outcome === 'won')
            setStats({
                pipelineValue: active.reduce((s, o) => s + Number(o.estimated_value || 0), 0),
                weightedValue: active.reduce((s, o) => s + Number(o.weighted_value || 0), 0),
                wonValue: won.reduce((s, o) => s + Number(o.estimated_value || 0), 0),
                totalCount: prev.length,
            })
            return prev
        })
    }

    // -- Column stats --
    const getColumnStats = (columnId: string) => {
        const colOpps = opportunities.filter(o => o.stage === columnId)
        const total = colOpps.reduce((sum, o) => sum + Number(o.estimated_value || 0), 0)
        return { count: colOpps.length, total }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Target className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Oportunidades</h1>
                        <p className="text-muted-foreground">Pipeline de oportunidades de negocio</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => { setLoading(true); fetchOpportunities() }}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button className="gap-2" onClick={() => { setEditingOpp(null); setShowForm(true) }}>
                        <Plus className="h-4 w-4" />
                        Nueva Oportunidad
                    </Button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pipeline Activo</p>
                                <p className="text-2xl font-bold text-primary">{formatCurrency(stats.pipelineValue)}</p>
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
                                <p className="text-sm text-muted-foreground">Valor Ponderado</p>
                                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.weightedValue)}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Ganadas</p>
                                <p className="text-2xl font-bold text-state-success">{formatCurrency(stats.wonValue)}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-state-success-muted flex items-center justify-center">
                                <Trophy className="h-6 w-6 text-state-success" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {COLUMNS.map((column) => {
                    const colStats = getColumnStats(column.id)
                    const Icon = column.icon
                    const isOver = dragOverColumn === column.id

                    return (
                        <div
                            key={column.id}
                            className={`rounded-xl border-2 transition-all duration-200 ${isOver
                                ? 'border-primary bg-primary/10 scale-[1.02]'
                                : 'border-border bg-card'
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
                                        {colStats.count}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {formatCurrency(colStats.total)}
                                </p>
                            </div>

                            {/* Cards */}
                            <div className="p-3 space-y-3 min-h-[400px]">
                                {opportunities
                                    .filter(o => o.stage === column.id)
                                    .map((opp) => (
                                        <OpportunityCard
                                            key={opp.id}
                                            opportunity={opp}
                                            isDragged={draggedOpp?.id === opp.id}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onDuplicate={handleDuplicate}
                                        />
                                    ))}

                                {opportunities.filter(o => o.stage === column.id).length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                        <Icon className="h-8 w-8 mb-2 opacity-50" />
                                        <p className="text-sm">Sin oportunidades</p>
                                        <p className="text-xs">Arrastra aqui para mover</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Create/Edit Dialog */}
            <OpportunityForm
                open={showForm}
                onOpenChange={(open) => {
                    setShowForm(open)
                    if (!open) setEditingOpp(null)
                }}
                opportunity={editingOpp}
                clients={clients}
                teamMembers={teamMembers}
                onSave={editingOpp ? handleUpdate : handleCreate}
            />

            {/* Close Dialog */}
            <CloseDialog
                open={!!closeDialogOpp}
                onOpenChange={(open) => {
                    if (!open) {
                        setCloseDialogOpp(null)
                        setPendingCloseOpp(null)
                    }
                }}
                opportunityTitle={closeDialogOpp?.title || ''}
                onClose={handleCloseDialogConfirm}
            />
        </div>
    )
}
