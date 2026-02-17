import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nexusApi } from '../api'
import type { CreateMemoryPayload } from '../types'

const memoryKeys = {
  all: ['nexus', 'memory'] as const,
  lists: () => [...memoryKeys.all, 'list'] as const,
  list: (projectId: string) => [...memoryKeys.lists(), projectId] as const,
  details: () => [...memoryKeys.all, 'detail'] as const,
  detail: (projectId: string, id: string) => [...memoryKeys.details(), projectId, id] as const,
  search: (projectId: string) => [...memoryKeys.all, 'search', projectId] as const,
}

export function useMemory(projectId: string, filters?: Record<string, string>, enabled = true) {
  return useQuery({
    queryKey: [...memoryKeys.list(projectId), filters],
    queryFn: async () => {
      const result = await nexusApi.listMemory(projectId, filters)
      return result.items || result.data || []
    },
    enabled: !!projectId && enabled,
  })
}

export function useMemoryEntry(projectId: string, id: string, enabled = true) {
  return useQuery({
    queryKey: memoryKeys.detail(projectId, id),
    queryFn: () => nexusApi.getMemoryEntry(projectId, id),
    enabled: !!projectId && !!id && enabled,
  })
}

export function useSearchMemory(projectId: string) {
  return useMutation({
    mutationFn: ({ query, limit }: { query: string; limit?: number }) =>
      nexusApi.searchMemory(projectId, query, limit),
  })
}

export function useCreateMemory(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMemoryPayload) => nexusApi.createMemoryEntry(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.list(projectId) })
    },
  })
}

export function useUpdateMemory(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateMemoryPayload> }) =>
      nexusApi.updateMemoryEntry(projectId, id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.detail(projectId, id) })
      queryClient.invalidateQueries({ queryKey: memoryKeys.list(projectId) })
    },
  })
}

export function useDeleteMemory(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => nexusApi.deleteMemoryEntry(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.list(projectId) })
    },
  })
}
