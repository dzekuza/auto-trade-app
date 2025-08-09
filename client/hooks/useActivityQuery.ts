import { useQuery } from '@tanstack/react-query'

export function useActivityQuery() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: async () => {
      const res = await fetch('/api/activity')
      if (!res.ok) throw new Error('Failed to load activity')
      return res.json() as Promise<{ activity: Array<{ time: string; action: string; details: any }> }>
    },
    refetchInterval: 15000,
  })
}


