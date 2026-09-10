/* ═════════════════════════════════════════════════════════════════════════════
   planner.js — Vista "Mi Planner" (panel personal del usuario logueado).
   Renderiza en los contenedores estáticos de index.html:
     #planner-select · #planner-empty · #planner-body (summary + timeline)

   El timeline horizontal:
     · Ordenado por fecha (izquierda → derecha), con scroll-x si desborda.
     · Cada nodo = punto coloreado según su tipo (ver lib/statuses.js).
     · Clic en un nodo → modal de Detalles de Avance (solo lectura).
═════════════════════════════════════════════════════════════════════════════ */
import { esc, fmtDate, fmtDateShort, deadlineLabel, projectHealth } from '../lib/utils.js'
import { getCategoryMeta, getHealthMeta, getUpdateType, UPDATE_TYPES, UPDATE_TYPE_KEYS } from '../lib/statuses.js'
import { state, myProjects, updatesOf, objectivesOf, projectById, assigneeOf } from '../state.js'
import { avatarHtml } from './common.js'
import { timelineMarkup } from './timeline.js'
import { updateProject, createUpdate } from '../lib/data/index.js'
import { toast } from './toast.js'
import { ic } from './icons.js'

const BRAND = '#4d6bfe'

/* ───────────────────────── Render principal ─────────────────────────────── */
export function renderPlanner() {
  const mine = myProjects()
  const select = document.getElementById('planner-select')
  const selectWrap = document.getElementById('planner-select-wrap')
  const empty = document.getElementById('planner-empty')
  const body = document.getElementById('planner-body')
  const btnUpdate = document.getElementById('btn-new-update')

  // Sin proyectos propios → estado vacío
  if (!mine.length) {
    state.selectedProjectId = null
    selectWrap?.classList.add('hidden')
    body.classList.add('hidden')
    empty.classList.remove('hidden')
    empty.innerHTML = emptyStateHtml()
    if (btnUpdate) { btnUpdate.disabled = true; btnUpdate.title = 'Primero crea un proyecto' }
    return
  }

  // Si la selección quedó huérfana (o nula), elegir el primero por prioridad
  if (!mine.some((p) => p.id === state.selectedProjectId)) {
    state.selectedProjectId = [...mine].sort((a, b) =>
      (a.deadlineDate ?? '9999') < (b.deadlineDate ?? '9999') ? -1 : 1)[0].id
  }

  // Dropdown de proyectos personales
  selectWrap?.classList.remove('hidden')
  empty.classList.add('hidden')
  body.classList.remove('hidden')
  if (btnUpdate) { btnUpdate.disabled = false; btnUpdate.title = 'Registrar un nuevo avance' }

  select.innerHTML = mine
    .map((p) => {
      const late = projectHealth(p) === 'delayed'
      const tracked = assigneeOf(p)
      return `<option value="${esc(p.id)}" ${p.id === state.selectedProjectId ? 'selected' : ''}>
        ${esc(p.name)} — ${esc(tracked?.fullName ?? 'Sin responsable')}${late ? ' · retrasado' : ''}</option>`
    })
    .join('')

  // ── Cambio de proyecto en el dropdown → actualizar resumen + timeline.
  // Usamos .onchange (propiedad) y NO addEventListener porque este <select>
  // es un elemento estático que persiste entre renders: la asignación
  // reemplaza el handler anterior en vez de acumular listeners.
  select.onchange = () => {
    const next = select.value
    if (next && next !== state.selectedProjectId) {
      state.selectedProjectId = next
      renderPlannerBody() // re-render local: resumen, anillo de progreso y timeline
    }
  }

  renderPlannerBody()
}

/* ───────────────────────────── Estado vacío ─────────────────────────────── */
function emptyStateHtml() {
  return `
    <div class="card px-6 py-16 flex flex-col items-center text-center gap-4">
      <span class="grid h-14 w-14 place-items-center rounded-2xl bg-zinc-800/80 text-zinc-500">${ic.route('w-7 h-7')}</span>
      <div>
        <h2 class="text-base font-semibold text-zinc-200">Aún no tienes proyectos asignados</h2>
        <p class="mt-1.5 text-sm text-zinc-500 max-w-sm">
          Crea tu primer proyecto y construye su ruta de avances: reuniones, pruebas, mejoras, bugs e implementaciones.
        </p>
      </div>
      <button type="button" data-action="open-new-project" class="btn btn-primary mt-1">
        ${ic.plus('w-4 h-4')} Crear mi primer proyecto
      </button>
    </div>`
}

