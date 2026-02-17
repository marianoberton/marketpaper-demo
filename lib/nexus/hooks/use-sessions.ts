import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nexusApi } from '../api'

const sessionKeys = {
  all: ['nexus', 'sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: (projectId: string) => [...sessionKeys.lists(), projectId] as const,
  details: () => [...sessionKeys.all, 'detail'] as const,
  detail: (sessionId: string) => [...sessionKeys.details(), sessionId] as const,
  traces: (sessionId: string) => [...sessionKeys.detail(sessionId), 'traces'] as const,
}

export function useSessions(projectId: string, filters?: Record<string, string>, enabled = true) {
  return useQuery({
    queryKey: [...sessionKeys.list(projectId), filters],
    queryFn: async () => {
      const result = await nexusApi.listSessions(projectId, filters)
      return result.items || result.data || []
    },
    enabled: !!projectId && enabled,
  })
}

export function useSession(projectId: string, sessionId: string, enabled = true) {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: () => nexusApi.getSession(projectId, sessionId),
    enabled: !!projectId && !!sessionId && enabled,
  })
}

export function useSessionTraces(projectId: string, sessionId: string, limit?: number, enabled = true) {
  return useQuery({
    queryKey: sessionKeys.traces(sessionId),
    queryFn: async () => {
      const result = await nexusApi.getSessionTraces(projectId, sessionId, limit)
      return result.items || result.data || []
    },
    enabled: !!projectId && !!sessionId && enabled,
  })
}

export function useTerminateSession(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => nexusApi.terminateSession(projectId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.list(projectId) })
    },
  })
}
