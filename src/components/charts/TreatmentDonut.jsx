import { useMemo } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { countBy } from '../../lib/transform.js'

// Mirrors the website's "Who responded to our survey" donut.
const COLORS = { chemo: '#b5476a', radiation: '#e8a0b4', both: '#c9953a', other: '#d9b8c4' }

function classify(name) {
  const n = name.toLowerCase()
  if (n.includes('both')) return { label: 'Both', color: COLORS.both }
  if (n.includes('radiation')) return { label: 'Radiation', color: COLORS.radiation }
  if (n.includes('chemo')) return { label: 'Chemotherapy', color: COLORS.chemo }
  return { label: name, color: COLORS.other }
}

export default function TreatmentDonut({ records }) {
  const data = useMemo(() => {
    return countBy(records, 'treatment').map((d) => ({ ...d, ...classify(d.name) }))
  }, [records])

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={104}
              paddingAngle={1}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip
              formatter={(v, _n, p) => [`${v} (${Math.round((v / total) * 100)}%)`, p.payload.label]}
              contentStyle={{ borderRadius: 12, border: '1px solid #fbcfe0' }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* center total */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-4xl font-semibold text-ccb-600">{total}</span>
          <span className="text-xs text-ink-soft">patients surveyed</span>
        </div>
      </div>

      {/* legend */}
      <ul className="mt-2 space-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
            <span className="text-ink">{d.label}</span>
            <span className="text-ink-soft">· {d.value} ({Math.round((d.value / total) * 100)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
