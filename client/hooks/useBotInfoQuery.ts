import { useQuery } from '@tanstack/react-query'

export function useBotInfoQuery() {
  return useQuery({
    queryKey: ['bot-info'],
    queryFn: async () => {
      const res = await fetch('/api/bot-info')
      if (!res.ok) throw new Error('Failed to load')
      return res.json() as Promise<{ address?: string | null, balances?: any }>
    },
    refetchInterval: 30000,
  })
}


