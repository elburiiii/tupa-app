-- Tupa v1 schema: profiles, documents, contracts, reminders + storage bucket.
-- `extractions` (and contracts.extraction_id) come with the AI extraction work.
-- Every table has RLS. Ownership is user_id = auth.uid().

-- ---------------------------------------------------------------- enums
create type public.contract_category as enum
  ('electricity','telecom','internet','insurance','gym','streaming',
   'rent','loan','subscription','other');
create type public.term_type as enum
  ('fixed_term',      -- määräaikainen: has end_date
   'open_ended',      -- toistaiseksi voimassa: notice period only
   'auto_renewing');  -- renews for a new period unless cancelled
create type public.document_status as enum
  ('uploaded','extracting','needs_review','confirmed','failed');
create type public.reminder_kind as enum ('notice_deadline','term_end','custom');
create type public.reminder_status as enum ('pending','sent','failed','cancelled');

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id               uuid primary key references auth.users on delete cascade,
  locale           text not null default 'fi' check (locale in ('fi','en')),
  timezone         text not null default 'Europe/Helsinki',
  inbound_alias    text unique,                          -- token for u-<alias>@in.tupa.fi
  reminder_offsets int[] not null default '{30,14,3}',   -- days before deadline
  created_at       timestamptz not null default now()
);

-- Create a profile row for every new auth user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- documents
create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  storage_path  text not null,
  original_name text,
  mime_type     text not null
                check (mime_type in ('application/pdf','image/jpeg','image/png','image/heic','image/heif')),
  size_bytes    int not null check (size_bytes > 0 and size_bytes <= 10*1024*1024),
  sha256        text not null,         -- dedupe re-uploads
  source        text not null check (source in ('upload','email')),
  status        public.document_status not null default 'uploaded',
  error         text,
  created_at    timestamptz not null default now(),
  unique (user_id, sha256)
);

-- ---------------------------------------------------------------- contracts
create table public.contracts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users on delete cascade,
  document_id        uuid references public.documents on delete set null,
  provider_name      text not null check (length(trim(provider_name)) > 0),
  category           public.contract_category not null,
  title              text,
  price_amount       numeric(10,2) check (price_amount >= 0),
  price_period       text check (price_period in ('month','year','one_off')),
  term_type          public.term_type not null,
  start_date         date,
  end_date           date,            -- fixed_term / current period end
  notice_period_days int check (notice_period_days >= 0),
  notice_is_assumed  boolean not null default false, -- category default, not from doc
  notice_deadline    date,            -- set by trigger below, never by the client
  summary            text,
  fields_edited      int not null default 0,
  status             text not null default 'active'
                     check (status in ('active','cancelled','archived')),
  confirmed_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index contracts_user_deadline_idx on public.contracts (user_id, notice_deadline);

-- notice_deadline = end_date - notice_period_days for fixed_term and
-- auto_renewing contracts; open_ended contracts have no deadline.
create function public.contracts_compute_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.term_type <> 'open_ended'
     and new.end_date is not null
     and new.notice_period_days is not null then
    new.notice_deadline := new.end_date - new.notice_period_days;
  else
    new.notice_deadline := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger contracts_compute_fields
  before insert or update on public.contracts
  for each row execute function public.contracts_compute_fields();

-- ---------------------------------------------------------------- reminders
-- Written only by service-role functions (week 4); clients can read.
create table public.reminders (
  id                  uuid primary key default gen_random_uuid(),
  contract_id         uuid not null references public.contracts on delete cascade,
  user_id             uuid not null references auth.users on delete cascade,
  kind                public.reminder_kind not null,
  due_date            date not null,   -- the deadline itself
  send_on             date not null,   -- due_date - offset
  status              public.reminder_status not null default 'pending',
  sent_at             timestamptz,
  provider_message_id text,
  unique (contract_id, kind, send_on)  -- idempotency
);
create index reminders_pending_send_on_idx on public.reminders (send_on) where status = 'pending';

-- ---------------------------------------------------------------- RLS
alter table public.profiles  enable row level security;
alter table public.documents enable row level security;
alter table public.contracts enable row level security;
alter table public.reminders enable row level security;

-- profiles: the row is created by the trigger and removed by the auth cascade.
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- documents
create policy "documents: read own" on public.documents
  for select to authenticated using (user_id = (select auth.uid()));
create policy "documents: insert own" on public.documents
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "documents: update own" on public.documents
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "documents: delete own" on public.documents
  for delete to authenticated using (user_id = (select auth.uid()));

-- contracts: a contract may only point at one of the user's own documents.
create policy "contracts: read own" on public.contracts
  for select to authenticated using (user_id = (select auth.uid()));
create policy "contracts: insert own" on public.contracts
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and (document_id is null or exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = (select auth.uid())))
  );
create policy "contracts: update own" on public.contracts
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (document_id is null or exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = (select auth.uid())))
  );
create policy "contracts: delete own" on public.contracts
  for delete to authenticated using (user_id = (select auth.uid()));

-- reminders: read-only for clients.
create policy "reminders: read own" on public.reminders
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- storage
-- Private bucket. Objects live at {user_id}/{document_id}.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contracts', 'contracts', false, 10*1024*1024,
  array['application/pdf','image/jpeg','image/png','image/heic','image/heif']
);

create policy "contracts bucket: read own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'contracts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "contracts bucket: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'contracts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "contracts bucket: update own folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'contracts' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'contracts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "contracts bucket: delete own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'contracts' and (storage.foldername(name))[1] = (select auth.uid())::text);
