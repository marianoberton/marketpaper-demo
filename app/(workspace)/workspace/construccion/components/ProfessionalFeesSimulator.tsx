'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calculator, FileText, CheckCircle, AlertCircle, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { Project } from '@/lib/construction'
interface ProfessionalFeesSimulatorProps {
  project: Project
  onCalculationUpdate?: (calculation: ProfessionalFeesCalculation) => void
}

interface ProfessionalFeesCalculation {
  encomiendas: Encomienda[]
  totalFees: number
  totalCpauFees: number
  totalCpicFees: number
  breakdown: FeeBreakdown[]
}

// Modelo de datos según especificación RETP
interface Encomienda {
  id: string
  consejo: 'CPAU' | 'CPIC' // Nuevo campo para identificar el consejo profesional
  categoria: 'obra' | 'instalaciones' | 'habilitaciones' | 'frentes_fachadas' | 'otros'
  subtipo?: string // Solo para instalaciones y otros
  m2?: number // Si aplica
  cantidad: number // Ej: número de especialidades en instalaciones
  precio_unitario_ars: number // Desde tabla vigente
  precio_total_item: number // precio_unitario × cantidad
  metadatos: {
    fecha_tabla: string
    fuente_url: string
    notas?: string
  }
}

interface FeeBreakdown {
  category: string
  subcategory: string
  amount: number
  required: boolean
  selected: boolean
}

interface CpauCatalog {
  schema_version: string
  generated_at: string
  meta: {
    provider: string
    city: string
    currency: string
    source_urls: string[]
    notes: string
  }
  categories: any[]
}

interface CpicCatalog {
  schema_version: string
  generated_at: string
  meta: {
    provider: string
    city: string
    currency: string
    effective_from: string
    source_url: string
    notes: string
  }
  categories: any[]
}

// Tipos de instalaciones disponibles
interface TipoInstalacion {
  id: string
  nombre: string
  descripcion: string
}

// Tipos de otros trámites
interface OtroTramite {
  id: string
  nombre: string
  precio_fijo: number
  descripcion: string
}

interface CatalogSubtype {
  code: string
  label: string
}

interface CatalogItem {
  code: string
  label: string
  price_ars?: number
}

// Función para cargar el catálogo CPAU
const loadCpauCatalog = async (): Promise<CpauCatalog | null> => {
  try {
    const response = await fetch('/catalogo_CPAU.json')
    if (!response.ok) {
      throw new Error('Failed to load catalog')
    }
    return await response.json()
  } catch (error) {
    console.error('Error loading CPAU catalog:', error)
    return null
  }
}

const loadCpicCatalog = async (): Promise<CpicCatalog | null> => {
  try {
    const response = await fetch('/catalogo_cpic.json')
    if (!response.ok) {
      throw new Error('Failed to load CPIC catalog')
    }
    const catalog = await response.json()
    return catalog
  } catch (error) {
    console.error('Error loading CPIC catalog:', error)
    return null
  }
}

