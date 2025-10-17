import fs from 'fs'
import path from 'path'
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib'
import { OpenAIEmbeddings } from '@langchain/openai'
import { Document } from '@langchain/core/documents'
import { getKnowledgePromptConfig, shouldRebuildIndex } from './knowledge-config'
import pdf from 'pdf-parse'

const INDEX_DIR = path.join(process.cwd(), 'data', 'rag')
const INDEX_PATH = path.join(INDEX_DIR, 'knowledge-index')
const META_PATH = path.join(INDEX_DIR, 'knowledge-index-meta.json')

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

function chunkDoc(doc: Document, chunkSize = 1500, chunkOverlap = 200): Document[] {
  const text = doc.pageContent
  const chunks: Document[] = []
  let start = 0
  let idx = 0
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunkText = text.slice(start, end)
    chunks.push(new Document({
      pageContent: chunkText,
      metadata: {
        ...doc.metadata,
        chunkIndex: idx,
      },
    }))
    if (end === text.length) break
    start = end - chunkOverlap
    idx++
  }
  return chunks
}

function chunkDocuments(docs: Document[], chunkSize = 1500, chunkOverlap = 200): Document[] {
  const out: Document[] = []
  for (const d of docs) {
    const chunks = chunkDoc(d, chunkSize, chunkOverlap)
    out.push(...chunks)
  }
  return out
}

async function loadTextDocsFromDir(dir: string): Promise<Document[]> {
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir)
  const docs: Document[] = []
  for (const f of files) {
    const ext = path.extname(f).toLowerCase()
    if (!['.txt', '.md', '.pdf'].includes(ext)) continue
    const full = path.join(dir, f)
    try {
      let content: string
      if (ext === '.pdf') {
        const buffer = fs.readFileSync(full)
        const data = await pdf(buffer)
        content = data.text
      } else {
        content = fs.readFileSync(full, 'utf8')
      }
      docs.push(new Document({ 
        pageContent: content, 
        metadata: { 
          source: full, 
          type: ext.slice(1),
          filename: f
        } 
      }))
    } catch (e) {
      console.warn('Failed to read doc', full, e)
    }
  }
  return docs
}

function loadJsonAsDoc(jsonPath: string, label?: string): Document[] {
  if (!fs.existsSync(jsonPath)) return []
  try {
    const raw = fs.readFileSync(jsonPath, 'utf8')
    const json = JSON.parse(raw)
    const content = typeof json === 'string' ? json : JSON.stringify(json)
    return [
      new Document({ pageContent: content, metadata: { source: jsonPath, label } })
    ]
  } catch (e) {
    console.warn('Failed to read JSON', jsonPath, e)
    return []
  }
}

async function gatherKnowledgeDocuments(): Promise<Document[]> {
  const docsDir = path.join(process.cwd(), 'docs')
  const publicDir = path.join(process.cwd(), 'public')
  const docs = await loadTextDocsFromDir(docsDir)
  const cpauJson = path.join(publicDir, 'catalogo_CPAU.json')
  const cpicJson = path.join(publicDir, 'catalogo_cpic.json')
  const jsonDocs = [
    ...loadJsonAsDoc(cpauJson, 'CPAU'),
    ...loadJsonAsDoc(cpicJson, 'CPIC'),
  ]
  return [...docs, ...jsonDocs]
}

export async function getKnowledgeVectorStore(forceRebuild?: boolean): Promise<HNSWLib> {
  ensureDir(INDEX_DIR)
  const embeddings = new OpenAIEmbeddings({
    model: process.env.OPENAI_EMBEDDINGS_MODEL || 'text-embedding-3-large',
  })

  const indexExists = fs.existsSync(INDEX_PATH) && fs.existsSync(path.join(INDEX_PATH, 'data.bin'))
  const needRebuild = forceRebuild || shouldRebuildIndex() || !indexExists

  if (!needRebuild && indexExists) {
    try {
      const store = await HNSWLib.load(INDEX_PATH, embeddings)
      return store
    } catch (e) {
      console.warn('Failed to load existing index, rebuilding...', e)
    }
  }

  const allDocs = await gatherKnowledgeDocuments()
  if (allDocs.length === 0) {
    // Create an empty store to avoid failures
    const store = await HNSWLib.fromDocuments([new Document({ pageContent: 'Sin documentos normativos cargados aún.', metadata: { source: 'placeholder' } })], embeddings)
    await store.save(INDEX_PATH)
    fs.writeFileSync(META_PATH, JSON.stringify({ rebuiltAt: new Date().toISOString(), docCount: 0 }))
    return store
  }

  const chunked = chunkDocuments(allDocs)
  const store = await HNSWLib.fromDocuments(chunked, embeddings)
  await store.save(INDEX_PATH)
  fs.writeFileSync(META_PATH, JSON.stringify({ rebuiltAt: new Date().toISOString(), docCount: allDocs.length, chunks: chunked.length }))
  return store
}

export async function retrieveContext(query: string, k?: number): Promise<string> {
  const { topK } = getKnowledgePromptConfig()
  const store = await getKnowledgeVectorStore()
  const results = await store.similaritySearch(query, k ?? topK)
  return results.map((d, i) => `[#${i + 1}] Fuente: ${d.metadata?.label || d.metadata?.source}\n${d.pageContent}`).join('\n\n')
}

export async function retrieveContextDocs(query: string, k?: number) {
  const { topK } = getKnowledgePromptConfig()
  const store = await getKnowledgeVectorStore()
  const results = await store.similaritySearch(query, k ?? topK)
  return results
}

export async function rebuildKnowledgeIndex() {
  const store = await getKnowledgeVectorStore(true)
  const meta = getIndexMeta()
  return { ok: true, meta, rebuilt: true }
}

export function getIndexMeta() {
  try {
    if (fs.existsSync(META_PATH)) {
      const raw = fs.readFileSync(META_PATH, 'utf8')
      return JSON.parse(raw)
    }
  } catch (e) {}
  return { rebuiltAt: null, docCount: null }
}