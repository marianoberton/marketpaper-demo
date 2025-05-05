import { DashboardLayout } from "@/components/dashboard-layout";
import { StatsCard } from "@/components/ui/stats-card";
import { technicalPerformance } from "@/lib/mock-data";
import { formatPercent, formatTime } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Clock,
  AlertCircle,
  Server,
  Zap
} from "lucide-react";

export default function TechnicalPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col p-6 gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rendimiento Técnico</h1>
          <p className="text-muted-foreground">
            Análisis de la performance técnica de la tienda online
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4">Métricas de Velocidad</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            <StatsCard
              title="Page Speed Desktop"
              value={technicalPerformance.pageSpeed.desktop.value}
              description="índice de 0-100"
              iconName="Zap"
              trend={{
                value: technicalPerformance.pageSpeed.desktop.change,
                isUpward: technicalPerformance.pageSpeed.desktop.isUp
              }}
              benchmark="≥ 85"
              status={technicalPerformance.pageSpeed.desktop.value >= 85 ? "success" : "warning"}
              tooltip="Puntuación de velocidad de carga en dispositivos de escritorio"
            />
            
            <StatsCard
              title="Page Speed Mobile"
              value={technicalPerformance.pageSpeed.mobile.value}
              description="índice de 0-100"
              iconName="Zap"
              trend={{
                value: technicalPerformance.pageSpeed.mobile.change,
                isUpward: technicalPerformance.pageSpeed.mobile.isUp
              }}
              benchmark="≥ 75"
              status={technicalPerformance.pageSpeed.mobile.value >= 75 ? "success" : "warning"}
              tooltip="Puntuación de velocidad de carga en dispositivos móviles"
            />
            
            <StatsCard
              title="Tiempo de checkout"
              value={`${technicalPerformance.checkoutPerformance.avgTime}s`}
              iconName="Clock"
              benchmark="≤ 60s"
              status={technicalPerformance.checkoutPerformance.avgTime <= 60 ? "success" : "warning"}
              tooltip="Tiempo promedio para completar el proceso de checkout"
            />
            
            <StatsCard
              title="Uptime"
              value={`${technicalPerformance.uptime.value}%`}
              iconName="Server"
              benchmark="≥ 99.9%"
              status={technicalPerformance.uptime.value >= 99.9 ? "success" : "warning"}
              tooltip="Porcentaje de tiempo que el sitio estuvo disponible"
            />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Errores y Alertas</h2>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Errores HTTP</CardTitle>
                <CardDescription>Errores detectados en las últimas 24 horas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <span className="font-medium">Errores 404 (Página no encontrada)</span>
                    </div>
                    <span>{technicalPerformance.errors.http404}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-full rounded-full" 
                        style={{ width: `${(technicalPerformance.errors.http404 / 20) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Principal: /productos/zapatilla-descontinuada (5 hits)
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="font-medium">Errores 500 (Error del servidor)</span>
                    </div>
                    <span>{technicalPerformance.errors.http500}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-red-500 h-full rounded-full" 
                        style={{ width: `${(technicalPerformance.errors.http500 / 20) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      En: /api/checkout (1 hit)
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span className="font-medium">Errores JavaScript</span>
                    </div>
                    <span>{technicalPerformance.errors.jsErrors}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-full rounded-full" 
                        style={{ width: `${(technicalPerformance.errors.jsErrors / 20) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Principal: Uncaught TypeError en checkout.js
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Fallos en checkout</CardTitle>
                <CardDescription>Análisis de intentos fallidos de pago</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{technicalPerformance.checkoutPerformance.failedAttempts}%</span>
                    <span className="text-sm text-yellow-500">+0.5% vs mes anterior</span>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-4">
                    <div 
                      className={`h-full rounded-full ${
                        technicalPerformance.checkoutPerformance.failedAttempts <= 3
                          ? "bg-green-500"
                          : technicalPerformance.checkoutPerformance.failedAttempts <= 5
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${technicalPerformance.checkoutPerformance.failedAttempts * 5}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>Meta: ≤ 3%</span>
                    <span>10%</span>
                  </div>
                  
                  <div className="pt-4 space-y-3">
                    <h4 className="text-sm font-medium">Causas principales</h4>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tarjeta rechazada</span>
                      <span className="font-medium">58%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: "58%" }} />
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Error de validación</span>
                      <span className="font-medium">22%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: "22%" }} />
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Sesión expirada</span>
                      <span className="font-medium">12%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: "12%" }} />
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Otros</span>
                      <span className="font-medium">8%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: "8%" }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Optimización de Recursos</h2>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Peso de página</CardTitle>
                <CardDescription>Análisis del tamaño total de recursos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">Tamaño promedio de página</span>
                      <div className="text-2xl font-bold">{technicalPerformance.pageWeight.avgSize} MB</div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">Cantidad de peticiones</span>
                      <div className="text-2xl font-bold">{technicalPerformance.pageWeight.requests}</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 space-y-3">
                    <h4 className="text-sm font-medium">Distribución por tipo</h4>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Imágenes</span>
                      <span className="font-medium">1.2 MB (65%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: "65%" }} />
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">JavaScript</span>
                      <span className="font-medium">420 KB (22%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-yellow-500 h-full rounded-full" style={{ width: "22%" }} />
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">CSS</span>
                      <span className="font-medium">160 KB (8%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-green-500 h-full rounded-full" style={{ width: "8%" }} />
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Fuentes</span>
                      <span className="font-medium">70 KB (4%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: "4%" }} />
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Otros</span>
                      <span className="font-medium">20 KB (1%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gray-500 h-full rounded-full" style={{ width: "1%" }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recomendaciones de mejora</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 border rounded-md">
                    <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">Optimizar imágenes</h3>
                      <p className="text-xs text-muted-foreground">
                        Comprimir y redimensionar imágenes para reducir peso total de página.
                      </p>
                    </div>
                    <span className="text-xs font-medium text-yellow-500">Alto impacto</span>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 border rounded-md">
                    <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">Reducir JavaScript no utilizado</h3>
                      <p className="text-xs text-muted-foreground">
                        Eliminar código no utilizado y aplicar code-splitting.
                      </p>
                    </div>
                    <span className="text-xs font-medium text-yellow-500">Alto impacto</span>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 border rounded-md">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">Implementar lazy loading</h3>
                      <p className="text-xs text-muted-foreground">
                        Cargar imágenes y componentes bajo demanda cuando sean visibles.
                      </p>
                    </div>
                    <span className="text-xs font-medium text-blue-500">Medio impacto</span>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 border rounded-md">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">Mejorar caché del navegador</h3>
                      <p className="text-xs text-muted-foreground">
                        Configurar encabezados de caché para recursos estáticos.
                      </p>
                    </div>
                    <span className="text-xs font-medium text-blue-500">Medio impacto</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
} 