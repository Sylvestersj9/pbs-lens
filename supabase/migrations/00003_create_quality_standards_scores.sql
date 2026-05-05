create table quality_standards_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  young_person_id uuid references young_persons(id) on delete cascade not null,
  review_period_id uuid references review_periods(id) on delete cascade,
  regulation text not null,
  score integer not null check (score >= 1 and score <= 4),
  notes text,
  assessed_date date not null,
  created_at timestamptz default now()
);

alter table quality_standards_scores enable row level security;

create policy "Users can view own quality standards scores"
  on quality_standards_scores for select using (auth.uid() = user_id);
create policy "Users can insert own quality standards scores"
  on quality_standards_scores for insert with check (auth.uid() = user_id);
create policy "Users can update own quality standards scores"
  on quality_standards_scores for update using (auth.uid() = user_id);
create policy "Users can delete own quality standards scores"
  on quality_standards_scores for delete using (auth.uid() = user_id);
