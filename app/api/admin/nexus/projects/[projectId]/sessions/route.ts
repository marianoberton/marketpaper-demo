import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'

const NEXUS_URL = process.env.NEXUS_API_URL || 'http://localhost:3002'

// GET /api/admin/nexus/projects/[projectId]/sessions
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
    const queryParts: string[] = []
    if (searchParams.get('status')) queryParts.push(`status=${searchParams.get('status')}`)
    if (searchParams.get('agentId')) queryParts.push(`agentId=${searchParams.get('agentId')}`)
    if (searchParams.get('limit')) queryParts.push(`limit=${searchParams.get('limit')}`)
    const query = queryParts.length ? `?${queryParts.join('&')}` : ''

    const res = await fetch(`${NEXUS_URL}/api/v1/projects/${projectId}/sessions${query}`, {
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
    console.error('Error in GET /api/admin/nexus/projects/[projectId]/sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/nexus/projects/[projectId]/sessions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { projectId } = await params
    const body = await request.json()

    const res = await fetch(`${NEXUS_URL}/api/v1/projects/${projectId}/sessions`, {
      method: 'POST',
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
    console.error('Error in POST /api/admin/nexus/projects/[projectId]/sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
