'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { EquityPoint } from '../lib/sim/runner'

const fmt = (v: number) => `$${v.toFixed(2)}`

export default function EquityContrastChart({ data }: { data: EquityPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <CartesianGrid stroke="#283242" strokeDasharray="3 3" />
        <XAxis dataKey="t" stroke="#8b98a9" fontSize={11} tickLine={false} />
        <YAxis
          stroke="#8b98a9"
          fontSize={11}
          tickLine={false}
          width={56}
          tickFormatter={fmt}
        />
        <Tooltip
          contentStyle={{
            background: '#1b2330',
            border: '1px solid #283242',
            borderRadius: 8,
            color: '#e6edf3',
            fontSize: 12,
          }}
          labelFormatter={(t) => `fill #${t}`}
          formatter={(v: number, name) => [fmt(v), name === 'hedged' ? 'Hedged' : 'Unhedged']}
        />
        <Line
          type="monotone"
          dataKey="hedged"
          stroke="#4ade80"
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="unhedged"
          stroke="#f87171"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
