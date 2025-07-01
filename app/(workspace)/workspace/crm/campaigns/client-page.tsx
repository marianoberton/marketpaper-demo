"use client";

import { WorkspaceLayout } from "@/components/workspace-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Plus,
  TrendingUp,
  Users,
  BarChart3
} from "lucide-react";

export default function CampaignsClientPage() {
  return (
    <WorkspaceLayout>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Gestión de Campañas"
          description="Campañas multicanal con análisis de rendimiento y ROI"
          accentColor="plum"
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Campañas Activas</CardTitle>
              <Zap className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">5</div>
              <p className="text-xs text-muted-foreground">2 programadas</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ROI Promedio</CardTitle>
              <TrendingUp className="h-5 w-5 text-brilliant-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">340%</div>
              <p className="text-xs text-muted-foreground">+25% vs mes anterior</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Leads Generados</CardTitle>
              <Users className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">1,247</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasa Conversión</CardTitle>
              <BarChart3 className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">18.5%</div>
              <p className="text-xs text-muted-foreground">+3.2% este trimestre</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Campañas Activas</CardTitle>
                <CardDescription>
                  Sistema de campañas multicanal en desarrollo...
                </CardDescription>
              </div>
              <Button className="bg-brilliant-blue hover:bg-brilliant-blue/90">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Campaña
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Gestión de campañas multicanal en desarrollo...
            </div>
          </CardContent>
        </Card>
      </div>
    </WorkspaceLayout>
  );
} 
