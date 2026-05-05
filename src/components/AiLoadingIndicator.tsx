import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface AiLoadingIndicatorProps {
  messages: string[]
  estimateSeconds: number
}

export default function AiLoadingIndicator({ messages, estimateSeconds }: AiLoadingIndicatorProps) {
  const [elapsed, setElapsed] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const cycle = setInterval(() => {
      setMessageIndex((i) => (i + 1) % messages.length)
    }, 3500)
    return () => clearInterval(cycle)
  }, [messages.length])

  const remaining = Math.max(0, estimateSeconds - elapsed)
  const progress = Math.min(100, (elapsed / estimateSeconds) * 100)

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
      <div className="text-center space-y-1">
        <p className="text-sm font-medium animate-pulse">{messages[messageIndex]}</p>
        <p className="text-xs text-muted-foreground">
          {remaining > 0
            ? `Estimated ${remaining}s remaining`
            : 'Almost done...'}
        </p>
      </div>
      <div className="w-48 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
