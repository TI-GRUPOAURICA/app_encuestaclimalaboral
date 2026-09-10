/* ═════════════════════════════════════════════════════════════════════════════
   data/localDb.js — "Base de datos" local para el Modo Demostración.
   Persiste en localStorage bajo una sola clave y se siembra con datos de
   ejemplo REALISTAS (fechas relativas a hoy para que el demo siempre se vea
   vivo: proyectos al día, retrasados, avances repartidos en ~6 meses).

   Estructura interna (misma forma normalizada que devuelve Supabase):
     { users:    [{ id, email, fullName, role, avatarUrl, isCurrent? }]
       projects: [{ id, userId, name, description, category,
                    deadlineDate, progress, status }]
       updates:  [{ id, projectId, statusType, updateDate, notes }] }
═════════════════════════════════════════════════════════════════════════════ */
import { addDaysISO, todayISO } from '../utils.js'
import { normalizeCategory } from '../statuses.js'

const DB_KEY = 'itbi-planner-db-v1'

export function loadDb() {
  let db = null
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) db = JSON.parse(raw)
  } catch {
    /* localStorage no disponible (modo privado): se usa semilla en memoria */
  }
  if (!db) {
    db = buildSeed()
    saveDb(db)
    return db
  }
  return migrate(db)
}

/** Migración en caliente de datos guardados con versiones anteriores:
    - si un proyecto no tiene assigneeId (persona en seguimiento), se rellena
      con su dueño actual para que la UI nunca muestre campos vacíos.
    - las categorías antiguas (Desarrollo/BI/Infraestructura) se normalizan
      a las actuales (Aplicación / Diagrama de Flujo).
    - se garantiza el arreglo de objectives (listas creadas después). */
function migrate(db) {
  let changed = false
  if (!Array.isArray(db.objectives)) {
    db.objectives = []
    changed = true
  }

  // ── Usuario actual: Leonar Antayhua (Coordinador de Proyectos) ──
  // Traslada el rol de "dueño del planner" desde el usuario actual anterior
  // a Leonar y elimina al anterior. Aplica tanto a bases demo
  // viejas como a la semilla recién sembrada.
  const oldCurrent = (db.users ?? []).find((u) => u.isCurrent) ?? null
  let leonar = (db.users ?? []).find((u) => /ti@metalabsac\.com/i.test(u.email ?? ''))
  if (!leonar) {
    leonar = {
      id: 'u-leonar',
      email: 'ti@metalabsac.com',
      fullName: 'Leonar Antayhua',
      role: 'Coordinador de Proyectos',
      avatarUrl: '',
      isCurrent: true,
    }
    db.users = [...(db.users ?? []), leonar]
    changed = true
  } else if (leonar.role !== 'Coordinador de Proyectos') {
    leonar.role = 'Coordinador de Proyectos'
    changed = true
  }
  for (const u of db.users ?? []) {
    const shouldBeCurrent = u === leonar
    if (Boolean(u.isCurrent) !== shouldBeCurrent) {
      u.isCurrent = shouldBeCurrent
      changed = true
    }
  }
  if (oldCurrent && oldCurrent !== leonar) {
    // Transferir los proyectos del usuario anterior (Ana) a Leonar
    for (const p of db.projects ?? []) {
      if (p.userId === oldCurrent.id) { p.userId = leonar.id; changed = true }
      if (p.assigneeId === oldCurrent.id) { p.assigneeId = leonar.id; changed = true }
    }
    db.users = (db.users ?? []).filter((u) => u !== oldCurrent)
    changed = true
  }

  for (const p of db.projects ?? []) {
    if (!('assigneeId' in p)) {
      p.assigneeId = p.userId ?? null
      changed = true
    }
    const norm = normalizeCategory(p.category)
    if (norm !== p.category) {
      p.category = norm
      changed = true
    }
  }
  if (changed) saveDb(db)
  return db
}

export function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

/** Borra los datos demo (útil para regenerar la semilla desde consola). */
export function resetDemoDb() {
  localStorage.removeItem(DB_KEY)
  return loadDb()
}

