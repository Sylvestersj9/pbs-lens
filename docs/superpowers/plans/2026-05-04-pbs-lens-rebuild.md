# PBS Lens Full Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild PBS Lens (clinical behaviour tracking tool for PBS specialists in UK children's residential care) as a production-ready React + Supabase + Vercel app, deployed to pbslens.co.uk.

**Architecture:** React SPA with Vite + TypeScript. Supabase handles auth, database (Postgres with RLS), and edge functions (Claude API proxy). Claude API generates behaviour analyses and code suggestions. jsPDF for client-side PDF export. Deployed on Vercel.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS, Supabase, Claude API (Haiku 4.5 + Sonnet 4), jsPDF, TanStack Query, React Router, Radix UI, shadcn/ui, Framer Motion, Lucide icons, Sonner toasts

---

## File Structure

```
pbs-lens/
├── .env.local                          # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── components.json                     # shadcn config
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 00001_initial_schema.sql
│   └── functions/
│       └── claude-proxy/
│           └── index.ts
├── src/
│   ├── main.tsx                        # App entry, providers
│   ├── App.tsx                         # Router setup
│   ├── index.css                       # Tailwind + CSS variables
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase client
│   │   ├── codeLists.ts               # ABC code definitions + helpers
│   │   ├── claude.ts                   # Claude API calls via edge function
│   │   ├── pdf.ts                      # PDF export utilities
│   │   ├── utils.ts                    # cn() helper (shadcn)
│   │   └── types.ts                    # Database types
│   ├── hooks/
│   │   ├── useAuth.ts                  # Auth state + sign in/out
│   │   ├── useYoungPersons.ts          # CRUD queries for young_persons
│   │   ├── useIncidents.ts             # CRUD queries for incidents
│   │   ├── useAnalyses.ts             # CRUD queries for analyses
│   │   ├── usePbsPlan.ts              # CRUD queries for pbs_plans
│   │   ├── useReviewPeriods.ts         # CRUD queries for review_periods
│   │   └── useNotes.ts                # CRUD queries for notes
│   ├── components/
│   │   ├── ui/                         # shadcn components (auto-generated)
│   │   ├── Layout.tsx                  # Header + main wrapper
│   │   ├── ProtectedRoute.tsx          # Auth guard
│   │   ├── EmptyState.tsx              # Icon + title + desc + action
│   │   ├── FloatingActionButton.tsx    # Fixed bottom-right FAB
│   │   ├── StatusDot.tsx               # Green/amber/red dot
│   │   ├── CodePillSelector.tsx        # ABC code pill selector
│   │   ├── ExpandableTextarea.tsx      # Auto-resize + modal + char count
│   │   ├── ReviewPeriodSelector.tsx    # Shared dropdown + inline add
│   │   └── NotesPanel.tsx              # Slide-in notes panel
│   └── pages/
│       ├── Auth.tsx                     # Sign in / sign up
│       ├── Dashboard.tsx               # Home — YP card grid + stats
│       ├── AddYoungPerson.tsx          # Add/edit YP form
│       ├── PersonProfile.tsx           # Profile shell with tabs
│       ├── tabs/
│       │   ├── IncidentsTab.tsx        # Incident list + filters
│       │   ├── TrendsTab.tsx           # Charts + frequency tables
│       │   ├── AnalysisTab.tsx         # AI analysis generation
│       │   └── PbsPlanTab.tsx          # PBS plan sections
│       └── LogIncident.tsx             # Create/edit incident form
└── docs/
    └── superpowers/
        └── plans/
            └── 2026-05-04-pbs-lens-rebuild.md
```

---

## Phase 1: Project Scaffolding & Infrastructure

### Task 1: Create GitHub Repo and Vite Project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`

- [ ] **Step 1: Create GitHub repo**

```bash
cd /Users/sylvesterjanve/Desktop/pbs-lens
git init
gh repo create Sylvestersj9/pbs-lens --public --source=. --push
```

- [ ] **Step 2: Scaffold Vite project**

```bash
cd /Users/sylvesterjanve/Desktop/pbs-lens
npm create vite@latest . -- --template react-ts
```

Select: React, TypeScript

- [ ] **Step 3: Install all dependencies**

```bash
npm install @tanstack/react-query react-router-dom date-fns framer-motion jspdf lucide-react sonner react-markdown @supabase/supabase-js
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TypeScript project with dependencies"
```

---

### Task 2: Configure Tailwind + CSS Variables + shadcn

**Files:**
- Create: `src/index.css`, `src/lib/utils.ts`, `components.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Configure Tailwind in Vite**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 2: Write CSS variables**

`src/index.css`:
```css
@import "tailwindcss";

@theme inline {
  --color-primary: #6366F1;
  --color-background: #F9FAFB;
  --color-card: #FFFFFF;
  --color-border: #E2E8F0;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-foreground: #0F172A;
  --color-muted-foreground: #64748B;
  --font-sans: 'Inter', sans-serif;
}

body {
  @apply bg-background text-foreground font-sans antialiased;
}
```

- [ ] **Step 3: Install and init shadcn**

```bash
npx shadcn@latest init
```

Select: New York style, Neutral color, CSS variables: yes.

Then install needed components:
```bash
npx shadcn@latest add button input label textarea card dialog alert-dialog dropdown-menu tabs select badge separator sheet
```

- [ ] **Step 4: Add Inter font to index.html**

Add to `<head>` in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: configure Tailwind CSS, shadcn/ui, Inter font, color palette"
```

---

### Task 3: Supabase Project + Database Schema

**Files:**
- Create: `supabase/migrations/00001_initial_schema.sql`

- [ ] **Step 1: Create new Supabase project**

Create a new Supabase project called "PBS Lens" via the Supabase MCP tools. Separate from MockOfsted.

- [ ] **Step 2: Link Supabase CLI**

```bash
cd /Users/sylvesterjanve/Desktop/pbs-lens
supabase init
supabase link --project-ref <PROJECT_REF>
```

- [ ] **Step 3: Write migration**

`supabase/migrations/00001_initial_schema.sql`:
```sql
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
```

- [ ] **Step 4: Apply migration**

```bash
supabase db push
```

- [ ] **Step 5: Enable Google OAuth in Supabase dashboard**

Enable Email + Google auth providers in Supabase Auth settings.

- [ ] **Step 6: Create .env.local**

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

- [ ] **Step 7: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema with RLS for all 6 tables"
```

---

### Task 4: Supabase Client + Types + Auth Hook

**Files:**
- Create: `src/lib/supabase.ts`, `src/lib/types.ts`, `src/hooks/useAuth.ts`

- [ ] **Step 1: Create Supabase client**

`src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 2: Define TypeScript types**

`src/lib/types.ts`:
```ts
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
```

- [ ] **Step 3: Create auth hook**

`src/hooks/useAuth.ts`:
```ts
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email: string, password: string) =>
    supabase.auth.signUp({ email, password })

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({ provider: 'google' })

  const signOut = () => supabase.auth.signOut()

  return { user, loading, signIn, signUp, signInWithGoogle, signOut }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts src/lib/types.ts src/hooks/useAuth.ts
git commit -m "feat: add Supabase client, TypeScript types, auth hook"
```

---

### Task 5: Code Lists + Helper Functions

**Files:**
- Create: `src/lib/codeLists.ts`

- [ ] **Step 1: Write code lists**

`src/lib/codeLists.ts`:
```ts
export interface CodeDefinition {
  code: string
  label: string
  description: string
}

export const ANTECEDENT_CODES: CodeDefinition[] = [
  { code: 'AT', label: 'Attention', description: 'The presumption of less or excessive input from others; fixation on a specific adult' },
  { code: 'BN', label: 'Basic Needs', description: 'When basic needs are not met — hunger, illness, pain, thirst, tiredness, overheating, discomfort' },
  { code: 'DE', label: 'Demands', description: 'Any request, expectation, or stressor placed on the young person; waiting' },
  { code: 'DA', label: 'Denied Access', description: 'Denied access to a preferred item, activity, location, person, food, or technology' },
  { code: 'NS', label: 'Noise/Stimulation', description: 'Level of noise or stimulation: too much or too little, over-talking, busy environments' },
  { code: 'OP', label: 'Others Present', description: 'Presence or absence of peers, members of the public, or change in group composition' },
  { code: 'RO', label: 'Routine', description: 'Changes in routine, even subtle ones; unfamiliar setting; holiday or transition periods' },
  { code: 'TR', label: 'Transitions', description: 'Process or period of changing from one state, activity or location to another' },
]

export const BEHAVIOUR_CODES: CodeDefinition[] = [
  { code: 'PA', label: 'Physical Aggression', description: 'Hitting, slapping, headbutting, kicking, pinching, biting, spitting directed at others' },
  { code: 'SH', label: 'Self-Harm', description: 'Hitting own head/face/body; throwing self at hard surfaces; jumping from heights with intent to land hard' },
  { code: 'SI', label: 'Self-Injury', description: 'Sustained self-directed physical action where injury is foreseeable and pattern continues despite intervention' },
  { code: 'DB', label: 'Disruptive Behaviour', description: 'Actions impacting the environment without targeted aggression' },
  { code: 'NO', label: 'Non-compliance', description: 'Refusal to follow direction or accept redirection' },
  { code: 'PD', label: 'Property Damage', description: 'Breaking, snapping, tearing or otherwise damaging property' },
  { code: 'AB', label: 'Absconding', description: 'Running away from staff or premises; climbing out of secure areas; opportunistic flight' },
  { code: 'SB', label: 'Sexualised Behaviour', description: 'Behaviour of a sexual nature including public undressing or self-exposure' },
]

export const CONSEQUENCE_CODES: CodeDefinition[] = [
  { code: 'AC', label: 'Acceptance', description: 'Accepting the behaviour as communication' },
  { code: 'CU', label: 'Curiosity', description: 'Asking questions to better understand the behaviour' },
  { code: 'DI', label: 'Distraction', description: 'Choosing an unrelated activity or focus' },
  { code: 'EM', label: 'Empathy', description: 'Actively showing care and support' },
  { code: 'EC', label: 'Educational Consequence', description: 'Learning that takes place as a result of the behaviour' },
  { code: 'LC', label: 'Limited Choice', description: 'Limited options presented to support processing' },
  { code: 'MI', label: 'Medical Intervention', description: 'Any type of medical intervention' },
  { code: 'NC', label: 'Natural Consequence', description: 'Things that happen without staff involvement' },
  { code: 'PL', label: 'Playful', description: 'A fun and non-assuming approach' },
  { code: 'PC', label: 'Protective Consequence', description: 'Necessary measures to manage risk of harm' },
  { code: 'PI', label: 'Planned Ignoring', description: 'Ignoring behaviour to avoid reinforcing it' },
  { code: 'PR', label: 'Positive Reinforcement', description: 'Encouraging a pattern of behaviour by offering reward' },
  { code: 'PS', label: 'Physical Support', description: 'Physical contact intended to keep safe or support' },
  { code: 'RI', label: 'Restrictive Intervention', description: 'Interventions using a level of force to limit freedom of movement' },
  { code: 'RP', label: 'Restrictive Physical Intervention', description: 'Use of force employing bodily contact to control behaviour' },
  { code: 'CF', label: 'Change of Face', description: 'A new adult introduced and takes over primary direction' },
  { code: 'RD', label: 'Redirection', description: 'Providing an alternative outlet' },
  { code: 'ID', label: 'Indirect Support', description: 'Offering demands or reflection through speaking aloud, role-play, modelling' },
  { code: 'NT', label: 'No Action Taken', description: 'No action recorded or needed' },
]

export function getCodeLabel(code: string, list: CodeDefinition[]): string {
  return list.find((c) => c.code === code)?.label ?? code
}

export function getTimeBand(time: string): string {
  const hour = parseInt(time.split(':')[0], 10)
  if (hour >= 0 && hour < 6) return 'Night'
  if (hour >= 6 && hour < 12) return 'AM'
  if (hour >= 12 && hour < 18) return 'PM'
  return 'Evening'
}

export function getDayOfWeek(date: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date(date).getDay()]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/codeLists.ts
git commit -m "feat: add ABC code lists with helper functions"
```

