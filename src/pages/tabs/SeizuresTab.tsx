import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, differenceInDays, parseISO } from 'date-fns'
import { Activity, ChevronDown, ChevronUp, Trash2, Pencil, Plus, X } from 'lucide-react'
import { useSeizures, useCreateSeizure, useUpdateSeizure, useDeleteSeizure } from '@/hooks/useSeizures'
import { SEIZURE_TYPES } from '@/lib/types'
import type { Seizure } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import EmptyState from '@/components/EmptyState'
import FloatingActionButton from '@/components/FloatingActionButton'

interface SeizuresTabProps {
  youngPersonId: string
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getDayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return DAY_NAMES[d.getDay()]
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  if (secs === 0) return `${mins}m`
  return `${mins}m ${secs}s`
}

export default function SeizuresTab({ youngPersonId }: SeizuresTabProps) {
  const { data: seizures = [], isLoading } = useSeizures(youngPersonId)
  const createSeizure = useCreateSeizure()
  const updateSeizure = useUpdateSeizure()
  const deleteSeizure = useDeleteSeizure()

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Form state
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formType, setFormType] = useState('')
  const [formDurationMin, setFormDurationMin] = useState('')
  const [formDurationSec, setFormDurationSec] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const resetForm = () => {
    setFormDate('')
    setFormTime('')
    setFormType('')
    setFormDurationMin('')
    setFormDurationSec('')
    setFormNotes('')
    setEditingId(null)
  }

  const openNew = () => {
    resetForm()
    setFormOpen(true)
  }

  const openEdit = (s: Seizure) => {
    setFormDate(s.date)
    setFormTime(s.time?.slice(0, 5) || '')
    setFormType(s.seizure_type || '')
    if (s.duration_seconds != null) {
      setFormDurationMin(String(Math.floor(s.duration_seconds / 60)))
      setFormDurationSec(String(s.duration_seconds % 60))
    } else {
      setFormDurationMin('')
      setFormDurationSec('')
    }
    setFormNotes(s.notes || '')
    setEditingId(s.id)
    setFormOpen(true)
  }

  const handleSave = () => {
    const durationMin = parseInt(formDurationMin) || 0
    const durationSec = parseInt(formDurationSec) || 0
    const totalSeconds = durationMin * 60 + durationSec

    const payload = {
      young_person_id: youngPersonId,
      date: formDate,
      time: formTime || null,
      day_of_week: formDate ? getDayOfWeek(formDate) : null,
      seizure_type: formType || null,
      duration_seconds: totalSeconds > 0 ? totalSeconds : null,
      notes: formNotes.trim() || null,
    }

    if (editingId) {
      updateSeizure.mutate(
        { id: editingId, ...payload },
        { onSuccess: () => { setFormOpen(false); resetForm() } }
      )
    } else {
      createSeizure.mutate(payload, {
        onSuccess: () => { setFormOpen(false); resetForm() },
      })
    }
  }

  // Summary stats
  const summary = useMemo(() => {
    if (seizures.length === 0) return null
    const total = seizures.length
    const mostRecent = seizures[0] // already sorted desc
    const daysSince = differenceInDays(new Date(), parseISO(mostRecent.date))
    const typeCounts: Record<string, number> = {}
    for (const s of seizures) {
      const t = s.seizure_type || 'Unknown'
      typeCounts[t] = (typeCounts[t] || 0) + 1
    }
    const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0]
    return { total, mostRecentDate: mostRecent.date, daysSince, mostCommonType }
  }, [seizures])

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading...</div>
  }

  if (seizures.length === 0) {
    return (
      <>
        <EmptyState
          icon={Activity}
          title="No seizures logged"
          description="Log a seizure to start tracking medical events."
          actionLabel="Log Seizure"
          onAction={openNew}
        />
        <FloatingActionButton label="Log Seizure" onClick={openNew} />
        <SeizureFormDialog
          open={formOpen}
          onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm() }}
          editing={!!editingId}
          formDate={formDate} setFormDate={setFormDate}
          formTime={formTime} setFormTime={setFormTime}
          formType={formType} setFormType={setFormType}
          formDurationMin={formDurationMin} setFormDurationMin={setFormDurationMin}
          formDurationSec={formDurationSec} setFormDurationSec={setFormDurationSec}
          formNotes={formNotes} setFormNotes={setFormNotes}
          onSave={handleSave}
          saving={createSeizure.isPending || updateSeizure.isPending}
        />
      </>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary card */}
      {summary && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold">{summary.total}</p>
              <p className="text-xs text-muted-foreground">Total seizures</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.daysSince}</p>
              <p className="text-xs text-muted-foreground">Days since last</p>
            </div>
            <div>
              <p className="text-sm font-semibold">{format(parseISO(summary.mostRecentDate), 'dd MMM yyyy')}</p>
              <p className="text-xs text-muted-foreground">Most recent</p>
            </div>
            <div>
              <p className="text-sm font-semibold">{summary.mostCommonType}</p>
              <p className="text-xs text-muted-foreground">Most common type</p>
            </div>
          </div>
        </div>
      )}

      {/* Seizure cards */}
      <div className="space-y-2">
        {seizures.map((seizure) => (
          <SeizureCard
            key={seizure.id}
            seizure={seizure}
            expanded={expandedId === seizure.id}
            onToggleExpand={() => setExpandedId(expandedId === seizure.id ? null : seizure.id)}
            onEdit={() => openEdit(seizure)}
            onDelete={() => deleteSeizure.mutate({ id: seizure.id, youngPersonId })}
          />
        ))}
      </div>

      <FloatingActionButton label="Log Seizure" onClick={openNew} />

      <SeizureFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm() }}
        editing={!!editingId}
        formDate={formDate} setFormDate={setFormDate}
        formTime={formTime} setFormTime={setFormTime}
        formType={formType} setFormType={setFormType}
        formDurationMin={formDurationMin} setFormDurationMin={setFormDurationMin}
        formDurationSec={formDurationSec} setFormDurationSec={setFormDurationSec}
        formNotes={formNotes} setFormNotes={setFormNotes}
        onSave={handleSave}
        saving={createSeizure.isPending || updateSeizure.isPending}
      />
    </div>
  )
}