/* ───────────────────── Cuerpo: resumen + timeline ───────────────────────── */
function renderPlannerBody() {
  const body = document.getElementById('planner-body')
  const p = projectById(state.selectedProjectId)
  if (!p) return

  const owner = assigneeOf(p)   // persona a la que se le hace seguimiento
  const cat = getCategoryMeta(p.category)
  const health = getHealthMeta(projectHealth(p))
  const updates = updatesOf(p.id)
  const objectives = objectivesOf(p.id)
  const dl = deadlineLabel(p.deadlineDate)
  const done = Number(p.progress) >= 100

  body.innerHTML = `
    <!-- Tarjeta de resumen del proyecto -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <article class="card p-6 lg:col-span-3">
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <span class="chip ${cat.badge}">${esc(p.category)}</span>
          <span class="chip ${health.badge}">
            <span class="w-1.5 h-1.5 rounded-full bg-current"></span>${health.label}
          </span>
          ${done ? '<span class="chip bg-zinc-800/80 text-zinc-300 ring-zinc-700/60">Completado</span>' : ''}
          <button type="button" data-action="delete-project" data-id="${esc(p.id)}"
                  class="btn-ghost !p-1.5 ml-auto text-zinc-600 hover:text-rose-400 transition"
                  title="Eliminar proyecto (con confirmación)">${ic.trash('w-4 h-4')}</button>
        </div>

        <h2 class="text-xl font-bold text-zinc-50 tracking-tight">${esc(p.name)}</h2>
        <p class="mt-2 text-[15px] leading-relaxed text-zinc-400 max-w-3xl">${esc(p.description || 'Sin descripción registrada.')}</p>

        <dl class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-sm">
          <div class="flex items-center gap-2.5 text-zinc-400">
            <span class="text-zinc-600">${ic.calendar('w-4 h-4')}</span>
            <div>
              <dt class="text-[10px] uppercase tracking-wider text-zinc-600">Implementación esperada</dt>
              <dd class="mt-0.5 text-zinc-300 tabular-nums">
                ${esc(fmtDate(p.deadlineDate))}
                <span class="ml-1.5 ${dl.tone}">· ${dl.text}</span>
              </dd>
            </div>
          </div>
          <div class="flex items-center gap-2.5 text-zinc-400">
            <span class="text-zinc-600">${ic.user('w-4 h-4')}</span>
            <div>
              <dt class="text-[10px] uppercase tracking-wider text-zinc-600">Persona en seguimiento</dt>
              <dd class="mt-0.5 flex items-center gap-1.5 text-zinc-300">${avatarHtml(owner, 'sm')}
                <span>${esc(owner?.fullName ?? '—')}</span></dd>
            </div>
          </div>
          <div class="flex items-center gap-2.5 text-zinc-400">
            <span class="text-zinc-600">${ic.activity('w-4 h-4')}</span>
            <div>
              <dt class="text-[10px] uppercase tracking-wider text-zinc-600">Avances registrados</dt>
              <dd class="mt-0.5 text-zinc-300 tabular-nums">${updates.length} en total</dd>
            </div>
          </div>
          <div class="flex items-center gap-2.5 text-zinc-400">
            <span class="text-zinc-600">${ic.clock('w-4 h-4')}</span>
            <div>
              <dt class="text-[10px] uppercase tracking-wider text-zinc-600">Último avance</dt>
              <dd class="mt-0.5 text-zinc-300 tabular-nums">
                ${updates.length ? esc(fmtDateShort(updates[updates.length - 1].updateDate))
                  + ' · ' + esc(getUpdateType(updates[updates.length - 1].statusType).label) : 'Sin avances aún'}
              </dd>
            </div>
          </div>
        </dl>
      </article>

      <!-- Progreso general editable -->
      <article class="card p-6 lg:col-span-2 flex flex-col items-center justify-center gap-5">
        <div id="pl-ring" class="progress-ring" style="--p:${p.progress}" role="img" aria-label="Progreso ${p.progress}%">
          <div class="inner">
            <span id="pl-ring-val" class="text-[28px] font-bold text-zinc-50 tabular-nums leading-none">${p.progress}%</span>
            <span class="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">progreso</span>
          </div>
        </div>

        <div class="w-full space-y-2">
          <div class="flex items-center justify-between text-xs text-zinc-500">
            <span>Actualizar progreso general</span>
            <span id="pl-range-label" class="font-semibold text-zinc-300 tabular-nums">${p.progress}%</span>
          </div>
          <input id="pl-range" type="range" min="0" max="100" step="5" value="${p.progress}"
                 class="range" aria-label="Progreso del proyecto"
                 style="background:linear-gradient(90deg, ${BRAND} ${p.progress}%, #27272a ${p.progress}%)" />
        </div>
      </article>
    </div>

    <!-- Objetivos semanales (creados en la reunión · verificados en la siguiente) -->
    ${objectivesCardHtml(objectives)}

    <!-- Ruta de avances (timeline horizontal) -->
    <article class="card">
      <header class="flex flex-wrap items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-zinc-800/70">
        <div>
          <h3 class="text-sm font-semibold text-zinc-200 flex items-center gap-2">${ic.route('w-4 h-4 text-zinc-500')} Ruta de Avances</h3>
          <p class="mt-1 text-xs text-zinc-500">Haz clic en un nodo para ver sus notas y acuerdos · desplázate si hay más hitos.</p>
        </div>
        <!-- Contadores por tipo -->
        <div class="flex flex-wrap gap-1.5">
          ${UPDATE_TYPE_KEYS
            .map((k) => {
              const count = updates.filter((u) => u.statusType === k).length
              if (!count) return ''
              const t = UPDATE_TYPES[k]
              return `<span class="chip ${t.badge}"><span class="w-1.5 h-1.5 rounded-full ${t.dot}"></span>${count}</span>`
            })
            .join('')}
        </div>
      </header>

      <!-- Nota rápida: duda, consulta o información para dejar registrada -->
      <form id="pl-note-form" class="px-5 sm:px-6 pt-4" autocomplete="off">
        <div class="flex items-center gap-2 rounded-xl bg-zinc-950/70 ring-1 ring-zinc-800 px-3 py-2 transition focus-within:ring-2 focus-within:ring-brand-500/60">
          <span class="text-zinc-600 shrink-0">${ic.edit('w-4 h-4')}</span>
          <input id="pl-note-text" type="text" maxlength="300"
                 class="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none min-w-0"
                 placeholder="Nota rápida: anota una duda, consulta o información que te hayan dado…" />
          <button type="submit" class="btn btn-secondary !px-3 !py-1.5 text-xs shrink-0">Anotar</button>
        </div>
      </form>

      <!-- Leyenda de estados -->
      <div class="px-5 sm:px-6 pt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span class="text-[11px] uppercase tracking-wider text-zinc-600 mr-1">Leyenda</span>
        ${UPDATE_TYPE_KEYS.map((k) => {
          const t = UPDATE_TYPES[k]
          return `<span class="flex items-center gap-2 text-xs text-zinc-500">
                    <span class="w-2.5 h-2.5 rounded-full ${t.dot}"></span>${t.label}</span>`
        }).join('')}
      </div>

      <!-- Track del timeline -->
      <div class="px-5 sm:px-6 pt-5 pb-3">
        ${updates.length ? timelineMarkup(updates) : emptyTimelineHtml()}
      </div>
    </article>
  `

  bindProgressSlider(p)
  bindQuickNote(p)
  fitTimelineTrack(body)
}