---

### Task 6: Claude Proxy Edge Function

**Files:**
- Create: `supabase/functions/claude-proxy/index.ts`

- [ ] **Step 1: Write edge function**

`supabase/functions/claude-proxy/index.ts`:
```ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { model, system, messages, max_tokens } = await req.json()

    const apiKey = Deno.env.get('CLAUDE_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system,
        messages,
        max_tokens: max_tokens || 4096,
      }),
    })

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 2: Create client-side Claude helper**

`src/lib/claude.ts`:
```ts
import { supabase } from './supabase'

interface ClaudeRequest {
  model: string
  system: string
  messages: { role: string; content: string }[]
  max_tokens?: number
}

export async function callClaude(request: ClaudeRequest): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const response = await supabase.functions.invoke('claude-proxy', {
    body: request,
  })

  if (response.error) throw new Error(response.error.message)

  const data = response.data
  if (data.error) throw new Error(data.error.message || data.error)

  return data.content[0].text
}
```

- [ ] **Step 3: Set Claude API key as edge function secret**

```bash
supabase secrets set CLAUDE_API_KEY=<key>
```

- [ ] **Step 4: Deploy edge function**

```bash
supabase functions deploy claude-proxy
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/ src/lib/claude.ts
git commit -m "feat: add Claude proxy edge function and client helper"
```

---

### Task 7: App Shell — Router, Layout, Auth Page, Protected Route

**Files:**
- Create: `src/App.tsx`, `src/main.tsx`, `src/components/Layout.tsx`, `src/components/ProtectedRoute.tsx`, `src/pages/Auth.tsx`

- [ ] **Step 1: Create main entry**

`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
```

- [ ] **Step 2: Create App with routes**

`src/App.tsx`:
```tsx
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import Auth from '@/pages/Auth'
import Dashboard from '@/pages/Dashboard'
import AddYoungPerson from '@/pages/AddYoungPerson'
import PersonProfile from '@/pages/PersonProfile'
import LogIncident from '@/pages/LogIncident'

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddYoungPerson />} />
          <Route path="/person/:id" element={<PersonProfile />} />
          <Route path="/person/:id/log" element={<LogIncident />} />
        </Route>
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 3: Create Layout**

`src/components/Layout.tsx`:
```tsx
import { Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <span className="text-lg font-bold text-primary">PBS Lens</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Create ProtectedRoute**

`src/components/ProtectedRoute.tsx`:
```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  return <Outlet />
}
```

- [ ] **Step 5: Create Auth page**

`src/pages/Auth.tsx`:
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, signInWithGoogle, user } = useAuth()
  const navigate = useNavigate()

  if (user) {
    navigate('/', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password)
    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else if (isSignUp) {
      toast.success('Check your email for a confirmation link')
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">PBS Lens</div>
          <CardTitle className="text-lg font-normal text-muted-foreground">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4">
            <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
              Continue with Google
            </Button>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/main.tsx src/App.tsx src/components/Layout.tsx src/components/ProtectedRoute.tsx src/pages/Auth.tsx
git commit -m "feat: add app shell with routing, layout, auth page, protected routes"
```

---

## Phase 2: Shared Components

### Task 8: Shared Components

**Files:**
- Create: `src/components/EmptyState.tsx`, `src/components/FloatingActionButton.tsx`, `src/components/StatusDot.tsx`, `src/components/CodePillSelector.tsx`, `src/components/ExpandableTextarea.tsx`

- [ ] **Step 1: EmptyState**

`src/components/EmptyState.tsx`:
```tsx
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: FloatingActionButton**

`src/components/FloatingActionButton.tsx`:
```tsx
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FABProps {
  label: string
  onClick: () => void
}

export default function FloatingActionButton({ label, onClick }: FABProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 rounded-full shadow-lg h-auto px-5 py-3 gap-2 z-50"
    >
      <Plus className="h-5 w-5" />
      {label}
    </Button>
  )
}
```

- [ ] **Step 3: StatusDot**

`src/components/StatusDot.tsx`:
```tsx
interface StatusDotProps {
  count: number
  onClick?: () => void
}

export default function StatusDot({ count, onClick }: StatusDotProps) {
  const color = count === 0 ? 'bg-success' : count <= 3 ? 'bg-warning' : 'bg-danger'

  return (
    <button
      onClick={onClick}
      className={`h-3 w-3 rounded-full ${color} inline-block`}
      title={`${count} incidents this month`}
    />
  )
}
```

- [ ] **Step 4: CodePillSelector**

`src/components/CodePillSelector.tsx`:
```tsx
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CodeDefinition } from '@/lib/codeLists'

interface CodePillSelectorProps {
  codes: CodeDefinition[]
  selected: string[]
  onToggle: (code: string) => void
  aiSuggested?: string[]
  color: 'amber' | 'red' | 'indigo'
}

const colorMap = {
  amber: { active: 'bg-warning text-white hover:bg-warning/90', inactive: 'bg-warning/10 text-warning hover:bg-warning/20' },
  red: { active: 'bg-danger text-white hover:bg-danger/90', inactive: 'bg-danger/10 text-danger hover:bg-danger/20' },
  indigo: { active: 'bg-primary text-white hover:bg-primary/90', inactive: 'bg-primary/10 text-primary hover:bg-primary/20' },
}

