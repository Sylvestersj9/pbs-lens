import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Trash2, Pencil, FileText, Filter } from 'lucide-react'
import { useIncidents, useDeleteIncidents } from '@/hooks/useIncidents'
import {
  ANTECEDENT_CODES,
  BEHAVIOUR_CODES,
  CONSEQUENCE_CODES,
  getCodeLabel,
  getTimeBand,
  getDayOfWeek,
} from '@/lib/codeLists'
import type { Incident } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import FloatingActionButton from '@/components/FloatingActionButton'
import EmptyState from '@/components/EmptyState'

interface IncidentsTabProps {
  youngPersonId: string
}

export default function IncidentsTab({ youngPersonId }: IncidentsTabProps) {
  const navigate = useNavigate()
  const { data: incidents = [], isLoading } = useIncidents(youngPersonId)
  const deleteIncidents = useDeleteIncidents()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterBehaviours, setFilterBehaviours] = useState<Set<string>>(new Set())
  const [filterAntecedents, setFilterAntecedents] = useState<Set<string>>(new Set())

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (dateFrom || dateTo) count++
    if (filterBehaviours.size > 0) count++
    if (filterAntecedents.size > 0) count++
    return count
  }, [dateFrom, dateTo, filterBehaviours, filterAntecedents])

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (dateFrom && inc.incident_date < dateFrom) return false
      if (dateTo && inc.incident_date > dateTo) return false
      if (filterBehaviours.size > 0 && !inc.behaviour_codes.some((c) => filterBehaviours.has(c))) return false
      if (filterAntecedents.size > 0 && !inc.antecedent_codes.some((c) => filterAntecedents.has(c))) return false
      return true
    })
  }, [incidents, dateFrom, dateTo, filterBehaviours, filterAntecedents])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === filteredIncidents.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredIncidents.map((i) => i.id)))
    }
  }

  const handleBulkDelete = () => {
    deleteIncidents.mutate(
      { ids: Array.from(selected), youngPersonId },
      { onSuccess: () => setSelected(new Set()) }
    )
  }

  const handleDeleteSingle = (id: string) => {
    deleteIncidents.mutate({ ids: [id], youngPersonId })
  }

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setFilterBehaviours(new Set())
    setFilterAntecedents(new Set())
  }

  const toggleFilterCode = (code: string, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading...</div>
  }

  if (incidents.length === 0) {
    return (
      <>
        <EmptyState
          icon={FileText}
          title="No incidents yet"
          description="Log an incident to start tracking patterns."
          actionLabel="Log Incident"
          onAction={() => navigate(`/person/${youngPersonId}/log`)}
        />
        <FloatingActionButton label="Log Incident" onClick={() => navigate(`/person/${youngPersonId}/log`)} />
      </>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
            {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
          <span className="ml-auto text-sm text-muted-foreground">
            {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {showFilters && (
          <div className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                placeholder="From"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                placeholder="To"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Behaviour</p>
              <div className="flex flex-wrap gap-1">
                {BEHAVIOUR_CODES.map((bc) => (
                  <button
                    key={bc.code}
                    onClick={() => toggleFilterCode(bc.code, setFilterBehaviours)}
                    className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                      filterBehaviours.has(bc.code)
                        ? 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {bc.code}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Antecedent</p>
              <div className="flex flex-wrap gap-1">
                {ANTECEDENT_CODES.map((ac) => (
                  <button
                    key={ac.code}
                    onClick={() => toggleFilterCode(ac.code, setFilterAntecedents)}
                    className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                      filterAntecedents.has(ac.code)
                        ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {ac.code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
              Delete selected
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selected.size} incident{selected.size !== 1 ? 's' : ''}?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Select all */}
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={selected.size === filteredIncidents.length && filteredIncidents.length > 0}
          onChange={selectAll}
          className="rounded"
        />
        Select all
      </label>

      {/* Incident cards */}
      <div className="space-y-2">
        {filteredIncidents.map((incident) => (
          <IncidentCard
            key={incident.id}
            incident={incident}
            expanded={expandedId === incident.id}
            onToggleExpand={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
            selected={selected.has(incident.id)}
            onToggleSelect={() => toggleSelect(incident.id)}
            onDelete={() => handleDeleteSingle(incident.id)}
            onEdit={() => navigate(`/person/${youngPersonId}/log?edit=${incident.id}`)}
          />
        ))}
      </div>

      <FloatingActionButton label="Log Incident" onClick={() => navigate(`/person/${youngPersonId}/log`)} />
    </div>
  )
}

function IncidentCard({
  incident,
  expanded,
  onToggleExpand,
  selected,
  onToggleSelect,
  onDelete,
  onEdit,
}: {
  incident: Incident
  expanded: boolean
  onToggleExpand: () => void
  selected: boolean
  onToggleSelect: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-start gap-2 p-3 cursor-pointer" onClick={onToggleExpand}>
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation()
            onToggleSelect()
          }}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 rounded"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {format(new Date(incident.incident_date), 'dd MMM yyyy')}
              {incident.incident_time && ` ${incident.incident_time.slice(0, 5)}`}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {getDayOfWeek(incident.incident_date)}
            {incident.incident_time && ` \u00B7 ${getTimeBand(incident.incident_time)}`}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {incident.behaviour_codes.map((code) => (
              <span
                key={code}
                className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              >
                {getCodeLabel(code, BEHAVIOUR_CODES)}
              </span>
            ))}
            {incident.antecedent_codes.map((code) => (
              <span
                key={code}
                className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
              >
                {getCodeLabel(code, ANTECEDENT_CODES)}
              </span>
            ))}
          </div>
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
          {incident.narrative && (
            <p className="text-sm mt-3 whitespace-pre-wrap">{incident.narrative}</p>
          )}

          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Antecedents</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {incident.antecedent_codes.map((code) => (
                  <span key={code} className="text-xs" title={ANTECEDENT_CODES.find(c => c.code === code)?.description}>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      {getCodeLabel(code, ANTECEDENT_CODES)}
                    </span>
                  </span>
                ))}
                {incident.antecedent_codes.length === 0 && <span className="text-xs text-muted-foreground">None recorded</span>}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Behaviours</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {incident.behaviour_codes.map((code) => (
                  <span key={code} className="text-xs" title={BEHAVIOUR_CODES.find(c => c.code === code)?.description}>
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      {getCodeLabel(code, BEHAVIOUR_CODES)}
                    </span>
                  </span>
                ))}
                {incident.behaviour_codes.length === 0 && <span className="text-xs text-muted-foreground">None recorded</span>}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Consequences</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {incident.consequence_codes.map((code) => (
                  <span key={code} className="text-xs" title={CONSEQUENCE_CODES.find(c => c.code === code)?.description}>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {getCodeLabel(code, CONSEQUENCE_CODES)}
                    </span>
                  </span>
                ))}
                {incident.consequence_codes.length === 0 && <span className="text-xs text-muted-foreground">None recorded</span>}
              </div>
            </div>
          </div>

          {incident.staff_initials && (
            <p className="text-xs text-muted-foreground">Staff: {incident.staff_initials}</p>
          )}

          {incident.log_reference && (
            <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              Ref: {incident.log_reference}
            </span>
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
                  <AlertDialogTitle>Delete this incident?</AlertDialogTitle>
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
