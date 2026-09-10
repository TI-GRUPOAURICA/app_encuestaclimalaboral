/* ═════════════════════════════════════════════════════════════════════════════
   report.js — Informe de Avance (resumen gerencial).
   Modal profesional con KPIs, gráfico de avances por mes (CSS puro), estado
   por proyecto y objetivos. Incluye "Copiar resumen" e "Imprimir / PDF".
   Solo usa el estado en memoria (state) y el shell de modales (pila).
═════════════════════════════════════════════════════════════════════════════ */
import { esc, fmtDate, fmtDateLong, fmtDateShort, todayISO, lastMonthKeys, monthKeyOf, monthShortLabel } from '../lib/utils.js'
import { getCategoryMeta, getUpdateType, getHealthMeta, HEALTH_META } from '../lib/statuses.js'
import { state, assigneeOf } from '../state.js'
import { openModal } from './modals.js'
import { toast } from './toast.js'
import { ic } from './icons.js'

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

const healthOf = (p) => getHealthMeta(p.progress >= 100 ? 'on_time'
  : (p.deadlineDate && p.deadlineDate < todayISO() ? 'delayed' : 'on_time'))

/** Gráfico de barras mensual (avances registrados, últimos 6 meses). */
function monthlyChartHtml() {
  const months = lastMonthKeys(6)
  const counts = months.map((mk) => state.updates.filter((u) => monthKeyOf(u.updateDate) === mk).length)
  const max = Math.max(...counts, 1)
  return `
    <div class="rounded-xl bg-zinc-950/50 ring-1 ring-zinc-800 p-4">
      <div class="flex items-center justify-between mb-3">
        <p class="text-sm font-semibold text-zinc-200 flex items-center gap-2">${ic.barChart('w-4 h-4 text-brand-400')} Avances registrados por mes</p>
        <span class="chip bg-zinc-800/70 text-zinc-400 ring-zinc-700/60">últimos 6 meses</span>
      </div>
      <div class="flex items-end gap-2 h-36">
        ${months.map((mk, i) => {
          const v = counts[i]
          const h = v ? Math.max(8, Math.round((v / max) * 100)) : 4
          return `
            <div class="flex-1 flex flex-col items-center gap-1" title="${monthShortLabel(mk)}: ${v} avance${v === 1 ? '' : 's'}">
              <span class="text-[11px] text-zinc-400 tabular-nums">${v}</span>
              <div class="w-full rounded-md bg-brand-500/80 hover:bg-brand-400 transition" style="height:${h}%"></div>
              <span class="text-[10px] text-zinc-500">${esc(monthShortLabel(mk))}</span>
            </div>`
        }).join('')}
      </div>
    </div>`
}

function projectRowsHtml() {
  if (!state.projects.length) return '<p class="text-sm text-zinc-500">Sin proyectos registrados.</p>'
  return state.projects.map((p) => {
    const owner = assigneeOf(p)
    const cat = getCategoryMeta(p.category)
    const health = healthOf(p)
    const lastAv = state.updates.filter((u) => u.projectId === p.id)
      .sort((a, b) => (a.updateDate < b.updateDate ? 1 : -1))[0]
    return `
      <div class="rounded-xl bg-zinc-950/40 ring-1 ring-zinc-800/80 px-4 py-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-sm font-medium text-zinc-200 truncate">${esc(p.name)}</p>
            <p class="text-xs text-zinc-500 truncate">${esc(owner?.fullName ?? '—')} · <span class="chip ${cat.badge} !py-0 !text-[10px]">${esc(p.category)}</span></p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-sm font-semibold text-zinc-200 tabular-nums">${p.progress}%</span>
            <span class="chip ${health.badge}"><span class="w-1.5 h-1.5 rounded-full bg-current"></span>${health.label}</span>
            ${lastAv ? `<span class="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
              <span class="w-1.5 h-1.5 rounded-full ${getUpdateType(lastAv.statusType).dot}"></span>${esc(getUpdateType(lastAv.statusType).label)}</span>` : ''}
          </div>
        </div>
        <div class="mt-2.5 h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div class="h-full rounded-full ${health.bar} transition" style="width:${Math.min(100, Math.max(0, p.progress))}%"></div>
        </div>
      </div>`
  }).join('')
}

function objectivesHtml() {
  const pend = state.objectives.filter((o) => o.status === 'pendiente')
  const cum = state.objectives.filter((o) => o.status === 'cumplido')
  const noCum = state.objectives.filter((o) => o.status === 'no_cumplido')
  return `
    <div class="rounded-xl bg-zinc-950/40 ring-1 ring-zinc-800/80 p-4">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p class="text-sm font-semibold text-zinc-200 flex items-center gap-2">${ic.flag('w-4 h-4 text-brand-400')} Objetivos</p>
        <div class="flex gap-1.5">
          ${pend.length ? `<span class="chip bg-zinc-800/80 text-zinc-300 ring-zinc-700/60">${pend.length} pendiente${pend.length === 1 ? '' : 's'}</span>` : ''}
          ${cum.length ? `<span class="chip bg-emerald-500/10 text-emerald-400 ring-emerald-500/30">${cum.length} cumplido${cum.length === 1 ? '' : 's'}</span>` : ''}
          ${noCum.length ? `<span class="chip bg-rose-500/10 text-rose-400 ring-rose-500/30">${noCum.length} no cumplido${noCum.length === 1 ? '' : 's'}</span>` : ''}
          ${!state.objectives.length ? '<span class="chip bg-zinc-800/60 text-zinc-500 ring-zinc-700/60">Sin objetivos</span>' : ''}
        </div>
      </div>
      ${pend.length
        ? `<ul class="space-y-1.5">${pend.slice(0, 8).map((o) => `
            <li class="flex items-center justify-between gap-3 text-[13px]">
              <span class="text-zinc-300 truncate">• ${esc(o.title)}</span>
              <span class="text-[11px] text-zinc-500 shrink-0">rev. ${esc(fmtDateShort(o.dueDate))}</span>
            </li>`).join('')}</ul>`
        : '<p class="text-[13px] text-zinc-500">No hay objetivos pendientes para la próxima reunión.</p>'}
    </div>`
}

