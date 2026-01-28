'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const supabase = createClient()

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (resetError) {
                throw resetError
            }

            setIsSuccess(true)
        } catch (err: any) {
            console.error('Reset password error:', err)
            setError(err.message || 'Error al enviar el email. Inténtalo de nuevo.')
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-brilliant-blue to-plum flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm shadow-2xl border-0">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            ¡Email enviado!
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Hemos enviado un enlace de recuperación a <strong>{email}</strong>.
                            Revisa tu bandeja de entrada y sigue las instrucciones.
                        </p>

                        <div className="space-y-3">
                            <p className="text-sm text-gray-500">
                                ¿No recibiste el email? Revisa tu carpeta de spam o
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsSuccess(false)
                                    setEmail('')
                                }}
                                className="w-full"
                            >
                                Intentar de nuevo
                            </Button>

                            <Link href="/login" className="block">
                                <Button variant="ghost" className="w-full">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Volver al inicio de sesión
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-brilliant-blue to-plum flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm shadow-2xl border-0">
                <div className="text-center mb-8">
                    {/* Logo FOMO */}
                    <div className="mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="140" height="58" viewBox="0 0 46.83 19.27" className="mx-auto">
                            <defs>
                                <style>{`.cls-1,.cls-2,.cls-3{fill:#0f172a;}.cls-2{font-size:11.64px;letter-spacing:0.08em;}.cls-2,.cls-3{font-family:ConcertOne-Regular, Concert One;}.cls-3{font-size:6.47px;letter-spacing:0.2em;}`}</style>
                            </defs>
                            <g id="Capa_2" data-name="Capa 2">
                                <g id="Capa_1-2" data-name="Capa 1">
                                    <path className="cls-1" d="M7.07,3.23C6.27,3.51,6,4,5.76,5.32c-.07.42-.17.9-.21,1s-.07.3-.08.35-.09.27-.2.51c-.41.91-1.06,1.45-3,2.48a4.91,4.91,0,0,0-1.55,1,2.45,2.45,0,0,0-.57.84A3.71,3.71,0,0,0,0,12.76a4.36,4.36,0,0,0,.2,1.12c.2.43.4.59.65.5a.5.5,0,0,0,.25-.23c0-.15.07-.21-.05-.62a2.3,2.3,0,0,1,0-1.68,1.79,1.79,0,0,1,.7-.88,3,3,0,0,1,1.32-.38,4.48,4.48,0,0,1,1.77.51A7.45,7.45,0,0,1,7,13.27c.79,1.07,1.13,1.31,1.86,1.32a1.6,1.6,0,0,0,1.22-.49,1.71,1.71,0,0,0,.54-1.33,1.59,1.59,0,0,0-.4-1.18,1.71,1.71,0,0,0-2-.42,1.86,1.86,0,0,1-.9.14,1.83,1.83,0,0,1-1.7-2,1.92,1.92,0,0,1,.54-1.45A4.27,4.27,0,0,1,7.79,6.83,2.46,2.46,0,0,0,9,5.79,2.43,2.43,0,0,0,9.24,5,1.73,1.73,0,0,0,9,4.08a2.06,2.06,0,0,0-.88-.79A1.93,1.93,0,0,0,7.07,3.23Z" />
                                    <text className="cls-2" transform="translate(12.66 9.8) rotate(0.21)">FOMO</text>
                                    <text className="cls-3" transform="translate(13.32 16.18) rotate(0.21)">DIGITAL</text>
                                </g>
                            </g>
                        </svg>
                    </div>

                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="h-6 w-6 text-blue-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        ¿Olvidaste tu contraseña?
                    </h1>
                    <p className="text-gray-600">
                        Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Email
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className="h-11 border-gray-300 focus:border-brilliant-blue focus:ring-brilliant-blue"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading || !email}
                        className="w-full h-11 bg-gradient-to-r from-brilliant-blue to-plum hover:from-brilliant-blue/90 hover:to-plum/90 text-white font-medium transition-all duration-200"
                    >
                        {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/login" className="text-blue-600 hover:underline inline-flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Volver al inicio de sesión
                    </Link>
                </div>
            </Card>
        </div>
    )
}
