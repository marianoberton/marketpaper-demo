import { Shield, Zap, Users, BarChart3 } from 'lucide-react'

function FeatureHighlight({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#CED600]/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-[#CED600]" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-[#1C1C1C] relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'url(/assets/preview-patronFOMO.png)',
            backgroundSize: '300px',
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/horizontalSVG-white.svg"
            alt="FOMO"
            className="h-14 mb-12"
          />

          <h2 className="text-3xl font-bold text-white mb-3">
            Tu plataforma empresarial inteligente
          </h2>
          <p className="text-lg text-gray-400 mb-10">
            Gestiona tu empresa de forma moderna, segura y centralizada.
          </p>

          <div className="space-y-6">
            <FeatureHighlight
              icon={Shield}
              title="Multi-tenant seguro"
              description="Datos aislados por empresa con cifrado de grado empresarial"
            />
            <FeatureHighlight
              icon={Zap}
              title="Modulos a medida"
              description="CRM, Finanzas, Construccion y mas, activados segun tu plan"
            />
            <FeatureHighlight
              icon={Users}
              title="Equipos y clientes"
              description="Gestiona roles internos y portal de clientes en un solo lugar"
            />
            <FeatureHighlight
              icon={BarChart3}
              title="Integraciones"
              description="Conecta HubSpot, automatiza procesos y centraliza datos"
            />
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-xs text-gray-500">
              Datos seguros y privados &middot; Cifrado AES-256 &middot; Aislamiento multi-empresa
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo (only shown when left panel is hidden) */}
          <div className="flex justify-center mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/horizontalSVG-black.svg"
              alt="FOMO"
              className="h-10 dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/horizontalSVG-white.svg"
              alt="FOMO"
              className="h-10 hidden dark:block"
            />
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
