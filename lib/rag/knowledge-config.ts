export type KnowledgePromptConfig = {
  systemPrompt: string
  topK: number
}

const DEFAULT_SYSTEM_PROMPT = `Eres un asistente experto en normativa técnica y regulatoria.
Responde de forma precisa, citando la fuente y artículo cuando sea posible.
Si no hay suficiente contexto en los documentos, indica claramente la falta y sugiere consultar la norma oficial.
Mantén respuestas concisas y orientadas a acción.

Política de respuesta:
- Prioriza normativa vigente y fuentes oficiales.
- Evita suposiciones. Si hay ambigüedad, pide más datos.
- Incluye referencias: nombre de la norma, capítulo/artículo, año.
- No inventes números ni artículos.
`;

export function getKnowledgePromptConfig(): KnowledgePromptConfig {
  const envPrompt = process.env.RAG_KNOWLEDGE_SYSTEM_PROMPT
  const topKEnv = process.env.RAG_KNOWLEDGE_TOPK
  const topK = topKEnv ? Number(topKEnv) : 4

  return {
    systemPrompt: envPrompt && envPrompt.length > 0 ? envPrompt : DEFAULT_SYSTEM_PROMPT,
    topK: Number.isFinite(topK) && topK > 0 ? topK : 4,
  }
}

export function shouldRebuildIndex(currentYear?: number): boolean {
  const targetYearEnv = process.env.RAG_KNOWLEDGE_YEAR
  const nowYear = currentYear ?? new Date().getFullYear()
  if (!targetYearEnv) return false
  const targetYear = Number(targetYearEnv)
  if (!Number.isFinite(targetYear)) return false
  return targetYear !== nowYear
}