import React, { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTradeStore } from '../store/use-trade-store'
import { toast } from 'sonner'
import { z } from 'zod'
import { Input } from './ui/input'
import { Button } from './ui/button'

type TokenOpportunity = {
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

const formatScore = (v: number) => v.toFixed(2)

const Sparkline = dynamic(() => import('./Sparkline'), { ssr: false })
const AiAnalysisModal = dynamic(() => import('./AiAnalysisModal'), { ssr: false })
const BatchReviewDrawer = dynamic(() => import('./BatchReviewDrawer'), { ssr: false })

const TokensPanel: React.FC = () => {
  const [tokens, setTokens] = useState<TokenOpportunity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [amountByAddress, setAmountByAddress] = useState<Record<string, string>>({})
  const [statusByAddress, setStatusByAddress] = useState<Record<string, string>>({})
  const [aiOpen, setAiOpen] = useState(false)
  const [aiToken, setAiToken] = useState<TokenOpportunity | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchN, setBatchN] = useState(10)

  const selectedChain = useTradeStore(s => s.selectedChain)

  useEffect(() => {
    let mounted = true
    async function load() {
      setIsLoading(true)
      try {
        const res = await fetch('/api/scan')
        const data = await res.json()
        if (mounted) setTokens(data?.tokens ?? [])
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [selectedChain])

  const [sortKey, setSortKey] = useState<'score' | 'price' | 'liq' | 'vol' | 'change1h' | 'change24h'>('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const pageSize = 25

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tokens
    return tokens.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.symbol.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q)
    )
  }, [tokens, query])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    const pick = (t: TokenOpportunity) => {
      switch (sortKey) {
        case 'price': return t.priceUsd ?? 0
        case 'liq': return t.liquidityUsd ?? 0
        case 'vol': return t.volumeH24 ?? 0
        case 'change1h': return t.changeH1 ?? 0
        case 'change24h': return t.changeH24 ?? 0
        case 'score':
        default: return t.score
      }
    }
    arr.sort((a, b) => {
      const av = pick(a)
      const bv = pick(b)
      return sortDir === 'asc' ? Number(av - bv) : Number(bv - av)
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize)

  const tradeSchema = z.object({ amountInEth: z.string().regex(/^\d*(?:\.\d+)?$/, 'Invalid amount').refine(v => Number(v) > 0, 'Amount must be > 0') })

  async function handleTrade(address: string) {
    const amount = amountByAddress[address] || '0.01'
    const parsed = tradeSchema.safeParse({ amountInEth: amount })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Invalid input')
      return
    }
    setStatusByAddress((s) => ({ ...s, [address]: 'Submitting…' }))
    try {
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress: address, amountInEth: amount, chain: selectedChain })
      })
      const data = await res.json()
      if (res.ok) {
        setStatusByAddress((s) => ({ ...s, [address]: `Submitted: ${data?.receipt?.transactionHash || 'ok'}` }))
        toast.success('Trade submitted')
      } else {
        setStatusByAddress((s) => ({ ...s, [address]: data?.error || 'Trade failed' }))
        toast.error(data?.error || 'Trade failed')
      }
    } catch (e: any) {
      setStatusByAddress((s) => ({ ...s, [address]: e?.message || 'Trade failed' }))
      toast.error(e?.message || 'Trade failed')
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold">Opportunities</h3>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search name/symbol/address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="border border-gray-300 rounded-md px-2 py-1 text-sm" value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
            <option value="score">Score</option>
            <option value="price">Price</option>
            <option value="liq">Liquidity</option>
            <option value="vol">24h Volume</option>
            <option value="change1h">1h Change</option>
            <option value="change24h">24h Change</option>
          </select>
          <select className="border border-gray-300 rounded-md px-2 py-1 text-sm" value={sortDir} onChange={(e) => setSortDir(e.target.value as any)}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <Button
            onClick={async () => {
              setIsLoading(true)
              try {
                const res = await fetch('/api/scan')
                const data = await res.json()
                setTokens(data?.tokens ?? [])
              } finally {
                setIsLoading(false)
              }
            }}
            size="sm"
          >
            Refresh
          </Button>
          <div className="flex items-center gap-2">
            <Input className="w-20" value={String(batchN)} onChange={(e) => setBatchN(Number(e.target.value) || 1)} />
            <Button size="sm" variant="outline" onClick={() => setBatchOpen(true)}>Review Top {batchN}</Button>
          </div>
        </div>
      </div>
      <div className="card-body">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">Token</th>
                  <th className="py-2">Symbol</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">24h Vol</th>
                  <th className="py-2">Liq</th>
                  <th className="py-2">Score</th>
                  <th className="py-2">Spark</th>
                  <th className="py-2">Address</th>
                  <th className="py-2">Pair</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(t => (
                  <tr key={t.address} className="border-t">
                    <td className="py-2 font-medium">{t.name}</td>
                    <td className="py-2">{t.symbol}</td>
                    <td className="py-2">{t.priceUsd ? `$${Number(t.priceUsd).toFixed(6)}` : '—'}</td>
                    <td className="py-2">{t.volumeH24 ? `$${Math.round(t.volumeH24).toLocaleString()}` : '—'}</td>
                    <td className="py-2">{t.liquidityUsd ? `$${Math.round(t.liquidityUsd).toLocaleString()}` : '—'}</td>
                    <td className="py-2">{formatScore(t.score)}</td>
                    <td className="py-2">{t.sparkline ? <Sparkline values={t.sparkline} /> : '—'}</td>
                    <td className="py-2 font-mono text-xs">{t.address}</td>
                    <td className="py-2">
                      {t.chainId && t.pairAddress ? (
                        <a className="text-indigo-600 hover:underline text-xs" href={`https://dexscreener.com/${t.chainId}/${t.pairAddress}`} target="_blank" rel="noreferrer">View</a>
                      ) : '—'}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <input
                          className="w-20 border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="0.01"
                          value={amountByAddress[t.address] ?? ''}
                          onChange={(e) => setAmountByAddress((s) => ({ ...s, [t.address]: e.target.value }))}
                        />
                        <Button size="sm" onClick={() => handleTrade(t.address)}>Trade</Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setAiToken(t); setAiOpen(true) }}
                        >
                          Ask AI
                        </Button>
                      </div>
                      {statusByAddress[t.address] && (
                        <p className="text-xs text-gray-500 mt-1">{statusByAddress[t.address]}</p>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">No tokens</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-500">Page {page} / {totalPages}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
            <AiAnalysisModal
              open={aiOpen}
              onClose={() => setAiOpen(false)}
              token={aiToken ? {
                name: aiToken.name,
                symbol: aiToken.symbol,
                address: aiToken.address,
                priceUsd: aiToken.priceUsd,
                liquidityUsd: aiToken.liquidityUsd,
                volumeH24: aiToken.volumeH24,
                changeH1: aiToken.changeH1,
                changeH24: aiToken.changeH24,
                score: aiToken.score,
                chainId: aiToken.chainId,
              } : null}
            />
            <BatchReviewDrawer
              open={batchOpen}
              onClose={() => setBatchOpen(false)}
              tokens={sorted.slice(0, Math.max(1, Math.min(sorted.length, batchN)))}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default TokensPanel


