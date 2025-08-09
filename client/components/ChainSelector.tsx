import React from 'react'
import { useTradeStore, type SupportedChain } from '../store/use-trade-store'

const ChainSelector: React.FC = () => {
  const selectedChain = useTradeStore(s => s.selectedChain)
  const setSelectedChain = useTradeStore(s => s.setSelectedChain)

  const options: { label: string, value: SupportedChain }[] = [
    { label: 'Ethereum Mainnet', value: 'mainnet' },
    { label: 'Base', value: 'base' },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold">Chain</h3>
      </div>
      <div className="card-body">
        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedChain}
          onChange={(e) => setSelectedChain(e.target.value as SupportedChain)}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default ChainSelector



