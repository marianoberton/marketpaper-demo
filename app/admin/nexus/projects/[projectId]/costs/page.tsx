'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Zap,
  BarChart3,
} from 'lucide-react'
import { nexusApi } from '@/lib/nexus/api'
import type { NexusProject, NexusUsageRecord } from '@/lib/nexus/types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function CostsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [project, setProject] = useState<NexusProject | null>(null)
  const [usage, setUsage] = useState<NexusUsageRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      nexusApi.getProject(projectId),
      nexusApi.getUsage(projectId).catch(() => ({ data: [] })),
    ])
      .then(([proj, usageRes]) => {
        setProject(proj)
        setUsage(usageRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  const costToday = usage.length > 0 ? usage[usage.length - 1]?.totalCost || 0 : 0
  const costMonth = usage.reduce((acc, u) => acc + u.totalCost, 0)
  const tokensMonth = usage.reduce((acc, u) => acc + u.totalTokens, 0)
  const requestsMonth = usage.reduce((acc, u) => acc + u.totalRequests, 0)

  const dailyBudget = project?.config?.costConfig?.dailyBudgetUSD || 0
  const monthlyBudget = project?.config?.costConfig?.monthlyBudgetUSD || 0
  const dailyPercent = dailyBudget > 0 ? (costToday / dailyBudget) * 100 : 0
  const monthlyPercent = monthlyBudget > 0 ? (costMonth / monthlyBudget) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/nexus/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Costos</h1>
          <p className="text-muted-foreground">
            Consumo de API y presupuesto del proyecto
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Costo Hoy
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costToday.toFixed(2)}</div>
            {dailyBudget > 0 && (
              <div className="mt-2 space-y-1">
                <Progress value={Math.min(dailyPercent, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {dailyPercent.toFixed(0)}% del presupuesto diario (${dailyBudget})
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Costo Mes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costMonth.toFixed(2)}</div>
            {monthlyBudget > 0 && (
              <div className="mt-2 space-y-1">
                <Progress value={Math.min(monthlyPercent, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {monthlyPercent.toFixed(0)}% del presupuesto mensual (${monthlyBudget})
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tokens
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tokensMonth > 1000
                ? `${(tokensMonth / 1000).toFixed(1)}K`
                : tokensMonth}
            </div>
            <p className="text-xs text-muted-foreground">este mes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Requests
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requestsMonth}</div>
            <p className="text-xs text-muted-foreground">este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Consumo Diario</CardTitle>
          <CardDescription>Costo en USD por día</CardDescription>
        </CardHeader>
        <CardContent>
          {usage.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sin datos de consumo todavía</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usage}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="totalCost"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  name="Costo (USD)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
