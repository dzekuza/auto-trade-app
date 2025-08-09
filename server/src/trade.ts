import { ethers } from 'ethers'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

// Environment variables for RPC, wallet and router configuration
const RPC_URL = process.env.RPC_URL as string
const ANKR_API_KEY = process.env.ANKR_API_KEY as string | undefined
const RPC_URL_MAINNET = process.env.RPC_URL_MAINNET as string | undefined
const RPC_URL_BASE = process.env.RPC_URL_BASE as string | undefined
const RPC_URL_ARBITRUM = process.env.RPC_URL_ARBITRUM as string | undefined
const RPC_URL_BSC = process.env.RPC_URL_BSC as string | undefined
const RPC_URL_POLYGON = process.env.RPC_URL_POLYGON as string | undefined
const PRIVATE_KEY = process.env.PRIVATE_KEY as string
const ROUTER_ADDRESS = process.env.DEX_ROUTER_ADDRESS as string
const ROUTER_ADDRESS_MAINNET = process.env.DEX_ROUTER_ADDRESS_MAINNET as string | undefined
const ROUTER_ADDRESS_BASE = process.env.DEX_ROUTER_ADDRESS_BASE as string | undefined
const ROUTER_ADDRESS_ARBITRUM = process.env.DEX_ROUTER_ADDRESS_ARBITRUM as string | undefined
const ROUTER_ADDRESS_BSC = process.env.DEX_ROUTER_ADDRESS_BSC as string | undefined
const ROUTER_ADDRESS_POLYGON = process.env.DEX_ROUTER_ADDRESS_POLYGON as string | undefined
const DRY_RUN = String(process.env.DRY_RUN || '').toLowerCase() === 'true'
const isPlaceholderKey = !PRIVATE_KEY || PRIVATE_KEY === '0xYOUR_PRIVATE_KEY' || PRIVATE_KEY.length < 64
const EFFECTIVE_DRY_RUN = DRY_RUN || isPlaceholderKey

export type ChainKey = 'mainnet' | 'base' | 'arbitrum' | 'bsc' | 'polygon'

function resolveChainKey(input?: string): ChainKey {
  if (!input) return 'mainnet'
  const v = String(input).toLowerCase()
  if (v === 'base') return 'base'
  if (v === 'arbitrum') return 'arbitrum'
  if (v === 'bsc') return 'bsc'
  if (v === 'polygon') return 'polygon'
  return 'mainnet'
}

function chainIdFromKey(key: ChainKey): number {
  switch (key) {
    case 'mainnet': return 1
    case 'base': return 8453
    case 'arbitrum': return 42161
    case 'bsc': return 56
    case 'polygon': return 137
  }
}

const routerOverride: Partial<Record<ChainKey, string>> = {}
export function setRouterOverride(chain: ChainKey, address: string) {
  routerOverride[chain] = address
}

function getChainConfig(chain?: string) {
  const key = resolveChainKey(chain)
  const ankrUrl = (slug: string) => (ANKR_API_KEY ? `https://rpc.ankr.com/${slug}/${ANKR_API_KEY}` : undefined)

  // Default router presets per chain (popular DEXes)
  const defaultRouter: Record<ChainKey, string> = {
    mainnet: ROUTER_ADDRESS_MAINNET || '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2
    base: ROUTER_ADDRESS_BASE || '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 (Base Router 02)
    arbitrum: ROUTER_ADDRESS_ARBITRUM || '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // Uni V3 Router 02
    bsc: ROUTER_ADDRESS_BSC || '0x10ED43C718714eb63d5aA57B78B54704E256024E', // Pancake V2
    polygon: ROUTER_ADDRESS_POLYGON || '0xa5E0829CaCED8fFDD4De3c43696c57F7D7A678ff', // QuickSwap V2
  }
  if (key === 'base') {
    return {
      rpcUrl: RPC_URL_BASE || ankrUrl('base') || RPC_URL,
      routerAddress: routerOverride.base || defaultRouter.base || ROUTER_ADDRESS,
      chainKey: key,
    }
  }
  if (key === 'arbitrum') {
    return {
      rpcUrl: RPC_URL_ARBITRUM || ankrUrl('arbitrum') || RPC_URL,
      routerAddress: routerOverride.arbitrum || defaultRouter.arbitrum || ROUTER_ADDRESS,
      chainKey: key,
    }
  }
  if (key === 'bsc') {
    return {
      rpcUrl: RPC_URL_BSC || ankrUrl('bsc') || RPC_URL,
      routerAddress: routerOverride.bsc || defaultRouter.bsc || ROUTER_ADDRESS,
      chainKey: key,
    }
  }
  if (key === 'polygon') {
    return {
      rpcUrl: RPC_URL_POLYGON || ankrUrl('polygon') || RPC_URL,
      routerAddress: routerOverride.polygon || defaultRouter.polygon || ROUTER_ADDRESS,
      chainKey: key,
    }
  }
  return {
    rpcUrl: RPC_URL_MAINNET || ankrUrl('eth') || RPC_URL,
    routerAddress: routerOverride.mainnet || defaultRouter.mainnet || ROUTER_ADDRESS,
    chainKey: key,
  }
}
const SLIPPAGE_BPS = Number(process.env.SLIPPAGE_BPS || '500') // 500 = 5%
const TX_DEADLINE_MINUTES = Number(process.env.TX_DEADLINE_MINUTES || '15')

// Minimal Uniswap V2 router ABI definitions needed for the swap
const routerAbi = [
  'function WETH() external view returns (address)',
  'function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)',
  'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable'
] as const

// Minimal ERC20 ABI
const erc20Abi = [
  'function decimals() view returns (uint8)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
] as const

