"use client";

import { WorkspaceLayout } from "@/components/workspace-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen,
  Settings,
  Zap,
  Globe,
  Mail,
  Phone,
  MessageSquare,
  Database,
  Code,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Copy,
  Download,
  Play,
  Pause,
  RotateCcw,
  Target,
  Users,
  BarChart3,
  Webhook,
  Key,
  Shield,
  Smartphone,
  Instagram,
  Facebook,
  Linkedin,
  Search,
  FileText,
  Monitor,
  Cloud,
  Link,
  Wrench
} from "lucide-react";
import { useState } from "react";

const documentationSections = [
  {
    id: 'setup',
    title: 'Configuración Inicial',
    description: 'Pasos fundamentales para poner en marcha el CRM',
    icon: Settings,
    color: 'bg-blue-100 text-blue-800',
    priority: 'critical',
    estimatedTime: '2-4 horas'
  },
  {
    id: 'integrations',
    title: 'Integraciones y Conexiones',
    description: 'Conectar web, redes sociales y servicios externos',
    icon: Zap,
    color: 'bg-purple-100 text-purple-800',
    priority: 'high',
    estimatedTime: '4-6 horas'
  },
  {
    id: 'automation',
    title: 'Automatización de Procesos',
    description: 'Configurar workflows y automatizaciones',
    icon: RotateCcw,
    color: 'bg-green-100 text-green-800',
    priority: 'medium',
    estimatedTime: '2-3 horas'
  },
  {
    id: 'operations',
    title: 'Procedimientos Operativos',
    description: 'Cómo trabajar día a día con el CRM',
    icon: Target,
    color: 'bg-orange-100 text-orange-800',
    priority: 'high',
    estimatedTime: '1-2 horas'
  },
  {
    id: 'maintenance',
    title: 'Mantenimiento y Optimización',
    description: 'Monitoreo, análisis y mejora continua',
    icon: Monitor,
    color: 'bg-teal-100 text-teal-800',
    priority: 'medium',
    estimatedTime: 'Continuo'
  }
];

const integrationSteps = [
  {
    category: 'Web Integration',
    title: 'Conectar Formularios Web',
    description: 'Captura automática de leads desde tu sitio web',
    steps: [
      'Instalar pixel de seguimiento en tu web',
      'Configurar webhooks para formularios',
      'Mapear campos de formulario a CRM',
      'Configurar lead scoring automático',
      'Probar captura de leads'
    ],
    tools: ['Zapier', 'Webhooks', 'Google Tag Manager'],
    difficulty: 'Medium',
    priority: 'Critical'
  },
  {
    category: 'Social Media',
    title: 'Instagram & Facebook Ads',
    description: 'Integración con Meta Business para captura de leads',
    steps: [
      'Conectar Meta Business Manager',
      'Configurar Facebook Lead Ads API',
      'Mapear campos de formularios de anuncios',
      'Configurar webhook de Meta',
      'Probar flujo de leads desde anuncios'
    ],
    tools: ['Meta Business API', 'Facebook Lead Ads', 'Zapier'],
    difficulty: 'High',
    priority: 'Critical'
  },
  {
    category: 'LinkedIn',
    title: 'LinkedIn Lead Gen Forms',
    description: 'Captura de leads desde LinkedIn Ads',
    steps: [
      'Configurar LinkedIn Campaign Manager',
      'Crear Lead Gen Forms',
      'Conectar con LinkedIn API',
      'Configurar webhook de sincronización',
      'Mapear datos de perfil profesional'
    ],
    tools: ['LinkedIn API', 'Campaign Manager', 'Zapier'],
    difficulty: 'High',
    priority: 'High'
  },
  {
    category: 'Google Ads',
    title: 'Google Ads & Analytics',
    description: 'Integración con Google Ads para tracking completo',
    steps: [
      'Conectar Google Ads API',
      'Configurar Google Analytics 4',
      'Instalar Google Tag Manager',
      'Configurar conversiones y eventos',
      'Mapear UTM parameters a CRM'
    ],
    tools: ['Google Ads API', 'GA4', 'GTM', 'Google Sheets'],
    difficulty: 'Medium',
    priority: 'High'
  },
  {
    category: 'Communication',
    title: 'WhatsApp Business API',
    description: 'Integración para comunicación directa',
    steps: [
      'Configurar WhatsApp Business API',
      'Obtener número verificado',
      'Configurar webhooks de mensajes',
      'Crear templates de mensajes',
      'Integrar con CRM inbox'
    ],
    tools: ['WhatsApp Business API', 'Twilio', 'Meta Cloud API'],
    difficulty: 'High',
    priority: 'Medium'
  },
  {
    category: 'Email',
    title: 'Email Marketing Integration',
    description: 'Conectar con plataformas de email marketing',
    steps: [
      'Configurar SMTP/API de email',
      'Conectar con Mailchimp/SendGrid',
      'Sincronizar listas de contactos',
      'Configurar tracking de emails',
      'Automatizar secuencias de nurturing'
    ],
    tools: ['Mailchimp', 'SendGrid', 'SMTP', 'Zapier'],
    difficulty: 'Medium',
    priority: 'High'
  }
];