export default function CodePillSelector({ codes, selected, onToggle, aiSuggested = [], color }: CodePillSelectorProps) {
  const [showDescriptions, setShowDescriptions] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {codes.map((c) => {
          const isSelected = selected.includes(c.code)
          const isAI = aiSuggested.includes(c.code)
          const styles = isSelected ? colorMap[color].active : colorMap[color].inactive

          return (
            <button
              key={c.code}
              type="button"
              onClick={() => onToggle(c.code)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${styles}`}
            >
              {c.code}
              {isAI && isSelected && (
                <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">AI</Badge>
              )}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => setShowDescriptions(!showDescriptions)}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {showDescriptions ? 'Hide descriptions' : 'See descriptions'}
      </button>
      {showDescriptions && (
        <div className="grid gap-1 text-sm">
          {codes.map((c) => (
            <div key={c.code} className="flex gap-2">
              <span className="font-medium w-8 shrink-0">{c.code}</span>
              <span className="text-muted-foreground">{c.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: ExpandableTextarea**

`src/components/ExpandableTextarea.tsx`:
```tsx
import { useRef, useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ExpandableTextareaProps {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  minLength?: number
}

export default function ExpandableTextarea({ value, onChange, label, placeholder, minLength }: ExpandableTextareaProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleFocus = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <button type="button" onClick={() => setModalOpen(true)} className="text-muted-foreground hover:text-foreground">
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
      />
      <div className="text-xs text-muted-foreground text-right">
        {value.length} characters{minLength ? ` (min ${minLength})` : ''}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 resize-none text-base"
          />
          <div className="text-xs text-muted-foreground text-right">
            {value.length} characters
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/EmptyState.tsx src/components/FloatingActionButton.tsx src/components/StatusDot.tsx src/components/CodePillSelector.tsx src/components/ExpandableTextarea.tsx
git commit -m "feat: add shared components — EmptyState, FAB, StatusDot, CodePillSelector, ExpandableTextarea"
```

---

### Task 9: ReviewPeriodSelector + NotesPanel

**Files:**
- Create: `src/components/ReviewPeriodSelector.tsx`, `src/components/NotesPanel.tsx`

- [ ] **Step 1: ReviewPeriodSelector**

`src/components/ReviewPeriodSelector.tsx`:
```tsx
import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { ReviewPeriod } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ReviewPeriodSelectorProps {
  periods: ReviewPeriod[]
  selectedId: string | null
  onSelect: (period: ReviewPeriod | null) => void
  onAdd: (label: string, dateFrom: string, dateTo: string) => void
  onDelete: (id: string) => void
}

export default function ReviewPeriodSelector({ periods, selectedId, onSelect, onAdd, onDelete }: ReviewPeriodSelectorProps) {
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const handleAdd = () => {
    if (label && dateFrom && dateTo) {
      onAdd(label, dateFrom, dateTo)
      setAdding(false)
      setLabel('')
      setDateFrom('')
      setDateTo('')
    }
  }

  return (
    <div className="space-y-2">
      <Select
        value={selectedId ?? 'custom'}
        onValueChange={(val) => {
          if (val === 'custom') {
            onSelect(null)
          } else {
            const period = periods.find((p) => p.id === val)
            if (period) onSelect(period)
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select review period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="custom">Custom date range</SelectItem>
          {periods.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label} ({format(new Date(p.date_from), 'dd/MM/yy')} – {format(new Date(p.date_to), 'dd/MM/yy')})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        {!adding && (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add period
          </Button>
        )}
        {selectedId && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(selectedId)} className="text-danger">
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        )}
      </div>

      {adding && (
        <div className="flex flex-col gap-2 p-3 border border-border rounded-lg">
          <Input placeholder="Period label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <div className="flex gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: NotesPanel**

`src/components/NotesPanel.tsx`:
```tsx
import { useState } from 'react'
import { format } from 'date-fns'
import { X, Trash2 } from 'lucide-react'
import { Note } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

interface NotesPanelProps {
  open: boolean
  onClose: () => void
  notes: Note[]
  onAdd: (content: string) => void
  onDelete: (id: string) => void
}

export default function NotesPanel({ open, onClose, notes, onAdd, onDelete }: NotesPanelProps) {
  const [content, setContent] = useState('')

  if (!open) return null

  const handleSave = () => {
    if (content.trim()) {
      onAdd(content.trim())
      setContent('')
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Notes</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="p-3 bg-background rounded-lg">
              <div className="flex items-start justify-between">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(note.created_at), 'dd MMM yyyy, HH:mm')}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete note?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(note.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a note..."
            className="min-h-[80px]"
          />
          <Button onClick={handleSave} disabled={!content.trim()} className="w-full">
            Save Note
          </Button>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ReviewPeriodSelector.tsx src/components/NotesPanel.tsx
git commit -m "feat: add ReviewPeriodSelector and NotesPanel components"
```

---

## Phase 3: Data Hooks

### Task 10: All TanStack Query Hooks

**Files:**
- Create: `src/hooks/useYoungPersons.ts`, `src/hooks/useIncidents.ts`, `src/hooks/useAnalyses.ts`, `src/hooks/usePbsPlan.ts`, `src/hooks/useReviewPeriods.ts`, `src/hooks/useNotes.ts`

- [ ] **Step 1: useYoungPersons**

`src/hooks/useYoungPersons.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { YoungPerson } from '@/lib/types'
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
```

- [ ] **Step 2: useIncidents**

`src/hooks/useIncidents.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Incident } from '@/lib/types'
import { toast } from 'sonner'

export function useIncidents(youngPersonId: string) {
  return useQuery({
    queryKey: ['incidents', youngPersonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('young_person_id', youngPersonId)
        .order('incident_date', { ascending: false })
        .order('incident_time', { ascending: false })
      if (error) throw error
      return data as Incident[]
    },
    enabled: !!youngPersonId,
  })
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Incident
    },
    enabled: !!id,
  })
}

export function useCreateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (incident: Omit<Incident, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('incidents')
        .insert({ ...incident, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['incidents', data.young_person_id] })
      toast.success('Incident logged')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useUpdateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Incident> & { id: string }) => {
      const { data, error } = await supabase
        .from('incidents')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['incidents', data.young_person_id] })
      toast.success('Incident updated')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeleteIncidents() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids, youngPersonId }: { ids: string[]; youngPersonId: string }) => {
      const { error } = await supabase
        .from('incidents')
        .delete()
        .in('id', ids)
      if (error) throw error
      return youngPersonId
    },
    onSuccess: (youngPersonId) => {
      qc.invalidateQueries({ queryKey: ['incidents', youngPersonId] })
      toast.success('Deleted')
    },
    onError: (e) => toast.error(e.message),
  })
}
```

- [ ] **Step 3: useAnalyses**

`src/hooks/useAnalyses.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Analysis } from '@/lib/types'
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
```

- [ ] **Step 4: usePbsPlan**

`src/hooks/usePbsPlan.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PbsPlan } from '@/lib/types'
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
      const payload = { ...plan, user_id: user!.id, updated_at: new Date().toISOString() }

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
```

- [ ] **Step 5: useReviewPeriods**

`src/hooks/useReviewPeriods.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ReviewPeriod } from '@/lib/types'
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
```

- [ ] **Step 6: useNotes**

`src/hooks/useNotes.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Note } from '@/lib/types'
import { toast } from 'sonner'

export function useNotes(youngPersonId: string) {
  return useQuery({
    queryKey: ['notes', youngPersonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('young_person_id', youngPersonId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Note[]
    },
    enabled: !!youngPersonId,
  })
}

export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (note: Omit<Note, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('notes')
        .insert({ ...note, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['notes', data.young_person_id] })
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, youngPersonId }: { id: string; youngPersonId: string }) => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
      if (error) throw error
      return youngPersonId
    },
    onSuccess: (youngPersonId) => {
      qc.invalidateQueries({ queryKey: ['notes', youngPersonId] })
    },
    onError: (e) => toast.error(e.message),
  })
}
```

- [ ] **Step 7: Commit**

```bash
git add src/hooks/
git commit -m "feat: add TanStack Query hooks for all 6 tables"
```

---

## Phase 4: Pages

### Task 11: Dashboard Page

**Files:**
- Create: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Build Dashboard**

`src/pages/Dashboard.tsx`:
```tsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, AlertTriangle, TrendingUp } from 'lucide-react'
import { startOfMonth, isAfter } from 'date-fns'
import { useYoungPersons } from '@/hooks/useYoungPersons'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { Incident } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import StatusDot from '@/components/StatusDot'
import FloatingActionButton from '@/components/FloatingActionButton'
import EmptyState from '@/components/EmptyState'
import { BEHAVIOUR_CODES, getCodeLabel } from '@/lib/codeLists'

type SortMode = 'recent' | 'most' | 'alpha'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: youngPersons = [], isLoading } = useYoungPersons()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('recent')
  const [showArchived, setShowArchived] = useState(false)

  const monthStart = startOfMonth(new Date()).toISOString().split('T')[0]

  const { data: allIncidents = [] } = useQuery({
    queryKey: ['all-incidents-month'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .gte('incident_date', monthStart)
      if (error) throw error
      return data as Incident[]
    },
  })

  const incidentsByYP = useMemo(() => {
    const map: Record<string, Incident[]> = {}
    allIncidents.forEach((i) => {
      if (!map[i.young_person_id]) map[i.young_person_id] = []
      map[i.young_person_id].push(i)
    })
    return map
  }, [allIncidents])

  const { data: allIncidentsForLastDate = [] } = useQuery({
    queryKey: ['all-incidents-last-date'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('young_person_id, incident_date')
        .order('incident_date', { ascending: false })
      if (error) throw error
      return data as { young_person_id: string; incident_date: string }[]
    },
  })

  const lastIncidentDate = useMemo(() => {
    const map: Record<string, string> = {}
    allIncidentsForLastDate.forEach((i) => {
      if (!map[i.young_person_id]) map[i.young_person_id] = i.incident_date
    })
    return map
  }, [allIncidentsForLastDate])

  const filtered = useMemo(() => {
    let list = youngPersons.filter((yp) => showArchived || !yp.archived)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (yp) => yp.initials.toLowerCase().includes(q) || yp.home_name.toLowerCase().includes(q)
      )
    }
    if (sort === 'alpha') {
      list.sort((a, b) => a.initials.localeCompare(b.initials))
    } else if (sort === 'most') {
      list.sort((a, b) => (incidentsByYP[b.id]?.length ?? 0) - (incidentsByYP[a.id]?.length ?? 0))
    } else {
      list.sort((a, b) => {
        const aDate = lastIncidentDate[a.id] ?? ''
        const bDate = lastIncidentDate[b.id] ?? ''
        return bDate.localeCompare(aDate)
      })
    }
    return list
  }, [youngPersons, search, sort, showArchived, incidentsByYP, lastIncidentDate])

  const topBehaviour = useMemo(() => {
    const counts: Record<string, number> = {}
    allIncidents.forEach((i) => {
      i.behaviour_codes?.forEach((c) => {
        counts[c] = (counts[c] || 0) + 1
      })
    })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? getCodeLabel(top[0], BEHAVIOUR_CODES) : '—'
  }, [allIncidents])

  const hasArchived = youngPersons.some((yp) => yp.archived)
  const firstName = user?.email?.split('@')[0] ?? 'Your'

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold capitalize">{firstName}'s Dashboard</h1>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <div className="text-2xl font-bold">{youngPersons.filter((yp) => !yp.archived).length}</div>
            <div className="text-xs text-muted-foreground">Young People</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <div className="text-2xl font-bold">{allIncidents.length}</div>
            <div className="text-xs text-muted-foreground">Incidents This Month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <div className="text-2xl font-bold text-sm">{topBehaviour}</div>
            <div className="text-xs text-muted-foreground">Top Behaviour</div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Sort */}
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
        <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent incident</SelectItem>
            <SelectItem value="most">Most this month</SelectItem>
            <SelectItem value="alpha">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasArchived && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived
        </label>
      )}

      {/* Card grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No young people yet"
          description="Add a young person to start tracking incidents"
          actionLabel="Add Young Person"
          onAction={() => navigate('/add')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((yp) => {
            const monthCount = incidentsByYP[yp.id]?.length ?? 0
            const lastDate = lastIncidentDate[yp.id]

            return (
              <Card
                key={yp.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/person/${yp.id}`)}
              >
                <CardContent className="pt-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {yp.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold flex items-center gap-2">
                      {yp.initials}
                      <StatusDot count={monthCount} onClick={(e) => { e?.stopPropagation(); navigate(`/person/${yp.id}?tab=trends`) }} />
                      {yp.archived && <span className="text-xs text-muted-foreground">(archived)</span>}
                    </div>
                    <div className="text-sm text-muted-foreground">{yp.home_name}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold">{monthCount}</div>
                    <div className="text-xs text-muted-foreground">this month</div>
                    {lastDate && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Last: {new Date(lastDate).toLocaleDateString('en-GB')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <FloatingActionButton label="Add Young Person" onClick={() => navigate('/add')} />
    </div>
  )
}
```

Note: The StatusDot onClick needs a small fix — update `StatusDot` to accept `(e?: React.MouseEvent)`:

Update `src/components/StatusDot.tsx`:
```tsx
interface StatusDotProps {
  count: number
  onClick?: (e?: React.MouseEvent) => void
}

export default function StatusDot({ count, onClick }: StatusDotProps) {
  const color = count === 0 ? 'bg-success' : count <= 3 ? 'bg-warning' : 'bg-danger'

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
      className={`h-3 w-3 rounded-full ${color} inline-block`}
      title={`${count} incidents this month`}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Dashboard.tsx src/components/StatusDot.tsx
git commit -m "feat: build Dashboard page with search, sort, stats bar, card grid"
```

---

### Task 12: Add Young Person Page

**Files:**
- Create: `src/pages/AddYoungPerson.tsx`

- [ ] **Step 1: Build form page**

`src/pages/AddYoungPerson.tsx`:
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateYoungPerson } from '@/hooks/useYoungPersons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AddYoungPerson() {
  const navigate = useNavigate()
  const createYP = useCreateYoungPerson()
  const [initials, setInitials] = useState('')
  const [homeName, setHomeName] = useState('')
  const [dateOfAdmission, setDateOfAdmission] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createYP.mutateAsync({
      initials: initials.toUpperCase(),
      home_name: homeName,
      date_of_admission: dateOfAdmission || null,
      notes: notes || null,
    })
    navigate('/')
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Add Young Person</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="initials">Initials</Label>
            <Input
              id="initials"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              maxLength={4}
              required
              placeholder="e.g. JD"
            />
            <p className="text-xs text-muted-foreground mt-1">Use initials only — no full names</p>
          </div>
          <div>
            <Label htmlFor="home">Home Name</Label>
            <Input
              id="home"
              value={homeName}
              onChange={(e) => setHomeName(e.target.value)}
              required
              placeholder="e.g. Maple House"
            />
          </div>
          <div>
            <Label htmlFor="admission">Date of Admission</Label>
            <Input
              id="admission"
              type="date"
              value={dateOfAdmission}
              onChange={(e) => setDateOfAdmission(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={createYP.isPending}>
              {createYP.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/')}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AddYoungPerson.tsx
git commit -m "feat: add AddYoungPerson form page"
```

---

### Task 13: Person Profile Shell with Tabs

**Files:**
- Create: `src/pages/PersonProfile.tsx`

- [ ] **Step 1: Build profile page**

`src/pages/PersonProfile.tsx`:
```tsx
import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Archive, StickyNote } from 'lucide-react'
import { useYoungPerson, useUpdateYoungPerson } from '@/hooks/useYoungPersons'
import { useNotes, useCreateNote, useDeleteNote } from '@/hooks/useNotes'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import NotesPanel from '@/components/NotesPanel'
import IncidentsTab from '@/pages/tabs/IncidentsTab'
import TrendsTab from '@/pages/tabs/TrendsTab'
import AnalysisTab from '@/pages/tabs/AnalysisTab'
import PbsPlanTab from '@/pages/tabs/PbsPlanTab'

export default function PersonProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'incidents'

  const { data: yp, isLoading } = useYoungPerson(id!)
  const updateYP = useUpdateYoungPerson()
  const { data: notes = [] } = useNotes(id!)
  const createNote = useCreateNote()
  const deleteNote = useDeleteNote()

  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)

  const [editInitials, setEditInitials] = useState('')
  const [editHomeName, setEditHomeName] = useState('')
  const [editAdmission, setEditAdmission] = useState('')
  const [editNotes, setEditNotes] = useState('')

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  if (!yp) return <div className="text-center py-12 text-muted-foreground">Young person not found</div>

  const openEdit = () => {
    setEditInitials(yp.initials)
    setEditHomeName(yp.home_name)
    setEditAdmission(yp.date_of_admission ?? '')
    setEditNotes(yp.notes ?? '')
    setEditOpen(true)
  }

  const saveEdit = async () => {
    await updateYP.mutateAsync({
      id: yp.id,
      initials: editInitials.toUpperCase(),
      home_name: editHomeName,
      date_of_admission: editAdmission || null,
      notes: editNotes || null,
    })
    setEditOpen(false)
  }

  const handleArchive = async () => {
    await updateYP.mutateAsync({ id: yp.id, archived: true })
    navigate('/')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
          {yp.initials}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{yp.initials}</h1>
          <p className="text-sm text-muted-foreground">{yp.home_name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setArchiveOpen(true)}>
            <Archive className="h-4 w-4 mr-1" /> Archive
          </Button>
          <Button variant="outline" size="sm" onClick={() => setNotesOpen(true)}>
            <StickyNote className="h-4 w-4 mr-1" /> Notes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full">
          <TabsTrigger value="incidents" className="flex-1">Incidents</TabsTrigger>
          <TabsTrigger value="trends" className="flex-1">Trends</TabsTrigger>
          <TabsTrigger value="analysis" className="flex-1">Analysis</TabsTrigger>
          <TabsTrigger value="pbs-plan" className="flex-1">PBS Plan</TabsTrigger>
        </TabsList>
        <TabsContent value="incidents"><IncidentsTab youngPersonId={id!} /></TabsContent>
        <TabsContent value="trends"><TrendsTab youngPersonId={id!} /></TabsContent>
        <TabsContent value="analysis"><AnalysisTab youngPersonId={id!} youngPersonInitials={yp.initials} /></TabsContent>
        <TabsContent value="pbs-plan"><PbsPlanTab youngPersonId={id!} youngPersonInitials={yp.initials} /></TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Young Person</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Initials</Label>
              <Input value={editInitials} onChange={(e) => setEditInitials(e.target.value.toUpperCase())} maxLength={4} />
            </div>
            <div>
              <Label>Home Name</Label>
              <Input value={editHomeName} onChange={(e) => setEditHomeName(e.target.value)} />
            </div>
            <div>
              <Label>Date of Admission</Label>
              <Input type="date" value={editAdmission} onChange={(e) => setEditAdmission(e.target.value)} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </div>
            <Button onClick={saveEdit} disabled={updateYP.isPending}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation */}
      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {yp.initials}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide {yp.initials} from your dashboard. You can show archived records later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notes Panel */}
      <NotesPanel
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        notes={notes}
        onAdd={(content) => createNote.mutate({ young_person_id: id!, content })}
        onDelete={(noteId) => deleteNote.mutate({ id: noteId, youngPersonId: id! })}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/PersonProfile.tsx
git commit -m "feat: add PersonProfile shell with tabs, edit dialog, archive, notes"
```

---

### Task 14: Incidents Tab

**Files:**
- Create: `src/pages/tabs/IncidentsTab.tsx`

- [ ] **Step 1: Build incidents tab**

`src/pages/tabs/IncidentsTab.tsx`:
```tsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Filter, Trash2, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { useIncidents, useDeleteIncidents } from '@/hooks/useIncidents'
import { ANTECEDENT_CODES, BEHAVIOUR_CODES, CONSEQUENCE_CODES, getCodeLabel } from '@/lib/codeLists'
import { Incident } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import FloatingActionButton from '@/components/FloatingActionButton'
import EmptyState from '@/components/EmptyState'
import { ClipboardList } from 'lucide-react'

interface IncidentsTabProps {
  youngPersonId: string
}

export default function IncidentsTab({ youngPersonId }: IncidentsTabProps) {
  const navigate = useNavigate()
  const { data: incidents = [], isLoading } = useIncidents(youngPersonId)
  const deleteIncidents = useDeleteIncidents()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterBehaviours, setFilterBehaviours] = useState<string[]>([])
  const [filterAntecedents, setFilterAntecedents] = useState<string[]>([])

  const activeFilterCount = [dateFrom, dateTo, filterBehaviours.length > 0, filterAntecedents.length > 0].filter(Boolean).length

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      if (dateFrom && i.incident_date < dateFrom) return false
      if (dateTo && i.incident_date > dateTo) return false
      if (filterBehaviours.length > 0 && !filterBehaviours.some((c) => i.behaviour_codes?.includes(c))) return false
      if (filterAntecedents.length > 0 && !filterAntecedents.some((c) => i.antecedent_codes?.includes(c))) return false
      return true
    })
  }, [incidents, dateFrom, dateTo, filterBehaviours, filterAntecedents])

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setFilterBehaviours([])
    setFilterAntecedents([])
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((i) => i.id)))
    }
  }

  const handleBulkDelete = async () => {
    await deleteIncidents.mutateAsync({ ids: Array.from(selected), youngPersonId })
    setSelected(new Set())
  }

  const handleSingleDelete = async () => {
    if (deleteTarget) {
      await deleteIncidents.mutateAsync({ ids: [deleteTarget], youngPersonId })
      setDeleteTarget(null)
      setDeleteOpen(false)
    }
  }

  if (isLoading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>

  return (
    <div className="space-y-4 mt-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-1" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
        )}
        <span className="ml-auto text-sm text-muted-foreground">{filtered.length} incident{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {showFilters && (
        <div className="p-3 border border-border rounded-lg space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Behaviours</label>
            <div className="flex flex-wrap gap-1">
              {BEHAVIOUR_CODES.map((c) => (
                <button
                  key={c.code}
                  onClick={() =>
                    setFilterBehaviours((prev) =>
                      prev.includes(c.code) ? prev.filter((x) => x !== c.code) : [...prev, c.code]
                    )
                  }
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    filterBehaviours.includes(c.code) ? 'bg-danger text-white' : 'bg-danger/10 text-danger'
                  }`}
                >
                  {c.code}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Antecedents</label>
            <div className="flex flex-wrap gap-1">
              {ANTECEDENT_CODES.map((c) => (
                <button
                  key={c.code}
                  onClick={() =>
                    setFilterAntecedents((prev) =>
                      prev.includes(c.code) ? prev.filter((x) => x !== c.code) : [...prev, c.code]
                    )
                  }
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    filterAntecedents.includes(c.code) ? 'bg-warning text-white' : 'bg-warning/10 text-warning'
                  }`}
                >
                  {c.code}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Select all + bulk delete */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={selectAll} />
            Select all
          </label>
          {selected.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete {selected.size}
            </Button>
          )}
        </div>
      )}

      {/* Incident list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No incidents"
          description="Log an incident to start building this young person's behaviour profile"
          actionLabel="Log Incident"
          onAction={() => navigate(`/person/${youngPersonId}/log`)}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              expanded={expandedId === incident.id}
              onToggle={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
              selected={selected.has(incident.id)}
              onSelect={() => toggleSelect(incident.id)}
              onEdit={() => navigate(`/person/${youngPersonId}/log?edit=${incident.id}`)}
              onDelete={() => { setDeleteTarget(incident.id); setDeleteOpen(true) }}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete incident?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSingleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FloatingActionButton label="Log Incident" onClick={() => navigate(`/person/${youngPersonId}/log`)} />
    </div>
  )
}

function IncidentCard({
  incident,
  expanded,
  onToggle,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  incident: Incident
  expanded: boolean
  onToggle: () => void
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={selected} onChange={onSelect} className="mt-1" />
        <div className="flex-1 cursor-pointer" onClick={onToggle}>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold">
                {format(new Date(incident.incident_date), 'dd MMM yyyy')}
                {incident.incident_time && ` at ${incident.incident_time}`}
              </span>
              <span className="text-sm text-muted-foreground ml-2">
                {incident.day_of_week} · {incident.time_band}
              </span>
            </div>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {incident.behaviour_codes?.map((c) => (
              <span key={c} className="px-2 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger">
                {c} — {getCodeLabel(c, BEHAVIOUR_CODES)}
              </span>
            ))}
            {incident.antecedent_codes?.map((c) => (
              <span key={c} className="px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                {c} — {getCodeLabel(c, ANTECEDENT_CODES)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pl-8 space-y-3 border-t border-border pt-3">
          <div>
            <span className="text-xs font-medium text-muted-foreground">Narrative</span>
            <p className="text-sm mt-1">{incident.narrative}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-xs font-medium text-muted-foreground block mb-1">Antecedents</span>
              {incident.antecedent_codes?.map((c) => (
                <div key={c} className="text-xs">{c} — {getCodeLabel(c, ANTECEDENT_CODES)}</div>
              ))}
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground block mb-1">Behaviours</span>
              {incident.behaviour_codes?.map((c) => (
                <div key={c} className="text-xs">{c} — {getCodeLabel(c, BEHAVIOUR_CODES)}</div>
              ))}
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground block mb-1">Consequences</span>
              {incident.consequence_codes?.map((c) => (
                <div key={c} className="text-xs">{c} — {getCodeLabel(c, CONSEQUENCE_CODES)}</div>
              ))}
            </div>
          </div>
          {incident.staff_initials && (
            <div className="text-xs text-muted-foreground">Staff: {incident.staff_initials}</div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="text-danger" onClick={onDelete}>
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tabs/IncidentsTab.tsx
git commit -m "feat: add IncidentsTab with filters, bulk select, expand/collapse cards"
```

---

### Task 15: Log Incident Page

**Files:**
- Create: `src/pages/LogIncident.tsx`

- [ ] **Step 1: Build log incident form**

`src/pages/LogIncident.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateIncident, useUpdateIncident, useIncident } from '@/hooks/useIncidents'
import { ANTECEDENT_CODES, BEHAVIOUR_CODES, CONSEQUENCE_CODES, getTimeBand, getDayOfWeek } from '@/lib/codeLists'
import { callClaude } from '@/lib/claude'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CodePillSelector from '@/components/CodePillSelector'
import ExpandableTextarea from '@/components/ExpandableTextarea'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function LogIncident() {
  const { id: youngPersonId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const navigate = useNavigate()

  const createIncident = useCreateIncident()
  const updateIncident = useUpdateIncident()
  const { data: existingIncident } = useIncident(editId ?? '')

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState('')
  const [narrative, setNarrative] = useState('')
  const [staffInitials, setStaffInitials] = useState('')
  const [antecedents, setAntecedents] = useState<string[]>([])
  const [behaviours, setBehaviours] = useState<string[]>([])
  const [consequences, setConsequences] = useState<string[]>([])
  const [aiSuggestedAntecedents, setAiSuggestedAntecedents] = useState<string[]>([])
  const [aiSuggestedBehaviours, setAiSuggestedBehaviours] = useState<string[]>([])
  const [aiSuggestedConsequences, setAiSuggestedConsequences] = useState<string[]>([])
  const [suggesting, setSuggesting] = useState(false)

  useEffect(() => {
    if (existingIncident) {
      setDate(existingIncident.incident_date)
      setTime(existingIncident.incident_time ?? '')
      setNarrative(existingIncident.narrative)
      setStaffInitials(existingIncident.staff_initials ?? '')
      setAntecedents(existingIncident.antecedent_codes ?? [])
      setBehaviours(existingIncident.behaviour_codes ?? [])
      setConsequences(existingIncident.consequence_codes ?? [])
    }
  }, [existingIncident])

  const toggleCode = (code: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(code) ? list.filter((c) => c !== code) : [...list, code])
  }

  const suggestCodes = async () => {
    setSuggesting(true)
    try {
      const codeListSummary = `Antecedent codes: ${ANTECEDENT_CODES.map((c) => `${c.code}=${c.label}`).join(', ')}
Behaviour codes: ${BEHAVIOUR_CODES.map((c) => `${c.code}=${c.label}`).join(', ')}
Consequence codes: ${CONSEQUENCE_CODES.map((c) => `${c.code}=${c.label}`).join(', ')}`

      const result = await callClaude({
        model: 'claude-haiku-4-5-20251001',
        system: `You are a PBS specialist. Given an incident narrative, suggest the most likely ABC codes. Return ONLY valid JSON: {"antecedents":["CODE"],"behaviours":["CODE"],"consequences":["CODE"]}. Use only codes from this list:\n${codeListSummary}`,
        messages: [{ role: 'user', content: narrative }],
        max_tokens: 200,
      })

      const parsed = JSON.parse(result)
      const sugA = parsed.antecedents || []
      const sugB = parsed.behaviours || []
      const sugC = parsed.consequences || []

      setAiSuggestedAntecedents(sugA)
      setAiSuggestedBehaviours(sugB)
      setAiSuggestedConsequences(sugC)

      setAntecedents((prev) => [...new Set([...prev, ...sugA])])
      setBehaviours((prev) => [...new Set([...prev, ...sugB])])
      setConsequences((prev) => [...new Set([...prev, ...sugC])])

      toast.success('Codes suggested')
    } catch (e: any) {
      toast.error('Could not suggest codes: ' + e.message)
    } finally {
      setSuggesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (narrative.length < 20) {
      toast.error('Narrative must be at least 20 characters')
      return
    }

    const payload = {
      young_person_id: youngPersonId!,
      incident_date: date,
      incident_time: time || null,
      day_of_week: getDayOfWeek(date),
      time_band: time ? getTimeBand(time) : null,
      narrative,
      antecedent_codes: antecedents,
      behaviour_codes: behaviours,
      consequence_codes: consequences,
      staff_initials: staffInitials || null,
    }

    if (editId) {
      await updateIncident.mutateAsync({ id: editId, ...payload })
    } else {
      await createIncident.mutateAsync(payload)
    }
    navigate(`/person/${youngPersonId}`)
  }

  const isPending = createIncident.isPending || updateIncident.isPending

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{editId ? 'Edit Incident' : 'Log Incident'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* When */}
          <div className="space-y-3">
            <h3 className="font-semibold">When</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="flex-1">
                <Label>Time (optional)</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
          </div>

          {/* What happened */}
          <div className="space-y-3">
            <h3 className="font-semibold">What happened</h3>
            <ExpandableTextarea
              value={narrative}
              onChange={setNarrative}
              label="Narrative"
              placeholder="Describe what happened..."
              minLength={20}
            />
            <div>
              <Label>Staff initials</Label>
              <Input
                value={staffInitials}
                onChange={(e) => setStaffInitials(e.target.value)}
                placeholder="e.g. JB"
                className="max-w-[120px]"
              />
            </div>

            {narrative.length >= 50 && (
              <Button type="button" variant="outline" size="sm" onClick={suggestCodes} disabled={suggesting}>
                <Sparkles className="h-4 w-4 mr-1" />
                {suggesting ? 'Suggesting...' : 'Suggest codes from narrative'}
              </Button>
            )}
          </div>

          {/* Antecedents */}
          <div className="space-y-2">
            <h3 className="font-semibold">Antecedents</h3>
            <CodePillSelector
              codes={ANTECEDENT_CODES}
              selected={antecedents}
              onToggle={(code) => toggleCode(code, antecedents, setAntecedents)}
              aiSuggested={aiSuggestedAntecedents}
              color="amber"
            />
          </div>

          {/* Behaviours */}
          <div className="space-y-2">
            <h3 className="font-semibold">Behaviours</h3>
            <CodePillSelector
              codes={BEHAVIOUR_CODES}
              selected={behaviours}
              onToggle={(code) => toggleCode(code, behaviours, setBehaviours)}
              aiSuggested={aiSuggestedBehaviours}
              color="red"
            />
          </div>

          {/* Consequences */}
          <div className="space-y-2">
            <h3 className="font-semibold">Consequences</h3>
            <CodePillSelector
              codes={CONSEQUENCE_CODES}
              selected={consequences}
              onToggle={(code) => toggleCode(code, consequences, setConsequences)}
              aiSuggested={aiSuggestedConsequences}
              color="indigo"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(`/person/${youngPersonId}`)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/LogIncident.tsx
git commit -m "feat: add LogIncident page with AI code suggestion"
```

---

### Task 16: Trends Tab

**Files:**
- Create: `src/pages/tabs/TrendsTab.tsx`

- [ ] **Step 1: Build trends tab**

`src/pages/tabs/TrendsTab.tsx`:
```tsx
import { useState, useMemo } from 'react'
import { subMonths, format } from 'date-fns'
import { useIncidents } from '@/hooks/useIncidents'
import { useReviewPeriods, useCreateReviewPeriod, useDeleteReviewPeriod } from '@/hooks/useReviewPeriods'
import { ANTECEDENT_CODES, BEHAVIOUR_CODES, CONSEQUENCE_CODES, getCodeLabel } from '@/lib/codeLists'
import { Incident, ReviewPeriod } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ReviewPeriodSelector from '@/components/ReviewPeriodSelector'

interface TrendsTabProps {
  youngPersonId: string
}

export default function TrendsTab({ youngPersonId }: TrendsTabProps) {
  const { data: allIncidents = [] } = useIncidents(youngPersonId)
  const { data: periods = [] } = useReviewPeriods(youngPersonId)
  const createPeriod = useCreateReviewPeriod()
  const deletePeriod = useDeleteReviewPeriod()

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const defaultFrom = format(subMonths(new Date(), 3), 'yyyy-MM-dd')
  const defaultTo = format(new Date(), 'yyyy-MM-dd')
  const [dateFrom, setDateFrom] = useState(defaultFrom)
  const [dateTo, setDateTo] = useState(defaultTo)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const handlePeriodSelect = (period: ReviewPeriod | null) => {
    if (period) {
      setSelectedPeriodId(period.id)
      setDateFrom(period.date_from)
      setDateTo(period.date_to)
    } else {
      setSelectedPeriodId(null)
    }
  }

  const filtered = useMemo(() => {
    return allIncidents.filter((i) => i.incident_date >= dateFrom && i.incident_date <= dateTo)
  }, [allIncidents, dateFrom, dateTo])

  const topAntecedent = useMemo(() => {
    const counts: Record<string, number> = {}
    filtered.forEach((i) => i.antecedent_codes?.forEach((c) => { counts[c] = (counts[c] || 0) + 1 }))
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? { code: top[0], count: top[1] } : null
  }, [filtered])

  const topBehaviour = useMemo(() => {
    const counts: Record<string, number> = {}
    filtered.forEach((i) => i.behaviour_codes?.forEach((c) => { counts[c] = (counts[c] || 0) + 1 }))
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? { code: top[0], count: top[1] } : null
  }, [filtered])

  const peakTimeBand = useMemo(() => {
    const counts: Record<string, number> = {}
    filtered.forEach((i) => { if (i.time_band) counts[i.time_band] = (counts[i.time_band] || 0) + 1 })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? { band: top[0], count: top[1] } : null
  }, [filtered])

  const freqTable = (items: string[], codeList: { code: string; label: string }[]) => {
    const counts: Record<string, number> = {}
    items.forEach((c) => { counts[c] = (counts[c] || 0) + 1 })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([code, count]) => ({ code, label: getCodeLabel(code, codeList), count }))
  }

  const dayOfWeekTable = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const counts: Record<string, number> = {}
    days.forEach((d) => (counts[d] = 0))
    filtered.forEach((i) => { if (i.day_of_week) counts[i.day_of_week] = (counts[i.day_of_week] || 0) + 1 })
    return days.map((d) => ({ day: d, count: counts[d] }))
  }, [filtered])

  const timeBandTable = useMemo(() => {
    const bands = ['Night', 'AM', 'PM', 'Evening']
    const counts: Record<string, number> = {}
    bands.forEach((b) => (counts[b] = 0))
    filtered.forEach((i) => { if (i.time_band) counts[i.time_band] = (counts[i.time_band] || 0) + 1 })
    return bands.map((b) => ({ band: b, count: counts[b] }))
  }, [filtered])

  const allAntecedents = filtered.flatMap((i) => i.antecedent_codes || [])
  const allBehaviours = filtered.flatMap((i) => i.behaviour_codes || [])
  const allConsequences = filtered.flatMap((i) => i.consequence_codes || [])

  return (
    <div className="space-y-6 mt-4">
      <ReviewPeriodSelector
        periods={periods}
        selectedId={selectedPeriodId}
        onSelect={handlePeriodSelect}
        onAdd={(label, from, to) => createPeriod.mutate({ young_person_id: youngPersonId, label, date_from: from, date_to: to })}
        onDelete={(id) => { deletePeriod.mutate({ id, youngPersonId }); setSelectedPeriodId(null) }}
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold">{filtered.length}</div>
            <div className="text-sm text-muted-foreground">Total Incidents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-xl font-bold">{topAntecedent ? getCodeLabel(topAntecedent.code, ANTECEDENT_CODES) : '—'}</div>
            <div className="text-sm text-muted-foreground">
              Most Common Antecedent{topAntecedent && ` (${topAntecedent.count})`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-xl font-bold">{topBehaviour ? getCodeLabel(topBehaviour.code, BEHAVIOUR_CODES) : '—'}</div>
            <div className="text-sm text-muted-foreground">
              Most Common Behaviour{topBehaviour && ` (${topBehaviour.count})`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-xl font-bold">{peakTimeBand?.band ?? '—'}</div>
            <div className="text-sm text-muted-foreground">
              Peak Time{peakTimeBand && ` (${peakTimeBand.count})`}
            </div>
          </CardContent>
        </Card>
      </div>

      <Button variant="outline" onClick={() => setShowBreakdown(!showBreakdown)}>
        {showBreakdown ? 'Hide full breakdown' : 'View full breakdown'}
      </Button>

      {showBreakdown && (
        <div className="space-y-6">
          <FreqTableDisplay title="Day of Week" rows={dayOfWeekTable.map((d) => ({ label: d.day, count: d.count }))} />
          <FreqTableDisplay title="Time Band" rows={timeBandTable.map((t) => ({ label: t.band, count: t.count }))} />
          <FreqTableDisplay title="Antecedents" rows={freqTable(allAntecedents, ANTECEDENT_CODES)} />
          <FreqTableDisplay title="Behaviours" rows={freqTable(allBehaviours, BEHAVIOUR_CODES)} />
          <FreqTableDisplay title="Consequences" rows={freqTable(allConsequences, CONSEQUENCE_CODES)} />
        </div>
      )}
    </div>
  )
}

function FreqTableDisplay({ title, rows }: { title: string; rows: { label?: string; code?: string; count: number }[] }) {
  return (
    <div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <div className="border border-border rounded-lg overflow-hidden">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 even:bg-background">
            <span className="text-sm">{row.label ?? row.code}</span>
            <span className="font-medium">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tabs/TrendsTab.tsx
git commit -m "feat: add TrendsTab with summary cards, frequency tables, review periods"
```

---

### Task 17: Analysis Tab

**Files:**
- Create: `src/pages/tabs/AnalysisTab.tsx`

- [ ] **Step 1: Build analysis tab**

`src/pages/tabs/AnalysisTab.tsx`:
```tsx
import { useState, useMemo } from 'react'
import { subMonths, format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import { useIncidents } from '@/hooks/useIncidents'
import { useAnalyses, useSaveAnalysis } from '@/hooks/useAnalyses'
import { useReviewPeriods, useCreateReviewPeriod, useDeleteReviewPeriod } from '@/hooks/useReviewPeriods'
import { ANTECEDENT_CODES, BEHAVIOUR_CODES, CONSEQUENCE_CODES, getCodeLabel } from '@/lib/codeLists'
import { callClaude } from '@/lib/claude'
import { exportAnalysisPdf } from '@/lib/pdf'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ReviewPeriodSelector from '@/components/ReviewPeriodSelector'
import { FileText, Copy, Download, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { ReviewPeriod } from '@/lib/types'
import { useNavigate } from 'react-router-dom'

interface AnalysisTabProps {
  youngPersonId: string
  youngPersonInitials: string
}

export default function AnalysisTab({ youngPersonId, youngPersonInitials }: AnalysisTabProps) {
  const navigate = useNavigate()
  const { data: allIncidents = [] } = useIncidents(youngPersonId)
  const { data: analyses = [] } = useAnalyses(youngPersonId)
  const saveAnalysis = useSaveAnalysis()
  const { data: periods = [] } = useReviewPeriods(youngPersonId)
  const createPeriod = useCreateReviewPeriod()
  const deletePeriod = useDeleteReviewPeriod()

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const defaultFrom = format(subMonths(new Date(), 3), 'yyyy-MM-dd')
  const defaultTo = format(new Date(), 'yyyy-MM-dd')
  const [dateFrom, setDateFrom] = useState(defaultFrom)
  const [dateTo, setDateTo] = useState(defaultTo)

  const [generating, setGenerating] = useState(false)
  const [generatingReg44, setGeneratingReg44] = useState(false)
  const [analysisContent, setAnalysisContent] = useState('')
  const [reg44Content, setReg44Content] = useState('')
  const [showFull, setShowFull] = useState(false)

  const handlePeriodSelect = (period: ReviewPeriod | null) => {
    if (period) {
      setSelectedPeriodId(period.id)
      setDateFrom(period.date_from)
      setDateTo(period.date_to)
    } else {
      setSelectedPeriodId(null)
    }
  }

  const filtered = useMemo(() => {
    return allIncidents.filter((i) => i.incident_date >= dateFrom && i.incident_date <= dateTo)
  }, [allIncidents, dateFrom, dateTo])

  const buildIncidentSummary = () => {
    return filtered.map((i) => {
      const antLabels = i.antecedent_codes?.map((c) => `${c} (${getCodeLabel(c, ANTECEDENT_CODES)})`).join(', ') || 'None'
      const behLabels = i.behaviour_codes?.map((c) => `${c} (${getCodeLabel(c, BEHAVIOUR_CODES)})`).join(', ') || 'None'
      const conLabels = i.consequence_codes?.map((c) => `${c} (${getCodeLabel(c, CONSEQUENCE_CODES)})`).join(', ') || 'None'
      return `Date: ${i.incident_date} ${i.incident_time || ''} (${i.day_of_week}, ${i.time_band})
Narrative: ${i.narrative}
Antecedents: ${antLabels}
Behaviours: ${behLabels}
Consequences: ${conLabels}
Staff: ${i.staff_initials || 'Not recorded'}`
    }).join('\n---\n')
  }

  const generateAnalysis = async () => {
    setGenerating(true)
    setAnalysisContent('')
    try {
      const summary = buildIncidentSummary()
      const result = await callClaude({
        model: 'claude-sonnet-4-20250514',
        system: `You are an experienced Behaviour Analyst and PBS specialist working in UK children's residential care. You write clinical behaviour analysis reports that are evidence-based, trauma-informed, and grounded in PACE principles (Playfulness, Acceptance, Curiosity, Empathy), Polyvagal Theory (Porges, 2011), and NICE guidance on autism (CG170) where relevant. Your writing is clear, professional, and accessible. You write in flowing paragraphs, not bullet points. You interpret patterns clinically — not just counting frequencies but explaining what the data means for the young person's needs and how staff should respond. You never use the young person's full name — only their initials. Format section headings as: ## 1. Overview`,
        messages: [{
          role: 'user',
          content: `Generate a behaviour analysis report for ${youngPersonInitials} covering ${dateFrom} to ${dateTo}. ${filtered.length} incidents recorded.\n\n${summary}\n\nSections required: 1. Overview, 2. Key Patterns, 3. Antecedent Analysis, 4. Behaviour Analysis, 5. Consequence Analysis, 6. Recommendations (3-5 specific actionable).`,
        }],
        max_tokens: 4096,
      })
      setAnalysisContent(result)
      await saveAnalysis.mutateAsync({
        young_person_id: youngPersonId,
        content: result,
        incident_count: filtered.length,
        period_from: dateFrom,
        period_to: dateTo,
      })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const generateReg44 = async () => {
    setGeneratingReg44(true)
    setReg44Content('')
    try {
      const summary = buildIncidentSummary()
      const result = await callClaude({
        model: 'claude-haiku-4-5-20251001',
        system: `You are writing a behaviour incident summary for inclusion in a Regulation 44 independent visitor report for a children's residential home in England. Professional, evidence-based, suitable for a statutory document. Be concise. Frame staff responses positively where data supports this. Recommendations must be specific, actionable, forward-looking. Use initials only.`,
        messages: [{
          role: 'user',
          content: `Write a Reg 44 behaviour summary for ${youngPersonInitials} covering ${dateFrom} to ${dateTo}. ${filtered.length} incidents.\n\n${summary}\n\nSections: Incident Summary, Staff Response and Practice, Recommendations for Next Visit (3-4 bullet points).`,
        }],
        max_tokens: 2048,
      })
      setReg44Content(result)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setGeneratingReg44(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const lastAnalysis = analyses[0]
  const tooFew = filtered.length < 3

  return (
    <div className="space-y-6 mt-4">
      <ReviewPeriodSelector
        periods={periods}
        selectedId={selectedPeriodId}
        onSelect={handlePeriodSelect}
        onAdd={(label, from, to) => createPeriod.mutate({ young_person_id: youngPersonId, label, date_from: from, date_to: to })}
        onDelete={(id) => { deletePeriod.mutate({ id, youngPersonId }); setSelectedPeriodId(null) }}
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} incidents in period</p>

      {lastAnalysis && (
        <p className="text-xs text-muted-foreground">
          Last analysis: {format(new Date(lastAnalysis.created_at), 'dd MMM yyyy')}
        </p>
      )}

      {tooFew ? (
        <div className="p-4 border border-border rounded-lg text-center">
          <p className="text-muted-foreground mb-2">
            At least 3 incidents are needed to generate an analysis.
          </p>
          <Button variant="link" onClick={() => navigate(`/person/${youngPersonId}/log`)}>
            Log an incident
          </Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button onClick={generateAnalysis} disabled={generating || generatingReg44}>
            <Sparkles className="h-4 w-4 mr-2" />
            {generating ? 'Generating...' : 'Generate Draft Analysis'}
          </Button>
          <Button variant="outline" onClick={generateReg44} disabled={generating || generatingReg44}>
            <FileText className="h-4 w-4 mr-2" />
            {generatingReg44 ? 'Generating...' : 'Generate Reg 44 Summary'}
          </Button>
        </div>
      )}

      {/* Analysis output */}
      {analysisContent && (
        <div className="border border-border rounded-lg p-6">
          <div className="mb-4">
            <div className="text-2xl font-bold">{youngPersonInitials}</div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(dateFrom), 'dd MMM yyyy')} – {format(new Date(dateTo), 'dd MMM yyyy')} · {filtered.length} incidents
            </div>
          </div>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>
              {showFull ? analysisContent : analysisContent.split(/(?=## 3\.)/).slice(0, 1).join('')}
            </ReactMarkdown>
          </div>
          {!showFull && analysisContent.includes('## 3.') && (
            <Button variant="ghost" className="mt-4" onClick={() => setShowFull(true)}>
              Show full analysis
            </Button>
          )}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(analysisContent)}>
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportAnalysisPdf(youngPersonInitials, dateFrom, dateTo, filtered.length, analysisContent)}>
              <Download className="h-4 w-4 mr-1" /> Export PDF
            </Button>
          </div>
        </div>
      )}

      {/* Reg 44 output */}
      {reg44Content && (
        <div className="border border-border rounded-lg p-6">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{reg44Content}</ReactMarkdown>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Formatted for Reg 44 reporting — review before use</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => copyToClipboard(reg44Content)}>
            <Copy className="h-4 w-4 mr-1" /> Copy
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tabs/AnalysisTab.tsx
git commit -m "feat: add AnalysisTab with AI draft analysis and Reg 44 generation"
```

---

### Task 18: PDF Export Utility

**Files:**
- Create: `src/lib/pdf.ts`

- [ ] **Step 1: Write PDF utility**

`src/lib/pdf.ts`:
```ts
import jsPDF from 'jspdf'
import { format } from 'date-fns'

export function exportAnalysisPdf(
  initials: string,
  dateFrom: string,
  dateTo: string,
  incidentCount: number,
  content: string
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const maxWidth = pageWidth - margin * 2
  let y = 20

  const addFooter = () => {
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text('Generated by PBS Lens', margin, pageHeight - 10)
    doc.text(format(new Date(), 'dd/MM/yyyy HH:mm'), pageWidth - margin, pageHeight - 10, { align: 'right' })
    doc.setTextColor(0)
  }

  const checkPageBreak = (needed: number) => {
    const pageHeight = doc.internal.pageSize.getHeight()
    if (y + needed > pageHeight - 20) {
      addFooter()
      doc.addPage()
      y = 20
    }
  }

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(initials, margin, y)
  y += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(
    `${format(new Date(dateFrom), 'dd MMM yyyy')} – ${format(new Date(dateTo), 'dd MMM yyyy')} · ${incidentCount} incidents`,
    margin,
    y
  )
  doc.setTextColor(0)
  y += 12

  // Parse markdown content
  const lines = content.split('\n')
  for (const line of lines) {
    if (line.startsWith('## ')) {
      checkPageBreak(15)
      y += 6
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      const wrapped = doc.splitTextToSize(line.replace('## ', ''), maxWidth)
      doc.text(wrapped, margin, y)
      y += wrapped.length * 6 + 4
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
    } else if (line.trim() === '') {
      y += 4
    } else {
      const wrapped = doc.splitTextToSize(line, maxWidth)
      checkPageBreak(wrapped.length * 5)
      doc.text(wrapped, margin, y)
      y += wrapped.length * 5
    }
  }

  addFooter()
  doc.save(`${initials}-analysis-${dateFrom}-to-${dateTo}.pdf`)
}

export function exportPbsPlanPdf(
  initials: string,
  plan: Record<string, any>
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const maxWidth = pageWidth - margin * 2
  let y = 20

  const addFooter = () => {
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text('Generated by PBS Lens', margin, pageHeight - 10)
    doc.setTextColor(0)
  }

  const checkPageBreak = (needed: number) => {
    const pageHeight = doc.internal.pageSize.getHeight()
    if (y + needed > pageHeight - 20) {
      addFooter()
      doc.addPage()
      y = 20
    }
  }

  const addSection = (title: string, content: string | null) => {
    if (!content) return
    checkPageBreak(20)
    y += 4
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin, y)
    y += 7
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const wrapped = doc.splitTextToSize(content, maxWidth)
    checkPageBreak(wrapped.length * 5)
    doc.text(wrapped, margin, y)
    y += wrapped.length * 5 + 4
  }

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(`${initials} — PBS Plan`, margin, y)
  y += 12

  addSection('Enjoys', plan.enjoys)
  addSection('Important To', plan.important_to)
  addSection('Good At', plan.good_at)
  addSection('Helps Relax', plan.helps_relax)
  addSection('Personal Risk Factors', plan.personal_risk_factors)
  addSection('Environmental Risk Factors', plan.environmental_risk_factors)
  addSection('Slow Triggers', plan.slow_triggers)
  addSection('Fast Triggers', plan.fast_triggers)
  addSection('Proactive Strategies', plan.proactive_strategies)
  addSection('Active Strategies', plan.active_strategies)
  addSection('Reactive Strategies', plan.reactive_strategies)

  addFooter()
  doc.save(`${initials}-pbs-plan.pdf`)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/pdf.ts
git commit -m "feat: add PDF export utilities for analysis and PBS plans"
```

---

### Task 19: PBS Plan Tab

**Files:**
- Create: `src/pages/tabs/PbsPlanTab.tsx`

- [ ] **Step 1: Build PBS plan tab**

`src/pages/tabs/PbsPlanTab.tsx`:
```tsx
import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { usePbsPlan, useUpsertPbsPlan } from '@/hooks/usePbsPlan'
import { useIncidents } from '@/hooks/useIncidents'
import { ANTECEDENT_CODES, BEHAVIOUR_CODES, CONSEQUENCE_CODES, getCodeLabel } from '@/lib/codeLists'
import { callClaude } from '@/lib/claude'
import { exportPbsPlanPdf } from '@/lib/pdf'
import { BehaviourFunction, ProtectiveFactor } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import ExpandableTextarea from '@/components/ExpandableTextarea'
import { Download, Sparkles, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface PbsPlanTabProps {
  youngPersonId: string
  youngPersonInitials: string
}

export default function PbsPlanTab({ youngPersonId, youngPersonInitials }: PbsPlanTabProps) {
  const { data: plan, isLoading } = usePbsPlan(youngPersonId)
  const upsertPlan = useUpsertPbsPlan()
  const { data: incidents = [] } = useIncidents(youngPersonId)
  const hasLoaded = useRef(false)

  const [openSection, setOpenSection] = useState<number | null>(0)
  const [populating, setPopulating] = useState(false)
  const [confirmPopulate, setConfirmPopulate] = useState(false)
  const [aiBanner, setAiBanner] = useState<Set<string>>(new Set())

  // Form state
  const [enjoys, setEnjoys] = useState('')
  const [importantTo, setImportantTo] = useState('')
  const [goodAt, setGoodAt] = useState('')
  const [helpsRelax, setHelpsRelax] = useState('')
  const [personalRisk, setPersonalRisk] = useState('')
  const [envRisk, setEnvRisk] = useState('')
  const [slowTriggers, setSlowTriggers] = useState('')
  const [fastTriggers, setFastTriggers] = useState('')
  const [behaviourFunctions, setBehaviourFunctions] = useState<BehaviourFunction[]>([])
  const [protectiveFactors, setProtectiveFactors] = useState<ProtectiveFactor[]>([])
  const [proactive, setProactive] = useState('')
  const [active, setActive] = useState('')
  const [reactive, setReactive] = useState('')

  useEffect(() => {
    if (plan && !hasLoaded.current) {
      hasLoaded.current = true
      setEnjoys(plan.enjoys ?? '')
      setImportantTo(plan.important_to ?? '')
      setGoodAt(plan.good_at ?? '')
      setHelpsRelax(plan.helps_relax ?? '')
      setPersonalRisk(plan.personal_risk_factors ?? '')
      setEnvRisk(plan.environmental_risk_factors ?? '')
      setSlowTriggers(plan.slow_triggers ?? '')
      setFastTriggers(plan.fast_triggers ?? '')
      setBehaviourFunctions(plan.behaviour_functions ?? [])
      setProtectiveFactors(plan.protective_factors ?? [])
      setProactive(plan.proactive_strategies ?? '')
      setActive(plan.active_strategies ?? '')
      setReactive(plan.reactive_strategies ?? '')
    }
  }, [plan])

  const save = () => {
    upsertPlan.mutate({
      id: plan?.id,
      young_person_id: youngPersonId,
      enjoys, important_to: importantTo, good_at: goodAt, helps_relax: helpsRelax,
      personal_risk_factors: personalRisk, environmental_risk_factors: envRisk,
      slow_triggers: slowTriggers, fast_triggers: fastTriggers,
      behaviour_functions: behaviourFunctions, protective_factors: protectiveFactors,
      proactive_strategies: proactive, active_strategies: active, reactive_strategies: reactive,
    })
  }

  const populateFromIncidents = async () => {
    setPopulating(true)
    setConfirmPopulate(false)
    try {
      const incidentSummary = incidents.map((i) => {
        return `Date: ${i.incident_date}, Antecedents: ${i.antecedent_codes?.map((c) => getCodeLabel(c, ANTECEDENT_CODES)).join(', ')}, Behaviours: ${i.behaviour_codes?.map((c) => getCodeLabel(c, BEHAVIOUR_CODES)).join(', ')}, Consequences: ${i.consequence_codes?.map((c) => getCodeLabel(c, CONSEQUENCE_CODES)).join(', ')}, Narrative: ${i.narrative}`
      }).join('\n')

      const result = await callClaude({
        model: 'claude-sonnet-4-20250514',
        system: 'You are a PBS specialist. Analyse the incidents and return JSON only: {"slow_triggers":"text","fast_triggers":"text","behaviour_functions":[{"name":"","description":"","primary_function":"","secondary_function":""}],"protective_factors":[{"title":"","description":"","how_to_use":""}]}',
        messages: [{ role: 'user', content: `Analyse these ${incidents.length} incidents for ${youngPersonInitials}:\n\n${incidentSummary}` }],
        max_tokens: 2048,
      })

      const parsed = JSON.parse(result)
      if (parsed.slow_triggers) { setSlowTriggers(parsed.slow_triggers); setAiBanner((s) => new Set(s).add('slow_triggers')) }
      if (parsed.fast_triggers) { setFastTriggers(parsed.fast_triggers); setAiBanner((s) => new Set(s).add('fast_triggers')) }
      if (parsed.behaviour_functions) { setBehaviourFunctions(parsed.behaviour_functions); setAiBanner((s) => new Set(s).add('behaviour_functions')) }
      if (parsed.protective_factors) { setProtectiveFactors(parsed.protective_factors); setAiBanner((s) => new Set(s).add('protective_factors')) }

      toast.success('Sections populated from incidents')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setPopulating(false)
    }
  }

  const toggleSection = (n: number) => setOpenSection(openSection === n ? null : n)

  const AiBannerLabel = ({ field }: { field: string }) => {
    if (!aiBanner.has(field)) return null
    return <Badge variant="secondary" className="text-xs">AI draft — please review and edit before saving</Badge>
  }

  if (isLoading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {plan?.updated_at && `Last updated: ${format(new Date(plan.updated_at), 'dd MMM yyyy')}`}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setConfirmPopulate(true)} disabled={incidents.length < 3 || populating}>
            <Sparkles className="h-4 w-4 mr-1" />
            {populating ? 'Populating...' : 'Populate from incidents'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportPbsPlanPdf(youngPersonInitials, {
            enjoys, important_to: importantTo, good_at: goodAt, helps_relax: helpsRelax,
            personal_risk_factors: personalRisk, environmental_risk_factors: envRisk,
            slow_triggers: slowTriggers, fast_triggers: fastTriggers,
            proactive_strategies: proactive, active_strategies: active, reactive_strategies: reactive,
          })}>
            <Download className="h-4 w-4 mr-1" /> Export PDF
          </Button>
        </div>
      </div>

      {/* 1. Person-Centred Profile */}
      <CollapsibleSection title="1. Person-Centred Profile" open={openSection === 0} onToggle={() => toggleSection(0)}>
        <ExpandableTextarea value={enjoys} onChange={setEnjoys} label="Enjoys" placeholder="What does this young person enjoy?" />
        <ExpandableTextarea value={importantTo} onChange={setImportantTo} label="Important To" placeholder="What is important to them?" />
        <ExpandableTextarea value={goodAt} onChange={setGoodAt} label="Good At" placeholder="What are they good at?" />
        <ExpandableTextarea value={helpsRelax} onChange={setHelpsRelax} label="Helps Relax" placeholder="What helps them relax?" />
        <Button onClick={save} disabled={upsertPlan.isPending} size="sm">Save</Button>
      </CollapsibleSection>

      {/* 2. Risk Factors */}
      <CollapsibleSection title="2. Risk Factors" open={openSection === 1} onToggle={() => toggleSection(1)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ExpandableTextarea value={personalRisk} onChange={setPersonalRisk} label="Personal Risk Factors" />
          <ExpandableTextarea value={envRisk} onChange={setEnvRisk} label="Environmental Risk Factors" />
        </div>
        <Button onClick={save} disabled={upsertPlan.isPending} size="sm">Save</Button>
      </CollapsibleSection>

      {/* 3. Triggers */}
      <CollapsibleSection title="3. Triggers" open={openSection === 2} onToggle={() => toggleSection(2)}>
        <AiBannerLabel field="slow_triggers" />
        <ExpandableTextarea value={slowTriggers} onChange={setSlowTriggers} label="Slow Triggers" />
        <AiBannerLabel field="fast_triggers" />
        <ExpandableTextarea value={fastTriggers} onChange={setFastTriggers} label="Fast Triggers" />
        <Button onClick={save} disabled={upsertPlan.isPending} size="sm">Save</Button>
      </CollapsibleSection>

      {/* 4. Behaviour Functions */}
      <CollapsibleSection title="4. Behaviour Functions" open={openSection === 3} onToggle={() => toggleSection(3)}>
        <AiBannerLabel field="behaviour_functions" />
        {behaviourFunctions.map((bf, i) => (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Function {i + 1}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setBehaviourFunctions((prev) => prev.filter((_, j) => j !== i))}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <Input placeholder="Name" value={bf.name} onChange={(e) => {
              const next = [...behaviourFunctions]
              next[i] = { ...next[i], name: e.target.value }
              setBehaviourFunctions(next)
            }} />
            <Input placeholder="Description" value={bf.description} onChange={(e) => {
              const next = [...behaviourFunctions]
              next[i] = { ...next[i], description: e.target.value }
              setBehaviourFunctions(next)
            }} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Primary function" value={bf.primary_function} onChange={(e) => {
                const next = [...behaviourFunctions]
                next[i] = { ...next[i], primary_function: e.target.value }
                setBehaviourFunctions(next)
              }} />
              <Input placeholder="Secondary function" value={bf.secondary_function} onChange={(e) => {
                const next = [...behaviourFunctions]
                next[i] = { ...next[i], secondary_function: e.target.value }
                setBehaviourFunctions(next)
              }} />
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setBehaviourFunctions([...behaviourFunctions, { name: '', description: '', primary_function: '', secondary_function: '' }])}>
          <Plus className="h-4 w-4 mr-1" /> Add Function
        </Button>
        <Button onClick={save} disabled={upsertPlan.isPending} size="sm">Save</Button>
      </CollapsibleSection>

      {/* 5. Protective Factors */}
      <CollapsibleSection title="5. Protective Factors" open={openSection === 4} onToggle={() => toggleSection(4)}>
        <AiBannerLabel field="protective_factors" />
        {protectiveFactors.map((pf, i) => (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Factor {i + 1}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setProtectiveFactors((prev) => prev.filter((_, j) => j !== i))}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <Input placeholder="Title" value={pf.title} onChange={(e) => {
              const next = [...protectiveFactors]
              next[i] = { ...next[i], title: e.target.value }
              setProtectiveFactors(next)
            }} />
            <Input placeholder="Description" value={pf.description} onChange={(e) => {
              const next = [...protectiveFactors]
              next[i] = { ...next[i], description: e.target.value }
              setProtectiveFactors(next)
            }} />
            <Input placeholder="How to use" value={pf.how_to_use} onChange={(e) => {
              const next = [...protectiveFactors]
              next[i] = { ...next[i], how_to_use: e.target.value }
              setProtectiveFactors(next)
            }} />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setProtectiveFactors([...protectiveFactors, { title: '', description: '', how_to_use: '' }])}>
          <Plus className="h-4 w-4 mr-1" /> Add Factor
        </Button>
        <Button onClick={save} disabled={upsertPlan.isPending} size="sm">Save</Button>
      </CollapsibleSection>

      {/* 6. Intervention Strategies */}
      <CollapsibleSection title="6. Intervention Strategies" open={openSection === 5} onToggle={() => toggleSection(5)}>
        <ExpandableTextarea value={proactive} onChange={setProactive} label="Proactive Strategies" />
        <ExpandableTextarea value={active} onChange={setActive} label="Active Strategies" />
        <ExpandableTextarea value={reactive} onChange={setReactive} label="Reactive Strategies" />
        <Button onClick={save} disabled={upsertPlan.isPending} size="sm">Save</Button>
      </CollapsibleSection>

      {/* Populate confirmation */}
      <AlertDialog open={confirmPopulate} onOpenChange={setConfirmPopulate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Populate from incidents?</AlertDialogTitle>
            <AlertDialogDescription>
              This will use AI to analyse {incidents.length} incidents and pre-fill the Triggers, Behaviour Functions, and Protective Factors sections. Existing content in those sections will be overwritten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={populateFromIncidents}>Populate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CollapsibleSection({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left font-semibold">
        {title}
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tabs/PbsPlanTab.tsx
git commit -m "feat: add PbsPlanTab with 6 collapsible sections, AI populate, PDF export"
```

---

## Phase 5: Deployment

### Task 20: Final Wiring + Vercel Deploy

- [ ] **Step 1: Verify all imports compile**

```bash
cd /Users/sylvesterjanve/Desktop/pbs-lens
npm run build
```

Fix any TypeScript errors.

- [ ] **Step 2: Deploy to Vercel**

```bash
cd /Users/sylvesterjanve/Desktop/pbs-lens
npx vercel --prod
```

Set environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

- [ ] **Step 3: Deploy edge function**

```bash
supabase functions deploy claude-proxy
```

- [ ] **Step 4: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 5: Return live Vercel URL to user**

---

## Self-Review

**Spec coverage check:**
- ✅ All 6 database tables with RLS
- ✅ Auth (email + Google OAuth)
- ✅ Dashboard with search, sort, stats bar, card grid, FAB, archived toggle
- ✅ Add Young Person form
- ✅ Person Profile with 4 tabs + edit/archive/notes
- ✅ Incidents Tab with filters, bulk select, expand/collapse, edit/delete
- ✅ Log Incident with AI code suggestion
- ✅ Trends Tab with review periods, summary cards, frequency tables
- ✅ Analysis Tab with draft analysis + Reg 44 generation
- ✅ PBS Plan Tab with 6 collapsible sections, populate from incidents, PDF export
- ✅ Claude proxy edge function (no key in client)
- ✅ All code lists with helpers
- ✅ PDF export for analysis + PBS plan
- ✅ All shared components
- ✅ Review period selector (shared)
- ✅ Notes panel
- ✅ Colour palette + Inter font
- ✅ All packages listed
- ✅ Deployment to Vercel

**Placeholder scan:** No TBDs, TODOs, or "implement later" found.

**Type consistency:** All types match across tasks. `BehaviourFunction` and `ProtectiveFactor` defined in types.ts and used consistently in PbsPlanTab.
