import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface QualityStandardScore {
  id: string
  user_id: string
  young_person_id: string
  review_period_id: string | null
  regulation: string
  score: number
  notes: string | null
  assessed_date: string
  created_at: string
}

export function useQualityStandards(youngPersonId: string) {
  return useQuery({
    queryKey: ['quality-standards', youngPersonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quality_standards_scores')
        .select('*')
        .eq('young_person_id', youngPersonId)
        .order('assessed_date', { ascending: false })
      if (error) throw error
      return data as QualityStandardScore[]
    },
    enabled: !!youngPersonId,
  })
}

export function useQualityStandardsByPeriod(reviewPeriodId: string | null) {
  return useQuery({
    queryKey: ['quality-standards-period', reviewPeriodId],
    queryFn: async () => {
      let query = supabase
        .from('quality_standards_scores')
        .select('*')
      if (reviewPeriodId) {
        query = query.eq('review_period_id', reviewPeriodId)
      } else {
        query = query.is('review_period_id', null)
      }
      const { data, error } = await query.order('regulation')
      if (error) throw error
      return data as QualityStandardScore[]
    },
    enabled: reviewPeriodId !== undefined,
  })
}

export function useUpsertQualityStandard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      id?: string
      young_person_id: string
      review_period_id: string | null
      regulation: string
      score: number
      notes: string | null
      assessed_date: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (payload.id) {
        const { data, error } = await supabase
          .from('quality_standards_scores')
          .update({
            score: payload.score,
            notes: payload.notes,
            assessed_date: payload.assessed_date,
          })
          .eq('id', payload.id)
          .select()
          .single()
        if (error) throw error
        return data
      } else {
        const { data, error } = await supabase
          .from('quality_standards_scores')
          .insert({ ...payload, user_id: user.id })
          .select()
          .single()
        if (error) throw error
        return data
      }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['quality-standards', data.young_person_id] })
      qc.invalidateQueries({ queryKey: ['quality-standards-period'] })
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeleteQualityStandard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, youngPersonId }: { id: string; youngPersonId: string }) => {
      const { error } = await supabase
        .from('quality_standards_scores')
        .delete()
        .eq('id', id)
      if (error) throw error
      return youngPersonId
    },
    onSuccess: (youngPersonId) => {
      qc.invalidateQueries({ queryKey: ['quality-standards', youngPersonId] })
      qc.invalidateQueries({ queryKey: ['quality-standards-period'] })
      toast.success('Score deleted')
    },
    onError: (e) => toast.error(e.message),
  })
}
