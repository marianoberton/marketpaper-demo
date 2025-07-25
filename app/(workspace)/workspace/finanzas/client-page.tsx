'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, CreditCard, Upload, Download, Search, Filter, Calendar, TrendingUp, TrendingDown, Eye, Edit, Trash2, FileText, PieChart, BarChart3, DollarSign, Target, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { useWorkspace } from '@/components/workspace-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

// Componentes específicos del módulo
import FinanzasDashboard from './components/FinanzasDashboard'
import ExpenseModal from './components/ExpenseModal'
import CategoryManager from './components/CategoryManager'
import ImportModal from './components/ImportModal'
import ExpenseList from './components/ExpenseList'

// Tipos de datos
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

interface ImportedFile {
  id: string
  company_id: string
  filename: string
  file_url: string
  file_type: 'credit_card' | 'bank_statement' | 'receipt' | 'other'
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  extracted_expenses: number
  created_at: string
  updated_at: string
}

// Categorías por defecto
const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'company_id' | 'created_at' | 'updated_at'>[] = [
  { name: 'Alimentación', description: 'Comida y bebidas', color: '#10b981', icon: '🍕', parent_id: undefined, is_active: true },
  { name: 'Transporte', description: 'Combustible, transporte público, uber', color: '#3b82f6', icon: '🚗', parent_id: undefined, is_active: true },
  { name: 'Entretenimiento', description: 'Cine, streaming, salidas', color: '#8b5cf6', icon: '🎬', parent_id: undefined, is_active: true },
  { name: 'Salud', description: 'Medicamentos, consultas médicas', color: '#ef4444', icon: '🏥', parent_id: undefined, is_active: true },
  { name: 'Educación', description: 'Cursos, libros, capacitación', color: '#f59e0b', icon: '📚', parent_id: undefined, is_active: true },
  { name: 'Compras', description: 'Ropa, accesorios, productos varios', color: '#ec4899', icon: '🛍️', parent_id: undefined, is_active: true },
  { name: 'Servicios', description: 'Internet, luz, gas, teléfono', color: '#6b7280', icon: '🔧', parent_id: undefined, is_active: true },
  { name: 'Vivienda', description: 'Alquiler, expensas, mantenimiento', color: '#0891b2', icon: '🏠', parent_id: undefined, is_active: true },
  { name: 'Ahorro e Inversión', description: 'Inversiones, ahorros', color: '#16a34a', icon: '💰', parent_id: undefined, is_active: true },
  { name: 'Otros', description: 'Gastos varios no categorizados', color: '#64748b', icon: '📝', parent_id: undefined, is_active: true }
]

