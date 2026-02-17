// ─── Nexus Core API Types ─────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  data?: T[]
  total: number
  limit: number
  offset: number
}

export interface NexusProject {
  id: string
  name: string
  description: string | null
  environment?: 'development' | 'staging' | 'production'
  owner: string
  tags?: string[]
  status: 'active' | 'paused' | 'archived'
  config: NexusProjectConfig
  createdAt: string
  updatedAt: string
}

export interface NexusProjectConfig {
  provider: {
    provider: string
    model: string
    apiKeyEnvVar: string
    temperature?: number
  }
  allowedTools: string[]
  mcpServers?: NexusMcpServerConfig[]
  memoryConfig?: Record<string, unknown>
  costConfig?: {
    dailyBudgetUSD: number
    monthlyBudgetUSD: number
  }
  maxTurnsPerSession?: number
  maxConcurrentSessions?: number
}

export interface NexusMcpServerConfig {
  name: string
  transport: 'stdio' | 'sse'
  command?: string
  args?: string[]
  url?: string
  env?: Record<string, string>
}

export interface NexusAgent {
  id: string
  projectId: string
  name: string
  description: string | null
  status: 'active' | 'idle' | 'paused' | 'error'
  config: {
    role?: string
    model?: string
    promptSummary?: {
      identity: string
      instructions: string
      safety: string
    }
    toolAllowlist?: string[]
    mcpServers?: NexusMcpServerConfig[]
    channelConfig?: { channels: string[] }
    maxTurns?: number
    maxTokensPerTurn?: number
    budgetPerDayUsd?: number
  }
  createdAt: string
  updatedAt: string
}

export interface NexusSession {
  id: string
  projectId: string
  agentId?: string
  status: 'active' | 'completed' | 'expired'
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface NexusApproval {
  id: string
  projectId: string
  agentId: string
  sessionId: string
  toolId: string
  action: unknown
  status: 'pending' | 'approved' | 'denied'
  decidedBy: string | null
  decidedAt: string | null
  createdAt: string
}

export interface NexusPromptLayer {
  id: string
  projectId: string
  layerType: 'identity' | 'instructions' | 'safety'
  content: string
  version: number
  isActive: boolean
  createdBy: string
  changeReason: string | null
  createdAt: string
}

export interface NexusScheduledTask {
  id: string
  projectId: string
  name: string
  description: string | null
  cronExpression: string
  status: 'active' | 'paused' | 'proposed' | 'rejected'
  taskType: string
  payload: Record<string, unknown>
  lastRunAt: string | null
  nextRunAt: string | null
  createdAt: string
}

export interface NexusUsageRecord {
  date: string
  totalCost: number
  totalTokens: number
  totalRequests: number
}

export interface NexusExecutionTrace {
  id: string
  projectId: string
  sessionId: string
  agentId: string
  startedAt: string
  completedAt: string | null
  status: 'running' | 'completed' | 'error'
  totalTokens: number
  totalCost: number
  events: NexusTraceEvent[]
}

export interface NexusTraceEvent {
  type: string
  timestamp: string
  data: Record<string, unknown>
}

// ─── Dashboard Stats ──────────────────────────────────────────────

export interface NexusDashboardStats {
  totalProjects: number
  activeProjects: number
  totalAgents: number
  activeAgents: number
  activeSessions: number
  costToday: number
  costMonth: number
  pendingApprovals: number
}

// ─── API Response Wrappers ────────────────────────────────────────

export interface NexusListResponse<T> {
  data: T[]
  total: number
}

// ─── Agent Create/Update Payloads ─────────────────────────────────

export interface CreateAgentPayload {
  name: string
  description?: string
  promptConfig: {
    identity: string
    instructions: string
    safety: string
  }
  toolAllowlist?: string[]
  channelConfig?: {
    allowedChannels: string[]
    defaultChannel?: string
  }
  limits?: {
    maxTurns?: number
    maxTokensPerTurn?: number
    budgetPerDayUsd?: number
  }
}

export interface UpdateAgentPayload extends Partial<CreateAgentPayload> {}

// ─── Memory ───────────────────────────────────────────────────────

export interface MemoryEntry {
  id: string
  projectId: string
  content: string
  category?: string
  importance: number
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface CreateMemoryPayload {
  content: string
  category?: string
  importance?: number
  metadata?: Record<string, unknown>
}

// ─── Contacts ─────────────────────────────────────────────────────

export interface Contact {
  id: string
  projectId: string
  name: string
  email?: string
  phone?: string
  company?: string
  tags: string[]
  customFields?: Record<string, unknown>
  lastContactAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateContactPayload {
  name: string
  email?: string
  phone?: string
  company?: string
  tags?: string[]
  customFields?: Record<string, unknown>
}

// ─── Templates ────────────────────────────────────────────────────

export interface Template {
  id: string
  projectId: string
  name: string
  content: string
  variables: string[]
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateTemplatePayload {
  name: string
  content: string
  variables?: string[]
}

// ─── Catalog ──────────────────────────────────────────────────────

export interface CatalogItem {
  id: string
  projectId: string
  sku: string
  name: string
  description?: string
  price?: number
  category?: string
  stock?: number
  metadata?: Record<string, unknown>
  createdAt: string
}

// ─── Tools ────────────────────────────────────────────────────────

export interface Tool {
  id: string
  name: string
  description: string
  schema: object
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  isBuiltin: boolean
  projectsUsing: number
}

export interface RegisterToolPayload {
  id: string
  name: string
  description: string
  schema: object
  handler?: string
}

// ─── Stats ────────────────────────────────────────────────────────

export interface ProjectStats {
  totalSessions: number
  activeSessions: number
  totalCost: number
  costToday: number
  costThisMonth: number
  totalTokens: number
  avgTokensPerSession: number
  costByDay: Array<{ date: string; cost: number }>
}

export interface AgentStats {
  totalSessions: number
  avgSessionDuration: number
  totalCost: number
  totalTokens: number
  successRate: number
  toolUsage: Record<string, number>
}

// ─── Session Create ───────────────────────────────────────────────

export interface CreateSessionPayload {
  agentId?: string
  metadata?: Record<string, unknown>
}

// ─── Channel Integrations ────────────────────────────────────────

export interface ChannelIntegration {
  id: string
  projectId: string
  provider: 'chatwoot' | 'telegram' | 'whatsapp' | 'slack'
  config: Record<string, unknown>
  status: 'active' | 'paused'
  createdAt: string
  updatedAt: string
}

export interface CreateIntegrationPayload {
  provider: string
  config: Record<string, unknown>
}

// ─── Secrets ─────────────────────────────────────────────────────

export interface SecretMetadata {
  id: string
  projectId: string
  key: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CreateSecretPayload {
  key: string
  value: string
  description?: string
}

// ─── Tool Catalog ────────────────────────────────────────────────

export interface ToolCatalogEntry {
  id: string
  name: string
  description: string
  category: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  requiresApproval: boolean
  sideEffects: boolean
  supportsDryRun: boolean
  inputSchema?: Record<string, unknown>
  outputSchema?: Record<string, unknown>
}
