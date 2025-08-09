import express from 'express'
import dotenv from 'dotenv'
import { scanTokens } from './scanTokens'
import { analyzeOpportunity } from './ai'
import { executeTrade, isTradeConfigured, executeTradeFromErc20, getUsdcAddressForChain, setRouterOverride, ChainKey } from './trade'
// Use require for ankr.js to avoid missing type declarations
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AnkrProvider } = require('@ankr.com/ankr.js')

// Load environment variables from .env file at the root
dotenv.config()

const app = express()
app.use(express.json())

// Internal state for auto trading control
let autoTrading = false
let autoInterval: NodeJS.Timeout | null = null
const activityLog: Array<{ time: string; action: string; details: any }> = []
const ankrApiKey = process.env.ANKR_API_KEY
const ankr = ankrApiKey ? new AnkrProvider(`https://rpc.ankr.com/multichain/${ankrApiKey}`) : null

/**
 * GET /scan
 * Returns an array of token opportunities with their score.
 */
app.get('/scan', async (req, res) => {
  try {
    const { chain } = req.query as { chain?: string }
    const tokens = await scanTokens(chain)
    res.json({ tokens })
  } catch (err: any) {
    console.error('Scan error', err)
    res.status(500).json({ error: 'Failed to scan tokens' })
  }
})
/**
 * POST /analyze
 * Analyze a single token opportunity with Gemini and return a concise opinion.
 */
app.post('/analyze', async (req, res) => {
  try {
    const data = req.body || {}
    const result = await analyzeOpportunity(data)
    res.json(result)
  } catch (err: any) {
    console.error('Analyze error', err)
    res.status(500).json({ error: 'Failed to analyze' })
  }
})

/**
 * POST /auto
 * Enable or disable automatic trading. When enabled, the backend periodically
 * scans for tokens and executes a trade on the highest scoring opportunity.
 */
app.post('/auto', (req, res) => {
  const enable = Boolean(req.body.enable)
  if (enable && !isTradeConfigured()) {
    return res.status(400).json({ error: 'Trading not configured. Set RPC_URL, PRIVATE_KEY, and DEX_ROUTER_ADDRESS in your .env (or set DRY_RUN=true).' })
  }
  autoTrading = enable
  const { maxSpendEth, maxSpendStable, stableToken, chain } = req.body || {}
  ;(app as any).autoTradePrefs = { maxSpendEth, maxSpendStable, stableToken, chain }
  if (enable && !autoInterval) {
    autoInterval = setInterval(async () => {
      try {
        const prefs = (app as any).autoTradePrefs || {}
        const tokens = await scanTokens(prefs.chain)
        const sorted = tokens.sort((a, b) => b.score - a.score)
        const best = sorted[0]
        if (best) {
          console.log(`[auto] Trading ${best.name} (${best.symbol})`)
          if (prefs?.stableToken) {
            const usdc = prefs.stableToken === 'USDC' ? getUsdcAddressForChain(prefs.chain) : null
            if (usdc) {
              const r = await executeTradeFromErc20(usdc, best.address, String(prefs.maxSpendStable || '10'), prefs.chain)
              activityLog.push({ time: new Date().toISOString(), action: 'AUTO_TRADE_STABLE', details: { tokenIn: usdc, tokenOut: best.address, amount: prefs.maxSpendStable, chain: prefs.chain, tx: (r as any)?.transactionHash || r } })
            }
          } else {
            const r = await executeTrade(best.address, String(prefs.maxSpendEth || '0.01'), prefs.chain)
            activityLog.push({ time: new Date().toISOString(), action: 'AUTO_TRADE_NATIVE', details: { tokenOut: best.address, amountEth: prefs.maxSpendEth, chain: prefs.chain, tx: (r as any)?.transactionHash || r } })
          }
        }
      } catch (err) {
        console.error('Auto trading iteration failed', err)
        activityLog.push({ time: new Date().toISOString(), action: 'ERROR', details: { error: String(err) } })
      }
    }, 60 * 1000)
  } else if (!enable && autoInterval) {
    clearInterval(autoInterval)
    autoInterval = null
  }
  res.json({ autoTrading })
})

/**
 * GET /activity
 * Returns the last 200 auto-trading actions (buys/sells/logs)
 */
app.get('/activity', (_req, res) => {
  const last = activityLog.slice(-200).reverse()
  res.json({ activity: last })
})

/**
 * GET /bot-info
 * Returns bot wallet address and aggregated balances via Ankr (if configured)
 */
app.get('/bot-info', async (_req, res) => {
  try {
    const rpcUrl = process.env.RPC_URL || process.env.RPC_URL_MAINNET
    if (!rpcUrl) return res.status(400).json({ error: 'RPC_URL not configured' })
    const { ethers } = await import('ethers')
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '0x', provider)
    const address = await wallet.getAddress().catch(() => null)
    let balances: any = null
    if (ankr && address) {
      balances = await ankr.getAccountBalance({
        blockchain: ['eth', 'base', 'arbitrum', 'bsc', 'polygon'],
        walletAddress: address,
      })
    }
    res.json({ address, balances })
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to load bot info' })
  }
})

/**
 * POST /router
 * Set a router override for a chain
 */
app.post('/router', (req, res) => {
  try {
    const { chain, address } = req.body as { chain: ChainKey, address: string }
    if (!chain || !address) return res.status(400).json({ error: 'chain and address required' })
    setRouterOverride(chain, address)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to set router' })
  }
})

/**
 * POST /trade
 * Execute a trade for a specific token address and ETH amount.
 * Body parameters: { tokenAddress: string, amountInEth: string }
 */
app.post('/trade', async (req, res) => {
  const { tokenAddress, amountInEth, chain } = req.body
  if (!tokenAddress || !amountInEth) {
    return res.status(400).json({ error: 'tokenAddress and amountInEth are required' })
  }
  try {
    const receipt = await executeTrade(tokenAddress, amountInEth, chain)
    res.json({ receipt })
  } catch (err: any) {
    console.error('Trade error', err)
    res.status(500).json({ error: err.message || 'Trade failed' })
  }
})

const port = Number(process.env.PORT) || 3001
app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`)
})