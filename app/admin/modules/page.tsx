'use client'

import { useEffect, useState } from 'react'
import { PlusCircle, Edit, Trash2, Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { toast } from 'sonner'

// Mock data for now, will be replaced with API call
const mockModules = [
  { id: '1', name: 'Gestión Documental', route_path: '/docs', icon: 'FileText', category: 'Workspace' },
  { id: '2', name: 'Facturación', route_path: '/billing', icon: 'Receipt', category: 'Workspace' },
  { id: '3', name: 'Soporte Avanzado', route_path: '/support', icon: 'LifeBuoy', category: 'Workspace' },
];

export default function ModulesPage() {
  const [modules, setModules] = useState(mockModules)
  const [isLoading, setIsLoading] = useState(false)

  // TODO: Fetch modules from API
  // useEffect(() => {
  //   const fetchModules = async () => {
  //     setIsLoading(true);
  //     try {
  //       const response = await fetch('/api/admin/modules');
  //       if (!response.ok) throw new Error('Failed to fetch modules');
  //       const data = await response.json();
  //       setModules(data);
  //     } catch (error) {
  //       toast.error('Error al cargar los módulos.');
  //       console.error(error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   fetchModules();
  // }, []);

  const handleCreateModule = () => {
    // TODO: Implement create module dialog
    toast.info('Funcionalidad para crear módulo en desarrollo.')
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestor de Módulos Dinámicos"
        description="Crea y administra los módulos disponibles en la plataforma."
      />
      
      <div className="flex justify-end">
        <Button onClick={handleCreateModule}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Módulo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulos Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
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
                  <Button variant="outline" size="icon">
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
    </div>
  )
} 