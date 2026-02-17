import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nexusApi } from '../api'
import type { CreateSecretPayload } from '../types'

const secretKeys = {
  all: ['nexus', 'secrets'] as const,
  lists: () => [...secretKeys.all, 'list'] as const,
  list: (projectId: string) => [...secretKeys.lists(), projectId] as const,
}

export function useSecrets(projectId: string, enabled = true) {
  return useQuery({
    queryKey: secretKeys.list(projectId),
    queryFn: () => nexusApi.listSecrets(projectId),
    enabled: !!projectId && enabled,
  })
}

export function useCreateSecret(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSecretPayload) => nexusApi.createSecret(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: secretKeys.list(projectId) })
    },
  })
}

export function useUpdateSecret(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: { value: string; description?: string } }) =>
      nexusApi.updateSecret(projectId, key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: secretKeys.list(projectId) })
    },
  })
}

export function useDeleteSecret(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (key: string) => nexusApi.deleteSecret(projectId, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: secretKeys.list(projectId) })
    },
  })
}
