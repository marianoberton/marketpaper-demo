'use client'

import { useState, useEffect } from 'react'
import { ProjectList } from './ProjectList'
import { DeadlineAlerts, DeadlineNotifications } from './DeadlineNotifications'
import { Project } from '@/lib/construction'
import { ProjectWithDeadline } from '@/types/construction-deadlines'
import { getProjectsWithDeadlines } from '@/lib/construction-deadlines'
import { useWorkspace } from '@/components/workspace-context'
// import { ProjectDetail } from './project-detail'

export function ConstruccionDashboard() {
  const { companyId } = useWorkspace()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectWithDeadline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjectsWithDeadlines()
  }, [companyId])

  const loadProjectsWithDeadlines = async (): Promise<void> => {
    if (!companyId) return
    
    try {
      setLoading(true)
      const projectsData = await getProjectsWithDeadlines(companyId)
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading projects with deadlines:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id)
  }

  const handleBackToList = () => {
    setSelectedProjectId(null)
  }

  const handleNotificationClick = (projectId: string) => {
    setSelectedProjectId(projectId)
  }

  if (selectedProjectId) {
    // return <ProjectDetail projectId={selectedProjectId} onBack={handleBackToList} />
    return (
        <div>
            <h1>Detalle del Proyecto (ID: {selectedProjectId})</h1>
            <button onClick={handleBackToList}>Volver al listado</button>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con notificaciones */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard de Construcción</h1>
        <DeadlineNotifications 
          projects={projects}
          onNotificationClick={handleNotificationClick}
        />
      </div>

      {/* Alertas de plazos urgentes */}
      <DeadlineAlerts projects={projects} />

      {/* Lista de proyectos */}
      <ProjectList onSelectProject={handleSelectProject} />
    </div>
  )
}