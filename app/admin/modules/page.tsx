'use client'

import { useEffect, useState } from 'react'
import { PlusCircle, Edit, Trash2, Box, ServerCrash, PackageSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Module {
  id?: string
  name: string
  route_path: string
  icon: string
  category: 'Dashboard' | 'Workspace'
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentModule, setCurrentModule] = useState<Partial<Module>>({})

  useEffect(() => {
    const fetchModules = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/modules');
        if (!response.ok) throw new Error('Failed to fetch modules');
        const data = await response.json();
        setModules(data || []);
      } catch (error) {
        toast.error('Error al cargar los módulos.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchModules();
  }, []);

  const handleSaveModule = async () => {
    if (!currentModule.name || !currentModule.route_path || !currentModule.category || !currentModule.icon) {
      toast.error('Todos los campos son obligatorios.')
      return;
    }

    try {
      const isEdit = !!currentModule.id;
      const response = await fetch('/api/admin/modules', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentModule),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save module');
      }

      const savedModule = await response.json();

      if (isEdit) {
        setModules(prev => prev.map(m => m.id === savedModule.id ? savedModule : m));
        toast.success(`Módulo "${savedModule.name}" actualizado.`)
      } else {
        setModules(prev => [...prev, savedModule]);
        if (savedModule.filesCreated) {
          toast.success(`Módulo "${savedModule.name}" creado y archivos generados automáticamente.`)
        } else {
          toast.warning(`Módulo "${savedModule.name}" creado. Nota: Auto-generación de archivos solo funciona en desarrollo local.`)
        }
      }

      setIsDialogOpen(false)
      setCurrentModule({})

    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar el módulo.');
      console.error(error);
    }
  }

  const handleDeleteModule = async (moduleId: string, moduleName: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el módulo "${moduleName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/modules?id=${moduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete module');
      }

      setModules(prev => prev.filter(m => m.id !== moduleId));
      toast.success(`Módulo "${moduleName}" eliminado.`)

    } catch (error: any) {
      toast.error(error.message || 'No se pudo eliminar el módulo.');
      console.error(error);
    }
  }

  const handleOpenDialog = (module: Partial<Module> | null = null) => {
    setCurrentModule(module || {});
    setIsDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestor de Módulos Dinámicos"
        description="Crea y administra los módulos que estarán disponibles en la plataforma para asignar a los templates."
        accentColor="blue"
      />

      {/* Development Workflow Guide */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
            <Box className="h-5 w-5" />
            📚 Cómo crear un nuevo módulo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
            <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg border">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-2">1</div>
              <div className="font-medium">Crear aquí</div>
              <div className="text-gray-500 text-xs">Nombre, ruta, icono</div>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg border">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-2">2</div>
              <div className="font-medium">Auto-generación</div>
              <div className="text-gray-500 text-xs">Archivos creados en dev</div>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg border">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-2">3</div>
              <div className="font-medium">Personalizar</div>
              <div className="text-gray-500 text-xs">Editar código en IDE</div>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg border">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-2">4</div>
              <div className="font-medium">Deploy</div>
              <div className="text-gray-500 text-xs">Commit + push a prod</div>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg border">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold mb-2">5</div>
              <div className="font-medium">Asignar</div>
              <div className="text-gray-500 text-xs">En Templates</div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
            <span className="text-amber-600">⚠️</span>
            <div className="text-amber-800">
              <strong>Nota:</strong> La auto-generación de archivos solo funciona en desarrollo local.
              Los archivos se crean en <code className="bg-amber-100 px-1 rounded">app/(workspace)/workspace/[ruta]/</code>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Módulo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulos Disponibles</CardTitle>
          <CardDescription>
            Estos son los módulos que puedes asignar a los diferentes templates de clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isLoading && modules.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <PackageSearch className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold mt-4">No hay módulos dinámicos</h3>
              <p className="text-muted-foreground mt-2">
                Crea tu primer módulo para poder asignarlo a un template.
              </p>
            </div>
          )}

          {modules.length > 0 && (
            <div className="space-y-8">
              {/* Dashboard Modules */}
              <div>
                <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                  📊 Módulos Dashboard ({modules.filter(m => m.category === 'Dashboard').length})
                </h3>
                <div className="space-y-4">
                  {modules.filter(m => m.category === 'Dashboard').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Box className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No hay módulos Dashboard creados</p>
                    </div>
                  ) : (
                    modules
                      .filter(m => m.category === 'Dashboard')
                      .map(module => (
                        <div key={module.id} className="flex items-center justify-between py-4 border border-blue-100 rounded-lg px-4 bg-blue-50/30">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Box className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-blue-800">{module.name}</p>
                              <p className="text-sm text-blue-600">
                                🚀 {module.route_path} • 🎨 {module.icon}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleOpenDialog(module)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteModule(module.id!, module.name)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Workspace Modules */}
              <div>
                <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                  🏢 Módulos Workspace ({modules.filter(m => m.category === 'Workspace').length})
                </h3>
                <div className="space-y-4">
                  {modules.filter(m => m.category === 'Workspace').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Box className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No hay módulos Workspace creados</p>
                    </div>
                  ) : (
                    modules
                      .filter(m => m.category === 'Workspace')
                      .map(module => (
                        <div key={module.id} className="flex items-center justify-between py-4 border border-green-100 rounded-lg px-4 bg-green-50/30">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Box className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-green-800">{module.name}</p>
                              <p className="text-sm text-green-600">
                                🚀 {module.route_path} • 🎨 {module.icon}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleOpenDialog(module)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteModule(module.id!, module.name)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentModule.id ? 'Editar Módulo' : 'Crear Nuevo Módulo'}</DialogTitle>
            <DialogDescription>
              Completa los detalles del módulo. Estos se usarán para mostrarlo en el sidebar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Módulo</Label>
              <Input
                id="name"
                value={currentModule.name || ''}
                onChange={(e) => setCurrentModule(p => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Gestión Documental"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="route_path">Ruta del Módulo</Label>
              <Input
                id="route_path"
                value={currentModule.route_path || ''}
                onChange={(e) => setCurrentModule(p => ({ ...p, route_path: e.target.value }))}
                placeholder="Ej: /workspace/documentos"
              />
              <p className="text-xs text-muted-foreground">La ruta debe empezar con /workspace/</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icono (Lucide React)</Label>
              <Input
                id="icon"
                value={currentModule.icon || ''}
                onChange={(e) => setCurrentModule(p => ({ ...p, icon: e.target.value }))}
                placeholder="Ej: FileText, Users, BarChart3"
              />
              <p className="text-xs text-muted-foreground">Busca iconos en: <a href="https://lucide.dev/icons" target="_blank" className="text-blue-500 underline">lucide.dev/icons</a></p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select onValueChange={(value: 'Dashboard' | 'Workspace') => setCurrentModule(p => ({ ...p, category: value }))} value={currentModule.category}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dashboard">📊 Dashboard - Para métricas y análisis</SelectItem>
                  <SelectItem value="Workspace">🏢 Workspace - Para herramientas de trabajo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground border rounded-lg p-4 bg-muted/50 space-y-2">
              <p className="font-medium text-foreground">ℹ️ Diferencia entre categorías:</p>
              <ul className="space-y-2 text-xs">
                <li><strong>📊 Dashboard:</strong> Módulos que muestran métricas, reportes y análisis</li>
                <li><strong>🏢 Workspace:</strong> Módulos con herramientas de trabajo (CRM, proyectos, documentos, etc.)</li>
              </ul>
            </div>

            <div className="text-sm border rounded-lg p-4 bg-blue-50 border-blue-200 space-y-2">
              <p className="font-medium text-blue-800">🛠️ Herramienta de Desarrollo Local:</p>
              <ul className="space-y-1 text-xs text-blue-700">
                <li><strong>🏠 Local:</strong> Auto-genera archivos solo en desarrollo local</li>
                <li><strong>⚡ Rapidez:</strong> Crea estructura base automáticamente</li>
                <li><strong>📁 Archivos:</strong> <code>page.tsx</code> y <code>client-page.tsx</code></li>
                <li><strong>🎯 Objetivo:</strong> Acelerar desarrollo cuando clonas el repo</li>
                <li><strong>🌐 Producción:</strong> Los archivos ya existen, no se auto-generan</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" onClick={handleSaveModule}>
              {currentModule.id ? 'Actualizar Módulo' : 'Crear Módulo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 