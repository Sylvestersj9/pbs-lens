-- Seizures table for clinical seizure logging
create table seizures (
  id uuid primary key default gen_random_uuid(),
  young_person_id uuid references young_persons(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  time time,
  day_of_week text,
  seizure_type text,
  duration_seconds integer,
  notes text,
  created_at timestamptz default now()
);

alter table seizures enable row level security;

create policy "Users can view own seizures"
  on seizures for select using (auth.uid() = user_id);
create policy "Users can insert own seizures"
  on seizures for insert with check (auth.uid() = user_id);
create policy "Users can update own seizures"
  on seizures for update using (auth.uid() = user_id);
create policy "Users can delete own seizures"
  on seizures for delete using (auth.uid() = user_id);
