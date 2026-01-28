'use client'

import { useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    ArrowLeft,
    Building2,
    UserPlus,
    Plus,
    DollarSign,
    Calendar,
    FileText,
    ExternalLink,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Users,
    Clock,
    Edit,
    Trash2,
    TrendingUp
} from 'lucide-react'

// Mock deal data
const MOCK_DEAL = {
    id: '1',
    title: 'Implementación ERP',
    value: 45000,
    probability: 20,
    stage: 'prospecto',
    createdAt: '2024-01-15',
    description: 'Implementación completa de sistema ERP para gestión empresarial integral.',
    notes: 'Cliente interesado en módulos de contabilidad y facturación.',
    procedureType: null as string | null,
    company: null as {
        id: string
        name: string
        cuit: string
        email: string
        phone: string
        address: string
        industry: string
    } | null,
    contacts: [] as Array<{
        id: string
        name: string
        email: string
        phone: string
        role: string
        isPrimary: boolean
    }>
}

// Procedure types
const PROCEDURE_TYPES = [
    { id: 'inscripcion_rne', name: 'Inscripción RNE', description: 'Registro Nacional de Empresas' },
    { id: 'inscripcion_igj', name: 'Inscripción IGJ', description: 'Inspección General de Justicia' },
    { id: 'modificacion_estatuto', name: 'Modificación de Estatuto', description: 'Cambio estatutario' },
    { id: 'aumento_capital', name: 'Aumento de Capital', description: 'Incremento de capital social' },
    { id: 'cambio_autoridades', name: 'Cambio de Autoridades', description: 'Nuevas designaciones' },
    { id: 'disolucion', name: 'Disolución', description: 'Cierre de sociedad' },
]

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
    prospecto: { label: 'Prospecto', color: 'bg-blue-100 text-blue-700' },
    presupuesto_enviado: { label: 'Presupuesto Enviado', color: 'bg-amber-100 text-amber-700' },
    ganado: { label: 'Ganado', color: 'bg-green-100 text-green-700' },
    perdido: { label: 'Perdido', color: 'bg-red-100 text-red-700' },
}

