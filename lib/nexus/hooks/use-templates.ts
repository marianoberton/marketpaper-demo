import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nexusApi } from '../api'
import type { CreateTemplatePayload } from '../types'

const templateKeys = {
  all: ['nexus', 'templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (projectId: string) => [...templateKeys.lists(), projectId] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (projectId: string, id: string) => [...templateKeys.details(), projectId, id] as const,
}

export function useTemplates(projectId: string, enabled = true) {
  return useQuery({
    queryKey: templateKeys.list(projectId),
    queryFn: async () => {
      const result = await nexusApi.listTemplates(projectId)
      return result.data
    },
    enabled: !!projectId && enabled,
  })
}

export function useTemplate(projectId: string, templateId: string, enabled = true) {
  return useQuery({
    queryKey: templateKeys.detail(projectId, templateId),
    queryFn: () => nexusApi.getTemplate(projectId, templateId),
    enabled: !!projectId && !!templateId && enabled,
  })
}

export function useCreateTemplate(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTemplatePayload) => nexusApi.createTemplate(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list(projectId) })
    },
  })
}

export function useUpdateTemplate(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTemplatePayload> }) =>
      nexusApi.updateTemplate(projectId, id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(projectId, id) })
      queryClient.invalidateQueries({ queryKey: templateKeys.list(projectId) })
    },
  })
}

export function useDeleteTemplate(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => nexusApi.deleteTemplate(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list(projectId) })
    },
  })
}
