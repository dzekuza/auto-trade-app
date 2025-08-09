import React from 'react'
import { useAccount, useBalance } from 'wagmi'
import type { Address } from 'viem'
import { mainnet, base, arbitrum, bsc, polygon } from 'wagmi/chains'
import { useEthPriceUSD } from '../hooks/useEthPrice'

const PortfolioPanel: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { usd: ethUsd } = useEthPriceUSD()

  if (!isConnected) return null

  const TOKENS: Record<number, { usdc?: Address; usdt?: Address; name: string; explorer: string }> = {
    [mainnet.id]: {
      usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      name: 'Ethereum Mainnet',
      explorer: 'https://etherscan.io/address/'
    },
    [base.id]: {
      usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      name: 'Base',
      explorer: 'https://basescan.org/address/'
    },
    [arbitrum.id]: {
      usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      usdt: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      name: 'Arbitrum One',
      explorer: 'https://arbiscan.io/address/'
    },
    [bsc.id]: {
      usdc: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      usdt: '0x55d398326f99059ff775485246999027b3197955',
      name: 'BNB Smart Chain',
      explorer: 'https://bscscan.com/address/'
    },
    [polygon.id]: {
      usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      usdt: '0xc2132D05D31c914a87C6611C10748aEB04B58e8F',
      name: 'Polygon',
      explorer: 'https://polygonscan.com/address/'
    },
  }

  // Static hooks per chain/token (hooks cannot be called in loops)
  const mainnetEth = useBalance({ address, chainId: mainnet.id, watch: true, enabled: Boolean(address) })
  const mainnetUsdc = useBalance({ address, token: TOKENS[mainnet.id].usdc, chainId: mainnet.id, watch: true, enabled: Boolean(address) && Boolean(TOKENS[mainnet.id].usdc) })
  const mainnetUsdt = useBalance({ address, token: TOKENS[mainnet.id].usdt, chainId: mainnet.id, watch: true, enabled: Boolean(address) && Boolean(TOKENS[mainnet.id].usdt) })
  const baseEth = useBalance({ address, chainId: base.id, watch: true, enabled: Boolean(address) })
  const baseUsdc = useBalance({ address, token: TOKENS[base.id].usdc, chainId: base.id, watch: true, enabled: Boolean(address) && Boolean(TOKENS[base.id].usdc) })
  const arbEth = useBalance({ address, chainId: arbitrum.id, watch: true, enabled: Boolean(address) })
  const arbUsdc = useBalance({ address, token: TOKENS[arbitrum.id].usdc, chainId: arbitrum.id, watch: true, enabled: Boolean(address) && Boolean(TOKENS[arbitrum.id].usdc) })
  const arbUsdt = useBalance({ address, token: TOKENS[arbitrum.id].usdt, chainId: arbitrum.id, watch: true, enabled: Boolean(address) && Boolean(TOKENS[arbitrum.id].usdt) })
  const bscEth = useBalance({ address, chainId: bsc.id, watch: true, enabled: Boolean(address) })
  const bscUsdc = useBalance({ address, token: TOKENS[bsc.id].usdc, chainId: bsc.id, watch: true, enabled: Boolean(address) && Boolean(TOKENS[bsc.id].usdc) })
  const bscUsdt = useBalance({ address, token: TOKENS[bsc.id].usdt, chainId: bsc.id, watch: true, enabled: Boolean(address) && Boolean(TOKENS[bsc.id].usdt) })
  const polyEth = useBalance({ address, chainId: polygon.id, watch: true, enabled: Boolean(address) })
  const polyUsdc = useBalance({ address, token: TOKENS[polygon.id].usdc, chainId: polygon.id, watch: true, enabled: Boolean(address) && Boolean(TOKENS[polygon.id].usdc) })
  const polyUsdt = useBalance({ address, token: TOKENS[polygon.id].usdt, chainId: polygon.id, watch: true, enabled: Boolean(address) && Boolean(TOKENS[polygon.id].usdt) })

  const ethToUsd = (wei?: bigint | null) => {
    if (!wei || ethUsd == null) return null
    const eth = Number(wei) / 1e18
    return eth * ethUsd
  }

  const mUsd = (mainnetUsdc.data ? Number(mainnetUsdc.data.formatted) : 0) * 1
  const tUsd = (mainnetUsdt.data ? Number(mainnetUsdt.data.formatted) : 0) * 1
  const bUsd = (baseUsdc.data ? Number(baseUsdc.data.formatted) : 0) * 1
  const meUsd = ethToUsd(mainnetEth.data?.value) || 0
  const beUsd = ethToUsd(baseEth.data?.value) || 0

  const mainnetTotal = meUsd + mUsd + tUsd
  const baseTotal = beUsd + bUsd
  const arbTotal = (ethToUsd(arbEth.data?.value) || 0) + (arbUsdc.data ? Number(arbUsdc.data.formatted) : 0) + (arbUsdt.data ? Number(arbUsdt.data.formatted) : 0)
  const bscTotal = (ethToUsd(bscEth.data?.value) || 0) + (bscUsdc.data ? Number(bscUsdc.data.formatted) : 0) + (bscUsdt.data ? Number(bscUsdt.data.formatted) : 0)
  const polyTotal = (ethToUsd(polyEth.data?.value) || 0) + (polyUsdc.data ? Number(polyUsdc.data.formatted) : 0) + (polyUsdt.data ? Number(polyUsdt.data.formatted) : 0)
  const grandTotal = mainnetTotal + baseTotal + arbTotal + bscTotal + polyTotal

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold">Portfolio (Multi-chain)</h3>
      </div>
      <div className="card-body">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">Chain</th>
                <th className="py-2">Native</th>
                <th className="py-2">USDC</th>
                <th className="py-2">USDT</th>
                <th className="py-2">Subtotal (USD)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="py-2">Ethereum Mainnet</td>
                <td className="py-2">{mainnetEth.data ? `${mainnetEth.data.formatted} ETH` : '—'}</td>
                <td className="py-2">{mainnetUsdc.data ? `${mainnetUsdc.data.formatted} USDC` : '—'}</td>
                <td className="py-2">{mainnetUsdt.data ? `${mainnetUsdt.data.formatted} USDT` : '—'}</td>
                <td className="py-2">{`$${mainnetTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</td>
              </tr>
              <tr className="border-t">
                <td className="py-2">Base</td>
                <td className="py-2">{baseEth.data ? `${baseEth.data.formatted} ETH` : '—'}</td>
                <td className="py-2">{baseUsdc.data ? `${baseUsdc.data.formatted} USDC` : '—'}</td>
                <td className="py-2">—</td>
                <td className="py-2">{`$${baseTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</td>
              </tr>
              <tr className="border-t">
                <td className="py-2">Arbitrum One</td>
                <td className="py-2">{arbEth.data ? `${arbEth.data.formatted} ETH` : '—'}</td>
                <td className="py-2">{arbUsdc.data ? `${arbUsdc.data.formatted} USDC` : '—'}</td>
                <td className="py-2">{arbUsdt.data ? `${arbUsdt.data.formatted} USDT` : '—'}</td>
                <td className="py-2">{`$${arbTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</td>
              </tr>
              <tr className="border-t">
                <td className="py-2">BNB Smart Chain</td>
                <td className="py-2">{bscEth.data ? `${bscEth.data.formatted} BNB` : '—'}</td>
                <td className="py-2">{bscUsdc.data ? `${bscUsdc.data.formatted} USDC` : '—'}</td>
                <td className="py-2">{bscUsdt.data ? `${bscUsdt.data.formatted} USDT` : '—'}</td>
                <td className="py-2">{`$${bscTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</td>
              </tr>
              <tr className="border-t">
                <td className="py-2">Polygon</td>
                <td className="py-2">{polyEth.data ? `${polyEth.data.formatted} MATIC` : '—'}</td>
                <td className="py-2">{polyUsdc.data ? `${polyUsdc.data.formatted} USDC` : '—'}</td>
                <td className="py-2">{polyUsdt.data ? `${polyUsdt.data.formatted} USDT` : '—'}</td>
                <td className="py-2">{`$${polyTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t font-medium">
                <td className="py-2" colSpan={4}>Total</td>
                <td className="py-2">{`$${grandTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {address && (
          <p className="text-xs text-gray-500 mt-2">
            Address: <a className="text-indigo-600 hover:underline" href={`https://etherscan.io/address/${address}`} target="_blank" rel="noreferrer">Etherscan</a> · <a className="text-indigo-600 hover:underline" href={`https://basescan.org/address/${address}`} target="_blank" rel="noreferrer">Basescan</a>
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">Note: Only native ETH and USDC/USDT are aggregated. Share additional token addresses to include them.</p>
      </div>
    </div>
  )
}

export default PortfolioPanel


