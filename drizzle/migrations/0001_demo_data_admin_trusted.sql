-- Settings (demo switch)
create table public.app_settings (
  id int primary key default 1 check (id = 1),
  show_demo boolean not null default true
);
grant select on public.app_settings to anon, authenticated;
grant update on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
insert into public.app_settings (id, show_demo) values (1, true);

create or replace function public.demo_visible() returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce((select show_demo from public.app_settings where id = 1), true) $$;

create policy "Anyone reads settings" on public.app_settings for select to anon, authenticated using (true);
create policy "Admins update settings" on public.app_settings for update to authenticated using (public.has_role(auth.uid(), 'admin'));

-- First account becomes admin (bootstrap for the owner)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  insert into public.user_roles (user_id, role) values (new.id, 'client');
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;

-- Talent: demo flag, approval, owner
alter table public.talent add column is_demo boolean not null default false;
alter table public.talent add column approved boolean not null default false;
alter table public.talent add column user_id uuid;
alter table public.talent alter column id set default gen_random_uuid()::text;
update public.talent set is_demo = true, approved = true;
grant insert, update, delete on public.talent to authenticated;

drop policy "Anyone can browse blind talent" on public.talent;
create policy "Browse approved talent" on public.talent for select to anon, authenticated
  using (approved and (not is_demo or public.demo_visible()));
create policy "Members see own profile" on public.talent for select to authenticated using (user_id = auth.uid());
create policy "Admins see all talent" on public.talent for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Members create own pending profile" on public.talent for insert to authenticated
  with check (user_id = auth.uid() and not approved and not is_demo);
create policy "Admins update talent" on public.talent for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete talent" on public.talent for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Identity/contact details, kept apart from blind cards
create table public.talent_contacts (
  talent_id text primary key references public.talent(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text not null
);
grant select on public.talent_contacts to authenticated;
grant all on public.talent_contacts to service_role;
alter table public.talent_contacts enable row level security;
create policy "Admins read contacts" on public.talent_contacts for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Demo placeholders readable" on public.talent_contacts for select to authenticated
  using (exists (select 1 from public.talent t where t.id = talent_id and t.is_demo and public.demo_visible()));

-- Opportunities (public listing)
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  budget int not null,
  city text not null,
  skills text[] not null default '{}',
  state text not null default 'community',
  window_ends_at timestamptz not null default (now() + interval '7 days'),
  offered int not null default 0,
  interested int not null default 0,
  declined int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.opportunities to anon, authenticated;
grant insert, update, delete on public.opportunities to authenticated;
grant all on public.opportunities to service_role;
alter table public.opportunities enable row level security;
create policy "Browse opportunities" on public.opportunities for select to anon, authenticated using (not is_demo or public.demo_visible());
create policy "Admins manage opportunities" on public.opportunities for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Projects: demo flag; demo projects visible to every signed-in user
alter table public.projects add column is_demo boolean not null default false;
create policy "See demo projects" on public.projects for select to authenticated using (is_demo and public.demo_visible());

-- Trusted organisations
create table public.trusted_orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  kind text not null,
  approved boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.trusted_orgs to anon, authenticated;
grant insert, update, delete on public.trusted_orgs to authenticated;
grant all on public.trusted_orgs to service_role;
alter table public.trusted_orgs enable row level security;
create policy "Browse approved orgs" on public.trusted_orgs for select to anon, authenticated using (approved and (not is_demo or public.demo_visible()));
create policy "Admins manage orgs" on public.trusted_orgs for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Real stats only (never demo)
create or replace function public.public_stats() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'members', (select count(*) from public.talent where approved and not is_demo),
    'verified', (select count(*) from public.talent where approved and verified and not is_demo),
    'projects', (select count(*) from public.projects where not is_demo)
  ) $$;
grant execute on function public.public_stats() to anon, authenticated;

-- One-click demo cleanup (admins only)
create or replace function public.delete_demo_data() returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  delete from public.shortlist where project_id in (select id from public.projects where is_demo) or talent_id in (select id from public.talent where is_demo);
  delete from public.projects where is_demo;
  delete from public.talent where is_demo;
  delete from public.opportunities where is_demo;
  delete from public.trusted_orgs where is_demo;
end $$;
grant execute on function public.delete_demo_data() to authenticated;