import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { getModulesForCompany, getCurrentCompany } from '@/lib/crm-multitenant'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    
    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdmin()
    
    // 1. Get company data with all related information
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select(`
        id,
        name,
        template_id,
        features,
        client_templates!template_id (
          id,
          name,
          available_features
        )
      `)
      .eq('id', companyId)
      .single()

    if (companyError) {
      return NextResponse.json({ 
        error: 'Company not found', 
        details: companyError 
      }, { status: 404 })
    }

    // 2. Get template modules if template is assigned
    let templateModules: any[] = []
    if (company.template_id) {
      const { data: tmData, error: tmError } = await supabaseAdmin
        .from('template_modules')
        .select(`
          modules (
            id,
            name,
            route_path,
            icon,
            category
          )
        `)
        .eq('template_id', company.template_id)

      if (!tmError && tmData) {
        templateModules = tmData.map(tm => tm.modules).filter(Boolean)
      }
    }

    // 3. Get all available modules for reference
    const { data: allModules } = await supabaseAdmin
      .from('modules')
      .select('*')
      .order('category', { ascending: true })

    // 4. Use our function to see what it actually returns
    const actualModules = await getModulesForCompany(companyId)

    // 5. Get company data using getCurrentCompany for comparison
    let currentCompanyData = null
    try {
      currentCompanyData = await getCurrentCompany(companyId)
    } catch (error: any) {
      console.error('getCurrentCompany error:', error.message)
    }

    const debugInfo = {
      companyId,
      company: {
        id: company.id,
        name: company.name,
        template_id: company.template_id,
        features: company.features,
        template: company.client_templates
      },
      templateModules,
      allModules: allModules || [],
      actualModulesFromFunction: actualModules,
      currentCompanyData,
      analysis: {
        hasTemplate: !!company.template_id,
        hasFeatures: !!(company.features && company.features.length > 0),
        hasTemplateFeatures: !!(company.client_templates && company.client_templates[0]?.available_features),
        templateModulesCount: templateModules.length,
        actualModulesCount: actualModules.length,
        fallbackUsed: templateModules.length === 0 ? 'features or template_features' : 'template_modules'
      }
    }

    return NextResponse.json(debugInfo, { status: 200 })

  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
} 