'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth-layout'
import { useState } from 'react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const response = await fetch('/api/registration-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitResult({
          success: true,
          message: '¡Gracias por tu interes! Procesaremos tu solicitud en las proximas 24 horas y te contactaremos.'
        })
        setFormData({
          name: '',
          email: '',
          company: '',
          phone: ''
        })
      } else {
        setSubmitResult({
          success: false,
          message: result.error || 'Error procesando la solicitud. Intentalo de nuevo.'
        })
      }
    } catch {
      setSubmitResult({
        success: false,
        message: 'Error de conexion. Verifica tu internet e intentalo de nuevo.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Crear Cuenta
        </h1>
        <p className="text-muted-foreground">
          Unite a la nueva forma de trabajar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre Completo</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Juan Perez"
            value={formData.name}
            onChange={handleChange}
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Corporativo</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="juan@empresa.com"
            value={formData.email}
            onChange={handleChange}
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Empresa</Label>
          <Input
            id="company"
            name="company"
            type="text"
            placeholder="Mi Empresa S.A."
            value={formData.company}
            onChange={handleChange}
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefono</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+54 11 1234 5678"
            value={formData.phone}
            onChange={handleChange}
            className="h-11"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium mt-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Enviando solicitud...' : 'Solicitar Acceso'}
        </Button>

        {submitResult && (
          <div className={`p-4 rounded-lg border text-sm ${
            submitResult.success
              ? 'bg-green-500/10 border-green-500/20 text-green-500'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}>
            <p className="font-medium">
              {submitResult.success ? '¡Solicitud enviada!' : 'Error'}
            </p>
            <p className="mt-1">
              {submitResult.message}
            </p>
          </div>
        )}
      </form>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
        <h3 className="text-sm font-medium text-foreground mb-2">Proceso de Registro</h3>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>1. Enviamos tu solicitud</p>
          <p>2. Revisamos tu informacion (24h)</p>
          <p>3. Te contactamos con tus credenciales</p>
          <p>4. ¡Empezas a usar la plataforma!</p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          ¿Ya tenes cuenta?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Iniciar Sesion
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
