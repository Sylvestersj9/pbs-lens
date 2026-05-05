import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { X, Trash2 } from 'lucide-react'
import type { Note } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

interface NotesPanelProps {
  open: boolean
  onClose: () => void
  notes: Note[]
  onAdd: (content: string) => void
  onDelete: (id: string) => void
}

export default function NotesPanel({ open, onClose, notes, onAdd, onDelete }: NotesPanelProps) {
  const [content, setContent] = useState('')

  const handleSave = () => {
    if (content.trim()) {
      onAdd(content.trim())
      setContent('')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 flex flex-col shadow-xl"
          >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Notes</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="p-3 bg-background rounded-lg">
              <div className="flex items-start justify-between">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(note.created_at), 'dd MMM yyyy, HH:mm')}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={<Button variant="ghost" size="icon" className="h-6 w-6" />}
                  >
                    <Trash2 className="h-3 w-3" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete note?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(note.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a note..."
            className="min-h-[80px]"
          />
          <Button onClick={handleSave} disabled={!content.trim()} className="w-full">
            Save Note
          </Button>
        </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
