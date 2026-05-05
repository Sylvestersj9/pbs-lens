-- Young Persons
create table young_persons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  initials text not null,
  home_name text not null,
  date_of_admission date,
  notes text,
  archived boolean default false,
  created_at timestamptz default now()
);

alter table young_persons enable row level security;

create policy "Users can view own young persons"
  on young_persons for select using (auth.uid() = user_id);
create policy "Users can insert own young persons"
  on young_persons for insert with check (auth.uid() = user_id);
create policy "Users can update own young persons"
  on young_persons for update using (auth.uid() = user_id);
create policy "Users can delete own young persons"
  on young_persons for delete using (auth.uid() = user_id);

-- Incidents
create table incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  young_person_id uuid references young_persons not null,
  incident_date date not null,
  incident_time text,
  day_of_week text,
  time_band text,
  narrative text not null,
  antecedent_codes text[],
  behaviour_codes text[],
  consequence_codes text[],
  staff_initials text,
  created_at timestamptz default now()
);

alter table incidents enable row level security;

create policy "Users can view own incidents"
  on incidents for select using (auth.uid() = user_id);
create policy "Users can insert own incidents"
  on incidents for insert with check (auth.uid() = user_id);
create policy "Users can update own incidents"
  on incidents for update using (auth.uid() = user_id);
create policy "Users can delete own incidents"
  on incidents for delete using (auth.uid() = user_id);

-- Analyses
create table analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  young_person_id uuid references young_persons not null,
  content text not null,
  incident_count integer,
  period_from date,
  period_to date,
  created_at timestamptz default now()
);

alter table analyses enable row level security;

create policy "Users can view own analyses"
  on analyses for select using (auth.uid() = user_id);
create policy "Users can insert own analyses"
  on analyses for insert with check (auth.uid() = user_id);
create policy "Users can update own analyses"
  on analyses for update using (auth.uid() = user_id);
create policy "Users can delete own analyses"
  on analyses for delete using (auth.uid() = user_id);

-- PBS Plans
create table pbs_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  young_person_id uuid references young_persons not null,
  enjoys text,
  important_to text,
  good_at text,
  helps_relax text,
  personal_risk_factors text,
  environmental_risk_factors text,
  slow_triggers text,
  fast_triggers text,
  behaviour_functions jsonb default '[]',
  protective_factors jsonb default '[]',
  proactive_strategies text,
  active_strategies text,
  reactive_strategies text,
  updated_at timestamptz default now()
);

alter table pbs_plans enable row level security;

create policy "Users can view own pbs plans"
  on pbs_plans for select using (auth.uid() = user_id);
create policy "Users can insert own pbs plans"
  on pbs_plans for insert with check (auth.uid() = user_id);
create policy "Users can update own pbs plans"
  on pbs_plans for update using (auth.uid() = user_id);
create policy "Users can delete own pbs plans"
  on pbs_plans for delete using (auth.uid() = user_id);

-- Review Periods
create table review_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  young_person_id uuid references young_persons not null,
  label text not null,
  date_from date not null,
  date_to date not null,
  created_at timestamptz default now()
);

alter table review_periods enable row level security;

create policy "Users can view own review periods"
  on review_periods for select using (auth.uid() = user_id);
create policy "Users can insert own review periods"
  on review_periods for insert with check (auth.uid() = user_id);
create policy "Users can update own review periods"
  on review_periods for update using (auth.uid() = user_id);
create policy "Users can delete own review periods"
  on review_periods for delete using (auth.uid() = user_id);

-- Notes
create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  young_person_id uuid references young_persons not null,
  content text not null,
  created_at timestamptz default now()
);

alter table notes enable row level security;

create policy "Users can view own notes"
  on notes for select using (auth.uid() = user_id);
create policy "Users can insert own notes"
  on notes for insert with check (auth.uid() = user_id);
create policy "Users can update own notes"
  on notes for update using (auth.uid() = user_id);
create policy "Users can delete own notes"
  on notes for delete using (auth.uid() = user_id);
