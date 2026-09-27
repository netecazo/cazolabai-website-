-- Weekly LabReady reminder email (Mondays 12:00 UTC ≈ 7–8 AM US Eastern).
-- Applied to the LabReady Pro project (wshmcrkutgglomdadtoj). Safe to re-run.
--
-- The Edge Function `competency-reminders` is deployed without JWT verification;
-- it checks the x-cron-secret header against the secret created here in Vault.
-- The Resend API key goes in Vault too (or in Edge Functions > Secrets as RESEND_API_KEY):
--   select vault.create_secret('re_...', 'labready_resend_key');
-- To replace it later:
--   select vault.update_secret((select id from vault.secrets where name = 'labready_resend_key'), 're_...');

create extension if not exists pg_cron;
create extension if not exists pg_net schema extensions;

-- A random shared secret between the cron job and the function, created once.
do $$
begin
    if not exists (select 1 from vault.secrets where name = 'labready_cron_secret') then
        perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'labready_cron_secret',
            'Shared secret for the weekly competency reminder cron job');
    end if;
end $$;

-- Settings for the function. Only the service role (the function itself) can call it.
create or replace function public.reminder_settings()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
    select jsonb_build_object(
        'cron_secret', (select decrypted_secret from vault.decrypted_secrets where name = 'labready_cron_secret'),
        'resend_key',  (select decrypted_secret from vault.decrypted_secrets where name = 'labready_resend_key')
    );
$$;
revoke all on function public.reminder_settings() from public, anon, authenticated;
grant execute on function public.reminder_settings() to service_role;

select cron.unschedule(jobid) from cron.job where jobname = 'labready-weekly-reminders';
select cron.schedule(
    'labready-weekly-reminders',
    '0 12 * * 1',
    $$
    select net.http_post(
        url := 'https://wshmcrkutgglomdadtoj.supabase.co/functions/v1/competency-reminders',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'labready_cron_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 30000
    );
    $$
);

-- To test without sending (response lands in net._http_response):
--   select net.http_post(url := 'https://wshmcrkutgglomdadtoj.supabase.co/functions/v1/competency-reminders?dry_run=1',
--       headers := jsonb_build_object('x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'labready_cron_secret')));
-- To stop: select cron.unschedule('labready-weekly-reminders');
