import React from 'react'
import { Button } from './ui/button'

type Token = {
  address: string
  name: string
  symbol: string
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
  tokens: Token[]
}

const BatchReviewDrawer: React.FC<Props> = ({ open, onClose, tokens }) => {
  const [loading, setLoading] = React.useState(false)
  const [rows, setRows] = React.useState<Array<{ token: Token; output?: string; error?: string }>>([])

  React.useEffect(() => {
    if (!open) return
    setRows(tokens.slice(0, 25).map(t => ({ token: t })))
  }, [open, tokens])

  async function run() {
    setLoading(true)
    const next: Array<{ token: Token; output?: string; error?: string }> = []
    for (const t of tokens.slice(0, 25)) {
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'AI failed')
        next.push({ token: t, output: String(data?.output || '') })
      } catch (e: any) {
        next.push({ token: t, error: e?.message || 'AI error' })
      }
      setRows([...next])
    }
    setLoading(false)
  }

  function exportCsv() {
    const headers = ['name', 'symbol', 'address', 'output']
    const lines = [headers.join(',')]
    for (const r of rows) {
      lines.push([r.token.name, r.token.symbol, r.token.address, (r.output || r.error || '').replaceAll('\n', ' ')].map(v => '"' + (v ?? '') + '"').join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai_review.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white border-l border-gray-200 shadow-xl">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold">AI Batch Review</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportCsv}>Export CSV</Button>
            <Button size="sm" onClick={run} disabled={loading}>{loading ? 'Running…' : 'Run'}</Button>
            <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
        <div className="p-4 space-y-2 overflow-auto h-[calc(100%-56px)]">
          {rows.map((r, i) => (
            <div key={i} className="border border-gray-200 rounded-md p-3">
              <div className="text-sm font-medium">{r.token.name} ({r.token.symbol})</div>
              <div className="text-xs text-gray-500 mb-2">{r.token.address}</div>
              {r.output && <pre className="whitespace-pre-wrap text-sm">{r.output}</pre>}
              {r.error && <p className="text-sm text-red-600">{r.error}</p>}
            </div>
          ))}
          {rows.length === 0 && (
            <p className="text-sm text-gray-500">No tokens selected</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default BatchReviewDrawer


