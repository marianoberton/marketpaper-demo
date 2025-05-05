import { DashboardLayout } from "@/components/dashboard-layout";
import { testingData } from "@/lib/mock-data";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckIcon,
  ClockIcon,
  MessageSquare,
  MailIcon,
  ShoppingCart
} from "lucide-react";

// Added BeakerIcon since it's not available in lucide-react
function BeakerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 3h15"></path>
      <path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"></path>
      <path d="M6 14h12"></path>
    </svg>
  );
}

export default function TestingPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col p-6 gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automatización y Testing</h1>
          <p className="text-muted-foreground">
            Seguimiento de experimentos, pruebas A/B y automatizaciones
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4">Pruebas A/B Activas</h2>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {testingData.activeTests.map((test) => (
              <Card key={test.name}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-medium">{test.name}</CardTitle>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs">
                      {test.status}
                    </div>
                  </div>
                  <CardDescription>Iniciado: {test.startDate}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="w-1/2">
                        <span className="text-sm text-muted-foreground">Control</span>
                        <div className="text-xl font-bold">{formatPercent(test.metrics.control)}</div>
                      </div>
                      <div className="w-1/2">
                        <span className="text-sm text-muted-foreground">Variante</span>
                        <div className="text-xl font-bold">{formatPercent(test.metrics.variant)}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Mejora</span>
                        <span className={`text-sm font-medium ${
                          test.improvement > 0 ? "text-green-500" : "text-red-500"
                        }`}>
                          {test.improvement > 0 ? "+" : ""}{test.improvement}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-full rounded-full ${
                            test.improvement > 10 
                              ? "bg-green-500" 
                              : test.improvement > 0
                              ? "bg-blue-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${Math.min(Math.abs(test.improvement) * 2, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Significancia estadística:</span>
                      {test.significant ? (
                        <span className="flex items-center text-green-500">
                          <CheckIcon className="h-4 w-4 mr-1" /> Confirmada
                        </span>
                      ) : (
                        <span className="flex items-center text-yellow-500">
                          <ClockIcon className="h-4 w-4 mr-1" /> En evaluación
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Automatizaciones de ManyChat</h2>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Chatbot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Total interacciones</span>
                      <div className="text-2xl font-bold">{testingData.automationResults.manychat.interactions}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Carritos recuperados</span>
                      <div className="text-2xl font-bold">{testingData.automationResults.manychat.cartsRecovered}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        <MessageSquare className="h-4 w-4 inline mr-1" />
                        Resuelto por bot
                      </span>
                      <span className="font-medium">
                        {Math.round((testingData.automationResults.manychat.resolvedByBot / testingData.automationResults.manychat.interactions) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-full rounded-full" 
                        style={{ 
                          width: `${(testingData.automationResults.manychat.resolvedByBot / testingData.automationResults.manychat.interactions) * 100}%` 
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        <MessageSquare className="h-4 w-4 inline mr-1" />
                        Escalado a humano
                      </span>
                      <span className="font-medium">
                        {Math.round((testingData.automationResults.manychat.escalatedToHuman / testingData.automationResults.manychat.interactions) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-full rounded-full" 
                        style={{ 
                          width: `${(testingData.automationResults.manychat.escalatedToHuman / testingData.automationResults.manychat.interactions) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Ingresos generados</span>
                    <div className="text-2xl font-bold">{formatCurrency(testingData.automationResults.manychat.revenueGenerated)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(testingData.automationResults.manychat.revenueGenerated / testingData.automationResults.manychat.cartsRecovered)} promedio por carrito recuperado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Flujo de recuperación de carrito</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Carritos abandonados detectados
                    </span>
                    <span className="font-medium">100%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>
                
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Mensajes enviados
                    </span>
                    <span className="font-medium">100%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>
                
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Mensajes abiertos
                    </span>
                    <span className="font-medium">
                      {Math.round((testingData.automationResults.manychat.interactions / testingData.automationResults.manychat.cartsRecovered) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(testingData.automationResults.manychat.interactions / testingData.automationResults.manychat.cartsRecovered) * 100}%` }} />
                  </div>
                </div>
                
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Carritos recuperados
                    </span>
                    <span className="font-medium">
                      {Math.round((testingData.automationResults.manychat.cartsRecovered / testingData.automationResults.manychat.interactions) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-full rounded-full" style={{ width: `${(testingData.automationResults.manychat.cartsRecovered / testingData.automationResults.manychat.interactions) * 100}%` }} />
                  </div>
                </div>
                
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Top mensajes efectivos
                    </span>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="p-2 bg-muted/50 rounded-md text-sm">
                      "¡Olvidaste algo en tu carrito! 🛒 ¿Quieres un 10% de descuento para completar tu compra ahora?"
                    </div>
                    <div className="p-2 bg-muted/50 rounded-md text-sm">
                      "Todavía tienes productos reservados en tu carrito, pero pronto expirarán. ¿Te ayudo a completar la compra?"
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Automatizaciones de Email Marketing</h2>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Secuencia de Bienvenida</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Usuarios en secuencia</span>
                      <div className="text-2xl font-bold">{testingData.automationResults.emailAutomation.welcomeSequence.sent}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Conversiones</span>
                      <div className="text-2xl font-bold">{testingData.automationResults.emailAutomation.welcomeSequence.converted}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        <MailIcon className="h-4 w-4 inline mr-1" />
                        Emails abiertos
                      </span>
                      <span className="font-medium">
                        {Math.round((testingData.automationResults.emailAutomation.welcomeSequence.opened / testingData.automationResults.emailAutomation.welcomeSequence.sent) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-full rounded-full" 
                        style={{ 
                          width: `${(testingData.automationResults.emailAutomation.welcomeSequence.opened / testingData.automationResults.emailAutomation.welcomeSequence.sent) * 100}%` 
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        <MailIcon className="h-4 w-4 inline mr-1" />
                        Clics en links
                      </span>
                      <span className="font-medium">
                        {Math.round((testingData.automationResults.emailAutomation.welcomeSequence.clicked / testingData.automationResults.emailAutomation.welcomeSequence.opened) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-full rounded-full" 
                        style={{ 
                          width: `${(testingData.automationResults.emailAutomation.welcomeSequence.clicked / testingData.automationResults.emailAutomation.welcomeSequence.opened) * 100}%` 
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        <ShoppingCart className="h-4 w-4 inline mr-1" />
                        Conversión final
                      </span>
                      <span className="font-medium">
                        {Math.round((testingData.automationResults.emailAutomation.welcomeSequence.converted / testingData.automationResults.emailAutomation.welcomeSequence.sent) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-full rounded-full" 
                        style={{ 
                          width: `${(testingData.automationResults.emailAutomation.welcomeSequence.converted / testingData.automationResults.emailAutomation.welcomeSequence.sent) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-md text-sm">
                    <p className="font-medium">Top performer: Email #2</p>
                    <p className="text-muted-foreground mt-1">
                      "Productos destacados para tus primeras compras" - 24% CTR, 8% conversión
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recuperación de Carrito por Email</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Emails enviados</span>
                      <div className="text-2xl font-bold">{testingData.automationResults.emailAutomation.abandonedCart.sent}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Carritos recuperados</span>
                      <div className="text-2xl font-bold">{testingData.automationResults.emailAutomation.abandonedCart.recovered}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        <MailIcon className="h-4 w-4 inline mr-1" />
                        Emails abiertos
                      </span>
                      <span className="font-medium">
                        {Math.round((testingData.automationResults.emailAutomation.abandonedCart.opened / testingData.automationResults.emailAutomation.abandonedCart.sent) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-full rounded-full" 
                        style={{ 
                          width: `${(testingData.automationResults.emailAutomation.abandonedCart.opened / testingData.automationResults.emailAutomation.abandonedCart.sent) * 100}%` 
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        <MailIcon className="h-4 w-4 inline mr-1" />
                        Clics en links
                      </span>
                      <span className="font-medium">
                        {Math.round((testingData.automationResults.emailAutomation.abandonedCart.clicked / testingData.automationResults.emailAutomation.abandonedCart.opened) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-full rounded-full" 
                        style={{ 
                          width: `${(testingData.automationResults.emailAutomation.abandonedCart.clicked / testingData.automationResults.emailAutomation.abandonedCart.opened) * 100}%` 
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        <ShoppingCart className="h-4 w-4 inline mr-1" />
                        Tasa de recuperación
                      </span>
                      <span className="font-medium">
                        {Math.round((testingData.automationResults.emailAutomation.abandonedCart.recovered / testingData.automationResults.emailAutomation.abandonedCart.sent) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-full rounded-full" 
                        style={{ 
                          width: `${(testingData.automationResults.emailAutomation.abandonedCart.recovered / testingData.automationResults.emailAutomation.abandonedCart.sent) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Timing más efectivo</span>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                      <div className="text-sm">
                        <span className="font-medium">60 minutos</span> después del abandono
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        24% recuperación
                      </span>
                    </div>
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