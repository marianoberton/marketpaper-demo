import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nexusApi } from '../api'
import type { CreateAgentPayload, UpdateAgentPayload } from '../types'

// ─── Query Keys ───────────────────────────────────────────────────

const agentKeys = {
  all: ['nexus', 'agents'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (projectId: string) => [...agentKeys.lists(), projectId] as const,
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (projectId: string, agentId: string) => [...agentKeys.details(), projectId, agentId] as const,
  stats: (projectId: string, agentId: string) => [...agentKeys.detail(projectId, agentId), 'stats'] as const,
}

// ─── List Agents ──────────────────────────────────────────────────

export function useAgents(projectId: string, enabled = true) {
  return useQuery({
    queryKey: agentKeys.list(projectId),
    queryFn: async () => {
      const result = await nexusApi.listAgents(projectId)
      return result.data
    },
    enabled: !!projectId && enabled,
  })
}

// ─── Get Single Agent ─────────────────────────────────────────────

export function useAgent(projectId: string, agentId: string, enabled = true) {
  return useQuery({
    queryKey: agentKeys.detail(projectId, agentId),
    queryFn: () => nexusApi.getAgent(projectId, agentId),
    enabled: !!projectId && !!agentId && enabled,
  })
}

// ─── Get Agent Stats ──────────────────────────────────────────────

export function useAgentStats(projectId: string, agentId: string, enabled = true) {
  return useQuery({
    queryKey: agentKeys.stats(projectId, agentId),
    queryFn: () => nexusApi.getAgentStats(projectId, agentId),
    enabled: !!projectId && !!agentId && enabled,
  })
}

// ─── Create Agent ─────────────────────────────────────────────────

export function useCreateAgent(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAgentPayload) => nexusApi.createAgent(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.list(projectId) })
    },
  })
}

// ─── Update Agent ─────────────────────────────────────────────────

export function useUpdateAgent(projectId: string, agentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateAgentPayload) => nexusApi.updateAgent(projectId, agentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(projectId, agentId) })
      queryClient.invalidateQueries({ queryKey: agentKeys.list(projectId) })
    },
  })
}

// ─── Delete Agent ─────────────────────────────────────────────────

export function useDeleteAgent(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (agentId: string) => nexusApi.deleteAgent(projectId, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.list(projectId) })
    },
  })
}

// ─── Pause Agent ──────────────────────────────────────────────────

export function usePauseAgent(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (agentId: string) => nexusApi.pauseAgent(projectId, agentId),
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(projectId, agentId) })
      queryClient.invalidateQueries({ queryKey: agentKeys.list(projectId) })
    },
  })
}

// ─── Resume Agent ─────────────────────────────────────────────────

export function useResumeAgent(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (agentId: string) => nexusApi.resumeAgent(projectId, agentId),
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(projectId, agentId) })
      queryClient.invalidateQueries({ queryKey: agentKeys.list(projectId) })
    },
  })
}
