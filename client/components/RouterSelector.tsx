import React from 'react'
import { useTradeStore } from '../store/use-trade-store'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'sonner'

const defaults: Record<string, Array<{ label: string, address: string }>> = {
  mainnet: [
    { label: 'Uniswap V2', address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' },
    { label: 'Uniswap V3 Router 02', address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45' },
  ],
  base: [
    { label: 'Uniswap V3 Router 02', address: '0x2626664c2603336E57B271c5C0b26F421741e481' },
  ],
  arbitrum: [
    { label: 'Uniswap V3 Router 02', address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45' },
  ],
  bsc: [
    { label: 'Pancake V2', address: '0x10ED43C718714eb63d5aA57B78B54704E256024E' },
  ],
  polygon: [
    { label: 'QuickSwap V2', address: '0xa5E0829CaCED8fFDD4De3c43696c57F7D7A678ff' },
    { label: 'Uniswap V3 Router 02', address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45' },
  ],
}

const RouterSelector: React.FC = () => {
  const chain = useTradeStore(s => s.selectedChain)
  const [custom, setCustom] = React.useState('')
  const list = defaults[chain] || []

  async function setRouter(address: string) {
    try {
      const res = await fetch('/api/router', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chain, address })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to set router')
      toast.success('Router updated')
    } catch (e: any) {
      toast.error(e?.message || 'Router error')
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold">DEX Router</h3>
      </div>
      <div className="card-body space-y-2">
        <div className="flex flex-wrap gap-2">
          {list.map((r) => (
            <Button key={r.address} size="sm" variant="outline" onClick={() => setRouter(r.address)}>{r.label}</Button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <Input placeholder="Custom router address" value={custom} onChange={(e) => setCustom(e.target.value)} />
          <Button size="sm" onClick={() => setRouter(custom)}>Set</Button>
        </div>
        <p className="text-xs text-gray-500">Router is used for swaps on the selected chain.</p>
      </div>
    </div>
  )
}

export default RouterSelector


