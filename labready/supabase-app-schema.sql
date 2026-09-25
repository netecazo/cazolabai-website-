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
