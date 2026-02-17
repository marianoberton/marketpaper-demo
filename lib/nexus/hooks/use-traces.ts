import { useQuery } from '@tanstack/react-query'
import { nexusApi } from '../api'

const traceKeys = {
  all: ['nexus', 'traces'] as const,
  lists: () => [...traceKeys.all, 'list'] as const,
  list: (projectId: string) => [...traceKeys.lists(), projectId] as const,
}

export function useTraces(projectId: string, enabled = true) {
  return useQuery({
    queryKey: traceKeys.list(projectId),
    queryFn: async () => {
      const result = await nexusApi.listTraces(projectId)
      return result.items || result.data || []
    },
    enabled: !!projectId && enabled,
  })
}
