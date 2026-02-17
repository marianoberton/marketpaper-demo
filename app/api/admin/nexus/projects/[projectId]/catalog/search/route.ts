import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'

const NEXUS_URL = process.env.NEXUS_API_URL || 'http://localhost:3002'

// GET /api/admin/nexus/projects/[projectId]/catalog/search?q=query
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { projectId } = await params
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    const res = await fetch(
      `${NEXUS_URL}/api/v1/projects/${projectId}/catalog/search?q=${encodeURIComponent(q)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    )

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Nexus server error' }))
      return NextResponse.json({ error: error.message }, { status: res.status })
    }

    const response = await res.json()
    // Unwrap the fomo-core response format { success: true, data: {...} }
    return NextResponse.json(response.data || response)
  } catch (error) {
    console.error('Error in GET /api/admin/nexus/catalog/search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
