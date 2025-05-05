import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { MetricsChart } from "@/components/ui/metrics-chart";
import { crmData, conversionMetrics } from "@/lib/mock-data";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { Users, UserPlus, Target, List, Ticket, Clock, Smile } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CrmPage() {
  const kpis = crmData.kpis;
  const ltv = conversionMetrics.LTV;

  return (
    <DashboardLayout>
      <div className="flex flex-col p-6 gap-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestión de Clientes (CRM)</h1>
            <p className="text-muted-foreground">
              Visión general de clientes, leads, LTV y pipeline de ventas.
            </p>
          </div>
        </div>

        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Clientes Totales"
            value={formatNumber(kpis.totalCustomers.value)}
            iconName="Users"
            trend={{
              value: kpis.totalCustomers.change,
              isUpward: kpis.totalCustomers.isUp
            }}
            tooltip="Número total de clientes registrados."
          />
           <StatsCard
            title="Nuevos Leads (Mes)"
            value={formatNumber(kpis.newLeadsMonthly.value)}
            iconName="UserPlus"
            trend={{
              value: kpis.newLeadsMonthly.change,
              isUpward: kpis.newLeadsMonthly.isUp
            }}
            tooltip="Leads generados en el último mes."
          />
          <StatsCard
            title="Valor de Vida (LTV)"
            value={formatCurrency(ltv.value)}
            iconName="Target"
            trend={{
              value: ltv.change,
              isUpward: ltv.isUp
            }}
            tooltip="Valor promedio proyectado de un cliente a lo largo de su relación."
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              {/* Keep CardHeader empty */}
            </CardHeader>
            <CardContent className="pt-4">
               <MetricsChart
                  title="Fuentes de Leads (%)"
                  description="Distribución de origen de los nuevos leads."
                  data={crmData.leadSources}
                  series={[{ name: "Leads", key: "value" }]}
                  chartType="pie"
                  showLegend={true}
               />
            </CardContent>
          </Card>
          <Card>
             <CardHeader>
            </CardHeader>
            <CardContent className="pt-4">
               <MetricsChart
                  title="Segmentación de Clientes"
                  description="Distribución de clientes por segmento."
                  data={crmData.customerSegments}
                  series={[{ name: "Clientes", key: "value", color:"#8884d8" }]}
                  chartType="bar"
                  formatterType="number"
                  showGrid={false}
                  height={250}
               />
            </CardContent>
          </Card>
        </section>

         <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Pipeline de Ventas</CardTitle>
              <CardDescription>Oportunidades activas por etapa.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Etapa</TableHead>
                     <TableHead className="text-right">Oportunidades</TableHead>
                     <TableHead className="text-right">Valor Total</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {crmData.salesPipeline.map((item) => (
                     <TableRow key={item.stage}>
                       <TableCell className="font-medium">{item.stage}</TableCell>
                       <TableCell className="text-right">{item.count}</TableCell>
                       <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Soporte</CardTitle>
              <CardDescription>Indicadores clave del área.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Ticket className="h-5 w-5 text-muted-foreground" />
                     <span className="text-sm font-medium">Tickets Abiertos</span>
                  </div>
                  <span className="text-lg font-bold">{crmData.supportSummary.openTickets}</span>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Clock className="h-5 w-5 text-muted-foreground" />
                     <span className="text-sm font-medium">Resolución Prom.</span>
                  </div>
                  <span className="text-lg font-bold">{crmData.supportSummary.avgResolutionTimeHours} hs</span>
               </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Smile className="h-5 w-5 text-muted-foreground" />
                     <span className="text-sm font-medium">Satisfacción Prom.</span>
                  </div>
                  <span className="text-lg font-bold">{crmData.supportSummary.satisfactionScore} / 5</span>
               </div>
            </CardContent>
          </Card>
        </section>

      </div>
    </DashboardLayout>
  );
} 