interface SeriesProps {
  label: string
  unit: string
  values: number[]
  color: string
}

function Sparkline({ label, unit, values, color }: SeriesProps) {
  const width = 260
  const height = 60
  const padding = 4
  if (values.length === 0) {
    return (
      <div className="border border-border rounded-lg p-3">
        <p className="text-xs font-semibold text-text-secondary mb-1">{label} ({unit})</p>
        <p className="text-xs text-text-secondary">No data yet</p>
      </div>
    )
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0
  const points = values
    .map((v, i) => {
      const x = padding + i * step
      const y = height - padding - ((v - min) / range) * (height - padding * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-text-secondary">{label} ({unit})</p>
        <p className="text-xs font-bold text-text-primary">{values[values.length - 1].toFixed(2)}</p>
      </div>
      <svg width={width} height={height} role="img" aria-label={`${label} trend, latest value ${values[values.length - 1].toFixed(2)} ${unit}`}>
        <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
      </svg>
    </div>
  )
}

interface Props {
  voltage: number[]
  current: number[]
  temperature: number[]
  soc: number[]
}

export function Sim003Charts({ voltage, current, temperature, soc }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Sparkline label="Voltage" unit="V" values={voltage} color="#2563eb" />
      <Sparkline label="Current" unit="A" values={current} color="#d97706" />
      <Sparkline label="Temperature" unit="°C" values={temperature} color="#dc2626" />
      <Sparkline label="SOC" unit="%" values={soc} color="#16a34a" />
    </div>
  )
}
