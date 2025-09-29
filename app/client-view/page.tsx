import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ClientViewContent from './client-view-content'

export default async function ClientViewPage() {
  const supabase = await createClient()
  
  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/client-login')
  }

  // Verificar que el usuario tenga rol de viewer y obtener client_id
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, company_id, client_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'viewer') {
    redirect('/client-login?message=Acceso no autorizado')
  }

  if (!profile.client_id) {
    redirect('/client-login?message=Usuario sin cliente asignado')
  }

  // Obtener información del cliente
  const { data: clientInfo } = await supabase
    .from('clients')
    .select('*')
    .eq('id', profile.client_id)
    .single()

  // Obtener proyectos del cliente específico con datos completos
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      project_documents(*),
      project_expedientes(*),
      clients!inner(name, email, phone, address),
      domain_report_file_url,
      insurance_policy_file_url
    `)
    .eq('client_id', profile.client_id)
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  return <ClientViewContent 
    projects={projects || []} 
    clientInfo={clientInfo}
  />
}