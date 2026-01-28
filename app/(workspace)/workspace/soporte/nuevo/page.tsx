'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    ArrowLeft,
    Send,
    Ticket,
    AlertCircle,
    RefreshCw,
} from 'lucide-react'

interface Category {
    id: string
    name: string
    description: string | null
    color: string
    icon: string
}

export default function NewTicketPage() {
    const router = useRouter()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [subject, setSubject] = useState('')
    const [description, setDescription] = useState('')
    const [categoryId, setCategoryId] = useState('')
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

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
            const response = await fetch('/api/workspace/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: subject.trim(),
                    description: description.trim(),
                    category_id: categoryId || null,
                    priority
                })
            })

            const data = await response.json()

            if (data.success) {
                router.push(`/workspace/soporte/${data.ticket.id}`)
            } else {
                setError(data.error || 'Error al crear el ticket')
            }
        } catch (err) {
            console.error('Error creating ticket:', err)
            setError('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/workspace/soporte">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Ticket className="h-5 w-5 text-blue-600" />
                        Nuevo Ticket de Soporte
                    </h1>
                    <p className="text-sm text-gray-500">
                        Describe tu problema o consulta y te responderemos pronto
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Crear Ticket</CardTitle>
                    <CardDescription>
                        Completa los campos para crear un nuevo ticket de soporte
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="subject">Asunto *</Label>
                            <Input
                                id="subject"
                                placeholder="Ej: Problema al subir documentos"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                maxLength={200}
                            />
                            <p className="text-xs text-gray-400">
                                Describe brevemente el problema o consulta
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Categoría</Label>
                                <Select value={categoryId} onValueChange={setCategoryId}>
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
                                                <SelectItem key={cat.id} value={cat.id}>
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
                                <Label htmlFor="priority">Prioridad</Label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">🟢 Baja</SelectItem>
                                        <SelectItem value="medium">🟡 Media</SelectItem>
                                        <SelectItem value="high">🟠 Alta</SelectItem>
                                        <SelectItem value="urgent">🔴 Urgente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción *</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe detalladamente tu problema o consulta. Incluye cualquier información relevante como pasos para reproducir el problema, mensajes de error, etc."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[150px]"
                            />
                            <p className="text-xs text-gray-400">
                                Mientras más detallada sea la descripción, más rápido podremos ayudarte
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-1">
                                {loading ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                        Creando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Crear Ticket
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
