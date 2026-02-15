'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  DollarSign,
  Building,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Plus,
  Save,
  X,
  Settings,
  Info,
  Receipt,
  Edit3
} from 'lucide-react'
import { toast } from 'sonner'
import { Project, formatCurrency } from '@/lib/construction'

interface GovernmentTaxesSectionProps {
  project: Project
  onProjectUpdate?: (updatedProject: Project) => void
}

interface TaxPayment {
  id: string
  category: string
  subcategory: string
  amount: number
  description: string
  payment_date: string
  receipt_number?: string
  notes?: string
}

interface TaxParameters {
  cpau_rate_per_m2: number
  cpic_rate_per_m2: number
  construction_registration_rate: number
  construction_permit_rate: number
  surplus_value_rate_zone_a: number
  surplus_value_rate_zone_b: number
  last_updated: string
}

const DEFAULT_PARAMETERS: TaxParameters = {
  cpau_rate_per_m2: 12000,   // Actualizado para 2025
  cpic_rate_per_m2: 8000,    // Actualizado para 2025
  construction_registration_rate: 3000,  // Actualizado para 2025
  construction_permit_rate: 4000,        // Actualizado para 2025
  surplus_value_rate_zone_a: 50000,      // Zona premium (Palermo, Recoleta)
  surplus_value_rate_zone_b: 35000,      // Zona estándar (resto de CABA)
  last_updated: '2025-01-15'
}

