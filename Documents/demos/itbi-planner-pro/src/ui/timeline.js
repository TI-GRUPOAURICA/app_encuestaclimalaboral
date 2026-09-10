/* ═════════════════════════════════════════════════════════════════════════════
   timeline.js — Render compartido del "Timeline / Ruta de Avances".
   Lo usan Mi Planner (inline en la página) y el Dashboard (dentro de un modal).
   Un único punto de verdad para la geometría de nodos y rail (CSS en style.css).

   Uso:
     timelineMarkup(updates)   → HTML del track (nodos + rail), ordenado asc.
     centerTimeline(scopeEl)   → centra el track si no desborda el contenedor.
   Los nodos llevan data-action="open-avance-detail" → delegado en main.js
   (abre el modal de Detalles de Avance al hacer clic).
═════════════════════════════════════════════════════════════════════════════ */
import { esc, fmtDate, fmtDateShort } from '../lib/utils.js'
import { getUpdateType } from '../lib/statuses.js'

function nodeHtml(update, index, total) {
  const type = getUpdateType(update.statusType)
  const firstLine = (update.notes || type.label).split('\n').find(Boolean) ?? type.label
  const hint = `${type.label} · ${fmtDate(update.updateDate)} — ${firstLine}`
  return `
    <div class="tl-col" data-action="open-avance-detail" data-update-id="${esc(update.id)}"
         data-update-index="${index}" title="${esc(hint)}" tabindex="0" role="button"
         aria-label="Ver detalle: ${esc(type.label)} del ${esc(fmtDateShort(update.updateDate))}">
      <div class="tl-date">${esc(fmtDateShort(update.updateDate))}</div>
      <div class="tl-mid">
        <span class="tl-dot ${type.dot}" aria-hidden="true"></span>
      </div>
      <p class="tl-cap">${esc(type.label)}</p>
      ${index === total - 1 ? '<p class="mt-1 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">último</p>' : ''}
    </div>`
}

/** HTML del timeline completo (debe insertarse dentro de un contenedor con scroll). */
export function timelineMarkup(updates) {
  if (!updates.length) return ''
  return `
    <div class="tl-scroll">
      <div class="tl-track">
        ${updates.map((u, i) => nodeHtml(u, i, updates.length)).join('')}
      </div>
    </div>`
}

/** Si el track cabe sin desbordar, lo centra (clase .fit definida en CSS). */
export function centerTimeline(scope) {
  const scroll = scope?.querySelector('.tl-scroll')
  if (!scroll) return
  const track = scroll.querySelector('.tl-track')
  if (track && track.scrollWidth <= scroll.clientWidth) scroll.classList.add('fit')
}
