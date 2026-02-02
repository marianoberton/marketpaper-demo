'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Key,
    PlusCircle,
    MoreHorizontal,
    RefreshCw,
    Trash2,
    Edit,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Eye,
    EyeOff,
    Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface Integration {
    id: string
    company_id: string
    provider: string
    provider_label: string
    name: string
    environment: string
    config: Record<string, any>
    is_active: boolean
    last_used_at: string | null
    last_verified_at: string | null
    verification_status: string
    created_at: string
    updated_at: string
}

interface IntegrationsTabProps {
    companyId: string
}

const PROVIDERS = [
    { id: 'openai', label: 'OpenAI', fields: ['api_key'], optional: ['organization_id'] },
    { id: 'gemini', label: 'Google Gemini', fields: ['api_key'] },
    { id: 'anthropic', label: 'Anthropic (Claude)', fields: ['api_key'] },
    { id: 'hubspot', label: 'HubSpot', fields: ['api_key'], optional: ['portal_id'] },
    { id: 'custom', label: 'Custom API', fields: ['api_key'], optional: ['base_url'] },
]

const ENVIRONMENTS = [
    { id: 'production', label: 'Producción' },
    { id: 'sandbox', label: 'Sandbox' },
    { id: 'development', label: 'Desarrollo' },
]

