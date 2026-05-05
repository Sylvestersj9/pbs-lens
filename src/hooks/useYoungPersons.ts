import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { YoungPerson } from '@/lib/types'
import { toast } from 'sonner'

export function useYoungPersons() {
  return useQuery({
    queryKey: ['young-persons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('young_persons')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as YoungPerson[]
    },
  })
}

export function useYoungPerson(id: string) {
  return useQuery({
    queryKey: ['young-persons', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('young_persons')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as YoungPerson
    },
    enabled: !!id,
  })
}

export function useCreateYoungPerson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (yp: Omit<YoungPerson, 'id' | 'user_id' | 'created_at' | 'archived'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('young_persons')
        .insert({ ...yp, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['young-persons'] })
      toast.success('Young person added')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useUpdateYoungPerson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<YoungPerson> & { id: string }) => {
      const { error } = await supabase
        .from('young_persons')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['young-persons'] })
      toast.success('Updated')
    },
    onError: (e) => toast.error(e.message),
  })
}
