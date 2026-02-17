import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'

const NEXUS_URL = process.env.NEXUS_API_URL || 'http://localhost:3002'

// GET /api/admin/nexus/projects/[projectId]/sessions/[sessionId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; sessionId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { projectId, sessionId } = await params

    const res = await fetch(`${NEXUS_URL}/api/v1/projects/${projectId}/sessions/${sessionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Nexus server error' }))
      return NextResponse.json({ error: error.message }, { status: res.status })
    }

    const response = await res.json()
    // Unwrap the fomo-core response format { success: true, data: {...} }
    return NextResponse.json(response.data || response)
  } catch (error) {
    console.error('Error in GET /api/admin/nexus/projects/[projectId]/sessions/[sessionId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
