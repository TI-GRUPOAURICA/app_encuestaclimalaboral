/* ═════════════════════════════════════════════════════════════════════════════
   common.js — Fragmentos de markup reutilizados por Dashboard y Planner
   (avatares, barras de progreso, chips de estado).
═════════════════════════════════════════════════════════════════════════════ */
import { esc, initialsOf, avatarGradient } from '../lib/utils.js'

/* Tamaños de avatar: sm | md | lg | xl */
const AVATAR_SIZE = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-7 h-7 text-[11px]',
  lg: 'w-9 h-9 text-xs',
  xl: 'w-12 h-12 text-sm',
}

/** Avatar: imagen remota (avatar_url) o iniciales con degradado estable. */
export function avatarHtml(user, size = 'md') {
  if (!user) return ''
  const cls = AVATAR_SIZE[size] ?? AVATAR_SIZE.md
  if (user.avatarUrl) {
    return `<img src="${esc(user.avatarUrl)}" alt="${esc(user.fullName)}" referrerpolicy="no-referrer"
                class="avatar object-cover ${cls}" />`
  }
  return `<span class="avatar bg-gradient-to-br ${avatarGradient(user.fullName)} ${cls}"
                aria-label="${esc(user.fullName)}">${esc(initialsOf(user.fullName))}</span>`
}

/** Barra de progreso con color configurable (clases Tailwind literales). */
export function progressBarHtml(percent, barColor = 'bg-brand-500') {
  const p = Math.min(100, Math.max(0, Number(percent) || 0))
  return `
    <div class="flex items-center gap-2.5 w-full" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100">
      <div class="h-1.5 flex-1 rounded-full bg-zinc-800 overflow-hidden">
        <div class="h-full rounded-full ${barColor} transition-[width] duration-500" style="width:${p}%"></div>
      </div>
      <span class="text-xs font-semibold text-zinc-300 tabular-nums w-9 text-right">${p}%</span>
    </div>`
}
