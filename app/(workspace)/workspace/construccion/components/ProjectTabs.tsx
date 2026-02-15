'use client'

import { cn } from '@/lib/utils'

export type TabId = 'summary' | 'stages-documents' | 'team' | 'documents' | 'economic'

interface Tab {
  id: TabId
  label: string
  description?: string
}

const tabs: Tab[] = [
  { id: 'summary', label: 'Resumen', description: 'Estado general y acciones urgentes' },
  { id: 'stages-documents', label: 'Etapas y Documentos', description: 'Gestión de fases del proyecto' },
  { id: 'team', label: 'Equipo del Proyecto', description: 'Directorio de profesionales' },
  { id: 'documents', label: 'Biblioteca de Documentos', description: 'Archivo central de documentos' },
  { id: 'economic', label: 'Información Económica', description: 'Gestión financiera y control de costos' }
]

interface ProjectTabsProps {
  activeTab: TabId
  onTabChange: (tabId: TabId) => void
  className?: string
}

export default function ProjectTabs({ activeTab, onTabChange, className }: ProjectTabsProps) {
  return (
    <div className={cn("sticky top-0 z-10 bg-card border-b border-border shadow-sm", className)}>
      <div className="mx-auto px-6 overflow-x-auto">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <div className="flex flex-col items-center space-y-1">
                <span>{tab.label}</span>
                {tab.description && (
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {tab.description}
                  </span>
                )}
              </div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

export { tabs }
