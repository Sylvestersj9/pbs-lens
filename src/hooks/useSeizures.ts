import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Seizure } from '@/lib/types'
import { toast } from 'sonner'

export function useSeizures(youngPersonId: string) {
  return useQuery({
    queryKey: ['seizures', youngPersonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seizures')
        .select('*')
        .eq('young_person_id', youngPersonId)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
      if (error) throw error
      return data as Seizure[]
    },
    enabled: !!youngPersonId,
  })
}

export function useCreateSeizure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (seizure: Omit<Seizure, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('seizures')
        .insert({ ...seizure, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['seizures', data.young_person_id] })
      toast.success('Seizure logged')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useUpdateSeizure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Seizure> & { id: string }) => {
      const { data, error } = await supabase
        .from('seizures')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['seizures', data.young_person_id] })
      toast.success('Seizure updated')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeleteSeizure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, youngPersonId }: { id: string; youngPersonId: string }) => {
      const { error } = await supabase
        .from('seizures')
        .delete()
        .eq('id', id)
      if (error) throw error
      return youngPersonId
    },
    onSuccess: (youngPersonId) => {
      qc.invalidateQueries({ queryKey: ['seizures', youngPersonId] })
      toast.success('Seizure deleted')
    },
    onError: (e) => toast.error(e.message),
  })
}
