import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'

const NEXUS_URL = process.env.NEXUS_API_URL || 'http://localhost:3002'

type Params = { params: Promise<{ projectId: string; id: string }> }

// GET /api/admin/nexus/projects/[projectId]/memory/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { projectId, id } = await params

    const res = await fetch(`${NEXUS_URL}/api/v1/projects/${projectId}/memory/${id}`, {
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
    console.error('Error in GET /api/admin/nexus/memory/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/nexus/projects/[projectId]/memory/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { projectId, id } = await params
    const body = await request.json()

    const res = await fetch(`${NEXUS_URL}/api/v1/projects/${projectId}/memory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Nexus server error' }))
      return NextResponse.json({ error: error.message }, { status: res.status })
    }

    const response = await res.json()
    // Unwrap the fomo-core response format { success: true, data: {...} }
    return NextResponse.json(response.data || response)
  } catch (error) {
    console.error('Error in PATCH /api/admin/nexus/memory/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/nexus/projects/[projectId]/memory/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { projectId, id } = await params

    const res = await fetch(`${NEXUS_URL}/api/v1/projects/${projectId}/memory/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Nexus server error' }))
      return NextResponse.json({ error: error.message }, { status: res.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/nexus/memory/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
