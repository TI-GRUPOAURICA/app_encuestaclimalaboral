/* ═════════════════════════════════════════════════════════════════════════════
   dashboard.js — Vista "Dashboard Gerencial" (administrador / equipo).
   Renderiza en los contenedores estáticos de index.html:
     #dash-insights · #kpi-grid · #tbl-body
   La subtabla tiene búsqueda + filtro por estado SIN tocar los gráficos
   (solo se re-renderiza el <tbody>).

   ⚠️ Los manejadores sobre elementos estáticos se asignan con `.oninput` /
   `.onchange` (propiedad, no addEventListener) para evitar listeners duplicados
   cuando la vista se re-renderiza tras cada mutación de datos.
═════════════════════════════════════════════════════════════════════════════ */
import { esc, fmtDate, fmtDateShort, projectHealth, deadlineLabel, todayISO, fmtDateLong } from '../lib/utils.js'
import { getCategoryMeta, getHealthMeta, getUpdateType, HEALTH_META } from '../lib/statuses.js'
import { state, assigneeOf } from '../state.js'
import { avatarHtml, progressBarHtml } from './common.js'
import { ic } from './icons.js'

/* Meta (chip) de estado de objetivo — espejo del usado en Mi Planner. */
const OBJ_META = {
  pendiente: { label: 'Pendiente', cls: 'bg-zinc-800/80 text-zinc-300 ring-zinc-700/60' },
  cumplido: { label: 'Cumplido', cls: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30' },
  no_cumplido: { label: 'No cumplido', cls: 'bg-rose-500/10 text-rose-400 ring-rose-500/30' },
}

/** Último objetivo de un proyecto (el más reciente creado). */
const lastObjectiveOf = (projectId) =>
  state.objectives
    .filter((o) => o.projectId === projectId)
    .sort((a, b) => (a.createdAt ?? '') < (b.createdAt ?? '') ? 1 : -1)[0] ?? null

export function renderDashboard() {
  const { projects, users, currentUser } = state

  // Subtítulo con fecha de hoy (ej. "Visión global · miércoles, 8 de enero de 2025")
  const sub = document.getElementById('dash-subtitle')
  if (sub) sub.textContent = `Visión global del equipo · ${fmtDateLong(todayISO())}`

  renderInsights()
  renderKPIs(projects, users)
  renderTableBody() // usa los filtros actuales

  bindTableFilters()

  // Nota amable si estamos en modo demo y no hay datos suficientes
  if (!currentUser) console.warn('[Dashboard] Sin usuario actual.')
}

/* ─────── Insights de la reunión semanal (objetivos) ─────────────────────── */
function renderInsights() {
  const holder = document.getElementById('dash-insights')
  if (!holder) return

  const pendientes = state.objectives.filter((o) => o.status === 'pendiente')
  const vencidos = pendientes.filter((o) => o.dueDate && o.dueDate < todayISO())
  const cumplidos = state.objectives.filter((o) => o.status === 'cumplido')
  const nextDue = pendientes.map((o) => o.dueDate).sort()[0]

  const chips = []
  if (nextDue) {
    chips.push(`<span class="chip bg-brand-500/10 text-brand-300 ring-brand-500/30">
      <span class="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
      Próxima revisión: <span class="font-semibold">${esc(fmtDateShort(nextDue))}</span></span>`)
  }
  if (pendientes.length) {
    chips.push(`<span class="chip ${OBJ_META.pendiente.cls}">
      <span class="w-1.5 h-1.5 rounded-full bg-current"></span>${pendientes.length} objetivo${pendientes.length === 1 ? '' : 's'} pendiente${pendientes.length === 1 ? '' : 's'}</span>`)
  }
  if (vencidos.length) {
    chips.push(`<span class="chip ${OBJ_META.no_cumplido.cls}">
      <span class="w-1.5 h-1.5 rounded-full bg-current"></span>${vencidos.length} por revisar en la reunión</span>`)
  }
  if (cumplidos.length) {
    chips.push(`<span class="chip ${OBJ_META.cumplido.cls}">
      <span class="w-1.5 h-1.5 rounded-full bg-current"></span>${cumplidos.length} cumplido${cumplidos.length === 1 ? '' : 's'}</span>`)
  }
  if (!chips.length) {
    chips.push(`<span class="chip bg-zinc-800/60 text-zinc-500 ring-zinc-700/60">Sin objetivos registrados esta semana</span>`)
  }
  holder.innerHTML = chips.join('')
}

/* ────────────────────────── Tarjetas KPI ────────────────────────────────── */
const KPI_META = [
  {
    key: 'total',
    label: 'Total de proyectos',
    icon: 'folder',
    iconCls: 'bg-brand-500/10 text-brand-400',
    caption: () => 'Portafolio activo del equipo',
  },
  {
    key: 'ontime',
    label: 'Proyectos al día',
    icon: 'checkCircle',
    iconCls: 'bg-emerald-500/10 text-emerald-400',
    caption: () => 'Dentro de la fecha límite',
  },
  {
    key: 'delayed',
    label: 'Proyectos retrasados',
    icon: 'alertTriangle',
    iconCls: 'bg-rose-500/10 text-rose-400',
    caption: () => 'Requieren atención inmediata',
  },
  {
    key: 'members',
    label: 'Miembros activos',
    icon: 'users',
    iconCls: 'bg-cyan-500/10 text-cyan-400',
    caption: () => 'Con acceso a la plataforma',
  },
]

function renderKPIs(projects, users) {
  const grid = document.getElementById('kpi-grid')
  const delayed = projects.filter((p) => projectHealth(p) === 'delayed').length

  const valueFor = {
    total: projects.length,
    ontime: projects.length - delayed,
    delayed,
    members: users.length,
  }

  grid.innerHTML = KPI_META.map((k) => `
    <article class="card p-5 flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-xs font-medium text-zinc-500 tracking-wide">${k.label}</p>
        <p class="mt-2 text-[30px] font-bold leading-none text-zinc-50 tabular-nums">${valueFor[k.key]}</p>
        <p class="mt-2.5 text-xs text-zinc-600">${k.caption()}</p>
      </div>
      <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl ${k.iconCls}">${ic[k.icon]('w-[18px] h-[18px]')}</span>
    </article>`).join('')
}

/* ─────────────────────── Tabla de proyectos ─────────────────────────────── */
function currentFilters() {
  const searchEl = document.getElementById('tbl-search')
  const statusEl = document.getElementById('tbl-status')
  return {
    q: (searchEl?.value ?? '').trim().toLowerCase(),
    status: statusEl?.value ?? 'all',
  }
}

function filteredProjects() {
  const { q, status } = currentFilters()
  const list = [...state.projects]
  if (q) {
    return list.filter((p) => {
      const owner = assigneeOf(p)
      const haystack = `${p.name} ${p.category} ${owner?.fullName ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }
  if (status !== 'all') return list.filter((p) => projectHealth(p) === status)
  return list
}

function rowHtml(p) {
  // Responsable = persona a la que el jefe le hace seguimiento
  const owner = assigneeOf(p)
  const cat = getCategoryMeta(p.category)
  const healthKey = projectHealth(p)
  const health = getHealthMeta(healthKey)
  const dl = deadlineLabel(p.deadlineDate)
  const done = Number(p.progress) >= 100
  const barColor = done ? HEALTH_META.on_time.bar : healthKey === 'delayed' ? HEALTH_META.delayed.bar : 'bg-brand-500'
  const obj = lastObjectiveOf(p.id)
  const avs = state.updates.filter((u) => u.projectId === p.id).sort((a, b) => (a.updateDate < b.updateDate ? 1 : -1))
  const lastAv = avs[0]

  return `
    <tr class="group transition-colors hover:bg-zinc-800/25">
      <td class="px-5 py-4">
        <p class="font-medium text-zinc-200 leading-snug max-w-64 truncate">${esc(p.name)}</p>
        <p class="mt-0.5 text-xs text-zinc-500 line-clamp-1 max-w-64">${esc(p.description || 'Sin descripción')}</p>
      </td>
      <td class="px-4 py-4 hidden md:table-cell"><span class="chip ${cat.badge}">${esc(p.category)}</span></td>
      <td class="px-4 py-4">
        <div class="flex items-center gap-2.5">
          ${avatarHtml(owner, 'sm')}
          <span class="text-[13px] text-zinc-300 truncate max-w-28">${esc(owner?.fullName ?? '—')}</span>
        </div>
      </td>
      <td class="px-4 py-4">
        <p class="text-[13px] text-zinc-300 tabular-nums whitespace-nowrap">${esc(fmtDate(p.deadlineDate))}</p>
        <p class="mt-0.5 text-[11px] ${dl.tone} whitespace-nowrap">${dl.text}</p>
      </td>
      <td class="px-4 py-4 min-w-44">
        ${progressBarHtml(p.progress, barColor)}
      </td>
      <td class="px-4 py-4">
        ${avs.length
          ? `<div class="flex flex-col gap-1 items-start">
              <span class="text-sm font-semibold text-zinc-300 tabular-nums">${avs.length} avance${avs.length === 1 ? '' : 's'}</span>
              ${lastAv ? `<span class="text-[11px] text-zinc-500 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full ${getUpdateType(lastAv.statusType).dot}"></span>
                Últ: ${esc(getUpdateType(lastAv.statusType).label)}</span>` : ''}
            </div>`
          : `<span class="text-xs text-zinc-600">—</span>`}
      </td>
      <td class="px-4 py-4">
        <span class="chip ${health.badge}">
          <span class="w-1.5 h-1.5 rounded-full bg-current"></span>${health.label}
        </span>
      </td>
      <td class="px-4 py-4 hidden md:table-cell">
        ${obj
          ? `<button type="button" data-action="review-objective" data-id="${esc(obj.id)}"
                     class="flex flex-col gap-1 items-start group/obj cursor-pointer"
                     title="Ver detalle y revisar el objetivo de ${esc(p.name)}">
              <span class="chip ${(OBJ_META[obj.status] ?? OBJ_META.pendiente).cls} transition group-hover/obj:ring-2 group-hover/obj:ring-brand-500/60">
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>${obj.status === 'pendiente' && obj.dueDate < todayISO() ? 'Vencido' : (OBJ_META[obj.status] ?? OBJ_META.pendiente).label}
              </span>
              <span class="text-[11px] text-zinc-500 group-hover/obj:text-brand-400 transition">rev. ${esc(fmtDateShort(obj.dueDate))} · ver</span>
            </button>`
          : `<span class="text-xs text-zinc-600">—</span>`}
      </td>
      <td class="px-4 py-4 text-right">
        <div class="flex items-center justify-end gap-1 transition">
          <button type="button" data-action="open-timeline" data-id="${esc(p.id)}"
                  class="btn-ghost !p-2 text-zinc-500 group-hover:text-sky-400"
                  title="Ver la línea de tiempo de avances de ${esc(p.name)}">${ic.route('w-4 h-4')}</button>
          <button type="button" data-action="open-objective-project" data-id="${esc(p.id)}"
                  class="btn-ghost !p-2 text-zinc-500 group-hover:text-brand-400"
                  title="Nuevo objetivo semanal para ${esc(p.name)}">${ic.flag('w-4 h-4')}</button>
          <button type="button" data-action="open-update" data-id="${esc(p.id)}"
                  class="btn-ghost !p-2 text-zinc-500 group-hover:text-zinc-200"
                  title="Registrar un avance en ${esc(p.name)}">${ic.plus('w-4 h-4')}</button>
          <button type="button" data-action="delete-project" data-id="${esc(p.id)}"
                  class="btn-ghost !p-2 text-zinc-500/60 group-hover:text-rose-400"
                  title="Eliminar proyecto (con confirmación)">${ic.trash('w-4 h-4')}</button>
        </div>
      </td>
    </tr>`
}

function renderTableBody() {
  const tbody = document.getElementById('tbl-body')
  const rows = filteredProjects()
  const subtitle = document.getElementById('tbl-subtitle')
  if (subtitle) {
    const n = rows.length
    subtitle.textContent = `${n} proyecto${n === 1 ? '' : 's'} activo${n === 1 ? '' : 's'} · ${state.projects.length} en total`
  }
  if (!rows.length) {
    tbody.innerHTML = `
      <tr><td colspan="9" class="px-5 py-14 text-center">
        <div class="flex flex-col items-center gap-3 text-zinc-600">
          ${ic.search('w-8 h-8')}
          <p class="text-sm text-zinc-500">No hay proyectos que coincidan con el filtro.</p>
        </div>
      </td></tr>`
    return
  }
  tbody.innerHTML = rows.map(rowHtml).join('')
}

/** Vincula (una sola vez por render) búsqueda y filtro de estado. */
function bindTableFilters() {
  const search = document.getElementById('tbl-search')
  const status = document.getElementById('tbl-status')
  if (search) search.oninput = () => renderTableBody()
  if (status) status.onchange = () => renderTableBody()
}
