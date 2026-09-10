/* ═════════════════════════════════════════════════════════════════════════════
   toast.js — Notificaciones efímeras (éxito / error / info).
   Renderiza dentro de #toast-root (definido en index.html).
═════════════════════════════════════════════════════════════════════════════ */
import { esc } from '../lib/utils.js'
import { ic } from './icons.js'

const ICONS = {
  success: { icon: 'checkCircle', cls: 'text-emerald-400' },
  error: { icon: 'alertTriangle', cls: 'text-rose-400' },
  info: { icon: 'zap', cls: 'text-brand-400' },
}

export function toast(message, type = 'success', ms = 3200) {
  const root = document.getElementById('toast-root')
  if (!root) return

  const meta = ICONS[type] ?? ICONS.info
  const el = document.createElement('div')
  el.className = `toast toast-${type}`
  el.setAttribute('role', 'status')
  el.innerHTML = `${ic[meta.icon](`w-4 h-4 ${meta.cls}`)}<span>${esc(message)}</span>`
  root.appendChild(el)

  // Auto-ocultar con fade-out suave
  const remove = () => {
    el.style.transition = 'opacity .25s ease, transform .25s ease'
    el.style.opacity = '0'
    el.style.transform = 'translateY(8px)'
    setTimeout(() => el.remove(), 260)
  }
  const timer = setTimeout(remove, ms)
  el.addEventListener('click', () => { clearTimeout(timer); remove() })
}