const operationalProcedures = [
  {
    title: 'Gestión Diaria de Leads',
    description: 'Procedimiento para procesar leads nuevos',
    frequency: 'Diario - 2 veces',
    steps: [
      'Revisar leads nuevos en dashboard',
      'Verificar lead scoring automático',
      'Calificar leads manualmente si es necesario',
      'Asignar leads a comerciales',
      'Programar primera actividad de contacto',
      'Actualizar estado en pipeline'
    ],
    responsible: 'Equipo Comercial',
    tools: ['CRM Dashboard', 'Lead Scoring', 'Pipeline Kanban']
  },
  {
    title: 'Seguimiento de Pipeline',
    description: 'Revisión y actualización del pipeline de ventas',
    frequency: 'Diario',
    steps: [
      'Revisar oportunidades por etapa',
      'Actualizar probabilidades de cierre',
      'Identificar oportunidades estancadas',
      'Programar actividades de seguimiento',
      'Actualizar fechas de cierre estimadas',
      'Reportar avances a management'
    ],
    responsible: 'Sales Manager',
    tools: ['Pipeline Kanban', 'Reportes', 'Centro de Actividades']
  },
  {
    title: 'Análisis de Fuentes de Leads',
    description: 'Evaluación semanal del rendimiento por canal',
    frequency: 'Semanal',
    steps: [
      'Analizar métricas por fuente de lead',
      'Calcular ROI por canal de marketing',
      'Identificar canales de mejor rendimiento',
      'Ajustar presupuestos de pauta',
      'Optimizar campañas de bajo rendimiento',
      'Reportar insights al equipo de marketing'
    ],
    responsible: 'Marketing Manager',
    tools: ['Reportes CRM', 'Analytics', 'Dashboard de Fuentes']
  },
  {
    title: 'Limpieza y Mantenimiento de Datos',
    description: 'Mantenimiento de calidad de datos del CRM',
    frequency: 'Semanal',
    steps: [
      'Identificar contactos duplicados',
      'Limpiar datos incompletos o incorrectos',
      'Actualizar información de empresas',
      'Verificar emails bounced',
      'Actualizar lead scoring rules',
      'Backup de datos críticos'
    ],
    responsible: 'CRM Administrator',
    tools: ['Herramientas de Limpieza', 'Validación de Emails', 'Backup']
  }
];

const technicalRequirements = [
  {
    category: 'APIs y Webhooks',
    items: [
      'Meta Business API (Facebook/Instagram)',
      'LinkedIn Marketing API',
      'Google Ads API',
      'WhatsApp Business API',
      'Email Service API (SendGrid/Mailchimp)',
      'Webhook endpoints configurados'
    ]
  },
  {
    category: 'Herramientas de Integración',
    items: [
      'Zapier (automatización)',
      'Google Tag Manager',
      'Google Analytics 4',
      'Facebook Pixel',
      'LinkedIn Insight Tag',
      'Herramientas de validación de emails'
    ]
  },
  {
    category: 'Infraestructura',
    items: [
      'Base de datos para almacenamiento',
      'Servidor para webhooks',
      'SSL certificado',
      'Backup automático',
      'Monitoreo de uptime',
      'Logs de errores y actividad'
    ]
  }
];

