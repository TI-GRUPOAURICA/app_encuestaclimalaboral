/* ═════════════════════════════════════════════════════════════════════════════
   diag-arreglar-insert-proyecto.sql
   Arregla el bloqueo al CREAR PROYECTOS y explica la causa.

   Síntoma:
     La app te reconoce como administrador (administrador: SÍ) pero al guardar
     sale: "new row violates row-level security policy for table projects" (403).

   Se atacan los 3 sospechosos reales:
     A) es_admin() no devuelve true dentro de la política.
     B) Una función de TRIGGER sin SECURITY DEFINER: al escribir en
        activity_log choca con SU RLS y aborta el INSERT completo.
     C) Alguna política RESTRICTIVE (se suma con AND y bloquea).

   Es IDEMPOTENTE. Ejecutar en Supabase → SQL Editor.
   ═════════════════════════════════════════════════════════════════════════════ */

-- ═════════════════════════════════════════════════════════════════════════════
-- PARTE A · ARREGLO
-- ═════════════════════════════════════════════════════════════════════════════

-- A1. Columna y marca de administrador
alter table public.users add column if not exists is_admin boolean not null default false;
update public.users set is_admin = true
where lower(email) in ('ti@metalabsac.com', 'ti@auricasac.com');

-- A2. es_admin(): lee is_admin + red de seguridad por correo
create or replace function public.es_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and (coalesce(u.is_admin, false)
           or lower(u.email) in ('ti@metalabsac.com', 'ti@auricasac.com'))
  );
$$;

-- A3. Funciones de TRIGGER explícitamente SECURITY DEFINER
--     (si alguna quedó sin ello, el INSERT en activity_log falla por RLS)
create or replace function public.set_autor()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' then new.created_by := auth.uid(); end if;
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

create or replace function public.set_baseline_projects()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.baseline_deadline_date := coalesce(new.baseline_deadline_date, new.deadline_date);
  end if;
  return new;
end;
$$;

create or replace function public.set_baseline_phases()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.baseline_start_date := coalesce(new.baseline_start_date, new.start_date);
    new.baseline_end_date   := coalesce(new.baseline_end_date,   new.end_date);
  end if;
  return new;
end;
$$;

create or replace function public.log_cambio()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_new jsonb; v_old jsonb; v_changes jsonb := '{}'::jsonb;
  v_project uuid; v_phase uuid; v_name text; v_id uuid; k text; v_ignorar text[];
begin
  v_new := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  v_old := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  v_id  := (coalesce(v_new, v_old) ->> 'id')::uuid;

  if tg_table_name = 'projects' then
    v_project := v_id;
    v_name    := coalesce(v_new, v_old) ->> 'name';
    v_ignorar := array['updated_at','updated_by','progress','status'];
  elsif tg_table_name = 'phases' then
    v_project := (coalesce(v_new, v_old) ->> 'project_id')::uuid;
    v_phase   := v_id;
    v_name    := coalesce(v_new, v_old) ->> 'name';
    v_ignorar := array['updated_at','updated_by','position'];
  else
    v_phase   := (coalesce(v_new, v_old) ->> 'phase_id')::uuid;
    select ph.project_id into v_project from public.phases ph where ph.id = v_phase;
    v_name    := coalesce(v_new, v_old) ->> 'text';
    v_ignorar := array['updated_at','updated_by','position','created_at'];
  end if;

  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(v_new) loop
      if not (k = any (v_ignorar)) and (v_new -> k) is distinct from (v_old -> k) then
        v_changes := v_changes || jsonb_build_object(k, jsonb_build_object('de', v_old -> k, 'a', v_new -> k));
      end if;
    end loop;
    if v_changes = '{}'::jsonb then return null; end if;
  end if;

  insert into public.activity_log
    (actor_id, project_id, phase_id, entity, entity_id, entity_name, action, changes)
  values (
    auth.uid(), v_project, v_phase,
    case tg_table_name when 'projects' then 'proyecto' when 'phases' then 'fase' else 'tarea' end,
    v_id, v_name,
    case tg_op when 'INSERT' then 'creado' when 'UPDATE' then 'editado' else 'eliminado' end,
    case when v_changes = '{}'::jsonb then null else v_changes end
  );
  return null;
end;
$$;

-- A4. Política de CREACIÓN con la comprobación de admin INLINE
--     (así no depende de es_admin() ni de ninguna función externa)
drop policy if exists "projects_select_team"   on public.projects;
drop policy if exists "projects_select_mios"   on public.projects;
drop policy if exists "projects_select_acceso" on public.projects;
drop policy if exists "projects_insert_own"    on public.projects;
drop policy if exists "projects_insert_propio" on public.projects;

create policy "projects_select_acceso" on public.projects
  for select to authenticated using (public.acceso_proyecto(id));

create policy "projects_insert_propio" on public.projects
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and (
      assignee_id is null
      or assignee_id = auth.uid()
      or exists (select 1 from public.users u
                 where u.id = auth.uid()
                   and (coalesce(u.is_admin, false)
                        or lower(u.email) in ('ti@metalabsac.com', 'ti@auricasac.com')))
    )
  );

-- A5. Asegurar que ninguna política sea RESTRICTIVE (se sumaría con AND)
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename in ('projects','phases','tasks')
      and permissive = 'RESTRICTIVE'
  loop
    execute format('drop policy %I on public.projects', r.policyname);
  end loop;
end $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- PARTE B · DIAGNÓSTICO (pásame el resultado de estas consultas)
-- ═════════════════════════════════════════════════════════════════════════════

-- B0. Simula la sesión del coordinador para poder medir como él
select set_config('request.jwt.claims',
  '{"sub":"dafc2527-c782-4f94-bb85-2cca86cd9e86","role":"authenticated"}', false);

-- B1. ¿Qué devuelve es_admin() con tu sesión?
select auth.uid() as uid_simulado, public.es_admin() as es_admin;

-- B2. ¿Las funciones de trigger son SECURITY DEFINER?
--     (security_definer debe ser true en TODAS; si alguna es false, ese era el fallo)
select p.proname as funcion, p.prosecdef as security_definer,
       pg_get_userbyid(p.proowner) as duenio
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('set_autor','log_cambio','set_baseline_projects','es_admin','acceso_proyecto')
order by p.proname;

-- B3. Políticas de projects (permissive debe ser PERMISSIVE en todas)
select cmd, policyname, permissive, with_check, qual
from pg_policies
where schemaname = 'public' and tablename = 'projects'
order by cmd, policyname;

-- B4. ¿RLS forzado y quién es el dueño de las tablas?
select relname, relrowsecurity as rls, relforcerowsecurity as force_rls,
       pg_get_userbyid(relowner) as duenio
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('projects','users','activity_log','tasks','phases')
order by relname;

-- B5. PRUEBA REAL del INSERT con tu sesión.
--     · Si funciona: crea una fila de prueba que se borra en el paso B6.
--     · Si falla: el editor mostrará el ERROR EXACTO (eso es lo que necesito).
insert into public.projects (user_id, assignee_id, name, description, category, progress, status)
values ('dafc2527-c782-4f94-bb85-2cca86cd9e86',
        'dafc2527-c782-4f94-bb85-2cca86cd9e86',
        'PRUEBA DIAGNOSTICO', 'fila de prueba', 'Mantenimiento y Mejoras', 0, 'active')
returning id, name, user_id;

-- B6. Limpieza de la fila de prueba (solo se ejecuta si B5 funcionó)
delete from public.projects where name = 'PRUEBA DIAGNOSTICO';
