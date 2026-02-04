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
import { useWorkspace } from '@/components/workspace-context'
import { TicketAttachmentUpload } from '../components/TicketAttachmentUpload'

interface Category {
    id: string
    name: string
    description: string | null
    color: string
    icon: string
}

interface Attachment {
    id?: string
    file_name: string
    file_path: string
    file_size: number
    file_type: string
    publicUrl: string
}

export default function NuevoTicketClientPage() {
    const router = useRouter()
    const { companyId } = useWorkspace()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [subject, setSubject] = useState('')
    const [description, setDescription] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [priority, setPriority] = useState('medium')
    const [attachments, setAttachments] = useState<Attachment[]>([])

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
            setError('La descripcion es requerida')
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
                // Associate pending attachments with the new ticket
                const ticketId = data.ticket.id
                for (const att of attachments) {
                    try {
                        await fetch(`/api/workspace/tickets/${ticketId}/attachments`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                file_name: att.file_name,
                                file_path: att.file_path,
                                file_size: att.file_size,
                                file_type: att.file_type
                            })
                        })
                    } catch (err) {
                        console.error('Error associating attachment:', err)
                    }
                }
                router.push(`/workspace/soporte/${ticketId}`)
            } else {
                setError(data.error || 'Error al crear el ticket')
            }
        } catch (err) {
            console.error('Error creating ticket:', err)
            setError('Error de conexion')
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
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Ticket className="h-5 w-5 text-blue-600" />
                        Nuevo Ticket de Soporte
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
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
                            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-2">
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
                                <Label htmlFor="category">Categoria</Label>
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
                                        <SelectItem value="low">Baja</SelectItem>
                                        <SelectItem value="medium">Media</SelectItem>
                                        <SelectItem value="high">Alta</SelectItem>
                                        <SelectItem value="urgent">Urgente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripcion *</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe detalladamente tu problema o consulta. Incluye cualquier informacion relevante como pasos para reproducir el problema, mensajes de error, etc."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[150px]"
                            />
                            <p className="text-xs text-gray-400">
                                Mientras mas detallada sea la descripcion, mas rapido podremos ayudarte
                            </p>
                        </div>

                        {/* Attachments */}
                        {companyId && (
                            <div className="space-y-2">
                                <Label>Adjuntos (opcional)</Label>
                                <TicketAttachmentUpload
                                    companyId={companyId}
                                    attachments={attachments}
                                    onAttachmentUploaded={(att) => setAttachments(prev => [...prev, att])}
                                    onAttachmentRemoved={(index) => setAttachments(prev => prev.filter((_, i) => i !== index))}
                                    disabled={loading}
                                />
                            </div>
                        )}

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
