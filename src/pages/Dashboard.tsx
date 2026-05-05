import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, format } from 'date-fns'
import { Search, Users, AlertTriangle, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import StatusDot from '@/components/StatusDot'
import FloatingActionButton from '@/components/FloatingActionButton'
import EmptyState from '@/components/EmptyState'
import { useYoungPersons } from '@/hooks/useYoungPersons'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { BEHAVIOUR_CODES, getCodeLabel } from '@/lib/codeLists'
import type { Incident } from '@/lib/types'

type SortOption = 'recent' | 'most' | 'alpha'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: youngPersons = [], isLoading } = useYoungPersons()

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('recent')
  const [showArchived, setShowArchived] = useState(false)

  const monthStart = startOfMonth(new Date()).toISOString().split('T')[0]

  // Fetch incidents for current month
  const { data: monthIncidents = [] } = useQuery({
    queryKey: ['incidents-month', monthStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .gte('incident_date', monthStart)
      if (error) throw error
      return data as Incident[]
    },
  })

  // Fetch all incidents for last-incident-date
  const { data: allIncidents = [] } = useQuery({
    queryKey: ['incidents-all-dates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('id, young_person_id, incident_date')
        .order('incident_date', { ascending: false })
      if (error) throw error
      return data as Pick<Incident, 'id' | 'young_person_id' | 'incident_date'>[]
    },
  })

  // Derived data
  const incidentCountsByYP = useMemo(() => {
    const map: Record<string, number> = {}
    for (const inc of monthIncidents) {
      map[inc.young_person_id] = (map[inc.young_person_id] || 0) + 1
    }
    return map
  }, [monthIncidents])

  const lastIncidentByYP = useMemo(() => {
    const map: Record<string, string> = {}
    for (const inc of allIncidents) {
      if (!map[inc.young_person_id]) {
        map[inc.young_person_id] = inc.incident_date
      }
    }
    return map
  }, [allIncidents])

  const topBehaviourCode = useMemo(() => {
    const freq: Record<string, number> = {}
    for (const inc of monthIncidents) {
      for (const code of inc.behaviour_codes) {
        freq[code] = (freq[code] || 0) + 1
      }
    }
    let max = 0
    let top = ''
    for (const [code, count] of Object.entries(freq)) {
      if (count > max) {
        max = count
        top = code
      }
    }
    return top ? getCodeLabel(top, BEHAVIOUR_CODES) : 'None'
  }, [monthIncidents])

  // Filtering & sorting
  const hasArchived = youngPersons.some((yp) => yp.archived)

  const filtered = useMemo(() => {
    let list = youngPersons.filter((yp) => (showArchived ? true : !yp.archived))

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (yp) =>
          yp.initials.toLowerCase().includes(q) ||
          yp.home_name.toLowerCase().includes(q)
      )
    }

    list.sort((a, b) => {
      if (sort === 'alpha') return a.initials.localeCompare(b.initials)
      if (sort === 'most')
        return (incidentCountsByYP[b.id] || 0) - (incidentCountsByYP[a.id] || 0)
      // recent
      const dateA = lastIncidentByYP[a.id] || ''
      const dateB = lastIncidentByYP[b.id] || ''
      return dateB.localeCompare(dateA)
    })

    return list
  }, [youngPersons, showArchived, search, sort, incidentCountsByYP, lastIncidentByYP])

  // Extract first name from email
  const firstName = useMemo(() => {
    if (!user?.email) return 'Your'
    const local = user.email.split('@')[0]
    const name = local.replace(/[._-]/g, ' ').split(' ')[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  }, [user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6 pb-24">
      <h1 className="text-2xl font-bold">{firstName}&apos;s Dashboard</h1>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4 text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold">{youngPersons.filter((yp) => !yp.archived).length}</p>
          <p className="text-xs text-muted-foreground">Young People</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold">{monthIncidents.length}</p>
          <p className="text-xs text-muted-foreground">Incidents This Month</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-sm font-semibold mt-1">{topBehaviourCode}</p>
          <p className="text-xs text-muted-foreground">Top Behaviour</p>
        </div>
      </div>

      {/* Search and sort */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by initials or home..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="most">Most This Month</SelectItem>
            <SelectItem value="alpha">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Show archived toggle */}
      {hasArchived && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded"
          />
          Show archived
        </label>
      )}

      {/* Card grid or empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No young people yet"
          description="Add your first young person to start tracking incidents and behaviours."
          actionLabel="+ Add Young Person"
          onAction={() => navigate('/add')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((yp, index) => {
            const count = incidentCountsByYP[yp.id] || 0
            const lastDate = lastIncidentByYP[yp.id]

            return (
              <motion.div
                key={yp.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/person/${yp.id}`)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {yp.initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{yp.initials}</p>
                    <p className="text-sm text-muted-foreground truncate">{yp.home_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{count} this month</span>
                      {lastDate && <span>Last: {format(new Date(lastDate), 'dd MMM yyyy')}</span>}
                    </div>
                  </div>

                  {/* Status dot */}
                  <StatusDot
                    count={count}
                    onClick={() => navigate(`/person/${yp.id}?tab=trends`)}
                  />
                </CardContent>
              </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* FAB */}
      <FloatingActionButton label="Add Young Person" onClick={() => navigate('/add')} />
    </motion.div>
  )
}
