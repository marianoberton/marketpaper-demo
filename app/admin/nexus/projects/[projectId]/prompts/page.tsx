'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Save,
  RotateCcw,
  History,
  CheckCircle2,
  User,
  BookOpen,
  Shield,
} from 'lucide-react'
import { nexusApi } from '@/lib/nexus/api'
import type { NexusPromptLayer } from '@/lib/nexus/types'
import { toast } from 'sonner'

// Lazy load Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
      <p className="text-muted-foreground">Cargando editor...</p>
    </div>
  ),
})

const LAYER_TYPES = [
  { key: 'identity', label: 'Identidad', icon: User, description: 'Quién es el agente' },
  { key: 'instructions', label: 'Instrucciones', icon: BookOpen, description: 'Qué debe hacer' },
  { key: 'safety', label: 'Seguridad', icon: Shield, description: 'Qué NO debe hacer' },
] as const

type LayerType = (typeof LAYER_TYPES)[number]['key']

export default function PromptsPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const [layers, setLayers] = useState<NexusPromptLayer[]>([])
  const [activeTab, setActiveTab] = useState<LayerType>('identity')
  const [editContent, setEditContent] = useState<Record<string, string>>({})
  const [changeReason, setChangeReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    nexusApi
      .listPromptLayers(projectId)
      .then((res) => {
        setLayers(res.data)
        // Initialize edit content with active layers
        const content: Record<string, string> = {}
        for (const type of LAYER_TYPES) {
          const active = res.data.find((l) => l.layerType === type.key && l.isActive)
          content[type.key] = active?.content || ''
        }
        setEditContent(content)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  const activeLayer = layers.find((l) => l.layerType === activeTab && l.isActive)
  const layerVersions = layers
    .filter((l) => l.layerType === activeTab)
    .sort((a, b) => b.version - a.version)
  const hasChanges = activeLayer ? editContent[activeTab] !== activeLayer.content : !!editContent[activeTab]

  async function handleSave() {
    setSaving(true)
    try {
      const newLayer = await nexusApi.createPromptLayer(projectId, {
        layerType: activeTab,
        content: editContent[activeTab] || '',
        createdBy: 'admin',
        changeReason: changeReason || undefined,
      })
      // Activate it
      await nexusApi.activatePromptLayer(newLayer.id)
      toast.success(`Capa ${activeTab} v${newLayer.version} guardada y activada`)
      setChangeReason('')
      // Reload
      const res = await nexusApi.listPromptLayers(projectId)
      setLayers(res.data)
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    if (activeLayer) {
      setEditContent((prev) => ({ ...prev, [activeTab]: activeLayer.content }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/nexus/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prompt Layers</h1>
          <p className="text-muted-foreground">
            3 capas independientes, versionadas por separado
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LayerType)}>
        <TabsList className="grid w-full grid-cols-3">
          {LAYER_TYPES.map((type) => (
            <TabsTrigger key={type.key} value={type.key} className="gap-2">
              <type.icon className="h-4 w-4" />
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {LAYER_TYPES.map((type) => (
          <TabsContent key={type.key} value={type.key} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-4">
              {/* Editor */}
              <div className="lg:col-span-3 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{type.label}</CardTitle>
                        <CardDescription>{type.description}</CardDescription>
                      </div>
                      {activeLayer && (
                        <Badge variant="outline">
                          v{activeLayer.version}
                          {hasChanges && ' (modificado)'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="h-[400px] animate-pulse rounded-lg bg-muted" />
                    ) : (
                      <MonacoEditor
                        height="400px"
                        language="markdown"
                        theme="vs-dark"
                        value={editContent[type.key] || ''}
                        onChange={(val) =>
                          setEditContent((prev) => ({
                            ...prev,
                            [type.key]: val || '',
                          }))
                        }
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          wordWrap: 'on',
                          lineNumbers: 'off',
                          padding: { top: 16 },
                        }}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Save Controls */}
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Razón del cambio (opcional)"
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    className="max-w-md"
                  />
                  <Button
                    onClick={() => void handleSave()}
                    disabled={saving || !hasChanges}
                  >
                    <Save className="mr-1 h-4 w-4" />
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={!hasChanges}
                  >
                    <RotateCcw className="mr-1 h-4 w-4" />
                    Revertir
                  </Button>
                </div>
              </div>

              {/* Version History */}
              <div>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Historial
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {layerVersions.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin versiones</p>
                    ) : (
                      <div className="space-y-2">
                        {layerVersions.map((layer) => (
                          <button
                            key={layer.id}
                            className="w-full text-left p-2 rounded border hover:bg-accent/50 transition-colors text-xs"
                            onClick={() => {
                              setEditContent((prev) => ({
                                ...prev,
                                [type.key]: layer.content,
                              }))
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">v{layer.version}</span>
                              {layer.isActive && (
                                <Badge variant="default" className="text-[10px] px-1">
                                  <CheckCircle2 className="h-2 w-2 mr-0.5" />
                                  Activa
                                </Badge>
                              )}
                            </div>
                            {layer.changeReason && (
                              <p className="text-muted-foreground mt-0.5 truncate">
                                {layer.changeReason}
                              </p>
                            )}
                            <p className="text-muted-foreground mt-0.5">
                              {new Date(layer.createdAt).toLocaleDateString('es-AR')}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
