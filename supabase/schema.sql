-- ============================================================
-- CATalyst — Supabase Schema
-- Run this FIRST in Supabase SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── SETS (passages / DI tables for set-based questions) ──────
create table if not exists public.sets (
  id          text primary key,
  subject     text not null,
  topic       text not null,
  difficulty  text not null default 'Medium',
  instruction text,
  passage     text,
  created_at  timestamptz default now()
);

-- ── QUESTIONS ─────────────────────────────────────────────────
create table if not exists public.questions (
  id             integer primary key,
  global_q_no    integer,
  subject        text not null,
  topic          text not null,
  subtopic       text,
  micro_topic     text,
  question_type  text not null default 'single',   -- 'single' | 'set_question'
  answer_type    text not null default 'mcq',      -- 'mcq' | 'tita'
  difficulty     text not null default 'Medium',   -- 'Easy' | 'Medium' | 'Hard'
  question       text not null,
  option_a       text,
  option_b       text,
  option_c       text,
  option_d       text,
  correct_option text,                             -- 'A' | 'B' | 'C' | 'D'
  correct_value  text,                             -- TITA answer
  solution       text,
  set_id         text references public.sets(id),
  pdf_name       text,
  source         text,
  has_image      boolean default false,
  image_url      text,
  is_active      boolean default true,
  created_at     timestamptz default now()
);

-- ── ATTEMPT_LOGS ──────────────────────────────────────────────
create table if not exists public.attempt_logs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade,
  question_id     integer references public.questions(id),
  selected_option text,
  selected_value  text,
  is_correct      boolean not null,
  time_taken      integer default 0,
  source          text default 'practice',
  created_at      timestamptz default now()
);

-- ── ERROR_LOGS ────────────────────────────────────────────────
create table if not exists public.error_logs (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade,
  question_id      integer references public.questions(id),
  error_type       text not null default 'unclassified',
  user_note        text,
  reattempt_status boolean default false,
  reattempted_at   timestamptz,
  created_at       timestamptz default now()
);

-- ── USER_PROFILES ─────────────────────────────────────────────
create table if not exists public.user_profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  full_name          text,
  target_exam_date   date,
  is_paid            boolean default false,
  trial_started_at   timestamptz default now(),
  streak_count       integer default 0,
  streak_last_date   text,
  daily_goal_quant   integer default 10,
  daily_goal_lrdi    integer default 1,
  daily_goal_varc_rc integer default 1,
  daily_goal_varc_va integer default 5,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ── FEEDBACK ──────────────────────────────────────────────────
create table if not exists public.feedback (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete set null,
  type       text default 'general',
  message    text,
  created_at timestamptz default now()
);

-- ── REPORTS ───────────────────────────────────────────────────
create table if not exists public.reports (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete set null,
  question_id integer references public.questions(id),
  issue_type  text not null,
  details     text,
  created_at  timestamptz default now()
);

-- ── INDEXES ───────────────────────────────────────────────────
create index if not exists idx_questions_subject     on public.questions(subject);
create index if not exists idx_questions_topic       on public.questions(topic);
create index if not exists idx_questions_difficulty  on public.questions(difficulty);
create index if not exists idx_questions_set_id      on public.questions(set_id);
create index if not exists idx_attempt_logs_user     on public.attempt_logs(user_id);
create index if not exists idx_attempt_logs_question on public.attempt_logs(question_id);
create index if not exists idx_error_logs_user       on public.error_logs(user_id);
create index if not exists idx_error_logs_type       on public.error_logs(error_type);

-- ── AUTO-CREATE PROFILE ON SIGNUP ─────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, full_name, trial_started_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
alter table public.questions     enable row level security;
alter table public.sets          enable row level security;
alter table public.attempt_logs  enable row level security;
alter table public.error_logs    enable row level security;
alter table public.user_profiles enable row level security;
alter table public.feedback      enable row level security;
alter table public.reports       enable row level security;

-- Questions & Sets: public read
create policy "Questions public read"
  on public.questions for select using (true);

create policy "Sets public read"
  on public.sets for select using (true);

-- Attempt logs: own data only
create policy "Own attempt logs"
  on public.attempt_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Error logs: own data only
create policy "Own error logs"
  on public.error_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- User profiles: own data only
create policy "Own profile"
  on public.user_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Feedback: insert only
create policy "Insert feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

-- Reports: insert only
create policy "Insert reports"
  on public.reports for insert
  with check (auth.uid() = user_id);
