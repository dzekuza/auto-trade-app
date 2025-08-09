import React from 'react'
import { useBotInfoQuery } from '../hooks/useBotInfoQuery'
import { Button } from './ui/button'

const BotWalletCard: React.FC = () => {
  const { data, isLoading, isError } = useBotInfoQuery()
  const address = data?.address || ''
  function gasBadge(asset: any) {
    const sym = (asset?.tokenSymbol || '').toUpperCase()
    const bal = Number(asset?.balance || 0)
    const chain = (asset?.blockchain || '').toLowerCase()
    const thresholds: Record<string, number> = { eth: 0.01, base: 0.01, arbitrum: 0.01, bsc: 0.05, polygon: 1 }
    const key = chain === 'eth' ? 'eth' : chain
    const low = bal > 0 && thresholds[key] != null && bal < thresholds[key]
    if (!low) return null
    return <span className="ml-2 text-[10px] rounded bg-amber-100 text-amber-800 px-1.5 py-0.5">Low gas</span>
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold">Bot Wallet</h3>
      </div>
      <div className="card-body space-y-2">
        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {isError && <p className="text-sm text-red-600">Failed to fetch bot info</p>}
        {address && (
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs truncate">{address}</p>
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(address)}>Copy</Button>
          </div>
        )}
        {data?.balances && (
          <div className="text-xs text-gray-700 space-y-1">
            {(data.balances?.assets || []).slice(0, 10).map((a: any, i: number) => (
              <div key={i} className="flex justify-between">
                <span>{a.blockchain?.toUpperCase()} {a.tokenSymbol}{gasBadge(a)}</span>
                <span>{a.balance} {a.tokenSymbol} {a.tokenPrice && `($${(a.balanceUsd || (a.balance * a.tokenPrice)).toFixed?.(2) || ''})`}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500">Fund this wallet with gas and tokens on chains you auto-trade.</p>
      </div>
    </div>
  )
}

export default BotWalletCard


