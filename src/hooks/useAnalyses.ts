import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Analysis } from '@/lib/types'
import { toast } from 'sonner'

export function useAnalyses(youngPersonId: string) {
  return useQuery({
    queryKey: ['analyses', youngPersonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('young_person_id', youngPersonId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Analysis[]
    },
    enabled: !!youngPersonId,
  })
}

export function useSaveAnalysis() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (analysis: Omit<Analysis, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('analyses')
        .insert({ ...analysis, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['analyses', data.young_person_id] })
      toast.success('Analysis saved')
    },
    onError: (e) => toast.error(e.message),
  })
}
