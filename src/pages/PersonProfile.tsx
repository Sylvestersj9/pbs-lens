import { useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Archive, StickyNote } from 'lucide-react'
import { useYoungPerson, useUpdateYoungPerson } from '@/hooks/useYoungPersons'
import { useNotes, useCreateNote, useDeleteNote } from '@/hooks/useNotes'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import NotesPanel from '@/components/NotesPanel'
import IncidentsTab from '@/pages/tabs/IncidentsTab'
import TrendsTab from '@/pages/tabs/TrendsTab'
import AnalysisTab from '@/pages/tabs/AnalysisTab'
import PbsPlanTab from '@/pages/tabs/PbsPlanTab'
import SeizuresTab from '@/pages/tabs/SeizuresTab'
import QualityStandardsTab from '@/pages/tabs/QualityStandardsTab'

export default function PersonProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentTab = searchParams.get('tab') || 'incidents'

  const { data: yp, isLoading } = useYoungPerson(id!)
  const updateYp = useUpdateYoungPerson()
  const { data: notes = [] } = useNotes(id!)
  const createNote = useCreateNote()
  const deleteNote = useDeleteNote()

  const [editOpen, setEditOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [editInitials, setEditInitials] = useState('')
  const [editHomeName, setEditHomeName] = useState('')
  const [editDoa, setEditDoa] = useState('')
  const [editNotes, setEditNotes] = useState('')

  if (isLoading || !yp) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const openEdit = () => {
    setEditInitials(yp.initials)
    setEditHomeName(yp.home_name)
    setEditDoa(yp.date_of_admission || '')
    setEditNotes(yp.notes || '')
    setEditOpen(true)
  }

  const isSaving = updateYp.isPending

  const saveEdit = () => {
    updateYp.mutate(
      {
        id: yp.id,
        initials: editInitials,
        home_name: editHomeName,
        date_of_admission: editDoa || null,
        notes: editNotes || null,
      },
      { onSuccess: () => setEditOpen(false) }
    )
  }

  const handleArchive = () => {
    updateYp.mutate({ id: yp.id, archived: true }, { onSuccess: () => navigate('/') })
  }

  const handleRestore = () => {
    updateYp.mutate({ id: yp.id, archived: false })
  }

  const handleTabChange = (value: string | number | null) => {
    if (value) {
      setSearchParams({ tab: String(value) })
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
              {yp.initials}
            </div>
            <div>
              <h1 className="text-xl font-bold">{yp.initials}</h1>
              <p className="text-sm text-muted-foreground">{yp.home_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={openEdit} className="gap-1">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
        {yp.archived ? (
          <Button variant="outline" size="sm" onClick={handleRestore} disabled={isSaving} className="gap-1">
            <Archive className="h-3.5 w-3.5" /> Restore
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline" size="sm" className="gap-1" />}>
              <Archive className="h-3.5 w-3.5" /> Archive
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive {yp.initials}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will hide them from your dashboard. You can restore from their profile.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button variant="outline" size="sm" onClick={() => setNotesOpen(true)} className="gap-1">
          <StickyNote className="h-3.5 w-3.5" /> Notes
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="w-full">
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="pbs-plan">PBS Plan</TabsTrigger>
          <TabsTrigger value="seizures">Seizures</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>
        <TabsContent value="incidents">
          <IncidentsTab youngPersonId={yp.id} />
        </TabsContent>
        <TabsContent value="trends">
          <TrendsTab youngPersonId={yp.id} />
        </TabsContent>
        <TabsContent value="analysis">
          <AnalysisTab youngPersonId={yp.id} youngPersonInitials={yp.initials} />
        </TabsContent>
        <TabsContent value="pbs-plan">
          <PbsPlanTab youngPersonId={yp.id} youngPersonInitials={yp.initials} />
        </TabsContent>
        <TabsContent value="seizures">
          <SeizuresTab youngPersonId={yp.id} />
        </TabsContent>
        <TabsContent value="quality">
          <QualityStandardsTab youngPersonId={yp.id} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Young Person</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-initials">Initials</Label>
              <Input
                id="edit-initials"
                value={editInitials}
                onChange={(e) => setEditInitials(e.target.value)}
                maxLength={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-home">Home Name</Label>
              <Input
                id="edit-home"
                value={editHomeName}
                onChange={(e) => setEditHomeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-doa">Date of Admission</Label>
              <Input
                id="edit-doa"
                type="date"
                value={editDoa}
                onChange={(e) => setEditDoa(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveEdit} disabled={!editInitials.trim() || !editHomeName.trim() || isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Panel */}
      <NotesPanel
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        notes={notes}
        onAdd={(content) => createNote.mutate({ young_person_id: id!, content })}
        onDelete={(noteId) => deleteNote.mutate({ id: noteId, youngPersonId: id! })}
      />
    </motion.div>
  )
}
