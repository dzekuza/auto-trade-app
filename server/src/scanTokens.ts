/**
 * Types for token opportunities returned by scanTokens.
 */
export interface TokenOpportunity {
  address: string
  name: string
  symbol: string
  score: number
  priceUsd?: number
  liquidityUsd?: number
  volumeH24?: number
  changeH1?: number
  changeH24?: number
  chainId?: string
  pairAddress?: string
  sparkline?: number[]
}

/**
 * scanTokens fetches and evaluates new or trending tokens.
 *
 * In this stub implementation, it returns a set of mock token opportunities.
 * In a real implementation, you would fetch data from a DEX screener API,
 * perform your DecodeFi prompt analysis, and compute scores based on
 * momentum, liquidity, and risk factors.
 */
export async function scanTokens(): Promise<TokenOpportunity[]> {
  // Pull trending meme-like pairs from DexScreener search as a pragmatic starting point
  // Docs: https://docs.dexscreener.com/
  const axios = await import('axios').then(m => m.default)

  const queries = ['pepe', 'doge', 'shib', 'meme', 'cat', 'baby', 'moon']
  const baseUrl = 'https://api.dexscreener.com/latest/dex/search?q='

  try {
    const results = await Promise.all(
      queries.map(async (q) => {
        try {
          const { data } = await axios.get(`${baseUrl}${encodeURIComponent(q)}`, { timeout: 10_000 })
          return Array.isArray(data?.pairs) ? data.pairs : []
        } catch {
          return []
        }
      })
    )

    // Flatten and dedupe by base token address
    const pairs: any[] = results.flat()
    const byBaseAddress = new Map<string, any>()
    for (const p of pairs) {
      const baseAddr: string | undefined = p?.baseToken?.address
      if (!baseAddr) continue
      // Keep the pair with the highest 24h volume for each base token
      const current = byBaseAddress.get(baseAddr)
      const vol = Number(p?.volume?.h24 ?? 0)
      const currVol = Number(current?.volume?.h24 ?? 0)
      if (!current || vol > currVol) {
        byBaseAddress.set(baseAddr, p)
      }
    }

    const opportunities: TokenOpportunity[] = Array.from(byBaseAddress.values()).map((p) => {
      const vol24 = Number(p?.volume?.h24 ?? 0)
      const liqUsd = Number(p?.liquidity?.usd ?? 0)
      const ch1 = Number(p?.priceChange?.h1 ?? 0)
      const ch24 = Number(p?.priceChange?.h24 ?? 0)
      const priceUsd = Number(p?.priceUsd ?? 0)
      // Simple heuristic score blending liquidity, volume, and short-term momentum
      const score = (
        Math.log10(vol24 + 1) * 2 +
        Math.log10(liqUsd + 1) * 1.5 +
        Math.max(ch1, 0) * 0.5 +
        Math.max(ch24, 0) * 0.1
      )

      let spark: number[] | undefined
      if (Array.isArray(p?.sparkline)) {
        spark = p.sparkline.map((v: any) => Number(v)).filter((n: number) => Number.isFinite(n))
      }

      return {
        address: String(p?.baseToken?.address || ''),
        name: String(p?.baseToken?.name || 'Unknown'),
        symbol: String(p?.baseToken?.symbol || ''),
        score,
        priceUsd: priceUsd || undefined,
        liquidityUsd: liqUsd || undefined,
        volumeH24: vol24 || undefined,
        changeH1: ch1 || undefined,
        changeH24: ch24 || undefined,
        chainId: p?.chainId ? String(p.chainId) : undefined,
        pairAddress: p?.pairAddress ? String(p.pairAddress) : undefined,
        sparkline: spark,
      }
    })
      .filter(t => t.address)
      .sort((a, b) => (b.score - a.score))
      .slice(0, 100)

    if (opportunities.length > 0) return opportunities
  } catch (err) {
    // fall through to stub when the external API fails
    console.error('scanTokens external fetch failed', err)
  }

  // Fallback stub
  return [
    { address: '0xToken1', name: 'MemeCoin One', symbol: 'MEME1', score: 2.5 },
    { address: '0xToken2', name: 'MemeCoin Two', symbol: 'MEME2', score: 3.2 },
    { address: '0xToken3', name: 'MemeCoin Three', symbol: 'MEME3', score: 1.8 },
  ]
}