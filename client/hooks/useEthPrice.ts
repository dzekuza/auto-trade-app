import { useEffect, useState } from 'react'

type PriceState = {
  usd: number | null
  isLoading: boolean
  isError: boolean
}

// Fetches ETH/USD price. Works for mainnet and base since both use ETH as native.
export function useEthPriceUSD(): PriceState {
  const [usd, setUsd] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isError, setIsError] = useState<boolean>(false)

  useEffect(() => {
    let active = true
    async function load() {
      setIsLoading(true)
      setIsError(false)
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
        const data = await res.json()
        if (!active) return
        const value = Number(data?.ethereum?.usd)
        if (Number.isFinite(value)) setUsd(value)
      } catch (e) {
        if (active) setIsError(true)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    load()
    const t = setInterval(load, 60_000)
    return () => {
      active = false
      clearInterval(t)
    }
  }, [])

  return { usd, isLoading, isError }
}


