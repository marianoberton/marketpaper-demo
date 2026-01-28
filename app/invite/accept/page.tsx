'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Eye, EyeOff, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'

// Wrap in Suspense for useSearchParams
export default function AcceptInvitePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
            <AcceptInviteForm />
        </Suspense>
    )
}

function AcceptInviteForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [inviteData, setInviteData] = useState<{ email: string; company_name: string } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    // Registration form
    const [fullName, setFullName] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isRegistering, setIsRegistering] = useState(false)

    useEffect(() => {
        if (!token) {
            setError('Token de invitación no encontrado')
            setIsLoading(false)
            return
        }
        verifyToken(token)
    }, [token])

    const verifyToken = async (inviteToken: string) => {
        try {
            const supabase = createClient()

            // Call the RPC function we created
            const { data, error } = await supabase.rpc('get_invitation_by_token', {
                invite_token: inviteToken
            })

            if (error) throw error

            if (data && data.length > 0) {
                setInviteData(data[0])
            } else {
                setError('Invitación inválida o expirada')
            }
        } catch (err: any) {
            console.error('Error checking invite:', err)
            setError('Error al verificar la invitación')
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteData) return

        setIsRegistering(true)
        setError('')

        try {
            const supabase = createClient()

            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: inviteData.email.trim(),
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            })

            if (signUpError) throw signUpError

            const userId = authData.user?.id

            // SUCCESS: Ahora llamamos a nuestra API para confirmar la invitación y vincular el perfil
            if (userId) {
                try {
                    const response = await fetch('/api/auth/complete-invite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            token: token,
                            userId: userId
                        })
                    })

                    if (!response.ok) {
                        let errorMsg = ''
                        try {
                            const errorData = await response.json()
                            errorMsg = JSON.stringify(errorData)
                        } catch (e) {
                            errorMsg = await response.text()
                        }
                        console.error(`Error linking invite (${response.status}):`, errorMsg)
                    } else {
                        console.log('Invite linked successfully')
                    }
                } catch (apiError) {
                    console.error('API Error:', apiError)
                }
            }

            // Success! Check email message
            // Wait a bit and redirect
            setTimeout(() => {
                router.push('/login?message=Verifica tu email para activar tu cuenta')
            }, 2000)

        } catch (err: any) {
            console.error('Registration error:', err)
            setError(err.message || 'Error al completar el registro')
            setIsRegistering(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-8 text-center border-red-100 bg-white shadow-lg">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Error de Invitación</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link href="/login">
                        <Button variant="outline" className="w-full">Volver al Login</Button>
                    </Link>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-900 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 bg-white shadow-2xl border-0">
                <div className="text-center mb-8">
                    <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Únete a {inviteData?.company_name}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Completa tu registro para aceptar la invitación
                    </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-gray-700">Email (fijo)</Label>
                        <Input
                            value={inviteData?.email}
                            disabled
                            className="bg-gray-100 border-gray-200 text-gray-500 font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullname" className="text-gray-700">Nombre Completo</Label>
                        <Input
                            id="fullname"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Ej: Juan Pérez"
                            required
                            className="h-11 border-gray-300"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-700">Contraseña</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                className="h-11 border-gray-300 pr-10"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isRegistering}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg mt-4"
                    >
                        {isRegistering ? 'Procesando...' : 'Completar Registro'}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Al registrarte aceptas nuestros términos y condiciones.
                </p>
            </Card>
        </div>
    )
}
