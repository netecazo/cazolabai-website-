-- Schedule the weekly LabReady reminder email (Mondays 12:00 UTC ≈ 7–8 AM US Eastern).
-- Prerequisites:
--   1. Deploy the function without JWT verification (it checks its own secret):
--        supabase functions deploy competency-reminders --no-verify-jwt
--   2. Set its secrets: CRON_SECRET, RESEND_API_KEY, FROM_EMAIL, APP_URL
--   3. Enable the pg_cron and pg_net extensions (Database > Extensions).
--   4. Store the same CRON_SECRET in Vault so it isn't written into the cron job:
--        select vault.create_secret('<your CRON_SECRET>', 'labready_cron_secret');
-- Replace <project-ref> below, then run this once in the SQL editor.

select cron.schedule(
    'labready-weekly-reminders',
    '0 12 * * 1',
    $$
    select net.http_post(
        url := 'https://<project-ref>.supabase.co/functions/v1/competency-reminders',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'labready_cron_secret')
        ),
        body := '{}'::jsonb
    );
    $$
);

-- To test without sending, call the function with ?dry_run=1 and the x-cron-secret header.
-- To stop: select cron.unschedule('labready-weekly-reminders');
