import { createClient } from '@/utils/supabase/client'

// Definir tipos básicos sin importar database.types
export type Client = {
  id: string
  company_id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  contact_person?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export type Project = {
  id: string
  company_id: string
  name: string
  address?: string | null
  surface?: number | null
  architect?: string | null
  builder?: string | null
  status?: string | null
  current_stage?: string | null
  cover_image_url?: string | null
  dgro_file_number?: string | null
  project_type?: string | null
  project_use?: string | null
  permit_status?: string | null
  client_id?: string | null
  start_date?: string | null
  end_date?: string | null
  budget?: number | null
  inspector_name?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  client?: Client
  sections?: ProjectSection[]
  status_history?: ProjectStatusHistory[]
}

export type ProjectSection = {
  id: string
  project_id: string
  name: string
  order: number
  icon?: string | null
  is_system?: boolean | null
  created_at: string
}

export type ProjectDocument = {
  id: string
  section_id: string
  project_id: string
  name: string
  file_url: string
  file_type?: string | null
  uploaded_by?: string | null
  created_at: string
}

export type ProjectStage = {
  id: string
  company_id: string
  name: string
  description?: string | null
  order: number
  color?: string | null
  is_active?: boolean | null
  created_at: string
}

export type ProjectStatusHistory = {
  id: string
  project_id: string
  previous_stage?: string | null
  new_stage: string
  changed_by?: string | null
  notes?: string | null
  created_at: string
}

export type CreateProjectData = {
  name: string
  address?: string
  surface?: number
  architect?: string
  builder?: string
  client_id?: string
  start_date?: string
  end_date?: string
  budget?: number
  current_stage?: string
  permit_status?: string
  inspector_name?: string
  notes?: string
  cover_image_url?: string
  dgro_file_number?: string
  project_type?: string
  project_use?: string
}

export type UpdateProjectData = Partial<CreateProjectData> & {
  id: string
}

export type CreateClientData = {
  name: string
  email?: string
  phone?: string
  address?: string
  contact_person?: string
  notes?: string
}

// Función para obtener todos los proyectos de una compañía
export async function getCompanyProjects(companyId: string): Promise<Project[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(*),
      sections:project_sections(*)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    throw new Error('Error al cargar los proyectos')
  }

  return data as Project[]
}

// Función para obtener un proyecto específico con toda su información
export async function getProjectById(projectId: string): Promise<Project | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(*),
      sections:project_sections(*),
      status_history:project_status_history(
        *,
        changed_by_user:user_profiles(full_name)
      )
    `)
    .eq('id', projectId)
    .single()

  if (error) {
    console.error('Error fetching project:', error)
    return null
  }

  return data as Project
}

// Función para crear un nuevo proyecto
export async function createProject(companyId: string, projectData: CreateProjectData): Promise<Project> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...projectData,
      company_id: companyId
    })
    .select(`
      *,
      client:clients(*),
      sections:project_sections(*)
    `)
    .single()

  if (error) {
    console.error('Error creating project:', error)
    throw new Error('Error al crear el proyecto')
  }

  return data as Project
}

// Función para actualizar un proyecto
export async function updateProject(projectData: UpdateProjectData): Promise<Project> {
  const supabase = createClient()
  
  const { id, ...updateData } = projectData
  
  const { data, error } = await supabase
    .from('projects')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      client:clients(*),
      sections:project_sections(*)
    `)
    .single()

  if (error) {
    console.error('Error updating project:', error)
    throw new Error('Error al actualizar el proyecto')
  }

  return data as Project
}

// Función para actualizar el estado de un proyecto
export async function updateProjectStage(projectId: string, newStage: string, notes?: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('projects')
    .update({
      current_stage: newStage,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)

  if (error) {
    console.error('Error updating project stage:', error)
    throw new Error('Error al actualizar el estado del proyecto')
  }

  // El historial se registra automáticamente por el trigger
}

// Función para obtener todos los clientes de una compañía
export async function getCompanyClients(companyId: string): Promise<Client[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('company_id', companyId)
    .order('name')

  if (error) {
    console.error('Error fetching clients:', error)
    throw new Error('Error al cargar los clientes')
  }

  return data
}

// Función para crear un nuevo cliente
export async function createNewClient(companyId: string, clientData: CreateClientData): Promise<Client> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...clientData,
      company_id: companyId
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating client:', error)
    throw new Error('Error al crear el cliente')
  }

  return data
}

// Función para obtener las etapas de proyecto de una compañía
export async function getCompanyProjectStages(companyId: string): Promise<ProjectStage[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('project_stages')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('order')

  if (error) {
    console.error('Error fetching project stages:', error)
    throw new Error('Error al cargar las etapas de proyecto')
  }

  return data
}

// Función para obtener documentos de un proyecto
export async function getProjectDocuments(projectId: string): Promise<Record<string, ProjectDocument[]>> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('project_documents')
    .select(`
      *,
      section:project_sections(name)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching project documents:', error)
    throw new Error('Error al cargar los documentos del proyecto')
  }

  // Agrupar documentos por sección
  const documentsBySection: Record<string, ProjectDocument[]> = {}
  
  data.forEach((doc: any) => {
    const sectionName = doc.section?.name || 'Sin sección'
    if (!documentsBySection[sectionName]) {
      documentsBySection[sectionName] = []
    }
    documentsBySection[sectionName].push(doc)
  })

  return documentsBySection
}

// Función para subir un documento
export async function uploadProjectDocument(
  projectId: string, 
  sectionId: string, 
  documentData: {
    name: string
    file_url: string
    file_type?: string
  }
): Promise<ProjectDocument> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('project_documents')
    .insert({
      ...documentData,
      project_id: projectId,
      section_id: sectionId
    })
    .select()
    .single()

  if (error) {
    console.error('Error uploading document:', error)
    throw new Error('Error al subir el documento')
  }

  return data
}

// Datos mock para desarrollo
export const mockClients: Client[] = [
  {
    id: '1',
    company_id: '1',
    name: 'TABOADA CORA RAQUEL',
    email: 'taboada.cora@email.com',
    phone: '+54 11 1234-5678',
    address: 'Av. Corrientes 1234, CABA',
    contact_person: 'Raquel Taboada',
    notes: 'Cliente VIP - Prioridad alta',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    company_id: '1',
    name: 'DESARROLLOS URBANOS SA',
    email: 'info@desarrollosurbanos.com',
    phone: '+54 11 9876-5432',
    address: 'Puerto Madero 567, CABA',
    contact_person: 'María González',
    notes: 'Desarrollador inmobiliario - Múltiples proyectos',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z'
  }
]

export const mockProjectStages: ProjectStage[] = [
  {
    id: '1',
    company_id: '1',
    name: 'Planificación',
    description: 'Fase inicial de planificación del proyecto',
    order: 1,
    color: '#6B7280',
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    company_id: '1',
    name: 'Permisos',
    description: 'Tramitación de permisos municipales',
    order: 2,
    color: '#F59E0B',
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '3',
    company_id: '1',
    name: 'AVO 3',
    description: 'Apto Verificación de Obra 3',
    order: 8,
    color: '#10B981',
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '4',
    company_id: '1',
    name: 'Finalización',
    description: 'Obra completada',
    order: 11,
    color: '#059669',
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  }
] 