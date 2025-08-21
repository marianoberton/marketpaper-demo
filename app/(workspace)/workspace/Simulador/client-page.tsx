'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { wallet } from 'lucide-react'

export default function SimuladordePagosClientPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <wallet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Simulador de Pagos</h1>
          <p className="text-muted-foreground">
            Módulo workspace para gestión de simulador de pagos
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Configuración del módulo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Este es un módulo workspace generado automáticamente.
            Puedes personalizar esta página según tus necesidades.
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Información del módulo:</h3>
            <ul className="text-sm space-y-1">
              <li><strong>Nombre:</strong> Simulador de Pagos</li>
              <li><strong>Ruta:</strong> /workspace/Simulador</li>
              <li><strong>Categoría:</strong> Workspace</li>
              <li><strong>Icono:</strong> wallet</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
