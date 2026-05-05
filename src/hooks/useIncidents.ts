import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Incident } from '@/lib/types'
import { toast } from 'sonner'

export function useIncidents(youngPersonId: string) {
  return useQuery({
    queryKey: ['incidents', youngPersonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('young_person_id', youngPersonId)
        .order('incident_date', { ascending: false })
        .order('incident_time', { ascending: false })
      if (error) throw error
      return data as Incident[]
    },
    enabled: !!youngPersonId,
  })
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Incident
    },
    enabled: !!id,
  })
}

export function useCreateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (incident: Omit<Incident, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('incidents')
        .insert({ ...incident, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['incidents', data.young_person_id] })
      toast.success('Incident logged')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useUpdateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Incident> & { id: string }) => {
      const { data, error } = await supabase
        .from('incidents')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['incidents', data.young_person_id] })
      toast.success('Incident updated')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeleteIncidents() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids, youngPersonId }: { ids: string[]; youngPersonId: string }) => {
      const { error } = await supabase
        .from('incidents')
        .delete()
        .in('id', ids)
      if (error) throw error
      return youngPersonId
    },
    onSuccess: (youngPersonId) => {
      qc.invalidateQueries({ queryKey: ['incidents', youngPersonId] })
      toast.success('Deleted')
    },
    onError: (e) => toast.error(e.message),
  })
}