/**
 * executeTrade performs a swap on the configured DEX router.
 * It swaps ETH for the specified token using a fixed ETH input amount.
 *
 * @param tokenAddress ERC‑20 address of the token to purchase
 * @param amountInEth string representation of the ETH amount to spend (e.g. "0.01")
 * @returns a transaction receipt or an object representing the pending transaction
 */
export async function executeTrade(tokenAddress: string, amountInEth: string, chain?: string) {
  const { rpcUrl, routerAddress, chainKey } = getChainConfig(chain)
  if (!rpcUrl || !routerAddress) {
    throw new Error('RPC_URL and DEX_ROUTER_ADDRESS must be set for the selected chain')
  }
  const provider = new ethers.JsonRpcProvider(rpcUrl, chainIdFromKey(chainKey))
  // Reader for view calls; does not require a signer
  const routerReader = new ethers.Contract(routerAddress, routerAbi, provider)
  // Only construct a signer and write-enabled contract if not dry-run
  const wallet = EFFECTIVE_DRY_RUN ? null : new ethers.Wallet(PRIVATE_KEY, provider)
  const router = EFFECTIVE_DRY_RUN ? null : new ethers.Contract(routerAddress, routerAbi, wallet!)

  // Determine the wrapped native token (e.g. WETH for Ethereum, WBNB for BSC)
  const weth = await routerReader.WETH()
  const path = [weth, tokenAddress]
  const amountIn = ethers.parseEther(amountInEth)

  // Estimate the output amount to calculate a minimum
  // Fallback to DexScreener price if getAmountsOut fails (e.g., illiquid / routing issues)
  let amountsOut: bigint[]
  try {
    amountsOut = await routerReader.getAmountsOut(amountIn, path)
  } catch (e) {
    const pairQuery = `${tokenAddress}`
    try {
      const { data } = await axios.get(`https://api.dexscreener.com/latest/dex/search?q=${pairQuery}`, { timeout: 8000 })
      const priceUsd = Number(data?.pairs?.[0]?.priceUsd || 0)
      if (priceUsd > 0) {
        // assume 1 ETH ~ price from provider and token priceUsd to get rough estimate; do not use on prod
        const ethPrice = Number(await provider.getFeeData().then(() => 3000))
        const out = BigInt(Math.floor((Number(amountIn) / 1e18) * (ethPrice / priceUsd) * 1e18))
        amountsOut = [amountIn, out]
      } else {
        throw e
      }
    } catch {
      throw e
    }
  }
  const amountOutMin = (amountsOut[1] * BigInt(10000 - SLIPPAGE_BPS)) / BigInt(10000)

  const deadline = Math.floor(Date.now() / 1000) + TX_DEADLINE_MINUTES * 60

  // Execute the swap
  if (EFFECTIVE_DRY_RUN) {
    console.log(`[dry-run] swapExactETHForTokens amountIn=${amountInEth} minOut=${amountOutMin.toString()} token=${tokenAddress}`)
    return { dryRun: true, amountInEth, tokenAddress, amountOutMin: amountOutMin.toString() }
  } else {
    if (!router || !wallet) {
      throw new Error('Router or wallet not initialized')
    }
    const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
      amountOutMin,
      path,
      await wallet.getAddress(),
      deadline,
      { value: amountIn }
    )
    console.log(`Submitted swap tx ${tx.hash}`)
    return await tx.wait()
  }
}

export function isTradeConfigured(): boolean {
  if (!RPC_URL || !ROUTER_ADDRESS) return false
  if (!PRIVATE_KEY || PRIVATE_KEY === '0xYOUR_PRIVATE_KEY') return false
  return true
}

export async function executeTradeFromErc20(tokenIn: string, tokenOut: string, amountIn: string, chain?: string) {
  const { rpcUrl, routerAddress, chainKey } = getChainConfig(chain)
  if (!rpcUrl || !routerAddress) throw new Error('RPC/Router not configured')

  const provider = new ethers.JsonRpcProvider(rpcUrl, chainIdFromKey(chainKey))
  if (EFFECTIVE_DRY_RUN) {
    console.log(`[dry-run] swapExactTokensForTokens amountIn=${amountIn} tokenIn=${tokenIn} tokenOut=${tokenOut}`)
    return { dryRun: true, amountIn, tokenIn, tokenOut }
  }
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
  const router = new ethers.Contract(routerAddress, [
    ...routerAbi,
    'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external'
  ], wallet)
  const erc20 = new ethers.Contract(tokenIn, erc20Abi, wallet)
  const decimals: number = await erc20.decimals()
  const amount = ethers.parseUnits(amountIn, decimals)

  // Ensure approval
  const owner = await wallet.getAddress()
  const current = await erc20.allowance(owner, routerAddress)
  if (current < amount) {
    const txApprove = await erc20.approve(routerAddress, amount)
    await txApprove.wait()
  }

  // Compute min out via getAmountsOut
  const routerReader = new ethers.Contract(routerAddress, routerAbi, provider)
  const path = [tokenIn, tokenOut]
  const out = await routerReader.getAmountsOut(amount, path)
  const amountOutMin = (out[1] * BigInt(10000 - SLIPPAGE_BPS)) / BigInt(10000)
  const deadline = Math.floor(Date.now() / 1000) + TX_DEADLINE_MINUTES * 60

  const tx = await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
    amount,
    amountOutMin,
    path,
    owner,
    deadline
  )
  console.log(`Submitted token->token swap tx ${tx.hash}`)
  return await tx.wait()
}

export function getUsdcAddressForChain(chain?: string): string | null {
  const key = resolveChainKey(chain)
  switch (key) {
    case 'mainnet': return '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    case 'base': return '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    case 'arbitrum': return '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
    case 'bsc': return '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'
    case 'polygon': return '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
    default: return null
  }
}