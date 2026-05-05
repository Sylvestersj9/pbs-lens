import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FABProps {
  label: string
  onClick: () => void
}

export default function FloatingActionButton({ label, onClick }: FABProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 rounded-full shadow-lg h-auto px-5 py-3 gap-2 z-50"
    >
      <Plus className="h-5 w-5" />
      {label}
    </Button>
  )
}
