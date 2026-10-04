create type public.app_role as enum ('admin','client','talent');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create table public.profiles (
  id uuid primary key,
  display_name text,
  city text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  insert into public.user_roles (user_id, role) values (new.id, 'client');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Blind talent cards: no names, photos, age or gender stored here.
create table public.talent (
  id text primary key,
  initials text not null,
  role text not null,
  category text not null,
  city text not null,
  skills text[] not null default '{}',
  score int not null default 80,
  reason text not null default '',
  community boolean not null default true,
  verified boolean not null default false,
  day_rate int not null default 3000
);
grant select on public.talent to anon, authenticated;
grant all on public.talent to service_role;
alter table public.talent enable row level security;
create policy "Anyone can browse blind talent" on public.talent for select to anon, authenticated using (true);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  title text not null,
  brief text not null default '',
  category text not null,
  budget int not null,
  status text not null default 'community_window',
  community_window_ends_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "Own projects" on public.projects for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table public.shortlist (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  talent_id text not null references public.talent(id),
  owner_id uuid not null default auth.uid(),
  consent_requested boolean not null default false,
  created_at timestamptz not null default now(),
  unique (project_id, talent_id)
);
grant select, insert, update, delete on public.shortlist to authenticated;
grant all on public.shortlist to service_role;
alter table public.shortlist enable row level security;
create policy "Own shortlist" on public.shortlist for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

insert into public.talent (id, initials, role, category, city, skills, score, reason, community, verified, day_rate) values
('m-104','VE','Video editor','Video','Mumbai','{Premiere Pro,Reels,Color grading}',92,'14 brand reels delivered, available this week',true,true,4500),
('m-221','MG','Motion designer','Video','Pune','{After Effects,Animation,Video editing}',84,'Strong portfolio, 2 similar launches',true,true,5000),
('m-087','DA','Data analyst','Data & AI','Hyderabad','{Python,SQL,Data analysis}',88,'Retail dashboards, 4.9 rating',true,true,6000),
('m-312','ML','ML engineer','Data & AI','Bengaluru','{Machine learning,Python,Data}',79,'Shipped 3 forecasting models',true,false,9000),
('m-145','BD','Brand designer','Design','Lucknow','{Brand identity,Figma,Logo design}',86,'9 identity systems, on-time 100%',true,true,4000),
('m-033','UT','Urdu translator','Writing','Hyderabad','{Urdu translation,Hindi,Writing}',90,'Legal and literary work, 6 years',true,true,2500),
('m-276','PM','Performance marketer','Marketing','Delhi','{Meta Ads,Google Ads,Performance marketing}',81,'₹40L managed spend, D2C focus',true,true,7000),
('m-198','PH','Product photographer','Design','Surat','{Photography,Product shoots,Lightroom}',77,'Textile catalogues, own studio',true,false,3500),
('m-402','WD','Web developer','Development','Chennai','{React,TypeScript,Web apps}',85,'5 production apps, fast replies',true,true,8000),
('m-059','TU','Tutor','Education','Bhopal','{Math tutoring,Physics,Education}',83,'Board exam results, 200+ students',true,true,1500),
('m-510','AD','App developer','Development','Kolkata','{Flutter,Android,iOS}',87,'7 apps on Play Store',true,true,8500),
('m-522','CW','Copywriter','Writing','Jaipur','{Copywriting,SEO,Hinglish}',82,'D2C launch copy, quick turnaround',true,false,3000),
('m-533','SM','Social media manager','Marketing','Ahmedabad','{Instagram,Content calendar,Reels}',80,'Grew 3 pages past 50k',true,true,3500),
('m-544','UX','UX designer','Design','Indore','{Figma,User research,Prototyping}',89,'Fintech and edtech flows',true,true,6500),
('m-555','BE','Backend engineer','Development','Noida','{Node.js,PostgreSQL,APIs}',86,'Payments and logistics systems',false,true,9000),
('m-566','AI','AI engineer','Data & AI','Bengaluru','{LLMs,RAG,Python}',91,'4 production chatbots',false,true,12000),
('m-577','IL','Illustrator','Design','Kochi','{Illustration,Procreate,Kids books}',84,'Published 5 picture books',true,false,3000),
('m-588','VO','Voice artist','Video','Mumbai','{Hindi voice,Urdu voice,Dubbing}',85,'Ads and e-learning voiceovers',true,true,4000);