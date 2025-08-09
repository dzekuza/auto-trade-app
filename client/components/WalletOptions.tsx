import React from 'react'
import { useConnect } from 'wagmi'

/**
 * WalletOptions renders a list of available wallet connectors.
 * Users can click a button to connect their preferred wallet.
 */
const WalletOptions: React.FC = () => {
  const { connectors, connect, isPending, pendingConnector } = useConnect()

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold">Connect Wallet</h3>
      </div>
      <div className="card-body">
        <div className="flex flex-wrap gap-2">
          {connectors.map((connector) => (
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1 text-sm"
              key={connector.id ?? connector.uid}
              onClick={() => connect({ connector })}
              disabled={isPending && pendingConnector?.uid === connector.uid}
            >
              {isPending && pendingConnector?.uid === connector.uid
                ? 'Connecting...'
                : connector.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WalletOptions