export default function DealDetailClientPage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const dealId = params.id as string
    const companyId = searchParams.get('company_id')

    const [deal, setDeal] = useState(MOCK_DEAL)
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
    const [isContactModalOpen, setIsContactModalOpen] = useState(false)

    // Company form state
    const [companyForm, setCompanyForm] = useState({
        name: '',
        cuit: '',
        email: '',
        phone: '',
        address: '',
        industry: ''
    })

    // Contact form state
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        isPrimary: false
    })

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(value)
    }

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
    }

    const handleCreateCompany = () => {
        const newCompany = {
            id: Date.now().toString(),
            ...companyForm
        }
        setDeal(prev => ({ ...prev, company: newCompany }))
        setIsCompanyModalOpen(false)
        setCompanyForm({ name: '', cuit: '', email: '', phone: '', address: '', industry: '' })
    }

    const handleAddContact = () => {
        const newContact = {
            id: Date.now().toString(),
            ...contactForm
        }
        setDeal(prev => ({
            ...prev,
            contacts: [...prev.contacts, newContact]
        }))
        setIsContactModalOpen(false)
        setContactForm({ name: '', email: '', phone: '', role: '', isPrimary: false })
    }

    const handleSelectProcedureType = (typeId: string) => {
        setDeal(prev => ({ ...prev, procedureType: typeId }))
    }

    const stageConfig = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.prospecto

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/workspace/ventas${companyId ? `?company_id=${companyId}` : ''}`)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">{deal.title}</h1>
                            <Badge className={stageConfig.color}>{stageConfig.label}</Badge>
                        </div>
                        <p className="text-gray-500">ID: {dealId}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Quote Button */}
                    <Button
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => window.open('https://inted-tools.vercel.app/presupuestador', '_blank')}
                    >
                        <FileText className="h-4 w-4" />
                        Cotizar
                        <ExternalLink className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Deal Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-indigo-600" />
                                Información del Deal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Valor Estimado</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(deal.value)}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Probabilidad</p>
                                    <p className="text-2xl font-bold text-gray-900">{deal.probability}%</p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-gray-500">Descripción</Label>
                                <p className="mt-1 text-gray-700">{deal.description}</p>
                            </div>

                            <div>
                                <Label className="text-gray-500">Notas</Label>
                                <p className="mt-1 text-gray-700">{deal.notes || 'Sin notas'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Procedure Type Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-indigo-600" />
                                Tipo de Trámite a Cotizar
                            </CardTitle>
                            <CardDescription>Seleccioná el tipo de trámite para generar la cotización</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {PROCEDURE_TYPES.map((type) => (
                                    <div
                                        key={type.id}
                                        onClick={() => handleSelectProcedureType(type.id)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${deal.procedureType === type.id
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`font-medium ${deal.procedureType === type.id ? 'text-indigo-700' : 'text-gray-900'}`}>
                                                    {type.name}
                                                </p>
                                                <p className="text-sm text-gray-500">{type.description}</p>
                                            </div>
                                            {deal.procedureType === type.id && (
                                                <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {deal.procedureType && (
                                <div className="mt-4 pt-4 border-t">
                                    <Button
                                        className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
                                        onClick={() => window.open('https://inted-tools.vercel.app/presupuestador', '_blank')}
                                    >
                                        <FileText className="h-4 w-4" />
                                        Generar Cotización para {PROCEDURE_TYPES.find(t => t.id === deal.procedureType)?.name}
                                        <ExternalLink className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Company & Contacts */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-indigo-600" />
                                    Empresa y Contactos
                                </CardTitle>
                                {!deal.company && (
                                    <Dialog open={isCompanyModalOpen} onOpenChange={setIsCompanyModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="gap-2">
                                                <Plus className="h-4 w-4" />
                                                Crear Empresa
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-lg">
                                            <DialogHeader>
                                                <DialogTitle>Crear Nueva Empresa</DialogTitle>
                                                <DialogDescription>
                                                    Ingresá los datos de la empresa asociada a este deal
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="col-span-2">
                                                        <Label htmlFor="company-name">Razón Social *</Label>
                                                        <Input
                                                            id="company-name"
                                                            value={companyForm.name}
                                                            onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}
                                                            placeholder="Nombre de la empresa"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="company-cuit">CUIT</Label>
                                                        <Input
                                                            id="company-cuit"
                                                            value={companyForm.cuit}
                                                            onChange={(e) => setCompanyForm(prev => ({ ...prev, cuit: e.target.value }))}
                                                            placeholder="30-12345678-9"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="company-industry">Industria</Label>
                                                        <Input
                                                            id="company-industry"
                                                            value={companyForm.industry}
                                                            onChange={(e) => setCompanyForm(prev => ({ ...prev, industry: e.target.value }))}
                                                            placeholder="Tecnología, Comercio..."
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="company-email">Email</Label>
                                                        <Input
                                                            id="company-email"
                                                            type="email"
                                                            value={companyForm.email}
                                                            onChange={(e) => setCompanyForm(prev => ({ ...prev, email: e.target.value }))}
                                                            placeholder="contacto@empresa.com"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="company-phone">Teléfono</Label>
                                                        <Input
                                                            id="company-phone"
                                                            value={companyForm.phone}
                                                            onChange={(e) => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))}
                                                            placeholder="+54 11 1234-5678"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <Label htmlFor="company-address">Dirección</Label>
                                                        <Input
                                                            id="company-address"
                                                            value={companyForm.address}
                                                            onChange={(e) => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                                                            placeholder="Av. Corrientes 1234, CABA"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsCompanyModalOpen(false)}>
                                                    Cancelar
                                                </Button>
                                                <Button onClick={handleCreateCompany} disabled={!companyForm.name}>
                                                    Crear Empresa
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {deal.company ? (
                                <div className="space-y-6">
                                    {/* Company Info */}
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                    <Building2 className="h-6 w-6 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{deal.company.name}</h4>
                                                    <p className="text-sm text-gray-500">{deal.company.industry}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            {deal.company.cuit && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Briefcase className="h-4 w-4" />
                                                    <span>{deal.company.cuit}</span>
                                                </div>
                                            )}
                                            {deal.company.email && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Mail className="h-4 w-4" />
                                                    <span>{deal.company.email}</span>
                                                </div>
                                            )}
                                            {deal.company.phone && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone className="h-4 w-4" />
                                                    <span>{deal.company.phone}</span>
                                                </div>
                                            )}
                                            {deal.company.address && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{deal.company.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contacts Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                Contactos ({deal.contacts.length})
                                            </h4>
                                            <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="gap-1">
                                                        <UserPlus className="h-4 w-4" />
                                                        Agregar
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Agregar Contacto</DialogTitle>
                                                        <DialogDescription>
                                                            Agregá una persona de contacto para esta empresa
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div>
                                                            <Label htmlFor="contact-name">Nombre Completo *</Label>
                                                            <Input
                                                                id="contact-name"
                                                                value={contactForm.name}
                                                                onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                                                                placeholder="Juan Pérez"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="contact-role">Cargo</Label>
                                                            <Input
                                                                id="contact-role"
                                                                value={contactForm.role}
                                                                onChange={(e) => setContactForm(prev => ({ ...prev, role: e.target.value }))}
                                                                placeholder="Gerente General, CEO..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="contact-email">Email</Label>
                                                            <Input
                                                                id="contact-email"
                                                                type="email"
                                                                value={contactForm.email}
                                                                onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                                                                placeholder="juan@empresa.com"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="contact-phone">Teléfono</Label>
                                                            <Input
                                                                id="contact-phone"
                                                                value={contactForm.phone}
                                                                onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                                                                placeholder="+54 11 1234-5678"
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setIsContactModalOpen(false)}>
                                                            Cancelar
                                                        </Button>
                                                        <Button onClick={handleAddContact} disabled={!contactForm.name}>
                                                            Agregar Contacto
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>

                                        {deal.contacts.length > 0 ? (
                                            <div className="space-y-2">
                                                {deal.contacts.map((contact) => (
                                                    <div key={contact.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarFallback className="bg-gray-100 text-gray-600">
                                                                    {getInitials(contact.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium text-gray-900">{contact.name}</p>
                                                                <p className="text-sm text-gray-500">{contact.role || 'Sin cargo'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            {contact.email && (
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <Mail className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {contact.phone && (
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <Phone className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                                                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">Sin contactos agregados</p>
                                                <p className="text-xs">Agregá personas de contacto para esta empresa</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                    <p className="text-lg font-medium">Sin empresa asociada</p>
                                    <p className="text-sm mb-4">Creá una empresa para asociar este deal</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Acciones Rápidas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={() => window.open('https://inted-tools.vercel.app/presupuestador', '_blank')}
                            >
                                <FileText className="h-4 w-4" />
                                Ir al Presupuestador
                                <ExternalLink className="h-3 w-3 ml-auto" />
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2">
                                <Mail className="h-4 w-4" />
                                Enviar Email
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2">
                                <Calendar className="h-4 w-4" />
                                Agendar Reunión
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Actividad Reciente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="h-2 w-2 mt-2 rounded-full bg-indigo-500" />
                                    <div>
                                        <p className="text-sm font-medium">Deal creado</p>
                                        <p className="text-xs text-gray-500">{deal.createdAt}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="h-2 w-2 mt-2 rounded-full bg-gray-300" />
                                    <div>
                                        <p className="text-sm text-gray-500">Sin más actividad</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Deal Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Resumen</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Estado</span>
                                <Badge className={stageConfig.color}>{stageConfig.label}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Valor</span>
                                <span className="font-medium">{formatCurrency(deal.value)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Probabilidad</span>
                                <span className="font-medium">{deal.probability}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Creado</span>
                                <span className="font-medium">{deal.createdAt}</span>
                            </div>
                            {deal.procedureType && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Trámite</span>
                                    <span className="font-medium">{PROCEDURE_TYPES.find(t => t.id === deal.procedureType)?.name}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
