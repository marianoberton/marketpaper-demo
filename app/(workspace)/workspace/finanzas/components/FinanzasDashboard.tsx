'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, PieChart, BarChart3, Calendar, DollarSign, Target, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, AreaChart, Area, Pie } from 'recharts'

interface Expense {
  id: string
  company_id: string
  amount: number
  description: string
  category_id: string
  category_name?: string
  date: string
  payment_method: 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'other'
  receipt_url?: string
  notes?: string
  tags?: string[]
  is_recurring: boolean
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  company_id: string
  name: string
  description?: string
  color: string
  icon?: string
  parent_id?: string
  is_active: boolean
  budget_limit?: number
  created_at: string
  updated_at: string
}

interface FinanzasDashboardProps {
  expenses: Expense[]
  categories: Category[]
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--state-info))',
  'hsl(var(--state-success))',
  'hsl(var(--state-warning))',
  'hsl(var(--state-pending))',
  'hsl(var(--chart-4))',
  'hsl(var(--state-error))'
]

export default function FinanzasDashboard({ expenses, categories }: FinanzasDashboardProps) {
  
  // Calcular datos para gráficos
  const chartData = useMemo(() => {
    // Gastos por categoría
    const expensesByCategory = categories.map(category => {
      const categoryExpenses = expenses.filter(expense => expense.category_id === category.id)
      const total = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      
      return {
        name: category.name,
        icon: category.icon,
        total,
        budget: category.budget_limit || 0,
        color: category.color,
        expenses: categoryExpenses.length,
        percentage: category.budget_limit ? (total / category.budget_limit) * 100 : 0
      }
    }).filter(item => item.total > 0)

    // Gastos por mes (últimos 6 meses)
    const monthlyExpenses = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === date.getMonth() && 
               expenseDate.getFullYear() === date.getFullYear()
      })
      
      const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      
      monthlyExpenses.push({
        month: monthName,
        total,
        expenses: monthExpenses.length
      })
    }

    // Gastos por método de pago
    const paymentMethods = [
      { method: 'credit_card', name: 'Tarjeta de Crédito', icon: '💳' },
      { method: 'debit_card', name: 'Tarjeta de Débito', icon: '💳' },
      { method: 'cash', name: 'Efectivo', icon: '💵' },
      { method: 'bank_transfer', name: 'Transferencia', icon: '🏦' },
      { method: 'other', name: 'Otros', icon: '💰' }
    ]

    const paymentMethodData = paymentMethods.map(method => {
      const methodExpenses = expenses.filter(expense => expense.payment_method === method.method)
      const total = methodExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      
      return {
        name: method.name,
        icon: method.icon,
        total,
        expenses: methodExpenses.length,
        percentage: expenses.length > 0 ? (methodExpenses.length / expenses.length) * 100 : 0
      }
    }).filter(item => item.total > 0)

    // Gastos por día de la semana
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const weeklyExpenses = daysOfWeek.map(day => {
      const dayIndex = daysOfWeek.indexOf(day)
      const dayExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getDay() === dayIndex
      })
      
      const total = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      
      return {
        day,
        total,
        expenses: dayExpenses.length,
        average: dayExpenses.length > 0 ? total / dayExpenses.length : 0
      }
    })

    return {
      expensesByCategory,
      monthlyExpenses,
      paymentMethodData,
      weeklyExpenses
    }
  }, [expenses, categories])

  // Calcular métricas principales
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalBudget = categories.reduce((sum, category) => sum + (category.budget_limit || 0), 0)
  const budgetUsage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0
  const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0

  // Categorías que exceden el presupuesto
  const overBudgetCategories = chartData.expensesByCategory.filter(cat => 
    cat.budget > 0 && cat.total > cat.budget
  )

  // Tendencia del mes actual vs anterior
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
  })

  const previousMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    return expenseDate.getMonth() === prevMonth && expenseDate.getFullYear() === prevYear
  })

  const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const previousMonthTotal = previousMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const monthlyTrend = previousMonthTotal > 0 ? 
    ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Alertas de presupuesto */}
      {overBudgetCategories.length > 0 && (
        <Card className="border-state-error bg-state-error-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-state-error">
              <AlertTriangle className="h-5 w-5" />
              Presupuesto Excedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overBudgetCategories.map(category => (
                <div key={category.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {category.icon} {category.name}
                  </span>
                  <span className="text-sm text-state-error">
                    ${category.total.toLocaleString()} / ${category.budget.toLocaleString()}
                    ({Math.round(category.percentage)}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gastos del Mes</p>
                <p className="text-2xl font-bold">${currentMonthTotal.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {monthlyTrend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-state-error" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-state-success" />
                  )}
                  <span className={`text-xs ${monthlyTrend > 0 ? 'text-state-error' : 'text-state-success'}`}>
                    {Math.abs(monthlyTrend).toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uso del Presupuesto</p>
                <p className="text-2xl font-bold">{budgetUsage.toFixed(1)}%</p>
                <Progress value={budgetUsage} className="w-full h-2 mt-2" />
              </div>
              <Target className="h-8 w-8 text-state-pending" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Promedio por Gasto</p>
                <p className="text-2xl font-bold">${averageExpense.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {expenses.length} gastos totales
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-state-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categorías Activas</p>
                <p className="text-2xl font-bold">{chartData.expensesByCategory.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  de {categories.length} totales
                </p>
              </div>
              <PieChart className="h-8 w-8 text-accent-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={chartData.expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                  outerRadius={80}
                  fill="hsl(var(--chart-1))"
                  dataKey="total"
                >
                  {chartData.expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tendencia mensual */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por método de pago */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData.paymentMethodData.map((method, index) => (
                <div key={method.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{method.icon}</span>
                    <span className="font-medium">{method.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {method.expenses} gastos
                    </span>
                    <span className="font-bold">
                      ${method.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gastos por día de la semana */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Día de la Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.weeklyExpenses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Bar dataKey="total" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resumen de categorías con presupuesto */}
      <Card>
        <CardHeader>
          <CardTitle>Control de Presupuesto por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.expensesByCategory.map(category => (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      ${category.total.toLocaleString()}
                    </span>
                    {category.budget > 0 && (
                      <span className="text-sm text-muted-foreground">
                        / ${category.budget.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {category.budget > 0 && (
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={category.percentage} 
                      className="flex-1 h-2" 
                    />
                    <Badge variant={category.percentage > 100 ? 'destructive' : 'secondary'}>
                      {category.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 