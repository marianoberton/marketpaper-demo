import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nexusApi } from '../api'
import type { CreateIntegrationPayload } from '../types'

const integrationKeys = {
  all: ['nexus', 'integrations'] as const,
  lists: () => [...integrationKeys.all, 'list'] as const,
  list: (projectId: string) => [...integrationKeys.lists(), projectId] as const,
  details: () => [...integrationKeys.all, 'detail'] as const,
  detail: (projectId: string, id: string) => [...integrationKeys.details(), projectId, id] as const,
}

export function useIntegrations(projectId: string, enabled = true) {
  return useQuery({
    queryKey: integrationKeys.list(projectId),
    queryFn: () => nexusApi.listIntegrations(projectId),
    enabled: !!projectId && enabled,
  })
}

export function useIntegration(projectId: string, id: string, enabled = true) {
  return useQuery({
    queryKey: integrationKeys.detail(projectId, id),
    queryFn: () => nexusApi.getIntegration(projectId, id),
    enabled: !!projectId && !!id && enabled,
  })
}

export function useCreateIntegration(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateIntegrationPayload) => nexusApi.createIntegration(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.list(projectId) })
    },
  })
}

export function useUpdateIntegration(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ config: Record<string, unknown>; status: string }> }) =>
      nexusApi.updateIntegration(projectId, id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.detail(projectId, id) })
      queryClient.invalidateQueries({ queryKey: integrationKeys.list(projectId) })
    },
  })
}

export function useDeleteIntegration(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => nexusApi.deleteIntegration(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.list(projectId) })
    },
  })
}

export function useHealthCheckIntegration(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => nexusApi.healthCheckIntegration(projectId, id),
  })
}
