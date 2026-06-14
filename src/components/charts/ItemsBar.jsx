import { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts'
import { multiCountBy } from '../../lib/transform.js'

/**
 * Reusable ranked horizontal bar — powers both "Most-requested chemotherapy items"
 * and "Most-requested radiation therapy items" from the website.
 */
export default function ItemsBar({ records, field, color = '#b5476a', limit = 10 }) {
  const data = useMemo(() => multiCountBy(records, field, { limit }), [records, field, limit])
  // Recharts paints category axis bottom-up; reverse so the biggest sits on top.
  const ordered = [...data].reverse()
  const rowH = 34
  const height = Math.max(220, ordered.length * rowH + 24)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart layout="vertical" data={ordered} margin={{ top: 4, right: 32, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3dce6" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6b6470' }} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fontSize: 12, fill: '#6b6470' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip cursor={{ fill: '#fdf2f6' }} contentStyle={{ borderRadius: 12, border: '1px solid #fbcfe0' }} />
        <Bar dataKey="value" name="Patients" fill={color} radius={[0, 6, 6, 0]} barSize={20}>
          <LabelList dataKey="value" position="right" style={{ fill: '#2b2230', fontWeight: 700, fontSize: 13 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
