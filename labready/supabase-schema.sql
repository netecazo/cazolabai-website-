-- LabReady Pro pilot requests, written by the pilot form on the home page (index.html).
-- Lives in the "LabReady Pro" Supabase project. Visitors can submit; nobody can read via the public API.
-- View requests in the Supabase dashboard: Table Editor > labready_pilot_requests.

create table if not exists public.labready_pilot_requests (
    id          bigint generated always as identity primary key,
    created_at  timestamptz not null default now(),
    name        text not null,
    role        text,
    email       text not null,
    lab         text not null,
    size        text,
    analyzers   text,
    pain        text,
    source      text default 'labready_landing',
    status      text not null default 'new'   -- new → contacted → demo → pilot → paid / lost
);

alter table public.labready_pilot_requests enable row level security;

drop policy if exists "anon can submit pilot requests" on public.labready_pilot_requests;
create policy "anon can submit pilot requests"
    on public.labready_pilot_requests
    for insert
    to anon, authenticated
    with check (
        status = 'new'
        and char_length(name) between 1 and 200
        and char_length(email) between 3 and 320
        and position('@' in email) > 1
        and char_length(lab) between 1 and 300
        and char_length(coalesce(role, '')) <= 100
        and char_length(coalesce(size, '')) <= 50
        and char_length(coalesce(analyzers, '')) <= 100
        and char_length(coalesce(pain, '')) <= 4000
        and char_length(coalesce(source, '')) <= 50
    );

-- Insert only: no select/update/delete for API roles.
revoke all on public.labready_pilot_requests from anon, authenticated;
grant insert (name, role, email, lab, size, analyzers, pain, source) on public.labready_pilot_requests to anon, authenticated;
