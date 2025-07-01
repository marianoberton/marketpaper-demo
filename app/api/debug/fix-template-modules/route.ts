import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { templateId } = await request.json()
    
    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdmin()
    
    // 1. Get template with available_features
    const { data: template, error: templateError } = await supabaseAdmin
      .from('client_templates')
      .select('id, name, available_features')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ 
        error: 'Template not found', 
        details: templateError 
      }, { status: 404 })
    }

    // 2. Get all existing modules with their featureId mapping
    const { data: allModules, error: modulesError } = await supabaseAdmin
      .from('modules')
      .select('id, name, featureId, route_path, icon, category')

    if (modulesError) {
      return NextResponse.json({ 
        error: 'Failed to fetch modules', 
        details: modulesError 
      }, { status: 500 })
    }

    // 3. Get current template_modules assignments
    const { data: currentAssignments, error: currentError } = await supabaseAdmin
      .from('template_modules')
      .select(`
        module_id,
        modules (
          name,
          featureId
        )
      `)
      .eq('template_id', templateId)

    if (currentError) {
      return NextResponse.json({ 
        error: 'Failed to fetch current assignments', 
        details: currentError 
      }, { status: 500 })
    }

    const currentModuleIds = currentAssignments?.map(ta => ta.module_id) || []
    const currentFeatureIds = currentAssignments?.map(ta => (ta.modules as any)?.featureId).filter(Boolean) || []

    // 4. Find modules that should be assigned based on available_features
    const requiredModules = []
    const availableFeatures = template.available_features || []

    for (const featureId of availableFeatures) {
      // Skip if already assigned
      if (currentFeatureIds.includes(featureId)) {
        continue
      }

      // Find module by featureId
      const module = allModules?.find(m => m.featureId === featureId)
      if (module) {
        requiredModules.push(module)
      }
    }

    // 5. Insert missing module assignments
    const results = []
    for (const module of requiredModules) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('template_modules')
        .insert({
          template_id: templateId,
          module_id: module.id
        })
        .select()

      if (insertError) {
        console.error(`Failed to assign module ${module.name}:`, insertError)
        results.push({
          module: module.name,
          success: false,
          error: insertError.message
        })
      } else {
        results.push({
          module: module.name,
          success: true,
          data: inserted
        })
      }
    }

    // 6. Get updated assignments for verification
    const { data: updatedAssignments } = await supabaseAdmin
      .from('template_modules')
      .select(`
        modules (
          id,
          name,
          route_path,
          icon,
          category,
          featureId
        )
      `)
      .eq('template_id', templateId)

    const finalModules = updatedAssignments?.map(ta => ta.modules).filter(Boolean) || []

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        available_features: template.available_features
      },
      previousModules: currentAssignments?.length || 0,
      requiredModules: requiredModules.length,
      assignmentResults: results,
      finalModules: finalModules.length,
      finalModulesList: finalModules,
      success: true
    }, { status: 200 })

  } catch (error: any) {
    console.error('Fix template error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
} 