/* ─────────────────────────── Semilla de ejemplo ─────────────────────────── */
function uid(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function buildSeed() {
  const t = todayISO()
  // offset = días relativos a hoy (negativo = pasado)
  const upd = (projectId, offset, statusType, notes) => ({
    id: uid('up'),
    projectId,
    statusType,
    updateDate: addDaysISO(t, offset),
    notes,
  })

  /* ── Usuarios (el de isCurrent:true es "tú", dueño de los proyectos del Mi Planner) ── */
  const users = [
    { id: 'u-leonar', email: 'ti@metalabsac.com', fullName: 'Leonar Antayhua', role: 'Coordinador de Proyectos', avatarUrl: '', isCurrent: true },
    { id: 'u-luis', email: 'luis.medina@itbi.dev', fullName: 'Luis Medina', role: 'Desarrollador',            avatarUrl: '', isCurrent: false },
    { id: 'u-carla', email: 'carla.rojas@itbi.dev', fullName: 'Carla Rojas', role: 'Analista BI',             avatarUrl: '', isCurrent: false },
    { id: 'u-diego', email: 'diego.herrera@itbi.dev', fullName: 'Diego Herrera', role: 'Infraestructura',  avatarUrl: '', isCurrent: false },
    { id: 'u-sofia', email: 'sofia.vargas@itbi.dev', fullName: 'Sofía Vargas', role: 'Analista BI',         avatarUrl: '', isCurrent: false },
  ]

  /* ── Proyectos ──
     Enfoque "planner del coordinador": TODOS los proyectos los crea el usuario
     actual (u-leonar, isCurrent) y cada uno lleva el campo assigneeId = la
     persona a la que se le hace seguimiento (Responsable en la UI). */
  const projects = [
    {
      id: 'p-bi-self',
      userId: 'u-leonar',
      assigneeId: 'u-carla',
      name: 'Plataforma BI Self-Service',
      description: 'Centralizar KPIs comerciales en dashboards self-service. El área de negocio consulta sus métricas sin depender del equipo de datos.',
      category: 'Desarrollo de Nuevo Software',
      deadlineDate: addDaysISO(t, 45),
      progress: 62,
      status: 'active',
      createdAt: addDaysISO(t, -105),
    },
    {
      id: 'p-app-360',
      userId: 'u-leonar',
      assigneeId: 'u-luis',
      name: 'App Cliente 360',
      description: 'Portal de autogestión para clientes: facturación, tickets y seguimiento de pedidos en una sola vista.',
      category: 'Desarrollo de Nuevo Software',
      deadlineDate: addDaysISO(t, -12),
      progress: 82,
      status: 'active',
      createdAt: addDaysISO(t, -72),
    },
    {
      id: 'p-etl-dbt',
      userId: 'u-leonar',
      assigneeId: 'u-luis',
      name: 'Migración ETL → dbt Cloud',
      description: 'Reescribir los pipelines legacy de SQL Server a modelos versionados en dbt con pruebas unitarias de datos.',
      category: 'Integración de Sistemas',
      deadlineDate: addDaysISO(t, 18),
      progress: 40,
      status: 'active',
      createdAt: addDaysISO(t, -45),
    },
    {
      id: 'p-cubo-fin',
      userId: 'u-leonar',
      assigneeId: 'u-carla',
      name: 'Cubo Financiero Multidimensional',
      description: 'Modelo OLAP de finanzas (P&L, presupuesto vs. real) alimentado desde el data warehouse corporativo.',
      category: 'Análisis y Modelado',
      deadlineDate: addDaysISO(t, 30),
      progress: 55,
      status: 'active',
      createdAt: addDaysISO(t, -60),
    },
    {
      id: 'p-tickets',
      userId: 'u-leonar',
      assigneeId: 'u-luis',
      name: 'Portal de Tickets IT',
      description: 'Sustituir el correo como canal de soporte interno por un portal con SLA, colas por área y autoservicio.',
      category: 'Corrección de Errores (Bugs)',
      deadlineDate: addDaysISO(t, 7),
      progress: 100,
      status: 'done',
      createdAt: addDaysISO(t, -65),
    },
    {
      id: 'p-hardening',
      userId: 'u-leonar',
      assigneeId: 'u-diego',
      name: 'Hardening Zero Trust',
      description: 'Acceso con verificación continua: MFA obligatorio, microsegmentación de red y auditoría de privilegios.',
      category: 'Mantenimiento y Mejoras',
      deadlineDate: addDaysISO(t, -2),
      progress: 74,
      status: 'active',
      createdAt: addDaysISO(t, -48),
    },
  ]

  /* ── Avances (timeline). Notas con acuerdos de reunión realistas ── */
  const updates = [
    // ▸ Plataforma BI Self-Service (mi proyecto principal — timeline variado)
    upd('p-bi-self', -105, 'pruebas_iniciales',
      'Validación de conectividad con la fuente Oracle (ventas).\nHallazgos:\n- Timeout en queries > 5 min (índices faltantes).\n- Duplicados en la tabla de clientes (10%).\nAcuerdo: pedir a DBA reconstruir índices y dedupe antes del modelado.'),
    upd('p-bi-self', -88, 'reunion_pendiente',
      'Kickoff con stakeholders de negocio.\nAcuerdos:\n- Alcance M1: dashboard de ventas + inventario.\n- Definir KPI de churn en taller aparte.\n- Demo quincenal los jueves 10:00.\nPendiente: confirmar acceso a la fuente de RRHH.'),
    upd('p-bi-self', -64, 'mejoras_refactor',
      'Refactor del modelo semántico en dbt para reutilizar métricas.\n\nCódigo clave:\n{{ config(materialized="view") }}\nWITH ventas AS (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY orden_id ORDER BY fecha DESC) rn\n  FROM {{ ref("stg_ventas") }}\n)\nSELECT * FROM ventas WHERE rn = 1\n\nReduce el tiempo de modelado de nuevos reportes de 2 días a horas.'),
    upd('p-bi-self', -41, 'implementado_ok',
      'Entrega del módulo de reporting financiero (M2).\nValidado con finanzas: 100% de conciliación contra el cierre contable.\nQA pasó sin incidencias bloqueantes.'),
    upd('p-bi-self', -19, 'reparacion_bug',
      'Bug: el KPI de churn mostraba -12% en el filtro "últimos 90 días".\nCausa raíz: el filtro no se propagaba a la subconsulta de cohortes.\nFix aplicado y verificado con el set de regresión. Pendiente replicar en el entorno productivo.'),
    upd('p-bi-self', -6, 'reunion_pendiente',
      'Demo del dashboard de ventas con gerencia comercial.\nAcuerdos:\n- Cambiar métrica principal a "margen por categoría" (no ticket promedio).\n- Agregar comparativo vs. mismo mes del año anterior.\nPróximo paso: ajustar layout y publicar en el workspace del equipo.'),
    upd('p-bi-self', -1, 'pruebas_iniciales',
      'QA del rediseño solicitado en la demo. Se probaron los 6 filtros combinados.\nObservación menor: tooltips cortados en pantallas < 1280px. Se corrige en el siguiente commit.'),

    // ▸ App Cliente 360 (retrasada, mi segundo proyecto)
    upd('p-app-360', -72, 'reunion_pendiente',
      'Reunión de alcance con Producto.\nAcuerdos:\n- Módulo de tickets primero, facturación en fase 2.\n- Notificaciones por email + push.\nPendiente: definir flujo de reembolsos.'),
    upd('p-app-360', -50, 'pruebas_iniciales',
      'Primera integración con el API de pagos en sandbox.\nPruebas de humo OK. Se detecta latencia > 800 ms en confirmación; se agenda optimización.'),
    upd('p-app-360', -27, 'reparacion_bug',
      'Bug crítico: sesión expiraba al actualizar el perfil (refresh token no se renovaba).\nFix: reautenticar tras PATCH /me y rotar el token en el interceptor.'),
    upd('p-app-360', -9, 'mejoras_refactor',
      'Refactor del estado global (Context → store con actions tipadas).\nReducción de renders innecesarios: -38% tiempo de interacción en el módulo de tickets.'),
    upd('p-app-360', -3, 'reunion_pendiente',
      'Revisión de avance con stakeholders.\nAlerta: fecha límite comprometida por retraso en QA externo.\nAcuerdos:\n- Priorizar flujo de tickets (crítico) sobre facturación.\n- QA interno extra desde mañana.\nNuevo plan de entrega se presenta el viernes.'),

    // ▸ Migración ETL → dbt Cloud (Luis)
    upd('p-etl-dbt', -40, 'reunion_pendiente',
      'Kickoff con Data Engineering.\nAcuerdos: mapear los 24 pipelines legacy; se migran primero los 8 de ventas.\nPendiente: presupuesto para el runner de dbt Cloud.'),
    upd('p-etl-dbt', -21, 'pruebas_iniciales',
      'Prueba de concepto: 3 modelos de ventas en dbt vs. salida del ETL legacy.\nResultado: 99.2% de coincidencia. Se documentan las diferencias (redondeo de impuestos).'),
    upd('p-etl-dbt', -4, 'mejoras_refactor',
      'Se agregan tests de datos (not_null, unique, accepted_values) al 60% de los modelos.\nEl pipeline ahora falla temprano ante datos sucios en lugar de propagar errores.'),

    // ▸ Cubo Financiero (Carla)
    upd('p-cubo-fin', -60, 'reunion_pendiente',
      'Taller de requerimientos con Finanzas.\nAcuerdos:\n- Jerarquía de cuentas según catálogo contable vigente.\n- Corte mensual el día 3 hábil.\nPendiente: acceso de solo lectura al ERP.'),
    upd('p-cubo-fin', -33, 'pruebas_iniciales',
      'Prototipo del cubo con datos de 2025Q1.\nValidado contra el cierre: diferencias < 0.05% por tipo de cambio.\nSe ajusta el manejo de cuentas en moneda extranjera.'),
    upd('p-cubo-fin', -8, 'implementado_ok',
      'Versión 1 del cubo publicada en el workspace de análisis financiero.\nReportes estándar (P&L, presupuesto vs. real) corriendo sobre el modelo.'),

    // ▸ Portal de Tickets IT (Luis, completado)
    upd('p-tickets', -65, 'reunion_pendiente',
      'Levantamiento de procesos de soporte con TI.\nAcuerdos: colas por área (Mesa de ayuda, Redes, Aplicaciones), SLA 4h/24h.\n'),
    upd('p-tickets', -38, 'pruebas_iniciales',
      'Beta con 12 usuarios piloto. Se registraron 4 incidencias de notificaciones y 1 de permisos.'),
    upd('p-tickets', -12, 'implementado_ok',
      'Entrega oficial del portal. Migración completada: 1.240 tickets importados desde el buzón legacy.\nMétricas a 1 semana: 92% resueltos dentro del SLA.'),

    // ▸ Hardening Zero Trust (Diego)
    upd('p-hardening', -48, 'reunion_pendiente',
      'Comité de seguridad: aprobación del plan de microsegmentación por zona.\nPendiente: ventana de mantenimiento para el cambio de VLANs.'),
    upd('p-hardening', -22, 'mejoras_refactor',
      'Automatización de la gestión de accesos: scripts de aprovisionamiento (Terraform + Ansible). Se eliminan 120 accesos permanentes a servidores.'),
    upd('p-hardening', -6, 'pruebas_iniciales',
      'Prueba de MFA obligatorio en VPN. Detección y bloqueo de dispositivo no gestionado verificado.\nHallazgo: 14 cuentas de servicio sin MFA; se agenda su revisión.'),

    // ▸ Avances en desarrollo (estado "En Desarrollo")
    upd('p-app-360', -38, 'en_desarrollo',
      'Desarrollo del módulo de tickets (CRUD + estados SLA).\n- API de comentarios lista.\n- En curso: notificaciones por email.\nPróximo paso: integrar con el flujo de autenticación.'),
    upd('p-hardening', -15, 'en_desarrollo',
      'Construcción del controlador de acceso por zona (Zero Trust).\n- Política MFA por grupo implementada en staging.\n- En curso: dashboard de auditoría de privilegios.'),

    // ▸ Nota / consulta (registro libre)
    upd('p-bi-self', -2, 'nota',
      'Consulta: ¿el acceso a la fuente de RRHH quedó aprobado?\nInformación recibida: sí, la mesa de datos lo habilita este viernes.'),
  ]

  /* ── Objetivos semanales ──
     Flujo: en la reunión se crean con fecha de revisión (próxima reunión);
     en esa fecha se marcan cumplido / no cumplido + resultado. */
  const objectives = [
    {
      id: 'o-bi-1',
      projectId: 'p-bi-self',
      title: 'Publicar el dashboard de ventas en el workspace del equipo',
      detail: 'Incluir comparativo vs. mismo mes del año anterior (acordado en la última demo).',
      dueDate: addDaysISO(t, 4),
      status: 'pendiente',
      result: '',
      createdAt: addDaysISO(t, -3),
    },
    {
      id: 'o-bi-2',
      projectId: 'p-bi-self',
      title: 'Cerrar la definición del KPI de churn con negocio',
      detail: 'Taller de métricas con el área comercial.',
      dueDate: addDaysISO(t, -3),
      status: 'no_cumplido',
      result: 'No se alcanzó: faltó la asistencia del área comercial. Se reagenda la próxima semana.',
      createdAt: addDaysISO(t, -10),
    },
    {
      id: 'o-bi-3',
      projectId: 'p-bi-self',
      title: 'Corregir tooltips cortados en pantallas < 1280px',
      detail: 'Hallazgo menor del QA del rediseño.',
      dueDate: addDaysISO(t, -3),
      status: 'cumplido',
      result: 'Corregido y verificado en staging.',
      createdAt: addDaysISO(t, -10),
    },
    {
      id: 'o-app-1',
      projectId: 'p-app-360',
      title: 'Terminar flujo de tickets: comentarios + notificaciones',
      detail: 'Pendiente la integración con el flujo de autenticación.',
      dueDate: addDaysISO(t, 7),
      status: 'pendiente',
      result: '',
      createdAt: addDaysISO(t, -1),
    },
  ]

  return { users, projects, updates, objectives }
}
