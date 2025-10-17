import { NextRequest, NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { getKnowledgePromptConfig } from '@/lib/rag/knowledge-config'
import { retrieveContext, retrieveContextDocs } from '@/lib/rag/knowledge-store'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = (body?.message || '').toString()
    if (!message || message.length === 0) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Falta OPENAI_API_KEY en variables de entorno.' }, { status: 400 })
    }

    const cfg = getKnowledgePromptConfig()
    const systemPrompt = (body?.systemPrompt as string) || cfg.systemPrompt
    const topK = body?.topK ? Number(body.topK) : cfg.topK
    const docs = await retrieveContextDocs(message, topK)
    const context = docs.map((d, i) => `[#${i + 1}] Fuente: ${d.metadata?.label || d.metadata?.source}\n${d.pageContent}`).join('\n\n')

    const llm = new ChatOpenAI({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
    })

    const prompt = `${systemPrompt}\n\nContexto recuperado:\n${context}\n\nConsulta del usuario:\n${message}\n\nResponde siguiendo la política.`

    const result = await llm.invoke([{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }])
    return NextResponse.json({
      answer: result.content,
      sources: docs.map((d) => ({
        source: (d.metadata?.label as string) || (d.metadata?.source as string),
        metadata: d.metadata,
      })),
    })
  } catch (error) {
    console.error('Error in POST /api/knowledge/chat', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}