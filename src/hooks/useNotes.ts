import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Note } from '@/lib/types'
import { toast } from 'sonner'

export function useNotes(youngPersonId: string) {
  return useQuery({
    queryKey: ['notes', youngPersonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('young_person_id', youngPersonId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Note[]
    },
    enabled: !!youngPersonId,
  })
}

export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (note: Omit<Note, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('notes')
        .insert({ ...note, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['notes', data.young_person_id] })
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, youngPersonId }: { id: string; youngPersonId: string }) => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
      if (error) throw error
      return youngPersonId
    },
    onSuccess: (youngPersonId) => {
      qc.invalidateQueries({ queryKey: ['notes', youngPersonId] })
    },
    onError: (e) => toast.error(e.message),
  })
}
