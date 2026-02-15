// ─── Nexus Core API Types ─────────────────────────────────────────

export interface NexusProject {
  id: string
  name: string
  description: string | null
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
