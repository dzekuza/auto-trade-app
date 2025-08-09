import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch((process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001') + '/activity')
    const data = await response.json()
    return res.status(200).json(data)
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load activity' })
  }
}


