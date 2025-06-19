"use client";

import { WorkspaceLayout } from "@/components/workspace-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Settings, 
  Users,
  Database,
  Zap,
  Shield,
  Plus,
  Edit,
  Trash2,
  Save,
  Link,
  Star
} from "lucide-react";

export default function SettingsPage() {
  return (
    <WorkspaceLayout>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Configuración del CRM"
          description="Personaliza campos, scoring, integraciones y permisos para tu empresa"
          accentColor="plum"
        />

        {/* Configuración Principal */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Campos Personalizados */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Campos Personalizados</CardTitle>
                  <CardDescription>Configura campos específicos para tu negocio</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 border rounded">
                  <span className="text-sm">Industria</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 border rounded">
                  <span className="text-sm">Tamaño Empresa</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 border rounded">
                  <span className="text-sm">Presupuesto</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Campo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lead Scoring */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Lead Scoring</CardTitle>
                  <CardDescription>Define reglas de puntuación automática</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <span className="text-sm font-medium">Email abierto</span>
                    <p className="text-xs text-muted-foreground">+5 puntos</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <span className="text-sm font-medium">Página visitada</span>
                    <p className="text-xs text-muted-foreground">+10 puntos</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <span className="text-sm font-medium">Formulario completado</span>
                    <p className="text-xs text-muted-foreground">+25 puntos</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Regla
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Integraciones */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Link className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Integraciones</CardTitle>
                  <CardDescription>Conecta canales y herramientas externas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded"></div>
                    <span className="text-sm">WhatsApp Business</span>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded text-xs">Conectado</span>
                </div>
                <div className="flex justify-between items-center p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded"></div>
                    <span className="text-sm">Mailchimp</span>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 rounded text-xs">Desconectado</span>
                </div>
                <div className="flex justify-between items-center p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-500 rounded"></div>
                    <span className="text-sm">LinkedIn</span>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded text-xs">Conectado</span>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Integración
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gestión de Usuarios */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Gestión de Usuarios</CardTitle>
                  <CardDescription>Administra roles y permisos del equipo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <span className="text-sm font-medium">Ana Silva</span>
                    <p className="text-xs text-muted-foreground">Administrador</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <span className="text-sm font-medium">Carlos Mendez</span>
                    <p className="text-xs text-muted-foreground">SDR</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <span className="text-sm font-medium">Luis Torres</span>
                    <p className="text-xs text-muted-foreground">Manager</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Invitar Usuario
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Automatización */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Configuración IA</CardTitle>
                  <CardDescription>Ajusta workers y automatizaciones</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <span className="text-sm font-medium">Asistente de Prospección</span>
                    <p className="text-xs text-muted-foreground">Activo</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <span className="text-sm font-medium">Analista CRM</span>
                    <p className="text-xs text-muted-foreground">Activo</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <span className="text-sm font-medium">Clasificador de Leads</span>
                    <p className="text-xs text-muted-foreground">Pausado</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Configurar Worker
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Seguridad */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Seguridad & Privacidad</CardTitle>
                  <CardDescription>Configuración de acceso y datos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Autenticación 2FA</span>
                  <div className="w-10 h-6 bg-green-500 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Logs de actividad</span>
                  <div className="w-10 h-6 bg-green-500 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Backup automático</span>
                  <div className="w-10 h-6 bg-green-500 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  <Shield className="mr-2 h-4 w-4" />
                  Configurar Seguridad
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuración General */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración General del CRM</CardTitle>
            <CardDescription>
              Ajustes básicos y preferencias de la empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre de la Empresa</label>
                  <Input placeholder="FOMO Platform" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Moneda por Defecto</label>
                  <select className="w-full px-3 py-2 border rounded-md text-sm bg-background mt-1">
                    <option>USD - Dólar Estadounidense</option>
                    <option>EUR - Euro</option>
                    <option>MXN - Peso Mexicano</option>
                    <option>COP - Peso Colombiano</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Zona Horaria</label>
                  <select className="w-full px-3 py-2 border rounded-md text-sm bg-background mt-1">
                    <option>UTC-5 (Bogotá, Lima)</option>
                    <option>UTC-6 (México DF)</option>
                    <option>UTC-3 (Buenos Aires)</option>
                    <option>UTC+0 (Londres)</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Idioma del Sistema</label>
                  <select className="w-full px-3 py-2 border rounded-md text-sm bg-background mt-1">
                    <option>Español</option>
                    <option>English</option>
                    <option>Português</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Formato de Fecha</label>
                  <select className="w-full px-3 py-2 border rounded-md text-sm bg-background mt-1">
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Ciclo de Ventas Promedio (días)</label>
                  <Input placeholder="30" type="number" className="mt-1" />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
              <Button variant="outline">
                Cancelar
              </Button>
              <Button className="bg-brilliant-blue hover:bg-brilliant-blue/90">
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </WorkspaceLayout>
  );
} 