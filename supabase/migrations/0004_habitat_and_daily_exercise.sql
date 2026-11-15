-- AstroVital · habitat and daily exercise reset
-- CU-04: the crew is in a place (vehicle or base); gravity follows from it. Older rows keep a
-- null habitat and the app picks the default place for their gravity.
-- CU-05: exercise minutes belong to a day; minutes from another day count as 0.

alter table mission_state
  add column habitat text check (habitat in ('SPACECRAFT', 'ISS', 'LUNAR_BASE', 'LUNAR_ROVER', 'MARS_BASE', 'MARS_ROVER', 'EARTH'));

update mission_state set habitat = case gravity_environment
  when 'ZERO_G' then 'ISS' when 'LUNAR' then 'LUNAR_BASE' when 'MARTIAN' then 'MARS_BASE' else 'EARTH' end
where id = 1 and habitat is null;

alter table musculoskeletal_status
  add column exercise_logged_on date;
