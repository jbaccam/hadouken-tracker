create table if not exists public.saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  items jsonb not null,
  total_weight_grams numeric check (total_weight_grams > 0),
  servings numeric not null check (servings > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.saved_recipes
  alter column total_weight_grams drop not null;

alter table public.saved_recipes enable row level security;

drop policy if exists "Users can select own recipes" on public.saved_recipes;
create policy "Users can select own recipes"
  on public.saved_recipes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own recipes" on public.saved_recipes;
create policy "Users can insert own recipes"
  on public.saved_recipes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own recipes" on public.saved_recipes;
create policy "Users can update own recipes"
  on public.saved_recipes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own recipes" on public.saved_recipes;
create policy "Users can delete own recipes"
  on public.saved_recipes for delete
  using (auth.uid() = user_id);

create or replace function public.set_saved_recipes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_saved_recipes_updated_at on public.saved_recipes;
create trigger set_saved_recipes_updated_at
before update on public.saved_recipes
for each row execute function public.set_saved_recipes_updated_at();
