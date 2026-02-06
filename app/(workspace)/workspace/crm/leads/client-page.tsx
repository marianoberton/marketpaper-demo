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
import PymeLeadsManager from "./components/PymeLeadsManager";

export default function LeadsClientPage() {
  return (
    <WorkspaceLayout>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Gestión de Leads"
          description="Captura automática y gestión inteligente de leads desde múltiples canales"
          accentColor="orange"
        />

        <Tabs defaultValue="contact-leads" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contact-leads">Contact Leads</TabsTrigger>
            <TabsTrigger value="pyme-leads">PYME Leads</TabsTrigger>
            <TabsTrigger value="integration">Integración</TabsTrigger>
          </TabsList>

          <TabsContent value="contact-leads">
            <ContactLeadsManager />
          </TabsContent>

          <TabsContent value="pyme-leads">
            <PymeLeadsManager />
          </TabsContent>

          <TabsContent value="integration">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Integración con Formularios Web</CardTitle>
                  <CardDescription>
                    Captura automática de leads desde tu sitio web
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Contact Leads Integration */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-state-info" />
                        <h3 className="text-lg font-semibold">Contact Leads API</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Para formularios de contacto general y captura de leads estándar
                      </p>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm font-mono">
                          POST /api/webhook/contact-lead
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">JSON</Badge>
                        <Badge variant="outline">Webhook</Badge>
                        <Badge variant="outline">CORS Enabled</Badge>
                      </div>
                    </div>

                    {/* PYME Leads Integration */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-state-success" />
                        <h3 className="text-lg font-semibold">PYME Leads API</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Para formularios específicos de PYMEs con scoring inteligente
                      </p>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm font-mono">
                          POST /api/webhook/pyme-leads
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">JSON</Badge>
                        <Badge variant="outline">Auto-Scoring</Badge>
                        <Badge variant="outline">Priority Detection</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formularios de Ejemplo */}
              <Card>
                <CardHeader>
                  <CardTitle>Formularios de Ejemplo</CardTitle>
                  <CardDescription>
                    Ejemplos listos para usar en tu sitio web
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        <span className="font-medium">Contact Lead Form</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Formulario estándar de contacto
                      </p>
                      <div className="flex gap-2">
                        <a 
                          href="/contact-lead-form-example.html" 
                          target="_blank"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver Ejemplo HTML
                        </a>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        <span className="font-medium">PYME Lead Form</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Formulario específico para PYMEs
                      </p>
                      <div className="flex gap-2">
                        <a 
                          href="/pyme-lead-form-example.html" 
                          target="_blank"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver Ejemplo HTML
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Widgets JavaScript */}
              <Card>
                <CardHeader>
                  <CardTitle>Widgets JavaScript</CardTitle>
                  <CardDescription>
                    Agrega fácilmente formularios a cualquier página
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">PYME Lead Widget</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Widget JavaScript listo para usar
                      </p>
                      <div className="bg-background border rounded p-3 text-sm font-mono">
                        {`<script src="/pyme-lead-widget.js"></script>
<div id="pyme-lead-form"></div>`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documentación */}
              <Card>
                <CardHeader>
                  <CardTitle>Documentación Completa</CardTitle>
                  <CardDescription>
                    Guías detalladas de implementación
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                      <Webhook className="h-3 w-3 mr-1" />
                      API Reference
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                      <Code className="h-3 w-3 mr-1" />
                      Code Examples
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Lead Scoring Guide
                    </Badge>
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
