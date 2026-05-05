import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateIncident, useUpdateIncident, useIncident } from '@/hooks/useIncidents'
import {
  ANTECEDENT_CODES,
  BEHAVIOUR_CODES,
  CONSEQUENCE_CODES,
  getTimeBand,
  getDayOfWeek,
} from '@/lib/codeLists'
import { callClaude } from '@/lib/claude'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CodePillSelector from '@/components/CodePillSelector'
import ExpandableTextarea from '@/components/ExpandableTextarea'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function LogIncident() {
  const { id: youngPersonId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const { data: existingIncident } = useIncident(editId ?? '')
  const createIncident = useCreateIncident()
  const updateIncident = useUpdateIncident()

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState('')
  const [narrative, setNarrative] = useState('')
  const [staffInitials, setStaffInitials] = useState('')
  const [antecedents, setAntecedents] = useState<string[]>([])
  const [behaviours, setBehaviours] = useState<string[]>([])
  const [consequences, setConsequences] = useState<string[]>([])
  const [aiAntecedents, setAiAntecedents] = useState<string[]>([])
  const [aiBehaviours, setAiBehaviours] = useState<string[]>([])
  const [aiConsequences, setAiConsequences] = useState<string[]>([])
  const [suggesting, setSuggesting] = useState(false)

  useEffect(() => {
    if (existingIncident) {
      setDate(existingIncident.incident_date)
      setTime(existingIncident.incident_time ?? '')
      setNarrative(existingIncident.narrative)
      setStaffInitials(existingIncident.staff_initials ?? '')
      setAntecedents(existingIncident.antecedent_codes ?? [])
      setBehaviours(existingIncident.behaviour_codes ?? [])
      setConsequences(existingIncident.consequence_codes ?? [])
    }
  }, [existingIncident])

  const toggleCode = (
    code: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelected(
      selected.includes(code)
        ? selected.filter((c) => c !== code)
        : [...selected, code]
    )
  }

  const handleSuggest = async () => {
    setSuggesting(true)
    try {
      const validAntecedents = ANTECEDENT_CODES.map((c) => c.code).join(', ')
      const validBehaviours = BEHAVIOUR_CODES.map((c) => c.code).join(', ')
      const validConsequences = CONSEQUENCE_CODES.map((c) => c.code).join(', ')

      const response = await callClaude({
        model: 'claude-haiku-4-5-20251001',
        system: `You are a PBS (Positive Behaviour Support) coding assistant. Given a narrative about a behavioural incident, return ONLY valid JSON with suggested codes. Use ONLY these codes:
Antecedents: ${validAntecedents}
Behaviours: ${validBehaviours}
Consequences: ${validConsequences}

Return format: {"antecedents":["CODE"],"behaviours":["CODE"],"consequences":["CODE"]}
Return ONLY the JSON, no other text.`,
        messages: [{ role: 'user', content: narrative }],
        max_tokens: 200,
      })

      const parsed = JSON.parse(response)
      const suggestedA = (parsed.antecedents ?? []) as string[]
      const suggestedB = (parsed.behaviours ?? []) as string[]
      const suggestedC = (parsed.consequences ?? []) as string[]

      setAiAntecedents(suggestedA)
      setAiBehaviours(suggestedB)
      setAiConsequences(suggestedC)

      setAntecedents((prev) => [...new Set([...prev, ...suggestedA])])
      setBehaviours((prev) => [...new Set([...prev, ...suggestedB])])
      setConsequences((prev) => [...new Set([...prev, ...suggestedC])])

      toast.success('AI suggestions applied')
    } catch (e) {
      toast.error('Failed to get AI suggestions')
      console.error(e)
    } finally {
      setSuggesting(false)
    }
  }

  const handleSave = () => {
    if (!narrative.trim()) {
      toast.error('Please describe what happened')
      return
    }

    const dayOfWeek = getDayOfWeek(date)
    const timeBand = time ? getTimeBand(time) : null

    const payload = {
      young_person_id: youngPersonId!,
      incident_date: date,
      incident_time: time || null,
      day_of_week: dayOfWeek,
      time_band: timeBand,
      narrative,
      antecedent_codes: antecedents,
      behaviour_codes: behaviours,
      consequence_codes: consequences,
      staff_initials: staffInitials || null,
    }

    if (editId) {
      updateIncident.mutate(
        { id: editId, ...payload },
        { onSuccess: () => navigate(`/person/${youngPersonId}`) }
      )
    } else {
      createIncident.mutate(payload, {
        onSuccess: () => navigate(`/person/${youngPersonId}`),
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">
        {editId ? 'Edit Incident' : 'Log Incident'}
      </h1>

      {/* When */}
      <Card>
        <CardHeader>
          <CardTitle>When</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time (optional)</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What happened */}
      <Card>
        <CardHeader>
          <CardTitle>What happened</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExpandableTextarea
            value={narrative}
            onChange={setNarrative}
            label="Narrative"
            placeholder="Describe what happened in detail — include what led up to the incident, the young person's response, staff actions, and how the situation resolved..."
            rows={8}
          />
          <div className="space-y-2">
            <Label htmlFor="staffInitials">Staff initials</Label>
            <Input
              id="staffInitials"
              value={staffInitials}
              onChange={(e) => setStaffInitials(e.target.value)}
              placeholder="e.g. JD"
              className="w-32"
            />
          </div>
          {narrative.length >= 50 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSuggest}
              disabled={suggesting}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {suggesting ? 'Suggesting...' : 'Suggest codes from narrative'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Antecedents */}
      <Card>
        <CardHeader>
          <CardTitle>Antecedents</CardTitle>
        </CardHeader>
        <CardContent>
          <CodePillSelector
            codes={ANTECEDENT_CODES}
            selected={antecedents}
            onToggle={(code) => toggleCode(code, antecedents, setAntecedents)}
            aiSuggested={aiAntecedents}
            color="amber"
          />
        </CardContent>
      </Card>

      {/* Behaviours */}
      <Card>
        <CardHeader>
          <CardTitle>Behaviours</CardTitle>
        </CardHeader>
        <CardContent>
          <CodePillSelector
            codes={BEHAVIOUR_CODES}
            selected={behaviours}
            onToggle={(code) => toggleCode(code, behaviours, setBehaviours)}
            aiSuggested={aiBehaviours}
            color="red"
          />
        </CardContent>
      </Card>

      {/* Consequences */}
      <Card>
        <CardHeader>
          <CardTitle>Consequences</CardTitle>
        </CardHeader>
        <CardContent>
          <CodePillSelector
            codes={CONSEQUENCE_CODES}
            selected={consequences}
            onToggle={(code) => toggleCode(code, consequences, setConsequences)}
            aiSuggested={aiConsequences}
            color="indigo"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={createIncident.isPending || updateIncident.isPending}>
          {editId ? 'Update' : 'Save'}
        </Button>
        <Button variant="outline" onClick={() => navigate(`/person/${youngPersonId}`)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
