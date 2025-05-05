import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { MetricsChart } from "@/components/ui/metrics-chart";
import { chatData } from "@/lib/mock-data";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { 
  MessageSquare, 
  Bot, 
  ShoppingCart, 
  DollarSign, 
  Clock, 
  Smile, 
  UserPlus, 
  TrendingUp, 
  TrendingDown 
} from "lucide-react"; // Added required icons

export default function ChatPage() {
  const kpis = chatData.kpis;

  // Helper to determine status based on target
  const getStatus = (value: number, target: number | undefined, lowerIsBetter = false): "success" | "warning" | "danger" | undefined => {
    if (target === undefined) return undefined;
    const achieved = lowerIsBetter ? value <= target : value >= target;
    return achieved ? "success" : "warning"; 
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col p-6 gap-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Rendimiento del Chat</h1>
            <p className="text-muted-foreground">
              Análisis de interacciones, automatización y resultados de ManyChat.
            </p>
          </div>
        </div>

        {/* --- KPI Stats Cards --- */}
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
           <StatsCard
            title="Interacciones Totales"
            value={formatNumber(kpis.totalInteractions.value)}
            description={kpis.totalInteractions.description}
            iconName="MessageSquare"
            trend={{
              value: kpis.totalInteractions.change,
              isUpward: kpis.totalInteractions.isUp
            }}
            tooltip="Total de conversaciones iniciadas en el chatbot este mes."
          />
           <StatsCard
            title="Resolución por Bot"
            value={`${kpis.botResolutionRate.value}${kpis.botResolutionRate.unit}`}
            description={kpis.botResolutionRate.description}
            iconName="Bot"
            benchmark={`Meta: ${kpis.botResolutionRate.target}%`}
            status={getStatus(kpis.botResolutionRate.value, kpis.botResolutionRate.target)}
            tooltip="Porcentaje de consultas resueltas automáticamente por el bot."
          />
           <StatsCard
            title="Carritos Recuperados"
            value={formatNumber(kpis.cartsRecovered.value)}
            description={kpis.cartsRecovered.description}
            iconName="ShoppingCart"
            tooltip="Cantidad de carritos abandonados recuperados a través de interacciones de chat."
          />
           <StatsCard
            title="Ingresos Generados"
            value={formatCurrency(kpis.revenueGenerated.value)}
            description={kpis.revenueGenerated.description}
            iconName="DollarSign"
            tooltip="Ingresos atribuidos directamente a conversaciones o recuperaciones de carrito vía chat."
          />
           <StatsCard
            title="Tiempo Respuesta (Hum.)"
            value={`${kpis.avgResponseTime.value} ${kpis.avgResponseTime.unit}`}
            description={kpis.avgResponseTime.description}
            iconName="Clock"
            benchmark={`Meta: ${kpis.avgResponseTime.target} min`}
            status={getStatus(kpis.avgResponseTime.value, kpis.avgResponseTime.target, true)} // Lower is better
            tooltip="Tiempo promedio que tarda un agente humano en responder tras escalamiento."
          />
           <StatsCard
            title="Satisfacción Usuario"
            value={`${kpis.userSatisfaction.value}${kpis.userSatisfaction.unit}`}
            description={kpis.userSatisfaction.description}
            iconName="Smile"
            benchmark={`Meta: ${kpis.userSatisfaction.target}/5`}
            status={getStatus(kpis.userSatisfaction.value, kpis.userSatisfaction.target)}
            tooltip="Puntuación promedio de satisfacción reportada por los usuarios tras interactuar con el chat/bot."
          />
           <StatsCard
            title="Leads Generados"
            value={formatNumber(kpis.leadsGenerated.value)}
            description={kpis.leadsGenerated.description}
            iconName="UserPlus"
            benchmark={`Meta: ${kpis.leadsGenerated.target}`}
            status={getStatus(kpis.leadsGenerated.value, kpis.leadsGenerated.target)}
            tooltip="Nuevos contactos o suscriptores capturados a través del chatbot."
          />
        </section>

        {/* --- Conversation Flow & Frequent Topics --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Flujo de Conversación</CardTitle>
              <CardDescription>Recorrido del usuario en el chatbot.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chatData.conversationFlow.map((step, index) => (
                  <div key={step.stage} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                       <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">{index + 1}</span>
                       <div>
                         <p className="text-sm font-medium leading-none">{step.stage}</p>
                         <p className="text-xs text-muted-foreground pt-1">{step.description}</p>
                       </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatNumber(step.users)}</p>
                      <p className="text-xs text-muted-foreground">({step.percentage}%)</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              {/* Intentionally keep CardHeader empty for now if title/desc are required in chart */}
            </CardHeader>
            <CardContent className="pt-4">
               <MetricsChart
                  title="Temas de Consulta Frecuentes"
                  description="Distribución de las consultas realizadas al chatbot."
                  data={chatData.frequentTopics}
                  series={[{ name: "Consultas", key: "value" }]}
                  chartType="pie"
                  showLegend={true}
               />
            </CardContent>
          </Card>
        </section>

      </div>
    </DashboardLayout>
  );
} 