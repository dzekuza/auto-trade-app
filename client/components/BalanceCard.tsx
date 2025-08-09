import React from 'react'
import { useAccount, useBalance, useChainId } from 'wagmi'
import type { Address } from 'viem'
import { mainnet, base, arbitrum, bsc, polygon } from 'wagmi/chains'
import { Button } from './ui/button'
import { useEthPriceUSD } from '../hooks/useEthPrice'

const BalanceCard: React.FC = () => {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  async function switchChain(targetChainId: number) {
    if (typeof window === 'undefined' || !(window as any).ethereum) return
    const ethereum = (window as any).ethereum
    const hex = '0x' + targetChainId.toString(16)
    try {
      await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hex }] })
    } catch (e: any) {
      if (e?.code === 4902) {
        // Add chain then retry
        if (targetChainId === base.id) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: hex,
              chainName: 'Base',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org']
            }]
          })
          await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hex }] })
        }
        if (targetChainId === mainnet.id) {
          await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hex }] })
        }
      }
    }
  }
  const supportedIds = [mainnet.id, base.id, arbitrum.id, bsc.id, polygon.id] as const
  const isSupported = supportedIds.some((id) => id === (chainId as number))
  const { data, isLoading, isError } = useBalance({ address, watch: true, enabled: Boolean(address) && isSupported })
  const { usd: ethUsd, isLoading: priceLoading } = useEthPriceUSD()

  const TOKEN_ADDRESSES: Record<number, { id: number; usdc?: Address; usdt?: Address; explorer: string; name: string }> = {
    [mainnet.id]: {
      id: mainnet.id,
      usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      explorer: 'https://etherscan.io/address/',
      name: 'Ethereum Mainnet',
    },
    [base.id]: {
      id: base.id,
      usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // native USDC on Base
      // usdt not officially native on Base at time of writing
      explorer: 'https://basescan.org/address/',
      name: 'Base',
    },
    [arbitrum.id]: {
      id: arbitrum.id,
      usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC.e on Arbitrum (check current canonical)
      usdt: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      explorer: 'https://arbiscan.io/address/',
      name: 'Arbitrum One',
    },
    [bsc.id]: {
      id: bsc.id,
      usdc: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      usdt: '0x55d398326f99059ff775485246999027b3197955',
      explorer: 'https://bscscan.com/address/',
      name: 'BNB Smart Chain',
    },
    [polygon.id]: {
      id: polygon.id,
      usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      usdt: '0xc2132D05D31c914a87C6611C10748aEB04B58e8F',
      explorer: 'https://polygonscan.com/address/',
      name: 'Polygon',
    },
  }

  const chainMeta = TOKEN_ADDRESSES[chainId || mainnet.id]
  // Per-chain stablecoin balances (mainnet + base), regardless of current connected network
  function StableRow({ chainId, label, token }: { chainId: number; label: 'USDC' | 'USDT'; token?: Address }) {
    const bal = useBalance({ address, token, chainId: chainId as any, enabled: Boolean(address) && Boolean(token), watch: true })
    const meta = TOKEN_ADDRESSES[chainId]
    return (
      <p>
        {label}: {token ? (bal.data ? `${bal.data.formatted} ${label}` : (bal.isLoading ? 'Loading…' : '0')) : 'n/a'}
        {token && address && (
          <>
            {' '}
            <a className="text-indigo-600 hover:underline" href={`${meta.explorer}${address}`} target="_blank" rel="noreferrer">({meta.name})</a>
          </>
        )}
      </p>
    )
  }

  const [quote, setQuote] = React.useState<'USD' | 'USDC' | 'USDT'>('USD')
  const nativeAsUsd = React.useMemo(() => {
    if (!data?.value || ethUsd == null) return null
    const eth = Number(data.value) / 1e18
    return eth * ethUsd
  }, [data?.value, ethUsd])

  if (!isConnected) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">Wallet Balance</h3>
        </div>
        <div className="card-body">
          <p className="text-sm text-gray-600">Connect your wallet to view balance.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold">Wallet Balance</h3>
      </div>
      <div className="card-body space-y-2">
        {!isSupported && (
          <div className="space-y-2">
            <p className="text-sm text-amber-700">Unsupported network. Switch to a supported chain:</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => switchChain(mainnet.id)}>Mainnet</Button>
              <Button size="sm" onClick={() => switchChain(base.id)}>Base</Button>
            </div>
          </div>
        )}
        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {isError && <p className="text-sm text-red-600">Failed to fetch balance. Check your network and RPC.</p>}
        {data && isSupported && (
          <div>
            <p className="text-2xl font-semibold">
              {data.formatted} {data.symbol}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">Show as:</span>
              <Button size="sm" variant={quote === 'USD' ? 'default' : 'outline'} onClick={() => setQuote('USD')}>USD</Button>
              <Button size="sm" variant={quote === 'USDC' ? 'default' : 'outline'} onClick={() => setQuote('USDC')}>USDC</Button>
              <Button size="sm" variant={quote === 'USDT' ? 'default' : 'outline'} onClick={() => setQuote('USDT')}>USDT</Button>
            </div>
            {nativeAsUsd != null && (
              <p className="text-sm text-gray-600 mt-1">
                ≈ {quote === 'USD' ? `$${nativeAsUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `${nativeAsUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${quote}`}
              </p>
            )}
            {ethUsd == null && !priceLoading && (
              <p className="text-xs text-gray-500">USD price unavailable</p>
            )}
            {address && (
              <p className="text-xs text-gray-500 mt-2">
                Network: <span className="font-medium">{chainMeta?.name}</span> · Explorer: <a className="text-indigo-600 hover:underline" href={`${chainMeta?.explorer}${address}`} target="_blank" rel="noreferrer">view address</a>
              </p>
            )}
          </div>
        )}

        <div className="mt-3 space-y-1">
          <p className="text-sm font-medium">Stablecoin balances</p>
          <div className="text-sm text-gray-700 space-y-1">
            <StableRow chainId={mainnet.id} label="USDC" token={TOKEN_ADDRESSES[mainnet.id].usdc} />
            <StableRow chainId={mainnet.id} label="USDT" token={TOKEN_ADDRESSES[mainnet.id].usdt} />
            <StableRow chainId={base.id} label="USDC" token={TOKEN_ADDRESSES[base.id].usdc} />
            <StableRow chainId={base.id} label="USDT" token={TOKEN_ADDRESSES[base.id].usdt} />
            <StableRow chainId={arbitrum.id} label="USDC" token={TOKEN_ADDRESSES[arbitrum.id].usdc} />
            <StableRow chainId={arbitrum.id} label="USDT" token={TOKEN_ADDRESSES[arbitrum.id].usdt} />
            <StableRow chainId={bsc.id} label="USDC" token={TOKEN_ADDRESSES[bsc.id].usdc} />
            <StableRow chainId={bsc.id} label="USDT" token={TOKEN_ADDRESSES[bsc.id].usdt} />
            <StableRow chainId={polygon.id} label="USDC" token={TOKEN_ADDRESSES[polygon.id].usdc} />
            <StableRow chainId={polygon.id} label="USDT" token={TOKEN_ADDRESSES[polygon.id].usdt} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BalanceCard



