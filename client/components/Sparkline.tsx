import React from 'react'

type SparklineProps = {
  values: number[]
  width?: number
  height?: number
  stroke?: string
}

const Sparkline: React.FC<SparklineProps> = ({ values, width = 140, height = 40, stroke = '#4f46e5' }) => {
  if (!values || values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const denom = Math.max(max - min, 1)

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / denom) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}> 
      <polyline fill="none" stroke={stroke} strokeWidth="2" points={points} />
    </svg>
  )
}

export default Sparkline



