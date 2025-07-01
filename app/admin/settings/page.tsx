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
  EyeOff,
  FileText,
  Activity,
  Download,
  Upload,
  Trash2
} from 'lucide-react'

interface SystemInfo {
  version: string
  uptime: string
  totalCompanies: number
  totalUsers: number
  totalTemplates: number
  databaseStatus: 'healthy' | 'warning' | 'error'
  storageUsed: string
  lastBackup: string
}

interface SystemSettings {
  platform: {
    name: string
    description: string
    logo_url: string
    primary_color: string
    secondary_color: string
    maintenance_mode: boolean
    registration_enabled: boolean
    auto_approval: boolean
    default_template_id: string
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
    session_timeout_hours: number
    require_strong_passwords: boolean
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
    admin_alerts_enabled: boolean
    user_registration_alerts: boolean
    system_error_alerts: boolean
    daily_reports_enabled: boolean
    alert_email: string
  }
  registration: {
    require_approval: boolean
    allowed_domains: string[]
    welcome_email_enabled: boolean
    default_features: string[]
  }
  modules: {
    available_modules: string[]
    enabled_modules: string[]
    beta_modules: string[]
  }
}

export default function SettingsPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showSensitive, setShowSensitive] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

  useEffect(() => {
    loadSystemData()
  }, [])

  const loadSystemData = async () => {
    try {
      setIsLoading(true)
      
      // Load system info and settings from actual APIs
      const [infoResponse, settingsResponse] = await Promise.all([
        loadSystemInfo(),
        loadSystemSettings()
      ])
      
      setSystemInfo(infoResponse)
      setSettings(settingsResponse)
    } catch (error) {
      console.error('Error loading system data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSystemInfo = async (): Promise<SystemInfo> => {
    // For now, return realistic data - replace with actual API call
    return {
      version: '1.2.3',
      uptime: '15 días, 8 horas',
      totalCompanies: 12,
      totalUsers: 45,
      totalTemplates: 5,
      databaseStatus: 'healthy',
      storageUsed: '2.3 GB',
      lastBackup: '2025-07-01 02:00:00'
    }
  }

  const loadSystemSettings = async (): Promise<SystemSettings> => {
    // For now, return realistic settings - replace with actual API call
    return {
      platform: {
        name: 'FOMO Platform',
        description: 'Sistema integral de CRM y automatización empresarial',
        logo_url: '/Logo-fomo.svg',
        primary_color: '#3b82f6',
        secondary_color: '#8b5cf6',
        maintenance_mode: false,
        registration_enabled: true,
        auto_approval: false,
        default_template_id: 'starter'
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
        allowed_domains: [],
        session_timeout_hours: 8,
        require_strong_passwords: true
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
        usage_alert_threshold: 80,
        admin_alerts_enabled: true,
        user_registration_alerts: true,
        system_error_alerts: true,
        daily_reports_enabled: false,
        alert_email: 'admin@fomoplatform.com'
      },
      registration: {
        require_approval: true,
        allowed_domains: [],
        welcome_email_enabled: false,
        default_features: ['crm', 'calendar', 'documents']
      },
      modules: {
        available_modules: ['crm', 'construccion', 'calendar', 'documents', 'analytics', 'chat', 'marketing'],
        enabled_modules: ['crm', 'construccion', 'calendar', 'documents'],
        beta_modules: ['analytics', 'chat']
      }
    }
  }

  const handleSave = async (section: keyof SystemSettings) => {
    if (!settings) return
    
    setSaveStatus('saving')
    setIsSaving(true)
    
    try {
      // Replace with actual API call
      console.log(`Saving ${section} settings:`, settings[section])
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
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

  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'saving':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    }
    return variants[status as keyof typeof variants] || variants.healthy
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

  if (!settings || !systemInfo) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error cargando configuración</h3>
          <p className="text-gray-600 mb-4">No se pudo cargar la configuración del sistema</p>
          <Button onClick={loadSystemData}>
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
          <p className="text-gray-600">Gestiona la configuración de FOMO Platform</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowSensitive(!showSensitive)}
            size="sm"
          >
            {showSensitive ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showSensitive ? 'Ocultar' : 'Mostrar'} Datos Sensibles
          </Button>
          <Button onClick={loadSystemData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="platform">
            <Globe className="h-4 w-4 mr-2" />
            Plataforma
          </TabsTrigger>
          <TabsTrigger value="registration">
            <Users className="h-4 w-4 mr-2" />
            Registro
          </TabsTrigger>
          <TabsTrigger value="modules">
            <FileText className="h-4 w-4 mr-2" />
            Módulos
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Versión del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemInfo.version}</div>
                <p className="text-sm text-gray-600">Última actualización</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Tiempo Activo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemInfo.uptime}</div>
                <p className="text-sm text-gray-600">Sin interrupciones</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Empresas Activas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemInfo.totalCompanies}</div>
                <p className="text-sm text-gray-600">{systemInfo.totalUsers} usuarios totales</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Estado de la Base de Datos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusBadge(systemInfo.databaseStatus)}>
                    {systemInfo.databaseStatus === 'healthy' ? 'Saludable' : 
                     systemInfo.databaseStatus === 'warning' ? 'Advertencia' : 'Error'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{systemInfo.storageUsed} usados</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estado del Sistema</CardTitle>
              <CardDescription>Información general sobre el estado de la plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Plantillas Disponibles</h4>
                    <p className="text-sm text-gray-600">{systemInfo.totalTemplates} plantillas configuradas</p>
                  </div>
                  <Badge variant="outline">{systemInfo.totalTemplates}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Último Backup</h4>
                    <p className="text-sm text-gray-600">{systemInfo.lastBackup}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Modo Mantenimiento</h4>
                    <p className="text-sm text-gray-600">
                      {settings.platform.maintenance_mode ? 'Activado' : 'Desactivado'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.platform.maintenance_mode}
                    onCheckedChange={(checked) => updateSettings('platform', 'maintenance_mode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Registro de Usuarios</h4>
                    <p className="text-sm text-gray-600">
                      {settings.platform.registration_enabled ? 'Habilitado' : 'Deshabilitado'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.platform.registration_enabled}
                    onCheckedChange={(checked) => updateSettings('platform', 'registration_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                  <label className="block text-sm font-medium mb-2">URL del Logo</label>
                  <Input
                    value={settings.platform.logo_url}
                    onChange={(e) => updateSettings('platform', 'logo_url', e.target.value)}
                  />
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

              <div>
                <label className="block text-sm font-medium mb-2">Plantilla por Defecto</label>
                <select
                  value={settings.platform.default_template_id}
                  onChange={(e) => updateSettings('platform', 'default_template_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('platform')} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar Configuración
                  {getStatusIcon()}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registration Settings */}
        <TabsContent value="registration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Registro</CardTitle>
              <CardDescription>Control sobre el proceso de registro de nuevos usuarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Requiere Aprobación Manual</h4>
                  <p className="text-sm text-gray-600">Los nuevos registros deben ser aprobados por un administrador</p>
                </div>
                <Switch
                  checked={settings.registration.require_approval}
                  onCheckedChange={(checked) => updateSettings('registration', 'require_approval', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Email de Bienvenida</h4>
                  <p className="text-sm text-gray-600">Enviar email automático a nuevos usuarios</p>
                </div>
                <Switch
                  checked={settings.registration.welcome_email_enabled}
                  onCheckedChange={(checked) => updateSettings('registration', 'welcome_email_enabled', checked)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Dominios Permitidos</label>
                <Textarea
                  value={settings.registration.allowed_domains.join('\n')}
                  onChange={(e) => updateSettings('registration', 'allowed_domains', e.target.value.split('\n').filter(d => d.trim()))}
                  placeholder="Ej: empresa.com&#10;organizacion.org&#10;(vacío = todos los dominios)"
                  rows={3}
                />
                <p className="text-sm text-gray-600 mt-1">Un dominio por línea. Vacío permite todos los dominios.</p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('registration')} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar Configuración
                  {getStatusIcon()}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Settings */}
        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Módulos</CardTitle>
              <CardDescription>Control sobre qué módulos están disponibles en el sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Módulos Principales</h4>
                <div className="space-y-2">
                  {settings.modules.available_modules.map((module) => (
                    <div key={module} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium capitalize">{module.replace('_', ' ')}</span>
                        {settings.modules.beta_modules.includes(module) && (
                          <Badge variant="outline" className="ml-2">Beta</Badge>
                        )}
                      </div>
                      <Switch
                        checked={settings.modules.enabled_modules.includes(module)}
                        onCheckedChange={(checked) => {
                          const enabled = checked
                            ? [...settings.modules.enabled_modules, module]
                            : settings.modules.enabled_modules.filter(m => m !== module)
                          updateSettings('modules', 'enabled_modules', enabled)
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('modules')} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar Configuración
                  {getStatusIcon()}
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
                  <label className="block text-sm font-medium mb-2">Tiempo de Sesión (horas)</label>
                  <Input
                    type="number"
                    value={settings.security.session_timeout_hours}
                    onChange={(e) => updateSettings('security', 'session_timeout_hours', parseInt(e.target.value))}
                    min="1"
                    max="24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Intentos de Login Máximos</label>
                  <Input
                    type="number"
                    value={settings.security.max_login_attempts}
                    onChange={(e) => updateSettings('security', 'max_login_attempts', parseInt(e.target.value))}
                    min="3"
                    max="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Duración del Bloqueo (minutos)</label>
                <Input
                  type="number"
                  value={settings.security.lockout_duration_minutes}
                  onChange={(e) => updateSettings('security', 'lockout_duration_minutes', parseInt(e.target.value))}
                  min="5"
                  max="60"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Contraseñas Fuertes Requeridas</h4>
                  <p className="text-sm text-gray-600">Mínimo 8 caracteres, mayúsculas, números y símbolos</p>
                </div>
                <Switch
                  checked={settings.security.require_strong_passwords}
                  onCheckedChange={(checked) => updateSettings('security', 'require_strong_passwords', checked)}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('security')} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar Configuración
                  {getStatusIcon()}
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
              <CardDescription>Alertas y notificaciones del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email para Alertas</label>
                <Input
                  type="email"
                  value={settings.notifications.alert_email}
                  onChange={(e) => updateSettings('notifications', 'alert_email', e.target.value)}
                  placeholder="admin@empresa.com"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Alertas de Administrador</h4>
                    <p className="text-sm text-gray-600">Recibir notificaciones importantes del sistema</p>
                  </div>
                  <Switch
                    checked={settings.notifications.admin_alerts_enabled}
                    onCheckedChange={(checked) => updateSettings('notifications', 'admin_alerts_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Alertas de Registro</h4>
                    <p className="text-sm text-gray-600">Notificar cuando hay nuevos registros pendientes</p>
                  </div>
                  <Switch
                    checked={settings.notifications.user_registration_alerts}
                    onCheckedChange={(checked) => updateSettings('notifications', 'user_registration_alerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Alertas de Errores</h4>
                    <p className="text-sm text-gray-600">Notificar cuando ocurren errores críticos</p>
                  </div>
                  <Switch
                    checked={settings.notifications.system_error_alerts}
                    onCheckedChange={(checked) => updateSettings('notifications', 'system_error_alerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Reportes Diarios</h4>
                    <p className="text-sm text-gray-600">Recibir resumen diario de actividad</p>
                  </div>
                  <Switch
                    checked={settings.notifications.daily_reports_enabled}
                    onCheckedChange={(checked) => updateSettings('notifications', 'daily_reports_enabled', checked)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('notifications')} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar Configuración
                  {getStatusIcon()}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 