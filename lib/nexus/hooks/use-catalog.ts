import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nexusApi } from '../api'

const catalogKeys = {
  all: ['nexus', 'catalog'] as const,
  lists: () => [...catalogKeys.all, 'list'] as const,
  list: (projectId: string) => [...catalogKeys.lists(), projectId] as const,
  search: (projectId: string) => [...catalogKeys.all, 'search', projectId] as const,
}

export function useCatalog(projectId: string, filters?: Record<string, string>, enabled = true) {
  return useQuery({
    queryKey: [...catalogKeys.list(projectId), filters],
    queryFn: async () => {
      const result = await nexusApi.listCatalogItems(projectId, filters)
      return result.items || result.data || []
    },
    enabled: !!projectId && enabled,
  })
}

export function useSearchCatalog(projectId: string) {
  return useMutation({
    mutationFn: (query: string) => nexusApi.searchCatalog(projectId, query),
  })
}

export function useDeleteCatalogItem(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => nexusApi.deleteCatalogItem(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.list(projectId) })
    },
  })
}
