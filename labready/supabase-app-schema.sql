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

-- ---------- Helpers ----------

create or replace function public.is_lab_member(p_lab uuid)
returns boolean language sql stable security definer set search_path = public as $$
    select exists (select 1 from lab_members where lab_id = p_lab and user_id = auth.uid());
$$;

create or replace function public.is_lab_admin(p_lab uuid)
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
    if not is_lab_admin(p_lab) then raise exception 'only lab admins can add members'; end if;
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

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists competencies_touch on public.competencies;
create trigger competencies_touch before update on public.competencies
    for each row execute function public.touch_updated_at();

-- ---------- Row-level security ----------

alter table public.labs          enable row level security;
alter table public.lab_members   enable row level security;
alter table public.staff         enable row level security;
alter table public.test_systems  enable row level security;
alter table public.competencies  enable row level security;

drop policy if exists "members read lab" on public.labs;
create policy "members read lab" on public.labs
    for select to authenticated using (is_lab_member(id));

drop policy if exists "admins rename lab" on public.labs;
create policy "admins rename lab" on public.labs
    for update to authenticated using (is_lab_admin(id)) with check (is_lab_admin(id));

drop policy if exists "members read members" on public.lab_members;
create policy "members read members" on public.lab_members
    for select to authenticated using (is_lab_member(lab_id));

drop policy if exists "admins manage members" on public.lab_members;
create policy "admins manage members" on public.lab_members
    for delete to authenticated using (is_lab_admin(lab_id) and user_id <> auth.uid());

-- staff, test_systems, competencies: full access for members of the owning lab.
do $$
declare t text;
begin
    foreach t in array array['staff', 'test_systems', 'competencies'] loop
        execute format('drop policy if exists "lab members all" on public.%I', t);
        execute format(
            'create policy "lab members all" on public.%I for all to authenticated
             using (is_lab_member(lab_id)) with check (is_lab_member(lab_id))', t);
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

alter table public.competency_events enable row level security;
drop policy if exists "members read events" on public.competency_events;
create policy "members read events" on public.competency_events
    for select to authenticated using (is_lab_member(lab_id));
-- No insert/update/delete policies: only the triggers below can write history.

create or replace function public.member_name(p_lab uuid)
returns text language sql stable security definer set search_path = public as $$
    select coalesce(nullif(display_name, ''), (select email from auth.users where id = auth.uid()))
    from lab_members where lab_id = p_lab and user_id = auth.uid();
$$;

create or replace function public.member_role(p_lab uuid)
returns text language sql stable security definer set search_path = public as $$
    select role from lab_members where lab_id = p_lab and user_id = auth.uid();
$$;

-- Before update/delete: lock completed records and stamp signatures server-side.
create or replace function public.competencies_guard()
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
                'name', member_name(new.lab_id), 'role', member_role(new.lab_id),
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
    for each row execute function public.competencies_guard();
drop trigger if exists competencies_guard_del on public.competencies;
create trigger competencies_guard_del before delete on public.competencies
    for each row execute function public.competencies_guard();

-- After insert/update/delete: write the history.
create or replace function public.competencies_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    k text;
    lab uuid := coalesce(new.lab_id, old.lab_id);
    who text := member_name(lab);
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
    for each row execute function public.competencies_log();

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
