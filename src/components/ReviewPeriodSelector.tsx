import { useState } from 'react'
import { format, addDays } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import type { ReviewPeriod } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ReviewPeriodSelectorProps {
  periods: ReviewPeriod[]
  selectedId: string | null
  onSelect: (period: ReviewPeriod | null) => void
  onAdd: (label: string, dateFrom: string, dateTo: string) => void
  onDelete: (id: string) => void
}

const PRESETS = [
  { key: '30day', label: '30-Day Assessment', days: 30 },
  { key: 'quarterly', label: 'Quarterly Review', days: 91 },
  { key: '6month', label: '6-Month Review', days: 182 },
  { key: 'annual', label: 'Annual Review', days: 365 },
  { key: 'custom', label: 'Custom', days: 0 },
] as const

export default function ReviewPeriodSelector({ periods, selectedId, onSelect, onAdd, onDelete }: ReviewPeriodSelectorProps) {
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activePreset, setActivePreset] = useState<string>('custom')

  const handlePreset = (preset: typeof PRESETS[number]) => {
    setActivePreset(preset.key)
    if (preset.key === 'custom') {
      setLabel('')
      setDateTo('')
      return
    }
    setLabel(preset.label)
    if (dateFrom && preset.days > 0) {
      const [y, m, d] = dateFrom.split('-').map(Number)
      const end = addDays(new Date(y, m - 1, d), preset.days)
      setDateTo(format(end, 'yyyy-MM-dd'))
    }
  }

  const handleDateFromChange = (val: string) => {
    setDateFrom(val)
    const preset = PRESETS.find((p) => p.key === activePreset)
    if (preset && preset.days > 0 && val) {
      const [y, m, d] = val.split('-').map(Number)
      const end = addDays(new Date(y, m - 1, d), preset.days)
      setDateTo(format(end, 'yyyy-MM-dd'))
    }
  }

  const handleAdd = () => {
    if (label && dateFrom && dateTo) {
      if (dateFrom > dateTo) return
      onAdd(label, dateFrom, dateTo)
      setAdding(false)
      setLabel('')
      setDateFrom('')
      setDateTo('')
      setActivePreset('custom')
    }
  }

  const handleCancel = () => {
    setAdding(false)
    setLabel('')
    setDateFrom('')
    setDateTo('')
    setActivePreset('custom')
  }

  return (
    <div className="space-y-2">
      <Select
        value={selectedId ?? 'custom'}
        onValueChange={(val) => {
          if (val === 'custom') {
            onSelect(null)
          } else {
            const period = periods.find((p) => p.id === val)
            if (period) onSelect(period)
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Review period">
            {selectedId
              ? (() => {
                  const p = periods.find((p) => p.id === selectedId)
                  return p ? `${p.label} (${format(new Date(p.date_from), 'dd/MM/yy')} – ${format(new Date(p.date_to), 'dd/MM/yy')})` : 'Review period'
                })()
              : 'Custom date range'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="custom">Custom date range</SelectItem>
          {periods.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label} ({format(new Date(p.date_from), 'dd/MM/yy')} – {format(new Date(p.date_to), 'dd/MM/yy')})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        {!adding && (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add period
          </Button>
        )}
        {selectedId && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(selectedId)} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        )}
      </div>

      {adding && (
        <div className="flex flex-col gap-2 p-3 border border-border rounded-lg">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                onClick={() => handlePreset(preset)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  activePreset === preset.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <Input placeholder="Period label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <div className="flex gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => handleDateFromChange(e.target.value)} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          {dateFrom && dateTo && dateFrom > dateTo && (
            <p className="text-xs text-destructive">Start date must be before end date</p>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!label || !dateFrom || !dateTo || dateFrom > dateTo}>Save</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}
