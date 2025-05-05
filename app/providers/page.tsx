import { DashboardLayout } from "@/components/dashboard-layout";
import { providerPerformance } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function ProvidersPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col p-6 gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rendimiento de Proveedores</h1>
          <p className="text-muted-foreground">
            Análisis comparativo del desempeño de cada área y proveedor
          </p>
        </div>

        <Tabs defaultValue="wonder">
          <div className="overflow-x-auto pb-1 mb-4">
            <TabsList>
              <TabsTrigger value="wonder">Publicidad (Wonder)</TabsTrigger>
              <TabsTrigger value="tech">Desarrollo Web</TabsTrigger>
              <TabsTrigger value="zippin">Logística (Zippin)</TabsTrigger>
              <TabsTrigger value="manychat">CRM & Atención</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="wonder">
            <section>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Agencia Wonder (Meta Ads)</CardTitle>
                  <CardDescription>
                    Análisis del rendimiento de campañas en Meta Ads a través de la agencia Wonder
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    {providerPerformance.wonderAgency.metrics.map((metric) => (
                      <div key={metric.name} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium break-words">{metric.name}</span>
                          <div className={`h-2 w-2 rounded-full ${
                            metric.status === "success" 
                              ? "bg-green-500" 
                              : metric.status === "warning" 
                              ? "bg-yellow-500" 
                              : "bg-red-500"
                          }`} />
                        </div>
                        <div className="text-2xl font-bold break-words">{metric.value}</div>
                        <div className="text-xs text-muted-foreground break-words">
                          Meta: {metric.target}
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className={`h-full rounded-full ${
                              metric.status === "success" 
                                ? "bg-green-500" 
                                : metric.status === "warning" 
                                ? "bg-yellow-500" 
                                : "bg-red-500"
                            }`}
                            style={{ width: `${(typeof metric.value === 'number' ? metric.value : parseFloat(metric.value)) / (typeof metric.target === 'number' ? metric.target : parseFloat(metric.target)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolución de KPIs</CardTitle>
                    <CardDescription>
                      Tendencia de los principales indicadores en los últimos 6 meses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">ROAS</span>
                        <div className="flex gap-1 items-center">
                          <div className="w-full flex h-2 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full" style={{ width: "10%" }} />
                            <div className="bg-orange-500 h-full" style={{ width: "20%" }} />
                            <div className="bg-yellow-500 h-full" style={{ width: "30%" }} />
                            <div className="bg-green-500 h-full" style={{ width: "40%" }} />
                          </div>
                          <span className="ml-2 text-xs text-muted-foreground">↑ +9%</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">CAC</span>
                        <div className="flex gap-1 items-center">
                          <div className="w-full flex h-2 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full" style={{ width: "25%" }} />
                            <div className="bg-orange-500 h-full" style={{ width: "20%" }} />
                            <div className="bg-yellow-500 h-full" style={{ width: "25%" }} />
                            <div className="bg-green-500 h-full" style={{ width: "30%" }} />
                          </div>
                          <span className="ml-2 text-xs text-muted-foreground">↓ -5%</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Click-through rate</span>
                        <div className="flex gap-1 items-center">
                          <div className="w-full flex h-2 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full" style={{ width: "15%" }} />
                            <div className="bg-orange-500 h-full" style={{ width: "15%" }} />
                            <div className="bg-yellow-500 h-full" style={{ width: "20%" }} />
                            <div className="bg-green-500 h-full" style={{ width: "50%" }} />
                          </div>
                          <span className="ml-2 text-xs text-muted-foreground">↑ +12%</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Conversion rate</span>
                        <div className="flex gap-1 items-center">
                          <div className="w-full flex h-2 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full" style={{ width: "10%" }} />
                            <div className="bg-orange-500 h-full" style={{ width: "15%" }} />
                            <div className="bg-yellow-500 h-full" style={{ width: "30%" }} />
                            <div className="bg-green-500 h-full" style={{ width: "45%" }} />
                          </div>
                          <span className="ml-2 text-xs text-muted-foreground">↑ +8%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Rendimiento de campañas</CardTitle>
                    <CardDescription>
                      Principales campañas del mes actual
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <div className="flex flex-col">
                          <span className="font-medium">Flash Sale</span>
                          <span className="text-xs text-muted-foreground">Promoción 48h</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-medium">ROAS 6.2x</span>
                          <span className="text-xs text-green-500">+38% vs meta</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="flex flex-col">
                          <span className="font-medium">Remarketing</span>
                          <span className="text-xs text-muted-foreground">Abandoned cart</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-medium">ROAS 5.8x</span>
                          <span className="text-xs text-green-500">+29% vs meta</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="flex flex-col">
                          <span className="font-medium">Prospecting</span>
                          <span className="text-xs text-muted-foreground">Nuevos clientes</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-medium">ROAS 3.9x</span>
                          <span className="text-xs text-muted-foreground">-13% vs meta</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="flex flex-col">
                          <span className="font-medium">Branding</span>
                          <span className="text-xs text-muted-foreground">Awareness</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-medium">ROAS 2.5x</span>
                          <span className="text-xs text-red-500">-44% vs meta</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="tech">
            <section>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Proveedor Tecnológico</CardTitle>
                  <CardDescription>
                    Evaluación del rendimiento técnico y desarrollo web
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    {providerPerformance.tech.metrics.map((metric) => (
                      <div key={metric.name} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium break-words">{metric.name}</span>
                          <div className={`h-2 w-2 rounded-full ${
                            metric.status === "success" 
                              ? "bg-green-500" 
                              : metric.status === "warning" 
                              ? "bg-yellow-500" 
                              : "bg-red-500"
                          }`} />
                        </div>
                        <div className="text-2xl font-bold break-words">{metric.value}</div>
                        <div className="text-xs text-muted-foreground break-words">
                          Meta: {metric.target}
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className={`h-full rounded-full ${
                              metric.status === "success" 
                                ? "bg-green-500" 
                                : metric.status === "warning" 
                                ? "bg-yellow-500" 
                                : "bg-red-500"
                            }`}
                            style={{ width: `${
                              typeof metric.value === 'string' && typeof metric.target === 'string'
                                ? (parseFloat(metric.value) / parseFloat(metric.target)) * 100 
                                : 70
                            }%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Tickets resueltos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Críticos</span>
                        <span className="text-sm font-medium">100% (5/5)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: "100%" }} />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Altos</span>
                        <span className="text-sm font-medium">87% (13/15)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: "87%" }} />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Medios</span>
                        <span className="text-sm font-medium">75% (18/24)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-yellow-500 h-full rounded-full" style={{ width: "75%" }} />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Bajos</span>
                        <span className="text-sm font-medium">62% (18/29)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: "62%" }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de despliegues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="font-medium">v2.4.0</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Hace 3 días</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="font-medium">v2.3.5</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Hace 1 semana</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <span className="font-medium">v2.3.4</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Hace 12 días</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="font-medium">v2.3.3</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Hace 15 días</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="zippin">
            <section>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Logística Zippin</CardTitle>
                  <CardDescription>
                    Evaluación del rendimiento de envíos y operaciones logísticas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    {providerPerformance.zippin.metrics.map((metric) => (
                      <div key={metric.name} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium break-words">{metric.name}</span>
                          <div className={`h-2 w-2 rounded-full ${
                            metric.status === "success" 
                              ? "bg-green-500" 
                              : metric.status === "warning" 
                              ? "bg-yellow-500" 
                              : "bg-red-500"
                          }`} />
                        </div>
                        <div className="text-2xl font-bold break-words">{metric.value}</div>
                        <div className="text-xs text-muted-foreground break-words">
                          Meta: {metric.target}
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className={`h-full rounded-full ${
                              metric.status === "success" 
                                ? "bg-green-500" 
                                : metric.status === "warning" 
                                ? "bg-yellow-500" 
                                : "bg-red-500"
                            }`}
                            style={{ width: `${
                              typeof metric.value === 'number' 
                                ? (metric.value / (typeof metric.target === 'number' ? metric.target : 100)) * 100
                                : 80
                            }%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Desempeño por transportista</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Andreani</span>
                        <span className="text-sm font-medium">96% on-time</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: "96%" }} />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium">OCA</span>
                        <span className="text-sm font-medium">94% on-time</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: "94%" }} />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Correo Argentino</span>
                        <span className="text-sm font-medium">89% on-time</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-yellow-500 h-full rounded-full" style={{ width: "89%" }} />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Motoneta</span>
                        <span className="text-sm font-medium">98% on-time</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: "98%" }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Devoluciones y problemas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Producto dañado</span>
                        <span className="font-medium">1.5%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: "1.5%" }} />
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Envío a dirección incorrecta</span>
                        <span className="font-medium">0.8%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: "0.8%" }} />
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Pedido incompleto</span>
                        <span className="font-medium">0.7%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: "0.7%" }} />
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Producto equivocado</span>
                        <span className="font-medium">0.5%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: "0.5%" }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="manychat">
            <section>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>CRM & Atención (ManyChat)</CardTitle>
                  <CardDescription>
                    Evaluación del rendimiento de atención al cliente y automatizaciones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    {providerPerformance.manychat.metrics.map((metric) => (
                      <div key={metric.name} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium break-words">{metric.name}</span>
                          <div className={`h-2 w-2 rounded-full ${
                            metric.status === "success" 
                              ? "bg-green-500" 
                              : metric.status === "warning" 
                              ? "bg-yellow-500" 
                              : "bg-red-500"
                          }`} />
                        </div>
                        <div className="text-2xl font-bold break-words">{metric.value}</div>
                        <div className="text-xs text-muted-foreground break-words">
                          Meta: {metric.target}
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className={`h-full rounded-full ${
                              metric.status === "success" 
                                ? "bg-green-500" 
                                : metric.status === "warning" 
                                ? "bg-yellow-500" 
                                : "bg-red-500"
                            }`}
                            style={{ width: `${
                              typeof metric.value === 'number'
                                ? (metric.value / (typeof metric.target === 'number' ? metric.target : 100)) * 100
                                : 70
                            }%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Automatizaciones efectivas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <div className="flex flex-col">
                          <span className="font-medium">Recuperación de carrito</span>
                          <span className="text-xs text-muted-foreground">Conversión: 18%</span>
                        </div>
                        <div className="text-sm font-medium">85 carritos</div>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="flex flex-col">
                          <span className="font-medium">Onboarding clientes</span>
                          <span className="text-xs text-muted-foreground">Completado: 82%</span>
                        </div>
                        <div className="text-sm font-medium">325 clientes</div>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="flex flex-col">
                          <span className="font-medium">FAQ automático</span>
                          <span className="text-xs text-muted-foreground">Resuelto: 73%</span>
                        </div>
                        <div className="text-sm font-medium">640 consultas</div>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="flex flex-col">
                          <span className="font-medium">Cross-sell post compra</span>
                          <span className="text-xs text-muted-foreground">Conversión: 9%</span>
                        </div>
                        <div className="text-sm font-medium">45 ventas extra</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Temas de consulta frecuentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Estado de pedido</span>
                        <span className="font-medium">42%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: "42%" }} />
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Cambios/devoluciones</span>
                        <span className="font-medium">28%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: "28%" }} />
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Información de producto</span>
                        <span className="font-medium">18%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: "18%" }} />
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Problemas de pago</span>
                        <span className="font-medium">8%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: "8%" }} />
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Otros</span>
                        <span className="font-medium">4%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: "4%" }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 