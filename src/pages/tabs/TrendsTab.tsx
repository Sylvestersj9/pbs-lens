import { useState, useMemo } from 'react'
import { subMonths, format, parseISO, addMonths, startOfMonth } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Legend } from 'recharts'
import { useIncidents } from '@/hooks/useIncidents'
import { useReviewPeriods, useCreateReviewPeriod, useDeleteReviewPeriod } from '@/hooks/useReviewPeriods'
import { ANTECEDENT_CODES, BEHAVIOUR_CODES, CONSEQUENCE_CODES, getCodeLabel, getTimeBand, getDayOfWeek } from '@/lib/codeLists'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ReviewPeriodSelector from '@/components/ReviewPeriodSelector'
import type { Incident, ReviewPeriod } from '@/lib/types'
import type { CodeDefinition } from '@/lib/codeLists'

function FreqTableDisplay({ title, data }: { title: string; data: { label: string; count: number }[] }) {
  if (data.length === 0) return null
  const max = Math.max(...data.map((d) => d.count))

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm">{title}</h4>
      <div className="space-y-1">
        {data.map((row) => (
          <div key={row.label} className="flex items-center gap-2 text-sm">
            <span className="w-32 truncate text-muted-foreground">{row.label}</span>
            <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-primary rounded"
                style={{ width: max > 0 ? `${(row.count / max) * 100}%` : '0%' }}
              />
            </div>
            <span className="w-8 text-right font-mono text-xs">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function IncidentTrajectoryChart({ incidents, periods }: { incidents: { incident_date: string }[]; periods: ReviewPeriod[] }) {
  const chartData = useMemo(() => {
    if (incidents.length === 0) return []

    // Count incidents per calendar month
    const monthlyCounts: Record<string, number> = {}
    for (const inc of incidents) {
      const month = inc.incident_date.slice(0, 7) // YYYY-MM
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1
    }

    // Find min and max months across all incidents
    const months = Object.keys(monthlyCounts).sort()
    const firstMonth = startOfMonth(parseISO(months[0] + '-01'))
    const lastMonth = startOfMonth(parseISO(months[months.length - 1] + '-01'))

    // Fill in all months between first and last (including zeros)
    const data: { month: string; label: string; count: number }[] = []
    let current = firstMonth
    while (current <= lastMonth) {
      const key = format(current, 'yyyy-MM')
      data.push({
        month: key,
        label: format(current, 'MMM yy'),
        count: monthlyCounts[key] || 0,
      })
      current = addMonths(current, 1)
    }

    return data
  }, [incidents])

  // Review period boundary lines (start of each period)
  const reviewLines = useMemo(() => {
    return periods
      .sort((a, b) => a.date_from.localeCompare(b.date_from))
      .map((p) => {
        const monthKey = p.date_from.slice(0, 7)
        // Extract short label like "Review 1" from "Review 1: 20 Jan – 19 May 2025"
        const shortLabel = p.label.split(':')[0].trim()
        return { month: monthKey, label: shortLabel }
      })
  }, [periods])

  if (chartData.length < 3) return null

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h4 className="font-semibold text-sm">Incident Frequency Over Time</h4>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 20, right: 12, left: -12, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: 13,
              }}
              formatter={(value) => [String(value), 'Incidents']}
              labelFormatter={(label) => String(label)}
            />
            {reviewLines.map((rl) => {
              const idx = chartData.findIndex((d) => d.month === rl.month)
              if (idx === -1) return null
              return (
                <ReferenceLine
                  key={rl.month}
                  x={chartData[idx].label}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  label={{ value: rl.label, position: 'top', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
              )
            })}
            <Line
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

const BAR_COLORS = ['hsl(var(--primary))', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981']

function getTopBehaviourCodes(incidents: Incident[], n: number): string[] {
  const counts: Record<string, number> = {}
  for (const inc of incidents) {
    for (const code of inc.behaviour_codes) {
      counts[code] = (counts[code] || 0) + 1
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([code]) => code)
}

function getTopCode(codes: string[], codeList: CodeDefinition[]): { label: string; count: number } | null {
  const counts: Record<string, number> = {}
  for (const c of codes) counts[c] = (counts[c] || 0) + 1
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  if (!top) return null
  return { label: `${getCodeLabel(top[0], codeList)} (${top[0]})`, count: top[1] }
}

interface PeriodSummary {
  label: string
  shortLabel: string
  dateRange: string
  total: number
  topBehaviour: { label: string; count: number } | null
  topAntecedent: { label: string; count: number } | null
  topConsequence: { label: string; count: number } | null
  changeVsPrev: number | null
}

function ComparePeriodsView({ incidents, periods }: { incidents: Incident[]; periods: ReviewPeriod[] }) {
  const sorted = useMemo(
    () => [...periods].sort((a, b) => a.date_from.localeCompare(b.date_from)),
    [periods]
  )

  const topCodes = useMemo(() => getTopBehaviourCodes(incidents, 3), [incidents])

  const periodData = useMemo(() => {
    return sorted.map((p) => {
      const inPeriod = incidents.filter(
        (i) => i.incident_date >= p.date_from && i.incident_date <= p.date_to
      )
      const shortLabel = p.label.split(':')[0].trim()

      const behCodes: string[] = []
      const antCodes: string[] = []
      const conCodes: string[] = []
      for (const inc of inPeriod) {
        behCodes.push(...inc.behaviour_codes)
        antCodes.push(...inc.antecedent_codes)
        conCodes.push(...inc.consequence_codes)
      }

      // Count per top behaviour code
      const codeCounts: Record<string, number> = {}
      for (const code of topCodes) {
        codeCounts[code] = inPeriod.filter((i) => i.behaviour_codes.includes(code)).length
      }

      return {
        periodId: p.id,
        label: p.label,
        shortLabel,
        dateRange: `${format(parseISO(p.date_from), 'dd MMM yy')} – ${format(parseISO(p.date_to), 'dd MMM yy')}`,
        total: inPeriod.length,
        topBehaviour: getTopCode(behCodes, BEHAVIOUR_CODES),
        topAntecedent: getTopCode(antCodes, ANTECEDENT_CODES),
        topConsequence: getTopCode(conCodes, CONSEQUENCE_CODES),
        ...codeCounts,
      }
    })
  }, [sorted, incidents, topCodes])

  // Compute change vs previous
  const summaries: PeriodSummary[] = periodData.map((pd, i) => ({
    ...pd,
    changeVsPrev: i === 0 ? null : periodData[i - 1].total === 0 ? null : Math.round(((pd.total - periodData[i - 1].total) / periodData[i - 1].total) * 100),
  }))

  if (sorted.length < 2) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p className="text-sm">Add a second review period to compare trends across time.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Grouped bar chart */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-semibold text-sm">Incidents by Review Period</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={periodData} margin={{ top: 10, right: 12, left: -12, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 13,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="total" name="Total" fill={BAR_COLORS[0]} radius={[2, 2, 0, 0]} />
              {topCodes.map((code, i) => (
                <Bar
                  key={code}
                  dataKey={code}
                  name={getCodeLabel(code, BEHAVIOUR_CODES)}
                  fill={BAR_COLORS[i + 1]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2 font-medium border-b border-border">Period</th>
              <th className="text-left p-2 font-medium border-b border-border">Date Range</th>
              <th className="text-center p-2 font-medium border-b border-border">Total</th>
              <th className="text-left p-2 font-medium border-b border-border">Top Behaviour</th>
              <th className="text-left p-2 font-medium border-b border-border">Top Antecedent</th>
              <th className="text-left p-2 font-medium border-b border-border">Top Consequence</th>
              <th className="text-center p-2 font-medium border-b border-border">Change</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.shortLabel} className="border-b border-border hover:bg-muted/30">
                <td className="p-2 font-medium">{s.shortLabel}</td>
                <td className="p-2 text-muted-foreground text-xs">{s.dateRange}</td>
                <td className="p-2 text-center font-mono">{s.total}</td>
                <td className="p-2 text-xs">
                  {s.topBehaviour ? `${s.topBehaviour.label} (${s.topBehaviour.count})` : '—'}
                </td>
                <td className="p-2 text-xs">
                  {s.topAntecedent ? `${s.topAntecedent.label} (${s.topAntecedent.count})` : '—'}
                </td>
                <td className="p-2 text-xs">
                  {s.topConsequence ? `${s.topConsequence.label} (${s.topConsequence.count})` : '—'}
                </td>
                <td className="p-2 text-center">
                  {s.changeVsPrev == null ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <span className={`text-xs font-semibold ${s.changeVsPrev > 0 ? 'text-red-600' : s.changeVsPrev < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {s.changeVsPrev > 0 ? '+' : ''}{s.changeVsPrev}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function TrendsTab({ youngPersonId }: { youngPersonId: string }) {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const threeMonthsAgo = format(subMonths(now, 3), 'yyyy-MM-dd')

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [initialised, setInitialised] = useState(false)
  const [view, setView] = useState<'trajectory' | 'compare'>('trajectory')

  const { data: incidents = [], isLoading } = useIncidents(youngPersonId)

  const { data: periods = [] } = useReviewPeriods(youngPersonId)

  // Set initial date range: default to first review period, else full incident range
  if (!initialised && periods.length > 0 && incidents.length > 0) {
    const firstPeriod = [...periods].sort((a, b) => a.date_from.localeCompare(b.date_from))[0]
    setSelectedPeriodId(firstPeriod.id)
    setDateFrom(firstPeriod.date_from)
    setDateTo(firstPeriod.date_to)
    setInitialised(true)
  } else if (!initialised && incidents.length > 0 && !isLoading) {
    const sorted = [...incidents].sort((a, b) => a.incident_date.localeCompare(b.incident_date))
    setDateFrom(sorted[0].incident_date)
    setDateTo(sorted[sorted.length - 1].incident_date)
    setInitialised(true)
  } else if (!initialised && !isLoading && incidents.length === 0) {
    setDateFrom(threeMonthsAgo)
    setDateTo(today)
    setInitialised(true)
  }
  const createPeriod = useCreateReviewPeriod()
  const deletePeriod = useDeleteReviewPeriod()

  const handleSelectPeriod = (period: ReviewPeriod | null) => {
    if (period) {
      setSelectedPeriodId(period.id)
      setDateFrom(period.date_from)
      setDateTo(period.date_to)
    } else {
      setSelectedPeriodId(null)
      // Reset to full range when switching to custom
      if (incidents.length > 0) {
        const sorted = [...incidents].sort((a, b) => a.incident_date.localeCompare(b.incident_date))
        setDateFrom(sorted[0].incident_date)
        setDateTo(sorted[sorted.length - 1].incident_date)
      } else {
        setDateFrom(threeMonthsAgo)
        setDateTo(today)
      }
    }
  }

  const handleAddPeriod = (label: string, from: string, to: string) => {
    createPeriod.mutate({ young_person_id: youngPersonId, label, date_from: from, date_to: to })
  }

  const handleDeletePeriod = (id: string) => {
    deletePeriod.mutate({ id, youngPersonId })
    setSelectedPeriodId(null)
  }

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      const d = inc.incident_date
      return d >= dateFrom && d <= dateTo
    })
  }, [incidents, dateFrom, dateTo])

  // Summary stats
  const stats = useMemo(() => {
    const antecedentCounts: Record<string, number> = {}
    const behaviourCounts: Record<string, number> = {}
    const timeBandCounts: Record<string, number> = {}

    for (const inc of filtered) {
      for (const code of inc.antecedent_codes) {
        antecedentCounts[code] = (antecedentCounts[code] || 0) + 1
      }
      for (const code of inc.behaviour_codes) {
        behaviourCounts[code] = (behaviourCounts[code] || 0) + 1
      }
      const tb = inc.time_band || (inc.incident_time ? getTimeBand(inc.incident_time) : null)
      if (tb) {
        timeBandCounts[tb] = (timeBandCounts[tb] || 0) + 1
      }
    }

    const topAntecedent = Object.entries(antecedentCounts).sort((a, b) => b[1] - a[1])[0]
    const topBehaviour = Object.entries(behaviourCounts).sort((a, b) => b[1] - a[1])[0]
    const topTimeBand = Object.entries(timeBandCounts).sort((a, b) => b[1] - a[1])[0]

    return {
      total: filtered.length,
      topAntecedent: topAntecedent ? { label: getCodeLabel(topAntecedent[0], ANTECEDENT_CODES), count: topAntecedent[1] } : null,
      topBehaviour: topBehaviour ? { label: getCodeLabel(topBehaviour[0], BEHAVIOUR_CODES), count: topBehaviour[1] } : null,
      topTimeBand: topTimeBand ? { label: topTimeBand[0], count: topTimeBand[1] } : null,
    }
  }, [filtered])

  // Breakdown tables
  const breakdown = useMemo(() => {
    const dayMap: Record<string, number> = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 }
    const timeBandMap: Record<string, number> = { Night: 0, AM: 0, PM: 0, Evening: 0 }
    const antMap: Record<string, number> = {}
    const behMap: Record<string, number> = {}
    const conMap: Record<string, number> = {}

    for (const inc of filtered) {
      const day = inc.day_of_week || getDayOfWeek(inc.incident_date)
      if (day in dayMap) dayMap[day]++

      const tb = inc.time_band || (inc.incident_time ? getTimeBand(inc.incident_time) : null)
      if (tb && tb in timeBandMap) timeBandMap[tb]++

      for (const code of inc.antecedent_codes) {
        antMap[code] = (antMap[code] || 0) + 1
      }
      for (const code of inc.behaviour_codes) {
        behMap[code] = (behMap[code] || 0) + 1
      }
      for (const code of inc.consequence_codes) {
        conMap[code] = (conMap[code] || 0) + 1
      }
    }

    const toFreqList = (map: Record<string, number>, codeList?: CodeDefinition[]) =>
      Object.entries(map)
        .map(([key, count]) => ({ label: codeList ? getCodeLabel(key, codeList) : key, count }))
        .sort((a, b) => b.count - a.count)

    return {
      days: Object.entries(dayMap).map(([label, count]) => ({ label, count })),
      timeBands: Object.entries(timeBandMap).map(([label, count]) => ({ label, count })),
      antecedents: toFreqList(antMap, ANTECEDENT_CODES),
      behaviours: toFreqList(behMap, BEHAVIOUR_CODES),
      consequences: toFreqList(conMap, CONSEQUENCE_CODES),
    }
  }, [filtered])

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Loading trends...</div>
  }

  return (
    <div className="space-y-6">
      {/* View toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden w-fit">
        <button
          onClick={() => setView('trajectory')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === 'trajectory'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground hover:bg-muted'
          }`}
        >
          Trajectory
        </button>
        <button
          onClick={() => setView('compare')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === 'compare'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground hover:bg-muted'
          }`}
        >
          Compare Periods
        </button>
      </div>

      {view === 'compare' ? (
        <ComparePeriodsView incidents={incidents} periods={periods} />
      ) : (
        <>
          <ReviewPeriodSelector
            periods={periods}
            selectedId={selectedPeriodId}
            onSelect={handleSelectPeriod}
            onAdd={handleAddPeriod}
            onDelete={handleDeletePeriod}
          />

          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          {/* Trajectory chart — always shows full dataset regardless of review period filter */}
          <IncidentTrajectoryChart incidents={incidents} periods={periods} />

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Incidents</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-lg font-bold truncate">{stats.topAntecedent?.label ?? '—'}</p>
                <p className="text-xs text-muted-foreground">
                  Most Common Antecedent{stats.topAntecedent ? ` (${stats.topAntecedent.count})` : ''}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-lg font-bold truncate">{stats.topBehaviour?.label ?? '—'}</p>
                <p className="text-xs text-muted-foreground">
                  Most Common Behaviour{stats.topBehaviour ? ` (${stats.topBehaviour.count})` : ''}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-lg font-bold">{stats.topTimeBand?.label ?? '—'}</p>
                <p className="text-xs text-muted-foreground">
                  Peak Time Band{stats.topTimeBand ? ` (${stats.topTimeBand.count})` : ''}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown toggle */}
          <Button variant="outline" className="w-full" onClick={() => setShowBreakdown(!showBreakdown)}>
            {showBreakdown ? 'Hide full breakdown' : 'View full breakdown'}
          </Button>

          {showBreakdown && (
            <div className="space-y-6">
              <FreqTableDisplay title="Day of Week" data={breakdown.days} />
              <FreqTableDisplay title="Time Band" data={breakdown.timeBands} />
              <FreqTableDisplay title="Antecedent Frequency" data={breakdown.antecedents} />
              <FreqTableDisplay title="Behaviour Frequency" data={breakdown.behaviours} />
              <FreqTableDisplay title="Consequence Frequency" data={breakdown.consequences} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
