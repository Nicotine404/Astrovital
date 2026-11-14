-- AstroVital · initial schema
-- Mirrors the row types in src/features/*/infrastructure/persistence/mappers/*.mapper.ts.
-- Unique constraints match the upsert conflict targets used by the Supabase adapters.

create type health_status as enum ('NOMINAL', 'WARNING', 'CRITICAL');
create type gravity_environment as enum ('ZERO_G', 'LUNAR', 'MARTIAN', 'EARTH');

-- ───────────────────────────── health-monitoring ─────────────────────────────

create table mission_state (
  id smallint primary key default 1 check (id = 1),
  gravity_environment gravity_environment not null default 'MARTIAN',
  updated_at timestamptz not null default now()
);
insert into mission_state (id) values (1);

create table astronauts (
  id text primary key,
  name text not null,
  short_name text not null,
  initials text not null check (char_length(initials) between 1 and 3),
  role text not null,
  suit_id text not null,
  blood_type text not null,
  height_cm numeric(5,1) not null check (height_cm between 120 and 230),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table vital_signs (
  id bigint generated always as identity primary key,
  astronaut_id text not null references astronauts(id) on delete cascade,
  recorded_at timestamptz not null,
  heart_rate numeric not null,
  systolic numeric not null,
  diastolic numeric not null,
  spo2 numeric not null check (spo2 between 0 and 100),
  respiratory_rate numeric not null,
  core_temperature numeric not null,
  glucose numeric not null,
  cardiac_output numeric not null,
  intracranial_pressure numeric not null,
  unique (astronaut_id, recorded_at)
);
create index vital_signs_astronaut_time on vital_signs (astronaut_id, recorded_at desc);

create view latest_vital_signs with (security_invoker = true) as
  select distinct on (astronaut_id) *
  from vital_signs
  order by astronaut_id, recorded_at desc;

create table organ_assessments (
  astronaut_id text not null references astronauts(id) on delete cascade,
  structure_id text not null,
  clinical_status health_status not null,
  status health_status not null,
  title text not null,
  summary text not null,
  metrics jsonb not null default '[]'::jsonb,
  recommended_action text not null default '',
  primary key (astronaut_id, structure_id)
);

create table radiation_dosimetry (
  astronaut_id text primary key references astronauts(id) on delete cascade,
  cumulative_msv numeric not null default 0,
  neutron_cumulative_msv numeric not null default 0,
  career_limit_msv numeric not null default 600
);

create table radiation_readings (
  id bigint generated always as identity primary key,
  astronaut_id text not null references astronauts(id) on delete cascade,
  recorded_at timestamptz not null,
  source text not null check (source in ('GCR', 'SPE')),
  dose_rate_msv_day numeric not null check (dose_rate_msv_day >= 0),
  neutron_flux numeric not null check (neutron_flux >= 0),
  duration_hours numeric not null check (duration_hours > 0),
  unique (astronaut_id, recorded_at)
);

create table musculoskeletal_status (
  astronaut_id text primary key references astronauts(id) on delete cascade,
  bone_density_delta_pct numeric not null default 0,
  muscle_mass_delta_pct numeric not null default 0,
  cephalic_fluid_shift_mmhg numeric not null default 0,
  spinal_elongation_cm numeric not null default 0,
  exercise_minutes_today numeric not null default 0,
  exercise_target_minutes numeric not null default 120
);

create table musculoskeletal_history (
  id bigint generated always as identity primary key,
  astronaut_id text not null references astronauts(id) on delete cascade,
  recorded_at timestamptz not null,
  bone_density_delta_pct numeric not null,
  cephalic_fluid_shift_mmhg numeric not null,
  exercise_minutes numeric not null,
  unique (astronaut_id, recorded_at)
);

create table mental_checkins (
  id bigint generated always as identity primary key,
  astronaut_id text not null references astronauts(id) on delete cascade,
  recorded_at timestamptz not null,
  sleep_hours numeric not null check (sleep_hours between 0 and 24),
  stress_level numeric not null check (stress_level between 0 and 10),
  mood numeric not null check (mood between 0 and 10),
  notes text,
  unique (astronaut_id, recorded_at)
);

create table nutrition_logs (
  astronaut_id text not null references astronauts(id) on delete cascade,
  log_date date not null,
  calories_kcal numeric not null default 0,
  water_ml numeric not null default 0,
  calcium_mg numeric not null default 0,
  vitamin_d_iu numeric not null default 0,
  primary key (astronaut_id, log_date)
);

-- ──────────────────────────── clinical-diagnostics ───────────────────────────

create table diagnoses (
  id text primary key,
  astronaut_id text not null references astronauts(id) on delete cascade,
  title text not null,
  status health_status not null,
  probability numeric not null check (probability between 0 and 100),
  summary text not null,
  evidence jsonb not null default '[]'::jsonb,
  recommendation text not null,
  differentials jsonb not null default '[]'::jsonb
);

create table clinical_files (
  id text primary key,
  astronaut_id text not null references astronauts(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('pdf', 'audio', 'video', 'dicom')),
  size_mb numeric not null check (size_mb >= 0),
  captured_at timestamptz not null default now(),
  findings text not null,
  confidence numeric not null check (confidence between 0 and 100),
  model text not null,
  latency_ms integer not null
);
create index clinical_files_astronaut on clinical_files (astronaut_id, captured_at desc);

-- ───────────────────────────────── mission-ops ───────────────────────────────

create table medkit_items (
  id text primary key,
  locker text not null,
  name text not null,
  category text not null,
  stock numeric not null check (stock >= 0),
  capacity numeric not null check (capacity > 0),
  unit text not null,
  expires text not null default '—',
  note text,
  check (stock <= capacity)
);

create table eclss_readings (
  id text primary key,
  sort_order smallint not null default 0,
  label text not null,
  value numeric not null,
  unit text not null,
  min_value numeric not null,
  max_value numeric not null,
  nominal_low numeric not null,
  nominal_high numeric not null,
  note text,
  history numeric[] not null default '{}'
);

-- ───────────────────────────── row level security ────────────────────────────
-- Mission-control operators authenticate through Supabase Auth; anonymous access is denied.

do $$
declare t text;
begin
  foreach t in array array[
    'mission_state', 'astronauts', 'vital_signs', 'organ_assessments', 'radiation_dosimetry',
    'radiation_readings', 'musculoskeletal_status', 'musculoskeletal_history', 'mental_checkins',
    'nutrition_logs', 'diagnoses', 'clinical_files', 'medkit_items', 'eclss_readings'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "%s: crew operators read" on %I for select to authenticated using (true)', t, t);
    execute format('create policy "%s: crew operators write" on %I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- ────────────────────────────────── realtime ─────────────────────────────────
-- The browser subscribes to inserts on vital_signs (SupabaseVitalsStream).

alter publication supabase_realtime add table vital_signs;
