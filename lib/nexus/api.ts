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

// Use Next.js API proxy routes instead of calling fomo-core directly
// This works in both dev and production, and adds auth validation
const NEXUS_URL = '/api/admin/nexus'

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
  const res = await fetch(`${NEXUS_URL}${path}`, {
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
  updateProject: (id: string, data: Partial<NexusProject>) => request<NexusProject>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProject: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),
  pauseProject: (id: string) => request<NexusProject>(`/projects/${id}/pause`, { method: 'POST', body: '{}' }),
  resumeProject: (id: string) => request<NexusProject>(`/projects/${id}/resume`, { method: 'POST', body: '{}' }),
  getProjectStats: (projectId: string) => request<any>(`/projects/${projectId}/stats`),

  // ─── Agents ───────────────────────────────────────────────────
  listAgents: (projectId: string) => request<{ data: NexusAgent[] }>(`/projects/${projectId}/agents`),
  getAgent: (projectId: string, agentId: string) => request<NexusAgent>(`/projects/${projectId}/agents/${agentId}`),
  createAgent: (projectId: string, data: any) => request<NexusAgent>(`/projects/${projectId}/agents`, { method: 'POST', body: JSON.stringify(data) }),
  updateAgent: (projectId: string, agentId: string, data: any) => request<NexusAgent>(`/projects/${projectId}/agents/${agentId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAgent: (projectId: string, agentId: string) => request<void>(`/projects/${projectId}/agents/${agentId}`, { method: 'DELETE' }),
  pauseAgent: (projectId: string, agentId: string) => request<NexusAgent>(`/projects/${projectId}/agents/${agentId}/pause`, { method: 'POST', body: '{}' }),
  resumeAgent: (projectId: string, agentId: string) => request<NexusAgent>(`/projects/${projectId}/agents/${agentId}/resume`, { method: 'POST', body: '{}' }),
  getAgentStats: (projectId: string, agentId: string) => request<any>(`/projects/${projectId}/agents/${agentId}/stats`),

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

  // ─── Sessions ─────────────────────────────────────────────────
  listSessions: (projectId: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return request<{ data: any[] }>(`/projects/${projectId}/sessions${query}`)
  },
  getSession: (projectId: string, id: string) => request<any>(`/projects/${projectId}/sessions/${id}`),
  createSession: (projectId: string, data: any) => request<any>(`/projects/${projectId}/sessions`, { method: 'POST', body: JSON.stringify(data) }),
  terminateSession: (projectId: string, id: string) => request<any>(`/projects/${projectId}/sessions/${id}/terminate`, { method: 'POST', body: '{}' }),
  getSessionTraces: (projectId: string, sessionId: string, limit?: number) => {
    const query = limit ? `?limit=${limit}` : ''
    return request<{ data: any[] }>(`/projects/${projectId}/sessions/${sessionId}/traces${query}`)
  },

  // ─── Memory ───────────────────────────────────────────────────
  listMemory: (projectId: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return request<{ data: any[] }>(`/projects/${projectId}/memory${query}`)
  },
  getMemoryEntry: (projectId: string, id: string) => request<any>(`/projects/${projectId}/memory/${id}`),
  searchMemory: (projectId: string, query: string, limit = 20) =>
    request<{ data: any[] }>(`/projects/${projectId}/memory/search`, {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    }),
  createMemoryEntry: (projectId: string, data: any) =>
    request<any>(`/projects/${projectId}/memory`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMemoryEntry: (projectId: string, id: string, data: any) =>
    request<any>(`/projects/${projectId}/memory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteMemoryEntry: (projectId: string, id: string) =>
    request<void>(`/projects/${projectId}/memory/${id}`, {
      method: 'DELETE',
    }),

  // ─── Contacts ─────────────────────────────────────────────────
  listContacts: (projectId: string) => request<{ data: any[] }>(`/projects/${projectId}/contacts`),
  getContact: (projectId: string, id: string) => request<any>(`/projects/${projectId}/contacts/${id}`),
  createContact: (projectId: string, data: any) =>
    request<any>(`/projects/${projectId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateContact: (projectId: string, id: string, data: any) =>
    request<any>(`/projects/${projectId}/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteContact: (projectId: string, id: string) =>
    request<void>(`/projects/${projectId}/contacts/${id}`, {
      method: 'DELETE',
    }),

  // ─── Templates ────────────────────────────────────────────────
  listTemplates: (projectId: string) => request<{ data: any[] }>(`/projects/${projectId}/templates`),
  getTemplate: (projectId: string, id: string) => request<any>(`/projects/${projectId}/templates/${id}`),
  createTemplate: (projectId: string, data: any) =>
    request<any>(`/projects/${projectId}/templates`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTemplate: (projectId: string, id: string, data: any) =>
    request<any>(`/projects/${projectId}/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteTemplate: (projectId: string, id: string) =>
    request<void>(`/projects/${projectId}/templates/${id}`, {
      method: 'DELETE',
    }),

  // ─── Catalog ──────────────────────────────────────────────────
  listCatalogItems: (projectId: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return request<{ data: any[] }>(`/projects/${projectId}/catalog${query}`)
  },
  searchCatalog: (projectId: string, query: string) =>
    request<{ data: any[] }>(
      `/projects/${projectId}/catalog/search?q=${encodeURIComponent(query)}`
    ),
  deleteCatalogItem: (projectId: string, id: string) =>
    request<void>(`/projects/${projectId}/catalog/${id}`, {
      method: 'DELETE',
    }),

  // ─── Tools ────────────────────────────────────────────────────
  listTools: () => request<{ data: any[] }>('/tools'),
  getTool: (toolId: string) => request<any>(`/tools/${toolId}`),
  registerTool: (data: any) =>
    request<any>('/tools', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export { NexusApiError }
