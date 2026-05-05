import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Download } from 'lucide-react'
import type { Incident, ReviewPeriod } from '@/lib/types'
import { getCodeLabel, ANTECEDENT_CODES, BEHAVIOUR_CODES, CONSEQUENCE_CODES, type CodeDefinition } from '@/lib/codeLists'
import { exportFbaSummaryPdf, type FbaRow } from '@/lib/pdf'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

// Default function inference mapping
const FUNCTION_MAP: Record<string, string> = {
  PA: 'Escape / Demand avoidance',
  SH: 'Automatic / Sensory, Emotional regulation',
  SI: 'Automatic / Emotional regulation',
  DB: 'Attention / Tangible',
  AB: 'Escape / Attention',
  VA: 'Escape / Emotional regulation',
  RT: 'Tangible / Escape',
  PD: 'Sensory / Automatic',
  SB: 'Automatic / Sensory',
  SM: 'Automatic / Sensory',
  NO: 'Attention / Tangible',
}

interface FbaSummaryProps {
  open: boolean
  onClose: () => void
  incidents: Incident[]
  reviewPeriods: ReviewPeriod[]
  youngPersonInitials: string
  organisation?: string
}

interface FbaRowWithOverride extends FbaRow {
  code: string
  functionOverride: string | null
}

function getTopN(arr: string[], n: number, codeList: CodeDefinition[]): string[] {
  const counts: Record<string, number> = {}
  for (const code of arr) {
    counts[code] = (counts[code] || 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([code]) => getCodeLabel(code, codeList))
}

function computeTrend(code: string, incidents: Incident[], reviewPeriods: ReviewPeriod[]): string {
  if (reviewPeriods.length < 2) return 'Insufficient data'

  // Sort periods ascending by date_from
  const sorted = [...reviewPeriods].sort((a, b) => a.date_from.localeCompare(b.date_from))
  const last = sorted[sorted.length - 1]
  const prev = sorted[sorted.length - 2]

  const countInPeriod = (period: ReviewPeriod) =>
    incidents.filter(
      (i) =>
        i.behaviour_codes.includes(code) &&
        i.incident_date >= period.date_from &&
        i.incident_date <= period.date_to
    ).length

  const prevCount = countInPeriod(prev)
  const lastCount = countInPeriod(last)

  if (lastCount > prevCount) return 'Increasing'
  if (lastCount < prevCount) return 'Decreasing'
  return 'Stable'
}

export default function FbaSummary({ open, onClose, incidents, reviewPeriods, youngPersonInitials, organisation }: FbaSummaryProps) {
  const [overrides, setOverrides] = useState<Record<string, string>>({})

  const rows: FbaRowWithOverride[] = useMemo(() => {
    // Group incidents by behaviour code
    const behaviourMap: Record<string, { antecedents: string[]; consequences: string[]; count: number }> = {}

    for (const inc of incidents) {
      for (const bCode of inc.behaviour_codes) {
        if (!behaviourMap[bCode]) {
          behaviourMap[bCode] = { antecedents: [], consequences: [], count: 0 }
        }
        behaviourMap[bCode].count++
        behaviourMap[bCode].antecedents.push(...inc.antecedent_codes)
        behaviourMap[bCode].consequences.push(...inc.consequence_codes)
      }
    }

    return Object.entries(behaviourMap)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([code, data]) => ({
        code,
        behaviourCode: code,
        behaviourLabel: getCodeLabel(code, BEHAVIOUR_CODES),
        functions: overrides[code] ?? FUNCTION_MAP[code] ?? 'Unknown',
        functionOverride: overrides[code] ?? null,
        primaryAntecedents: getTopN(data.antecedents, 3, ANTECEDENT_CODES),
        primaryConsequences: getTopN(data.consequences, 3, CONSEQUENCE_CODES),
        frequency: data.count,
        trend: computeTrend(code, incidents, reviewPeriods),
      }))
  }, [incidents, reviewPeriods, overrides])

  const handleOverride = (code: string, value: string) => {
    setOverrides((prev) => ({ ...prev, [code]: value }))
  }

  const handleExport = () => {
    try {
      exportFbaSummaryPdf(youngPersonInitials, rows, organisation)
    } catch {
      toast.error('Failed to export PDF')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-[90vw] sm:max-w-[90vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{youngPersonInitials} — Functional Behaviour Assessment Summary</DialogTitle>
        </DialogHeader>

        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">No incident data available to generate an FBA summary.</p>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-muted-foreground">
                Based on {incidents.length} incidents · {format(new Date(), 'dd MMM yyyy')}
              </p>
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
                <Download className="h-4 w-4" /> Export PDF
              </Button>
            </div>

            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 font-medium border-b border-border min-w-[140px]">Behaviour</th>
                    <th className="text-left p-2 font-medium border-b border-border min-w-[180px]">Function</th>
                    <th className="text-left p-2 font-medium border-b border-border min-w-[180px]">Primary Antecedents</th>
                    <th className="text-left p-2 font-medium border-b border-border min-w-[180px]">Primary Consequences</th>
                    <th className="text-center p-2 font-medium border-b border-border min-w-[50px]">Freq.</th>
                    <th className="text-left p-2 font-medium border-b border-border min-w-[100px]">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.code} className="border-b border-border hover:bg-muted/30">
                      <td className="p-2 font-medium">
                        <span className="px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 mr-1">
                          {row.code}
                        </span>
                        {row.behaviourLabel}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.functions}
                          onChange={(e) => handleOverride(row.code, e.target.value)}
                          className="w-full bg-transparent border-b border-dashed border-muted-foreground/30 text-sm focus:outline-none focus:border-primary py-0.5"
                          title="Click to override inferred function"
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {row.primaryAntecedents.map((a) => (
                            <span key={a} className="px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                              {a}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {row.primaryConsequences.map((c) => (
                            <span key={c} className="px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 text-center font-mono">{row.frequency}</td>
                      <td className="p-2">
                        <TrendBadge trend={row.trend} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Functions are inferred from behaviour codes — click any function cell to override.
              Trend is calculated from the last two review periods.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function TrendBadge({ trend }: { trend: string }) {
  const colors: Record<string, string> = {
    Increasing: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    Decreasing: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    Stable: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${colors[trend] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
      {trend}
    </span>
  )
}
