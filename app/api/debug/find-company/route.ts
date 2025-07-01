import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchName = searchParams.get('name')
    
    if (!searchName) {
      return NextResponse.json({ error: 'name parameter is required' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdmin()
    
    // Search companies by name (case insensitive)
    const { data: companies, error } = await supabaseAdmin
      .from('companies')
      .select(`
        id,
        name,
        slug,
        template_id,
        features,
        status,
        client_templates!template_id (
          id,
          name,
          available_features
        )
      `)
      .ilike('name', `%${searchName}%`)
      .order('name')

    if (error) {
      return NextResponse.json({ 
        error: 'Search failed', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      searchTerm: searchName,
      companies: companies || [] 
    }, { status: 200 })

  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
} 