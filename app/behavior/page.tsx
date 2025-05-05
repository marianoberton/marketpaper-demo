import { DashboardLayout } from "@/components/dashboard-layout";
import { StatsCard } from "@/components/ui/stats-card";
import { MetricsChart } from "@/components/ui/metrics-chart";
import { userBehaviorStats } from "@/lib/mock-data";
import { formatPercent, formatTime } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Clock, 
  ExternalLink, 
  Eye, 
  FileText, 
  ShoppingCart,
  AlertTriangle
} from "lucide-react";

export default function BehaviorPage() {
  // Prepare data for funnel chart
  const funnelData = userBehaviorStats.userFlow.map(step => ({
    name: step.stage, // Map stage to name
    value: step.users, // Map users to value
  }));

  return (
    <DashboardLayout>
      <div className="flex flex-col p-6 gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comportamiento de Usuarios</h1>
          <p className="text-muted-foreground">
            Análisis de la interacción de los usuarios con tu e-commerce
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4">Métricas de Comportamiento</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <StatsCard
              title="Visitas semanales"
              value={userBehaviorStats.visitsAndSessions.weekly}
              iconName="Eye"
              trend={{
                value: userBehaviorStats.visitsAndSessions.change,
                isUpward: userBehaviorStats.visitsAndSessions.isUp
              }}
              tooltip="Total de sesiones en los últimos 7 días"
            />
            
            <StatsCard
              title="Tasa de rebote"
              value={`${userBehaviorStats.bounceRate.value}%`}
              iconName="ExternalLink"
              trend={{
                value: userBehaviorStats.bounceRate.change,
                isUpward: userBehaviorStats.bounceRate.isUp
              }}
              benchmark={userBehaviorStats.bounceRate.benchmark}
              tooltip="Porcentaje de usuarios que abandonan el sitio después de ver una sola página"
              status={userBehaviorStats.bounceRate.value <= 55 ? "success" : "warning"}
            />
            
            <StatsCard
              title="Duración media de sesión"
              value={userBehaviorStats.avgSessionDuration.label}
              iconName="Clock"
              trend={{
                value: userBehaviorStats.avgSessionDuration.change,
                isUpward: userBehaviorStats.avgSessionDuration.isUp
              }}
              benchmark={userBehaviorStats.avgSessionDuration.benchmark}
              tooltip="Tiempo promedio que los usuarios permanecen en el sitio por sesión"
              status="success"
            />
            
            <StatsCard
              title="Páginas por sesión"
              value={userBehaviorStats.pagesPerSession.value}
              iconName="FileText"
              trend={{
                value: userBehaviorStats.pagesPerSession.change,
                isUpward: userBehaviorStats.pagesPerSession.isUp
              }}
              benchmark={userBehaviorStats.pagesPerSession.benchmark}
              tooltip="Número promedio de páginas vistas por sesión"
              status="success"
            />
            
            <StatsCard
              title="Tasa Abandono Carrito"
              value={`${userBehaviorStats.cartAbandonmentRate.value}%`}
              iconName="ShoppingCart"
              trend={{
                value: userBehaviorStats.cartAbandonmentRate.change,
                isUpward: !userBehaviorStats.cartAbandonmentRate.isUp 
              }}
              benchmark={userBehaviorStats.cartAbandonmentRate.benchmark}
              tooltip="Porcentaje de usuarios que agregan al carrito pero no completan la compra."
              status={userBehaviorStats.cartAbandonmentRate.value > 65 ? "danger" : "success"}
            />
          </div>
        </section>

        <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <MetricsChart
            title="Embudo de Conversión"
            description="Recorrido del usuario desde Inicio hasta Compra."
            data={funnelData}
            series={[{ name: "Usuarios", key: "value" }]}
            chartType="funnel"
            formatterType="number"
            height={300}
          />
          <Card>
            <CardHeader>
              <CardTitle>Visitas Diarias</CardTitle>
            </CardHeader>
            <CardContent>
              <MetricsChart
                title=""
                data={userBehaviorStats.visitsAndSessions.daily}
                series={[
                  {
                    name: "Nuevos usuarios",
                    key: "newUsers",
                    color: "#82ca9d"
                  },
                  {
                    name: "Usuarios recurrentes",
                    key: "returning",
                    color: "#8884d8"
                  }
                ]}
                chartType="bar"
                height={240}
              />
            </CardContent>
          </Card>
        </section>

        {/* Section 3: Search Terms and Abandonment Reasons */}
        <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
           {/* Column 1: Top Searches */}
           <Card>
              <CardHeader>
                <CardTitle>Términos más buscados</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                  {userBehaviorStats.topSearches.map((term, index) => (
                    <div key={term} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium capitalize">{term}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
           {/* Column 2: Abandonment Reasons */}
            <Card>
              <CardHeader>
                <CardTitle>Motivos de Abandono (Carrito)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Re-adding the abandonment reasons content correctly */}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Problemas de envío</span>
                    <span className="font-medium">32%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: "32%" }} />
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Comparando precios</span>
                    <span className="font-medium">28%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: "28%" }} />
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Proceso de checkout</span>
                    <span className="font-medium">18%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: "18%" }} />
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Métodos de pago</span>
                    <span className="font-medium">12%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: "12%" }} />
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Otros</span>
                    <span className="font-medium">10%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: "10%" }} />
                  </div>
                </div>
              </CardContent>
            </Card>
        </section>
      </div>
    </DashboardLayout>
  );
} 