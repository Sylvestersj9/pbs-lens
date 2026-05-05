import { useState } from 'react'
import { format } from 'date-fns'
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

export default function ReviewPeriodSelector({ periods, selectedId, onSelect, onAdd, onDelete }: ReviewPeriodSelectorProps) {
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const handleAdd = () => {
    if (label && dateFrom && dateTo) {
      if (dateFrom > dateTo) {
        return // Start date must be before end date
      }
      onAdd(label, dateFrom, dateTo)
      setAdding(false)
      setLabel('')
      setDateFrom('')
      setDateTo('')
    }
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
          <Input placeholder="Period label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <div className="flex gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          {dateFrom && dateTo && dateFrom > dateTo && (
            <p className="text-xs text-destructive">Start date must be before end date</p>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!label || !dateFrom || !dateTo || dateFrom > dateTo}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}
