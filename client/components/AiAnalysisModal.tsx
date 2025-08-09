import React from 'react'
import { Button } from './ui/button'

export type AiAnalysisInput = {
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
}

type Props = {
  open: boolean
  onClose: () => void
  token?: AiAnalysisInput | null
}

const AiAnalysisModal: React.FC<Props> = ({ open, onClose, token }) => {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [text, setText] = React.useState<string>('')

  React.useEffect(() => {
    if (!open || !token) return
    let active = true
    setLoading(true)
    setError(null)
    setText('')
    ;(async () => {
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(token)
        })
        const data = await res.json()
        if (!active) return
        if (!res.ok) throw new Error(data?.error || 'AI failed')
        setText(String(data?.output || 'No analysis'))
      } catch (e: any) {
        if (active) setError(e?.message || 'AI error')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [open, token])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl bg-white rounded-xl border border-gray-200 shadow-lg">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">AI Analysis</h3>
            {token && (
              <p className="text-xs text-gray-500">{token.name} ({token.symbol}) · {token.address.slice(0, 6)}…{token.address.slice(-4)}</p>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-auto">
          {loading && <p className="text-sm text-gray-500">Asking Gemini…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && (
            <pre className="whitespace-pre-wrap text-sm text-gray-800">{text}</pre>
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-500">
          Output is informational only and not financial advice.
        </div>
      </div>
    </div>
  )
}

export default AiAnalysisModal


