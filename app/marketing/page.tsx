import { DashboardLayout } from "@/components/dashboard-layout";
import { StatsCard } from "@/components/ui/stats-card";
import { MetricsChart } from "@/components/ui/metrics-chart";
import { marketingData } from "@/lib/mock-data"; // Assuming this exists or we will create it
import { formatCurrency, formatPercent, formatNumber } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  LineChart, 
  TrendingUp, 
  Users, 
  MousePointerClick, 
  Goal 
} from "lucide-react";

export default function MarketingPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col p-6 gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rendimiento de Marketing</h1>
          <p className="text-muted-foreground">
            Análisis de campañas de Meta Ads y Google Ads
          </p>
        </div>

        {/* Placeholder for content */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Resumen General</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Gasto Total"
              value={formatCurrency(marketingData.overall.spend)}
              iconName="DollarSign"
              tooltip="Gasto total en publicidad en Meta y Google Ads"
            />
            <StatsCard
              title="ROAS General"
              value={`${marketingData.overall.roas}x`}
              iconName="LineChart"
              benchmark="> 4x"
              status={marketingData.overall.roas >= 4 ? "success" : "warning"}
              tooltip="Retorno de la inversión publicitaria general (Ingresos/Gasto)"
            />
            <StatsCard
              title="CAC General"
              value={formatCurrency(marketingData.overall.cac)}
              iconName="Users"
              benchmark="< $600"
              status={marketingData.overall.cac <= 600 ? "success" : "warning"}
              tooltip="Costo promedio de adquisición de cliente general"
            />
            <StatsCard
              title="Conversiones Totales"
              value={formatNumber(marketingData.overall.conversions)}
              iconName="Goal"
              tooltip="Número total de conversiones generadas por publicidad"
            />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Rendimiento por Plataforma</h2>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Meta Ads Card */}
            <Card>
              <CardHeader>
                <CardTitle>Meta Ads</CardTitle>
                <CardDescription>Rendimiento de campañas en Facebook & Instagram</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">ROAS</span>
                      <span className="text-2xl font-bold">{marketingData.metaAds.roas}x</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Gasto</span>
                      <span className="text-2xl font-bold">{formatCurrency(marketingData.metaAds.spend)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Conversiones</span>
                      <span className="text-2xl font-bold">{formatNumber(marketingData.metaAds.conversions)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">CPA</span>
                      <span className="text-2xl font-bold">{formatCurrency(marketingData.metaAds.cpa)}</span>
                    </div>
                  </div>
                  <MetricsChart
                    title="Evolución ROAS Meta"
                    data={marketingData.metaAds.history}
                    series={[{ name: "ROAS", key: "value", color: "#3b82f6" }]}
                    chartType="line"
                    height={200}
                    formatterType="default" // ROAS is just a number
                    showLegend={false}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Google Ads Card */}
            <Card>
              <CardHeader>
                <CardTitle>Google Ads</CardTitle>
                <CardDescription>Rendimiento de campañas en Búsqueda & Shopping</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">ROAS</span>
                      <span className="text-2xl font-bold">{marketingData.googleAds.roas}x</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Gasto</span>
                      <span className="text-2xl font-bold">{formatCurrency(marketingData.googleAds.spend)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Conversiones</span>
                      <span className="text-2xl font-bold">{formatNumber(marketingData.googleAds.conversions)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">CPA</span>
                      <span className="text-2xl font-bold">{formatCurrency(marketingData.googleAds.cpa)}</span>
                    </div>
                  </div>
                  <MetricsChart
                    title="Evolución ROAS Google"
                    data={marketingData.googleAds.history}
                    series={[{ name: "ROAS", key: "value", color: "#10b981" }]}
                    chartType="line"
                    height={200}
                    formatterType="default" // ROAS is just a number
                    showLegend={false}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Campañas Destacadas</h2>
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Campañas por ROAS</CardTitle>
              <CardDescription>Mejores campañas combinando Meta y Google Ads</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="space-y-6">
                {marketingData.topCampaigns
                  .sort((a, b) => b.roas - a.roas)
                  .map((campaign, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span 
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold ${campaign.platform === 'Meta' ? 'bg-blue-500' : 'bg-green-500'}`}>
                        {campaign.platform === 'Meta' ? 'M' : 'G'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-none truncate max-w-xs break-words">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.platform} Ads
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-right sm:text-left">
                      <div className="flex flex-col items-end sm:items-start">
                        <span className="text-xs text-muted-foreground">ROAS</span>
                        <span className="text-sm font-semibold">{campaign.roas.toFixed(1)}x</span>
                      </div>
                      <div className="flex flex-col items-end sm:items-start">
                        <span className="text-xs text-muted-foreground">Ingresos</span>
                        <span className="text-sm font-semibold">{formatCurrency(campaign.revenue)}</span>
                      </div>
                      <div className="flex flex-col items-end sm:items-start">
                        <span className="text-xs text-muted-foreground">Gasto</span>
                        <span className="text-sm font-semibold">{formatCurrency(campaign.spend)}</span>
                      </div>
                      <div className="flex flex-col items-end sm:items-start">
                        <span className="text-xs text-muted-foreground">CPA</span>
                        <span className="text-sm font-semibold">{formatCurrency(campaign.cpa)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

      </div>
    </DashboardLayout>
  );
} 