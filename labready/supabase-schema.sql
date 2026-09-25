-- LabReady Pro pilot requests, written by the form on /labready/.
-- Run once in the Supabase SQL editor (same project as cazotask_waitlist).

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

-- The public site may only insert. Reading happens from the dashboard / service role.
create policy "anon can submit pilot requests"
    on public.labready_pilot_requests
    for insert
    to anon
    with check (true);
