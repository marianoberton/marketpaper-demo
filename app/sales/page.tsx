import { DashboardLayout } from "@/components/dashboard-layout";
import { StatsCard } from "@/components/ui/stats-card";
import { MetricsChart } from "@/components/ui/metrics-chart";
import { salesData } from "@/lib/mock-data";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  CreditCard
} from "lucide-react";

export default function SalesPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col p-6 gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">
            Análisis detallado de las ventas, productos y canales de distribución
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4">Tendencia de Ventas</h2>
          <Tabs defaultValue="day">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="day">Diario</TabsTrigger>
                <TabsTrigger value="week">Semanal</TabsTrigger>
                <TabsTrigger value="month">Mensual</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="day" className="mt-0">
              <MetricsChart
                title="Ventas diarias"
                description="Ingresos por día de la semana actual"
                data={salesData.revenueByDay}
                series={[
                  {
                    name: "Ingresos",
                    key: "revenue",
                    color: "#8884d8"
                  }
                ]}
                chartType="bar"
                formatterType="currency"
              />
            </TabsContent>
            
            <TabsContent value="week" className="mt-0">
              <MetricsChart
                title="Ventas semanales"
                description="Ingresos por semana del mes actual"
                data={salesData.revenueByWeek}
                series={[
                  {
                    name: "Ingresos",
                    key: "revenue",
                    color: "#8884d8"
                  }
                ]}
                chartType="bar"
                formatterType="currency"
              />
            </TabsContent>
            
            <TabsContent value="month" className="mt-0">
              <MetricsChart
                title="Ventas mensuales"
                description="Tendencia de ingresos por mes"
                data={salesData.revenueByMonth}
                series={[
                  {
                    name: "Ingresos",
                    key: "revenue",
                    color: "#8884d8"
                  }
                ]}
                chartType="line"
                formatterType="currency"
              />
            </TabsContent>
          </Tabs>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Productos con mejor rendimiento</h2>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Productos</CardTitle>
                <CardDescription>Por ingresos generados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesData.topProducts.map((product, index) => (
                    <div key={product.name} className="flex items-start">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {index + 1}
                      </div>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.units} unidades | {formatCurrency(product.revenue)}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        {formatCurrency(product.revenue / product.units)}
                        <span className="text-xs text-muted-foreground ml-1">por unidad</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Categorías principales</CardTitle>
                <CardDescription>Por ingresos y crecimiento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesData.topCategories.map((category) => (
                    <div key={category.name}>
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-sm font-medium">{category.name}</p>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">{formatCurrency(category.revenue)}</span>
                          <span className="text-xs text-green-500">↑ {category.growth}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-full rounded-full" 
                          style={{ width: `${(category.revenue / salesData.topCategories[0].revenue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Métodos de Pago y Distribución</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Distribución de pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {salesData.paymentMethods.map((method) => (
                    <div key={method.name}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm">{method.name}</p>
                        <p className="font-medium">{method.value}%</p>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`bg-primary h-full rounded-full`}
                          style={{ width: `${method.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Canal de ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm">Web propia</p>
                      <p className="font-medium">65%</p>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: "65%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm">MercadoLibre</p>
                      <p className="font-medium">35%</p>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-orange-500 h-full rounded-full"
                        style={{ width: "35%" }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ticket promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(4580)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  +2.7% vs mes anterior
                </p>
                <div className="flex items-center mt-4">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-full rounded-full"
                      style={{ width: "75%" }}
                    />
                  </div>
                  <span className="text-xs ml-2">75% de meta</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tasa de recompra</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  32%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  +5.5% vs mes anterior
                </p>
                <div className="flex items-center mt-4">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-full rounded-full"
                      style={{ width: "80%" }}
                    />
                  </div>
                  <span className="text-xs ml-2">80% de meta</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Comparativa con MercadoLibre</h2>
          <Card>
            <CardHeader>
              <CardTitle>Evolución Web vs. MercadoLibre</CardTitle>
              <CardDescription>
                Objetivo: reducir dependencia de MercadoLibre y escalar ventas web de $30M a $80M mensuales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                      <p className="text-sm font-medium">Web propia</p>
                    </div>
                    <p className="text-sm font-medium">{formatCurrency(32850000)} (65%)</p>
                  </div>
                  <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: "65%" }}>
                      <div className="flex items-center justify-center h-full text-xs font-medium text-white">
                        65%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Actual: {formatCurrency(32850000)}</span>
                    <span>Meta: {formatCurrency(80000000)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                      <p className="text-sm font-medium">MercadoLibre</p>
                    </div>
                    <p className="text-sm font-medium">{formatCurrency(17700000)} (35%)</p>
                  </div>
                  <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full" style={{ width: "35%" }}>
                      <div className="flex items-center justify-center h-full text-xs font-medium text-white">
                        35%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>6 meses atrás: 58%</span>
                    <span>Meta futura: 20%</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Progreso hacia el objetivo</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-24">Web propia</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div className="bg-primary h-full rounded-full" style={{ width: "41%" }}></div>
                    </div>
                    <span className="text-sm">41%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Web propia está al 41% del objetivo de $80M mensuales. Crecimiento sostenido de +8.2% mensual.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
} 