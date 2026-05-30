-- ─────────────────────────────────────────────────────────────────────────────
--  Arrow Puzzle — Supabase setup
--  Pega esto en el SQL Editor de tu proyecto Supabase y ejecuta.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Tabla de progreso (1 fila por usuario, id = auth.uid())
create table if not exists arrow_game_progress (
  id          uuid        primary key references auth.users(id) on delete cascade,
  max_level   integer     not null default 1,
  updated_at  timestamptz not null default now()
);

-- 2. Activa Row Level Security
alter table arrow_game_progress enable row level security;

-- 3. Políticas RLS — cada usuario solo ve y toca SU fila
create policy "select_own"
  on arrow_game_progress for select
  using ( auth.uid() = id );

create policy "insert_own"
  on arrow_game_progress for insert
  with check ( auth.uid() = id );

create policy "update_own"
  on arrow_game_progress for update
  using ( auth.uid() = id );

-- 4. (Opcional) helper para mantener updated_at actualizado automáticamente
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger arrow_progress_updated_at
  before update on arrow_game_progress
  for each row execute procedure set_updated_at();
