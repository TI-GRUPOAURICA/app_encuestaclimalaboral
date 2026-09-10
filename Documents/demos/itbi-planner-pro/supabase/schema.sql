-- ═════════════════════════════════════════════════════════════════════════════
-- IT/BI Planner Pro · Esquema PostgreSQL para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
--
-- Estructura relacional (requerimiento):
--   users    (1) ──────── (N) projects    (1) ──────── (N) updates
--
-- Seguridad: Row Level Security (RLS) habilitado en las 3 tablas.
--   · Lectura  : cualquier usuario autenticado (vista gerencial de equipo).
--   · Escritura: solo el dueño del recurso (auth.uid() = user_id).
--   Ajusta las políticas "select" si quieres aislamiento estricto por rol.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── 1. Tabla users (directorio del equipo) ─────────────────────────────────
-- El jefe (u otros con cuenta) llega vía Supabase Auth + trigger handle_new_user.
-- El resto de miembros NO necesita cuenta de acceso: pueden crearse desde el
-- engranaje del header (la app los usa como "persona en seguimiento").
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  full_name   text not null default '',
  role        text not null default 'member',   -- ej. 'Gerente', 'Desarrollador', 'Analista BI'
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Migración segura: si creaste la versión anterior (id → auth.users), ejecuta:
--   alter table public.users drop constraint users_id_fkey;
--   alter table public.users alter column id set default gen_random_uuid();

-- Opcional: crear automáticamente la fila en users al registrarse vía Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 2. Tabla projects ───────────────────────────────────────────────────────
-- user_id    = creador/dueño del proyecto (el jefe, auth.uid(), RLS owner)
-- assignee_id = persona a la que el jefe le hace seguimiento (Responsable)
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  assignee_id   uuid references public.users (id) on delete set null,
  name          text not null check (char_length(name) between 3 and 80),
  description   text,
  category      text not null default 'Desarrollo de Nuevo Software'
                check (category in (
                  'Desarrollo de Nuevo Software',
                  'Mantenimiento y Mejoras',
                  'Corrección de Errores (Bugs)',
                  'Análisis y Modelado',
                  'Integración de Sistemas'
                )),
  deadline_date date,                                -- fecha de implementación esperada
  progress      smallint not null default 0 check (progress between 0 and 100),
  status        text not null default 'active' check (status in ('active', 'done')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Migración segura: bases creadas con el esquema anterior solo necesitan esto
alter table public.projects
  add column if not exists assignee_id uuid references public.users (id) on delete set null;

-- Si usaste el CHECK de categorías anterior ('Aplicación'/'Diagrama de Flujo'),
-- reemplázalo por el actual:
--   alter table public.projects drop constraint projects_category_check;
--   alter table public.projects add constraint projects_category_check
--     check (category in ('Desarrollo de Nuevo Software','Mantenimiento y Mejoras',
--                         'Corrección de Errores (Bugs)','Análisis y Modelado',
--                         'Integración de Sistemas'));

create index if not exists idx_projects_user      on public.projects (user_id);
create index if not exists idx_projects_assignee  on public.projects (assignee_id);
create index if not exists idx_projects_status    on public.projects (status);

-- ── 3. Tabla updates (avances del timeline) ─────────────────────────────────
create table if not exists public.updates (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  status_type text not null default 'inicio_proyecto'
              check (status_type in (
                'inicio_proyecto',        -- Gris    · Inicio de Proyecto (automático)
                'reunion_pendiente',      -- Azul    · Reunión Pendiente
                'en_desarrollo',          -- Celeste  · En Desarrollo
                'pruebas_iniciales',      -- Ámbar   · Pruebas Iniciales
                'mejoras_refactor',       -- Púrpura · Mejoras / Refactor
                'reparacion_bug',         -- Rojo    · Reparación de Bug
                'implementado_ok',        -- Esmeralda · Implementado / Ok
                'nota'                    -- Turquesa · Nota / Consulta (registro libre)
              )),
  update_date date not null default current_date,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_updates_project_date
  on public.updates (project_id, update_date desc);

-- ── 3b. Tabla objectives (objetivos semanales de cada proyecto) ────────────
-- Se crean en la reunión con due_date = próxima reunión; en esa fecha se
-- verifica el cumplimiento (cumplido / no_cumplido) + resultado.
create table if not exists public.objectives (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  title       text not null check (char_length(title) between 3 and 120),
  detail      text,
  due_date    date not null,                       -- fecha de revisión (próxima reunión)
  status      text not null default 'pendiente'
              check (status in ('pendiente', 'cumplido', 'no_cumplido')),
  result      text,                                -- resultado / nota de la revisión
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_objectives_project_due
  on public.objectives (project_id, due_date);

-- ── 4. Trigger: actualizar updated_at automáticamente ───────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated
  before update on public.projects
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_updates_updated on public.updates;
create trigger trg_updates_updated
  before update on public.updates
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_objectives_updated on public.objectives;
create trigger trg_objectives_updated
  before update on public.objectives
  for each row execute function public.touch_updated_at();

-- ── 5. Row Level Security ───────────────────────────────────────────────────
alter table public.users     enable row level security;
alter table public.projects  enable row level security;
alter table public.updates   enable row level security;
alter table public.objectives enable row level security;

-- users: cualquiera autenticado puede ver el directorio del equipo y agregar
--        miembros (miembros de seguimiento sin cuenta de acceso);
--        cada quien solo edita su propio perfil.
create policy "users_select_team" on public.users
  for select to authenticated using (true);

create policy "users_insert_member" on public.users
  for insert to authenticated with check (true);

create policy "users_update_own" on public.users
  for update to authenticated using (auth.uid() = id);

create policy "users_delete_member" on public.users
  for delete to authenticated
  using (auth.uid() <> id);   -- no se puede borrar la propia cuenta desde la UI

-- projects: lectura de todo el equipo (vista gerencial), escritura del dueño.
create policy "projects_select_team" on public.projects
  for select to authenticated using (true);

create policy "projects_insert_own" on public.projects
  for insert to authenticated with check (auth.uid() = user_id);

create policy "projects_update_own" on public.projects
  for update to authenticated using (auth.uid() = user_id);

create policy "projects_delete_own" on public.projects
  for delete to authenticated using (auth.uid() = user_id);

-- updates: herencia del proyecto (se inserta si el proyecto es tuyo).
create policy "updates_select_team" on public.updates
  for select to authenticated using (true);

create policy "updates_insert_via_own_project" on public.updates
  for insert to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "updates_update_via_own_project" on public.updates
  for update to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "updates_delete_via_own_project" on public.updates
  for delete to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- objectives: misma herencia del proyecto (el jefe crea/verifica los objetivos
-- de los proyectos que él sigue).
create policy "objectives_select_team" on public.objectives
  for select to authenticated using (true);

create policy "objectives_insert_via_own_project" on public.objectives
  for insert to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "objectives_update_via_own_project" on public.objectives
  for update to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "objectives_delete_via_own_project" on public.objectives
  for delete to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );
