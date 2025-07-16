"use client";

import { WorkspaceLayout } from "@/components/workspace-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Globe,
  TrendingUp,
  Target,
  ExternalLink,
  Code,
  Webhook
} from "lucide-react";
import ContactLeadsManager from "./components/ContactLeadsManager";

export default function LeadsClientPage() {
  return (
    <WorkspaceLayout>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Gestión de Leads"
          description="Captura automática y gestión inteligente de leads desde múltiples canales"
          accentColor="orange"
        />

        <Tabs defaultValue="contact-leads" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contact-leads">Contact Leads</TabsTrigger>
            <TabsTrigger value="traditional-leads">Leads Tradicionales</TabsTrigger>
            <TabsTrigger value="integration">Integración</TabsTrigger>
          </TabsList>

          <TabsContent value="contact-leads">
            <ContactLeadsManager />
          </TabsContent>

          <TabsContent value="traditional-leads">
            <Card>
              <CardHeader>
                <CardTitle>Leads Tradicionales</CardTitle>
                <CardDescription>
                  Sistema de leads tradicional - próximamente integrado con Contact Leads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Sistema Tradicional</h3>
                  <p className="mb-4">
                    Esta sección será integrada con el nuevo sistema de Contact Leads
                  </p>
                  <Badge variant="outline">Próximamente</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Integración con Formularios Web</CardTitle>
                  <CardDescription>
                    Configura la captura automática de leads desde tu sitio web
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Webhook className="h-4 w-4" />
                      Endpoint de Captura
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Utiliza este endpoint para enviar leads desde tu formulario web:
                    </p>
                    <code className="block bg-background p-2 rounded text-sm">
                      POST /api/webhook/contact-lead
                    </code>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Ejemplo de Implementación
                    </h4>
                    <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`// Ejemplo JavaScript para formularios web
fetch('/api/webhook/contact-lead', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    company_id: 'tu-company-id',
    name: 'Nombre del Lead',
    email: 'email@ejemplo.com',
    company: 'Empresa del Lead',
    pain_point: 'Problema o necesidad',
    phone: '+34 600 000 000', // opcional
    website: 'https://ejemplo.com', // opcional
    source: 'website_form',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'brand-awareness'
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Lead capturado:', data.contact_lead);
  }
});`}
                    </pre>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-blue-900">Características Clave</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Captura automática desde formularios web</li>
                      <li>• Lead scoring automático basado en criterios inteligentes</li>
                      <li>• Prevención de duplicados por email</li>
                      <li>• Tracking de UTM parameters para analytics</li>
                      <li>• Notificaciones automáticas al equipo de ventas</li>
                      <li>• Compatibilidad con CORS para dominios externos</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-green-900 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Próximas Integraciones
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong className="text-green-800">Redes Sociales:</strong>
                        <ul className="text-green-700 mt-1">
                          <li>• Facebook Lead Ads</li>
                          <li>• Instagram Lead Forms</li>
                          <li>• LinkedIn Lead Gen Forms</li>
                        </ul>
                      </div>
                      <div>
                        <strong className="text-green-800">Plataformas de Marketing:</strong>
                        <ul className="text-green-700 mt-1">
                          <li>• Google Ads</li>
                          <li>• Mailchimp</li>
                          <li>• HubSpot (Webhook)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Documentación Técnica</CardTitle>
                  <CardDescription>
                    Guías detalladas para implementar la captura de leads
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Guía de Integración</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Paso a paso para configurar formularios web
                      </p>
                      <a
                        href="/workspace/crm/documentation"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      >
                        Ver documentación
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">API Reference</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Documentación completa de la API
                      </p>
                      <a
                        href="/workspace/crm/documentation"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      >
                        Ver API docs
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </WorkspaceLayout>
  );
} 
