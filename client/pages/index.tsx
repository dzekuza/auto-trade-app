import React from 'react'
import dynamic from 'next/dynamic'

// Disable SSR for interactive wallet components to avoid hydration mismatches
const WalletOptions = dynamic(() => import('../components/WalletOptions'), { ssr: false })
const AccountInfo = dynamic(() => import('../components/AccountInfo'), { ssr: false })
const TradeControls = dynamic(() => import('../components/TradeControls'), { ssr: false })
const BalanceCard = dynamic(() => import('../components/BalanceCard'), { ssr: false })
const TokensPanel = dynamic(() => import('../components/TokensPanel'), { ssr: false })
const ChartCard = dynamic(() => import('../components/ChartCard'), { ssr: false })
const ChainSelector = dynamic(() => import('../components/ChainSelector'), { ssr: false })

/**
 * Home page for the auto-trade app.
 * Displays wallet connection options, account info, and controls for scanning tokens and auto trading.
 */
export default function Home() {
  return (
    <main className="container-page space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meme Token Auto Trader</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <ChartCard />
          <TokensPanel />
        </div>
        <div className="space-y-4">
          <WalletOptions />
          <AccountInfo />
          <BalanceCard />
          <ChainSelector />
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">Controls</h3>
            </div>
            <div className="card-body">
              <TradeControls />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}