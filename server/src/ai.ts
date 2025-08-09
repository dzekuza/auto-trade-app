import dotenv from 'dotenv'
dotenv.config()

import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
let client: GoogleGenerativeAI | null = null

export function getGeminiClient(): GoogleGenerativeAI {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set')
  }
  if (!client) client = new GoogleGenerativeAI(apiKey)
  return client
}

export async function analyzeOpportunity(input: {
  name: string
  symbol: string
  address: string
  priceUsd?: number
  liquidityUsd?: number
  volumeH24?: number
  changeH1?: number
  changeH24?: number
  score: number
  chainId?: string
}) {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
  const prompt = `You are a crypto risk assistant. Evaluate this token opportunity and reply with:
- Verdict: BUY / WATCH / AVOID
- Rationale: 3 concise bullets on liquidity quality, volume, recent momentum, and risks.
- Suggested Max Allocation: % of portfolio (number 0-5%).

Data:
Name: ${input.name} (${input.symbol})
Address: ${input.address}
Chain: ${input.chainId ?? 'unknown'}
Price (USD): ${input.priceUsd ?? 'n/a'}
Liquidity (USD): ${input.liquidityUsd ?? 'n/a'}
24h Volume (USD): ${input.volumeH24 ?? 'n/a'}
1h Change (%): ${input.changeH1 ?? 'n/a'}
24h Change (%): ${input.changeH24 ?? 'n/a'}
Score (0+): ${input.score}

Constraints:
- Do not hallucinate unknown facts. Base decision only on provided data.
- Keep response under 120 words.
`
  const res = await model.generateContent(prompt)
  const text = res.response.text()
  return { output: text }
}


