import { useMemo } from 'react'
import StatCard from './StatCard.jsx'
import ChartCard from './ChartCard.jsx'
import TreatmentDonut from './charts/TreatmentDonut.jsx'
import JourneyBar from './charts/JourneyBar.jsx'
import ItemsBar from './charts/ItemsBar.jsx'
import { responsesOverTime, dateExtent, countBy, multiCountBy } from '../lib/transform.js'

export default function Dashboard({ records }) {
  const overTime = useMemo(() => responsesOverTime(records), [records])
  const extent = useMemo(() => dateExtent(records), [records])

  const peak = overTime.reduce((m, d) => (d.count > m.count ? d : m), { count: 0, label: '—' })

  // Presence checks so charts only render when the data supports them.
  const hasTreatment = useMemo(() => countBy(records, 'treatment').length > 0, [records])
  const hasJourney = useMemo(() => countBy(records, 'journey').length > 0, [records])
  const hasChemo = useMemo(() => multiCountBy(records, 'chemoItems').length > 0, [records])
  const hasRad = useMemo(() => multiCountBy(records, 'radItems').length > 0, [records])

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total responses" value={records.length} />
        <StatCard label="Busiest month" value={peak.label} sub={`${peak.count} responses`} />
        <StatCard
          label="Date range"
          value={extent.min ? `${extent.min.toLocaleString('en-US', { month: 'short', year: 'numeric' })} – Present` : '—'}
        />
      </div>

      {/* Who responded + where they are in their journey */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Who responded to our survey" subtitle="By treatment type" isEmpty={!hasTreatment}>
          <TreatmentDonut records={records} />
        </ChartCard>
        <ChartCard title="Where patients are in their journey" subtitle="Number of patients by stage" isEmpty={!hasJourney}>
          <JourneyBar records={records} />
        </ChartCard>
      </div>

      {/* Most-requested items */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Most-requested chemotherapy items" subtitle="Number of patients who selected each" isEmpty={!hasChemo}>
          <ItemsBar records={records} field="chemoItems" />
        </ChartCard>
        <ChartCard title="Most-requested radiation therapy items" subtitle="Number of patients who selected each" isEmpty={!hasRad}>
          <ItemsBar records={records} field="radItems" />
        </ChartCard>
      </div>
    </div>
  )
}