/** Texto plano del informe (para "Copiar resumen"). */
function buildReportText() {
  const total = state.projects.length
  const ontime = state.projects.filter((p) => healthOf(p).key === 'on_time').length
  const delayed = total - ontime
  const avances = state.updates.length
  const pend = state.objectives.filter((o) => o.status === 'pendiente').length
  const cum = state.objectives.filter((o) => o.status === 'cumplido').length
  const lines = [
    `INFORME DE AVANCE · Proyectos TI/BI (Grupo Aurica)`,
    `Generado: ${fmtDateLong(todayISO())} · Coordinador: ${state.currentUser?.fullName ?? ''}`,
    ``,
    `Resumen: ${total} proyecto(s) · ${ontime} al día · ${delayed} retrasados · ${avances} avances · ${pend} objetivos pendientes · ${cum} cumplidos.`,
    ``,
    `Estado por proyecto:`,
  ]
  for (const p of state.projects) {
    const owner = assigneeOf(p)
    const health = healthOf(p)
    const lastAv = state.updates.filter((u) => u.projectId === p.id)
      .sort((a, b) => (a.updateDate < b.updateDate ? 1 : -1))[0]
    lines.push(`• ${p.name} | ${owner?.fullName ?? '—'} | ${p.progress}% | ${health.label} | ${lastAv ? getUpdateType(lastAv.statusType).label : 'sin avances'}`)
  }
  if (pend) {
    lines.push(``, `Objetivos pendientes:`)
    for (const o of state.objectives.filter((x) => x.status === 'pendiente')) {
      lines.push(`  - ${o.title} (rev. ${o.dueDate ?? '—'})`)
    }
  }
  return lines.join('\n')
}

export function openReportModal() {
  const { overlay } = openModal({
    title: 'Informe de Avance',
    subtitle: 'Resumen gerencial · proyectos, avances y objetivos.',
    wide: true,
    contentHtml: `
      <div class="report-sheet space-y-5">
        <header class="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <p class="text-[11px] uppercase tracking-[0.22em] text-brand-400">Informe de Avance</p>
            <h2 class="mt-1 text-xl font-bold text-zinc-50 tracking-tight">Proyectos TI/BI · Grupo Aurica</h2>
            <p class="mt-1 text-xs text-zinc-500">Generado el ${esc(fmtDateLong(todayISO()))} · Coordinador: ${esc(state.currentUser?.fullName ?? '—')}</p>
          </div>
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-400">${ic.fileText('w-5 h-5')}</span>
        </header>

        <!-- KPIs -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          ${[
            { label: 'Proyectos', value: state.projects.length, tone: 'text-zinc-50' },
            { label: 'Al día', value: state.projects.filter((p) => healthOf(p).key === 'on_time').length, tone: 'text-emerald-400' },
            { label: 'Retrasados', value: state.projects.filter((p) => healthOf(p).key === 'delayed').length, tone: 'text-rose-400' },
            { label: 'Avances', value: state.updates.length, tone: 'text-brand-300' },
          ].map((k) => `
            <div class="rounded-xl bg-zinc-950/50 ring-1 ring-zinc-800 px-3 py-3">
              <p class="text-[11px] uppercase tracking-wider text-zinc-500">${k.label}</p>
              <p class="mt-1 text-2xl font-bold tabular-nums ${k.tone}">${k.value}</p>
            </div>`).join('')}
        </div>

        ${monthlyChartHtml()}

        <div>
          <p class="label mb-2">Estado por proyecto</p>
          <div class="space-y-2">${projectRowsHtml()}</div>
        </div>

        ${objectivesHtml()}
      </div>
    `,
    footerHtml: `
      <button type="button" data-copy-report class="btn-ghost">${ic.copy('w-4 h-4')} Copiar resumen</button>
      <button type="button" data-print-report class="btn-secondary">${ic.fileText('w-4 h-4')} Imprimir / PDF</button>
      <span class="flex-1"></span>
      <button type="button" data-modal-close class="btn-ghost">${ic.x('w-4 h-4')} Cerrar</button>
    `,
  })

  overlay.querySelector('[data-copy-report]')?.addEventListener('click', async () => {
    const ok = await copyText(buildReportText())
    toast(ok ? 'Informe copiado ✓ — pégalo en el chat o correo' : 'No se pudo copiar.', ok ? 'success' : 'error')
  })
  overlay.querySelector('[data-print-report]')?.addEventListener('click', () => {
    overlay.classList.add('report-print')
    window.print()
    // limpia la clase al volver (algunos navegadores bloquean durante el print)
    setTimeout(() => overlay.classList.remove('report-print'), 1000)
  })
}
