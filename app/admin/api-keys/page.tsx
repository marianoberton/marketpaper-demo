'use client'

import { useEffect, useState } from 'react'
import { PlusCircle, Key, Copy, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  created_at: string
  last_used?: string
  is_active: boolean
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentKey, setCurrentKey] = useState<Partial<ApiKey>>({})
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockApiKeys: ApiKey[] = [
      {
        id: '1',
        name: 'Webhook Integration',
        key: 'sk_live_51234567890abcdef',
        permissions: ['read', 'write'],
        created_at: '2024-01-15',
        last_used: '2024-01-20',
        is_active: true
      },
      {
        id: '2', 
        name: 'Mobile App API',
        key: 'sk_live_98765432109876543',
        permissions: ['read'],
        created_at: '2024-01-10',
        is_active: true
      }
    ];
    
    setApiKeys(mockApiKeys);
    setIsLoading(false);
  }, []);

  const handleCreateApiKey = async () => {
    if (!currentKey.name) {
      toast.error('El nombre es obligatorio.')
      return;
    }
    
    try {
      // Generate a mock API key - in real implementation, this would be done server-side
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: currentKey.name,
        key: `sk_live_${Math.random().toString(36).substring(2, 32)}`,
        permissions: currentKey.permissions || ['read'],
        created_at: new Date().toISOString().split('T')[0],
        is_active: true
      };
      
      setApiKeys(prev => [...prev, newKey]);
      
      toast.success(`API Key "${newKey.name}" creada.`)
      setIsDialogOpen(false)
      setCurrentKey({})

    } catch (error: any) {
      toast.error('No se pudo crear la API key.');
      console.error(error);
    }
  }
  
  const handleOpenDialog = () => {
    setCurrentKey({});
    setIsDialogOpen(true);
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('API Key copiada al portapapeles');
  }

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  }

  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 8) + '...';
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestión de API Keys"
        description="Administra las claves API para integraciones y acceso programático a la plataforma."
        accentColor="plum"
      />
      
      <div className="flex justify-end">
        <Button onClick={handleOpenDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear API Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys Activas</CardTitle>
          <CardDescription>
            Gestiona las claves de acceso para integraciones externas y automatizaciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {!isLoading && apiKeys.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Key className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-semibold mt-4">No hay API Keys</h3>
                <p className="text-muted-foreground mt-2">
                  Crea tu primera API key para habilitar integraciones.
                </p>
              </div>
            )}
            {apiKeys.map(apiKey => (
              <div key={apiKey.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4 flex-1">
                  <Key className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{apiKey.name}</p>
                      <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                        {apiKey.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                      </span>
                      <span>•</span>
                      <span>Permisos: {apiKey.permissions.join(', ')}</span>
                      {apiKey.last_used && (
                        <>
                          <span>•</span>
                          <span>Último uso: {new Date(apiKey.last_used).toLocaleDateString('es-ES')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => toggleKeyVisibility(apiKey.id)}
                    title={showKeys[apiKey.id] ? 'Ocultar key' : 'Mostrar key'}
                  >
                    {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(apiKey.key)}
                    title="Copiar API key"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" title="Eliminar API key">
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
            <DialogTitle>Crear Nueva API Key</DialogTitle>
            <DialogDescription>
              La API key se generará automáticamente. Guárdala en un lugar seguro ya que no podrás verla nuevamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nombre</Label>
              <Input 
                id="name" 
                value={currentKey.name || ''} 
                onChange={(e) => setCurrentKey(p => ({ ...p, name: e.target.value }))} 
                className="col-span-3" 
                placeholder="Ej: Webhook Integration" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="permissions" className="text-right">Permisos</Label>
              <Select 
                onValueChange={(value) => setCurrentKey(p => ({ ...p, permissions: [value] }))} 
                defaultValue="read"
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona permisos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Solo lectura</SelectItem>
                  <SelectItem value="write">Lectura y escritura</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateApiKey}>Crear API Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 