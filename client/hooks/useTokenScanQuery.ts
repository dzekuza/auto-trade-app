import { useQuery } from '@tanstack/react-query'

export function useTokenScanQuery(chainKey: string) {
  return useQuery({
    queryKey: ['scan', chainKey],
    queryFn: async () => {
      const res = await fetch('/api/scan?chain=' + encodeURIComponent(chainKey))
      if (!res.ok) throw new Error('Failed to load tokens')
      return res.json() as Promise<{ tokens: any[] }>
    },
    refetchInterval: 15000,
  })
}


