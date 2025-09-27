import { createClient } from '@/utils/supabase/client'

// Definir tipos básicos sin importar database.types
export type ClientReferente = {
  id?: string
  name: string
  role: string // descripción/rol del referente
}

export type ProjectProfessional = {
  id?: string
  name: string
  role: 'Estructuralista' | 'Proyectista' | 'Instalación Electrica' | 'Instalación Sanitaria' | 'Instalación e incendios' | 'Instalación e elevadores' | 'Instalación Sala de maquinas' | 'Instalación Ventilación Mecanica' | 'Instalación ventilación electromecánica' | 'Agrimensor'
}

export type Client = {
  id: string
  company_id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  cuit?: string | null
  website_url?: string | null
  referentes?: ClientReferente[] | null
  contact_person?: string | null // Mantenemos por compatibilidad temporal
  notes?: string | null
  created_at: string
  updated_at: string
}

export type ProjectExpediente = {
  id: string
  project_id: string
  expediente_number: string
  expediente_type: string // 'DGROC', 'DGIUR', etc.
  status: string // 'Pendiente', 'En trámite', 'Aprobado', 'Rechazado'
  submission_date?: string | null
  approval_date?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export type Project = {
  id: string
  company_id: string
  name: string
  address?: string | null
  barrio?: string | null
  ciudad?: string | null
  surface?: number | null
  director_obra?: string | null
  builder?: string | null
  status?: string | null
  current_stage?: string | null
  cover_image_url?: string | null
  dgro_file_number?: string | null
  project_type?: string | null
  project_usage?: string | null
  permit_status?: string | null
  client_id?: string | null
  start_date?: string | null
  end_date?: string | null
  budget?: number | null
  profesionales?: ProjectProfessional[] | null
  notes?: string | null
  created_at: string
  updated_at: string
  client?: Client
  sections?: ProjectSection[]
  status_history?: ProjectStatusHistory[]
  expedientes?: ProjectExpediente[]
  
  // Campos de compatibilidad temporal
  architect?: string | null // @deprecated - usar director_obra
  project_use?: string | null // @deprecated - usar project_usage  
  inspector_name?: string | null // @deprecated - usar profesionales
  
  // Informe de Dominio
  domain_report_file_url?: string | null
  domain_report_upload_date?: string | null
  domain_report_expiry_date?: string | null
  domain_report_is_valid?: boolean | null
  domain_report_notes?: string | null
  
  // Póliza de Seguro
  insurance_policy_file_url?: string | null
  insurance_policy_issue_date?: string | null
  insurance_policy_expiry_date?: string | null
  insurance_policy_is_valid?: boolean | null
  insurance_policy_notes?: string | null
  insurance_policy_number?: string | null
  insurance_company?: string | null
  
  // Tasas y Gravámenes Gubernamentales
  projected_total_cost?: number | null
  paid_total_cost?: number | null
  paid_cost_rubro_a?: number | null
  paid_cost_rubro_b?: number | null
  paid_cost_rubro_c?: number | null
  last_cost_update?: string | null
  enable_tax_management?: boolean | null
  
  // Plazos de construcción
  construction_start_date?: string | null
  construction_end_date?: string | null
  days_remaining?: number | null
  deadline_status?: string | null
  
  // Relaciones con tasas específicas
  professional_commissions?: ProfessionalCommission[]
  construction_rights?: ConstructionRights[]
  surplus_value_rights?: SurplusValueRights[]
  tax_payments?: TaxPayment[]
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

// Tipos para Tasas y Gravámenes Gubernamentales
export type ProfessionalCommission = {
  id: string
  project_id: string
  council_type: string // 'CPAU', 'CPIC', etc.
  surface_m2: number
  procedure_type: string
  calculated_fee: number
  actual_paid: number
  payment_date?: string | null
  receipt_number?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export type ConstructionRights = {
  id: string
  project_id: string
  surface_m2: number
  stage_name: string // 'Registro Etapa', 'Permiso Obra'
  calculated_fee: number
  actual_paid: number
  payment_date?: string | null
  receipt_number?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export type SurplusValueRights = {
  id: string
  project_id: string
  surface_m2: number
  zone_classification?: string | null // 'Palermo', 'Lugano', etc.
  uva_coefficient: number
  uva_value: number
  base_calculation: number
  total_amount: number
  percentage_20_paid: number // 20% con permiso
  percentage_40_avo1_paid: number // 40% con AVO I
  percentage_40_avo4_paid: number // 40% con AVO IV/MH
  payment_stage?: string | null // 'Pendiente', 'Permiso', 'AVO I', 'AVO IV', 'Completado'
  notes?: string | null
  created_at: string
  updated_at: string
}

export type TaxPayment = {
  id: string
  project_id: string
  payment_type: string // 'professional_commission', 'construction_rights', 'surplus_value'
  reference_id?: string | null // ID de la tabla específica
  rubro: string // 'A', 'B', 'C'
  amount: number
  payment_date: string
  receipt_number?: string | null
  description?: string | null
  notes?: string | null
  created_by?: string | null
  created_at: string
}

// Tipos para datos maestros
export type ProfessionalCouncil = {
  id: string
  code: string
  name: string
  description?: string | null
  base_fee_formula?: string | null
  is_active: boolean
  created_at: string
}

export type SurplusValueZone = {
  id: string
  zone_name: string
  zone_code?: string | null
  multiplier_factor: number
  description?: string | null
  is_active: boolean
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
  barrio?: string
  ciudad?: string
  surface?: number
  director_obra?: string
  builder?: string
  client_id?: string
  start_date?: string
  end_date?: string
  budget?: number
  current_stage?: string
  profesionales?: ProjectProfessional[]
  notes?: string
  cover_image_url?: string
  dgro_file_number?: string
  project_type?: string
  project_usage?: string
  expedientes?: ProjectExpediente[]
  
  // Informe de Dominio
  domain_report_file_url?: string
  domain_report_notes?: string
  
  // Tasas y Gravámenes Gubernamentales
  projected_total_cost?: number
  enable_tax_management?: boolean
  
  // Campos de compatibilidad temporal
  architect?: string // @deprecated - usar director_obra
  project_use?: string // @deprecated - usar project_usage
  permit_status?: string // @deprecated - se eliminó del formulario
  inspector_name?: string // @deprecated - usar profesionales
}

export type UpdateProjectData = Partial<CreateProjectData> & {
  id: string
}

export type CreateClientData = {
  name: string
  email?: string
  phone?: string
  address?: string
  cuit?: string
  website_url?: string
  referentes?: ClientReferente[]
  contact_person?: string // Mantenemos por compatibilidad temporal
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
      status_history:project_status_history(*),
      expedientes:project_expedientes(*)
    `)
    .eq('id', projectId)
    .single()

  if (error) {
    console.error('Error fetching project:', error.message || error)
    throw new Error(`Error al cargar el proyecto: ${error.message || 'Error desconocido'}`)
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

// Función para eliminar un proyecto
export async function deleteProject(projectId: string): Promise<void> {
  const supabase = createClient()
  
  // Verificar que el proyecto existe
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .single()

  if (fetchError || !project) {
    throw new Error('Proyecto no encontrado')
  }

  // Eliminar el proyecto (las eliminaciones en cascada se encargarán de las dependencias)
  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (deleteError) {
    console.error('Error deleting project:', deleteError)
    throw new Error('Error al eliminar el proyecto')
  }
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

// Función para actualizar un cliente
export async function updateClient(clientId: string, clientData: Partial<CreateClientData>): Promise<Client> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('clients')
    .update({
      ...clientData,
      updated_at: new Date().toISOString()
    })
    .eq('id', clientId)
    .select()
    .single()

  if (error) {
    console.error('Error updating client:', error)
    throw new Error('Error al actualizar el cliente')
  }

  return data
}

// Función para eliminar un cliente
export async function deleteClient(clientId: string): Promise<void> {
  const supabase = createClient()
  
  // Verificar si el cliente tiene proyectos asociados
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id')
    .eq('client_id', clientId)
    .limit(1)

  if (projectsError) {
    console.error('Error checking client projects:', projectsError)
    throw new Error('Error al verificar proyectos del cliente')
  }

  if (projects && projects.length > 0) {
    throw new Error('No se puede eliminar el cliente porque tiene proyectos asociados')
  }

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)

  if (error) {
    console.error('Error deleting client:', error)
    throw new Error('Error al eliminar el cliente')
  }
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
    console.error('Error fetching project documents:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw new Error(`Error al cargar los documentos del proyecto: ${error.message}`)
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
    cuit: '20-12345678-9',
    website_url: 'https://taboada-construcciones.com.ar',
    referentes: [
      { name: 'Raquel Taboada', role: 'Directora General' },
      { name: 'Carlos Taboada', role: 'Ingeniero Jefe' }
    ],
    contact_person: 'Raquel Taboada', // Compatibilidad temporal
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
    cuit: '30-98765432-1',
    website_url: 'https://desarrollosurbanos.com',
    referentes: [
      { name: 'María González', role: 'Gerente de Proyectos' },
      { name: 'Roberto Silva', role: 'Director Comercial' }
    ],
    contact_person: 'María González', // Compatibilidad temporal
    notes: 'Desarrollador inmobiliario - Múltiples proyectos',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z'
  }
]

export const mockProjectStages: ProjectStage[] = [
  // PREFACTIBILIDAD DEL PROYECTO
  {
    id: '1',
    company_id: '1',
    name: 'Prefactibilidad del proyecto',
    description: 'Evaluación inicial y análisis de viabilidad del proyecto',
    order: 1,
    color: '#8B5CF6', // Púrpura
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  
  // EN GESTORIA
  {
    id: '2',
    company_id: '1',
    name: 'Consulta DGIUR',
    description: 'Consulta a la Dirección General de Interpretación Urbanística',
    order: 2,
    color: '#F59E0B', // Amarillo
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '3',
    company_id: '1',
    name: 'Registro etapa de proyecto',
    description: 'Registro formal del proyecto en los organismos correspondientes',
    order: 3,
    color: '#F59E0B', // Amarillo
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '4',
    company_id: '1',
    name: 'Permiso de Demolición',
    description: 'Permiso para trabajos de demolición cuando sea requerido',
    order: 4,
    color: '#F59E0B', // Amarillo
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '5',
    company_id: '1',
    name: 'Permiso de obra',
    description: 'Obtención del permiso municipal de construcción',
    order: 5,
    color: '#F59E0B', // Amarillo
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  
  // EN EJECUCIÓN DE OBRA
  {
    id: '6',
    company_id: '1',
    name: 'Demolición',
    description: 'Trabajos de demolición y preparación del terreno',
    order: 6,
    color: '#EF4444', // Rojo
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '7',
    company_id: '1',
    name: 'Excavación',
    description: 'Trabajos de excavación y movimiento de suelos',
    order: 7,
    color: '#EF4444', // Rojo
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '8',
    company_id: '1',
    name: 'AVO 1',
    description: 'Apto Verificación de Obra 1 - Estructura',
    order: 8,
    color: '#10B981', // Verde
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '9',
    company_id: '1',
    name: 'AVO 2',
    description: 'Apto Verificación de Obra 2 - Instalaciones',
    order: 9,
    color: '#10B981', // Verde
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '10',
    company_id: '1',
    name: 'AVO 3',
    description: 'Apto Verificación de Obra 3 - Terminaciones',
    order: 10,
    color: '#10B981', // Verde
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  
  // FINALIZACIÓN
  {
    id: '11',
    company_id: '1',
    name: 'Conforme de obra',
    description: 'Obtención del conforme final de obra',
    order: 11,
    color: '#059669', // Verde oscuro
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '12',
    company_id: '1',
    name: 'MH-SUBDIVISION',
    description: 'Certificado de Mensura y Subdivisión',
    order: 12,
    color: '#059669', // Verde oscuro
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  }
]



// =============================================
// FUNCIONES PARA INFORME DE DOMINIO
// =============================================

export function calculateDomainReportDaysRemaining(uploadDate: string): number {
  const upload = new Date(uploadDate)
  const expiry = new Date(upload.getTime() + (90 * 24 * 60 * 60 * 1000)) // 90 días
  const now = new Date()
  const diffTime = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export function isDomainReportValid(uploadDate: string | null): boolean {
  if (!uploadDate) return false
  return calculateDomainReportDaysRemaining(uploadDate) > 0
}

export function formatDomainReportStatus(uploadDate: string | null): {
  status: 'valid' | 'expiring' | 'expired' | 'none'
  message: string
  daysRemaining?: number
} {
  if (!uploadDate) {
    return { status: 'none', message: 'No cargado' }
  }
  
  const daysRemaining = calculateDomainReportDaysRemaining(uploadDate)
  
  if (daysRemaining <= 0) {
    return { status: 'expired', message: 'Vencido', daysRemaining: 0 }
  } else if (daysRemaining <= 10) {
    return { status: 'expiring', message: `Vence en ${daysRemaining} días`, daysRemaining }
  } else {
    return { status: 'valid', message: `Vigente (${daysRemaining} días)`, daysRemaining }
  }
}

// =============================================
// FUNCIONES PARA PÓLIZA DE SEGURO
// =============================================

export function calculateInsurancePolicyDaysRemaining(expiryDate: string): number {
  const expiry = new Date(expiryDate)
  const now = new Date()
  const diffTime = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export function isInsurancePolicyValid(expiryDate: string | null): boolean {
  if (!expiryDate) return false
  return calculateInsurancePolicyDaysRemaining(expiryDate) > 0
}

export function formatInsurancePolicyStatus(expiryDate: string | null): {
  status: 'valid' | 'expiring' | 'expired' | 'none'
  message: string
  daysRemaining?: number
} {
  if (!expiryDate) {
    return { status: 'none', message: 'No cargada' }
  }
  
  const daysRemaining = calculateInsurancePolicyDaysRemaining(expiryDate)
  
  if (daysRemaining <= 0) {
    return { status: 'expired', message: 'Vencida', daysRemaining: 0 }
  } else if (daysRemaining <= 30) {
    return { status: 'expiring', message: `Vence en ${daysRemaining} días`, daysRemaining }
  } else {
    return { status: 'valid', message: `Vigente (${daysRemaining} días)`, daysRemaining }
  }
}

// =============================================
// FUNCIONES PARA TASAS Y GRAVÁMENES
// =============================================

export function calculateProjectedVsPaidPercentage(projected: number, paid: number): number {
  if (projected <= 0) return 0
  return Math.round((paid / projected) * 100)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function calculateRemainingAmount(projected: number, paid: number): number {
  return Math.max(0, projected - paid)
}

export type TaxSummary = {
  projectedTotal: number
  paidTotal: number
  remainingTotal: number
  percentagePaid: number
  rubroBreakdown: {
    A: { paid: number; percentage: number }
    B: { paid: number; percentage: number }
    C: { paid: number; percentage: number }
  }
}

export function calculateTaxSummary(project: Project): TaxSummary {
  const projectedTotal = project.projected_total_cost || 0
  const paidTotal = project.paid_total_cost || 0
  const remainingTotal = calculateRemainingAmount(projectedTotal, paidTotal)
  const percentagePaid = calculateProjectedVsPaidPercentage(projectedTotal, paidTotal)
  
  const paidA = project.paid_cost_rubro_a || 0
  const paidB = project.paid_cost_rubro_b || 0
  const paidC = project.paid_cost_rubro_c || 0
  
  return {
    projectedTotal,
    paidTotal,
    remainingTotal,
    percentagePaid,
    rubroBreakdown: {
      A: { 
        paid: paidA, 
        percentage: paidTotal > 0 ? Math.round((paidA / paidTotal) * 100) : 0
      },
      B: { 
        paid: paidB, 
        percentage: paidTotal > 0 ? Math.round((paidB / paidTotal) * 100) : 0
      },
      C: { 
        paid: paidC, 
        percentage: paidTotal > 0 ? Math.round((paidC / paidTotal) * 100) : 0
      }
    }
  }
}

// =============================================
// FUNCIONES PARA EXPEDIENTES
// =============================================

export type CreateExpedienteData = {
  project_id: string
  expediente_number: string
  expediente_type: string
  status?: string
  submission_date?: string
  approval_date?: string
  notes?: string
}

export type UpdateExpedienteData = Partial<CreateExpedienteData> & {
  id: string
}

// Función para crear un nuevo expediente
export async function createExpediente(expedienteData: CreateExpedienteData): Promise<ProjectExpediente> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('project_expedientes')
    .insert({
      ...expedienteData,
      status: expedienteData.status || 'Pendiente'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating expediente:', error)
    throw new Error('Error al crear el expediente')
  }

  return data as ProjectExpediente
}

// Función para actualizar un expediente
export async function updateExpediente(expedienteData: UpdateExpedienteData): Promise<ProjectExpediente> {
  const supabase = createClient()
  
  const { id, ...updateData } = expedienteData
  
  const { data, error } = await supabase
    .from('project_expedientes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating expediente:', error)
    throw new Error('Error al actualizar el expediente')
  }

  return data as ProjectExpediente
}

// Función para eliminar un expediente
export async function deleteExpediente(expedienteId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('project_expedientes')
    .delete()
    .eq('id', expedienteId)

  if (error) {
    console.error('Error deleting expediente:', error)
    throw new Error('Error al eliminar el expediente')
  }
}

// Función para obtener expedientes de un proyecto
export async function getProjectExpedientes(projectId: string): Promise<ProjectExpediente[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('project_expedientes')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching expedientes:', error)
    return []
  }

  return data as ProjectExpediente[]
}

// =============================================
// FUNCIONES PARA OBTENER DATOS MAESTROS
// =============================================

export async function getProfessionalCouncils(): Promise<ProfessionalCouncil[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('professional_councils')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching professional councils:', error)
    throw new Error('Error al cargar los consejos profesionales')
  }

  return data as ProfessionalCouncil[]
}

export async function getSurplusValueZones(): Promise<SurplusValueZone[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('surplus_value_zones')
    .select('*')
    .eq('is_active', true)
    .order('zone_name')

  if (error) {
    console.error('Error fetching surplus value zones:', error)
    throw new Error('Error al cargar las zonas de plusvalía')
  }

  return data as SurplusValueZone[]
}

 