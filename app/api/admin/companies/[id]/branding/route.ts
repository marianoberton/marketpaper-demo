import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth-server'

// Validador de color hex
function isValidHexColor(color: string): boolean {
  return /^#([0-9A-F]{3}){1,2}$/i.test(color)
}

// Interfaces
interface ColorScheme {
  primary?: string
  accent?: string
}

interface CustomColors {
  light?: ColorScheme
  dark?: ColorScheme
}

// GET: Obtener configuración de branding
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que es super admin
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, custom_colors, theme_config, logo_url')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching company:', error)
      throw error
    }

    return NextResponse.json({
      custom_colors: company.custom_colors || { light: {}, dark: {} },
      theme_config: company.theme_config || {},
      logo_url: company.logo_url
    })

  } catch (error) {
    console.error('Error fetching branding:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuración de branding' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar configuración de branding
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { custom_colors, theme_config } = body

    // Validación de colores
    if (custom_colors) {
      const validateColors = (colors: ColorScheme | undefined) => {
        if (!colors) return true
        for (const key in colors) {
          const value = colors[key as keyof ColorScheme]
          if (value && !isValidHexColor(value)) {
            throw new Error(`Color inválido: ${value}`)
          }
        }
        return true
      }

      if (custom_colors.light) validateColors(custom_colors.light)
      if (custom_colors.dark) validateColors(custom_colors.dark)
    }

    // Actualizar en base de datos
    const { data, error } = await supabase
      .from('companies')
      .update({
        custom_colors,
        theme_config,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select('id, name, custom_colors, theme_config')
      .single()

    if (error) {
      console.error('Error updating branding:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Error updating branding:', error)
    const message = error instanceof Error ? error.message : 'Error al actualizar configuración de branding'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
