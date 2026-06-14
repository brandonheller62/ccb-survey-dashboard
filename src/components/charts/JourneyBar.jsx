import { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts'
import { orderedCountBy } from '../../lib/transform.js'

// Mirrors the website's "Where patients are in their journey" bar chart.
const ORDER = ['Just starting', 'Midway through treatment', 'Near completion', 'Completed treatment']
// light -> deep rose, matching the original
const SHADES = ['#f0b9cb', '#e08aa6', '#cd6486', '#b5476a']

export default function JourneyBar({ records }) {
  const data = useMemo(() => orderedCountBy(records, 'journey', ORDER), [records])
  const shadeFor = (name) => {
    const i = ORDER.indexOf(name)
    return i === -1 ? '#b5476a' : SHADES[i]
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 24, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3dce6" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b6470' }} tickLine={false} axisLine={false} interval={0} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b6470' }} tickLine={false} axisLine={false} width={36} />
        <Tooltip cursor={{ fill: '#fdf2f6' }} contentStyle={{ borderRadius: 12, border: '1px solid #fbcfe0' }} />
        <Bar dataKey="value" name="Patients" radius={[6, 6, 0, 0]}>
          {data.map((d) => <Cell key={d.name} fill={shadeFor(d.name)} />)}
          <LabelList dataKey="value" position="top" style={{ fill: '#2b2230', fontWeight: 700, fontSize: 13 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
