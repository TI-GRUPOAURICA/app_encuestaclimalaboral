-- ═════════════════════════════════════════════════════════════════════════════
-- IT/BI Planner Pro · Datos de ejemplo para probar el esquema en Supabase.
-- Requisito: primero ejecutar supabase/schema.sql y tener usuarios registrados
-- (o crear filas manuales en public.users con ids reales de auth.users).
--
-- ⚠️ Reemplaza los UUID '00000000-…' por los ids de tus usuarios reales:
--      select id, email from public.users;
-- ═════════════════════════════════════════════════════════════════════════════

-- Usuarios del equipo (ajusta los ids)
-- insert into public.users (id, email, full_name, role)
-- values
--   ('00000000-0000-0000-0000-000000000001', 'ana.torres@itbi.dev', 'Ana Torres', 'Gerente'),
--   ('00000000-0000-0000-0000-000000000002', 'luis.medina@itbi.dev', 'Luis Medina', 'Desarrollador'),
--   ('00000000-0000-0000-0000-000000000003', 'carla.rojas@itbi.dev', 'Carla Rojas', 'Analista BI');

-- Proyectos
insert into public.projects (user_id, name, description, category, deadline_date, progress, status) values
  ('00000000-0000-0000-0000-000000000001',
   'Plataforma BI Self-Service',
   'Centralizar KPIs comerciales en dashboards self-service para el área de negocio.',
   'Desarrollo de Nuevo Software', current_date + 45, 62, 'active'),

  ('00000000-0000-0000-0000-000000000001',
   'App Cliente 360',
   'Portal de autogestión: facturación, tickets y seguimiento de pedidos.',
   'Desarrollo de Nuevo Software', current_date - 12, 82, 'active'),

  ('00000000-0000-0000-0000-000000000002',
   'Diagrama de Flujo de Migración de Datos',
   'Modelar el flujo del pipeline legacy de SQL Server hacia el nuevo proceso.',
   'Integración de Sistemas', current_date + 18, 40, 'active'),

  ('00000000-0000-0000-0000-000000000003',
   'Cubo Financiero Multidimensional',
   'Modelo OLAP de finanzas (P&L, presupuesto vs. real).',
   'Análisis y Modelado', current_date + 30, 55, 'active');

-- Avances de ejemplo (fechas relativas a hoy)
-- insert into public.updates (project_id, status_type, update_date, notes) values
--   ('PROYECTO_BI_ID', 'reunion_pendiente', current_date - 6,
--    'Demo del dashboard con gerencia comercial.\nAcuerdos:\n- Cambiar métrica principal a margen por categoría.\n- Comparativo vs. mismo mes del año anterior.'),
--   ('PROYECTO_BI_ID', 'implementado_ok', current_date - 41,
--    'Entrega del módulo de reporting financiero validado con finanzas al 100%.'),
--   ('PROYECTO_BI_ID', 'reparacion_bug', current_date - 19,
--    'Bug en KPI de churn: el filtro no se propagaba a la subconsulta de cohortes.\nFix aplicado y verificado.');
