import { useState, useMemo } from 'react'
import { subMonths, format } from 'date-fns'
import { useIncidents } from '@/hooks/useIncidents'
import { useReviewPeriods, useCreateReviewPeriod, useDeleteReviewPeriod } from '@/hooks/useReviewPeriods'
import { ANTECEDENT_CODES, BEHAVIOUR_CODES, CONSEQUENCE_CODES, getCodeLabel, getTimeBand, getDayOfWeek } from '@/lib/codeLists'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ReviewPeriodSelector from '@/components/ReviewPeriodSelector'
import type { ReviewPeriod } from '@/lib/types'
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

export default function TrendsTab({ youngPersonId }: { youngPersonId: string }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const threeMonthsAgo = format(subMonths(new Date(), 3), 'yyyy-MM-dd')

  const [dateFrom, setDateFrom] = useState(threeMonthsAgo)
  const [dateTo, setDateTo] = useState(today)
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const { data: incidents = [] } = useIncidents(youngPersonId)
  const { data: periods = [] } = useReviewPeriods(youngPersonId)
  const createPeriod = useCreateReviewPeriod()
  const deletePeriod = useDeleteReviewPeriod()

  const handleSelectPeriod = (period: ReviewPeriod | null) => {
    if (period) {
      setSelectedPeriodId(period.id)
      setDateFrom(period.date_from)
      setDateTo(period.date_to)
    } else {
      setSelectedPeriodId(null)
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

  return (
    <div className="space-y-6">
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
    </div>
  )
}
