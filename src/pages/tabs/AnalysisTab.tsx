import { useState, useMemo } from 'react'
import { subMonths, format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import { useNavigate } from 'react-router-dom'
import { Copy, Download, FileText, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { useIncidents } from '@/hooks/useIncidents'
import { useAnalyses, useSaveAnalysis } from '@/hooks/useAnalyses'
import { useReviewPeriods, useCreateReviewPeriod, useDeleteReviewPeriod } from '@/hooks/useReviewPeriods'
import { ANTECEDENT_CODES, BEHAVIOUR_CODES, CONSEQUENCE_CODES, getCodeLabel, getTimeBand, getDayOfWeek } from '@/lib/codeLists'
import { callClaude } from '@/lib/claude'
import { exportAnalysisPdf } from '@/lib/pdf'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import AiLoadingIndicator from '@/components/AiLoadingIndicator'
import ReviewPeriodSelector from '@/components/ReviewPeriodSelector'
import type { ReviewPeriod } from '@/lib/types'
import type { Incident } from '@/lib/types'

function buildIncidentSummary(incidents: Incident[]): string {
  return incidents
    .map((inc) => {
      const timeBand = inc.time_band ?? (inc.incident_time ? getTimeBand(inc.incident_time) : 'Unknown')
      const dayOfWeek = inc.day_of_week ?? getDayOfWeek(inc.incident_date)
      const antecedents = inc.antecedent_codes
        .map((c) => `${c} (${getCodeLabel(c, ANTECEDENT_CODES)})`)
        .join(', ')
      const behaviours = inc.behaviour_codes
        .map((c) => `${c} (${getCodeLabel(c, BEHAVIOUR_CODES)})`)
        .join(', ')
      const consequences = inc.consequence_codes
        .map((c) => `${c} (${getCodeLabel(c, CONSEQUENCE_CODES)})`)
        .join(', ')

      return [
        `Date: ${inc.incident_date} ${inc.incident_time ?? ''} (${dayOfWeek}, ${timeBand})`,
        `Narrative: ${inc.narrative}`,
        `Antecedents: ${antecedents || 'None recorded'}`,
        `Behaviours: ${behaviours || 'None recorded'}`,
        `Consequences: ${consequences || 'None recorded'}`,
        `Staff: ${inc.staff_initials || 'Not recorded'}`,
        '---',
      ].join('\n')
    })
    .join('\n')
}

export default function AnalysisTab({ youngPersonId, youngPersonInitials }: { youngPersonId: string; youngPersonInitials: string }) {
  const navigate = useNavigate()
  const now = new Date()

  // Date range state
  const [dateFrom, setDateFrom] = useState(format(subMonths(now, 3), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(format(now, 'yyyy-MM-dd'))
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)

  // Generation state
  const [generatingDraft, setGeneratingDraft] = useState(false)
  const [generatingReg44, setGeneratingReg44] = useState(false)
  const [draftAnalysis, setDraftAnalysis] = useState<string | null>(null)
  const [reg44Summary, setReg44Summary] = useState<string | null>(null)
  const [showFullAnalysis, setShowFullAnalysis] = useState(false)

  // Hooks
  const { data: incidents = [] } = useIncidents(youngPersonId)
  const { data: analyses = [] } = useAnalyses(youngPersonId)
  const { data: periods = [] } = useReviewPeriods(youngPersonId)
  const createPeriod = useCreateReviewPeriod()
  const deletePeriod = useDeleteReviewPeriod()
  const saveAnalysis = useSaveAnalysis()

  // Filter incidents to date range
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => inc.incident_date >= dateFrom && inc.incident_date <= dateTo)
  }, [incidents, dateFrom, dateTo])

  const incidentCount = filteredIncidents.length
  const lastAnalysis = analyses.length > 0 ? analyses[0] : null

  // Review period handlers
  const handlePeriodSelect = (period: ReviewPeriod | null) => {
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

  // Generate Draft Analysis
  const handleGenerateDraft = async () => {
    setGeneratingDraft(true)
    setDraftAnalysis(null)
    try {
      const summary = buildIncidentSummary(filteredIncidents)
      const content = await callClaude({
        model: 'claude-sonnet-4-20250514',
        system: `You are an experienced Behaviour Analyst and PBS specialist working in UK children's residential care. You write clinical behaviour analysis reports that are evidence-based, trauma-informed, and grounded in PACE principles (Playfulness, Acceptance, Curiosity, Empathy), Polyvagal Theory (Porges, 2011), and NICE guidance on autism (CG170) where relevant. Your writing is clear, professional, and accessible. You write in flowing paragraphs, not bullet points. You interpret patterns clinically — not just counting frequencies but explaining what the data means for the young person's needs and how staff should respond. You never use the young person's full name — only their initials. Format section headings as: ## 1. Overview\n\nAdditional behaviour codes that may be present: PD (Property Damage) — sensory-driven behaviour, not primarily aggressive; functions as proprioceptive regulatory input; requires environmental management response not punitive response. AB (Absconding) — goal-directed behaviour toward preferred destination; high safety risk; requires environmental management and iPad activity monitoring as precursor signal. VA (Verbal Aggression) — communicative distress expressed verbally; interpret as an expression of overwhelm, not deliberate aggression. RT (Rough and Tumble) — physical peer contact without aggressive intent. SM (Smearing) — complex behaviour with multiple possible functions including sensory seeking, communication of distress, or response to environmental stressors.`,
        messages: [
          {
            role: 'user',
            content: `Write a behaviour analysis report for ${youngPersonInitials}. Period: ${format(new Date(dateFrom), 'dd MMM yyyy')} to ${format(new Date(dateTo), 'dd MMM yyyy')}. ${incidentCount} incidents recorded.\n\nIncident data:\n${summary}\n\nSections required:\n## 1. Overview\n## 2. Key Patterns\n## 3. Antecedent Analysis\n## 4. Behaviour Analysis\n## 5. Consequence Analysis\n## 6. Recommendations\n\nProvide 3-5 specific, actionable recommendations.`,
          },
        ],
        max_tokens: 4000,
      })
      setDraftAnalysis(content)
      // Save to database
      saveAnalysis.mutate({
        young_person_id: youngPersonId,
        content,
        incident_count: incidentCount,
        period_from: dateFrom,
        period_to: dateTo,
      })
    } catch {
      toast.error('Something went wrong generating the analysis. Please try again.')
    } finally {
      setGeneratingDraft(false)
    }
  }

  // Generate Reg 44 Summary
  const handleGenerateReg44 = async () => {
    setGeneratingReg44(true)
    setReg44Summary(null)
    try {
      const summary = buildIncidentSummary(filteredIncidents)
      const content = await callClaude({
        model: 'claude-haiku-4-5-20251001',
        system: `You are writing a behaviour incident summary for inclusion in a Regulation 44 independent visitor report for a children's residential home in England. Professional, evidence-based, suitable for a statutory document. Be concise. Frame staff responses positively where data supports this. Recommendations must be specific, actionable, forward-looking. Use initials only.\n\nAdditional behaviour codes that may be present: PD (Property Damage) — sensory-driven behaviour, not primarily aggressive; functions as proprioceptive regulatory input; requires environmental management response not punitive response. AB (Absconding) — goal-directed behaviour toward preferred destination; high safety risk; requires environmental management and iPad activity monitoring as precursor signal. VA (Verbal Aggression) — communicative distress expressed verbally; interpret as an expression of overwhelm, not deliberate aggression. RT (Rough and Tumble) — physical peer contact without aggressive intent. SM (Smearing) — complex behaviour with multiple possible functions including sensory seeking, communication of distress, or response to environmental stressors.`,
        messages: [
          {
            role: 'user',
            content: `Write a Reg 44 behaviour summary for ${youngPersonInitials}. Period: ${format(new Date(dateFrom), 'dd MMM yyyy')} to ${format(new Date(dateTo), 'dd MMM yyyy')}. ${incidentCount} incidents.\n\nIncident data:\n${summary}\n\nSections:\n## Incident Summary\n## Staff Response and Practice\n## Recommendations for Next Visit\n\nProvide 3-4 bullet point recommendations.`,
          },
        ],
        max_tokens: 2000,
      })
      setReg44Summary(content)
    } catch {
      toast.error('Something went wrong generating the Reg 44 summary. Please try again.')
    } finally {
      setGeneratingReg44(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const handleExportPdf = () => {
    if (draftAnalysis) {
      exportAnalysisPdf(youngPersonInitials, dateFrom, dateTo, incidentCount, draftAnalysis)
    }
  }

  // For partial display of analysis: show first 2 sections
  const getPartialAnalysis = (content: string) => {
    const sections = content.split(/(?=## \d+\.)/)
    return sections.slice(0, 3).join('') // intro text + first 2 numbered sections
  }

  return (
    <div className="space-y-6">
      {/* Review Period Selector */}
      <ReviewPeriodSelector
        periods={periods}
        selectedId={selectedPeriodId}
        onSelect={handlePeriodSelect}
        onAdd={handleAddPeriod}
        onDelete={handleDeletePeriod}
      />

      {/* Date range pickers */}
      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">From</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">To</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* Incident count */}
      <div className="flex items-center gap-2 text-sm">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span>{incidentCount} incident{incidentCount !== 1 ? 's' : ''} in this period</span>
      </div>

      {/* Last analysis date */}
      {lastAnalysis && (
        <p className="text-xs text-muted-foreground">
          Last analysis: {format(new Date(lastAnalysis.created_at), 'dd MMM yyyy')}
        </p>
      )}

      {/* Not enough incidents */}
      {incidentCount < 3 && (
        <div className="rounded-lg border border-border p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground mb-2">
            At least 3 incidents are needed to generate a meaningful analysis. Currently {incidentCount} in this period.
          </p>
          <Button
            variant="link"
            className="p-0 h-auto text-sm"
            onClick={() => navigate(`/person/${youngPersonId}/log`)}
          >
            Log an incident
          </Button>
        </div>
      )}

      {/* Generate buttons + empty state guidance */}
      {incidentCount >= 3 && !generatingDraft && !generatingReg44 && (
        <>
          {!draftAnalysis && !reg44Summary && !lastAnalysis && (
            <div className="rounded-lg border border-border bg-primary/5 p-5 text-center space-y-2">
              <Sparkles className="h-6 w-6 text-primary mx-auto" />
              <p className="text-sm font-medium">Ready to generate your first analysis</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                PBS Lens will read all {incidentCount} incidents in this period and produce a clinical behaviour analysis report grounded in PACE, Polyvagal Theory, and your coding framework. You can also generate a Reg 44 summary formatted for independent visitor reports.
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={handleGenerateDraft}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Draft Analysis
            </Button>
            <Button variant="outline" onClick={handleGenerateReg44}>
              Generate Reg 44 Summary
            </Button>
          </div>
        </>
      )}

      {generatingDraft && (
        <AiLoadingIndicator messages={['Reading incident patterns...', 'Identifying clinical themes...', 'Analysing antecedent triggers...', 'Mapping behaviour functions...', 'Evaluating staff responses...', 'Drafting clinical analysis...', 'Formulating recommendations...']} estimateSeconds={30} />
      )}

      {generatingReg44 && (
        <AiLoadingIndicator messages={['Reading incident data...', 'Summarising for Reg 44 format...', 'Assessing staff practice...', 'Drafting recommendations...']} estimateSeconds={15} />
      )}

      {/* Draft Analysis output */}
      {draftAnalysis && (
        <div className="border border-border rounded-lg bg-card shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 px-6 py-4 border-b border-border flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{youngPersonInitials}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(dateFrom), 'dd MMM yyyy')} – {format(new Date(dateTo), 'dd MMM yyyy')} · {incidentCount} incidents
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleCopy(draftAnalysis)}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPdf}>
                <Download className="h-4 w-4 mr-1" /> PDF
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-5 prose prose-sm dark:prose-invert max-w-none prose-headings:text-base prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3 prose-headings:border-b prose-headings:border-border prose-headings:pb-2 first:prose-headings:mt-0 prose-p:my-3 prose-p:leading-relaxed prose-strong:text-foreground">
            <ReactMarkdown>
              {showFullAnalysis ? draftAnalysis : getPartialAnalysis(draftAnalysis)}
            </ReactMarkdown>
          </div>

          <div className="px-6 py-3 border-t border-border">
            {!showFullAnalysis && (
              <Button variant="ghost" size="sm" onClick={() => setShowFullAnalysis(true)}>
                Show full analysis
              </Button>
            )}
            {showFullAnalysis && (
              <Button variant="ghost" size="sm" onClick={() => setShowFullAnalysis(false)}>
                Show less
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Reg 44 output */}
      {reg44Summary && (
        <div className="border border-border rounded-lg bg-card shadow-sm overflow-hidden">
          <div className="bg-primary/5 px-6 py-4 border-b border-border">
            <h3 className="text-lg font-bold text-foreground">Reg 44 Incident Summary</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {youngPersonInitials} · {format(new Date(dateFrom), 'dd MMM yyyy')} – {format(new Date(dateTo), 'dd MMM yyyy')} · {incidentCount} incidents
            </p>
          </div>
          <div className="px-4 sm:px-6 py-5 prose prose-sm dark:prose-invert max-w-none prose-headings:text-[15px] prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3 prose-headings:border-b prose-headings:border-border prose-headings:pb-2 first:prose-headings:mt-0 prose-p:my-3 prose-p:leading-relaxed prose-li:my-1.5 prose-ul:my-3 prose-ol:my-3 prose-strong:text-foreground">
            <ReactMarkdown>{reg44Summary}</ReactMarkdown>
          </div>
          <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-background/50">
            <p className="text-xs text-muted-foreground italic">
              Formatted for Reg 44 reporting — review before use
            </p>
            <Button variant="outline" size="sm" onClick={() => handleCopy(reg44Summary)}>
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
