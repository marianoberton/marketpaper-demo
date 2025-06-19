import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Building2 } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { getClientTemplates, createCompanyWithTemplate } from '@/lib/super-admin'

// Server Action to handle form submission
async function createCompanyAction(formData: FormData) {
  'use server'

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const contact_email = formData.get('contact_email') as string
  const contact_phone = formData.get('contact_phone') as string | null
  const domain = formData.get('domain') as string | null
  const template_id = formData.get('template_id') as string

  if (!name || !slug || !contact_email || !template_id) {
    return redirect('/admin/companies/create?error=Missing required fields')
  }
  
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  const { data: superAdmin, error: superAdminError } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (superAdminError || !superAdmin) {
    const errorMsg = superAdminError?.message || "Could not find a super_admin profile for the current user."
    return redirect(`/admin/companies/create?error=${encodeURIComponent(errorMsg)}`)
  }

  try {
    await createCompanyWithTemplate({
      name,
      slug,
      contact_email,
      contact_phone: contact_phone || undefined,
      domain: domain || undefined,
      template_id,
      created_by: superAdmin.id,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return redirect(`/admin/companies/create?error=${encodeURIComponent(errorMessage)}`)
  }

  revalidatePath('/admin/companies')
  revalidatePath('/admin')
  redirect(`/admin/companies`)
}

export default async function CreateCompanyPage() {
  const templates = await getClientTemplates()

  return (
    <form action={createCompanyAction} className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/companies">
          <Button variant="ghost" size="sm" type="button">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Crear Nuevo Cliente</h1>
          <p className="text-gray-500 dark:text-gray-400">Configura una nueva empresa en la plataforma.</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Información Básica
            </CardTitle>
            <CardDescription>
              Datos principales de la nueva empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre de la Empresa *</Label>
              <Input id="name" name="name" placeholder="Ej: TechCorp Solutions" required />
            </div>

            <div>
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input id="slug" name="slug" placeholder="techcorp-solutions" required />
                <p className="text-xs text-gray-500 mt-1">Se usará en la URL del workspace.</p>
            </div>

            <div>
                <Label htmlFor="template_id">Plantilla de Cliente *</Label>
                <Select name="template_id" defaultValue={templates[0]?.id} required>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona una plantilla..." />
                    </SelectTrigger>
                    <SelectContent>
                        {templates.length === 0 ? (
                            <SelectItem value="loading" disabled>No hay plantillas disponibles</SelectItem>
                        ) : (
                            templates.map(template => (
                                <SelectItem key={template.id} value={template.id}>
                                    {template.name} ({template.category})
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">La plantilla define los módulos y límites para esta empresa.</p>
            </div>

            <div>
              <Label htmlFor="contact_email">Email de Contacto *</Label>
              <Input id="contact_email" name="contact_email" type="email" placeholder="admin@techcorp.com" required />
            </div>

            <div>
              <Label htmlFor="contact_phone">Teléfono</Label>
              <Input id="contact_phone" name="contact_phone" placeholder="+34 600 000 000" />
            </div>

            <div>
                <Label htmlFor="domain">Dominio Web</Label>
                <Input id="domain" name="domain" placeholder="https://techcorp.com" />
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Crear Empresa
              </Button>
              <Link href="/admin/companies">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}