export default function ProfessionalFeesSimulator({ project, onCalculationUpdate }: ProfessionalFeesSimulatorProps) {
  // Estado para los catálogos
  const [cpauCatalog, setCpauCatalog] = useState<CpauCatalog | null>(null)
  const [cpicCatalog, setCpicCatalog] = useState<CpicCatalog | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(true)

  // Estado para las encomiendas del proyecto
  const [encomiendas, setEncomiendas] = useState<Encomienda[]>([])

  // Estados para formularios de nueva encomienda
  const [nuevaEncomienda, setNuevaEncomienda] = useState({
    consejo: 'CPAU' as 'CPAU' | 'CPIC',
    categoria: 'obra' as Encomienda['categoria'],
    m2: project?.surface || 100, // Valor por defecto de 100 m² en lugar de 0
    instalacionesSeleccionadas: [] as string[],
    otroTramiteSeleccionado: '',
    cantidadFrente: 1
  })

  const [calculation, setCalculation] = useState<ProfessionalFeesCalculation | null>(null)

  // Cargar catálogos al montar el componente
  useEffect(() => {
    const loadCatalogs = async () => {
      setCatalogLoading(true)
      const [cpauCat, cpicCat] = await Promise.all([
        loadCpauCatalog(),
        loadCpicCatalog()
      ])
      setCpauCatalog(cpauCat)
      setCpicCatalog(cpicCat)
      setCatalogLoading(false)
    }
    loadCatalogs()
  }, [])

  // Obtener catálogo activo según selección
  const activeCatalog = nuevaEncomienda.consejo === 'CPAU' ? cpauCatalog : cpicCatalog

  // Obtener categorías del catálogo activo
  const getCategory = (id: string) => {
    if (nuevaEncomienda.consejo === 'CPAU') {
      return cpauCatalog?.categories.find(cat => cat.id === id)
    } else {
      // Mapear IDs de CPAU a CPIC
      const cpicIdMap: Record<string, string> = {
        'obra': 'obra_nueva',
        'instalaciones': 'instalaciones_obra',
        'habilitaciones': 'habilitaciones',
        'frentes_fachadas': 'ley257_fachadas',
        'otros_tramites': 'otros_fijos',
        'otros': 'otros_fijos'
      }
      return cpicCatalog?.categories.find(cat => cat.id === cpicIdMap[id])
    }
  }

  const obraCategory = getCategory('obra')
  const instalacionesCategory = getCategory('instalaciones')
  const habilitacionesCategory = getCategory('habilitaciones')
  const frentesFachadasCategory = getCategory('frentes_fachadas')
  const otrosTramitesCategory = getCategory('otros_tramites')

  // Tramos para categoría OBRA (Arquitectura)
  const OBRA_RATES = obraCategory?.breakpoints || []

  // Tramos para INSTALACIONES COMPLEMENTARIAS (por especialidad)
  const INSTALACIONES_RATES = instalacionesCategory?.breakpoints || []

  // Tramos para HABILITACIONES (GCBA)
  const HABILITACIONES_RATES = habilitacionesCategory?.breakpoints || []

  // Tramos para VERIFICACIÓN/CONSERVACIÓN DE FRENTES/FACHADAS
  const FRENTES_FACHADAS_RATES = frentesFachadasCategory?.breakpoints || []

  // TIPOS DE INSTALACIONES COMPLEMENTARIAS disponibles
  const TIPOS_INSTALACIONES: TipoInstalacion[] = instalacionesCategory?.subtypes?.map((subtype: CatalogSubtype) => ({
    id: subtype.code,
    nombre: subtype.label,
    descripcion: subtype.label
  })) || []

  // OTROS TRÁMITES con montos fijos
  const OTROS_TRAMITES: OtroTramite[] = otrosTramitesCategory?.items?.map((item: CatalogItem) => ({
    id: item.code,
    nombre: item.label,
    precio_fijo: item.price_ars || 0,
    descripcion: item.label
  })) || []

  // Función para resolver tramo según pseudocódigo RETP
  const resolverTramo = (breakpoints: Array<{ max_m2: number | null; price_ars: number | null }>, m2: number): number => {
    // Si no hay breakpoints, retorna 0
    if (!breakpoints || breakpoints.length === 0) {
      return 0
    }

    for (const bp of breakpoints) {
      if (bp.max_m2 !== null && m2 <= bp.max_m2 && bp.price_ars !== null) {
        return bp.price_ars
      }
    }
    // Si no encuentra un tramo válido, usar el último breakpoint si tiene precio
    const lastBreakpoint = breakpoints[breakpoints.length - 1]
    return lastBreakpoint?.price_ars || 0
  }

  // Función para agregar nueva encomienda
  const agregarEncomienda = () => {
    const { consejo, categoria, m2, instalacionesSeleccionadas, otroTramiteSeleccionado, cantidadFrente } = nuevaEncomienda

    if (categoria === 'obra') {
      if (encomiendas.some(e => e.categoria === 'obra')) {
        toast.error('Solo puede haber una encomienda de Obra por proyecto')
        return
      }
      const precio = resolverTramo(OBRA_RATES, m2)
      const nuevaEnc: Encomienda = {
        id: Date.now().toString(),
        consejo,
        categoria: 'obra',
        m2,
        cantidad: 1,
        precio_unitario_ars: precio,
        precio_total_item: precio,
        metadatos: {
          fecha_tabla: activeCatalog?.generated_at || '',
          fuente_url: consejo === 'CPAU' ? (cpauCatalog?.meta.source_urls[0] || 'CPAU') : (cpicCatalog?.meta.source_url || 'CPIC'),
          notas: `Obra de ${m2} m²`
        }
      }
      setEncomiendas([...encomiendas, nuevaEnc])
    }

    else if (categoria === 'instalaciones') {
      if (instalacionesSeleccionadas.length === 0) {
        toast.error('Debe seleccionar al menos un tipo de instalación')
        return
      }
      const precioUnitario = resolverTramo(INSTALACIONES_RATES, m2)

      // Crear una encomienda separada para cada tipo de instalación
      const nuevasEncomiendas: Encomienda[] = instalacionesSeleccionadas.map(instalacionId => {
        const tipoInstalacion = TIPOS_INSTALACIONES.find(t => t.id === instalacionId)
        return {
          id: `${Date.now()}-${instalacionId}`,
          consejo,
          categoria: 'instalaciones',
          subtipo: tipoInstalacion?.nombre || instalacionId,
          m2,
          cantidad: 1,
          precio_unitario_ars: precioUnitario,
          precio_total_item: precioUnitario,
          metadatos: {
            fecha_tabla: activeCatalog?.generated_at || '',
            fuente_url: consejo === 'CPAU' ? (cpauCatalog?.meta.source_urls[0] || 'CPAU') : (cpicCatalog?.meta.source_url || 'CPIC'),
            notas: `${tipoInstalacion?.nombre || instalacionId} en ${m2} m²`
          }
        }
      })

      setEncomiendas([...encomiendas, ...nuevasEncomiendas])
    }

    else if (categoria === 'habilitaciones') {
      if (encomiendas.some(e => e.categoria === 'habilitaciones')) {
        toast.error('Solo puede haber una encomienda de Habilitación por proyecto')
        return
      }
      const precio = resolverTramo(HABILITACIONES_RATES, m2)
      const nuevaEnc: Encomienda = {
        id: Date.now().toString(),
        consejo,
        categoria: 'habilitaciones',
        m2,
        cantidad: 1,
        precio_unitario_ars: precio,
        precio_total_item: precio,
        metadatos: {
          fecha_tabla: activeCatalog?.generated_at || '',
          fuente_url: consejo === 'CPAU' ? (cpauCatalog?.meta.source_urls[0] || 'CPAU') : (cpicCatalog?.meta.source_url || 'CPIC'),
          notas: `Habilitación de ${m2} m²`
        }
      }
      setEncomiendas([...encomiendas, nuevaEnc])
    }

    else if (categoria === 'frentes_fachadas') {
      const precio = resolverTramo(FRENTES_FACHADAS_RATES, m2)
      const nuevaEnc: Encomienda = {
        id: Date.now().toString(),
        consejo,
        categoria: 'frentes_fachadas',
        m2,
        cantidad: cantidadFrente,
        precio_unitario_ars: precio,
        precio_total_item: precio * cantidadFrente,
        metadatos: {
          fecha_tabla: activeCatalog?.generated_at || '',
          fuente_url: consejo === 'CPAU' ? (cpauCatalog?.meta.source_urls[0] || 'CPAU') : (cpicCatalog?.meta.source_url || 'CPIC'),
          notas: `${cantidadFrente} frente(s) de ${m2} m²`
        }
      }
      setEncomiendas([...encomiendas, nuevaEnc])
    }

    else if (categoria === 'otros') {
      const tramite = OTROS_TRAMITES.find(t => t.id === otroTramiteSeleccionado)
      if (!tramite) {
        toast.error('Debe seleccionar un tipo de trámite')
        return
      }
      const nuevaEnc: Encomienda = {
        id: Date.now().toString(),
        consejo,
        categoria: 'otros',
        subtipo: tramite.nombre,
        cantidad: 1,
        precio_unitario_ars: tramite.precio_fijo,
        precio_total_item: tramite.precio_fijo,
        metadatos: {
          fecha_tabla: activeCatalog?.generated_at || '',
          fuente_url: consejo === 'CPAU' ? (cpauCatalog?.meta.source_urls[0] || 'CPAU') : (cpicCatalog?.meta.source_url || 'CPIC'),
          notas: tramite.descripcion
        }
      }
      setEncomiendas([...encomiendas, nuevaEnc])
    }

    // Resetear formulario
    setNuevaEncomienda({
      consejo: 'CPAU' as 'CPAU' | 'CPIC',
      categoria: 'obra',
      m2: project?.surface || 100, // Valor por defecto de 100 m² en lugar de 0
      instalacionesSeleccionadas: [],
      otroTramiteSeleccionado: '',
      cantidadFrente: 1
    })
  }

  // Función para eliminar encomienda
  const eliminarEncomienda = (id: string) => {
    setEncomiendas(encomiendas.filter(e => e.id !== id))
  }

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Memoizar la función de callback para evitar re-renders innecesarios
  const memoizedOnCalculationUpdate = useCallback(
    (calculation: any) => {
      if (onCalculationUpdate) {
        onCalculationUpdate(calculation)
      }
    },
    [onCalculationUpdate]
  )

  // Calcular totales cuando cambian las encomiendas (según pseudocódigo RETP)
  useEffect(() => {
    const cpauEncomiendas = encomiendas.filter(enc => enc.consejo === 'CPAU')
    const cpicEncomiendas = encomiendas.filter(enc => enc.consejo === 'CPIC')

    const totalCpauFees = cpauEncomiendas.reduce((sum, enc) => sum + enc.precio_total_item, 0)
    const totalCpicFees = cpicEncomiendas.reduce((sum, enc) => sum + enc.precio_total_item, 0)
    const totalFees = totalCpauFees + totalCpicFees

    const breakdown: FeeBreakdown[] = encomiendas.map(enc => ({
      category: enc.consejo,
      subcategory: `${enc.categoria.charAt(0).toUpperCase() + enc.categoria.slice(1).replace('_', ' ')}${enc.subtipo ? ` - ${enc.subtipo}` : ''}`,
      amount: enc.precio_total_item,
      required: enc.categoria === 'obra',
      selected: true
    }))

    const newCalculation: ProfessionalFeesCalculation = {
      encomiendas: encomiendas,
      totalFees: totalFees,
      totalCpauFees: totalCpauFees,
      totalCpicFees: totalCpicFees,
      breakdown: breakdown
    }

    setCalculation(newCalculation)

    // Llamar al callback memoizado
    memoizedOnCalculationUpdate({
      totalFees: totalFees,
      totalCpauFees: totalCpauFees,
      totalCpicFees: totalCpicFees,
      breakdown: breakdown
    })
  }, [encomiendas])

  const handleInstalacionChange = (instalacionId: string, checked: boolean) => {
    setNuevaEncomienda(prev => ({
      ...prev,
      instalacionesSeleccionadas: checked
        ? [...prev.instalacionesSeleccionadas, instalacionId]
        : prev.instalacionesSeleccionadas.filter(id => id !== instalacionId)
    }))
  }

  // Mostrar loading mientras se carga el catálogo
  if (catalogLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando catálogo CPAU...</p>
        </div>
      </div>
    )
  }

  // Mostrar error si no se pudo cargar el catálogo
  if (!cpauCatalog) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-medium">Error al cargar el catálogo CPAU</p>
          <p className="text-muted-foreground text-sm">Por favor, verifique que el archivo catalogo_CPAU.json esté disponible.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Simulador de Encomiendas Profesionales</h2>
          <p className="text-muted-foreground">
            Calcula los costos de encomiendas profesionales para CPAU y CPIC
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de configuración */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Nueva Encomienda Profesional (RETP)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Agregue encomiendas según las categorías {nuevaEncomienda.consejo}. Solo se calcula el arancel del visado, no los honorarios profesionales.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="consejo">Consejo Profesional</Label>
                <Select
                  value={nuevaEncomienda.consejo}
                  onValueChange={(value: 'CPAU' | 'CPIC') =>
                    setNuevaEncomienda(prev => ({
                      ...prev,
                      consejo: value,
                      categoria: 'obra', // Reset categoría al cambiar consejo
                      instalacionesSeleccionadas: [],
                      otroTramiteSeleccionado: ''
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione consejo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPAU">CPAU</SelectItem>
                    <SelectItem value="CPIC">CPIC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  value={nuevaEncomienda.categoria}
                  onValueChange={(value: 'obra' | 'instalaciones' | 'habilitaciones' | 'frentes_fachadas' | 'otros') =>
                    setNuevaEncomienda(prev => ({ ...prev, categoria: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {nuevaEncomienda.consejo === 'CPAU' ? (
                      <>
                        <SelectItem value="obra">Obra (Arquitectura)</SelectItem>
                        <SelectItem value="instalaciones">Instalaciones Complementarias</SelectItem>
                        <SelectItem value="habilitaciones">Habilitaciones (GCBA)</SelectItem>
                        <SelectItem value="frentes_fachadas">Frentes/Fachadas</SelectItem>
                        <SelectItem value="otros">Otros</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="obra">Obra Nueva/Modificación</SelectItem>
                        <SelectItem value="instalaciones">Instalaciones asociadas a Obra</SelectItem>
                        <SelectItem value="habilitaciones">Habilitaciones</SelectItem>
                        <SelectItem value="frentes_fachadas">Ley 257 - Verificación de Fachadas</SelectItem>
                        <SelectItem value="otros">Otros Trámites</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {(nuevaEncomienda.categoria === 'obra' ||
                nuevaEncomienda.categoria === 'instalaciones' ||
                nuevaEncomienda.categoria === 'habilitaciones' ||
                nuevaEncomienda.categoria === 'frentes_fachadas') && (
                <div>
                  <Label htmlFor="m2">Superficie (m²)</Label>
                  <Input
                    id="m2"
                    type="number"
                    value={nuevaEncomienda.m2}
                    onChange={(e) => setNuevaEncomienda(prev => ({ ...prev, m2: Number(e.target.value) }))}
                    placeholder="Ingrese la superficie en m²"
                  />
                </div>
              )}

              {nuevaEncomienda.categoria === 'instalaciones' && (
                <div>
                  <Label>Tipos de Instalaciones</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {TIPOS_INSTALACIONES.map(tipo => (
                      <div key={tipo.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={tipo.id}
                          checked={nuevaEncomienda.instalacionesSeleccionadas.includes(tipo.id)}
                          onCheckedChange={(checked) => handleInstalacionChange(tipo.id, checked as boolean)}
                        />
                        <Label htmlFor={tipo.id} className="text-sm">{tipo.nombre}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {nuevaEncomienda.categoria === 'frentes_fachadas' && (
                <div>
                  <Label htmlFor="cantidadFrente">Cantidad de Frentes</Label>
                  <Input
                    id="cantidadFrente"
                    type="number"
                    min="1"
                    value={nuevaEncomienda.cantidadFrente}
                    onChange={(e) => setNuevaEncomienda(prev => ({ ...prev, cantidadFrente: Number(e.target.value) }))}
                    placeholder="Número de frentes"
                  />
                </div>
              )}

              {nuevaEncomienda.categoria === 'otros' && (
                <div>
                  <Label htmlFor="otroTramite">Tipo de Trámite</Label>
                  <Select
                    value={nuevaEncomienda.otroTramiteSeleccionado}
                    onValueChange={(value) => setNuevaEncomienda(prev => ({ ...prev, otroTramiteSeleccionado: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Seleccione tipo de trámite ${nuevaEncomienda.consejo}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {OTROS_TRAMITES.map(tramite => (
                        <SelectItem key={tramite.id} value={tramite.id}>
                          {tramite.nombre} - ${tramite.precio_fijo.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {OTROS_TRAMITES.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      No hay trámites disponibles para {nuevaEncomienda.consejo}
                    </p>
                  )}
                </div>
              )}

              <Button onClick={agregarEncomienda} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Encomienda
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Encomiendas Existentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Encomiendas del Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {encomiendas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay encomiendas agregadas
                </p>
              ) : (
                <div className="space-y-2">
                  {encomiendas.map(enc => (
                    <div key={enc.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {enc.categoria.charAt(0).toUpperCase() + enc.categoria.slice(1).replace('_', ' ')}
                          {enc.subtipo && ` - ${enc.subtipo}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {enc.m2 && `${enc.m2} m² • `}
                          {enc.cantidad > 1 && `${enc.cantidad} items • `}
                          {formatCurrency(enc.precio_total_item)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarEncomienda(enc.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel de resultados */}
        <div className="lg:col-span-2 space-y-4">
          {/* Resumen de costos CPAU */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Total Aranceles CPAU</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sistema RETP - Valores vigentes 2024
              </p>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-bold text-primary">
                 {formatCurrency(calculation?.totalCpauFees || 0)}
               </div>
               <p className="text-muted-foreground mt-2">
                 {encomiendas.filter(enc => enc.consejo === 'CPAU').length} encomienda(s) • Solo aranceles de visado
               </p>
             </CardContent>
          </Card>

          {/* Resumen de costos CPIC */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Total Aranceles CPIC</CardTitle>
              <p className="text-sm text-muted-foreground">
                Valores vigentes 2024
              </p>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-bold text-green-600">
                 {formatCurrency(calculation?.totalCpicFees || 0)}
               </div>
               <p className="text-muted-foreground mt-2">
                 {encomiendas.filter(enc => enc.consejo === 'CPIC').length} encomienda(s) • Solo aranceles de visado
               </p>
             </CardContent>
          </Card>

          {/* Total Combinado */}
          {(calculation?.totalCpauFees || 0) > 0 || (calculation?.totalCpicFees || 0) > 0 ? (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-xl">Total Aranceles Profesionales</CardTitle>
                <p className="text-sm text-muted-foreground">
                  CPAU + CPIC
                </p>
              </CardHeader>
              <CardContent>
                 <div className="text-4xl font-bold text-primary">
                   {formatCurrency(calculation?.totalFees || 0)}
                 </div>
                 <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                   <div>
                     <span className="text-muted-foreground">CPAU:</span>
                     <span className="font-medium ml-2">{formatCurrency(calculation?.totalCpauFees || 0)}</span>
                   </div>
                   <div>
                     <span className="text-muted-foreground">CPIC:</span>
                     <span className="font-medium ml-2">{formatCurrency(calculation?.totalCpicFees || 0)}</span>
                   </div>
                 </div>
               </CardContent>
            </Card>
          ) : null}

          {/* Desglose detallado */}
           {calculation && encomiendas.length > 0 && (
             <Card>
               <CardHeader>
                 <CardTitle>Desglose por Encomienda</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                   {encomiendas.map((enc, index) => (
                     <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                       <div className="flex items-center gap-2">
                         <CheckCircle className="h-4 w-4 text-green-600" />
                         <div>
                           <span className="font-medium">
                             <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mr-2 ${
                               enc.consejo === 'CPAU' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                             }`}>
                               {enc.consejo}
                             </span>
                             {enc.categoria.charAt(0).toUpperCase() + enc.categoria.slice(1).replace('_', ' ')}
                             {enc.subtipo && ` - ${enc.subtipo}`}
                           </span>
                           {enc.categoria === 'obra' && <Badge variant="secondary" className="ml-2">Obligatorio</Badge>}
                         </div>
                       </div>
                       <span className="font-bold text-lg">{formatCurrency(enc.precio_total_item)}</span>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>
           )}

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Información Importante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Los valores mostrados corresponden únicamente a los aranceles de visado del CPAU.</p>
                <p>• Los honorarios profesionales se calculan por separado según el convenio con el cliente.</p>
                <p>• Valores vigentes según catálogo CPAU {cpauCatalog?.generated_at} - Sistema RETP.</p>
                <p>• Para instalaciones, el costo se multiplica por la cantidad de especialidades seleccionadas.</p>
                <p>• Consulte siempre los valores actualizados en el sitio oficial del CPAU.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
