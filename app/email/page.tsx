import { DashboardLayout } from "@/components/dashboard-layout";
import { StatsCard } from "@/components/ui/stats-card";
import { MetricsChart } from "@/components/ui/metrics-chart";
import { conversionMetrics, testingData } from "@/lib/mock-data";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MailIcon,
  Clock,
  CheckCircle,
  MousePointer,
  ShoppingCart
} from "lucide-react";

export default function EmailPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col p-6 gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Marketing</h1>
          <p className="text-muted-foreground">
            Análisis del rendimiento de campañas de email y flujos automatizados
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4">Métricas de Email</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tasa de entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionMetrics.emailMetrics.deliveryRate.toFixed(1)}%</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Porcentaje de emails que llegan a la bandeja del destinatario
                </div>
                <div className="mt-3 w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-full rounded-full" 
                    style={{ width: `${conversionMetrics.emailMetrics.deliveryRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tasa de apertura</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionMetrics.emailMetrics.openRate.toFixed(1)}%</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Porcentaje de emails abiertos
                </div>
                <div className="mt-3 w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-full rounded-full" 
                    style={{ width: `${conversionMetrics.emailMetrics.openRate * 3}%` }}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">CTR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionMetrics.emailMetrics.clickRate.toFixed(1)}%</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Tasa de clics sobre emails abiertos
                </div>
                <div className="mt-3 w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-full rounded-full" 
                    style={{ width: `${conversionMetrics.emailMetrics.clickRate * 5}%` }}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ingresos por email</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(conversionMetrics.emailMetrics.revenue)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Ventas generadas a través de campañas de email
                </div>
                <div className="mt-4 flex justify-center">
                  <span className="text-sm text-green-500 font-medium">+12% vs mes anterior</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Rendimiento por campaña</h2>
          <Card>
            <CardHeader>
              <CardTitle>Top Campañas del Mes</CardTitle>
              <CardDescription>Ordenado por ingresos generados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MailIcon className="h-4 w-4 text-primary" />
                        <span className="font-medium">Flash Sale Junio</span>
                      </div>
                      <span className="font-medium">{formatCurrency(285000)}</span>
                    </div>
                    <div className="mt-1 flex items-center text-xs text-muted-foreground justify-between">
                      <div>Enviados: 12,500 | Abiertos: 28% | Clicks: 12%</div>
                      <div className="text-green-500">ROAS: 6.2x</div>
                    </div>
                    <div className="mt-2 w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-full rounded-full" style={{ width: "100%" }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MailIcon className="h-4 w-4 text-primary" />
                        <span className="font-medium">Descuento Fidelización</span>
                      </div>
                      <span className="font-medium">{formatCurrency(195000)}</span>
                    </div>
                    <div className="mt-1 flex items-center text-xs text-muted-foreground justify-between">
                      <div>Enviados: 8,750 | Abiertos: 32% | Clicks: 15%</div>
                      <div className="text-green-500">ROAS: 5.3x</div>
                    </div>
                    <div className="mt-2 w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-full rounded-full" style={{ width: "68%" }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MailIcon className="h-4 w-4 text-primary" />
                        <span className="font-medium">Lanzamiento Temporada</span>
                      </div>
                      <span className="font-medium">{formatCurrency(132000)}</span>
                    </div>
                    <div className="mt-1 flex items-center text-xs text-muted-foreground justify-between">
                      <div>Enviados: 15,200 | Abiertos: 21% | Clicks: 8%</div>
                      <div className="text-green-500">ROAS: 4.1x</div>
                    </div>
                    <div className="mt-2 w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-full rounded-full" style={{ width: "46%" }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MailIcon className="h-4 w-4 text-primary" />
                        <span className="font-medium">Newsletter Semanal</span>
                      </div>
                      <span className="font-medium">{formatCurrency(98500)}</span>
                    </div>
                    <div className="mt-1 flex items-center text-xs text-muted-foreground justify-between">
                      <div>Enviados: 22,450 | Abiertos: 18% | Clicks: 5%</div>
                      <div className="text-green-500">ROAS: 3.8x</div>
                    </div>
                    <div className="mt-2 w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-full rounded-full" style={{ width: "35%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Automatizaciones de Email</h2>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Secuencia de Bienvenida</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Usuarios en secuencia</span>
                      <div className="text-2xl font-bold">{testingData.automationResults.emailAutomation.welcomeSequence.sent}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Conversiones</span>
                      <div className="text-2xl font-bold">{testingData.automationResults.emailAutomation.welcomeSequence.converted}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        <MailIcon className="h-4 w-4 inline mr-1" />
                        Emails abiertos
                      </span>
                      <span className="font-medium">
                        {Math.round((testingData.automationResults.emailAutomation.welcomeSequence.opened / testingData.automationResults.emailAutomation.welcomeSequence.sent) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-full rounded-full" 
                        style={{ 
                          width: `${(testingData.automationResults.emailAutomation.welcomeSequence.opened / testingData.automationResults.emailAutomation.welcomeSequence.sent) * 100}%` 
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        <MailIcon className="h-4 w-4 inline mr-1" />
                        Clics en links
                      </span>
                      <span className="font-medium">
                        {Math.round((testingData.automationResults.emailAutomation.welcomeSequence.clicked / testingData.automationResults.emailAutomation.welcomeSequence.opened) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-full rounded-full" 
                        style={{ 
                          width: `${(testingData.automationResults.emailAutomation.welcomeSequence.clicked / testingData.automationResults.emailAutomation.welcomeSequence.opened) * 100}%` 
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        <ShoppingCart className="h-4 w-4 inline mr-1" />
                        Conversión final
                      </span>
                      <span className="font-medium">
                        {Math.round((testingData.automationResults.emailAutomation.welcomeSequence.converted / testingData.automationResults.emailAutomation.welcomeSequence.sent) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-full rounded-full" 
                        style={{ 
                          width: `${(testingData.automationResults.emailAutomation.welcomeSequence.converted / testingData.automationResults.emailAutomation.welcomeSequence.sent) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-md text-sm">
                    <p className="font-medium">Top performer: Email #2</p>
                    <p className="text-muted-foreground mt-1">
                      "Productos destacados para tus primeras compras" - 24% CTR, 8% conversión
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recuperación de Carrito</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Emails enviados</span>
                      <div className="text-2xl font-bold">{testingData.automationResults.emailAutomation.abandonedCart.sent}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Carritos recuperados</span>
                      <div className="text-2xl font-bold">{testingData.automationResults.emailAutomation.abandonedCart.recovered}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        <MailIcon className="h-4 w-4 inline mr-1" />
                        Emails abiertos
                      </span>
                      <span className="font-medium">
                        {Math.round((testingData.automationResults.emailAutomation.abandonedCart.opened / testingData.automationResults.emailAutomation.abandonedCart.sent) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-full rounded-full" 
                        style={{ 
                          width: `${(testingData.automationResults.emailAutomation.abandonedCart.opened / testingData.automationResults.emailAutomation.abandonedCart.sent) * 100}%` 
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        <MailIcon className="h-4 w-4 inline mr-1" />
                        Clics en links
                      </span>
                      <span className="font-medium">
                        {Math.round((testingData.automationResults.emailAutomation.abandonedCart.clicked / testingData.automationResults.emailAutomation.abandonedCart.opened) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-full rounded-full" 
                        style={{ 
                          width: `${(testingData.automationResults.emailAutomation.abandonedCart.clicked / testingData.automationResults.emailAutomation.abandonedCart.opened) * 100}%` 
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        <ShoppingCart className="h-4 w-4 inline mr-1" />
                        Tasa de recuperación
                      </span>
                      <span className="font-medium">
                        {Math.round((testingData.automationResults.emailAutomation.abandonedCart.recovered / testingData.automationResults.emailAutomation.abandonedCart.sent) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-full rounded-full" 
                        style={{ 
                          width: `${(testingData.automationResults.emailAutomation.abandonedCart.recovered / testingData.automationResults.emailAutomation.abandonedCart.sent) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Timing más efectivo</span>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                      <div className="text-sm">
                        <span className="font-medium">60 minutos</span> después del abandono
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        24% recuperación
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Lista de Suscriptores</h2>
          <Card>
            <CardHeader>
              <CardTitle>Crecimiento de la lista</CardTitle>
              <CardDescription>Evolución y fuentes de captación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="font-medium text-sm mb-4">Crecimiento mensual</div>
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <span className="text-3xl font-bold">24,850</span>
                      <span className="text-xs text-muted-foreground ml-1">suscriptores activos</span>
                    </div>
                    <span className="text-sm font-medium text-green-500">+8.5% vs mes anterior</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Tasa de crecimiento</div>
                    <div className="flex space-x-1">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-muted rounded-sm h-8"
                          style={{ 
                            height: `${20 + Math.sin(i / 3) * 15 + Math.random() * 10}px`,
                            backgroundColor: i === 11 ? 'hsl(var(--primary))' : undefined
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Jun 2022</span>
                      <span>Jun 2023</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="font-medium text-sm mb-4">Fuentes de captación</div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">Popup sitio web</span>
                        <span className="text-sm font-medium">42%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div className="bg-primary h-full rounded-full" style={{ width: "42%" }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">Checkout (opt-in)</span>
                        <span className="text-sm font-medium">28%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div className="bg-primary h-full rounded-full" style={{ width: "28%" }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">Landing pages</span>
                        <span className="text-sm font-medium">15%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div className="bg-primary h-full rounded-full" style={{ width: "15%" }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">Campañas lead ads</span>
                        <span className="text-sm font-medium">10%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div className="bg-primary h-full rounded-full" style={{ width: "10%" }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">Otros</span>
                        <span className="text-sm font-medium">5%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div className="bg-primary h-full rounded-full" style={{ width: "5%" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
} 