import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const { tokenAddress, amountInEth, chain } = req.body as { tokenAddress: string, amountInEth: string, chain?: string }
    if (!tokenAddress || !amountInEth) {
      return res.status(400).json({ error: 'tokenAddress and amountInEth are required' })
    }
    const response = await fetch((process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/trade'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenAddress, amountInEth, chain })
    })
    const data = await response.json()
    return res.status(response.ok ? 200 : 500).json(data)
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: 'Trade failed' })
  }
}


