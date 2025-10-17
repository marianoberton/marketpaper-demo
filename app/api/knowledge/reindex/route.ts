import { NextRequest, NextResponse } from 'next/server'
import { rebuildKnowledgeIndex } from '@/lib/rag/knowledge-store'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ok: false, error: 'Falta OPENAI_API_KEY en variables de entorno.' }, { status: 400 })
    }
    const result = await rebuildKnowledgeIndex()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in POST /api/knowledge/reindex', error)
    const msg = (error as any)?.message || 'Error interno'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}