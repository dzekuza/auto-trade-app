import React from 'react'
import { useConnect } from 'wagmi'
import { Button } from './ui/button'

/**
 * WalletOptions renders a list of available wallet connectors.
 * Users can click a button to connect their preferred wallet.
 */
const WalletOptions: React.FC = () => {
  const { connectors, connect, isLoading, pendingConnector } = useConnect()

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold">Connect Wallet</h3>
      </div>
      <div className="card-body">
        <div className="flex flex-wrap gap-2">
          {connectors.map((connector) => (
            <Button
              key={connector.id}
              onClick={() => connect({ connector })}
              disabled={isLoading && pendingConnector?.id === connector.id}
              size="sm"
            >
              {isLoading && pendingConnector?.id === connector.id
                ? 'Connecting...'
                : connector.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WalletOptions