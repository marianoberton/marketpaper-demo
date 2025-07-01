import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/super-admin'
import { promises as fs } from 'fs'
import path from 'path'

// Helper function to create module files (LOCAL DEVELOPMENT ONLY)
async function createModuleFiles(moduleName: string, routePath: string, icon: string, category: string) {
  const moduleDir = routePath.replace('/workspace/', '')
  const fullPath = path.join(process.cwd(), 'app', '(workspace)', 'workspace', moduleDir)
  
  try {
    // Create directory if it doesn't exist
    await fs.mkdir(fullPath, { recursive: true })
    
    // Create page.tsx
    const pageContent = `import { Suspense } from 'react';
import ClientPage from './client-page';

export default function ${moduleName.replace(/\s+/g, '')}Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ClientPage />
    </Suspense>
  );
}
`
    
    // Create client-page.tsx
    const clientPageContent = `'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ${icon} } from 'lucide-react'

export default function ${moduleName.replace(/\s+/g, '')}ClientPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <${icon} className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">${moduleName}</h1>
          <p className="text-muted-foreground">
            Módulo ${category.toLowerCase()} para gestión de ${moduleName.toLowerCase()}
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Configuración del módulo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Este es un módulo ${category.toLowerCase()} generado automáticamente.
            Puedes personalizar esta página según tus necesidades.
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Información del módulo:</h3>
            <ul className="text-sm space-y-1">
              <li><strong>Nombre:</strong> ${moduleName}</li>
              <li><strong>Ruta:</strong> ${routePath}</li>
              <li><strong>Categoría:</strong> ${category}</li>
              <li><strong>Icono:</strong> ${icon}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
`
    
    // Write files
    await fs.writeFile(path.join(fullPath, 'page.tsx'), pageContent)
    await fs.writeFile(path.join(fullPath, 'client-page.tsx'), clientPageContent)
    
    return true
  } catch (error) {
    console.error('Error creating module files:', error)
    return false
  }
}

// GET all modules
export async function GET() {
  const supabase = await createClient()
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
  const supabase = await createClient()
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

    // Try to create module files automatically (LOCAL DEVELOPMENT ONLY)
    const filesCreated = await createModuleFiles(name, route_path, icon, category)
    
    return NextResponse.json({
      ...data,
      filesCreated: filesCreated
    })
  } catch (error: any) {
    console.error('Error creating module:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT update a module
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isSuperAdmin(user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, name, route_path, icon, category } = await request.json()

    if (!id || !name || !route_path || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('modules')
      .update({ name, route_path, icon, category })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error updating module:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE a module
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isSuperAdmin(user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('id')

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    // Check if module is being used in any templates
    const { data: templateModules, error: checkError } = await supabase
      .from('template_modules')
      .select('template_id')
      .eq('module_id', moduleId)

    if (checkError) throw checkError

    if (templateModules && templateModules.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete module: it is being used in one or more templates. Remove it from templates first.' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId)

    if (error) throw error

    return NextResponse.json({ message: 'Module deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting module:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 