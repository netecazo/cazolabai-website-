-- LabReady Pro app schema (labready/app/).
-- Run once in the Supabase SQL editor. Every table is scoped to a lab, and
-- row-level security lets a signed-in user see only the labs they belong to.
-- No patient data (PHI) is stored anywhere in this schema.

-- ---------- Tables ----------

create table if not exists public.labs (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    created_by  uuid not null default auth.uid() references auth.users(id),
    created_at  timestamptz not null default now()
);

create table if not exists public.lab_members (
    lab_id        uuid not null references public.labs(id) on delete cascade,
    user_id       uuid not null references auth.users(id) on delete cascade,
    role          text not null default 'supervisor'
                  check (role in ('admin', 'supervisor', 'assessor', 'director')),
    display_name  text not null default '',
    created_at    timestamptz not null default now(),
    primary key (lab_id, user_id)
);

create table if not exists public.staff (
    id          uuid primary key default gen_random_uuid(),
    lab_id      uuid not null references public.labs(id) on delete cascade,
    name        text not null,
    email       text,
    position    text,
    hire_date   date,
    active      boolean not null default true,
    created_at  timestamptz not null default now(),
    unique (id, lab_id)
);

create table if not exists public.test_systems (
    id          uuid primary key default gen_random_uuid(),
    lab_id      uuid not null references public.labs(id) on delete cascade,
    name        text not null,
    instrument  text,
    section     text,
    active      boolean not null default true,
    created_at  timestamptz not null default now(),
    unique (id, lab_id)
);

create table if not exists public.competencies (
    id              uuid primary key default gen_random_uuid(),
    lab_id          uuid not null references public.labs(id) on delete cascade,
    staff_id        uuid not null,
    test_system_id  uuid not null,
    kind            text not null
                    check (kind in ('initial', '6-month', '12-month', 'annual', 'retraining')),
    due_date        date not null,
    elements        jsonb not null default '[]'::jsonb,   -- six {evidence, date, assessor, result}
    overall         text,                                 -- 'competent' | 'not_competent'
    remediation     text,
    signoffs        jsonb not null default '{}'::jsonb,   -- {assessor|supervisor|director: {name, at, user_id}}
    completed_at    timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    -- Composite keys stop a competency pointing at another lab's staff or test system.
    foreign key (staff_id, lab_id) references public.staff(id, lab_id) on delete cascade,
    foreign key (test_system_id, lab_id) references public.test_systems(id, lab_id) on delete cascade
);

create index if not exists staff_lab_idx on public.staff(lab_id);
create index if not exists test_systems_lab_idx on public.test_systems(lab_id);
create index if not exists competencies_lab_due_idx on public.competencies(lab_id, due_date);
create index if not exists competencies_staff_lab_idx on public.competencies(staff_id, lab_id);
create index if not exists competencies_system_lab_idx on public.competencies(test_system_id, lab_id);
create index if not exists lab_members_user_idx on public.lab_members(user_id);
create index if not exists labs_created_by_idx on public.labs(created_by);

-- ---------- Helpers ----------
-- Internal helpers live in a "private" schema, which the Supabase API doesn't expose,
-- so they can't be called directly over /rest/v1/rpc.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_lab_member(p_lab uuid)
returns boolean language sql stable security definer set search_path = public as $$
    select exists (select 1 from lab_members where lab_id = p_lab and user_id = auth.uid());
$$;

create or replace function private.is_lab_admin(p_lab uuid)
returns boolean language sql stable security definer set search_path = public as $$
    select exists (select 1 from lab_members where lab_id = p_lab and user_id = auth.uid() and role = 'admin');
$$;