function emptyTimelineHtml() {
  return `
    <div class="py-10 flex flex-col items-center text-center gap-3">
      <span class="grid h-12 w-12 place-items-center rounded-xl bg-zinc-800/70 text-zinc-500">${ic.route('w-6 h-6')}</span>
      <div>
        <p class="text-sm font-medium text-zinc-300">Este proyecto aún no tiene avances</p>
        <p class="mt-1 text-xs text-zinc-500 max-w-xs">Registra la primera reunión, prueba o entrega para poblar la ruta de avances.</p>
      </div>
      <button type="button" data-action="open-new-update" class="btn btn-secondary mt-1">${ic.plus('w-4 h-4')} Registrar el primer avance</button>
    </div>`
}

/* Si el track es más estrecho que el contenedor → centrarlo */
function fitTimelineTrack(scope) {
  const scroll = scope?.querySelector('.tl-scroll')
  if (!scroll) return
  const track = scroll.querySelector('.tl-track')
  if (track && track.scrollWidth <= scroll.clientWidth) scroll.classList.add('fit')
}

/* ── Slider de progreso ──────────────────────────────────────────────────── */
function bindProgressSlider(p) {
  const range = document.getElementById('pl-range')
  const ring = document.getElementById('pl-ring')
  const ringVal = document.getElementById('pl-ring-val')
  const label = document.getElementById('pl-range-label')
  if (!range) return

  const paint = (v) => {
    if (ring) ring.style.setProperty('--p', v)
    if (ringVal) ringVal.textContent = `${v}%`
    if (label) label.textContent = `${v}%`
    range.style.background = `linear-gradient(90deg, ${BRAND} ${v}%, #27272a ${v}%)`
  }

  // Preview en vivo mientras se arrastra…
  range.oninput = () => paint(range.value)
  // …y persistencia al soltar (o al navegar con teclado)
  const persist = async () => {
    const v = Number(range.value)
    if (v === Number(p.progress)) return
    try {
      await updateProject(p.id, { progress: v })
      paint(v)
      window.dispatchEvent(new CustomEvent('itbi:changed'))
    } catch (err) {
      toast(err?.message || 'No se pudo actualizar el progreso.', 'error')
      paint(p.progress)
    }
  }
  range.onchange = persist
}

