'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

// Tipado del proyecto, podríamos moverlo a un archivo de tipos compartido
type Project = {
  id: string;
  name: string;
  address: string;
  surface: number;
  architect: string;
  builder: string;
  status: string;
  cover_image_url: string;
}

interface ProjectCardProps {
  project: Project;
  onSelectProject: (id: string) => void;
}

const statusColors: { [key: string]: string } = {
    'En Obra': 'bg-blue-500',
    'Finalizada': 'bg-green-500',
    'Demolición': 'bg-red-500',
    'Pausa': 'bg-yellow-500',
};

export function ProjectCard({ project, onSelectProject }: ProjectCardProps) {
  const statusColor = statusColors[project.status] || 'bg-gray-500';

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
            <Image
                src={project.cover_image_url}
                alt={`Imagen de ${project.name}`}
                layout="fill"
                objectFit="cover"
            />
            <div className="absolute top-2 right-2">
                <Badge className={`${statusColor} text-white`}>{project.status}</Badge>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
        <CardDescription>{project.address}</CardDescription>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p><strong>Superficie:</strong> {project.surface} m²</p>
            <p><strong>Arquitecto:</strong> {project.architect}</p>
            <p><strong>Constructora:</strong> {project.builder}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-gray-50 dark:bg-gray-800">
        <Button className="w-full" onClick={() => onSelectProject(project.id)}>
          Ver Detalle
        </Button>
      </CardFooter>
    </Card>
  )
} 