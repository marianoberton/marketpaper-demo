import { DashboardLayout } from "@/components/dashboard-layout";
import { StatsCard } from "@/components/ui/stats-card";
import { MetricsChart } from "@/components/ui/metrics-chart";
import { realtimeStats, salesData, weeklyReport, userBehaviorStats, conversionMetrics, channelDistributionData } from "@/lib/mock-data";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, DollarSign, Users, ShoppingCart, AlertTriangle, CheckCircle, Target } from "lucide-react";
import Link from "next/link";

// Helper function to choose an icon based on highlight text (simple example)
const getHighlightIcon = (text: string) => {
  if (text.includes("superó") || text.includes("mejoró") || text.includes("Aumento")) {
    return <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />;
  } else if (text.includes("Stock bajo")) {
    return <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />;
  } else if (text.includes("ROAS")) { // Example for specific metric mention
    return <Target className="h-4 w-4 text-blue-500 flex-shrink-0" />;
  } else {
    return <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />; // Default
  }
};

export default function Home() {
  return (
    <DashboardLayout>
      <div className="flex flex-col p-6 gap-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Resumen Ejecutivo</h1>
            <p className="text-muted-foreground">
              Vista centralizada del rendimiento de tu e-commerce
            </p>
          </div>
          {/* Optional: Add Market Paper logo back here if desired */}
        </div>

        <Tabs defaultValue="realtime">
          <TabsList className="mb-4">
            <TabsTrigger value="realtime">Tiempo Real</TabsTrigger>
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="space-y-6 mt-0">
            {/* --- Resumen en Tiempo Real Section --- */}
            <section>
              {/* <h2 className="text-lg font-semibold mb-4">Resumen en Tiempo Real</h2> */} {/* Title optional within tab */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <StatsCard
                  title="Ventas del día"
                  value={formatCurrency(realtimeStats.salesNow.value)}
                  description={`Meta diaria: ${formatCurrency(realtimeStats.salesNow.target)}`}
                  iconName="DollarSign"
                  trend={{
                    value: realtimeStats.salesNow.change,
                    isUpward: realtimeStats.salesNow.isUp
                  }}
                  tooltip="Ventas realizadas hoy hasta el momento, comparado con el mismo momento del día anterior"
                />
                
                <StatsCard
                  title="Usuarios activos ahora"
                  value={realtimeStats.activeUsers.value}
                  description={`${realtimeStats.activeUsers.organic} orgánico, ${realtimeStats.activeUsers.paid} pago, ${realtimeStats.activeUsers.direct} directo`}
                  iconName="Users"
                  trend={{
                    value: realtimeStats.activeUsers.change,
                    isUpward: realtimeStats.activeUsers.isUp
                  }}
                  tooltip="Número de visitantes navegando el sitio en este momento"
                />
                
                <StatsCard
                  title="Pedidos hoy"
                  value={realtimeStats.ordersToday.value}
                  iconName="ShoppingCart"
                  trend={{
                    value: realtimeStats.ordersToday.change,
                    isUpward: realtimeStats.ordersToday.isUp
                  }}
                  tooltip="Cantidad de compras realizadas hoy hasta el momento"
                />
                
                <StatsCard
                  title="Tasa de conversión"
                  value={`${realtimeStats.conversionRate.value}%`}
                  iconName="TrendingUp"
                  trend={{
                    value: realtimeStats.conversionRate.change,
                    isUpward: realtimeStats.conversionRate.isUp
                  }}
                  benchmark={realtimeStats.conversionRate.benchmark}
                  tooltip="Porcentaje de sesiones que terminan en compra (Pedidos/Sesiones)"
                  status={realtimeStats.conversionRate.value >= 2.5 ? "success" : "warning"}
                />
                
                <StatsCard
                  title={`ROAS: ${realtimeStats.campaignROAS.name}`}
                  value={`${realtimeStats.campaignROAS.value}x`}
                  description={`Gasto: ${formatCurrency(realtimeStats.campaignROAS.spend)}`}
                  iconName="BarChart3"
                  trend={{
                    value: realtimeStats.campaignROAS.change,
                    isUpward: realtimeStats.campaignROAS.isUp
                  }}
                  benchmark={realtimeStats.campaignROAS.benchmark}
                  tooltip="Return on Ad Spend (Retorno sobre inversión) de campañas activas"
                  status={realtimeStats.campaignROAS.value >= 3 ? "success" : "warning"}
                />
              </div>
            </section>

            {/* --- New Grid for Daily Sales Line Chart & Channel Distribution Pie Chart --- */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MetricsChart
                title="Ventas Diarias"
                description="Ingresos por día de la semana actual"
                data={salesData.revenueByDay} // Still uses the single 'revenue' key data for now
                series={[
                  {
                    name: "Ingresos",
                    key: "revenue",
                    color: "#8884d8"
                  }
                ]}
                chartType="bar" // Changed back to bar chart
                formatterType="currency"
              />

              <MetricsChart
                title="Distribución por Canal"
                description="Fuentes de tráfico y ventas (%)"
                data={channelDistributionData} // Use new channel data
                series={[
                  { 
                    name: "Distribución", 
                    key: "value", 
                    // Color is defined within the data itself for pie charts
                  }
                ]}
                chartType="pie" // Use pie chart type
                showLegend={true}
              />
            </section>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-6 mt-0">
            {/* --- KPIs Principales Section --- */}
            <section>
              <h2 className="text-lg font-semibold mb-4">KPIs Principales</h2>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Comportamiento de Usuario</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Visitas semanales</span>
                        <span className="text-2xl font-bold">{userBehaviorStats.visitsAndSessions.weekly}</span>
                        <span className={`text-xs ${userBehaviorStats.visitsAndSessions.isUp ? "text-green-500" : "text-red-500"}`}>
                          {userBehaviorStats.visitsAndSessions.isUp ? "↑" : "↓"} {Math.abs(userBehaviorStats.visitsAndSessions.change)}%
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Tasa de rebote</span>
                        <span className="text-2xl font-bold">{userBehaviorStats.bounceRate.value}%</span>
                        <span className={`text-xs ${!userBehaviorStats.bounceRate.isUp ? "text-green-500" : "text-red-500"}`}>
                          {userBehaviorStats.bounceRate.isUp ? "↑" : "↓"} {Math.abs(userBehaviorStats.bounceRate.change)}%
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Duración media</span>
                        <span className="text-2xl font-bold">{userBehaviorStats.avgSessionDuration.label}</span>
                        <span className={`text-xs ${userBehaviorStats.avgSessionDuration.isUp ? "text-green-500" : "text-red-500"}`}>
                          {userBehaviorStats.avgSessionDuration.isUp ? "↑" : "↓"} {Math.abs(userBehaviorStats.avgSessionDuration.change)}%
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Abandono carrito</span>
                        <span className="text-2xl font-bold">{userBehaviorStats.cartAbandonmentRate.value}%</span>
                        <span className={`text-xs ${!userBehaviorStats.cartAbandonmentRate.isUp ? "text-green-500" : "text-red-500"}`}>
                          {userBehaviorStats.cartAbandonmentRate.isUp ? "↑" : "↓"} {Math.abs(userBehaviorStats.cartAbandonmentRate.change)}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 text-sm">
                      <Link href="/behavior" className="text-primary hover:underline">Ver detalles →</Link>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Conversión y Marketing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Conversión</span>
                        <span className="text-2xl font-bold">{conversionMetrics.conversionRate.value}%</span>
                        <span className={`text-xs ${conversionMetrics.conversionRate.isUp ? "text-green-500" : "text-red-500"}`}>
                          {conversionMetrics.conversionRate.isUp ? "↑" : "↓"} {Math.abs(conversionMetrics.conversionRate.change)}%
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">CAC</span>
                        <span className="text-2xl font-bold">{formatCurrency(conversionMetrics.CAC.value)}</span>
                        <span className={`text-xs ${!conversionMetrics.CAC.isUp ? "text-green-500" : "text-red-500"}`}>
                          {conversionMetrics.CAC.isUp ? "↑" : "↓"} {Math.abs(conversionMetrics.CAC.change)}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">ROAS</span>
                        <span className="text-2xl font-bold">{conversionMetrics.ROAS.value}x</span>
                        <span className={`text-xs ${conversionMetrics.ROAS.isUp ? "text-green-500" : "text-red-500"}`}>
                          {conversionMetrics.ROAS.isUp ? "↑" : "↓"} {Math.abs(conversionMetrics.ROAS.change)}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Valor Pedido Medio</span>
                        <span className="text-2xl font-bold">{formatCurrency(conversionMetrics.AOV.value)}</span>
                        <span className={`text-xs ${conversionMetrics.AOV.isUp ? "text-green-500" : "text-red-500"}`}>
                          {conversionMetrics.AOV.isUp ? "↑" : "↓"} {Math.abs(conversionMetrics.AOV.change)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 text-sm">
                      <Link href="/conversion" className="text-primary hover:underline">Ver detalles →</Link>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Email Marketing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Tasa de entrega</span>
                        <span className="text-2xl font-bold">{conversionMetrics.emailMetrics.deliveryRate.toFixed(1)}%</span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Tasa de apertura</span>
                        <span className="text-2xl font-bold">{conversionMetrics.emailMetrics.openRate.toFixed(1)}%</span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">CTR</span>
                        <span className="text-2xl font-bold">{conversionMetrics.emailMetrics.clickRate.toFixed(1)}%</span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Ingresos por email</span>
                        <span className="text-2xl font-bold">{formatCurrency(conversionMetrics.emailMetrics.revenue / 1000)}K</span>
                      </div>
                    </div>
                    <div className="mt-4 text-sm">
                      <Link href="/email" className="text-primary hover:underline">Ver detalles →</Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* --- Reporte Semanal Section --- */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Reporte Semanal</h2>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <Card className="md:col-span-3">
                  <CardHeader>
                    <CardTitle>KPIs Principales de la Semana</CardTitle>
                    <CardDescription>Métricas clave con comparativa semanal</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                      {weeklyReport.kpis.map((kpi) => (
                        <div key={kpi.name} className="flex flex-col gap-1">
                          <p className="text-sm font-medium text-muted-foreground">{kpi.name}</p>
                          <p className="text-xl font-bold">{kpi.value}</p>
                          <div className="flex items-center">
                            <span
                              className={`mr-1 text-xs ${
                                kpi.isUp ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {kpi.isUp ? "↑" : "↓"} {Math.abs(kpi.change)}%
                            </span>
                            <span className="text-xs text-muted-foreground">vs anterior</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Hallazgos destacados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {weeklyReport.highlights.map((highlight, i) => (
                        <div key={i} className="flex items-start gap-3">
                          {getHighlightIcon(highlight)} 
                          <span className="text-sm leading-tight">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Rendimiento por canal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {weeklyReport.channelPerformance.slice(0, 3).map((channel) => (
                        <div key={channel.channel} className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-medium">{channel.channel}</span>
                            <span className="text-xs text-muted-foreground">
                              {channel.orders} pedidos | {formatNumber(channel.sessions)} sesiones
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">{formatCurrency(channel.revenue)}</span>
                          </div>
                        </div>
                      ))}
                      <div className="text-xs text-right text-muted-foreground">
                        <Link href="/conversion" className="hover:underline">Ver todos los canales →</Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>
        </Tabs>

        {/* Removed original <Tendencia de Ventas> section */}

      </div>
    </DashboardLayout>
  );
}
