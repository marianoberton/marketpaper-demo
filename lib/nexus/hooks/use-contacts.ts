import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nexusApi } from '../api'
import type { CreateContactPayload } from '../types'

const contactKeys = {
  all: ['nexus', 'contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (projectId: string) => [...contactKeys.lists(), projectId] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (projectId: string, id: string) => [...contactKeys.details(), projectId, id] as const,
}

export function useContacts(projectId: string, enabled = true) {
  return useQuery({
    queryKey: contactKeys.list(projectId),
    queryFn: async () => {
      const result = await nexusApi.listContacts(projectId)
      return result.data
    },
    enabled: !!projectId && enabled,
  })
}

export function useContact(projectId: string, contactId: string, enabled = true) {
  return useQuery({
    queryKey: contactKeys.detail(projectId, contactId),
    queryFn: () => nexusApi.getContact(projectId, contactId),
    enabled: !!projectId && !!contactId && enabled,
  })
}

export function useCreateContact(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateContactPayload) => nexusApi.createContact(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.list(projectId) })
    },
  })
}

export function useUpdateContact(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateContactPayload> }) =>
      nexusApi.updateContact(projectId, id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(projectId, id) })
      queryClient.invalidateQueries({ queryKey: contactKeys.list(projectId) })
    },
  })
}

export function useDeleteContact(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => nexusApi.deleteContact(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.list(projectId) })
    },
  })
}
