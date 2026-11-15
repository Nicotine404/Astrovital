-- AstroVital · CU gaps
-- CU-07: protein intake. CU-05: vision / dizziness self-report. CU-04: the exercise target now
-- follows the gravity environment (set by ChangeGravityEnvironmentUseCase), so its default
-- matches the MARTIAN routine that mission_state starts with.

alter table nutrition_logs
  add column protein_g numeric not null default 0;

alter table musculoskeletal_status
  add column vision_symptom smallint not null default 0 check (vision_symptom between 0 and 3),
  add column dizziness_symptom smallint not null default 0 check (dizziness_symptom between 0 and 3),
  add column symptoms_recorded_at timestamptz,
  alter column exercise_target_minutes set default 90;
