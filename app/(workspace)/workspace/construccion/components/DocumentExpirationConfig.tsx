'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  DOCUMENT_EXPIRATION_CONFIG, 
  DocumentExpirationConfig as ConfigType,
  getAllConfigurations,
  getConfigsByCategory 
} from '@/lib/document-expiration-config'
import { Calendar, Clock, FileText, Settings, AlertTriangle } from 'lucide-react'

interface DocumentExpirationConfigProps {
  onConfigChange?: (config: ConfigType[]) => void
}

export default function DocumentExpirationConfig({ onConfigChange }: DocumentExpirationConfigProps) {
  const [configs, setConfigs] = useState<ConfigType[]>(getAllConfigurations())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingDays, setEditingDays] = useState<number>(0)

  const handleEdit = (config: ConfigType) => {
    setEditingId(config.sectionName)
    setEditingDays(config.expirationDays)
  }

  const handleSave = (sectionName: string) => {
    const updatedConfigs = configs.map(config => 
      config.sectionName === sectionName 
        ? { ...config, expirationDays: editingDays }
        : config
    )
    setConfigs(updatedConfigs)
    setEditingId(null)
    onConfigChange?.(updatedConfigs)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingDays(0)
  }

  const getCategoryIcon = (category: ConfigType['category']) => {
    switch (category) {
      case 'permiso': return <FileText className="h-4 w-4" />
      case 'obra': return <Settings className="h-4 w-4" />
      case 'informe': return <Calendar className="h-4 w-4" />
      case 'tasa': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: ConfigType['category']) => {
    switch (category) {
      case 'permiso': return 'bg-blue-100 text-blue-800'
      case 'obra': return 'bg-green-100 text-green-800'
      case 'informe': return 'bg-yellow-100 text-yellow-800'
      case 'tasa': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDays = (days: number) => {
    if (days >= 365) {
      const years = Math.floor(days / 365)
      const remainingDays = days % 365
      return remainingDays > 0 
        ? `${years} año${years > 1 ? 's' : ''} y ${remainingDays} día${remainingDays > 1 ? 's' : ''}`
        : `${years} año${years > 1 ? 's' : ''}`
    } else if (days >= 30) {
      const months = Math.floor(days / 30)
      const remainingDays = days % 30
      return remainingDays > 0
        ? `${months} mes${months > 1 ? 'es' : ''} y ${remainingDays} día${remainingDays > 1 ? 's' : ''}`
        : `${months} mes${months > 1 ? 'es' : ''}`
    } else {
      return `${days} día${days > 1 ? 's' : ''}`
    }
  }

  const categories = ['permiso', 'obra', 'informe', 'tasa'] as const

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configuración de Períodos de Vencimiento
          </CardTitle>
          <CardDescription>
            Configure los períodos de vencimiento para cada tipo de documento. 
            Los documentos se considerarán vencidos después del período especificado desde su fecha de carga.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {categories.map(category => {
              const categoryConfigs = getConfigsByCategory(category)
              if (categoryConfigs.length === 0) return null

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <h3 className="text-lg font-semibold capitalize">
                      {category === 'permiso' && 'Permisos'}
                      {category === 'obra' && 'Documentos de Obra'}
                      {category === 'informe' && 'Informes'}
                      {category === 'tasa' && 'Tasas y Pagos'}
                    </h3>
                    <Badge className={getCategoryColor(category)}>
                      {categoryConfigs.length} documento{categoryConfigs.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="grid gap-3">
                    {categoryConfigs.map(config => (
                      <div key={config.sectionName} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{config.sectionName}</div>
                          <div className="text-sm text-muted-foreground">{config.description}</div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {editingId === config.sectionName ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={editingDays}
                                onChange={(e) => setEditingDays(parseInt(e.target.value) || 0)}
                                className="w-20"
                                min="1"
                              />
                              <span className="text-sm text-muted-foreground">días</span>
                              <Button size="sm" onClick={() => handleSave(config.sectionName)}>
                                Guardar
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancel}>
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="font-medium">{formatDays(config.expirationDays)}</div>
                                <div className="text-sm text-muted-foreground">({config.expirationDays} días)</div>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => handleEdit(config)}>
                                Editar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {category !== 'tasa' && <Separator />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información Importante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div className="text-sm">
              <strong>Períodos de Vencimiento:</strong> Los documentos se marcarán como vencidos después del período especificado desde su fecha de carga.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <strong>Próximos a Vencer:</strong> Los documentos se marcarán como "próximos a vencer" cuando falten 30 días o menos para su vencimiento.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-green-500 mt-0.5" />
            <div className="text-sm">
              <strong>Configuración por Defecto:</strong> Si un tipo de documento no tiene configuración específica, se usará un período de 1 año (365 días).
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}