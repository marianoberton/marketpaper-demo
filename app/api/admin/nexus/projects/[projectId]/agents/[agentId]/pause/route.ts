import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'

const NEXUS_URL = process.env.NEXUS_API_URL || 'http://localhost:3002'

// POST /api/admin/nexus/projects/[projectId]/agents/[agentId]/pause
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; agentId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { projectId, agentId } = await params

    const res = await fetch(`${NEXUS_URL}/api/v1/projects/${projectId}/agents/${agentId}/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Nexus server error' }))
      return NextResponse.json({ error: error.message }, { status: res.status })
    }

    const response = await res.json()
    // Unwrap the fomo-core response format { success: true, data: {...} }
    return NextResponse.json(response.data || response)
  } catch (error) {
    console.error('Error in POST /api/admin/nexus/agents/[agentId]/pause:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