/* ── Objetivos semanales: tarjeta con pendientes + revisados ────────────── */
const OBJ_STATUS_META = {
  pendiente: { label: 'Pendiente', cls: 'bg-zinc-800/80 text-zinc-300 ring-zinc-700/60', icon: 'clock' },
  cumplido: { label: 'Cumplido', cls: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30', icon: 'checkCircle' },
  no_cumplido: { label: 'No cumplido', cls: 'bg-rose-500/10 text-rose-400 ring-rose-500/30', icon: 'alertTriangle' },
}

function objectivesCardHtml(objectives) {
  const pend = objectives.filter((o) => o.status === 'pendiente')
  const cum = objectives.filter((o) => o.status === 'cumplido')
  const noCum = objectives.filter((o) => o.status === 'no_cumplido')

  // Próxima revisión: la más cercana entre los pendientes
  const nextDue = pend.map((o) => o.dueDate).sort()[0]

  const rows = objectives.length
    ? objectives.map(objectiveRowHtml).join('')
    : `
      <div class="py-8 flex flex-col items-center text-center gap-3">
        <span class="grid h-12 w-12 place-items-center rounded-xl bg-zinc-800/70 text-zinc-500">${ic.flag('w-6 h-6')}</span>
        <p class="text-sm font-medium text-zinc-300">Aún no hay objetivos para este proyecto</p>
        <p class="text-xs text-zinc-500 max-w-sm">En la reunión crea los objetivos de la semana con su fecha de revisión (próxima reunión).</p>
        <button type="button" data-action="open-new-objective" class="btn btn-secondary mt-1">${ic.plus('w-4 h-4')} Nuevo objetivo</button>
      </div>`

  return `
    <article class="card">
      <header class="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-zinc-800/70">
        <div class="flex items-center gap-2.5">
          <span class="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/10 text-brand-400">${ic.flag('w-4 h-4')}</span>
          <div>
            <h3 class="text-sm font-semibold text-zinc-200">Objetivos Semanales</h3>
            <p class="mt-0.5 text-xs text-zinc-500">
              Se crean en la reunión · se verifican en la próxima
              ${nextDue ? ` · próxima revisión: <span class="text-amber-400 font-medium">${esc(fmtDateShort(nextDue))}</span>` : ''}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex gap-1.5">
            ${pend.length ? `<span class="chip ${OBJ_STATUS_META.pendiente.cls}">${pend.length} pendiente${pend.length === 1 ? '' : 's'}</span>` : ''}
            ${cum.length ? `<span class="chip ${OBJ_STATUS_META.cumplido.cls}">${cum.length} cumplido${cum.length === 1 ? '' : 's'}</span>` : ''}
            ${noCum.length ? `<span class="chip ${OBJ_STATUS_META.no_cumplido.cls}">${noCum.length} no cumplido${noCum.length === 1 ? '' : 's'}</span>` : ''}
            ${(cum.length + noCum.length) ? `<span class="chip bg-brand-500/10 text-brand-300 ring-brand-500/25">${cum.length} de ${cum.length + noCum.length} revisados cumplidos</span>` : ''}
          </div>
          <button type="button" data-action="open-new-objective" class="btn btn-primary !px-3 !py-1.5 text-xs">
            ${ic.plus('w-3.5 h-3.5')} Nuevo objetivo
          </button>
        </div>
      </header>
      <div class="px-5 sm:px-6 py-4 space-y-2.5">${rows}</div>
    </article>`
}

function objectiveRowHtml(o) {
  const meta = OBJ_STATUS_META[o.status] ?? OBJ_STATUS_META.pendiente
  const overdue = o.status === 'pendiente' && o.dueDate && o.dueDate < todayISOStr()
  return `
    <div class="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-zinc-950/50 ring-1 ring-zinc-800/80 px-4 py-3 transition hover:ring-zinc-700">
      <div class="flex items-start gap-3 min-w-0 flex-1">
        <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-800/80 text-zinc-400">${ic[meta.icon]('w-4 h-4')}</span>
        <div class="min-w-0">
          <p class="text-sm font-medium text-zinc-200 leading-snug">${esc(o.title)}</p>
          ${o.detail ? `<p class="mt-1 text-xs text-zinc-500 leading-relaxed line-clamp-2">${esc(o.detail)}</p>` : ''}
          ${o.result && o.status !== 'pendiente'
            ? `<p class="mt-1.5 text-xs text-zinc-400 bg-zinc-900 rounded-lg px-2.5 py-1.5 inline-block whitespace-pre-wrap">${ic.edit('w-3 h-3 inline text-zinc-500 mr-1')}${esc(o.result)}</p>`
            : ''}
        </div>
      </div>
      <div class="flex flex-col items-end gap-2 shrink-0">
        <span class="chip ${meta.cls}">
          <span class="w-1.5 h-1.5 rounded-full bg-current"></span>${meta.label}
          ${overdue ? ' · venció' : ''}
        </span>
        <span class="text-[11px] text-zinc-500">Revisión: <span class="tabular-nums">${esc(fmtDateShort(o.dueDate))}</span></span>
        <button type="button" data-action="review-objective" data-id="${esc(o.id)}"
                class="btn-ghost !px-2.5 !py-1 text-xs ring-1 ring-zinc-700/60">${ic.chevronRight('w-3.5 h-3.5')} Revisar en la reunión</button>
      </div>
    </div>`
}

function todayISOStr() {
  return new Date().toISOString().slice(0, 10)
}

/* ── Nota rápida: guarda un update tipo "nota" en el timeline ────────────── */
function bindQuickNote(p) {
  const form = document.getElementById('pl-note-form')
  if (!form) return
  const input = document.getElementById('pl-note-text')
  form.onsubmit = async (e) => {
    e.preventDefault()
    const text = input?.value?.trim()
    if (!text) return
    try {
      await createUpdate({
        projectId: p.id,
        statusType: 'nota',
        updateDate: todayISOStr(),
        notes: text,
      })
      toast('Nota registrada en la línea de tiempo ✓')
    } catch (err) {
      toast(err?.message || 'No se pudo guardar la nota.', 'error')
      return
    }
    input.value = ''
    window.dispatchEvent(new CustomEvent('itbi:changed'))
  }
}
