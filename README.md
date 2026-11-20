# Tân Trà IoT Monitoring Dashboard

A deployable Vietnamese dashboard for five real environmental measurements (soil pH, soil moisture, soil temperature, air humidity, air temperature), three daily measurement slots (07:00, 12:00, 16:00 Asia/Ho_Chi_Minh), historical charts, CSV export and authenticated producer notes. **No fabricated readings.**

## 1. Supabase database

1. Create a project at https://supabase.com and open **SQL Editor**.
2. Run the full contents of `supabase/schema.sql` once. (If you re-run it, the `create policy` statements will need to be removed or policies dropped first.)
3. In **Authentication > Users**, create the producer's email/password account. Disable public signup if not needed.
4. In **Project Settings > API**, copy Project URL and the **publishable/anon key** (NOT service_role).

## 2. Deploy IoT ingestion endpoint

Install Supabase CLI (https://supabase.com/docs/guides/local-development/cli/getting-started), then:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set IOT_INGEST_TOKEN=YOUR_LONG_RANDOM_SECRET
supabase functions deploy ingest-reading --no-verify-jwt
```

**Security:** `--no-verify-jwt` allows hardware to call the endpoint without Supabase JWT, but the function **requires** the `x-device-token` secret header. Keep this secret only on the IoT gateway/server, never in the website. Use HTTPS. Rotate the token if exposed. The service role key is read only by the Edge Function environment and never goes into frontend variables.

Example POST from the gateway (use actual sensor measurements, not the example numbers):

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-reading' \
  -H 'Content-Type: application/json' \
  -H 'x-device-token: YOUR_LONG_RANDOM_SECRET' \
  -d '{"device_id":"tantra-field-01","recorded_at":"2026-11-21T07:00:00+07:00","slot":"07:00","soil_ph":5.5,"soil_moisture":58.0,"soil_temp":23.5,"air_humidity":78.0,"air_temp":25.0}'
```

This is **only an API example**, not real measurements. Replace timestamp and values with actual readings. `recorded_at` must include a timezone offset. The sender must schedule transmissions at 07:00, 12:00, and 16:00 in `Asia/Ho_Chi_Minh`; the dashboard does **not** trigger hardware readings. A gateway such as ESP32 + network connection or a Raspberry Pi can send HTTPS POST. The exact hardware protocol and sensor calibration must be implemented for the devices actually installed. Sensor devices without Wi-Fi/network connectivity require a connected gateway.

## 3. Local frontend

```bash
cp .env.example .env
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
npm install
npm run dev
```

Visit the local URL displayed by Vite.

## 4. Public link on Vercel

1. Push this folder to a GitHub repository (do **not** commit `.env` or device tokens).
2. Visit https://vercel.com/new, import the repository.
3. Set environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel Project Settings.
4. Deploy. Vercel creates a working public URL like `your-project.vercel.app` (actual URL is assigned at deployment).
5. In Supabase Auth URL configuration, add the Vercel URL to allowed redirect URLs if your chosen auth flow needs redirects.

## Operational notes

- Public dashboard is intentionally read-only; producer notes require a login.
- Notes are attached to a specific reading, not to an arbitrary day. Public visitors can see notes.
- Data refreshes every minute and through Supabase Realtime where enabled.
- Physical bounds are validated, but **agronomic alert thresholds have not been established**. Do not interpret physical bounds as tea-growing recommendations.
- For production, add per-device credentials, token rotation, rate limits, audit trail, backups, data-retention policy, and server-side device timestamp/slot validation. A shared token is a starter design, not a full device identity system.
- Use actual sensors capable of digital output or a compatible gateway. Manual meters cannot send readings automatically by themselves.
