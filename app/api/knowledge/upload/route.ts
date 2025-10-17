import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { rebuildKnowledgeIndex } from '@/lib/rag/knowledge-store'

export const runtime = 'nodejs'

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ ok: false, error: 'No se envió archivo.' }, { status: 400 })
    }
    const ext = path.extname(file.name).toLowerCase()
    if (!['.txt', '.md', '.pdf'].includes(ext)) {
      return NextResponse.json({ ok: false, error: 'Formato inválido. Solo .txt, .md o .pdf.' }, { status: 400 })
    }
    const arrayBuf = await file.arrayBuffer()
    const buf = Buffer.from(arrayBuf)
    const docsDir = path.join(process.cwd(), 'docs')
    ensureDir(docsDir)
    const safeName = file.name.replace(/[^a-zA-Z0-9_\-.]/g, '_')
    const target = path.join(docsDir, `${Date.now()}_${safeName}`)
    fs.writeFileSync(target, buf)

    let reindexed = false
    let reindexError: string | null = null
    if (process.env.OPENAI_API_KEY) {
      try {
        await rebuildKnowledgeIndex()
        reindexed = true
      } catch (e: any) {
        reindexError = e?.message || 'Fallo al reindexar'
      }
    }

    return NextResponse.json({ ok: true, uploaded: { name: file.name, size: buf.length, savedAs: path.basename(target) }, reindexed, reindexError })
  } catch (error) {
    console.error('Upload error', error)
    return NextResponse.json({ ok: false, error: (error as any)?.message || 'Error interno' }, { status: 500 })
  }
}