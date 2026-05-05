import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateYoungPerson } from '@/hooks/useYoungPersons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AddYoungPerson() {
  const navigate = useNavigate()
  const createYP = useCreateYoungPerson()
  const [initials, setInitials] = useState('')
  const [homeName, setHomeName] = useState('')
  const [dateOfAdmission, setDateOfAdmission] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createYP.mutateAsync({
      initials: initials.toUpperCase(),
      home_name: homeName,
      date_of_admission: dateOfAdmission || null,
      notes: notes || null,
    })
    navigate('/')
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Add Young Person</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="initials">Initials</Label>
            <Input
              id="initials"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              maxLength={4}
              required
              placeholder="e.g. JD"
            />
            <p className="text-xs text-muted-foreground mt-1">Use initials only — no full names</p>
          </div>
          <div>
            <Label htmlFor="home">Home Name</Label>
            <Input
              id="home"
              value={homeName}
              onChange={(e) => setHomeName(e.target.value)}
              required
              placeholder="e.g. Maple House"
            />
          </div>
          <div>
            <Label htmlFor="admission">Date of Admission</Label>
            <Input
              id="admission"
              type="date"
              value={dateOfAdmission}
              onChange={(e) => setDateOfAdmission(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={createYP.isPending}>
              {createYP.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/')}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
