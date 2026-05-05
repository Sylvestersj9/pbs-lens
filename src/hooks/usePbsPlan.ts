import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PbsPlan } from '@/lib/types'
import { toast } from 'sonner'

export function usePbsPlan(youngPersonId: string) {
  return useQuery({
    queryKey: ['pbs-plan', youngPersonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pbs_plans')
        .select('*')
        .eq('young_person_id', youngPersonId)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return (data as PbsPlan) || null
    },
    enabled: !!youngPersonId,
  })
}

export function useUpsertPbsPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (plan: Omit<PbsPlan, 'id' | 'user_id' | 'updated_at'> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const payload = { ...plan, user_id: user.id, updated_at: new Date().toISOString() }

      if (plan.id) {
        const { error } = await supabase
          .from('pbs_plans')
          .update(payload)
          .eq('id', plan.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('pbs_plans')
          .insert(payload)
        if (error) throw error
      }
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['pbs-plan', variables.young_person_id] })
      toast.success('PBS Plan saved')
    },
    onError: (e) => toast.error(e.message),
  })
}
