// ─── Nexus AI Shared Constants ────────────────────────────────────
// Extracted from projects/new/page.tsx and agents/new/page.tsx to avoid duplication.

export const PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
] as const

export const MODELS: Record<string, { value: string; label: string }[]> = {
  anthropic: [
    { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
  ],
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  ],
}

export const DEFAULT_API_KEY_ENV: Record<string, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
}

export const AVAILABLE_TOOLS = [
  { id: 'calculator', label: 'Calculator', description: 'Operaciones matemáticas', category: 'utility' },
  { id: 'date-time', label: 'Date/Time', description: 'Fecha y hora actual', category: 'utility' },
  { id: 'json-transform', label: 'JSON Transform', description: 'Manipulación de JSON', category: 'utility' },
  { id: 'http-request', label: 'HTTP Request', description: 'Llamadas HTTP externas', category: 'integration' },
  { id: 'knowledge-search', label: 'Knowledge Search', description: 'Búsqueda semántica en base de conocimiento', category: 'memory' },
  { id: 'send-notification', label: 'Notificaciones', description: 'Enviar notificaciones multi-canal', category: 'communication' },
  { id: 'catalog-search', label: 'Catálogo', description: 'Buscar en catálogo de productos', category: 'data' },
  { id: 'catalog-order', label: 'Pedidos', description: 'Crear pedidos desde catálogo', category: 'data' },
  { id: 'propose-scheduled-task', label: 'Proponer Tarea', description: 'Proponer tareas programadas', category: 'scheduling' },
] as const

export const TEMPLATES = [
  { value: 'custom', label: 'Custom', description: 'Configuración personalizada' },
  { value: 'sales', label: 'Ventas', description: 'Agente de ventas B2B' },
  { value: 'support', label: 'Soporte', description: 'Atención al cliente' },
  { value: 'internal', label: 'Interno', description: 'Asistente interno con MCP' },
] as const

export type IntegrationProvider = 'chatwoot' | 'telegram' | 'whatsapp' | 'slack'

export const CHANNEL_OPTIONS: { id: IntegrationProvider; label: string; icon: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: 'MessageSquare' },
  { id: 'telegram', label: 'Telegram', icon: 'Send' },
  { id: 'slack', label: 'Slack', icon: 'Hash' },
  { id: 'chatwoot', label: 'Chatwoot', icon: 'Globe' },
]

export const CHANNEL_SECRET_KEYS: Record<IntegrationProvider, string[]> = {
  telegram: ['TELEGRAM_BOT_TOKEN'],
  whatsapp: ['WHATSAPP_ACCESS_TOKEN'],
  slack: ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET'],
  chatwoot: ['CHATWOOT_API_TOKEN'],
}