export default function DocumentationPage() {
  const [selectedSection, setSelectedSection] = useState<string>('setup');
  const [expandedIntegration, setExpandedIntegration] = useState<number | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-orange-100 text-orange-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <WorkspaceLayout>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Documentación CRM"
          description="Guía completa de implementación, configuración y operación del sistema CRM"
          accentColor="blue"
        />

        {/* Navegación de Secciones */}
        <Card>
          <CardHeader>
            <CardTitle>Guía de Implementación</CardTitle>
            <CardDescription>Selecciona una sección para ver la documentación detallada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documentationSections.map((section) => {
                const Icon = section.icon;
                return (
                  <div
                    key={section.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedSection === section.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedSection(section.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${section.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{section.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{section.description}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getPriorityColor(section.priority)}>
                            {section.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {section.estimatedTime}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Configuración Inicial */}
        {selectedSection === 'setup' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configuración Inicial del CRM</span>
                </CardTitle>
                <CardDescription>Pasos fundamentales antes de comenzar a usar el sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center space-x-2">
                      <Database className="h-4 w-4" />
                      <span>1. Configuración de Base de Datos</span>
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Configurar conexión a base de datos</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Crear tablas para leads, contactos, oportunidades</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Configurar índices para optimización</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Establecer backup automático</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>2. Configuración de Usuarios</span>
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Crear roles y permisos</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Configurar usuarios del equipo comercial</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Asignar territorios y responsabilidades</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Configurar notificaciones por usuario</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center space-x-2">
                      <Target className="h-4 w-4" />
                      <span>3. Configuración de Pipeline</span>
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Definir etapas del proceso de ventas</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Configurar probabilidades por etapa</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Establecer criterios de calificación</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Configurar alertas de seguimiento</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>4. Lead Scoring</span>
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Definir criterios de scoring</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Configurar puntuación por fuente</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Establecer umbrales de temperatura</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Configurar scoring automático</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">Importante</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Completa toda la configuración inicial antes de proceder con las integraciones. 
                        Esto asegura que los datos se capturen correctamente desde el primer momento.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Integraciones y Conexiones */}
        {selectedSection === 'integrations' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Integraciones y Conexiones</span>
                </CardTitle>
                <CardDescription>Conecta tu CRM con todas las fuentes de leads y herramientas de comunicación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrationSteps.map((integration, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedIntegration(expandedIntegration === index ? null : index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            {integration.category === 'Web Integration' && <Globe className="h-4 w-4 text-blue-600" />}
                            {integration.category === 'Social Media' && <Instagram className="h-4 w-4 text-pink-600" />}
                            {integration.category === 'LinkedIn' && <Linkedin className="h-4 w-4 text-blue-600" />}
                            {integration.category === 'Google Ads' && <Search className="h-4 w-4 text-green-600" />}
                            {integration.category === 'Communication' && <MessageSquare className="h-4 w-4 text-green-600" />}
                            {integration.category === 'Email' && <Mail className="h-4 w-4 text-blue-600" />}
                          </div>
                          <div>
                            <h3 className="font-semibold">{integration.title}</h3>
                            <p className="text-sm text-muted-foreground">{integration.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getDifficultyColor(integration.difficulty)}>
                            {integration.difficulty}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(integration.priority.toLowerCase())}>
                            {integration.priority}
                          </Badge>
                          <ArrowRight className={`h-4 w-4 transition-transform ${expandedIntegration === index ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      {expandedIntegration === index && (
                        <div className="mt-4 pt-4 border-t space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Pasos de Implementación:</h4>
                            <ol className="space-y-2">
                              {integration.steps.map((step, stepIndex) => (
                                <li key={stepIndex} className="flex items-start space-x-2">
                                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-semibold">
                                    {stepIndex + 1}
                                  </span>
                                  <span className="text-sm">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Herramientas Necesarias:</h4>
                            <div className="flex flex-wrap gap-2">
                              {integration.tools.map((tool, toolIndex) => (
                                <Badge key={toolIndex} variant="secondary" className="text-xs">
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h4 className="font-semibold text-blue-800 mb-1">Código de Ejemplo:</h4>
                            <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono">
                              {integration.category === 'Web Integration' && (
                                <pre>{`// Webhook endpoint para formularios web
app.post('/webhook/leads', (req, res) => {
  const leadData = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    source: 'web-form',
    utm_source: req.body.utm_source,
    utm_campaign: req.body.utm_campaign
  };
  
  // Guardar en CRM
  await saveLead(leadData);
  res.status(200).send('OK');
});`}</pre>
                              )}
                              {integration.category === 'Social Media' && (
                                <pre>{`// Meta Webhook para Lead Ads
app.post('/webhook/meta', (req, res) => {
  const entry = req.body.entry[0];
  const changes = entry.changes[0];
  
  if (changes.field === 'leadgen') {
    const leadgenId = changes.value.leadgen_id;
    // Obtener datos del lead desde Meta API
    fetchLeadFromMeta(leadgenId);
  }
  
  res.status(200).send('OK');
});`}</pre>
                              )}
                              {integration.category === 'Communication' && (
                                <pre>{`// WhatsApp Webhook
app.post('/webhook/whatsapp', (req, res) => {
  const message = req.body.messages[0];
  
  const contactData = {
    phone: message.from,
    message: message.text.body,
    timestamp: message.timestamp,
    source: 'whatsapp'
  };
  
  // Procesar mensaje en CRM
  await processWhatsAppMessage(contactData);
  res.status(200).send('OK');
});`}</pre>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Requerimientos Técnicos */}
            <Card>
              <CardHeader>
                <CardTitle>Requerimientos Técnicos</CardTitle>
                <CardDescription>APIs, herramientas e infraestructura necesaria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-3">
                  {technicalRequirements.map((category, index) => (
                    <div key={index}>
                      <h3 className="font-semibold mb-3">{category.category}</h3>
                      <div className="space-y-2">
                        {category.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Procedimientos Operativos */}
        {selectedSection === 'operations' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Procedimientos Operativos</span>
                </CardTitle>
                <CardDescription>Cómo trabajar día a día con el CRM para maximizar resultados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {operationalProcedures.map((procedure, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{procedure.title}</h3>
                          <p className="text-sm text-muted-foreground">{procedure.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">
                            {procedure.frequency}
                          </Badge>
                          <p className="text-xs text-muted-foreground">{procedure.responsible}</p>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                          <h4 className="font-semibold mb-2">Pasos del Procedimiento:</h4>
                          <ol className="space-y-2">
                            {procedure.steps.map((step, stepIndex) => (
                              <li key={stepIndex} className="flex items-start space-x-2">
                                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-semibold">
                                  {stepIndex + 1}
                                </span>
                                <span className="text-sm">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Herramientas Utilizadas:</h4>
                          <div className="space-y-2">
                            {procedure.tools.map((tool, toolIndex) => (
                              <div key={toolIndex} className="flex items-center space-x-2">
                                <Wrench className="h-4 w-4 text-blue-600" />
                                <span className="text-sm">{tool}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Checklist Diario */}
            <Card>
              <CardHeader>
                <CardTitle>Checklist Diario del CRM</CardTitle>
                <CardDescription>Lista de verificación para el uso diario del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-3">Mañana (9:00 AM)</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Revisar leads nuevos de la noche</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Verificar actividades programadas del día</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Priorizar leads calientes</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Revisar mensajes pendientes en inbox</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Tarde (5:00 PM)</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Actualizar pipeline con avances del día</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Programar actividades para mañana</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Registrar todas las interacciones</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Revisar métricas del día</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Automatización */}
        {selectedSection === 'automation' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RotateCcw className="h-5 w-5" />
                <span>Automatización de Procesos</span>
              </CardTitle>
              <CardDescription>Configurar workflows y automatizaciones para optimizar el trabajo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Próximamente</h3>
                  <p className="text-blue-700 text-sm">
                    Esta sección contendrá la configuración de workflows automáticos, 
                    triggers de acciones y reglas de automatización para el CRM.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mantenimiento */}
        {selectedSection === 'maintenance' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5" />
                <span>Mantenimiento y Optimización</span>
              </CardTitle>
              <CardDescription>Monitoreo continuo y mejora del sistema CRM</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <h3 className="font-semibold text-teal-800 mb-2">En Desarrollo</h3>
                  <p className="text-teal-700 text-sm">
                    Esta sección incluirá procedimientos de mantenimiento, 
                    optimización de rendimiento y análisis de métricas avanzadas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Herramientas y recursos para implementación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Download className="h-5 w-5" />
                <span className="text-sm">Descargar Templates</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Code className="h-5 w-5" />
                <span className="text-sm">Código de Ejemplo</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <ExternalLink className="h-5 w-5" />
                <span className="text-sm">APIs Documentation</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <FileText className="h-5 w-5" />
                <span className="text-sm">Checklist PDF</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </WorkspaceLayout>
  );
}