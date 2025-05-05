import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { socialMediaB2BData } from "@/lib/mock-data"; // Import social data
import { formatNumber, formatPercent } from "@/lib/formatters";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"; // Added Table components
import { 
  Eye, 
  UserCheck, 
  MousePointerClick, 
  Goal, 
  Linkedin, 
  Facebook, // Added Facebook icon
  Instagram, // Added Instagram icon
  Share2, 
  MessageCircle, 
  Save, // Added Save icon
  Percent, 
  ExternalLink, 
  FileText, 
  TrendingUp, 
  Newspaper 
} from "lucide-react"; 
import Link from "next/link";

// Helper to get platform icon
const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform.toLowerCase()) {
    case 'linkedin': return <Linkedin className="h-4 w-4" />;
    case 'facebook': return <Facebook className="h-4 w-4" />;
    case 'instagram': return <Instagram className="h-4 w-4" />;
    default: return null;
  }
};

export default function SocialB2BPage() {
  const data = socialMediaB2BData;
  const summary = data.summaryKpis;
  const platforms = data.platforms;
  const aggregated = data.aggregated;

  return (
    <DashboardLayout>
      <div className="flex flex-col p-6 gap-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Redes Sociales (B2B)</h1>
            <p className="text-muted-foreground">
              Visibilidad profesional, interacción y generación de leads.
            </p>
          </div>
        </div>

        {/* --- KPI Stats Cards --- */}
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Impresiones (LinkedIn)"
            value={formatNumber(summary.linkedinImpressions.value)}
            iconName="Linkedin" // Changed icon to Linkedin
            trend={{ value: summary.linkedinImpressions.change, isUpward: summary.linkedinImpressions.isUp }}
            tooltip="Número total de veces que se mostró el contenido en LinkedIn."
          />
           <StatsCard
            title="Visitas al Perfil (LinkedIn)"
            value={formatNumber(summary.linkedinProfileVisits.value)}
            iconName="UserCheck" // Changed icon
            trend={{ value: summary.linkedinProfileVisits.change, isUpward: summary.linkedinProfileVisits.isUp }}
            tooltip="Visitas directas a la página de empresa en LinkedIn."
          />
           <StatsCard
            title="Total Clics al Sitio Web"
            value={formatNumber(summary.totalWebsiteClicks.value)}
            iconName="MousePointerClick"
            trend={{ value: summary.totalWebsiteClicks.change, isUpward: summary.totalWebsiteClicks.isUp }}
            tooltip="Clics totales en enlaces desde redes sociales hacia el sitio web."
          />
          <StatsCard
            title="Total Leads Generados"
            value={formatNumber(summary.totalLeadsGenerated.value)}
            iconName="Goal"
            trend={{ value: summary.totalLeadsGenerated.change, isUpward: summary.totalLeadsGenerated.isUp }}
            tooltip="Formularios/cotizaciones totales desde tráfico social."
            status="success"
          />
        </section>

        {/* --- Platform Comparison Table --- */}
        <section>
          <Card>
             <CardHeader>
                <CardTitle>Rendimiento por Plataforma</CardTitle>
                <CardDescription>Comparativa de métricas clave entre redes sociales.</CardDescription>
             </CardHeader>
             <CardContent className="overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Plataforma</TableHead>
                     <TableHead className="text-right">Sesiones Web</TableHead>
                     <TableHead className="text-right">Clics Web</TableHead>
                     <TableHead className="text-right">Leads</TableHead>
                     <TableHead className="text-right">Tasa Conv. Leads</TableHead>
                     <TableHead className="text-right">Guardados</TableHead> 
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {Object.values(platforms).map((p) => (
                     <TableRow key={p.name}>
                       <TableCell className="font-medium flex items-center gap-2">
                         <PlatformIcon platform={p.name} />
                         {p.name}
                       </TableCell>
                       <TableCell className="text-right">{formatNumber(p.sessions)}</TableCell>
                       <TableCell className="text-right">{formatNumber(p.websiteClicks)}</TableCell>
                       <TableCell className="text-right">{formatNumber(p.leadsGenerated)}</TableCell>
                       <TableCell className="text-right">{formatPercent(p.leadConversionRate)}</TableCell>
                       <TableCell className="text-right">{formatNumber(p.saves)}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </CardContent>
          </Card>
        </section>

        {/* --- Aggregated Interaction & Conversions --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Interacción Total</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Eye className="h-4 w-4"/> <span className="text-sm text-muted-foreground">Alcance Total Estimado</span></div>
                <span className="font-medium">{formatNumber(aggregated.totalReach)}</span>
              </div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2"><Share2 className="h-4 w-4"/> <span className="text-sm text-muted-foreground">Compartidos Totales</span></div>
                <span className="font-medium">{formatNumber(aggregated.totalShares)}</span>
              </div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2"><MessageCircle className="h-4 w-4"/> <span className="text-sm text-muted-foreground">Comentarios Relevantes</span></div>
                <span className="font-medium">{formatNumber(aggregated.totalComments)}</span>
              </div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2"><Save className="h-4 w-4"/> <span className="text-sm text-muted-foreground">Guardados Totales</span></div>
                <span className="font-medium">{formatNumber(aggregated.totalSaves)}</span>
              </div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2"><Percent className="h-4 w-4"/> <span className="text-sm text-muted-foreground">Tasa Interacción (Global)</span></div>
                <span className="font-medium">{formatPercent(aggregated.overallInteractionRate)}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Conversiones B2B (Global)</CardTitle>
            </CardHeader>
             <CardContent className="space-y-4">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Tasa Conv. Leads (Global)</span>
                 </div>
                 <span className="font-medium text-green-500">{formatPercent(aggregated.overallLeadConversionRate)}</span>
               </div>
                <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Conversiones Asistidas</span>
                 </div>
                 <span className="font-medium">{formatNumber(aggregated.assistedConversions)}</span>
               </div>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>Tráfico Web Referido (Social)</CardTitle>
            </CardHeader>
            <CardContent>
               <div>
                 <h4 className="text-sm font-medium mb-2">Páginas de Destino Populares</h4>
                 <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                   {data.trafficQuality.topLandingPages.map(page => <li key={page}>{page}</li>)}
                 </ul>
               </div>
               {/* Other aggregated traffic quality metrics can go here if needed */}
            </CardContent>
          </Card>
        </section>

         {/* --- Content Performance --- */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento del Contenido</CardTitle>
              <CardDescription>Publicaciones destacadas por plataforma y métrica principal.</CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Plataforma</TableHead>
                     <TableHead>Publicación</TableHead>
                     <TableHead className="text-right">Métrica Principal</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                    {data.contentPerformance.topPosts.map((post, index) => (
                      <TableRow key={index}>
                        <TableCell><PlatformIcon platform={post.platform} /></TableCell>
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell className="text-right">
                          {/* Display relevant metric based on metricType */}
                          {post.metricType === 'Leads' && `${formatNumber(post.leads)} Leads`}
                          {post.metricType === 'Clicks' && `${formatNumber(post.clicks)} Clics`}
                          {post.metricType === 'Saves' && `${formatNumber(post.saves ?? 0)} Guardados`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </CardContent>
          </Card>
        </section>

      </div>
    </DashboardLayout>
  );
} 