-- Creates a lab and makes the caller its admin, in one step.
create or replace function public.create_lab(p_name text, p_display_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
    if auth.uid() is null then raise exception 'not signed in'; end if;
    insert into labs (name, created_by) values (p_name, auth.uid()) returning id into new_id;
    insert into lab_members (lab_id, user_id, role, display_name)
        values (new_id, auth.uid(), 'admin', coalesce(p_display_name, ''));
    return new_id;
end;
$$;

-- Lets a lab admin add a colleague who has already created a LabReady account.
create or replace function public.add_lab_member(p_lab uuid, p_email text, p_role text, p_display_name text)
returns void language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
    if not private.is_lab_admin(p_lab) then raise exception 'only lab admins can add members'; end if;
    select id into target from auth.users where lower(email) = lower(p_email);
    if target is null then raise exception 'no LabReady account for that email yet: ask them to sign up first'; end if;
    insert into lab_members (lab_id, user_id, role, display_name)
        values (p_lab, target, p_role, coalesce(p_display_name, ''))
        on conflict (lab_id, user_id) do update set role = excluded.role, display_name = excluded.display_name;
end;
$$;

-- Lets any member change the name shown on their own sign-offs (not their role).
create or replace function public.set_my_display_name(p_lab uuid, p_name text)
returns void language sql security definer set search_path = public as $$
    update lab_members set display_name = p_name where lab_id = p_lab and user_id = auth.uid();
$$;

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists competencies_touch on public.competencies;
create trigger competencies_touch before update on public.competencies
    for each row execute function private.touch_updated_at();

-- ---------- Row-level security ----------

alter table public.labs          enable row level security;
alter table public.lab_members   enable row level security;
alter table public.staff         enable row level security;
alter table public.test_systems  enable row level security;
alter table public.competencies  enable row level security;

drop policy if exists "members read lab" on public.labs;
create policy "members read lab" on public.labs
    for select to authenticated using (private.is_lab_member(id));

drop policy if exists "admins rename lab" on public.labs;
create policy "admins rename lab" on public.labs
    for update to authenticated using (private.is_lab_admin(id)) with check (private.is_lab_admin(id));

drop policy if exists "members read members" on public.lab_members;
create policy "members read members" on public.lab_members
    for select to authenticated using (private.is_lab_member(lab_id));

drop policy if exists "admins manage members" on public.lab_members;
create policy "admins manage members" on public.lab_members
    for delete to authenticated using (private.is_lab_admin(lab_id) and user_id <> (select auth.uid()));

-- staff, test_systems, competencies: full access for members of the owning lab.
do $$
declare t text;
begin
    foreach t in array array['staff', 'test_systems', 'competencies'] loop
        execute format('drop policy if exists "lab members all" on public.%I', t);
        execute format(
            'create policy "lab members all" on public.%I for all to authenticated
             using (private.is_lab_member(lab_id)) with check (private.is_lab_member(lab_id))', t);
    end loop;
end $$;

-- Functions are executable by PUBLIC by default; limit the lab functions to signed-in users.
revoke execute on function public.create_lab(text, text) from public, anon;
revoke execute on function public.add_lab_member(uuid, text, text, text) from public, anon;
revoke execute on function public.set_my_display_name(uuid, text) from public, anon;
grant execute on function public.create_lab(text, text) to authenticated;
grant execute on function public.add_lab_member(uuid, text, text, text) to authenticated;
grant execute on function public.set_my_display_name(uuid, text) to authenticated;

-- =====================================================================
-- Record integrity and audit history
-- Enforced in the database so it can't be bypassed from the browser.
-- =====================================================================

create table if not exists public.competency_events (
    id             bigint generated always as identity primary key,
    lab_id         uuid not null references public.labs(id) on delete cascade,
    competency_id  uuid not null,          -- no FK: history outlives a deleted record
    actor          uuid,
    actor_name     text,
    action         text not null,          -- created, edited, due_changed, signed, unsigned, completed, reopened, deleted
    detail         jsonb not null default '{}'::jsonb,
    at             timestamptz not null default now()
);
create index if not exists competency_events_comp_idx on public.competency_events(competency_id, at);
create index if not exists competency_events_lab_idx on public.competency_events(lab_id);

alter table public.competency_events enable row level security;
drop policy if exists "members read events" on public.competency_events;
create policy "members read events" on public.competency_events
    for select to authenticated using (private.is_lab_member(lab_id));
-- No insert/update/delete policies: only the triggers below can write history.

create or replace function private.member_name(p_lab uuid)
returns text language sql stable security definer set search_path = public as $$
    select coalesce(nullif(display_name, ''), (select email from auth.users where id = auth.uid()))
    from lab_members where lab_id = p_lab and user_id = auth.uid();
$$;

create or replace function private.member_role(p_lab uuid)
returns text language sql stable security definer set search_path = public as $$
    select role from lab_members where lab_id = p_lab and user_id = auth.uid();
$$;

-- Before update/delete: lock completed records and stamp signatures server-side.
create or replace function private.competencies_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare k text;
begin
    if tg_op = 'DELETE' then
        if old.completed_at is not null then
            raise exception 'Completed competency records can''t be deleted. Reopen the record first.';
        end if;
        return old;
    end if;

    -- A completed record may only be reopened (completed_at cleared); nothing else changes.
    if old.completed_at is not null and new.completed_at is not null and (
        new.elements is distinct from old.elements or new.overall is distinct from old.overall or
        new.remediation is distinct from old.remediation or new.due_date is distinct from old.due_date or
        new.kind is distinct from old.kind or new.staff_id is distinct from old.staff_id or
        new.test_system_id is distinct from old.test_system_id)
    then
        raise exception 'This record is signed off and locked. Reopen it to make changes.';
    end if;

    -- Any new or changed signature is re-stamped with the real signer, their role and the server time.
    for k in select jsonb_object_keys(coalesce(new.signoffs, '{}'::jsonb)) loop
        if (old.signoffs -> k) is null or (old.signoffs -> k) is distinct from (new.signoffs -> k) then
            new.signoffs := jsonb_set(new.signoffs, array[k], jsonb_build_object(
                'name', private.member_name(new.lab_id), 'role', private.member_role(new.lab_id),
                'user_id', auth.uid(), 'at', now()));
        end if;
    end loop;

    -- Completion is only valid with a supervisor signature, an overall result and six recorded methods.
    if new.completed_at is not null and old.completed_at is null then
        if (new.signoffs -> 'supervisor') is null or new.overall is null or
           (select count(*) from jsonb_array_elements(new.elements) e where coalesce(e ->> 'result', '') <> '') < 6 then
            raise exception 'A record can only be completed with all six methods, an overall result and supervisor sign-off.';
        end if;
        new.completed_at := now();
    end if;
    return new;
end;
$$;

drop trigger if exists competencies_guard_upd on public.competencies;
create trigger competencies_guard_upd before update on public.competencies
    for each row execute function private.competencies_guard();
drop trigger if exists competencies_guard_del on public.competencies;
create trigger competencies_guard_del before delete on public.competencies
    for each row execute function private.competencies_guard();

-- After insert/update/delete: write the history.
create or replace function private.competencies_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    k text;
    lab uuid := coalesce(new.lab_id, old.lab_id);
    who text := private.member_name(lab);
    ev jsonb[] := '{}';
    e jsonb;
begin
    if not exists (select 1 from labs where id = lab) then return null; end if;  -- whole lab being deleted
    if tg_op = 'INSERT' then
        ev := ev || jsonb_build_object('action', 'created', 'detail', jsonb_build_object('kind', new.kind, 'due_date', new.due_date));
    elsif tg_op = 'DELETE' then
        ev := ev || jsonb_build_object('action', 'deleted', 'detail', jsonb_build_object(
            'kind', old.kind, 'due_date', old.due_date, 'staff_id', old.staff_id, 'test_system_id', old.test_system_id));
    else
        if new.due_date is distinct from old.due_date then
            ev := ev || jsonb_build_object('action', 'due_changed', 'detail', jsonb_build_object('from', old.due_date, 'to', new.due_date));
        end if;
        if new.elements is distinct from old.elements or new.overall is distinct from old.overall or new.remediation is distinct from old.remediation then
            ev := ev || jsonb_build_object('action', 'edited', 'detail', jsonb_build_object(
                'methods_recorded', (select count(*) from jsonb_array_elements(new.elements) x where coalesce(x ->> 'result', '') <> ''),
                'overall', new.overall));
        end if;
        for k in select jsonb_object_keys(coalesce(new.signoffs, '{}'::jsonb)) loop
            if (old.signoffs -> k) is distinct from (new.signoffs -> k) then
                ev := ev || jsonb_build_object('action', 'signed', 'detail', jsonb_build_object('as', k));
            end if;
        end loop;
        for k in select jsonb_object_keys(coalesce(old.signoffs, '{}'::jsonb)) loop
            if (new.signoffs -> k) is null then
                ev := ev || jsonb_build_object('action', 'unsigned', 'detail', jsonb_build_object('as', k, 'was', old.signoffs -> k -> 'name'));
            end if;
        end loop;
        if new.completed_at is not null and old.completed_at is null then
            ev := ev || jsonb_build_object('action', 'completed', 'detail', jsonb_build_object('overall', new.overall));
        elsif new.completed_at is null and old.completed_at is not null then
            ev := ev || jsonb_build_object('action', 'reopened', 'detail', '{}'::jsonb);
        end if;
    end if;

    foreach e in array ev loop
        insert into competency_events (lab_id, competency_id, actor, actor_name, action, detail)
        values (lab, coalesce(new.id, old.id), auth.uid(), who, e ->> 'action', e -> 'detail');
    end loop;
    return null;
end;
$$;

drop trigger if exists competencies_log on public.competencies;
create trigger competencies_log after insert or update or delete on public.competencies
    for each row execute function private.competencies_log();

-- =====================================================================
-- Email reminders (see supabase/functions/competency-reminders)
-- =====================================================================

alter table public.lab_members add column if not exists email_reminders boolean not null default true;

create or replace function public.set_my_reminders(p_lab uuid, p_on boolean)
returns void language sql security definer set search_path = public as $$
    update lab_members set email_reminders = p_on where lab_id = p_lab and user_id = auth.uid();
$$;
revoke execute on function public.set_my_reminders(uuid, boolean) from public, anon;
grant execute on function public.set_my_reminders(uuid, boolean) to authenticated;

-- =====================================================================
-- Quiz links: a tech takes a module quiz on their own device.
-- A supervisor creates a single-use link for one competency record. The tech
-- opens it without an account, answers, and the database marks the answers
-- against private.quiz_keys (see supabase-quiz-keys.sql). The supervisor then
-- adds the score to method 6 of the record.
-- =====================================================================

create table if not exists private.quiz_keys (
    module_id  text not null,
    q          int  not null,
    answer     int  not null,
    primary key (module_id, q)
);
revoke all on private.quiz_keys from public, anon, authenticated;

-- Placeholder until supabase-quiz-keys.sql runs; left alone on re-runs so it doesn't undo that file.
do $$ begin
    if to_regprocedure('private.quiz_pass_mark()') is null then
        create function private.quiz_pass_mark() returns int language sql immutable set search_path = '' as 'select 80';
    end if;
end $$;

-- Lets quiz links point at a record in the same lab only.
do $$ begin
    alter table public.competencies add constraint competencies_id_lab_key unique (id, lab_id);
exception when duplicate_table or duplicate_object then null; end $$;

create table if not exists public.quiz_links (
    id               uuid primary key default gen_random_uuid(),
    lab_id           uuid not null references public.labs(id) on delete cascade,
    competency_id    uuid not null,
    staff_id         uuid not null,
    module_id        text not null check (module_id ~ '^[0-9]{2}$'),
    token            text not null unique
                     default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
    created_by       uuid default auth.uid(),
    created_by_name  text,
    created_at       timestamptz not null default now(),
    expires_at       timestamptz not null default now() + interval '14 days',
    cancelled_at     timestamptz,
    submitted_at     timestamptz,
    taker_name       text,
    answers          jsonb,
    correct          int,
    total            int,
    percent          int,
    pass_mark        int,
    passed           boolean,
    foreign key (competency_id, lab_id) references public.competencies(id, lab_id) on delete cascade,
    foreign key (staff_id, lab_id) references public.staff(id, lab_id) on delete cascade
);
create index if not exists quiz_links_comp_idx on public.quiz_links(competency_id, lab_id);
create index if not exists quiz_links_staff_idx on public.quiz_links(staff_id, lab_id);
create index if not exists quiz_links_lab_idx on public.quiz_links(lab_id);

alter table public.quiz_links enable row level security;
drop policy if exists "members read quiz links" on public.quiz_links;
create policy "members read quiz links" on public.quiz_links
    for select to authenticated using (private.is_lab_member(lab_id));
-- No insert/update/delete policies: links are made, cancelled and submitted through the functions below.

-- Creates a link for an open competency record. Returns the new row (including its token).
create or replace function public.create_quiz_link(p_competency uuid, p_module text)
returns public.quiz_links language plpgsql security definer set search_path = public as $$
declare c competencies; r quiz_links;
begin
    select * into c from competencies where id = p_competency;
    if c.id is null or not private.is_lab_member(c.lab_id) then raise exception 'competency record not found'; end if;
    if c.completed_at is not null then raise exception 'This record is signed off and locked. Reopen it to send a quiz.'; end if;
    if not exists (select 1 from private.quiz_keys where module_id = p_module) then raise exception 'no quiz for module %', p_module; end if;
    insert into quiz_links (lab_id, competency_id, staff_id, module_id, created_by, created_by_name)
        values (c.lab_id, c.id, c.staff_id, p_module, auth.uid(), private.member_name(c.lab_id))
        returning * into r;
    insert into competency_events (lab_id, competency_id, actor, actor_name, action, detail)
        values (c.lab_id, c.id, auth.uid(), r.created_by_name, 'quiz_sent', jsonb_build_object('module', p_module));
    return r;
end;
$$;

create or replace function public.cancel_quiz_link(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r quiz_links;
begin
    select * into r from quiz_links where id = p_id for update;
    if r.id is null or not private.is_lab_member(r.lab_id) then raise exception 'quiz link not found'; end if;
    if r.submitted_at is not null then raise exception 'This quiz has already been submitted.'; end if;
    if r.cancelled_at is null then
        update quiz_links set cancelled_at = now() where id = p_id;
        insert into competency_events (lab_id, competency_id, actor, actor_name, action, detail)
            values (r.lab_id, r.competency_id, auth.uid(), private.member_name(r.lab_id), 'quiz_cancelled', jsonb_build_object('module', r.module_id));
    end if;
end;
$$;

-- Public: what the quiz page needs to show for a link. Reveals nothing without the token.
create or replace function public.quiz_link_info(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r quiz_links;
begin
    if p_token is null or p_token !~ '^[0-9a-f]{64}$' then return null; end if;
    select * into r from quiz_links where token = p_token;
    if r.id is null then return null; end if;
    return jsonb_build_object(
        'module_id', r.module_id,
        'staff_name', (select name from staff where id = r.staff_id),
        'lab_name', (select name from labs where id = r.lab_id),
        'sent_by', r.created_by_name,
        'expires_at', r.expires_at,
        'status', case when r.submitted_at is not null then 'submitted'
                       when r.cancelled_at is not null then 'cancelled'
                       when r.expires_at < now() then 'expired' else 'open' end,
        'result', case when r.submitted_at is null then null else jsonb_build_object(
            'correct', r.correct, 'total', r.total, 'percent', r.percent, 'pass_mark', r.pass_mark,
            'passed', r.passed, 'submitted_at', r.submitted_at, 'taker_name', r.taker_name) end);
end;
$$;

-- Public: marks the answers (original option indexes, one per question) and stores the result. Single use.
create or replace function public.submit_quiz_link(p_token text, p_answers int[], p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r quiz_links; n int; ok int; pct int; pm int := private.quiz_pass_mark(); who text;
begin
    if p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'quiz link not found'; end if;
    select * into r from quiz_links where token = p_token for update;
    if r.id is null then raise exception 'quiz link not found'; end if;
    if r.submitted_at is not null then raise exception 'This quiz has already been submitted.'; end if;
    if r.cancelled_at is not null then raise exception 'This quiz link has been cancelled.'; end if;
    if r.expires_at < now() then raise exception 'This quiz link has expired. Ask your supervisor for a new one.'; end if;
    who := left(btrim(coalesce(p_name, '')), 120);
    if who = '' then raise exception 'Enter your name before submitting.'; end if;

    select count(*) into n from private.quiz_keys where module_id = r.module_id;
    if p_answers is null or cardinality(p_answers) <> n or array_position(p_answers, null) is not null then
        raise exception 'Answer every question before submitting.';
    end if;
    select count(*) into ok from private.quiz_keys k where k.module_id = r.module_id and p_answers[k.q + 1] = k.answer;
    pct := round(ok * 100.0 / n);

    update quiz_links set submitted_at = now(), taker_name = who, answers = to_jsonb(p_answers),
        correct = ok, total = n, percent = pct, pass_mark = pm, passed = pct >= pm
        where id = r.id;
    insert into competency_events (lab_id, competency_id, actor, actor_name, action, detail)
        values (r.lab_id, r.competency_id, null, who || ' (quiz link)', 'quiz_submitted',
                jsonb_build_object('module', r.module_id, 'correct', ok, 'total', n, 'percent', pct, 'passed', pct >= pm));
    return jsonb_build_object('correct', ok, 'total', n, 'percent', pct, 'pass_mark', pm, 'passed', pct >= pm, 'submitted_at', now());
end;
$$;

revoke execute on function public.create_quiz_link(uuid, text) from public, anon;
revoke execute on function public.cancel_quiz_link(uuid) from public, anon;
grant execute on function public.create_quiz_link(uuid, text) to authenticated;
grant execute on function public.cancel_quiz_link(uuid) to authenticated;
-- These two are meant to be called by someone with only the link, so anon may run them.
revoke execute on function public.quiz_link_info(text) from public;
revoke execute on function public.submit_quiz_link(text, int[], text) from public;
grant execute on function public.quiz_link_info(text) to anon, authenticated;
grant execute on function public.submit_quiz_link(text, int[], text) to anon, authenticated;

-- =====================================================================
-- Studies: lot-to-lot, method comparison and AMR / calibration verification
-- worksheets saved to the lab (see labready/worksheets/). The review sign-off
-- is stamped here, and a signed study is locked until the sign-off is removed.
-- =====================================================================

create table if not exists public.studies (
    id          uuid primary key default gen_random_uuid(),
    lab_id      uuid not null references public.labs(id) on delete cascade,
    kind        text not null check (kind in ('lot', 'method', 'amr')),
    content     jsonb not null default '{}'::jsonb,   -- {fields, criteria, data, review: {decision, comments}}
    analyte     text generated always as (nullif(btrim(content -> 'fields' ->> 'analyte'), '')) stored,
    verdict     text check (verdict in ('pass', 'fail', 'incomplete')),
    signoff     jsonb,                                -- {name, role, user_id, at}, stamped by the trigger below
    created_by  uuid default auth.uid(),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);
create index if not exists studies_lab_idx on public.studies(lab_id, created_at desc);

alter table public.studies enable row level security;
drop policy if exists "lab members all" on public.studies;
create policy "lab members all" on public.studies for all to authenticated
    using (private.is_lab_member(lab_id)) with check (private.is_lab_member(lab_id));

create or replace function private.studies_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    if tg_op = 'DELETE' then
        if old.signoff is not null then raise exception 'Signed studies can''t be deleted. Remove the sign-off first.'; end if;
        return old;
    end if;
    if tg_op = 'UPDATE' then
        if new.lab_id is distinct from old.lab_id or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
            raise exception 'A study can''t be moved or re-attributed.';
        end if;
        if old.signoff is not null and new.signoff is not null and
           (new.content is distinct from old.content or new.kind is distinct from old.kind or new.verdict is distinct from old.verdict) then
            raise exception 'This study is signed off and locked. Remove the sign-off to make changes.';
        end if;
        if old.signoff is not null and new.signoff is null and
           coalesce(private.member_role(new.lab_id), '') not in ('admin', 'supervisor', 'director') then
            raise exception 'Only a supervisor, director or admin can remove a study sign-off.';
        end if;
    end if;
    -- A new sign-off (or a changed one) is stamped with the real signer, their role and the server time.
    if new.signoff is not null and (tg_op = 'INSERT' or old.signoff is null or new.signoff is distinct from old.signoff) then
        if coalesce(private.member_role(new.lab_id), '') not in ('admin', 'supervisor', 'director') then
            raise exception 'Only a supervisor, director or admin can sign off a study.';
        end if;
        if coalesce(new.content -> 'review' ->> 'decision', '') = '' then
            raise exception 'Choose a decision before signing off the study.';
        end if;
        new.signoff := jsonb_build_object('name', private.member_name(new.lab_id), 'role', private.member_role(new.lab_id),
                                          'user_id', auth.uid(), 'at', now());
    end if;
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists studies_guard on public.studies;
create trigger studies_guard before insert or update or delete on public.studies
    for each row execute function private.studies_guard();

-- ---------- Private helper permissions ----------
-- Row-level security policies run as the signed-in user, so they need EXECUTE on the two membership checks.
revoke execute on all functions in schema private from public, anon;
grant execute on function private.is_lab_member(uuid) to authenticated;
grant execute on function private.is_lab_admin(uuid) to authenticated;

-- Earlier versions of this file created the helpers in public; remove them.
drop function if exists public.is_lab_member(uuid);
drop function if exists public.is_lab_admin(uuid);
drop function if exists public.member_name(uuid);
drop function if exists public.member_role(uuid);
drop function if exists public.competencies_guard();
drop function if exists public.competencies_log();
drop function if exists public.touch_updated_at();
