'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  LogOut,
  Building,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface Category {
  id: string
  name: string
  description: string | null
  color: string
  icon: string
}

interface NuevoTicketClientPageProps {
  companyId: string
}

export default function NuevoTicketClientPage({ companyId }: NuevoTicketClientPageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/client-login')
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
          priority: 'medium' // Default priority for clients
        })
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/client-view/tickets/${data.ticket.id}`)
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y navegación */}
            <div className="flex items-center gap-4">
              <Link href="/client-view" className="flex items-center">
                <Image
                  src="/inted.png"
                  alt="Logo"
                  width={180}
                  height={60}
                  className="h-8 sm:h-10 w-auto"
                />
              </Link>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/client-view">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#1B293F]">
                  <Building className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Mis Proyectos</span>
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-gray-600 hover:text-[#1B293F]"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild className="hover:bg-gray-100">
            <Link href="/client-view/tickets">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Ticket className="h-5 w-5 text-[#1B293F]" />
              Nuevo Ticket de Soporte
            </h1>
            <p className="text-sm text-gray-500">
              Describe tu consulta y te responderemos lo antes posible
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader className="bg-[#1B293F] text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Crear Ticket
            </CardTitle>
            <CardDescription className="text-gray-300">
              Completa los campos para enviarnos tu consulta
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
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
                  placeholder="Ej: Consulta sobre mi proyecto"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                  className="border-gray-300 focus:border-[#1B293F] focus:ring-[#1B293F]"
                />
                <p className="text-xs text-gray-400">
                  Describe brevemente tu consulta
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Tipo de Consulta</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Seleccionar tipo..." />
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
                <Label htmlFor="description">Descripcion *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe detalladamente tu consulta. Incluye cualquier informacion relevante que nos ayude a asistirte mejor."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[150px] border-gray-300 focus:border-[#1B293F] focus:ring-[#1B293F]"
                />
                <p className="text-xs text-gray-400">
                  Mientras mas detallada sea la descripcion, mas rapido podremos ayudarte
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="border-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#1B293F] hover:bg-[#243447]"
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
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