function SeizureCard({
  seizure,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  seizure: Seizure
  expanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-start gap-2 p-3 cursor-pointer" onClick={onToggleExpand}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {format(parseISO(seizure.date), 'dd MMM yyyy')}
              {seizure.time && ` ${seizure.time.slice(0, 5)}`}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {seizure.day_of_week}
            {seizure.duration_seconds != null && ` · ${formatDuration(seizure.duration_seconds)}`}
          </div>
          {seizure.seizure_type && (
            <div className="mt-2">
              <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                {seizure.seizure_type}
              </span>
            </div>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 mt-1 shrink-0" /> : <ChevronDown className="h-4 w-4 mt-1 shrink-0" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 space-y-3 border-t border-border">
              {seizure.notes && (
                <p className="text-sm mt-3 whitespace-pre-wrap">{seizure.notes}</p>
              )}

              {seizure.duration_seconds != null && (
                <p className="text-xs text-muted-foreground">
                  Duration: {formatDuration(seizure.duration_seconds)}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={onEdit} className="gap-1">
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="outline" size="sm" className="gap-1 text-destructive" />}>
                    <Trash2 className="h-3 w-3" /> Delete
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this seizure record?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SeizureFormDialog({
  open,
  onOpenChange,
  editing,
  formDate, setFormDate,
  formTime, setFormTime,
  formType, setFormType,
  formDurationMin, setFormDurationMin,
  formDurationSec, setFormDurationSec,
  formNotes, setFormNotes,
  onSave,
  saving,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: boolean
  formDate: string; setFormDate: (v: string) => void
  formTime: string; setFormTime: (v: string) => void
  formType: string; setFormType: (v: string) => void
  formDurationMin: string; setFormDurationMin: (v: string) => void
  formDurationSec: string; setFormDurationSec: (v: string) => void
  formNotes: string; setFormNotes: (v: string) => void
  onSave: () => void
  saving: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Seizure' : 'Log Seizure'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seizure-date">Date *</Label>
            <Input
              id="seizure-date"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seizure-time">Time</Label>
            <Input
              id="seizure-time"
              type="time"
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seizure-type">Seizure Type</Label>
            <select
              id="seizure-type"
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select type...</option>
              {SEIZURE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Duration</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formDurationMin}
                onChange={(e) => setFormDurationMin(e.target.value)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">min</span>
              <Input
                type="number"
                min="0"
                max="59"
                placeholder="0"
                value={formDurationSec}
                onChange={(e) => setFormDurationSec(e.target.value)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">sec</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seizure-notes">Notes</Label>
            <Textarea
              id="seizure-notes"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="min-h-[120px]"
              placeholder="Describe what happened before, during and after the seizure. Note any first aid given, whether ambulance was called, and any post-ictal observations."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSave} disabled={!formDate || saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
