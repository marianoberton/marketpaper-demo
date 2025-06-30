import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const companyId = resolvedParams.id
    
    console.log('🔧 API: Starting logo upload for company:', companyId)
    
    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    console.log('📁 File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    })
    
    // Validate file type
    const validTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/svg+xml', 
      'image/webp', 
      'image/gif'
    ]
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Use JPEG, PNG, SVG, WebP or GIF` },
        { status: 400 }
      )
    }
    
    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: 10MB` },
        { status: 400 }
      )
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${companyId}-logo.${fileExt}`
    
    console.log('📂 Upload filename:', fileName)
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Upload to storage using service role (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(fileName, buffer, {
        upsert: true,
        contentType: file.type
      })
    
    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError)
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }
    
    console.log('✅ File uploaded successfully:', uploadData)
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('company-logos')
      .getPublicUrl(fileName)
    
    console.log('🌐 Public URL generated:', publicUrl)
    
    // Update company in database
    const { error: updateError } = await supabase
      .from('companies')
      .update({ logo_url: publicUrl })
      .eq('id', companyId)
    
    if (updateError) {
      console.error('❌ Database update error:', updateError)
      return NextResponse.json(
        { error: `Database update failed: ${updateError.message}` },
        { status: 500 }
      )
    }
    
    console.log('✅ Database updated successfully')
    
    return NextResponse.json({
      success: true,
      logoUrl: publicUrl,
      message: 'Logo uploaded successfully'
    })
    
  } catch (error) {
    console.error('❌ API Logo upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { error: `Upload failed: ${errorMessage}` },
      { status: 500 }
    )
  }
} 