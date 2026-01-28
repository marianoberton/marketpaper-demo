'use client'

import { useState, useEffect } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    HeadphonesIcon,
    Send,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Building2,
    Mail,
    User,
    Phone,
    MessageSquare,
} from 'lucide-react'

interface Category {
    id: string
    name: string
    description: string | null
    color: string
}

export default function PublicSupportPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form fields
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [company, setCompany] = useState('')
    const [phone, setPhone] = useState('')
    const [subject, setSubject] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [priority, setPriority] = useState('medium')

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            setLoadingCategories(true)
            const response = await fetch('/api/admin/tickets/categories')
            const data = await response.json()

            if (data.success) {
                setCategories(data.categories)
            }
        } catch (err) {
            console.error('Error fetching categories:', err)
        } finally {
            setLoadingCategories(false)
        }
    }

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validaciones
        if (!name.trim()) {
            setError('El nombre es requerido')
            return
        }

        if (!email.trim()) {
            setError('El email es requerido')
            return
        }

        if (!validateEmail(email)) {
            setError('El email no es válido')
            return
        }

        if (!subject.trim()) {
            setError('El asunto es requerido')
            return
        }

        if (!description.trim()) {
            setError('La descripción es requerida')
            return
        }

        try {
            setLoading(true)
            const response = await fetch('/api/webhook/support-ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    company: company.trim() || null,
                    phone: phone.trim() || null,
                    subject: subject.trim(),
                    description: description.trim(),
                    category: category || null,
                    priority
                })
            })

            const data = await response.json()

            if (data.success) {
                setSuccess(true)
            } else {
                setError(data.error || 'Error al enviar el ticket')
            }
        } catch (err) {
            console.error('Error submitting ticket:', err)
            setError('Error de conexión. Por favor, intenta nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    const handleNewTicket = () => {
        setSuccess(false)
        setName('')
        setEmail('')
        setCompany('')
        setPhone('')
        setSubject('')
        setDescription('')
        setCategory('')
        setPriority('medium')
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <Card className="max-w-md w-full shadow-xl">
                    <CardContent className="pt-10 pb-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            ¡Ticket Enviado!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Hemos recibido tu solicitud. Te contactaremos pronto al email proporcionado.
                        </p>
                        <Button onClick={handleNewTicket} variant="outline">
                            Enviar otro ticket
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <HeadphonesIcon className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Soporte Técnico
                    </h1>
                    <p className="text-gray-600 mt-2">
                        ¿Tienes algún problema o consulta? Completa el formulario y te ayudaremos.
                    </p>
                </div>

                {/* Form Card */}
                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle>Crear Ticket de Soporte</CardTitle>
                        <CardDescription>
                            Completa todos los campos para que podamos ayudarte mejor
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Personal Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        Nombre completo *
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder="Tu nombre"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        Email *
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="tu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="company" className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        Empresa
                                    </Label>
                                    <Input
                                        id="company"
                                        placeholder="Nombre de tu empresa"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        Teléfono
                                    </Label>
                                    <Input
                                        id="phone"
                                        placeholder="+54 11 1234-5678"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            <hr className="my-4" />

                            {/* Ticket Info */}
                            <div className="space-y-2">
                                <Label htmlFor="subject" className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    Asunto *
                                </Label>
                                <Input
                                    id="subject"
                                    placeholder="Describe brevemente tu problema"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    maxLength={200}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Categoría</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {loadingCategories ? (
                                                <div className="flex items-center justify-center py-2">
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                </div>
                                            ) : (
                                                categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.name}>
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: cat.color }}
                                                            />
                                                            {cat.name}
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="priority">Urgencia</Label>
                                    <Select value={priority} onValueChange={setPriority}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">🟢 Baja - Puede esperar</SelectItem>
                                            <SelectItem value="medium">🟡 Media - Normal</SelectItem>
                                            <SelectItem value="high">🟠 Alta - Importante</SelectItem>
                                            <SelectItem value="urgent">🔴 Urgente - Crítico</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción detallada *</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe tu problema o consulta con el mayor detalle posible. Incluye pasos para reproducir el problema, mensajes de error, capturas de pantalla si es posible, etc."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="min-h-[150px]"
                                />
                                <p className="text-xs text-gray-400">
                                    Cuanta más información proporciones, más rápido podremos ayudarte.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 text-base"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Enviar Ticket
                                    </>
                                )}
                            </Button>

                            <p className="text-xs text-gray-400 text-center">
                                Al enviar este formulario, aceptas que nos contactemos contigo por email para resolver tu consulta.
                            </p>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-8">
                    © {new Date().getFullYear()} Market Paper - Todos los derechos reservados
                </p>
            </div>
        </div>
    )
}
