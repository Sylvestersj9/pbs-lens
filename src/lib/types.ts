export interface YoungPerson {
  id: string
  user_id: string
  initials: string
  home_name: string
  date_of_admission: string | null
  notes: string | null
  archived: boolean
  created_at: string
}

export interface Incident {
  id: string
  user_id: string
  young_person_id: string
  incident_date: string
  incident_time: string | null
  day_of_week: string | null
  time_band: string | null
  narrative: string
  antecedent_codes: string[]
  behaviour_codes: string[]
  consequence_codes: string[]
  staff_initials: string | null
  log_reference: string | null
  created_at: string
}

export interface Analysis {
  id: string
  user_id: string
  young_person_id: string
  content: string
  incident_count: number | null
  period_from: string | null
  period_to: string | null
  created_at: string
}

export interface PbsPlan {
  id: string
  user_id: string
  young_person_id: string
  enjoys: string | null
  important_to: string | null
  good_at: string | null
  helps_relax: string | null
  personal_risk_factors: string | null
  environmental_risk_factors: string | null
  slow_triggers: string | null
  fast_triggers: string | null
  behaviour_functions: BehaviourFunction[]
  protective_factors: ProtectiveFactor[]
  proactive_strategies: string | null
  active_strategies: string | null
  reactive_strategies: string | null
  updated_at: string
}

export interface BehaviourFunction {
  name: string
  description: string
  primary_function: string
  secondary_function: string
}

export interface ProtectiveFactor {
  title: string
  description: string
  how_to_use: string
}

export interface ReviewPeriod {
  id: string
  user_id: string
  young_person_id: string
  label: string
  date_from: string
  date_to: string
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  young_person_id: string
  content: string
  created_at: string
}

export interface Seizure {
  id: string
  user_id: string
  young_person_id: string
  date: string
  time: string | null
  day_of_week: string | null
  seizure_type: string | null
  duration_seconds: number | null
  notes: string | null
  created_at: string
}

export const SEIZURE_TYPES = [
  'Tonic-clonic',
  'Focal',
  'Absence',
  'Myoclonic',
  'Unknown/Unclassified',
] as const
