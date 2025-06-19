import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase.from('companies').select('id').limit(1)
    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 