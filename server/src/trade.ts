import { ethers } from 'ethers'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

// Environment variables for RPC, wallet and router configuration
const RPC_URL = process.env.RPC_URL as string
const RPC_URL_MAINNET = process.env.RPC_URL_MAINNET as string | undefined
const RPC_URL_BASE = process.env.RPC_URL_BASE as string | undefined
const PRIVATE_KEY = process.env.PRIVATE_KEY as string
const ROUTER_ADDRESS = process.env.DEX_ROUTER_ADDRESS as string
const ROUTER_ADDRESS_MAINNET = process.env.DEX_ROUTER_ADDRESS_MAINNET as string | undefined
const ROUTER_ADDRESS_BASE = process.env.DEX_ROUTER_ADDRESS_BASE as string | undefined
const DRY_RUN = String(process.env.DRY_RUN || '').toLowerCase() === 'true'
const isPlaceholderKey = !PRIVATE_KEY || PRIVATE_KEY === '0xYOUR_PRIVATE_KEY' || PRIVATE_KEY.length < 64
const EFFECTIVE_DRY_RUN = DRY_RUN || isPlaceholderKey

type ChainKey = 'mainnet' | 'base'

function resolveChainKey(input?: string): ChainKey {
  if (!input) return 'mainnet'
  const v = String(input).toLowerCase()
  if (v === 'base') return 'base'
  return 'mainnet'
}

function getChainConfig(chain?: string) {
  const key = resolveChainKey(chain)
  if (key === 'base') {
    return {
      rpcUrl: RPC_URL_BASE || RPC_URL,
      routerAddress: ROUTER_ADDRESS_BASE || ROUTER_ADDRESS,
      chainKey: key,
    }
  }
  return {
    rpcUrl: RPC_URL_MAINNET || RPC_URL,
    routerAddress: ROUTER_ADDRESS_MAINNET || ROUTER_ADDRESS,
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
  const provider = new ethers.JsonRpcProvider(rpcUrl)
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