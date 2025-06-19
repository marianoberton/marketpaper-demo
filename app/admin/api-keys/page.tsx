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
        const response = await fetch('/api/admin/templates');
        if (!response.ok) throw new Error('Failed to fetch initial data');
        const data = await response.json();
        // La API devuelve un objeto { templates: [], availableModules: [] }
        setModules(data.availableModules || []);
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
      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Action': 'Create-Module', // Custom header for our workaround
        },
        body: JSON.stringify(currentModule),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save module');
      }

      const newModule = await response.json();
      
      setModules(prev => [...prev, newModule]);
      
      toast.success(`Módulo "${newModule.name}" guardado.`)
      setIsDialogOpen(false)
      setCurrentModule({})

    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar el módulo.');
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
          <div className="divide-y divide-border">
            {!isLoading && modules.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <PackageSearch className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-semibold mt-4">No hay módulos dinámicos</h3>
                <p className="text-muted-foreground mt-2">
                  Crea tu primer módulo para poder asignarlo a un template.
                </p>
              </div>
            )}
            {modules.map(module => (
              <div key={module.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <Box className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{module.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Ruta: {module.route_path} | Categoría: {module.category} | Icono: {module.icon}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleOpenDialog(module)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentModule.id ? 'Editar Módulo' : 'Crear Nuevo Módulo'}</DialogTitle>
            <DialogDescription>
              Completa los detalles del módulo. Estos se usarán para mostrarlo en el sidebar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nombre</Label>
              <Input id="name" value={currentModule.name || ''} onChange={(e) => setCurrentModule(p => ({ ...p, name: e.target.value }))} className="col-span-3" placeholder="Ej: Gestión Documental" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="route_path" className="text-right">Ruta</Label>
              <Input id="route_path" value={currentModule.route_path || ''} onChange={(e) => setCurrentModule(p => ({ ...p, route_path: e.target.value }))} className="col-span-3" placeholder="Ej: /documentos" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="icon" className="text-right">Icono</Label>
              <Input id="icon" value={currentModule.icon || ''} onChange={(e) => setCurrentModule(p => ({ ...p, icon: e.target.value }))} className="col-span-3" placeholder="Ej: FileText (de lucide-react)" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Categoría</Label>
              <Select onValueChange={(value: 'Dashboard' | 'Workspace') => setCurrentModule(p => ({ ...p, category: value }))} value={currentModule.category}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dashboard">Dashboard</SelectItem>
                  <SelectItem value="Workspace">Workspace</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveModule}>Guardar Módulo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 