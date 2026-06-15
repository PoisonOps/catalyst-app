-- CAT 2026 TRACKER - Run this entire SQL in Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste this → Run

-- 1. DAILY SCORECARD
create table if not exists daily_sessions (
  id uuid default gen_random_uuid() primary key,
  date date not null unique,
  status text default 'Partial', -- Full Day / Partial / Missed
  -- VARC
  rc1_q1 int, rc1_q2 int, rc1_q3 int, rc1_q4 int,
  rc2_q1 int, rc2_q2 int, rc2_q3 int, rc2_q4 int,
  va_q1 int, va_q2 int, va_q3 int, va_q4 int,
  -- QA
  qa_topic text, qa_score int,
  -- LRDI
  lrdi_set1 boolean default false,
  lrdi_set2 boolean default false,
  error_log_updated boolean default false,
  hours_studied decimal(3,1) default 0,
  -- Daily Scorecard (new)
  focus_score int check (focus_score between 0 and 10),
  decision_quality int check (decision_quality between 0 and 10),
  energy int check (energy between 0 and 10),
  wasted_time boolean default false,
  biggest_mistake text,
  biggest_win text,
  notes text,
  created_at timestamptz default now()
);

-- 2. LRDI LOG
create table if not exists lrdi_sets (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  pdf_name text,
  set_no text,
  question_nos text,
  set_type text,
  difficulty text, -- Easy / Medium / Hard
  time_mins int,
  solved text, -- Yes — fully / Partial / No
  selection_correct text,
  mistake_type text,
  master_error_type text, -- Concept / Execution / Decision / Psychological
  trap_type text,
  key_insight text,
  fix_action text,
  revisit boolean default false,
  repeat_count int default 0,
  reattempt_status text default 'Pending', -- Pending / Done
  reattempt_date date,
  created_at timestamptz default now()
);

-- 3. ERROR LOG
create table if not exists error_log (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  section text not null, -- QA / LRDI / VARC
  pdf_name text,
  question_no text,
  page_ref text,
  topic text,
  error_type text,
  master_error_type text, -- Concept / Execution / Decision / Psychological
  trap_type text,
  why_wrong text,
  fix_rule text,
  fix_action text,
  repeat_count int default 0,
  reattempt_status text default 'Pending', -- Pending / Done
  reattempt_date date,
  created_at timestamptz default now()
);

-- 4. MOCK RESULTS
create table if not exists mock_results (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  mock_type text, -- Full Mock / VARC Sectional / QA Sectional / LRDI Sectional
  varc_score int, qa_score int, lrdi_score int, total_score int,
  percentile decimal(5,2),
  -- Mock → Action System
  stop_1 text, stop_2 text,
  start_1 text, start_2 text,
  double_down text,
  notes text,
  created_at timestamptz default now()
);

-- 5. PDF TRACKER
create table if not exists pdf_tracker (
  id uuid default gen_random_uuid() primary key,
  pdf_name text not null,
  section text not null, -- QA / LRDI / VARC
  tier text not null, -- ACTIVE / LATER
  total_questions int,
  priority text default 'Medium', -- Weak / Medium / Strong
  next_revision_date date,
  questions_data jsonb default '{}', -- {q_num: 'done'/'some'/'cant'}
  updated_at timestamptz default now()
);

-- 6. TOPIC PROGRESS (QA topics with subtopics)
create table if not exists topic_progress (
  id uuid default gen_random_uuid() primary key,
  section text not null, -- Arithmetic / Algebra / LRDI / VARC
  topic text not null,
  subtopic text,
  status text default 'Not Started', -- Not Started / In Progress / Done
  accuracy_pct int default 0,
  priority text default 'Medium',
  next_revision_date date,
  questions_done int default 0,
  questions_total int default 0,
  notes text,
  updated_at timestamptz default now(),
  unique(topic, subtopic)
);

