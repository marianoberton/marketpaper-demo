"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MessageSquare, Send, FileText, RefreshCw, Settings, Info, Upload, Brain } from 'lucide-react'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export default function KnowledgeClientPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [topK, setTopK] = useState<number>(4)
  const [systemPrompt, setSystemPrompt] = useState<string>('')
  const [reindexing, setReindexing] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function sendMessage() {
    const text = input.trim()
    if (!text) return
    setLoading(true)
    setMessages((m) => [...m, { role: 'user', content: text }])
    setInput('')
    try {
      const res = await fetch('/api/knowledge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, topK, systemPrompt: systemPrompt || undefined }),
      })
      const data = await res.json()
      if (data?.answer) {
        setMessages((m) => [...m, { role: 'assistant', content: data.answer }])
        if (Array.isArray(data.sources) && data.sources.length) {
          const listado = data.sources.map((s: any, i: number) => `[#${i + 1}] ${s.source || 'desconocida'}`).join('\n')
          setMessages((m) => [...m, { role: 'assistant', content: `Fuentes:\n${listado}` }])
        }
      } else if (data?.error) {
        setMessages((m) => [...m, { role: 'assistant', content: `Error: ${data.error}` }])
      }
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error de red: ${e?.message || e}` }])
    } finally {
      setLoading(false)
    }
  }

  async function triggerReindex() {
    setReindexing(true)
    try {
      const res = await fetch('/api/knowledge/reindex', { method: 'POST' })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data?.ok ? 'Índice reconstruido correctamente.' : `Error: ${data?.error || 'no definido'}` }])
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error al reconstruir: ${e?.message || e}` }])
    } finally {
      setReindexing(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/knowledge/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data?.ok) {
        setMessages((m) => [...m, { role: 'assistant', content: `Archivo subido: ${data.uploaded?.name}. Reindexado: ${data.reindexed ? 'sí' : 'no'}` }])
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: `Error al subir: ${data?.error || 'desconocido'}` }])
      }
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error de subida: ${e?.message || e}` }])
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* Explicación del módulo */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Brain className="h-5 w-5" /> Sistema RAG de Normativas
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <div className="space-y-2">
            <p><strong>¿Qué hace?</strong> Analiza documentos normativos (PDFs, textos) y responde consultas técnicas usando IA.</p>
            <p><strong>Embeddings:</strong> Usa text-embedding-3-large de OpenAI para máxima precisión en búsqueda semántica.</p>
            <p><strong>Documentos soportados:</strong> .txt, .md, .pdf (incluye planos, tablas e imágenes extraídas como texto).</p>
            <div className="flex items-center gap-4 text-xs mt-3">
              <span className="flex items-center gap-1"><FileText className="h-3 w-3"/> Fuentes: CPAU, CPIC + docs subidos</span>
              <span className="flex items-center gap-1"><Brain className="h-3 w-3"/> Modelo: GPT-4o-mini</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Chat Normativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border rounded-md p-3">
                <div className="text-xs font-semibold flex items-center gap-1 mb-2">
                  <Settings className="h-3 w-3"/> Configuración
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      min={1} 
                      max={12} 
                      value={topK} 
                      onChange={(e) => setTopK(Number(e.target.value))} 
                      placeholder="topK (fragmentos)" 
                      className="text-xs"
                    />
                    <Button variant="secondary" size="sm" onClick={triggerReindex} disabled={reindexing}>
                      <RefreshCw className="h-3 w-3 mr-1"/> Reindexar
                    </Button>
                  </div>
                  <Input 
                    value={systemPrompt} 
                    onChange={(e) => setSystemPrompt(e.target.value)} 
                    placeholder="Override del system prompt (opcional)" 
                    className="text-xs"
                  />
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <div className="text-xs font-semibold flex items-center gap-1 mb-2">
                  <Upload className="h-3 w-3"/> Subir Documentos
                </div>
                <div className="space-y-2">
                  <Input 
                    type="file" 
                    accept=".txt,.md,.pdf" 
                    onChange={handleUpload} 
                    disabled={uploading} 
                    className="text-xs"
                  />
                  <div className="text-xs text-gray-600">
                    <Info className="h-3 w-3 inline mr-1"/>
                    Soporta PDFs con planos, tablas e imágenes. Se reindexa automáticamente.
                  </div>
                </div>
              </div>
            </div>
            <div className="border rounded-md p-3 h-64 overflow-auto bg-white">
              {messages.length === 0 ? (
                <div className="text-sm text-gray-500">Empieza la conversación con una consulta normativa.</div>
              ) : (
                <div className="space-y-2">
                  {messages.map((m, i) => (
                    <div key={i} className={m.role === 'user' ? 'text-blue-700' : 'text-gray-800'}>
                      <span className="font-semibold">{m.role === 'user' ? 'Tú' : 'Asistente'}:</span> {m.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Ej: ¿Qué exige el CPAU para planos en 2024?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading}>
                <Send className="h-4 w-4 mr-1" /> Enviar
              </Button>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <FileText className="h-3 w-3" /> Fuente: Índice local (actualiza anual)
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}