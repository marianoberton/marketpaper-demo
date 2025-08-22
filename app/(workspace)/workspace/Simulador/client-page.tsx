'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calculator, 
  Wallet, 
  Building2, 
  FileText, 
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Project } from '@/lib/construction'
import ProfessionalFeesSimulator from '../construccion/components/ProfessionalFeesSimulator'

// Tipos para el simulador de pagos de construcción
interface PaymentSimulation {
  professionalFees: number
  constructionRights: number
  surplusValue: number
  totalPayments: number
  breakdown: PaymentBreakdown[]
}

interface PaymentBreakdown {
  category: string
  subcategory: string
  amount: number
  stage: string
  required: boolean
}

// Mock project data para el simulador
const mockProject: Project = {
  id: 'sim-project-1',
  company_id: 'company-1',
  name: 'Proyecto de Simulación',
  address: 'Dirección del proyecto',
  barrio: 'Palermo',
  ciudad: 'CABA',
  surface: 1500,
  director_obra: 'Arq. Simulación',
  builder: 'Constructor Simulación',
  status: 'En Gestoria',
  current_stage: 'Prefactibilidad del proyecto',
  project_type: 'Obra Mayor',
  project_usage: 'Vivienda',
  budget: 10000000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export default function SimuladordePagosClientPage() {
  const [selectedProject, setSelectedProject] = useState<Project>(mockProject)
  const [activeTab, setActiveTab] = useState('professional-fees')
  const [simulation, setSimulation] = useState<PaymentSimulation | null>(null)

  // Función para manejar cambios en el cálculo de encomiendas profesionales
  const handleProfessionalFeesUpdate = (calculation: any) => {
    setSimulation(prev => ({
      ...prev,
      professionalFees: calculation.totalFees,
      constructionRights: prev?.constructionRights || 0,
      surplusValue: prev?.surplusValue || 0,
      totalPayments: calculation.totalFees + (prev?.constructionRights || 0) + (prev?.surplusValue || 0),
      breakdown: calculation.breakdown || []
    }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Simulador de Pagos</h1>
          <p className="text-muted-foreground">
            Calcula cuotas, intereses y compara diferentes opciones de financiamiento
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="professional-fees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Encomiendas Profesionales
          </TabsTrigger>
          <TabsTrigger value="construction-rights" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Derechos de Construcción
          </TabsTrigger>
          <TabsTrigger value="surplus-value" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Plusvalía
          </TabsTrigger>
        </TabsList>

        <TabsContent value="professional-fees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Encomiendas Profesionales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProfessionalFeesSimulator 
                project={selectedProject}
                onCalculationUpdate={handleProfessionalFeesUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="construction-rights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Derechos de Construcción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="surface">Superficie a Construir (m²)</Label>
                      <Input
                        id="surface"
                        type="number"
                        placeholder="Ej: 150"
                        defaultValue={selectedProject.surface || ''}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="zone">Zona</Label>
                      <Select defaultValue="zona-1">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zona-1">Zona 1 - Centro</SelectItem>
                          <SelectItem value="zona-2">Zona 2 - Intermedia</SelectItem>
                          <SelectItem value="zona-3">Zona 3 - Periférica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="construction-type">Tipo de Construcción</Label>
                      <Select defaultValue={selectedProject.project_type || 'Obra Mayor'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Obra Mayor">Obra Mayor</SelectItem>
                          <SelectItem value="Obra Menor">Obra Menor</SelectItem>
                          <SelectItem value="Ampliación">Ampliación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button className="w-full">
                      <Calculator className="h-4 w-4 mr-2" />
                      Calcular Derechos
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Derechos de Construcción</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(0)}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Inspecciones</span>
                      </div>
                      <p className="text-xl font-bold text-green-900">
                        {formatCurrency(0)}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">Otros Gastos</span>
                      </div>
                      <p className="text-xl font-bold text-orange-900">
                        {formatCurrency(0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surplus-value" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Plusvalía
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="property-value">Valor de la Propiedad</Label>
                      <Input
                        id="property-value"
                        type="number"
                        placeholder="Ej: 50000000"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="construction-value">Valor de la Construcción</Label>
                      <Input
                        id="construction-value"
                        type="number"
                        placeholder="Ej: 30000000"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="improvement-percentage">Porcentaje de Mejora (%)</Label>
                      <Input
                        id="improvement-percentage"
                        type="number"
                        step="0.1"
                        placeholder="Ej: 15.5"
                      />
                    </div>
                    
                    <Button className="w-full">
                      <Calculator className="h-4 w-4 mr-2" />
                      Calcular Plusvalía
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">Plusvalía Generada</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatCurrency(0)}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Impuesto a Pagar</span>
                      </div>
                      <p className="text-xl font-bold text-yellow-900">
                        {formatCurrency(0)}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="h-5 w-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">Valor Final</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(0)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {simulation && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-blue-900">Resumen Total de Pagos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-blue-700">Encomiendas Profesionales</p>
                        <p className="text-lg font-bold text-blue-900">
                          {formatCurrency(simulation.professionalFees)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-blue-700">Derechos de Construcción</p>
                        <p className="text-lg font-bold text-blue-900">
                          {formatCurrency(simulation.constructionRights)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-blue-700">Plusvalía</p>
                        <p className="text-lg font-bold text-blue-900">
                          {formatCurrency(simulation.surplusValue)}
                        </p>
                      </div>
                      <div className="text-center border-l border-blue-300">
                        <p className="text-sm text-blue-700">Total General</p>
                        <p className="text-xl font-bold text-blue-900">
                          {formatCurrency(simulation.totalPayments)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