export default function GovernmentTaxesSection({ project, onProjectUpdate }: GovernmentTaxesSectionProps) {
  const [payments, setPayments] = useState<TaxPayment[]>([])
  const [parameters, setParameters] = useState<TaxParameters>(DEFAULT_PARAMETERS)
  const [loading, setLoading] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [showParameters, setShowParameters] = useState(false)
  const [taxesEnabled, setTaxesEnabled] = useState(false)

  // Referencias para scroll automático
  const addPaymentFormRef = useRef<HTMLDivElement>(null)
  const parametersFormRef = useRef<HTMLDivElement>(null)

  const [newPayment, setNewPayment] = useState({
    category: '',
    subcategory: '',
    amount: '',
    description: '',
    payment_date: new Date().toISOString().split('T')[0],
    receipt_number: '',
    notes: ''
  })

  useEffect(() => {
    checkIfTaxesEnabled()
    loadTaxData()
  }, [project.id])

  // Funciones para scroll automático
  const scrollToAddPaymentForm = () => {
    if (showAddPayment) {
      // Si ya está abierto, solo hacer scroll
      addPaymentFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      })
    } else {
      // Si no está abierto, abrirlo y luego hacer scroll
      setShowAddPayment(true)
      setTimeout(() => {
        addPaymentFormRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        })
      }, 100)
    }
  }

  const scrollToParametersForm = () => {
    if (showParameters) {
      // Si ya está abierto, solo hacer scroll
      parametersFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      })
    } else {
      // Si no está abierto, abrirlo y luego hacer scroll
      setShowParameters(true)
      setTimeout(() => {
        parametersFormRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        })
      }, 100)
    }
  }

  const checkIfTaxesEnabled = () => {
    // Verificar si la gestión de tasas está activada para este proyecto
    // Fallback: si enable_tax_management no existe, verificar projected_total_cost
    const isEnabled = project.enable_tax_management === true ||
                     (project.projected_total_cost && project.projected_total_cost > 0) ||
                     false
    setTaxesEnabled(isEnabled)
  }

  const loadTaxData = async () => {
    try {
      setLoading(true)

      // Cargar pagos desde la API
      const response = await fetch(`/api/workspace/construction/tax-payments?projectId=${project.id}`)
      if (response.ok) {
        const data = await response.json()
        // Convertir formato API a formato del componente
        const formattedPayments = data.payments.map((payment: any) => ({
          id: payment.id,
          category: getCategoryFromPaymentType(payment.payment_type),
          subcategory: payment.description,
          amount: payment.amount,
          description: payment.description,
          payment_date: payment.payment_date.split('T')[0], // Solo la fecha
          receipt_number: payment.receipt_number,
          notes: payment.notes
        }))
        setPayments(formattedPayments)
      } else {
        console.error('Error loading payments:', await response.json())
      }
    } catch (error) {
      console.error('Error loading tax data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryFromPaymentType = (paymentType: string): string => {
    const mapping: Record<string, string> = {
      'professional_commission': 'professional_fees',
      'construction_rights': 'construction_rights',
      'surplus_value': 'surplus_value'
    }
    return mapping[paymentType] || paymentType
  }

  const enableTaxManagement = async () => {
    try {
      const estimates = calculateBasicEstimates()

      // Crear objeto de actualización con campos condicionales
      const updateFields: any = {
        projected_total_cost: estimates.total
      }

      // Solo incluir enable_tax_management si el proyecto ya tiene este campo
      // (para evitar errores si la migración no se ha ejecutado)
      if ('enable_tax_management' in project) {
        updateFields.enable_tax_management = true
      }

      // Actualizar el proyecto para activar la gestión de tasas
      const updatedProject = {
        ...project,
        ...updateFields
      }

      // Llamar a la función de actualización si está disponible
      if (onProjectUpdate) {
        onProjectUpdate(updatedProject)
      }

      setTaxesEnabled(true)
      toast.success('Gestión de tasas activada para este proyecto')
    } catch (error) {
      console.error('Error enabling tax management:', error)
      toast.error('Error al activar la gestión de tasas')
    }
  }

  const calculateBasicEstimates = () => {
    const surface = project.surface || 0
    const budget = project.budget || 0

    // Si no tenemos ni superficie ni presupuesto, no podemos calcular
    if (surface === 0 && budget === 0) {
      return {
        professional_fees: 0,
        construction_rights: 0,
        surplus_value: 0,
        total: 0,
        breakdown: {
          surface_based: 0,
          budget_based: 0,
          calculation_method: 'No hay datos suficientes'
        }
      }
    }

    let professionalFees = 0
    let constructionRights = 0
    let surplusValue = 0
    let calculationMethod = ''

    if (budget > 0) {
      // MÉTODO PREFERIDO: Cálculo basado en presupuesto (más preciso)
      calculationMethod = 'Basado en presupuesto del proyecto'

      // Encomiendas Profesionales: 0.8% - 1.2% del presupuesto
      professionalFees = budget * 0.010 // 1% del presupuesto

      // Derechos de Construcción: 0.3% - 0.5% del presupuesto
      constructionRights = budget * 0.004 // 0.4% del presupuesto

      // Derechos de Plusvalía: 2% - 4% del presupuesto según zona
      // Usamos zona estándar (zona B) = 2.5%
      surplusValue = budget * 0.025 // 2.5% del presupuesto

    } else if (surface > 0) {
      // MÉTODO ALTERNATIVO: Cálculo basado en superficie (menos preciso)
      calculationMethod = 'Basado en superficie del proyecto'

      // Usar parámetros actualizados para 2025
      const updatedParams = {
        cpau_rate_per_m2: 12000, // Actualizado según mercado 2025
        cpic_rate_per_m2: 8000,  // Actualizado según mercado 2025
        construction_registration_rate: 3000, // Actualizado
        construction_permit_rate: 4000, // Actualizado
        surplus_value_rate_zone_b: 35000 // Actualizado según zona promedio
      }

      professionalFees = (updatedParams.cpau_rate_per_m2 + updatedParams.cpic_rate_per_m2) * surface
      constructionRights = (updatedParams.construction_registration_rate + updatedParams.construction_permit_rate) * surface
      surplusValue = updatedParams.surplus_value_rate_zone_b * surface
    }

    return {
      professional_fees: professionalFees,
      construction_rights: constructionRights,
      surplus_value: surplusValue,
      total: professionalFees + constructionRights + surplusValue,
      breakdown: {
        surface_based: surface > 0 ? ((parameters.cpau_rate_per_m2 + parameters.cpic_rate_per_m2) * surface +
                                     (parameters.construction_registration_rate + parameters.construction_permit_rate) * surface +
                                     parameters.surplus_value_rate_zone_b * surface) : 0,
        budget_based: budget > 0 ? (budget * 0.039) : 0, // 3.9% total estimado
        calculation_method: calculationMethod,
        surface: surface,
        budget: budget
      }
    }
  }

  const calculatePaidByCategory = (category: string): number => {
    return payments
      .filter(p => p.category === category)
      .reduce((sum, p) => sum + p.amount, 0)
  }

  const handleAddPayment = async () => {
    if (!newPayment.category || !newPayment.amount || !newPayment.description) {
      toast.error('Por favor completa todos los campos obligatorios')
      return
    }

    try {
      setLoading(true)

      // Enviar el pago a la API
      const response = await fetch('/api/workspace/construction/tax-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          category: newPayment.category,
          subcategory: newPayment.subcategory,
          amount: newPayment.amount,
          description: newPayment.description,
          paymentDate: newPayment.payment_date,
          receiptNumber: newPayment.receipt_number,
          notes: newPayment.notes
        })
      })

      if (response.ok) {
        const data = await response.json()

        // Agregar el nuevo pago al estado local
        const newTaxPayment: TaxPayment = {
          id: data.payment.id,
          category: data.payment.category,
          subcategory: data.payment.subcategory,
          amount: data.payment.amount,
          description: data.payment.description,
          payment_date: data.payment.payment_date.split('T')[0],
          receipt_number: data.payment.receipt_number,
          notes: data.payment.notes
        }

        setPayments([newTaxPayment, ...payments])

        // Limpiar formulario
        setNewPayment({
          category: '',
          subcategory: '',
          amount: '',
          description: '',
          payment_date: new Date().toISOString().split('T')[0],
          receipt_number: '',
          notes: ''
        })
        setShowAddPayment(false)

        // Recargar datos del proyecto para mostrar los totales actualizados
        if (onProjectUpdate) {
          // Simular actualización del proyecto con nuevos totales
          // Los triggers de la DB actualizan automáticamente paid_total_cost, etc.
          const updatedProject = { ...project }
          onProjectUpdate(updatedProject)
        }

        toast.success('Pago registrado exitosamente')
      } else {
        const errorData = await response.json()
        toast.error(`Error al registrar el pago: ${errorData.error}`)
      }

    } catch (error) {
      console.error('Error adding payment:', error)
      toast.error('Error al registrar el pago')
    } finally {
      setLoading(false)
    }
  }

  const updateParameters = async () => {
    try {
      toast.success('Parámetros actualizados exitosamente')
      setShowParameters(false)
    } catch (error) {
      console.error('Error updating parameters:', error)
      toast.error('Error al actualizar los parámetros')
    }
  }

  const getTaxCategories = () => [
    {
      id: 'professional_fees',
      title: 'Encomiendas Profesionales',
      description: 'Pagos a CPAU, CPIC y otros colegios profesionales',
      icon: <Building className="h-5 w-5" />,
      estimate: calculateBasicEstimates().professional_fees,
      subcategories: ['CPAU', 'CPIC', 'Otros Colegios']
    },
    {
      id: 'construction_rights',
      title: 'Derechos de Construcción',
      description: 'Tasas municipales para registros y permisos',
      icon: <Receipt className="h-5 w-5" />,
      estimate: calculateBasicEstimates().construction_rights,
      subcategories: ['Registro de Proyecto', 'Permiso de Obra', 'Otras Tasas']
    },
    {
      id: 'surplus_value',
      title: 'Derechos de Plusvalía',
      description: 'Pagos por etapas según el avance de obra',
      icon: <Calculator className="h-5 w-5" />,
      estimate: calculateBasicEstimates().surplus_value,
      subcategories: ['1ra Etapa (20%)', '2da Etapa (40%)', '3ra Etapa (40%)']
    }
  ]

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Cargando información de tasas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!taxesEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            <span>Gestión de Tasas Gubernamentales</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">¿Quieres gestionar las tasas gubernamentales?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Activa esta función para llevar un control detallado de todos los pagos que debes hacer al gobierno para tu proyecto de construcción.
            </p>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-muted/50 rounded-lg text-left max-w-md mx-auto">
                <h4 className="font-medium mb-2">Incluye:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li> Encomiendas profesionales (CPAU, CPIC)</li>
                  <li> Derechos de construcción (registros, permisos)</li>
                  <li> Derechos de plusvalía (por etapas)</li>
                  <li> Seguimiento de pagos y vencimientos</li>
                  <li> Estimaciones automáticas de costos</li>
                </ul>
              </div>
            </div>

            {project.surface && project.surface > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-green-200 dark:border-green-800 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Superficie del proyecto:</strong> {project.surface} m²
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                    Con este dato podemos calcular estimaciones automáticas
                  </p>
                </div>
                <Button
                  onClick={enableTaxManagement}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Activar Gestión de Tasas
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    <strong>Recomendación:</strong> Agrega primero la superficie del proyecto para obtener estimaciones automáticas.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => toast.info('Edita el proyecto para agregar la superficie en m²')}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Agregar Superficie
                  </Button>
                  <Button
                    onClick={enableTaxManagement}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Activar de Todos Modos
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const estimates = calculateBasicEstimates()
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const completionPercentage = estimates.total > 0 ? ((totalPaid / estimates.total) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              <span>Control de Tasas Gubernamentales</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={scrollToParametersForm}
              >
                <Settings className="h-4 w-4 mr-2" />
                {showParameters ? 'Ver Parámetros' : 'Parámetros'}
              </Button>
              <Button
                onClick={scrollToAddPaymentForm}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showAddPayment ? 'Ver Formulario' : 'Registrar Pago'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Estimado Total</span>
              </div>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-200">
                {formatCurrency(estimates.total)}
              </p>
              {project.surface && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Basado en {project.surface} m²
                </p>
              )}
            </div>

            <div className="p-4 bg-emerald-500/10 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-300">Total Pagado</span>
              </div>
              <p className="text-xl font-bold text-green-900 dark:text-green-200">
                {formatCurrency(totalPaid)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {payments.length} pago{payments.length !== 1 ? 's' : ''} registrado{payments.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="p-4 bg-orange-500/10 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-300">Pendiente</span>
              </div>
              <p className="text-xl font-bold text-orange-900 dark:text-orange-200">
                {formatCurrency(Math.max(0, estimates.total - totalPaid))}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                {estimates.total > 0 ? `${completionPercentage}% completado` : 'Sin estimación'}
              </p>
            </div>
          </div>

          {/* Información del método de cálculo */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
            <div className="flex items-start gap-2">
              <Calculator className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm flex-1">
                <p className="text-blue-800 dark:text-blue-300 font-medium">Método de cálculo utilizado</p>
                <p className="text-blue-700 dark:text-blue-400 mb-2">
                  {estimates.breakdown.calculation_method}
                </p>
                {project.budget && project.budget > 0 ? (
                  <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <p><strong>Presupuesto del proyecto:</strong> {formatCurrency(project.budget)}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <span>• Encomiendas: 1.0% = {formatCurrency(project.budget * 0.01)}</span>
                      <span>• Derechos construcción: 0.4% = {formatCurrency(project.budget * 0.004)}</span>
                      <span>• Plusvalía: 2.5% = {formatCurrency(project.budget * 0.025)}</span>
                    </div>
                    <p className="text-green-700 dark:text-green-400 font-medium mt-2">Método más preciso (basado en presupuesto real)</p>
                  </div>
                ) : project.surface && project.surface > 0 ? (
                  <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <p><strong>Superficie:</strong> {project.surface} m² | <strong>Tarifa promedio:</strong> ~$55,000/m²</p>
                    <p className="text-orange-700 dark:text-orange-400 font-medium">Método aproximado - Agregar presupuesto para mayor precisión</p>
                    <p><em>Tip: Edita el proyecto e incluye el presupuesto total de la obra</em></p>
                  </div>
                ) : (
                  <p className="text-xs text-destructive">Agrega superficie o presupuesto para obtener estimaciones</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="text-yellow-800 dark:text-yellow-300 font-medium">Parámetros de cálculo</p>
                <p className="text-yellow-700 dark:text-yellow-400">
                  Las estimaciones se basan en los parámetros actualizados el {new Date(parameters.last_updated).toLocaleDateString('es-AR')}.
                  <button
                    onClick={scrollToParametersForm}
                    className="underline ml-1 hover:text-yellow-900 dark:hover:text-yellow-200"
                  >
                    Revisar parámetros
                  </button>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {getTaxCategories().map(category => {
        const paidAmount = calculatePaidByCategory(category.id)
        const percentage = category.estimate > 0 ? (paidAmount / category.estimate) * 100 : 0

        return (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {category.icon}
                <span>{category.title}</span>
                <Badge
                  variant="outline"
                  className={`ml-2 ${
                    percentage >= 100 ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' :
                    percentage > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' :
                    'bg-destructive/10 text-destructive'
                  }`}
                >
                  {percentage.toFixed(1)}% pagado
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso de pagos</span>
                  <span>{formatCurrency(paidAmount)} de {formatCurrency(category.estimate)}</span>
                </div>
                <Progress value={Math.min(percentage, 100)} className="h-2" />
              </div>

              {payments.filter(p => p.category === category.id).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Pagos Registrados</h4>
                  <div className="space-y-1">
                    {payments.filter(p => p.category === category.id).map(payment => (
                      <div key={payment.id} className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
                        <div>
                          <span className="font-medium">{payment.description}</span>
                          {payment.subcategory && (
                            <span className="text-muted-foreground ml-2">({payment.subcategory})</span>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString('es-AR')}
                            {payment.receipt_number && ` • Recibo #${payment.receipt_number}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(payment.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Cronograma de Pagos Sugerido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span>Cronograma de Pagos Sugerido</span>
            <Badge variant="outline" className="ml-2">Fechas Precisas</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Calendario específico con fechas exactas para cada pago según las etapas del proyecto
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            // Calcular fechas basadas en la fecha de inicio del proyecto
            const startDate = project.start_date ? new Date(project.start_date) : new Date()
            const formatDate = (date: Date) => date.toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })

            // Fechas clave del cronograma
            const etapa1_inicio = new Date(startDate)
            const etapa1_fin = new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)) // +30 días

            const etapa2_inicio = new Date(startDate.getTime() + (15 * 24 * 60 * 60 * 1000)) // +15 días
            const etapa2_fin = new Date(startDate.getTime() + (60 * 24 * 60 * 60 * 1000)) // +60 días

            const etapa3_inicio = new Date(startDate.getTime() + (180 * 24 * 60 * 60 * 1000)) // +6 meses
            const etapa3_fin = new Date(startDate.getTime() + (540 * 24 * 60 * 60 * 1000)) // +18 meses

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Etapa 1: Inicio del proyecto */}
                <div className="p-4 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">1</div>
                    <span className="font-medium text-orange-800 dark:text-orange-300">Registros Iniciales</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="p-2 bg-orange-500/10 rounded border-l-3 border-orange-400">
                      <p className="text-orange-700 dark:text-orange-400 font-medium">Fecha límite: {formatDate(etapa1_fin)}</p>
                      <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                        {project.start_date ? 'Desde inicio del proyecto' : 'Desde hoy (fecha estimada)'}
                      </p>
                    </div>

                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center justify-between">
                        <span>• Registro CPAU</span>
                        <span className="font-medium">{formatCurrency(estimates.professional_fees * 0.5)}</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>• Registro CPIC</span>
                        <span className="font-medium">{formatCurrency(estimates.professional_fees * 0.4)}</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>• Registro de Proyecto</span>
                        <span className="font-medium">{formatCurrency(estimates.construction_rights * 0.5)}</span>
                      </li>
                    </ul>

                    <div className="pt-2 border-t border-orange-200 dark:border-orange-800">
                      <p className="text-orange-600 font-bold text-base">
                        Total: {formatCurrency(estimates.professional_fees * 0.9 + estimates.construction_rights * 0.5)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Etapa 2: Permiso de obra */}
                <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">2</div>
                    <span className="font-medium text-blue-800 dark:text-blue-300">Permiso de Obra</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded border-l-3 border-blue-400">
                      <p className="text-blue-700 dark:text-blue-400 font-medium">Entre: {formatDate(etapa2_inicio)} - {formatDate(etapa2_fin)}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Al obtener permisos municipales</p>
                    </div>

                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center justify-between">
                        <span>• Permiso de Construcción</span>
                        <span className="font-medium">{formatCurrency(estimates.construction_rights * 0.5)}</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>• Plusvalía 1ra etapa (20%)</span>
                        <span className="font-medium">{formatCurrency(estimates.surplus_value * 0.2)}</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>• Otros colegios profesionales</span>
                        <span className="font-medium">{formatCurrency(estimates.professional_fees * 0.1)}</span>
                      </li>
                    </ul>

                    <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-blue-600 font-bold text-base">
                        Total: {formatCurrency(estimates.construction_rights * 0.5 + estimates.surplus_value * 0.2 + estimates.professional_fees * 0.1)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Etapa 3: Durante construcción */}
                <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">3</div>
                    <span className="font-medium text-green-800 dark:text-green-300">Durante Construcción</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="p-2 bg-emerald-500/10 rounded border-l-3 border-green-400">
                      <p className="text-green-700 dark:text-green-400 font-medium">Entre: {formatDate(etapa3_inicio)} - {formatDate(etapa3_fin)}</p>
                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">Según avance de obra</p>
                    </div>

                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center justify-between">
                        <span>• Plusvalía 2da etapa (40%)</span>
                        <span className="font-medium">{formatCurrency(estimates.surplus_value * 0.4)}</span>
                      </li>
                      <li className="text-xs text-muted-foreground pl-2">
                        Al 40% de avance de obra
                      </li>
                      <li className="flex items-center justify-between">
                        <span>• Plusvalía 3ra etapa (40%)</span>
                        <span className="font-medium">{formatCurrency(estimates.surplus_value * 0.4)}</span>
                      </li>
                      <li className="text-xs text-muted-foreground pl-2">
                        Al finalizar la obra
                      </li>
                    </ul>

                    <div className="pt-2 border-t border-green-200 dark:border-green-800">
                      <p className="text-green-600 font-bold text-base">
                        Total: {formatCurrency(estimates.surplus_value * 0.8)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Resumen total del cronograma */}
          <div className="p-4 bg-muted/50 border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-foreground">Resumen Total del Cronograma</h4>
              <span className="text-2xl font-bold text-primary">{formatCurrency(estimates.total)}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-orange-600 font-medium">{formatCurrency(estimates.professional_fees * 0.9 + estimates.construction_rights * 0.5)}</p>
                <p className="text-xs text-muted-foreground">Etapa 1</p>
              </div>
              <div className="text-center">
                <p className="text-blue-600 font-medium">{formatCurrency(estimates.construction_rights * 0.5 + estimates.surplus_value * 0.2 + estimates.professional_fees * 0.1)}</p>
                <p className="text-xs text-muted-foreground">Etapa 2</p>
              </div>
              <div className="text-center">
                <p className="text-green-600 font-medium">{formatCurrency(estimates.surplus_value * 0.8)}</p>
                <p className="text-xs text-muted-foreground">Etapa 3</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="text-amber-800 dark:text-amber-300 font-medium">Importante sobre las fechas</p>
                <p className="text-amber-700 dark:text-amber-400">
                  Las fechas son estimativas y pueden variar según: tiempos de aprobación municipal,
                  complejidad del proyecto, y avance real de obra.
                  <strong className="block mt-1">Confirma siempre con tu profesional responsable antes de realizar los pagos.</strong>
                </p>
              </div>
            </div>
          </div>

          {!project.start_date && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-800 dark:text-blue-300 font-medium">Para fechas más precisas</p>
                  <p className="text-blue-700 dark:text-blue-400">
                    Edita el proyecto y agrega la <strong>fecha de inicio</strong> para que el cronograma se calcule
                    a partir de esa fecha específica en lugar de la fecha actual.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showAddPayment && (
        <Card ref={addPaymentFormRef} className="border-green-400 dark:border-green-700 bg-emerald-500/10 shadow-lg animate-in slide-in-from-top-2 duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                <span>Registrar Nuevo Pago</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddPayment(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>¿Qué tipo de pago es? *</Label>
                <Select value={newPayment.category} onValueChange={(value) => setNewPayment({...newPayment, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getTaxCategories().map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newPayment.category && (
                <div className="space-y-2">
                  <Label>Subcategoría</Label>
                  <Select value={newPayment.subcategory} onValueChange={(value) => setNewPayment({...newPayment, subcategory: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getTaxCategories().find(c => c.id === newPayment.category)?.subcategories.map(sub => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Monto pagado *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha del pago</Label>
                <Input
                  type="date"
                  value={newPayment.payment_date}
                  onChange={(e) => setNewPayment({...newPayment, payment_date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción *</Label>
                <Input
                  placeholder="Ej: Pago CPAU registro arquitectónico"
                  value={newPayment.description}
                  onChange={(e) => setNewPayment({...newPayment, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Número de recibo</Label>
                <Input
                  placeholder="Opcional"
                  value={newPayment.receipt_number}
                  onChange={(e) => setNewPayment({...newPayment, receipt_number: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas adicionales</Label>
              <Textarea
                placeholder="Información adicional sobre este pago..."
                rows={2}
                value={newPayment.notes}
                onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAddPayment}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Registrar Pago
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddPayment(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showParameters && (
        <Card ref={parametersFormRef} className="border-blue-400 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 shadow-lg animate-in slide-in-from-top-2 duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <span>Parámetros de Cálculo</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowParameters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="text-yellow-800 dark:text-yellow-300 font-medium">Importante</p>
                  <p className="text-yellow-700 dark:text-yellow-400">
                    Estos parámetros se usan para calcular las estimaciones. Revísalos periódicamente ya que las tarifas gubernamentales pueden cambiar.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Encomiendas Profesionales (por m²)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CPAU (Colegio de Arquitectos)</Label>
                  <Input
                    type="number"
                    value={parameters.cpau_rate_per_m2}
                    onChange={(e) => setParameters({...parameters, cpau_rate_per_m2: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPIC (Colegio de Ingenieros)</Label>
                  <Input
                    type="number"
                    value={parameters.cpic_rate_per_m2}
                    onChange={(e) => setParameters({...parameters, cpic_rate_per_m2: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Derechos de Construcción (por m²)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Registro de Proyecto</Label>
                  <Input
                    type="number"
                    value={parameters.construction_registration_rate}
                    onChange={(e) => setParameters({...parameters, construction_registration_rate: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permiso de Obra</Label>
                  <Input
                    type="number"
                    value={parameters.construction_permit_rate}
                    onChange={(e) => setParameters({...parameters, construction_permit_rate: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Derechos de Plusvalía (por m²)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Zona Premium (Palermo, Recoleta, etc.)</Label>
                  <Input
                    type="number"
                    value={parameters.surplus_value_rate_zone_a}
                    onChange={(e) => setParameters({...parameters, surplus_value_rate_zone_a: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zona Estándar (Resto de CABA)</Label>
                  <Input
                    type="number"
                    value={parameters.surplus_value_rate_zone_b}
                    onChange={(e) => setParameters({...parameters, surplus_value_rate_zone_b: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={updateParameters}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar Parámetros
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowParameters(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
