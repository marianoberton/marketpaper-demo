import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/super-admin'

// GET all modules
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isSuperAdmin(user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: modules, error } = await supabase
      .from('modules')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json(modules)
  } catch (error: any) {
    console.error('Error fetching modules:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST a new module
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isSuperAdmin(user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, route_path, icon, category } = await request.json()

    if (!name || !route_path || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('modules')
      .insert([{ name, route_path, icon, category }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error creating module:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 