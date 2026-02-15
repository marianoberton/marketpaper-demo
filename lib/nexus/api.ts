import type {
  NexusProject,
  NexusAgent,
  NexusApproval,
  NexusPromptLayer,
  NexusScheduledTask,
  NexusUsageRecord,
  NexusExecutionTrace,
  NexusDashboardStats,
} from './types'

// ─── Config ───────────────────────────────────────────────────────

const NEXUS_URL = process.env.NEXT_PUBLIC_NEXUS_API_URL || 'http://localhost:3002'

class NexusApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'NexusApiError'
  }
}

// ─── Base Request ─────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${NEXUS_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }))
    throw new NexusApiError(res.status, error.message || `Request failed: ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ─── API Methods ──────────────────────────────────────────────────

export const nexusApi = {
  // Generic
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => request(path, { method: 'DELETE' }),

  // ─── Projects ─────────────────────────────────────────────────
  listProjects: () => request<{ data: NexusProject[] }>('/projects'),
  getProject: (id: string) => request<NexusProject>(`/projects/${id}`),
  createProject: (data: Partial<NexusProject>) => request<NexusProject>('/projects', { method: 'POST', body: JSON.stringify(data) }),

  // ─── Agents ───────────────────────────────────────────────────
  listAgents: (projectId: string) => request<{ data: NexusAgent[] }>(`/projects/${projectId}/agents`),
  getAgent: (projectId: string, agentId: string) => request<NexusAgent>(`/projects/${projectId}/agents/${agentId}`),

  // ─── Approvals ────────────────────────────────────────────────
  listApprovals: (status?: string) => {
    const params = status ? `?status=${status}` : ''
    return request<{ data: NexusApproval[] }>(`/approvals${params}`)
  },
  approveAction: (id: string) => request<NexusApproval>(`/approvals/${id}/approve`, { method: 'POST', body: '{}' }),
  denyAction: (id: string) => request<NexusApproval>(`/approvals/${id}/deny`, { method: 'POST', body: '{}' }),

  // ─── Prompt Layers ────────────────────────────────────────────
  listPromptLayers: (projectId: string) => request<{ data: NexusPromptLayer[] }>(`/projects/${projectId}/prompt-layers`),
  createPromptLayer: (projectId: string, data: { layerType: string; content: string; createdBy: string; changeReason?: string }) =>
    request<NexusPromptLayer>(`/projects/${projectId}/prompt-layers`, { method: 'POST', body: JSON.stringify(data) }),
  activatePromptLayer: (id: string) => request<NexusPromptLayer>(`/prompt-layers/${id}/activate`, { method: 'POST', body: '{}' }),

  // ─── Scheduled Tasks ──────────────────────────────────────────
  listScheduledTasks: (projectId: string) => request<{ data: NexusScheduledTask[] }>(`/projects/${projectId}/scheduled-tasks`),
  approveTask: (id: string) => request<NexusScheduledTask>(`/scheduled-tasks/${id}/approve`, { method: 'POST', body: '{}' }),
  rejectTask: (id: string) => request<NexusScheduledTask>(`/scheduled-tasks/${id}/reject`, { method: 'POST', body: '{}' }),

  // ─── Usage / Costs ────────────────────────────────────────────
  getUsage: (projectId: string) => request<{ data: NexusUsageRecord[] }>(`/projects/${projectId}/usage`),

  // ─── Traces ───────────────────────────────────────────────────
  listTraces: (projectId: string) => request<{ data: NexusExecutionTrace[] }>(`/projects/${projectId}/traces`),

  // ─── Dashboard Stats ──────────────────────────────────────────
  getDashboardStats: () => request<NexusDashboardStats>('/stats'),

  // ─── Chat (REST fallback) ─────────────────────────────────────
  sendMessage: (projectId: string, agentId: string, message: string) =>
    request<{ sessionId: string; response: string }>(`/projects/${projectId}/agents/${agentId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
}

export { NexusApiError }
