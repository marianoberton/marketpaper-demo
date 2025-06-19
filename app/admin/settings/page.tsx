'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Settings, 
  Database, 
  Mail, 
  Shield,
  Zap,
  Globe,
  Bell,
  Key,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Server,
  DollarSign,
  Users,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'

interface SystemSettings {
  platform: {
    name: string
    description: string
    logo_url: string
    primary_color: string
    secondary_color: string
    maintenance_mode: boolean
    registration_enabled: boolean
    default_plan: string
  }
  email: {
    smtp_host: string
    smtp_port: number
    smtp_user: string
    smtp_password: string
    from_email: string
    from_name: string
    enabled: boolean
  }
  api: {
    rate_limit_per_minute: number
    rate_limit_per_hour: number
    rate_limit_per_day: number
    webhook_secret: string
    cors_origins: string[]
    api_version: string
  }
  security: {
    password_min_length: number
    require_2fa: boolean
    session_timeout_minutes: number
    max_login_attempts: number
    lockout_duration_minutes: number
    allowed_domains: string[]
  }
  billing: {
    stripe_public_key: string
    stripe_secret_key: string
    webhook_endpoint_secret: string
    trial_period_days: number
    grace_period_days: number
    currency: string
  }
  notifications: {
    slack_webhook_url: string
    discord_webhook_url: string
    email_alerts_enabled: boolean
    cost_alert_threshold: number
    usage_alert_threshold: number
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('platform')
  const [showPasswords, setShowPasswords] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'pending' | undefined>>({})

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      
      // Mock data for now - replace with actual API call
      const mockSettings: SystemSettings = {
        platform: {
          name: 'FOMO CRM',
          description: 'Plataforma integral de CRM y automatización',
          logo_url: '/logo.svg',
          primary_color: '#3b82f6',
          secondary_color: '#8b5cf6',
          maintenance_mode: false,
          registration_enabled: true,
          default_plan: 'starter'
        },
        email: {
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          smtp_user: 'noreply@fomocrm.com',
          smtp_password: '••••••••',
          from_email: 'noreply@fomocrm.com',
          from_name: 'FOMO CRM',
          enabled: true
        },
        api: {
          rate_limit_per_minute: 60,
          rate_limit_per_hour: 1000,
          rate_limit_per_day: 10000,
          webhook_secret: '••••••••••••••••',
          cors_origins: ['https://app.fomocrm.com', 'https://dashboard.fomocrm.com'],
          api_version: 'v1'
        },
        security: {
          password_min_length: 8,
          require_2fa: false,
          session_timeout_minutes: 480,
          max_login_attempts: 5,
          lockout_duration_minutes: 15,
          allowed_domains: []
        },
        billing: {
          stripe_public_key: 'pk_test_••••••••••••••••',
          stripe_secret_key: 'sk_test_••••••••••••••••',
          webhook_endpoint_secret: 'whsec_••••••••••••••••',
          trial_period_days: 14,
          grace_period_days: 3,
          currency: 'EUR'
        },
        notifications: {
          slack_webhook_url: 'https://hooks.slack.com/services/•••',
          discord_webhook_url: '',
          email_alerts_enabled: true,
          cost_alert_threshold: 1000,
          usage_alert_threshold: 80
        }
      }
      
      setSettings(mockSettings)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (section: keyof SystemSettings) => {
    if (!settings) return
    
    setIsSaving(true)
    try {
      // Mock save - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log(`Saving ${section} settings:`, settings[section])
      
      // Show success message
      setTestResults(prev => ({ ...prev, [section]: 'success' }))
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, [section]: undefined }))
      }, 3000)
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error)
      setTestResults(prev => ({ ...prev, [section]: 'error' }))
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async (type: string) => {
    setTestResults(prev => ({ ...prev, [type]: 'pending' }))
    
    try {
      // Mock test - replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate success/failure
      const isSuccess = Math.random() > 0.3
      setTestResults(prev => ({ ...prev, [type]: isSuccess ? 'success' : 'error' }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, [type]: 'error' }))
    }
  }

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    if (!settings) return
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }))
  }

  const getTestIcon = (result: string | undefined) => {
    switch (result) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error cargando configuración</h3>
          <p className="text-gray-600 mb-4">No se pudo cargar la configuración del sistema</p>
          <Button onClick={loadSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600">Gestiona la configuración global de la plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowPasswords(!showPasswords)}
          >
            {showPasswords ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPasswords ? 'Ocultar' : 'Mostrar'} Claves
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="platform">
            <Globe className="h-4 w-4 mr-2" />
            Plataforma
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="api">
            <Zap className="h-4 w-4 mr-2" />
            API
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="billing">
            <DollarSign className="h-4 w-4 mr-2" />
            Facturación
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </TabsTrigger>
        </TabsList>

        {/* Platform Settings */}
        <TabsContent value="platform" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de la Plataforma</CardTitle>
              <CardDescription>Configuración básica y apariencia de la plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre de la Plataforma</label>
                  <Input
                    value={settings.platform.name}
                    onChange={(e) => updateSettings('platform', 'name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Plan por Defecto</label>
                  <select
                    value={settings.platform.default_plan}
                    onChange={(e) => updateSettings('platform', 'default_plan', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <Textarea
                  value={settings.platform.description}
                  onChange={(e) => updateSettings('platform', 'description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Color Primario</label>
                  <Input
                    type="color"
                    value={settings.platform.primary_color}
                    onChange={(e) => updateSettings('platform', 'primary_color', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Color Secundario</label>
                  <Input
                    type="color"
                    value={settings.platform.secondary_color}
                    onChange={(e) => updateSettings('platform', 'secondary_color', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Modo Mantenimiento</h4>
                  <p className="text-sm text-gray-600">Desactiva el acceso a la plataforma temporalmente</p>
                </div>
                <Switch
                  checked={settings.platform.maintenance_mode}
                  onCheckedChange={(checked) => updateSettings('platform', 'maintenance_mode', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Registro Habilitado</h4>
                  <p className="text-sm text-gray-600">Permite que nuevos usuarios se registren</p>
                </div>
                <Switch
                  checked={settings.platform.registration_enabled}
                  onCheckedChange={(checked) => updateSettings('platform', 'registration_enabled', checked)}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('platform')} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar Configuración
                  {getTestIcon(testResults.platform)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Email</CardTitle>
              <CardDescription>Configuración SMTP para el envío de emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg mb-4">
                <div>
                  <h4 className="font-medium">Email Habilitado</h4>
                  <p className="text-sm text-gray-600">Activa o desactiva el envío de emails</p>
                </div>
                <Switch
                  checked={settings.email.enabled}
                  onCheckedChange={(checked) => updateSettings('email', 'enabled', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Servidor SMTP</label>
                  <Input
                    value={settings.email.smtp_host}
                    onChange={(e) => updateSettings('email', 'smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Puerto</label>
                  <Input
                    type="number"
                    value={settings.email.smtp_port}
                    onChange={(e) => updateSettings('email', 'smtp_port', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Usuario SMTP</label>
                  <Input
                    value={settings.email.smtp_user}
                    onChange={(e) => updateSettings('email', 'smtp_user', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contraseña SMTP</label>
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={settings.email.smtp_password}
                    onChange={(e) => updateSettings('email', 'smtp_password', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email Remitente</label>
                  <Input
                    type="email"
                    value={settings.email.from_email}
                    onChange={(e) => updateSettings('email', 'from_email', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre Remitente</label>
                  <Input
                    value={settings.email.from_name}
                    onChange={(e) => updateSettings('email', 'from_name', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleTest('email')}
                  disabled={testResults.email === 'pending'}
                >
                  {testResults.email === 'pending' ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  Probar Conexión
                  {getTestIcon(testResults.email)}
                </Button>
                <Button onClick={() => handleSave('email')} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar Configuración
                  {getTestIcon(testResults.email_save)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de API</CardTitle>
              <CardDescription>Límites de tasa y configuración de la API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Límite por Minuto</label>
                  <Input
                    type="number"
                    value={settings.api.rate_limit_per_minute}
                    onChange={(e) => updateSettings('api', 'rate_limit_per_minute', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Límite por Hora</label>
                  <Input
                    type="number"
                    value={settings.api.rate_limit_per_hour}
                    onChange={(e) => updateSettings('api', 'rate_limit_per_hour', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Límite por Día</label>
                  <Input
                    type="number"
                    value={settings.api.rate_limit_per_day}
                    onChange={(e) => updateSettings('api', 'rate_limit_per_day', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Webhook Secret</label>
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={settings.api.webhook_secret}
                  onChange={(e) => updateSettings('api', 'webhook_secret', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Orígenes CORS Permitidos</label>
                <Textarea
                  value={settings.api.cors_origins.join('\n')}
                  onChange={(e) => updateSettings('api', 'cors_origins', e.target.value.split('\n').filter(Boolean))}
                  rows={3}
                  placeholder="https://app.fomocrm.com&#10;https://dashboard.fomocrm.com"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('api')} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar Configuración
                  {getTestIcon(testResults.api)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Seguridad</CardTitle>
              <CardDescription>Políticas de seguridad y autenticación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Longitud Mínima de Contraseña</label>
                  <Input
                    type="number"
                    min="6"
                    max="20"
                    value={settings.security.password_min_length}
                    onChange={(e) => updateSettings('security', 'password_min_length', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Timeout de Sesión (minutos)</label>
                  <Input
                    type="number"
                    value={settings.security.session_timeout_minutes}
                    onChange={(e) => updateSettings('security', 'session_timeout_minutes', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Máx. Intentos de Login</label>
                  <Input
                    type="number"
                    min="3"
                    max="10"
                    value={settings.security.max_login_attempts}
                    onChange={(e) => updateSettings('security', 'max_login_attempts', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Duración Bloqueo (minutos)</label>
                  <Input
                    type="number"
                    value={settings.security.lockout_duration_minutes}
                    onChange={(e) => updateSettings('security', 'lockout_duration_minutes', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Requerir 2FA</h4>
                  <p className="text-sm text-gray-600">Obligar autenticación de dos factores para todos los usuarios</p>
                </div>
                <Switch
                  checked={settings.security.require_2fa}
                  onCheckedChange={(checked) => updateSettings('security', 'require_2fa', checked)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Dominios Permitidos (opcional)</label>
                <Textarea
                  value={settings.security.allowed_domains.join('\n')}
                  onChange={(e) => updateSettings('security', 'allowed_domains', e.target.value.split('\n').filter(Boolean))}
                  rows={3}
                  placeholder="company.com&#10;organization.org"
                />
                <p className="text-xs text-gray-500 mt-1">Deja vacío para permitir todos los dominios</p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('security')} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar Configuración
                  {getTestIcon(testResults.security)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Facturación</CardTitle>
              <CardDescription>Configuración de Stripe y políticas de facturación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Clave Pública de Stripe</label>
                  <Input
                    value={settings.billing.stripe_public_key}
                    onChange={(e) => updateSettings('billing', 'stripe_public_key', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Clave Secreta de Stripe</label>
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={settings.billing.stripe_secret_key}
                    onChange={(e) => updateSettings('billing', 'stripe_secret_key', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Webhook Endpoint Secret</label>
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={settings.billing.webhook_endpoint_secret}
                  onChange={(e) => updateSettings('billing', 'webhook_endpoint_secret', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Período de Prueba (días)</label>
                  <Input
                    type="number"
                    value={settings.billing.trial_period_days}
                    onChange={(e) => updateSettings('billing', 'trial_period_days', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Período de Gracia (días)</label>
                  <Input
                    type="number"
                    value={settings.billing.grace_period_days}
                    onChange={(e) => updateSettings('billing', 'grace_period_days', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Moneda</label>
                  <select
                    value={settings.billing.currency}
                    onChange={(e) => updateSettings('billing', 'currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="EUR">EUR - Euro</option>
                    <option value="USD">USD - Dólar</option>
                    <option value="GBP">GBP - Libra</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleTest('stripe')}
                  disabled={testResults.stripe === 'pending'}
                >
                  {testResults.stripe === 'pending' ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <DollarSign className="h-4 w-4 mr-2" />}
                  Probar Stripe
                  {getTestIcon(testResults.stripe)}
                </Button>
                <Button onClick={() => handleSave('billing')} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar Configuración
                  {getTestIcon(testResults.billing)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>Configuración de alertas y notificaciones del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg mb-4">
                <div>
                  <h4 className="font-medium">Alertas por Email</h4>
                  <p className="text-sm text-gray-600">Enviar alertas importantes por email</p>
                </div>
                <Switch
                  checked={settings.notifications.email_alerts_enabled}
                  onCheckedChange={(checked) => updateSettings('notifications', 'email_alerts_enabled', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Umbral de Alerta de Costos (€)</label>
                  <Input
                    type="number"
                    value={settings.notifications.cost_alert_threshold}
                    onChange={(e) => updateSettings('notifications', 'cost_alert_threshold', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Umbral de Alerta de Uso (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.notifications.usage_alert_threshold}
                    onChange={(e) => updateSettings('notifications', 'usage_alert_threshold', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Webhook URL de Slack</label>
                <Input
                  value={settings.notifications.slack_webhook_url}
                  onChange={(e) => updateSettings('notifications', 'slack_webhook_url', e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Webhook URL de Discord</label>
                <Input
                  value={settings.notifications.discord_webhook_url}
                  onChange={(e) => updateSettings('notifications', 'discord_webhook_url', e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </div>

              <div className="flex justify-between">
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest('slack')}
                    disabled={testResults.slack === 'pending'}
                  >
                    {testResults.slack === 'pending' ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Probar Slack
                    {getTestIcon(testResults.slack)}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest('discord')}
                    disabled={testResults.discord === 'pending'}
                  >
                    {testResults.discord === 'pending' ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Probar Discord
                    {getTestIcon(testResults.discord)}
                  </Button>
                </div>
                <Button onClick={() => handleSave('notifications')} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar Configuración
                  {getTestIcon(testResults.notifications)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 