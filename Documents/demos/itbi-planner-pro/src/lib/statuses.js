/* ═════════════════════════════════════════════════════════════════════════════
   statuses.js — Vocabulario de la aplicación (fuente única de verdad):
     · UPDATE_TYPES : los 5 estados de avance del timeline + colores Tailwind.
     · CATEGORIES   : categorías de proyectos (Desarrollo / BI / Infraestructura).
     · HEALTH_META  : badge de la tabla (Al Día / Retrasado).

   ⚠️ Regla Tailwind v4: los strings de clase se escriben COMPLETOS aquí (p.ej.
   'bg-blue-500/10 text-blue-400 ring-blue-500/25'). Nunca concatenar a partir
   de variables, porque el purger no podría detectar la clase.
═════════════════════════════════════════════════════════════════════════════ */

export const UPDATE_TYPES = {
  // ── Sistema (no seleccionable manualmente) ──
  inicio_proyecto: {
    key: 'inicio_proyecto',
    label: 'Inicio de Proyecto',
    short: 'Inicio',
    dot: 'bg-slate-500',
    badge: 'bg-slate-500/10 text-slate-300 ring-slate-500/25',
    hex: '#64748b',                 // slate-500
    desc: 'Punto de partida del proyecto: creación y definición inicial del alcance.',
  },
  // ── Estados operativos (seleccionables en "Nuevo Avance") ──
  reunion_pendiente: {
    key: 'reunion_pendiente',
    label: 'Reunión Pendiente',
    short: 'Reunión',
    dot: 'bg-blue-500',
    badge: 'bg-blue-500/10 text-blue-400 ring-blue-500/25',
    hex: '#3b82f6',                 // blue-500
    desc: 'Agenda, acuerdos o decisiones pendientes de una reunión de seguimiento.',
  },
  en_desarrollo: {
    key: 'en_desarrollo',
    label: 'En Desarrollo',
    short: 'Desarrollo',
    dot: 'bg-sky-500',
    badge: 'bg-sky-500/10 text-sky-400 ring-sky-500/25',
    hex: '#0ea5e9',                 // sky-500
    desc: 'Trabajo activo de construcción o desarrollo del entregable.',
  },
  pruebas_iniciales: {
    key: 'pruebas_iniciales',
    label: 'Pruebas Iniciales',
    short: 'Pruebas',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-400 ring-amber-500/25',
    hex: '#f59e0b',                 // amber-500
    desc: 'Primeras pruebas funcionales, QA inicial o validación de humo.',
  },
  mejoras_refactor: {
    key: 'mejoras_refactor',
    label: 'Mejoras / Refactor',
    short: 'Mejoras',
    dot: 'bg-purple-500',
    badge: 'bg-purple-500/10 text-purple-400 ring-purple-500/25',
    hex: '#a855f7',                 // purple-500
    desc: 'Optimización, reestructuración de código o mejoras de rendimiento.',
  },
  reparacion_bug: {
    key: 'reparacion_bug',
    label: 'Reparación de Bug',
    short: 'Bug',
    dot: 'bg-red-500',
    badge: 'bg-red-500/10 text-red-400 ring-red-500/25',
    hex: '#ef4444',                 // red-500
    desc: 'Corrección de defectos, incidencias o errores detectados.',
  },
  implementado_ok: {
    key: 'implementado_ok',
    label: 'Implementado / Ok',
    short: 'OK',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/25',
    hex: '#10b981',                 // emerald-500
    desc: 'Entregado, desplegado y verificado por el equipo / negocio.',
  },
  // ── Notas libres (dudas, consultas, información recibida) ──
  nota: {
    key: 'nota',
    label: 'Nota / Consulta',
    short: 'Nota',
    dot: 'bg-teal-500',
    badge: 'bg-teal-500/10 text-teal-400 ring-teal-500/25',
    hex: '#14b8a6',                 // teal-500
    desc: 'Anotación libre: duda, consulta o información recibida para tenerla registrada.',
  },
}

/** Orden estable para leyenda y contadores del timeline (incluye Inicio). */
export const UPDATE_TYPE_KEYS = Object.keys(UPDATE_TYPES)

/** Estados que el usuario puede seleccionar al registrar un avance
    (se excluye "Inicio de Proyecto", que es automático del sistema). */
export const MANUAL_UPDATE_KEYS = UPDATE_TYPE_KEYS.filter((k) => k !== 'inicio_proyecto')

export const getUpdateType = (key) => UPDATE_TYPES[key] ?? UPDATE_TYPES.reunion_pendiente

/* ── Categorías de proyecto (solo Aplicación y Diagrama de Flujo) ───────── */
export const CATEGORIES = [
  'Desarrollo de Nuevo Software',
  'Mantenimiento y Mejoras',
  'Corrección de Errores (Bugs)',
  'Análisis y Modelado',
  'Integración de Sistemas',
]

export const CATEGORY_META = {
  'Desarrollo de Nuevo Software': {
    badge: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/25',
    hex: '#818cf8',                 // indigo-400
  },
  'Mantenimiento y Mejoras': {
    badge: 'bg-sky-500/10 text-sky-400 ring-sky-500/25',
    hex: '#38bdf8',                 // sky-400
  },
  'Corrección de Errores (Bugs)': {
    badge: 'bg-rose-500/10 text-rose-400 ring-rose-500/25',
    hex: '#fb7185',                 // rose-400
  },
  'Análisis y Modelado': {
    badge: 'bg-amber-500/10 text-amber-400 ring-amber-500/25',
    hex: '#fbbf24',                 // amber-400
  },
  'Integración de Sistemas': {
    badge: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/25',
    hex: '#22d3ee',                 // cyan-400
  },
}

/** Aliases de categorías de versiones anteriores → categorías actuales. */
const CATEGORY_ALIAS = {
  Aplicación: 'Desarrollo de Nuevo Software',
  Desarrollo: 'Desarrollo de Nuevo Software',
  'Diagrama de Flujo': 'Análisis y Modelado',
  BI: 'Análisis y Modelado',
  Infraestructura: 'Integración de Sistemas',
}

export const normalizeCategory = (cat) => CATEGORY_ALIAS[cat] ?? cat

export const getCategoryMeta = (cat) =>
  CATEGORY_META[normalizeCategory(cat)] ?? {
    badge: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/25',
    hex: '#818cf8',
  }

/* ── Badge de salud del proyecto (tabla del Dashboard) ───────────────────── */
export const HEALTH_META = {
  on_time: {
    key: 'on_time',
    label: 'Al Día',
    badge: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/25',
    hex: '#10b981',
    bar: 'bg-emerald-500',
  },
  delayed: {
    key: 'delayed',
    label: 'Retrasado',
    badge: 'bg-rose-500/10 text-rose-400 ring-rose-500/25',
    hex: '#f43f5e',
    bar: 'bg-rose-500',
  },
}

export const getHealthMeta = (key) => HEALTH_META[key] ?? HEALTH_META.on_time
