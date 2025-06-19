'use client'

import { useState } from 'react'
import { ProjectList } from './ProjectList'
// import { ProjectDetail } from './project-detail'

export function ConstruccionDashboard() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id)
  }

  const handleBackToList = () => {
    setSelectedProjectId(null)
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

  return <ProjectList onSelectProject={handleSelectProject} />
}