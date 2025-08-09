import React from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useTradeStore } from '../store/use-trade-store'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (opts: { maxSpendEth?: string; maxSpendStable?: string; stableToken?: 'USDC' | null; chain: string }) => void
}

const AutoTradeModal: React.FC<Props> = ({ open, onClose, onConfirm }) => {
  const chain = useTradeStore(s => s.selectedChain)
  const [mode, setMode] = React.useState<'ETH' | 'USDC'>('ETH')
  const [eth, setEth] = React.useState('0.01')
  const [usdc, setUsdc] = React.useState('10')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-lg">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold">Auto Trade Settings</h3>
          <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-sm">
            <p className="text-gray-600 mb-1">Spend from</p>
            <div className="flex gap-2">
              <Button size="sm" variant={mode === 'ETH' ? 'default' : 'outline'} onClick={() => setMode('ETH')}>Native (ETH/BNB/MATIC)</Button>
              <Button size="sm" variant={mode === 'USDC' ? 'default' : 'outline'} onClick={() => setMode('USDC')}>USDC</Button>
            </div>
          </div>
          {mode === 'ETH' ? (
            <div className="text-sm">
              <p className="text-gray-600 mb-1">Max native to spend per trade</p>
              <Input value={eth} onChange={(e) => setEth(e.target.value)} />
            </div>
          ) : (
            <div className="text-sm">
              <p className="text-gray-600 mb-1">Max USDC to spend per trade</p>
              <Input value={usdc} onChange={(e) => setUsdc(e.target.value)} />
            </div>
          )}
          <p className="text-xs text-gray-500">Chain: {chain}</p>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            onConfirm({
              maxSpendEth: mode === 'ETH' ? eth : undefined,
              maxSpendStable: mode === 'USDC' ? usdc : undefined,
              stableToken: mode === 'USDC' ? 'USDC' : null,
              chain,
            })
            onClose()
          }}>Start</Button>
        </div>
      </div>
    </div>
  )
}

export default AutoTradeModal


