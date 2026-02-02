'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { RefreshCw, Save, Eye, Palette } from 'lucide-react'

interface ColorCustomizerProps {
  companyId: string
}

interface ColorScheme {
  primary?: string
  accent?: string
}

interface CustomColors {
  light?: ColorScheme
  dark?: ColorScheme
}

export function ColorCustomizer({ companyId }: ColorCustomizerProps) {
  const [colors, setColors] = useState<CustomColors>({
    light: {},
    dark: {}
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Defaults (del globals.css actual)
  const defaultColors = {
    light: {
      primary: '#CED600',
      accent: '#EE9B00'
    },
    dark: {
      primary: '#CED600',
      accent: '#CED600'
    }
  }

  // Cargar colores actuales
  useEffect(() => {
    async function loadColors() {
      try {
        const response = await fetch(`/api/admin/companies/${companyId}/branding`)
        if (response.ok) {
          const data = await response.json()
          setColors(data.custom_colors || { light: {}, dark: {} })
        }
      } catch (error) {
        console.error('Error loading colors:', error)
        toast.error('Error al cargar colores')
      } finally {
        setIsLoading(false)
      }
    }
    loadColors()
  }, [companyId])

  // Guardar colores
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_colors: colors })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save colors')
      }

      toast.success('Colores actualizados exitosamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar los colores')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  // Resetear a defaults
  const handleReset = () => {
    setColors({ light: {}, dark: {} })
    toast.info('Colores reseteados. Los usuarios verán los colores por defecto de la plataforma.')
  }

  // Helper para actualizar un color
  const updateColor = (mode: 'light' | 'dark', key: keyof ColorScheme, value: string) => {
    setColors(prev => ({
      ...prev,
      [mode]: { ...prev[mode], [key]: value }
    }))
  }

  // Helper para obtener el color actual o el default
  const getColor = (mode: 'light' | 'dark', key: keyof ColorScheme): string => {
    return colors[mode]?.[key] || defaultColors[mode][key]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Cargando configuración...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="light">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="light" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Modo Claro
          </TabsTrigger>
          <TabsTrigger value="dark" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Modo Oscuro
          </TabsTrigger>
        </TabsList>

        {/* TAB: Light Mode */}
        <TabsContent value="light" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Color Primario */}
            <div className="space-y-2">
              <Label htmlFor="light-primary">Color Primario</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="light-primary"
                  value={getColor('light', 'primary')}
                  onChange={(e) => updateColor('light', 'primary', e.target.value)}
                  className="h-10 w-16 rounded border cursor-pointer"
                />
                <Input
                  type="text"
                  value={getColor('light', 'primary')}
                  onChange={(e) => updateColor('light', 'primary', e.target.value)}
                  placeholder="#CED600"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Color Acento */}
            <div className="space-y-2">
              <Label htmlFor="light-accent">Color Acento</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="light-accent"
                  value={getColor('light', 'accent')}
                  onChange={(e) => updateColor('light', 'accent', e.target.value)}
                  className="h-10 w-16 rounded border cursor-pointer"
                />
                <Input
                  type="text"
                  value={getColor('light', 'accent')}
                  onChange={(e) => updateColor('light', 'accent', e.target.value)}
                  placeholder="#EE9B00"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Vista previa - Light Mode */}
          <div
            className="mt-6 p-6 border rounded-lg space-y-4 bg-[#FAFAFA]"
          >
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-gray-700" />
              <p className="text-sm font-semibold text-gray-700">Vista Previa - Modo Claro</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                style={{
                  backgroundColor: getColor('light', 'primary'),
                  color: '#272727'
                }}
              >
                Botón Primario
              </Button>
              <Button
                variant="outline"
                style={{
                  borderColor: getColor('light', 'accent'),
                  color: getColor('light', 'accent')
                }}
              >
                Botón Acento
              </Button>
              <Button variant="secondary">
                Botón Secundario
              </Button>
            </div>
            <div className="mt-4 p-4 bg-white rounded border border-gray-200">
              <p className="text-sm text-gray-700">Ejemplo de card con el esquema de colores personalizado</p>
            </div>
          </div>
        </TabsContent>

        {/* TAB: Dark Mode */}
        <TabsContent value="dark" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Color Primario */}
            <div className="space-y-2">
              <Label htmlFor="dark-primary">Color Primario</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="dark-primary"
                  value={getColor('dark', 'primary')}
                  onChange={(e) => updateColor('dark', 'primary', e.target.value)}
                  className="h-10 w-16 rounded border cursor-pointer"
                />
                <Input
                  type="text"
                  value={getColor('dark', 'primary')}
                  onChange={(e) => updateColor('dark', 'primary', e.target.value)}
                  placeholder="#CED600"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Color Acento */}
            <div className="space-y-2">
              <Label htmlFor="dark-accent">Color Acento</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="dark-accent"
                  value={getColor('dark', 'accent')}
                  onChange={(e) => updateColor('dark', 'accent', e.target.value)}
                  className="h-10 w-16 rounded border cursor-pointer"
                />
                <Input
                  type="text"
                  value={getColor('dark', 'accent')}
                  onChange={(e) => updateColor('dark', 'accent', e.target.value)}
                  placeholder="#CED600"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Vista previa - Dark Mode */}
          <div
            className="mt-6 p-6 border rounded-lg space-y-4 bg-[#000000] border-gray-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-gray-300" />
              <p className="text-sm font-semibold text-gray-300">Vista Previa - Modo Oscuro</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                style={{
                  backgroundColor: getColor('dark', 'primary'),
                  color: '#000000'
                }}
              >
                Botón Primario
              </Button>
              <Button
                variant="outline"
                style={{
                  borderColor: getColor('dark', 'accent'),
                  color: getColor('dark', 'accent'),
                  backgroundColor: 'transparent'
                }}
              >
                Botón Acento
              </Button>
              <Button
                variant="secondary"
                className="bg-gray-800 text-gray-100"
              >
                Botón Secundario
              </Button>
            </div>
            <div className="mt-4 p-4 bg-gray-900 rounded border border-gray-800">
              <p className="text-sm text-gray-300">Ejemplo de card con el esquema de colores personalizado</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Botones de acción */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Resetear a Defaults
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      {/* Nota informativa */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Nota:</strong> Los cambios de colores se aplicarán automáticamente cuando los usuarios de esta empresa accedan al workspace. No es necesario que reinicien sesión.
        </p>
      </div>
    </div>
  )
}
