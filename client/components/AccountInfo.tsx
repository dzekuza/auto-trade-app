import React from 'react'
import { useAccount, useDisconnect } from 'wagmi'

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
          <button className="bg-gray-900 hover:bg-black text-white rounded-md px-3 py-1 text-sm" onClick={() => disconnect()}>Disconnect</button>
        </div>
      </div>
    </div>
  )
}

export default AccountInfo