'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Edit, Trash2, Eye, Receipt, Tag, Calendar, DollarSign, CreditCard, Repeat } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

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

interface ExpenseListProps {
  expenses: Expense[]
  categories: Category[]
  onEdit: (expense: Expense) => void
  onDelete: (expenseId: string) => void
}

const PAYMENT_METHOD_LABELS = {
  'credit_card': { label: 'Tarjeta de Crédito', icon: '💳' },
  'debit_card': { label: 'Tarjeta de Débito', icon: '💳' },
  'cash': { label: 'Efectivo', icon: '💵' },
  'bank_transfer': { label: 'Transferencia', icon: '🏦' },
  'other': { label: 'Otros', icon: '💰' }
}

const RECURRING_LABELS = {
  'daily': 'Diario',
  'weekly': 'Semanal',
  'monthly': 'Mensual',
  'yearly': 'Anual'
}

export default function ExpenseList({ expenses, categories, onEdit, onDelete }: ExpenseListProps) {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const getCategoryById = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const handleViewDetail = (expense: Expense) => {
    setSelectedExpense(expense)
    setShowDetailModal(true)
  }

  const handleCloseDetail = () => {
    setSelectedExpense(null)
    setShowDetailModal(false)
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay gastos registrados</h3>
          <p className="text-gray-600 text-center">
            Comienza agregando tu primer gasto para ver el análisis de tus finanzas.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Lista de Gastos ({expenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Método de Pago</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map(expense => {
                  const category = getCategoryById(expense.category_id)
                  const paymentMethod = PAYMENT_METHOD_LABELS[expense.payment_method]
                  
                  return (
                    <TableRow key={expense.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(expense.date)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{expense.description}</p>
                          {expense.tags && expense.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {expense.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  <Tag className="h-2 w-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {expense.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{expense.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {category && (
                          <div className="flex items-center gap-2">
                            <span style={{ color: category.color }}>●</span>
                            <span>{category.icon}</span>
                            <span className="text-sm">{category.name}</span>
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{paymentMethod.icon}</span>
                          <span className="text-sm">{paymentMethod.label}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right font-bold">
                        {formatAmount(expense.amount)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {expense.is_recurring && (
                            <Badge variant="secondary" className="text-xs">
                              <Repeat className="h-3 w-3 mr-1" />
                              {RECURRING_LABELS[expense.recurring_frequency || 'monthly']}
                            </Badge>
                          )}
                          {expense.receipt_url && (
                            <Badge variant="outline" className="text-xs">
                              <Receipt className="h-3 w-3 mr-1" />
                              Recibo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(expense)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(expense.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalle */}
      {showDetailModal && selectedExpense && (
        <Dialog open={showDetailModal} onOpenChange={handleCloseDetail}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalle del Gasto</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Información principal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Descripción</h4>
                  <p className="text-lg font-semibold">{selectedExpense.description}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Monto</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {formatAmount(selectedExpense.amount)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Fecha</h4>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(selectedExpense.date)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Método de Pago</h4>
                  <p className="flex items-center gap-2">
                    <span>{PAYMENT_METHOD_LABELS[selectedExpense.payment_method].icon}</span>
                    {PAYMENT_METHOD_LABELS[selectedExpense.payment_method].label}
                  </p>
                </div>
              </div>

              {/* Categoría */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Categoría</h4>
                {(() => {
                  const category = getCategoryById(selectedExpense.category_id)
                  return category ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span style={{ color: category.color }}>●</span>
                      <span className="text-lg">{category.icon}</span>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-sm text-gray-600">{category.description}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Categoría no encontrada</p>
                  )
                })()}
              </div>

              {/* Etiquetas */}
              {selectedExpense.tags && selectedExpense.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Etiquetas</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedExpense.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Gasto recurrente */}
              {selectedExpense.is_recurring && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Gasto Recurrente</h4>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Repeat className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">
                      Se repite {RECURRING_LABELS[selectedExpense.recurring_frequency || 'monthly'].toLowerCase()}
                    </span>
                  </div>
                </div>
              )}

              {/* Recibo */}
              {selectedExpense.receipt_url && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Recibo</h4>
                  <a
                    href={selectedExpense.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <Receipt className="h-4 w-4" />
                    Ver recibo/comprobante
                  </a>
                </div>
              )}

              {/* Notas */}
              {selectedExpense.notes && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Notas</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedExpense.notes}
                  </p>
                </div>
              )}

              {/* Metadatos */}
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Creado:</span>{' '}
                    {new Date(selectedExpense.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div>
                    <span className="font-medium">Actualizado:</span>{' '}
                    {new Date(selectedExpense.updated_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleCloseDetail}>
                  Cerrar
                </Button>
                <Button onClick={() => {
                  onEdit(selectedExpense)
                  handleCloseDetail()
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
} 