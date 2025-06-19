'use client'

import { ProjectCard } from './ProjectCard'

// Mock data
const mockProjects = [
  {
    id: '1',
    name: 'Edificio Lorem Ipsum',
    address: 'Calle Falsa 123, Ciudad Gótica',
    surface: 2500,
    architect: 'Norman Foster',
    builder: 'Constructora ACME',
    status: 'En Obra',
    cover_image_url: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=2071&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Residencia Dolor Sit',
    address: 'Avenida Siempreviva 742',
    surface: 800,
    architect: 'Zaha Hadid',
    builder: 'Construcciones Wayne',
    status: 'Finalizada',
    cover_image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1974&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'Torre Amet',
    address: 'Calle del Medio 456',
    surface: 15000,
    architect: 'Frank Gehry',
    builder: 'Stark Industries',
    status: 'Demolición',
    cover_image_url: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=2070&auto=format&fit=crop',
  },
]

interface ProjectListProps {
  onSelectProject: (id: string) => void
}

export function ProjectList({ onSelectProject }: ProjectListProps) {
  // Aquí iría la lógica de fetching de datos con react-query o SWR
  const projects = mockProjects

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Proyectos de Construcción</h2>
        {/* Aquí irían los filtros y el search bar */}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} onSelectProject={onSelectProject} />
        ))}
      </div>
    </div>
  )
} 