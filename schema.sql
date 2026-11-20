-- Run in Supabase SQL Editor. Public read; authenticated producer notes only.
create table if not exists public.readings (
 id uuid primary key default gen_random_uuid(),
 recorded_at timestamptz not null,
 slot text not null check (slot in ('07:00','12:00','16:00')),
 device_id text not null,
 soil_ph numeric check (soil_ph between 0 and 14),
 soil_moisture numeric check (soil_moisture between 0 and 100),
 soil_temp numeric check (soil_temp between -20 and 80),
 air_humidity numeric check (air_humidity between 0 and 100),
 air_temp numeric check (air_temp between -30 and 70),
 weather text,
 note text check (length(note)<=1000),
 created_at timestamptz not null default now(),
 unique(device_id,recorded_at)
);
create index if not exists readings_recorded_at_idx on public.readings(recorded_at desc);
alter table public.readings enable row level security;
create policy "Public can read measurements" on public.readings for select to anon,authenticated using (true);
-- Set producer accounts in Auth; no public signup in dashboard.
create policy "Signed-in producers can update notes" on public.readings for update to authenticated using (true) with check (true);
-- Restrict column updates to notes only. No INSERT rights to browser clients.
revoke all on public.readings from anon,authenticated;
grant select on public.readings to anon,authenticated;
grant update (weather,note) on public.readings to authenticated;
-- Realtime optional; polling works without it.
do $$ begin alter publication supabase_realtime add table public.readings; exception when duplicate_object then null; end $$;
