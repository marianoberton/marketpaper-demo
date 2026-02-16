import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nexusApi } from '../api'
import type { NexusProject } from '../types'

// ─── Query Keys ───────────────────────────────────────────────────

const projectKeys = {
  all: ['nexus', 'projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  stats: (id: string) => [...projectKeys.detail(id), 'stats'] as const,
}

// ─── List Projects ────────────────────────────────────────────────

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: async () => {
      const result = await nexusApi.listProjects()
      return result.data
    },
  })
}

// ─── Get Single Project ───────────────────────────────────────────

export function useProject(projectId: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => nexusApi.getProject(projectId),
    enabled: !!projectId && enabled,
  })
}

// ─── Get Project Stats ────────────────────────────────────────────

export function useProjectStats(projectId: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.stats(projectId),
    queryFn: () => nexusApi.getProjectStats(projectId),
    enabled: !!projectId && enabled,
  })
}

// ─── Create Project ───────────────────────────────────────────────

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<NexusProject>) => nexusApi.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

// ─── Update Project ───────────────────────────────────────────────

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<NexusProject>) => nexusApi.updateProject(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

// ─── Delete Project ───────────────────────────────────────────────

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectId: string) => nexusApi.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

// ─── Pause Project ────────────────────────────────────────────────

export function usePauseProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectId: string) => nexusApi.pauseProject(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

// ─── Resume Project ───────────────────────────────────────────────

export function useResumeProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectId: string) => nexusApi.resumeProject(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}
