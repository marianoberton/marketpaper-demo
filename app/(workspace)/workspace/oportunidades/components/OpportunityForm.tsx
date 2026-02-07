'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import type { Opportunity } from './OpportunityCard'

interface Client {
    id: string
    name: string
}

interface TeamMember {
    id: string
    full_name: string
}

interface OpportunityFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    opportunity: Opportunity | null
    clients: Client[]
    teamMembers: TeamMember[]
    onSave: (data: OpportunityFormData) => Promise<void>
}

export interface OpportunityFormData {
    title: string
    description: string
    client_id: string
    assigned_to: string
    estimated_value: number
    expected_close_date: string
    stage: string
}

export default function OpportunityForm({
    open,
    onOpenChange,
    opportunity,
    clients,
    teamMembers,
    onSave,
}: OpportunityFormProps) {
    const [saving, setSaving] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [clientId, setClientId] = useState('')
    const [assignedTo, setAssignedTo] = useState('')
    const [estimatedValue, setEstimatedValue] = useState('')
    const [expectedCloseDate, setExpectedCloseDate] = useState('')
    const [stage, setStage] = useState('calificacion')

    useEffect(() => {
        if (opportunity) {
            setTitle(opportunity.title)
            setDescription(opportunity.description || '')
            setClientId(opportunity.client_id || '')
            setAssignedTo(opportunity.assigned_to || '')
            setEstimatedValue(String(opportunity.estimated_value || ''))
            setExpectedCloseDate(opportunity.expected_close_date || '')
            setStage(opportunity.stage)
        } else {
            setTitle('')
            setDescription('')
            setClientId('')
            setAssignedTo('')
            setEstimatedValue('')
            setExpectedCloseDate('')
            setStage('calificacion')
        }
    }, [opportunity, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setSaving(true)
        try {
            await onSave({
                title: title.trim(),
                description: description.trim(),
                client_id: clientId || '',
                assigned_to: assignedTo || '',
                estimated_value: parseFloat(estimatedValue) || 0,
                expected_close_date: expectedCloseDate,
                stage,
            })
            onOpenChange(false)
        } finally {
            setSaving(false)
        }
    }

    const isEditing = !!opportunity

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Oportunidad' : 'Nueva Oportunidad'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titulo *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Implementacion ERP"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripcion</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detalles de la oportunidad..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Cliente</Label>
                            <Select value={clientId} onValueChange={setClientId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin cliente</SelectItem>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Responsable</Label>
                            <Select value={assignedTo} onValueChange={setAssignedTo}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar responsable" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin asignar</SelectItem>
                                    {teamMembers.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="value">Valor estimado (USD)</Label>
                            <Input
                                id="value"
                                type="number"
                                min="0"
                                step="0.01"
                                value={estimatedValue}
                                onChange={(e) => setEstimatedValue(e.target.value)}
                                placeholder="0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="close-date">Fecha estimada de cierre</Label>
                            <Input
                                id="close-date"
                                type="date"
                                value={expectedCloseDate}
                                onChange={(e) => setExpectedCloseDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {!isEditing && (
                        <div className="space-y-2">
                            <Label>Etapa inicial</Label>
                            <Select value={stage} onValueChange={setStage}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="calificacion">Calificacion</SelectItem>
                                    <SelectItem value="propuesta">Propuesta</SelectItem>
                                    <SelectItem value="negociacion">Negociacion</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={saving || !title.trim()}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {isEditing ? 'Guardar' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
