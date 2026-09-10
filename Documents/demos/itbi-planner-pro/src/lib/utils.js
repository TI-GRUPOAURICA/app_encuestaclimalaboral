/* ═════════════════════════════════════════════════════════════════════════════
   utils.js — Utilidades puras: fechas, escape HTML, avatares, salud del proyecto.
   Todo módulo de UI importa helpers de aquí para mantener el markup consistente.
═════════════════════════════════════════════════════════════════════════════ */

/* ── Escape de HTML (protección XSS para datos que vienen de la BD) ─────── */
export function esc(value) {
  const map = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;',
  }
  return String(value ?? '').replace(/[&<>"']/g, (c) => map[c])
}

/* ── Fechas (ISO 'YYYY-MM-DD' en todo el dominio) ────────────────────────── */
export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export const todayISO = () => toISODate(new Date())

/** Suma/resta días a una fecha ISO y devuelve otra ISO (seguro con DST). */
export function addDaysISO(iso, days) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

const esShort = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' })
const esMed   = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
const esLong  = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const fmtDateShort = (iso) => (iso ? esShort.format(new Date(`${iso}T12:00:00`)) : '—')
export const fmtDate      = (iso) => (iso ? esMed.format(new Date(`${iso}T12:00:00`)) : '—')
export function fmtDateLong(iso) {
  if (!iso) return '—'
  const s = esLong.format(new Date(`${iso}T12:00:00`))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/* ── Meses (para el gráfico de barras) ───────────────────────────────────── */
export const monthKeyOf = (iso) => (iso ? iso.slice(0, 7) : '')

/** Últimos n meses como claves 'YYYY-MM' en orden ascendente (termina en el actual). */
export function lastMonthKeys(n = 6) {
  const out = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

/** '2025-03' → 'mar 25' (año solo si difiere del actual). */
export function monthShortLabel(key) {
  const [y, m] = key.split('-').map(Number)
  const nowY = new Date().getFullYear()
  const label = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(new Date(y, m - 1, 1))
  return y === nowY ? label : `${label} '${String(y).slice(2)}`
}

/* ── Avatares por iniciales (hash del nombre → degradado estable) ────────── */
const AVATAR_GRADIENTS = [
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
]
export const avatarGradient = (name = '') => {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length]
}
export const initialsOf = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')

/* ── Salud del proyecto (deriva el badge Al Día / Retrasado) ─────────────── */
export function projectHealth(project) {
  const today = todayISO()
  const done = Number(project.progress) >= 100
  const pastDeadline = project.deadlineDate && project.deadlineDate < today
  return done || !pastDeadline ? 'on_time' : 'delayed'
}

/** Etiqueta humana de días respecto a la fecha límite. */
export function deadlineLabel(iso) {
  if (!iso) return { text: 'Sin fecha', tone: '' }
  const today = new Date(`${todayISO()}T12:00:00`)
  const target = new Date(`${iso}T12:00:00`)
  const diff = Math.round((target - today) / 86400000)
  if (diff === 0) return { text: 'Hoy', tone: 'text-amber-400' }
  if (diff < 0) return { text: `Hace ${Math.abs(diff)} día${Math.abs(diff) === 1 ? '' : 's'}`, tone: 'text-rose-400' }
  if (diff <= 14) return { text: `${diff} día${diff === 1 ? '' : 's'} restante${diff === 1 ? '' : 's'}`, tone: 'text-amber-400' }
  return { text: `${diff} días`, tone: 'text-zinc-500' }
}

/** Número con signo (para textos cortos de KPIs, si hiciera falta). */
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n))
