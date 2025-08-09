import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from './ui/button'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { useTradeStore } from '../store/use-trade-store'

const AutoTradeModal = dynamic(() => import('./AutoTradeModal'), { ssr: false })

interface TokenOpportunity {
  address: string
  name: string
  symbol: string
  score: number
}

/**
 * TradeControls provides buttons to scan for token opportunities and toggle auto trading.
 * It displays a simple list of scored tokens returned from the backend.
 */
const TradeControls: React.FC = () => {
  const [autoTrading, setAutoTrading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const queryClient = useQueryClient()
  const [tokens, setTokens] = useState<TokenOpportunity[]>([])
  const [autoError, setAutoError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const chain = useTradeStore(s => s.selectedChain)

  // Fetch token opportunities from the API route
  async function handleScan() {
    setScanning(true)
    try {
      await queryClient.invalidateQueries({ queryKey: ['scan'] })
      toast.info('Scan requested')
    } catch (err) {
      console.error(err)
    } finally {
      setScanning(false)
    }
  }

  async function toggleAutoTrading(opts?: { maxSpendEth?: string; maxSpendStable?: string; stableToken?: 'USDC' | null }) {
    const newStatus = !autoTrading
    setAutoTrading(newStatus)
    setAutoError(null)
    try {
      const res = await fetch('/api/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: newStatus, chain, ...opts })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setAutoError(data?.error || 'Failed to update auto trading')
        setAutoTrading(!newStatus)
      }
    } catch (err) {
      console.error(err)
      setAutoError('Network error updating auto trading')
      setAutoTrading(!newStatus)
    }
  }

  return (
    <>
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button onClick={handleScan} disabled={scanning} size="sm">
          {scanning ? 'Scanning…' : 'Scan Tokens'}
        </Button>
        {autoTrading ? (
          <Button variant="secondary" size="sm" onClick={() => toggleAutoTrading()}>
            Stop Auto Trading
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
            Start Auto Trading
          </Button>
        )}
      </div>
      {autoError && (
        <p className="text-sm text-red-600">{autoError}</p>
      )}
      {autoError && (
        <p className="text-sm text-red-600">{autoError}</p>
      )}
      {tokens.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Latest scan</h3>
          <ul className="space-y-1">
            {tokens.map((token) => (
              <li key={token.address} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                <span className="font-medium">{token.name} <span className="text-gray-500">({token.symbol})</span></span>
                <span className="text-sm">Score: {token.score.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
    <AutoTradeModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      onConfirm={(opts) => toggleAutoTrading(opts)}
    />
    </>
  )
}

export default TradeControls