'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Trophy, XCircle, Loader2 } from 'lucide-react'

interface CloseDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    opportunityTitle: string
    onClose: (outcome: 'won' | 'lost', lossReason?: string) => Promise<void>
}

export default function CloseDialog({
    open,
    onOpenChange,
    opportunityTitle,
    onClose,
}: CloseDialogProps) {
    const [outcome, setOutcome] = useState<'won' | 'lost' | null>(null)
    const [lossReason, setLossReason] = useState('')
    const [saving, setSaving] = useState(false)

    const handleConfirm = async () => {
        if (!outcome) return

        setSaving(true)
        try {
            await onClose(outcome, outcome === 'lost' ? lossReason : undefined)
            onOpenChange(false)
            setOutcome(null)
            setLossReason('')
        } finally {
            setSaving(false)
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setOutcome(null)
            setLossReason('')
        }
        onOpenChange(open)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle>Cerrar oportunidad</DialogTitle>
                    <DialogDescription className="truncate">
                        {opportunityTitle}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setOutcome('won')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${outcome === 'won'
                                ? 'border-state-success bg-state-success-muted'
                                : 'border-border hover:border-state-success/50'
                                }`}
                        >
                            <Trophy className={`h-8 w-8 ${outcome === 'won' ? 'text-state-success' : 'text-muted-foreground'}`} />
                            <span className={`text-sm font-medium ${outcome === 'won' ? 'text-state-success' : 'text-muted-foreground'}`}>
                                Ganada
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setOutcome('lost')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${outcome === 'lost'
                                ? 'border-state-error bg-state-error-muted'
                                : 'border-border hover:border-state-error/50'
                                }`}
                        >
                            <XCircle className={`h-8 w-8 ${outcome === 'lost' ? 'text-state-error' : 'text-muted-foreground'}`} />
                            <span className={`text-sm font-medium ${outcome === 'lost' ? 'text-state-error' : 'text-muted-foreground'}`}>
                                Perdida
                            </span>
                        </button>
                    </div>

                    {outcome === 'lost' && (
                        <div className="space-y-2">
                            <Label htmlFor="loss-reason">Motivo de perdida</Label>
                            <Textarea
                                id="loss-reason"
                                value={lossReason}
                                onChange={(e) => setLossReason(e.target.value)}
                                placeholder="Ej: Precio fuera de presupuesto, eligieron competidor..."
                                rows={3}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!outcome || saving}
                        className={outcome === 'won' ? 'bg-green-600 hover:bg-green-700' : outcome === 'lost' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Confirmar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