export function IntegrationsTab({ companyId }: IntegrationsTabProps) {
    const [integrations, setIntegrations] = useState<Integration[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isRotateOpen, setIsRotateOpen] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
    const [saving, setSaving] = useState(false)

    // Form state
    const [formProvider, setFormProvider] = useState('')
    const [formName, setFormName] = useState('')
    const [formEnvironment, setFormEnvironment] = useState('production')
    const [formCredentials, setFormCredentials] = useState<Record<string, string>>({})
    const [showApiKey, setShowApiKey] = useState(false)

    // Fetch integrations
    const fetchIntegrations = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/companies/${companyId}/integrations`)
            const data = await response.json()

            if (data.success) {
                setIntegrations(data.integrations || [])
            } else {
                toast.error(data.error || 'Error al cargar integraciones')
            }
        } catch (error) {
            console.error('Error fetching integrations:', error)
            toast.error('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchIntegrations()
    }, [companyId])

    // Reset form
    const resetForm = () => {
        setFormProvider('')
        setFormName('')
        setFormEnvironment('production')
        setFormCredentials({})
        setShowApiKey(false)
    }

    // Handle create
    const handleCreate = async () => {
        if (!formProvider || !formName || !formCredentials.api_key) {
            toast.error('Completá todos los campos requeridos')
            return
        }

        setSaving(true)
        try {
            const response = await fetch(`/api/admin/companies/${companyId}/integrations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: formProvider,
                    name: formName,
                    environment: formEnvironment,
                    credentials: formCredentials
                })
            })

            const data = await response.json()

            if (data.success) {
                toast.success('Integración creada correctamente')
                setIsCreateOpen(false)
                resetForm()
                fetchIntegrations()
            } else {
                toast.error(data.error || 'Error al crear integración')
            }
        } catch (error) {
            console.error('Error creating integration:', error)
            toast.error('Error de conexión')
        } finally {
            setSaving(false)
        }
    }

    // Handle rotate key
    const handleRotateKey = async () => {
        if (!selectedIntegration || !formCredentials.api_key) {
            toast.error('Ingresá la nueva API Key')
            return
        }

        setSaving(true)
        try {
            const response = await fetch(`/api/admin/companies/${companyId}/integrations`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    integrationId: selectedIntegration.id,
                    credentials: formCredentials
                })
            })

            const data = await response.json()

            if (data.success) {
                toast.success('API Key rotada correctamente')
                setIsRotateOpen(false)
                setSelectedIntegration(null)
                resetForm()
                fetchIntegrations()
            } else {
                toast.error(data.error || 'Error al rotar key')
            }
        } catch (error) {
            console.error('Error rotating key:', error)
            toast.error('Error de conexión')
        } finally {
            setSaving(false)
        }
    }

    // Handle toggle active
    const handleToggleActive = async (integration: Integration) => {
        try {
            const response = await fetch(`/api/admin/companies/${companyId}/integrations`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    integrationId: integration.id,
                    is_active: !integration.is_active
                })
            })

            const data = await response.json()

            if (data.success) {
                toast.success(integration.is_active ? 'Integración desactivada' : 'Integración activada')
                fetchIntegrations()
            } else {
                toast.error(data.error || 'Error al actualizar')
            }
        } catch (error) {
            console.error('Error toggling active:', error)
            toast.error('Error de conexión')
        }
    }

    // Handle delete
    const handleDelete = async (integrationId: string) => {
        try {
            const response = await fetch(
                `/api/admin/companies/${companyId}/integrations?integrationId=${integrationId}`,
                { method: 'DELETE' }
            )

            const data = await response.json()

            if (data.success) {
                toast.success('Integración eliminada')
                setDeleteConfirm(null)
                fetchIntegrations()
            } else {
                toast.error(data.error || 'Error al eliminar')
            }
        } catch (error) {
            console.error('Error deleting:', error)
            toast.error('Error de conexión')
        }
    }

    // Get verification badge
    const getVerificationBadge = (status: string) => {
        switch (status) {
            case 'valid':
                return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Válida</Badge>
            case 'invalid':
                return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Inválida</Badge>
            case 'expired':
                return <Badge className="bg-orange-100 text-orange-700"><AlertTriangle className="h-3 w-3 mr-1" />Expirada</Badge>
            default:
                return <Badge className="bg-gray-100 text-gray-700"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
        }
    }

    // Get environment badge
    const getEnvironmentBadge = (env: string) => {
        const colors: Record<string, string> = {
            production: 'bg-blue-100 text-blue-700',
            sandbox: 'bg-yellow-100 text-yellow-700',
            development: 'bg-purple-100 text-purple-700'
        }
        const labels: Record<string, string> = {
            production: 'Prod',
            sandbox: 'Sandbox',
            development: 'Dev'
        }
        return <Badge className={colors[env] || 'bg-gray-100'}>{labels[env] || env}</Badge>
    }

    // Get provider for form
    const selectedProvider = PROVIDERS.find(p => p.id === formProvider)

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Integraciones y API Keys
                    </CardTitle>
                    <CardDescription>
                        Gestiona las credenciales de servicios externos para esta empresa
                    </CardDescription>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <PlusCircle className="h-4 w-4" />
                            Agregar Integración
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Nueva Integración</DialogTitle>
                            <DialogDescription>
                                Agregá una nueva integración con sus credenciales
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Proveedor *</Label>
                                <Select value={formProvider} onValueChange={(v) => { setFormProvider(v); setFormCredentials({}); }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar proveedor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROVIDERS.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="int-name">Nombre Identificativo *</Label>
                                <Input
                                    id="int-name"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="Ej: OpenAI Producción"
                                />
                            </div>

                            <div>
                                <Label>Entorno</Label>
                                <Select value={formEnvironment} onValueChange={setFormEnvironment}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ENVIRONMENTS.map(e => (
                                            <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedProvider && (
                                <>
                                    <div className="border-t pt-4">
                                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                            Credenciales para {selectedProvider.label}
                                        </Label>
                                    </div>

                                    <div>
                                        <Label htmlFor="api-key">API Key *</Label>
                                        <div className="relative">
                                            <Input
                                                id="api-key"
                                                type={showApiKey ? 'text' : 'password'}
                                                value={formCredentials.api_key || ''}
                                                onChange={(e) => setFormCredentials({ ...formCredentials, api_key: e.target.value })}
                                                placeholder="sk-..."
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {selectedProvider.optional?.map(field => (
                                        <div key={field}>
                                            <Label htmlFor={field}>{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (opcional)</Label>
                                            <Input
                                                id={field}
                                                value={formCredentials[field] || ''}
                                                onChange={(e) => setFormCredentials({ ...formCredentials, [field]: e.target.value })}
                                                placeholder={`${field}...`}
                                            />
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                            <Button onClick={handleCreate} disabled={saving || !formProvider || !formName || !formCredentials.api_key}>
                                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Crear Integración
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : integrations.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Key className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">Sin integraciones</p>
                        <p className="text-sm">Agregá tu primera integración para conectar servicios externos</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Proveedor</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Entorno</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Verificación</TableHead>
                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {integrations.map((integration) => (
                                <TableRow key={integration.id} className={!integration.is_active ? 'opacity-50' : ''}>
                                    <TableCell className="font-medium">{integration.provider_label}</TableCell>
                                    <TableCell>{integration.name}</TableCell>
                                    <TableCell>{getEnvironmentBadge(integration.environment)}</TableCell>
                                    <TableCell>
                                        <Badge className={integration.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                                            {integration.is_active ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{getVerificationBadge(integration.verification_status)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedIntegration(integration)
                                                    setIsRotateOpen(true)
                                                    setFormCredentials({})
                                                }}>
                                                    <RefreshCw className="h-4 w-4 mr-2" />
                                                    Rotar API Key
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleActive(integration)}>
                                                    {integration.is_active ? (
                                                        <><XCircle className="h-4 w-4 mr-2" />Desactivar</>
                                                    ) : (
                                                        <><CheckCircle2 className="h-4 w-4 mr-2" />Activar</>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => setDeleteConfirm(integration.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            {/* Rotate Key Dialog */}
            <Dialog open={isRotateOpen} onOpenChange={(open) => { setIsRotateOpen(open); if (!open) { setSelectedIntegration(null); resetForm(); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rotar API Key</DialogTitle>
                        <DialogDescription>
                            Ingresá la nueva API Key para {selectedIntegration?.provider_label} - {selectedIntegration?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="new-api-key">Nueva API Key *</Label>
                            <div className="relative">
                                <Input
                                    id="new-api-key"
                                    type={showApiKey ? 'text' : 'password'}
                                    value={formCredentials.api_key || ''}
                                    onChange={(e) => setFormCredentials({ api_key: e.target.value })}
                                    placeholder="sk-..."
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRotateOpen(false)}>Cancelar</Button>
                        <Button onClick={handleRotateKey} disabled={saving || !formCredentials.api_key}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Rotar Key
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar integración?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La integración y sus credenciales serán eliminadas permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
