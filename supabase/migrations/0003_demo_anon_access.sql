-- AstroVital · demo access for the anon role
-- The hackathon build has no login: the app talks to Supabase with the anon key, so the
-- `anon` role needs the same read/write access that 0001 gives to `authenticated`.
-- DEMO ONLY: anyone holding the anon key can read and write every table. Drop these
-- policies (or add Supabase Auth) before storing real health data.

grant usage on schema public to anon;
grant select, insert, update, delete on all tables in schema public to anon;
grant usage, select on all sequences in schema public to anon;

do $$
declare t text;
begin
  foreach t in array array[
    'mission_state', 'astronauts', 'vital_signs', 'organ_assessments', 'radiation_dosimetry',
    'radiation_readings', 'musculoskeletal_status', 'musculoskeletal_history', 'mental_checkins',
    'nutrition_logs', 'diagnoses', 'clinical_files', 'medkit_items', 'eclss_readings'
  ] loop
    execute format('create policy "%s: demo anon read" on %I for select to anon using (true)', t, t);
    execute format('create policy "%s: demo anon write" on %I for all to anon using (true) with check (true)', t, t);
  end loop;
end $$;
