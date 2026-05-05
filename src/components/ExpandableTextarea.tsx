import { useRef, useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ExpandableTextareaProps {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  minLength?: number
  rows?: number
}

export default function ExpandableTextarea({ value, onChange, label, placeholder, minLength, rows }: ExpandableTextareaProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleFocus = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <button type="button" onClick={() => setModalOpen(true)} className="text-muted-foreground hover:text-foreground">
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        placeholder={placeholder}
        rows={rows}
        className={`${rows ? '' : 'min-h-[80px]'} resize-none`}
      />
      <div className="text-xs text-muted-foreground text-right">
        {value.length} characters{minLength ? ` (min ${minLength})` : ''}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 resize-none text-base"
          />
          <div className="text-xs text-muted-foreground text-right">
            {value.length} characters
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
