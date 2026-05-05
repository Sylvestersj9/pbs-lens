import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import type { CodeDefinition } from '@/lib/codeLists'

interface CodePillSelectorProps {
  codes: CodeDefinition[]
  selected: string[]
  onToggle: (code: string) => void
  aiSuggested?: string[]
  color: 'amber' | 'red' | 'indigo'
}

const colorMap = {
  amber: { active: 'bg-warning text-white hover:bg-warning/90', inactive: 'bg-warning/10 text-warning hover:bg-warning/20' },
  red: { active: 'bg-danger text-white hover:bg-danger/90', inactive: 'bg-danger/10 text-danger hover:bg-danger/20' },
  indigo: { active: 'bg-primary text-white hover:bg-primary/90', inactive: 'bg-primary/10 text-primary hover:bg-primary/20' },
}

export default function CodePillSelector({ codes, selected, onToggle, aiSuggested = [], color }: CodePillSelectorProps) {
  const [showDescriptions, setShowDescriptions] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {codes.map((c) => {
          const isSelected = selected.includes(c.code)
          const isAI = aiSuggested.includes(c.code)
          const styles = isSelected ? colorMap[color].active : colorMap[color].inactive

          return (
            <button
              key={c.code}
              type="button"
              onClick={() => onToggle(c.code)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${styles}`}
            >
              {c.code}
              {isAI && isSelected && (
                <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">AI</Badge>
              )}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => setShowDescriptions(!showDescriptions)}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {showDescriptions ? 'Hide descriptions' : 'See descriptions'}
      </button>
      {showDescriptions && (
        <div className="grid gap-1 text-sm">
          {codes.map((c) => (
            <div key={c.code} className="flex gap-2">
              <span className="font-medium w-8 shrink-0">{c.code}</span>
              <span className="text-muted-foreground">{c.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
