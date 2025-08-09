import React, { useState } from 'react'

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
  const [tokens, setTokens] = useState<TokenOpportunity[]>([])
  const [autoError, setAutoError] = useState<string | null>(null)

  // Fetch token opportunities from the API route
  async function handleScan() {
    setScanning(true)
    try {
      const res = await fetch('/api/scan')
      if (!res.ok) throw new Error(`Error fetching opportunities: ${res.statusText}`)
      const data = await res.json()
      setTokens(data?.tokens ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setScanning(false)
    }
  }

  async function toggleAutoTrading() {
    const newStatus = !autoTrading
    setAutoTrading(newStatus)
    setAutoError(null)
    try {
      const res = await fetch('/api/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: newStatus })
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
    <div className="space-y-3">
      <div className="flex gap-2">
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1 text-sm" onClick={handleScan} disabled={scanning}>
          {scanning ? 'Scanning…' : 'Scan Tokens'}
        </button>
        <button className="bg-gray-900 hover:bg-black text-white rounded-md px-3 py-1 text-sm" onClick={toggleAutoTrading}>
          {autoTrading ? 'Stop Auto Trading' : 'Start Auto Trading'}
        </button>
      </div>
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
  )
}

export default TradeControls