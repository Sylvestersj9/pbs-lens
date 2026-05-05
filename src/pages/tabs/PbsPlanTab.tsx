import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { usePbsPlan, useUpsertPbsPlan } from '@/hooks/usePbsPlan'
import { useIncidents } from '@/hooks/useIncidents'
import { getCodeLabel, ANTECEDENT_CODES, BEHAVIOUR_CODES, CONSEQUENCE_CODES } from '@/lib/codeLists'
import { callClaude } from '@/lib/claude'
import { exportPbsPlanPdf } from '@/lib/pdf'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { BehaviourFunction, ProtectiveFactor } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import ExpandableTextarea from '@/components/ExpandableTextarea'
import AiLoadingIndicator from '@/components/AiLoadingIndicator'
import { Download, Sparkles, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

function CollapsibleSection({ title, open, onToggle, children, badge }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode; badge?: string }) {
  return (
    <div className="border border-border rounded-lg">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left font-semibold">
        <span className="flex items-center gap-2">
          {title}
          {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
        </span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PbsPlanTab({ youngPersonId, youngPersonInitials }: { youngPersonId: string; youngPersonInitials: string }) {
  const { user } = useAuth()
  const { data: plan, isLoading } = usePbsPlan(youngPersonId)
  const { data: incidents } = useIncidents(youngPersonId)
  const upsert = useUpsertPbsPlan()

  const { data: profile } = useQuery({
    queryKey: ['user-profile-org', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('organisation')
        .eq('id', user!.id)
        .limit(1)
      return data?.[0] ?? null
    },
    enabled: !!user?.id,
  })

  const [openSection, setOpenSection] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [populating, setPopulating] = useState(false)

  // Form state
  const [enjoys, setEnjoys] = useState('')
  const [importantTo, setImportantTo] = useState('')
  const [goodAt, setGoodAt] = useState('')
  const [helpsRelax, setHelpsRelax] = useState('')
  const [personalRisk, setPersonalRisk] = useState('')
  const [environmentalRisk, setEnvironmentalRisk] = useState('')
  const [slowTriggers, setSlowTriggers] = useState('')
  const [fastTriggers, setFastTriggers] = useState('')
  const [behaviourFunctions, setBehaviourFunctions] = useState<BehaviourFunction[]>([])
  const [protectiveFactors, setProtectiveFactors] = useState<ProtectiveFactor[]>([])
  const [proactive, setProactive] = useState('')
  const [active, setActive] = useState('')
  const [reactive, setReactive] = useState('')

  // AI draft badges
  const [aiSections, setAiSections] = useState<Set<string>>(new Set())

  // Ref guard to populate form only once per young person
  const populatedRef = useRef<string | null>(null)

  useEffect(() => {
    if (plan && populatedRef.current !== youngPersonId) {
      populatedRef.current = youngPersonId
      setEnjoys(plan.enjoys || '')
      setImportantTo(plan.important_to || '')
      setGoodAt(plan.good_at || '')
      setHelpsRelax(plan.helps_relax || '')
      setPersonalRisk(plan.personal_risk_factors || '')
      setEnvironmentalRisk(plan.environmental_risk_factors || '')
      setSlowTriggers(plan.slow_triggers || '')
      setFastTriggers(plan.fast_triggers || '')
      setBehaviourFunctions(plan.behaviour_functions || [])
      setProtectiveFactors(plan.protective_factors || [])
      setProactive(plan.proactive_strategies || '')
      setActive(plan.active_strategies || '')
      setReactive(plan.reactive_strategies || '')
    }
  }, [plan])

  const handleSave = () => {
    upsert.mutate({
      id: plan?.id,
      young_person_id: youngPersonId,
      enjoys,
      important_to: importantTo,
      good_at: goodAt,
      helps_relax: helpsRelax,
      personal_risk_factors: personalRisk,
      environmental_risk_factors: environmentalRisk,
      slow_triggers: slowTriggers,
      fast_triggers: fastTriggers,
      behaviour_functions: behaviourFunctions,
      protective_factors: protectiveFactors,
      proactive_strategies: proactive,
      active_strategies: active,
      reactive_strategies: reactive,
    })
  }

  const handlePopulate = async () => {
    setConfirmOpen(false)
    if (!incidents || incidents.length < 3) return
    setPopulating(true)
    try {
      const incidentSummaries = incidents.map(i => ({
        date: i.incident_date,
        narrative: i.narrative,
        antecedents: i.antecedent_codes.map(c => getCodeLabel(c, ANTECEDENT_CODES)),
        behaviours: i.behaviour_codes.map(c => getCodeLabel(c, BEHAVIOUR_CODES)),
        consequences: i.consequence_codes.map(c => getCodeLabel(c, CONSEQUENCE_CODES)),
      }))

      const result = await callClaude({
        model: 'claude-sonnet-4-20250514',
        system: 'You are a PBS specialist. Analyse the incidents and return JSON only: {"slow_triggers":"text","fast_triggers":"text","behaviour_functions":[{"name":"","description":"","primary_function":"","secondary_function":""}],"protective_factors":[{"title":"","description":"","how_to_use":""}]}\n\nAdditional behaviour codes that may be present: VA (Verbal Aggression) — communicative distress expressed verbally; interpret as an expression of overwhelm, not deliberate aggression. RT (Rough and Tumble) — physical peer contact without aggressive intent. SM (Smearing) — complex behaviour with multiple possible functions including sensory seeking, communication of distress, or response to environmental stressors.',
        messages: [{ role: 'user', content: JSON.stringify(incidentSummaries) }],
        max_tokens: 2000,
      })

      const cleanJson = result.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim()
      const parsed = JSON.parse(cleanJson)
      setSlowTriggers(parsed.slow_triggers || '')
      setFastTriggers(parsed.fast_triggers || '')
      if (Array.isArray(parsed.behaviour_functions)) setBehaviourFunctions(parsed.behaviour_functions)
      if (Array.isArray(parsed.protective_factors)) setProtectiveFactors(parsed.protective_factors)

      setAiSections(new Set(['triggers', 'behaviour_functions', 'protective_factors']))
      toast.success('AI draft populated — please review and edit before saving')
    } catch (e) {
      toast.error('Something went wrong populating the plan. Please try again.')
    } finally {
      setPopulating(false)
    }
  }

  const handleExport = () => {
    try {
      exportPbsPlanPdf(youngPersonInitials, {
        enjoys,
        important_to: importantTo,
        good_at: goodAt,
        helps_relax: helpsRelax,
        personal_risk_factors: personalRisk,
        environmental_risk_factors: environmentalRisk,
        slow_triggers: slowTriggers,
        fast_triggers: fastTriggers,
        behaviour_functions: behaviourFunctions,
        protective_factors: protectiveFactors,
        proactive_strategies: proactive,
        active_strategies: active,
        reactive_strategies: reactive,
      }, profile?.organisation ?? undefined)
    } catch {
      toast.error('Failed to export PDF')
    }
  }

  const toggleSection = (idx: number) => setOpenSection(prev => prev === idx ? -1 : idx)

  // Behaviour functions helpers
  const addBehaviourFunction = () => setBehaviourFunctions(prev => [...prev, { name: '', description: '', primary_function: '', secondary_function: '' }])
  const removeBehaviourFunction = (idx: number) => setBehaviourFunctions(prev => prev.filter((_, i) => i !== idx))
  const updateBehaviourFunction = (idx: number, field: keyof BehaviourFunction, value: string) => {
    setBehaviourFunctions(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  // Protective factors helpers
  const addProtectiveFactor = () => setProtectiveFactors(prev => [...prev, { title: '', description: '', how_to_use: '' }])
  const removeProtectiveFactor = (idx: number) => setProtectiveFactors(prev => prev.filter((_, i) => i !== idx))
  const updateProtectiveFactor = (idx: number, field: keyof ProtectiveFactor, value: string) => {
    setProtectiveFactors(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading PBS Plan...</div>

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {plan?.updated_at ? `Last updated: ${format(new Date(plan.updated_at), 'dd MMM yyyy HH:mm')}` : 'No plan saved yet'}
        </span>
        <div className="flex gap-2">
          {!populating && (
            <Button
              variant="outline"
              size="sm"
              disabled={!incidents || incidents.length < 3}
              onClick={() => setConfirmOpen(true)}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Populate from incidents
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
        </div>
      </div>

      {populating && (
        <AiLoadingIndicator messages={['Reading incident history...', 'Identifying slow and fast triggers...', 'Mapping behaviour functions...', 'Identifying protective factors...', 'Drafting PBS plan sections...']} estimateSeconds={20} />
      )}

      {/* Sections */}
      <div className="space-y-2">
        {/* 1. Person-Centred Profile */}
        <CollapsibleSection title="Person-Centred Profile" open={openSection === 0} onToggle={() => toggleSection(0)}>
          <ExpandableTextarea label="Enjoys" value={enjoys} onChange={setEnjoys} placeholder="Activities, interests, people they enjoy..." />
          <ExpandableTextarea label="Important To" value={importantTo} onChange={setImportantTo} placeholder="What matters most to this person..." />
          <ExpandableTextarea label="Good At" value={goodAt} onChange={setGoodAt} placeholder="Strengths and skills..." />
          <ExpandableTextarea label="Helps Relax" value={helpsRelax} onChange={setHelpsRelax} placeholder="Calming activities and environments..." />
          <Button onClick={handleSave} disabled={upsert.isPending}>Save</Button>
        </CollapsibleSection>

        {/* 2. Risk Factors */}
        <CollapsibleSection title="Risk Factors" open={openSection === 1} onToggle={() => toggleSection(1)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ExpandableTextarea label="Personal Risk Factors" value={personalRisk} onChange={setPersonalRisk} placeholder="Internal risk factors..." />
            <ExpandableTextarea label="Environmental Risk Factors" value={environmentalRisk} onChange={setEnvironmentalRisk} placeholder="External risk factors..." />
          </div>
          <Button onClick={handleSave} disabled={upsert.isPending}>Save</Button>
        </CollapsibleSection>

        {/* 3. Triggers */}
        <CollapsibleSection
          title="Triggers"
          open={openSection === 2}
          onToggle={() => toggleSection(2)}
          badge={aiSections.has('triggers') ? 'AI draft — please review and edit before saving' : undefined}
        >
          <ExpandableTextarea label="Slow Triggers" value={slowTriggers} onChange={setSlowTriggers} placeholder="Background factors that build over time..." />
          <ExpandableTextarea label="Fast Triggers" value={fastTriggers} onChange={setFastTriggers} placeholder="Immediate triggers..." />
          <Button onClick={handleSave} disabled={upsert.isPending}>Save</Button>
        </CollapsibleSection>

        {/* 4. Behaviour Functions */}
        <CollapsibleSection
          title="Behaviour Functions"
          open={openSection === 3}
          onToggle={() => toggleSection(3)}
          badge={aiSections.has('behaviour_functions') ? 'AI draft — please review and edit before saving' : undefined}
        >
          {behaviourFunctions.map((bf, idx) => (
            <div key={idx} className="border border-border rounded p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Function {idx + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => removeBehaviourFunction(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <Input placeholder="Name" value={bf.name} onChange={e => updateBehaviourFunction(idx, 'name', e.target.value)} />
              <Input placeholder="Description" value={bf.description} onChange={e => updateBehaviourFunction(idx, 'description', e.target.value)} />
              <Input placeholder="Primary function" value={bf.primary_function} onChange={e => updateBehaviourFunction(idx, 'primary_function', e.target.value)} />
              <Input placeholder="Secondary function" value={bf.secondary_function} onChange={e => updateBehaviourFunction(idx, 'secondary_function', e.target.value)} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addBehaviourFunction}>
            <Plus className="h-4 w-4 mr-1" /> Add Function
          </Button>
          <div><Button onClick={handleSave} disabled={upsert.isPending}>Save</Button></div>
        </CollapsibleSection>

        {/* 5. Protective Factors */}
        <CollapsibleSection
          title="Protective Factors"
          open={openSection === 4}
          onToggle={() => toggleSection(4)}
          badge={aiSections.has('protective_factors') ? 'AI draft — please review and edit before saving' : undefined}
        >
          {protectiveFactors.map((pf, idx) => (
            <div key={idx} className="border border-border rounded p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Factor {idx + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => removeProtectiveFactor(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <Input placeholder="Title" value={pf.title} onChange={e => updateProtectiveFactor(idx, 'title', e.target.value)} />
              <Input placeholder="Description" value={pf.description} onChange={e => updateProtectiveFactor(idx, 'description', e.target.value)} />
              <Input placeholder="How to use" value={pf.how_to_use} onChange={e => updateProtectiveFactor(idx, 'how_to_use', e.target.value)} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addProtectiveFactor}>
            <Plus className="h-4 w-4 mr-1" /> Add Factor
          </Button>
          <div><Button onClick={handleSave} disabled={upsert.isPending}>Save</Button></div>
        </CollapsibleSection>

        {/* 6. Intervention Strategies */}
        <CollapsibleSection title="Intervention Strategies" open={openSection === 5} onToggle={() => toggleSection(5)}>
          <ExpandableTextarea label="Proactive Strategies" value={proactive} onChange={setProactive} placeholder="Strategies to prevent escalation..." />
          <ExpandableTextarea label="Active Strategies" value={active} onChange={setActive} placeholder="Strategies during early signs..." />
          <ExpandableTextarea label="Reactive Strategies" value={reactive} onChange={setReactive} placeholder="Strategies during crisis..." />
          <Button onClick={handleSave} disabled={upsert.isPending}>Save</Button>
        </CollapsibleSection>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Populate from incidents?</AlertDialogTitle>
            <AlertDialogDescription>
              This will use AI to analyse {incidents?.length || 0} incidents and pre-fill the Triggers, Behaviour Functions, and Protective Factors sections. Existing content in those sections will be overwritten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePopulate}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
