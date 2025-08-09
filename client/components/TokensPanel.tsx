import React, { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTradeStore } from '../store/use-trade-store'
import { toast } from 'sonner'
import { z } from 'zod'

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

const TokensPanel: React.FC = () => {
  const [tokens, setTokens] = useState<TokenOpportunity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [amountByAddress, setAmountByAddress] = useState<Record<string, string>>({})
  const [statusByAddress, setStatusByAddress] = useState<Record<string, string>>({})

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tokens
    return tokens.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.symbol.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q)
    )
  }, [tokens, query])

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
          <input
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search name/symbol/address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
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
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1"
          >
            Refresh
          </button>
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
                {filtered.map(t => (
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
                        <button
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-2 py-1 text-xs"
                          onClick={() => handleTrade(t.address)}
                        >
                          Trade
                        </button>
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
          </div>
        )}
      </div>
    </div>
  )
}

export default TokensPanel


