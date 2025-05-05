import { DashboardLayout } from "@/components/dashboard-layout";
import { StatsCard } from "@/components/ui/stats-card";
import { MetricsChart } from "@/components/ui/metrics-chart";
import { conversionMetrics } from "@/lib/mock-data";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign,
  LineChart,
  ShoppingBag,
  TrendingUp,
  Users
} from "lucide-react";

export default function ConversionPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col p-6 gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Métricas de Conversión</h1>
          <p className="text-muted-foreground">
            Análisis del rendimiento de ventas, marketing y retención de clientes
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4">KPIs de Conversión</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <StatsCard
              title="Tasa de conversión"
              value={`${conversionMetrics.conversionRate.value}%`}
              iconName="TrendingUp"
              trend={{
                value: conversionMetrics.conversionRate.change,
                isUpward: conversionMetrics.conversionRate.isUp
              }}
              benchmark={conversionMetrics.conversionRate.benchmark}
              tooltip="Porcentaje de sesiones que terminan en una compra (Pedidos/Sesiones)"
              status={conversionMetrics.conversionRate.value >= 2.5 ? "success" : "warning"}
            />
            
            <StatsCard
              title="Costo de Adquisición (CAC)"
              value={formatCurrency(conversionMetrics.CAC.value)}
              iconName="DollarSign"
              trend={{
                value: conversionMetrics.CAC.change,
                isUpward: conversionMetrics.CAC.isUp
              }}
              benchmark={conversionMetrics.CAC.benchmark}
              tooltip="Costo promedio para adquirir un nuevo cliente"
              status={conversionMetrics.CAC.value <= 600 ? "success" : "warning"}
            />
            
            <StatsCard
              title="ROAS"
              value={`${conversionMetrics.ROAS.value}x`}
              iconName="LineChart"
              trend={{
                value: conversionMetrics.ROAS.change,
                isUpward: conversionMetrics.ROAS.isUp
              }}
              benchmark={conversionMetrics.ROAS.benchmark}
              tooltip="Return on Ad Spend (Retorno sobre inversión publicitaria)"
              status={conversionMetrics.ROAS.value >= 4 ? "success" : "warning"}
            />
            
            <StatsCard
              title="Valor de vida (LTV)"
              value={formatCurrency(conversionMetrics.LTV.value)}
              iconName="Users"
              trend={{
                value: conversionMetrics.LTV.change,
                isUpward: conversionMetrics.LTV.isUp
              }}
              tooltip="Valor promedio que genera un cliente a lo largo de su relación con la empresa"
            />
            
            <StatsCard
              title="Valor medio de pedido"
              value={formatCurrency(conversionMetrics.AOV.value)}
              iconName="ShoppingBag"
              trend={{
                value: conversionMetrics.AOV.change,
                isUpward: conversionMetrics.AOV.isUp
              }}
              benchmark={conversionMetrics.AOV.benchmark}
              tooltip="Ticket promedio por pedido"
              status="success"
            />
          </div>
        </section>

        <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Evolución de la Tasa de Conversión</CardTitle>
            </CardHeader>
            <CardContent>
              <MetricsChart
                title=""
                data={conversionMetrics.conversionRate.history}
                series={[
                  {
                    name: "Tasa de conversión",
                    key: "value",
                    color: "#8884d8"
                  }
                ]}
                chartType="line"
                height={300}
                formatterType="percent"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relación CAC / LTV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">CAC</span>
                    <span>{formatCurrency(conversionMetrics.CAC.value)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-4">
                    <div 
                      className="bg-blue-500 h-full rounded-full" 
                      style={{ width: `${(conversionMetrics.CAC.value / 1000) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">LTV</span>
                    <span>{formatCurrency(conversionMetrics.LTV.value)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-4">
                    <div 
                      className="bg-green-500 h-full rounded-full" 
                      style={{ width: `${(conversionMetrics.LTV.value / 10000) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Ratio LTV:CAC</span>
                    <span className="text-xl font-bold">
                      {(conversionMetrics.LTV.value / conversionMetrics.CAC.value).toFixed(1)}x
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {conversionMetrics.LTV.value / conversionMetrics.CAC.value >= 3 
                      ? "Excelente ratio - El valor del cliente es significativamente mayor que el costo de adquisición"
                      : "El ratio LTV:CAC debería ser al menos 3:1 para un negocio saludable"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Desempeño por Canal</h2>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Tráfico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <div className="w-full max-w-md">
                    {conversionMetrics.channelPerformance.traffic.map((channel) => (
                      <div key={channel.name} className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{channel.name}</span>
                          <span className="text-sm">{channel.value}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-full rounded-full ${
                              channel.name === "Orgánico" 
                                ? "bg-green-500" 
                                : channel.name === "Social" 
                                ? "bg-blue-500" 
                                : channel.name === "Email" 
                                ? "bg-purple-500" 
                                : channel.name === "Directo" 
                                ? "bg-yellow-500" 
                                : "bg-gray-500"
                            }`}
                            style={{ width: `${channel.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <div className="w-full max-w-md">
                    {conversionMetrics.channelPerformance.orders.map((channel) => (
                      <div key={channel.name} className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{channel.name}</span>
                          <span className="text-sm">{channel.value}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-full rounded-full ${
                              channel.name === "Orgánico" 
                                ? "bg-green-500" 
                                : channel.name === "Social" 
                                ? "bg-blue-500" 
                                : channel.name === "Email" 
                                ? "bg-purple-500" 
                                : channel.name === "Directo" 
                                ? "bg-yellow-500" 
                                : "bg-gray-500"
                            }`}
                            style={{ width: `${channel.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Métricas de Email Marketing</h2>
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
      </div>
    </DashboardLayout>
  );
} 