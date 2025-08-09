import express from 'express'
import dotenv from 'dotenv'
import { scanTokens } from './scanTokens'
import { executeTrade, isTradeConfigured } from './trade'

// Load environment variables from .env file at the root
dotenv.config()

const app = express()
app.use(express.json())

// Internal state for auto trading control
let autoTrading = false
let autoInterval: NodeJS.Timeout | null = null

/**
 * GET /scan
 * Returns an array of token opportunities with their score.
 */
app.get('/scan', async (_req, res) => {
  try {
    const tokens = await scanTokens()
    res.json({ tokens })
  } catch (err: any) {
    console.error('Scan error', err)
    res.status(500).json({ error: 'Failed to scan tokens' })
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
  if (enable && !autoInterval) {
    autoInterval = setInterval(async () => {
      try {
        const tokens = await scanTokens()
        const sorted = tokens.sort((a, b) => b.score - a.score)
        const best = sorted[0]
        if (best) {
          console.log(`[auto] Trading ${best.name} (${best.symbol})`)
          await executeTrade(best.address, '0.01')
        }
      } catch (err) {
        console.error('Auto trading iteration failed', err)
      }
    }, 60 * 1000)
  } else if (!enable && autoInterval) {
    clearInterval(autoInterval)
    autoInterval = null
  }
  res.json({ autoTrading })
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