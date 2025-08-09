import React from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { Button } from './ui/button'

/**
 * AccountInfo displays the connected account's address and allows disconnection.
 */
const AccountInfo: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (!isConnected) return null

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold">Account</h3>
      </div>
      <div className="card-body">
        <div className="flex items-center justify-between">
          <p className="font-mono text-sm truncate">{address}</p>
          <Button variant="secondary" size="sm" onClick={() => disconnect()}>Disconnect</Button>
        </div>
      </div>
    </div>
  )
}

export default AccountInfo