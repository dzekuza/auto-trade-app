import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Proxy API route to fetch token opportunities from the backend server.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const chainParam = req.query.chain ? `?chain=${encodeURIComponent(String(req.query.chain))}` : ''
    const response = await fetch((process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/scan') + chainParam)
    const data = await response.json()
    return res.status(200).json(data)
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to fetch opportunities' })
  }
}