-- 7. KILL LIST (Weekly Focus)
create table if not exists kill_list (
  id uuid default gen_random_uuid() primary key,
  week_label text not null, -- e.g. "Week 1 (Apr 27 – May 3)"
  week_start date,
  weakness_1 text,
  weakness_2 text,
  weakness_3 text,
  notes text,
  created_at timestamptz default now()
);

-- 8. PROGRESS META (stores arith/alg topic counts, streak etc)
create table if not exists progress_meta (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  value text,
  updated_at timestamptz default now()
);

-- Enable Row Level Security (allow all for anon - single user app)
alter table daily_sessions enable row level security;
alter table lrdi_sets enable row level security;
alter table error_log enable row level security;
alter table mock_results enable row level security;
alter table pdf_tracker enable row level security;
alter table topic_progress enable row level security;
alter table kill_list enable row level security;
alter table progress_meta enable row level security;

-- Allow full access (single user personal app)
create policy "allow all" on daily_sessions for all using (true) with check (true);
create policy "allow all" on lrdi_sets for all using (true) with check (true);
create policy "allow all" on error_log for all using (true) with check (true);
create policy "allow all" on mock_results for all using (true) with check (true);
create policy "allow all" on pdf_tracker for all using (true) with check (true);
create policy "allow all" on topic_progress for all using (true) with check (true);
create policy "allow all" on kill_list for all using (true) with check (true);
create policy "allow all" on progress_meta for all using (true) with check (true);