export default function FinanzasClientPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDateRange, setFilterDateRange] = useState('all')
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const workspace = useWorkspace()

  // Cargar datos al inicializar
  useEffect(() => {
    loadCategories()
    loadExpenses()
    loadImportedFiles()
  }, [])

  const loadCategories = async () => {
    try {
      const url = workspace.companyId 
        ? `/api/workspace/finanzas/categories?company_id=${workspace.companyId}`
        : '/api/workspace/finanzas/categories'
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Error al cargar las categorías')
      }
      
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error loading categories:', error)
      setError('Error al cargar las categorías')
    }
  }

  const loadExpenses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = workspace.companyId 
        ? `/api/workspace/finanzas/expenses?company_id=${workspace.companyId}`
        : '/api/workspace/finanzas/expenses'
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Error al cargar los gastos')
      }
      
      const data = await response.json()
      setExpenses(data.expenses || [])
    } catch (error) {
      console.error('Error loading expenses:', error)
      setError('Error al cargar los gastos')
    } finally {
      setLoading(false)
    }
  }

  const loadImportedFiles = async () => {
    try {
      const url = workspace.companyId 
        ? `/api/workspace/finanzas/imports?company_id=${workspace.companyId}`
        : '/api/workspace/finanzas/imports'
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Error al cargar los archivos importados')
      }
      
      const data = await response.json()
      setImportedFiles(data.files || [])
    } catch (error) {
      console.error('Error loading imported files:', error)
      setError('Error al cargar los archivos importados')
    }
  }

  // Filtrar gastos
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || expense.category_id === filterCategory
    
    let matchesDateRange = true
    if (filterDateRange !== 'all') {
      const expenseDate = new Date(expense.date)
      const now = new Date()
      
      switch (filterDateRange) {
        case 'today':
          matchesDateRange = expenseDate.toDateString() === now.toDateString()
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDateRange = expenseDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDateRange = expenseDate >= monthAgo
          break
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          matchesDateRange = expenseDate >= yearAgo
          break
      }
    }

    return matchesSearch && matchesCategory && matchesDateRange
  })

  // Estadísticas rápidas
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const averageExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0
  const monthlyBudget = categories.reduce((sum, cat) => sum + (cat.budget_limit || 0), 0)
  const categoriesWithExpenses = categories.filter(cat => 
    filteredExpenses.some(expense => expense.category_id === cat.id)
  ).length

  const handleCreateExpense = async (expenseData: Omit<Expense, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/workspace/finanzas/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...expenseData,
          company_id: workspace.companyId,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al crear el gasto')
      }

      const data = await response.json()
      setExpenses(prev => [data.expense, ...prev])
      setShowExpenseModal(false)
    } catch (error) {
      console.error('Error creating expense:', error)
      setError('Error al crear el gasto')
    }
  }

  const handleUpdateExpense = async (expenseId: string, expenseData: Partial<Expense>) => {
    try {
      const response = await fetch(`/api/workspace/finanzas/expenses/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el gasto')
      }

      const data = await response.json()
      setExpenses(prev => prev.map(expense => 
        expense.id === expenseId ? data.expense : expense
      ))
      setSelectedExpense(null)
      setShowExpenseModal(false)
    } catch (error) {
      console.error('Error updating expense:', error)
      setError('Error al actualizar el gasto')
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      return
    }

    try {
      const response = await fetch(`/api/workspace/finanzas/expenses/${expenseId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el gasto')
      }

      setExpenses(prev => prev.filter(expense => expense.id !== expenseId))
    } catch (error) {
      console.error('Error deleting expense:', error)
      setError('Error al eliminar el gasto')
    }
  }

  const handleImportFile = async (file: File, fileType: string) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('file_type', fileType)
      formData.append('company_id', workspace.companyId || '')

      const response = await fetch('/api/workspace/finanzas/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Error al importar el archivo')
      }

      const data = await response.json()
      setImportedFiles(prev => [data.file, ...prev])
      setShowImportModal(false)
      
      // Recargar gastos después de la importación
      loadExpenses()
    } catch (error) {
      console.error('Error importing file:', error)
      setError('Error al importar el archivo')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Finanzas Personales"
        description="Gestiona tus gastos, categorías y presupuestos"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Gastos</p>
                <p className="text-2xl font-bold">${totalExpenses.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio por Gasto</p>
                <p className="text-2xl font-bold">${averageExpense.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Presupuesto Total</p>
                <p className="text-2xl font-bold">${monthlyBudget.toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categorías Activas</p>
                <p className="text-2xl font-bold">{categoriesWithExpenses}</p>
              </div>
              <PieChart className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar gastos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterDateRange} onValueChange={setFilterDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fechas</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="year">Último año</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button onClick={() => setShowExpenseModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="imports">Importaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <FinanzasDashboard 
            expenses={filteredExpenses}
            categories={categories}
          />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseList 
            expenses={filteredExpenses}
            categories={categories}
            onEdit={(expense) => {
              setSelectedExpense(expense)
              setShowExpenseModal(true)
            }}
            onDelete={handleDeleteExpense}
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryManager 
            categories={categories}
            onUpdate={loadCategories}
          />
        </TabsContent>

        <TabsContent value="imports" className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Archivos Importados</h3>
              <Button onClick={() => setShowImportModal(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar Archivo
              </Button>
            </div>
            
            <div className="grid gap-4">
              {importedFiles.map(file => (
                <Card key={file.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">{file.filename}</p>
                          <p className="text-sm text-gray-600">
                            {file.extracted_expenses} gastos extraídos
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          file.processing_status === 'completed' ? 'default' :
                          file.processing_status === 'failed' ? 'destructive' :
                          'secondary'
                        }>
                          {file.processing_status === 'completed' ? 'Completado' :
                           file.processing_status === 'failed' ? 'Error' :
                           file.processing_status === 'processing' ? 'Procesando' : 'Pendiente'}
                        </Badge>
                        <p className="text-sm text-gray-500">
                          {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modales */}
      {showExpenseModal && (
        <ExpenseModal
          expense={selectedExpense}
          categories={categories}
          onSave={selectedExpense ? 
            (data) => handleUpdateExpense(selectedExpense.id, data) :
            handleCreateExpense
          }
          onCancel={() => {
            setShowExpenseModal(false)
            setSelectedExpense(null)
          }}
        />
      )}

      {showImportModal && (
        <ImportModal
          onImport={handleImportFile}
          onCancel={() => setShowImportModal(false)}
        />
      )}
    </div>
  )
} 