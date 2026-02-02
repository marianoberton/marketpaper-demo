'use client'

import { useEffect, useState, useCallback } from 'react'
import {
    getHubSpotKPIs,
    getDeals,
    getHubSpotPipelines,
    getHubSpotPipelineStages,
    PipelineMetrics,
    HubSpotDeal,
    HubSpotPipeline,
    HubSpotStage
} from '@/actions/hubspot-analytics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from "@/components/ui/checkbox"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCcw,
    DollarSign,
    Trophy,
    Target,
    Briefcase,
    ChevronLeft,
    ChevronRight,
    Filter,
    Check
} from 'lucide-react'
import { useWorkspace } from '@/components/workspace-context'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export default function HubSpotClientPage() {
    const { companyId } = useWorkspace()
    const [loading, setLoading] = useState(true)
    const [tableLoading, setTableLoading] = useState(false)

    // Data State
    const [metrics, setMetrics] = useState<PipelineMetrics | null>(null)
    const [deals, setDeals] = useState<HubSpotDeal[]>([])
    const [pipelines, setPipelines] = useState<HubSpotPipeline[]>([])
    const [stages, setStages] = useState<HubSpotStage[]>([])

    // Filter State
    const [selectedPipeline, setSelectedPipeline] = useState<string>('')
    // Multi-select state: Empty array means "All", otherwise list of IDs
    const [selectedStages, setSelectedStages] = useState<string[]>([])

    // Pagination State
    const [pagingCursor, setPagingCursor] = useState<string | undefined>(undefined)
    const [cursorHistory, setCursorHistory] = useState<string[]>([])
    const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)

    const [error, setError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    // Initial Load: Pipelines
    useEffect(() => {
        if (!companyId) return

        async function loadPipelines() {
            if (!companyId) return;
            try {
                const p = await getHubSpotPipelines(companyId)
                setPipelines(p)

                // Default selection logic
                const targetPipeline = '804074768'
                if (p.some(pi => pi.id === targetPipeline)) {
                    setSelectedPipeline(targetPipeline)
                } else if (p.length > 0) {
                    setSelectedPipeline(p[0].id)
                }
            } catch (err) {
                console.error("Error loading pipelines", err)
            }
        }
        loadPipelines()
    }, [companyId])

    // Load Stages when Pipeline Changes
    useEffect(() => {
        if (!companyId || !selectedPipeline) {
            setStages([])
            return
        }

        async function loadStages() {
            if (!companyId) return;
            try {
                const s = await getHubSpotPipelineStages(companyId, selectedPipeline)
                setStages(s)
                setSelectedStages([]) // Reset stage filter on pipeline change
            } catch (err) {
                console.error("Error loading stages", err)
            }
        }
        loadStages()
    }, [companyId, selectedPipeline])

    // Main Fetch Logic
    const fetchData = useCallback(async (isTableOnly = false) => {
        if (!companyId || !selectedPipeline) return

        try {
            setError(null)
            if (!refreshing && !isTableOnly) setLoading(true)
            if (isTableOnly) setTableLoading(true)

            // Build Promises
            const promises: Promise<any>[] = []

            // 1. Metrics (Only if full refresh or pipeline change)
            if (!isTableOnly) {
                promises.push(getHubSpotKPIs(companyId, selectedPipeline))
            } else {
                promises.push(Promise.resolve(null)) // Placeholder
            }

            // 2. Deals Table
            // Using selectedStages array directly
            promises.push(getDeals(companyId, selectedPipeline, selectedStages, pagingCursor))

            const [metricsResult, dealsResult] = await Promise.all(promises)

            if (metricsResult) setMetrics(metricsResult)

            setDeals(dealsResult.results)
            setNextCursor(dealsResult.paging?.next?.after)

        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Error al conectar con HubSpot')
        } finally {
            setLoading(false)
            setTableLoading(false)
            setRefreshing(false)
        }
    }, [companyId, refreshing, selectedPipeline, selectedStages, pagingCursor])

    // Effect to trigger fetch on changes
    useEffect(() => {
        if (selectedPipeline) {
            fetchData(false) // Full fetch on pipeline change
        }
    }, [selectedPipeline])

    // Effect for Table-only updates (Pagination / Stage Filter)
    useEffect(() => {
        if (selectedPipeline) {
            fetchData(true)
        }
    }, [selectedStages, pagingCursor])

    const handleRefresh = () => {
        setRefreshing(true)
        setPagingCursor(undefined)
        setCursorHistory([])
        fetchData(false)
    }

    const onNext = () => {
        if (nextCursor) {
            setCursorHistory(prev => [...prev, pagingCursor || ''])
            setPagingCursor(nextCursor)
        }
    }

    const onPrev = () => {
        const newHistory = [...cursorHistory]
        const prevCursor = newHistory.pop()
        setCursorHistory(newHistory)
        setPagingCursor(prevCursor === '' ? undefined : prevCursor)
    }

    const toggleStage = (stageId: string) => {
        setPagingCursor(undefined)
        setCursorHistory([])
        setSelectedStages(prev => {
            if (prev.includes(stageId)) {
                return prev.filter(id => id !== stageId)
            } else {
                return [...prev, stageId]
            }
        })
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
    }

    if (loading && !metrics) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Sincronizando con HubSpot...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        Live Data
                    </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* Pipeline Selector */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Pipeline</span>
                        <Select value={selectedPipeline} onValueChange={(v) => {
                            setSelectedPipeline(v)
                            setPagingCursor(undefined)
                            setCursorHistory([])
                        }}>
                            <SelectTrigger className="w-[180px] h-9">
                                <SelectValue placeholder="Pipeline" />
                            </SelectTrigger>
                            <SelectContent>
                                {pipelines.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Multi-Stage Selector */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Etapas</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[180px] h-9 justify-between font-normal">
                                    <span className="truncate">
                                        {selectedStages.length === 0
                                            ? "Todas las etapas"
                                            : `${selectedStages.length} seleccionada${selectedStages.length !== 1 ? 's' : ''}`}
                                    </span>
                                    <Filter className="h-3 w-3 opacity-50 ml-2" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[240px] p-0" align="end">
                                <div className="p-2 border-b">
                                    <h4 className="font-medium text-xs text-muted-foreground mb-1">Filtrar por etapas</h4>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs w-full"
                                            onClick={() => setSelectedStages([])}
                                        >
                                            Limpiar Filtros
                                        </Button>
                                    </div>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto p-1">
                                    {stages.map(stage => (
                                        <div
                                            key={stage.id}
                                            className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-sm cursor-pointer"
                                            onClick={() => toggleStage(stage.id)}
                                        >
                                            <Checkbox
                                                id={`stage-${stage.id}`}
                                                checked={selectedStages.includes(stage.id)}
                                                onCheckedChange={() => toggleStage(stage.id)}
                                            />
                                            <label
                                                htmlFor={`stage-${stage.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                            >
                                                {stage.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-transparent uppercase tracking-wider font-semibold">.</span>
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* KPI Cards (Only update on full refresh) */}
            <div className="grid gap-6 md:grid-cols-4">
                {/* Same cards as before, omitting for brevity in thought process but including in full file write */}
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Pipeline Activo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics?.totalAmount || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {metrics?.dealCount} negocios abiertos
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            Ganado (Histórico)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics?.wonAmount || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {metrics?.wonCount} cerrados
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Ticket Promedio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics?.avgTicket || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            En negocios ganados
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Win Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics && (metrics.wonCount + metrics.dealCount) > 0
                                ? Math.round((metrics.wonCount / (metrics.wonCount + metrics.dealCount)) * 100)
                                : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Estimado global
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Deals Table */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Listado de Negocios</CardTitle>
                        <CardDescription>
                            Mostrando negocios del pipeline <strong>{pipelines.find(p => p.id === selectedPipeline)?.label}</strong>
                            {selectedStages.length > 0 && <span> filtrado por <strong>{selectedStages.length} etapas</strong></span>}
                        </CardDescription>
                    </div>
                </CardHeader>

                <div className="relative">
                    {tableLoading && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-black/60 z-10 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left font-medium text-muted-foreground">
                                <tr>
                                    <th className="p-4 pl-6">Negocio</th>
                                    <th className="p-4">Etapa</th>
                                    <th className="p-4 text-right">Monto</th>
                                    <th className="p-4">Creación</th>
                                    <th className="p-4">Cierre (Est. o Real)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {deals.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                            No se encontraron negocios con estos filtros.
                                        </td>
                                    </tr>
                                ) : (
                                    deals.map((deal) => (
                                        <tr key={deal.id} className="hover:bg-muted/50 transition-colors group">
                                            <td className="p-4 pl-6 font-medium">
                                                <div className="flex flex-col">
                                                    <span className="group-hover:text-primary transition-colors cursor-pointer">{deal.properties.dealname}</span>
                                                    {/* Optional: Add Owner Name if available */}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="secondary" className="font-normal bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-0">
                                                    {stages.find(s => s.id === deal.properties.dealstage)?.label || deal.properties.dealstage}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right font-mono font-medium">
                                                {deal.properties.amount ? formatCurrency(parseFloat(deal.properties.amount)) : '-'}
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {new Date(deal.properties.createdate).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {deal.properties.closedate ? new Date(deal.properties.closedate).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onPrev}
                        disabled={cursorHistory.length === 0 || tableLoading}
                        className="gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                    </Button>

                    <span className="text-xs text-muted-foreground">
                        {deals.length === 0 ? '0 resultados' : 'Mostrando 10 resultados'}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onNext}
                        disabled={!nextCursor || tableLoading}
                        className="gap-2"
                    >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </Card>
        </div>
    )
}
