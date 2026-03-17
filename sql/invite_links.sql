create table if not exists public.invite_links (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  used_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

alter table public.invite_links enable row level security;

drop policy if exists "Admins can read own invite links" on public.invite_links;
create policy "Admins can read own invite links"
  on public.invite_links for select
  using (auth.uid() = created_by);

drop policy if exists "Admins can create invite links" on public.invite_links;
create policy "Admins can create invite links"
  on public.invite_links for insert
  with check (auth.uid() = created_by);
