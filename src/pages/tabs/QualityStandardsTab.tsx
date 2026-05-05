import { useState, useMemo, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { useReviewPeriods } from '@/hooks/useReviewPeriods'
import { useQualityStandards, useUpsertQualityStandard } from '@/hooks/useQualityStandards'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

const REGULATIONS = [
  { code: 'Reg 6', label: 'Quality of care', description: 'The quality and purpose of care standard' },
  { code: 'Reg 7', label: 'Missing children', description: 'Children missing from home' },
  { code: 'Reg 8', label: 'Behaviour management', description: 'Promoting positive behaviour' },
  { code: 'Reg 9', label: 'Unauthorised absence', description: 'Arrangements for absence from the home' },
  { code: 'Reg 10', label: 'Restraint', description: 'Contact and access to communications' },
  { code: 'Reg 11', label: 'Complaints', description: 'The complaints standard' },
  { code: 'Reg 12', label: 'Notifications', description: 'Notifications to HMCI and local authority' },
  { code: 'Reg 14', label: 'Financial matters', description: 'Financial systems and records' },
] as const

const SCORE_LABELS: Record<number, string> = {
  1: 'Outstanding',
  2: 'Good',
  3: 'Requires Improvement',
  4: 'Inadequate',
}

const SCORE_COLORS: Record<number, string> = {
  1: 'bg-green-500 text-white',
  2: 'bg-blue-500 text-white',
  3: 'bg-amber-500 text-white',
  4: 'bg-red-500 text-white',
}

const SCORE_BORDER_COLORS: Record<number, string> = {
  1: 'border-green-500',
  2: 'border-blue-500',
  3: 'border-amber-500',
  4: 'border-red-500',
}

const SCORE_BG_LIGHT: Record<number, string> = {
  1: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  3: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  4: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

interface ScoreFormState {
  [regulation: string]: {
    id?: string
    score: number | null
    notes: string
  }
}

export default function QualityStandardsTab({ youngPersonId }: { youngPersonId: string }) {
  const { data: allScores = [], isLoading: scoresLoading } = useQualityStandards(youngPersonId)
  const { data: periods = [] } = useReviewPeriods(youngPersonId)
  const upsert = useUpsertQualityStandard()

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const [formState, setFormState] = useState<ScoreFormState>({})
  const [formInitialised, setFormInitialised] = useState<string | null>(null)

  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => a.date_from.localeCompare(b.date_from)),
    [periods]
  )

  // Get scores for the selected period
  const periodScores = useMemo(() => {
    if (selectedPeriodId === '__standalone__') {
      return allScores.filter((s) => !s.review_period_id)
    }
    return allScores.filter((s) => s.review_period_id === selectedPeriodId)
  }, [allScores, selectedPeriodId])

  // Init form when period changes
  const formKey = selectedPeriodId ?? '__none__'
  useEffect(() => {
    if (formInitialised === formKey) return
    const state: ScoreFormState = {}
    for (const reg of REGULATIONS) {
      const existing = periodScores.find((s) => s.regulation === reg.code)
      state[reg.code] = {
        id: existing?.id,
        score: existing?.score ?? null,
        notes: existing?.notes ?? '',
      }
    }
    setFormState(state)
    setFormInitialised(formKey)
  }, [periodScores, formKey, formInitialised])

  // Auto-select first period
  useEffect(() => {
    if (selectedPeriodId === null && sortedPeriods.length > 0) {
      setSelectedPeriodId(sortedPeriods[sortedPeriods.length - 1].id)
    }
  }, [sortedPeriods, selectedPeriodId])

  const setScore = (reg: string, score: number) => {
    setFormState((prev) => ({
      ...prev,
      [reg]: { ...prev[reg], score: prev[reg]?.score === score ? null : score },
    }))
  }

  const setNotes = (reg: string, notes: string) => {
    setFormState((prev) => ({
      ...prev,
      [reg]: { ...prev[reg], notes },
    }))
  }

  const handleSave = async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const reviewPeriodId = selectedPeriodId === '__standalone__' ? null : selectedPeriodId
    let saved = 0

    for (const reg of REGULATIONS) {
      const entry = formState[reg.code]
      if (!entry || entry.score == null) continue
      try {
        await upsert.mutateAsync({
          id: entry.id,
          young_person_id: youngPersonId,
          review_period_id: reviewPeriodId,
          regulation: reg.code,
          score: entry.score,
          notes: entry.notes.trim() || null,
          assessed_date: today,
        })
        saved++
      } catch {
        // error handled by mutation
      }
    }
    if (saved > 0) {
      toast.success(`${saved} score${saved !== 1 ? 's' : ''} saved`)
      setFormInitialised(null) // force re-init to pick up new IDs
    }
  }

  // Build heatmap data: regulation -> period -> score
  const heatmapData = useMemo(() => {
    const map: Record<string, Record<string, number>> = {}
    for (const reg of REGULATIONS) {
      map[reg.code] = {}
    }
    for (const s of allScores) {
      if (s.review_period_id && map[s.regulation]) {
        map[s.regulation][s.review_period_id] = s.score
      }
    }
    return map
  }, [allScores])

  const periodsWithScores = useMemo(() => {
    const idsWithScores = new Set(allScores.filter((s) => s.review_period_id).map((s) => s.review_period_id!))
    return sortedPeriods.filter((p) => idsWithScores.has(p.id))
  }, [sortedPeriods, allScores])

  if (scoresLoading) {
    return <div className="p-4 text-muted-foreground">Loading quality standards...</div>
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="space-y-2">
        <Select
          value={selectedPeriodId ?? '__standalone__'}
          onValueChange={(val) => {
            setSelectedPeriodId(val === '__standalone__' ? '__standalone__' : val)
            setFormInitialised(null)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select period">
              {selectedPeriodId === '__standalone__' || selectedPeriodId === null
                ? 'Standalone Assessment'
                : (() => {
                    const p = sortedPeriods.find((p) => p.id === selectedPeriodId)
                    return p
                      ? `${p.label.split(':')[0].trim()} (${format(parseISO(p.date_from), 'dd/MM/yy')} – ${format(parseISO(p.date_to), 'dd/MM/yy')})`
                      : 'Select period'
                  })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__standalone__">Standalone Assessment</SelectItem>
            {sortedPeriods.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label.split(':')[0].trim()} ({format(parseISO(p.date_from), 'dd/MM/yy')} – {format(parseISO(p.date_to), 'dd/MM/yy')})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Score form */}
      <div className="space-y-3">
        {REGULATIONS.map((reg) => {
          const entry = formState[reg.code]
          const currentScore = entry?.score
          return (
            <Card key={reg.code} className={currentScore ? `border-l-4 ${SCORE_BORDER_COLORS[currentScore]}` : ''}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="font-semibold text-sm">{reg.code}: {reg.label}</p>
                  <p className="text-xs text-muted-foreground">{reg.description}</p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {([1, 2, 3, 4] as const).map((score) => (
                    <button
                      key={score}
                      onClick={() => setScore(reg.code, score)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        currentScore === score
                          ? SCORE_COLORS[score]
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {SCORE_LABELS[score]}
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Notes (optional)"
                  value={entry?.notes ?? ''}
                  onChange={(e) => setNotes(reg.code, e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Button onClick={handleSave} disabled={upsert.isPending} className="w-full">
        {upsert.isPending ? 'Saving...' : 'Save Scores'}
      </Button>

      {/* Heatmap summary */}
      {periodsWithScores.length >= 1 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Progress Overview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 font-medium border-b border-border">Regulation</th>
                  {periodsWithScores.map((p) => (
                    <th key={p.id} className="text-center p-2 font-medium border-b border-border text-xs">
                      {p.label.split(':')[0].trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGULATIONS.map((reg) => (
                  <tr key={reg.code} className="border-b border-border">
                    <td className="p-2 text-xs font-medium">{reg.code}</td>
                    {periodsWithScores.map((p) => {
                      const score = heatmapData[reg.code]?.[p.id]
                      return (
                        <td key={p.id} className="p-1.5 text-center">
                          {score ? (
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SCORE_BG_LIGHT[score]}`}>
                              {SCORE_LABELS[score]}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
