-- Email Elie when a pilot request arrives. Applied to the LabReady Pro project. Safe to re-run.
-- Needs reminders-cron.sql first (pg_net, the Vault cron secret) and the pilot-notify
-- Edge Function deployed without JWT verification (it checks the x-cron-secret header).

create or replace function private.notify_pilot_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    -- A flood of submissions shouldn't become a flood of email: skip alerts past 10 in 10 minutes.
    if (select count(*) from public.labready_pilot_requests where created_at > now() - interval '10 minutes') > 10 then
        return new;
    end if;
    perform net.http_post(
        url := 'https://wshmcrkutgglomdadtoj.supabase.co/functions/v1/pilot-notify',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'labready_cron_secret')
        ),
        body := jsonb_build_object('id', new.id),
        timeout_milliseconds := 15000
    );
    return new;
exception when others then
    -- Never lose a pilot request because the alert failed.
    return new;
end;
$$;

revoke all on function private.notify_pilot_request() from public, anon, authenticated;

drop trigger if exists labready_pilot_request_notify on public.labready_pilot_requests;
create trigger labready_pilot_request_notify
    after insert on public.labready_pilot_requests
    for each row execute function private.notify_pilot_request();
