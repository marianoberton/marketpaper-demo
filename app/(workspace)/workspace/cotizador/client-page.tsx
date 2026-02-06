'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator } from 'lucide-react'

export default function CotizadorClientPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Calculator className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Cotizador</h1>
                    <p className="text-muted-foreground">Módulo de cotizaciones (en construcción)</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Próximamente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Calculator className="h-12 w-12 mb-4 text-muted-foreground/50" />
                        <p className="text-lg font-medium">Módulo en Desarrollo</p>
                        <p className="text-sm">Aquí podrás gestionar todas tus cotizaciones próximamente.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