-- Seed QA topics with ALL subtopics
insert into topic_progress (section, topic, subtopic, questions_total) values
-- ARITHMETIC
('Arithmetic', 'Averages & Ratio', 'Simple Average', 50),
('Arithmetic', 'Averages & Ratio', 'Weighted Average', 30),
('Arithmetic', 'Averages & Ratio', 'Ratio & Proportion', 40),
('Arithmetic', 'Averages & Ratio', 'Mixtures & Alligations', 30),
('Arithmetic', 'Percentages', 'Basic Percentages', 40),
('Arithmetic', 'Percentages', 'Percentage Change', 30),
('Arithmetic', 'Percentages', 'Successive Change', 20),
('Arithmetic', 'Profit & Loss', 'Basic P&L', 35),
('Arithmetic', 'Profit & Loss', 'Discount & Markup', 25),
('Arithmetic', 'Profit & Loss', 'Dishonest Dealer', 15),
('Arithmetic', 'Profit & Loss', 'Partnership', 20),
('Arithmetic', 'Time-Speed-Distance', 'Basic TSD', 40),
('Arithmetic', 'Time-Speed-Distance', 'Relative Speed', 30),
('Arithmetic', 'Time-Speed-Distance', 'Trains & Boats', 25),
('Arithmetic', 'Time-Speed-Distance', 'Circular Track', 15),
('Arithmetic', 'Time & Work', 'Basic Work', 30),
('Arithmetic', 'Time & Work', 'Pipes & Cisterns', 20),
('Arithmetic', 'Time & Work', 'Efficiency Problems', 20),
('Arithmetic', 'SI & CI', 'Simple Interest', 20),
('Arithmetic', 'SI & CI', 'Compound Interest', 25),
('Arithmetic', 'SI & CI', 'Half-Yearly / Quarterly', 15),
-- ALGEBRA
('Algebra', 'Linear Equations', 'Single Variable', 25),
('Algebra', 'Linear Equations', 'Two Variables', 30),
('Algebra', 'Linear Equations', 'Three Variables', 15),
('Algebra', 'Linear Equations', 'Word Problems', 30),
('Algebra', 'Quadratic Equations', 'Factorization', 20),
('Algebra', 'Quadratic Equations', 'Discriminant & Roots', 25),
('Algebra', 'Quadratic Equations', 'Sum & Product of Roots', 20),
('Algebra', 'Inequalities', 'Basic Inequalities', 25),
('Algebra', 'Inequalities', 'Modulus', 20),
('Algebra', 'Inequalities', 'Quadratic Inequalities', 20),
('Algebra', 'Functions & Graphs', 'Domain & Range', 20),
('Algebra', 'Functions & Graphs', 'Graph Transformations', 15),
('Algebra', 'Functions & Graphs', 'Max/Min Problems', 20),
('Algebra', 'Progressions', 'AP — nth term & Sum', 25),
('Algebra', 'Progressions', 'GP — nth term & Sum', 25),
('Algebra', 'Progressions', 'HP & Mixed', 15),
('Algebra', 'Logarithms', 'Log Rules', 25),
('Algebra', 'Logarithms', 'Log Equations', 20),
('Algebra', 'Logarithms', 'Surds & Indices', 20),
('Algebra', 'Number Systems', 'Divisibility Rules', 20),
('Algebra', 'Number Systems', 'Remainders & Cyclicity', 30),
('Algebra', 'Number Systems', 'LCM & HCF', 20),
('Algebra', 'Number Systems', 'Factors & Factorials', 25),
('Algebra', 'Number Systems', 'Base System', 15),
-- ADVANCED (Phase 2+)
('Advanced', 'Geometry', 'Lines & Angles', 20),
('Advanced', 'Geometry', 'Triangles', 35),
('Advanced', 'Geometry', 'Circles', 30),
('Advanced', 'Geometry', 'Quadrilaterals', 20),
('Advanced', 'Geometry', 'Coordinate Geometry', 25),
('Advanced', 'Geometry', 'Mensuration 2D', 25),
('Advanced', 'Geometry', 'Mensuration 3D', 20),
('Advanced', 'Probability', 'Basic Probability', 20),
('Advanced', 'Probability', 'Conditional Probability', 15),
('Advanced', 'Probability', 'Combinations & Permutations', 30),
('Advanced', 'Probability', 'Binomial Distribution', 10),
('Advanced', 'Remainders', 'Basic Remainders', 20),
('Advanced', 'Remainders', 'Fermat & Wilson Theorem', 10),
('Advanced', 'Venn Diagrams', '2-Set Problems', 15),
('Advanced', 'Venn Diagrams', '3-Set Problems', 15),
-- LRDI
('LRDI', 'Arrangement', 'Linear Arrangement', 30),
('LRDI', 'Arrangement', 'Circular Arrangement', 25),
('LRDI', 'Arrangement', 'Matrix/Grid', 20),
('LRDI', 'Puzzle', 'Binary Puzzle', 20),
('LRDI', 'Puzzle', 'Comparison Puzzle', 20),
('LRDI', 'DI', 'Bar & Line Chart', 35),
('LRDI', 'DI', 'Pie Chart', 20),
('LRDI', 'DI', 'Table DI', 30),
('LRDI', 'DI', 'Mixed Charts', 25),
('LRDI', 'Selection', 'Conditional Selection', 25),
('LRDI', 'Selection', 'Group Formation', 20),
('LRDI', 'Games & Tournaments', 'Knockout', 20),
('LRDI', 'Games & Tournaments', 'League', 20),
('LRDI', 'Scheduling', 'Scheduling Sets', 15),
('LRDI', 'Venn Diagram', 'LR Venn', 15),
('LRDI', 'Maxima-Minima', 'Optimization Sets', 15),
-- VARC
('VARC', 'Reading Comprehension', 'Philosophy / Abstract', 30),
('VARC', 'Reading Comprehension', 'Economics / Business', 35),
('VARC', 'Reading Comprehension', 'Science / Technology', 25),
('VARC', 'Reading Comprehension', 'Sociology / History', 25),
('VARC', 'Reading Comprehension', 'Literature / Culture', 20),
('VARC', 'Para Jumbles', 'Para Jumbles', 60),
('VARC', 'Odd One Out', 'Odd One Out', 30),
('VARC', 'Para Completion', 'Para Completion', 30),
('VARC', 'Verbal Ability', 'Critical Reasoning', 25),
('VARC', 'Verbal Ability', 'Grammar & Sentence Correction', 40)
on conflict (topic, subtopic) do nothing;

select 'Setup complete! All tables created.' as result;
