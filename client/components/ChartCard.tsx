import React from 'react'

// Placeholder simple sparkline using inline SVG; replace with a chart lib later
const Sparkline: React.FC<{ values: number[] }> = ({ values }) => {
  const width = 240
  const height = 60
  const max = Math.max(...values, 1)
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - (v / max) * height
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline fill="none" stroke="#4f46e5" strokeWidth="2" points={points} />
    </svg>
  )
}

const ChartCard: React.FC = () => {
  const sample = React.useMemo(() => Array.from({ length: 24 }, () => 50 + Math.random() * 50), [])
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold">Market Snapshot</h3>
      </div>
      <div className="card-body">
        <Sparkline values={sample} />
        <p className="text-xs text-gray-500 mt-2">Demo sparkline. Integrate real price data later.</p>
      </div>
    </div>
  )
}

export default ChartCard



