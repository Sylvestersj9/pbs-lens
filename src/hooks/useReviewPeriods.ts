import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ReviewPeriod } from '@/lib/types'
import { toast } from 'sonner'

export function useReviewPeriods(youngPersonId: string) {
  return useQuery({
    queryKey: ['review-periods', youngPersonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_periods')
        .select('*')
        .eq('young_person_id', youngPersonId)
        .order('date_from', { ascending: false })
      if (error) throw error
      return data as ReviewPeriod[]
    },
    enabled: !!youngPersonId,
  })
}

export function useCreateReviewPeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (period: Omit<ReviewPeriod, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('review_periods')
        .insert({ ...period, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['review-periods', data.young_person_id] })
      toast.success('Review period added')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeleteReviewPeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, youngPersonId }: { id: string; youngPersonId: string }) => {
      const { error } = await supabase
        .from('review_periods')
        .delete()
        .eq('id', id)
      if (error) throw error
      return youngPersonId
    },
    onSuccess: (youngPersonId) => {
      qc.invalidateQueries({ queryKey: ['review-periods', youngPersonId] })
      toast.success('Period deleted')
    },
    onError: (e) => toast.error(e.message),
  })
}
