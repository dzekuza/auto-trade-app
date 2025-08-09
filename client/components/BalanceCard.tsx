import React from 'react'
import { useAccount, useBalance } from 'wagmi'

const BalanceCard: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { data, isLoading, isError } = useBalance({ address, watch: true, enabled: Boolean(address) })

  if (!isConnected) return null

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold">Wallet Balance</h3>
      </div>
      <div className="card-body">
        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {isError && <p className="text-sm text-red-600">Failed to fetch balance</p>}
        {data && (
          <p className="text-2xl font-semibold">
            {data.formatted} {data.symbol}
          </p>
        )}
      </div>
    </div>
  )
}

export default BalanceCard



