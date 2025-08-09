import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Proxy API route to enable or disable auto trading on the backend.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const { enable } = req.body
    const response = await fetch((process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/auto'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable })
    })
    const data = await response.json()
    return res.status(200).json(data)
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to update auto trading' })
  }
}