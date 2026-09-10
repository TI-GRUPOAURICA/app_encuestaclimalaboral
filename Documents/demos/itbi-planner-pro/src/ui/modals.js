/* ═════════════════════════════════════════════════════════════════════════════
   modals.js — Sistema de ventanas modales de la SPA:
     1. Nuevo Proyecto   (formulario de alta + persona en seguimiento)
     2. Nuevo Avance     (formulario para registrar un update en el timeline)
     3. Detalles de Avance (solo lectura, se abre desde un nodo del timeline)
     4. Nuevo Objetivo   (objetivo semanal creado en la reunión)
     5. Revisar Objetivo (verificación en la siguiente reunión)

   Mecánica:
   · openModal() monta overlay + tarjeta en #modal-root y gestiona cierre
     (botón ✕, clic fuera y tecla Escape). Solo un modal a la vez.
   · Tras guardar correctamente se despacha el evento global 'itbi:changed';
     main.js lo escucha y refresca datos + vista (patrón de acoplamiento débil).
═════════════════════════════════════════════════════════════════════════════ */
import { esc, fmtDate, todayISO, addDaysISO } from '../lib/utils.js'
import { CATEGORIES, getUpdateType, getHealthMeta, UPDATE_TYPES, UPDATE_TYPE_KEYS, MANUAL_UPDATE_KEYS } from '../lib/statuses.js'
import { state, projectById, updatesOf, assigneeOf } from '../state.js'
import { timelineMarkup, centerTimeline } from './timeline.js'
import { avatarHtml } from './common.js'
import { createProject, createUpdate, createObjective, updateObjective, createUser, deleteUser, deleteProject } from '../lib/data/index.js'
import { toast } from './toast.js'
import { ic } from './icons.js'

/* Roles disponibles para los miembros del equipo. */
const USER_ROLES = ['Coordinador de Proyectos', 'Desarrollador', 'Analista BI', 'Infraestructura', 'Analista de Datos']

/* ── Helpers de objetivos en bloque ──────────────────────────────────────────
   parseObjectiveLines: convierte un textarea en lista de objetivos (una por
   línea, tolera viñetas "-", "•", "*" y numeración "1.").
   copyToClipboard: copia con fallback para navegadores sin Clipboard API. */
const parseObjectiveLines = (value = '') =>
  String(value)
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[•\-*\u2022]+\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean)

async function copyToClipboard(text) {
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

/** Resumen profesional listo para pegar en el chat del equipo. */
function buildObjectivesMessage(project, lines, dueDate) {
  const persona = assigneeOf(project)?.fullName ?? 'equipo'
  const bullets = lines.map((l, i) => `${i + 1}. ${l}`).join('\n')
  return [
    `Hola ${persona} 👋`,
    `Estos son los objetivos de la semana para ${project.name}:`,
    '',
    bullets,
    '',
    `📅 Los revisamos el ${fmtDate(dueDate)}. Tenlo listo para esa fecha.`,
  ].join('\n')
}

/* ───────────────────────── Shell del modal (pila) ─────────────────────────
   Los modales se apilan: al abrir uno sobre otro, el anterior queda "vivo"
   pero inactivo (atrás). Se cierra siempre el de ARRIBA, revelando el
   anterior. Así NO hay parpadeos (el de abajo no se destruye) y al pulsar ✕
   en el superior NO se cierra todo. Esc / clic fuera / Cancelar cierran
   únicamente el modal superior. */
let modalStack = []        // overlays abiertos (el último = el de arriba)
let escBound = false

function removeOverlay(overlay) {
  const i = modalStack.indexOf(overlay)
  if (i !== -1) modalStack.splice(i, 1)
  overlay.remove()
  refreshStackStyles()
}

function closeTop() {
  const top = modalStack[modalStack.length - 1]
  if (top) removeOverlay(top)
}

function onKeydownEsc(e) {
  if (e.key === 'Escape') closeTop()
}

/** Marca como "detrás" (fondo transparente) a todos los overlays menos el superior. */
function refreshStackStyles() {
  modalStack.forEach((overlay, idx) => {
    overlay.classList.toggle('modal-behind', idx < modalStack.length - 1)
  })
}

export function openModal({ title, subtitle = '', contentHtml, footerHtml = '', wide = false }) {
  const root = document.getElementById('modal-root')
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'

  overlay.innerHTML = `
    <div role="dialog" aria-modal="true" aria-label="${esc(title)}"
         class="modal-card ${wide ? 'modal-card--wide' : ''}">
      <header class="modal-head">
        <div class="min-w-0">
          <h3 class="text-[15px] font-semibold text-zinc-100 tracking-tight truncate">${esc(title)}</h3>
          ${subtitle ? `<p class="mt-0.5 text-xs text-zinc-500">${esc(subtitle)}</p>` : ''}
        </div>
        <button type="button" data-modal-close class="btn-ghost !p-1.5 shrink-0" aria-label="Cerrar">
          ${ic.x('w-4 h-4')}
        </button>
      </header>
      <div class="modal-body">${contentHtml}</div>
      ${footerHtml ? `<footer class="modal-foot">${footerHtml}</footer>` : ''}
    </div>
  `

  modalStack.push(overlay)
  root.appendChild(overlay)
  if (!escBound) {
    document.addEventListener('keydown', onKeydownEsc)
    escBound = true
  }

  const isTop = () => modalStack[modalStack.length - 1] === overlay

  // Clic fuera de la tarjeta → cierra (solo si es el modal superior)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && isTop()) removeOverlay(overlay)
  })
  // Botón ✕ del header + botones "Cancelar" del footer
  overlay.querySelectorAll('[data-modal-close]').forEach((btn) =>
    btn.addEventListener('click', () => {
      if (isTop()) removeOverlay(overlay)
    }))

  refreshStackStyles()
  return {
    overlay,
    close: () => { if (isTop()) removeOverlay(overlay) },
  }
}

/** Cierra el modal superior (lo usan Esc y los formularios al guardar). */
export function closeModal() {
  closeTop()
}

/* Utilidades de formulario */
function bindSubmit(form, handler) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const submitBtn = form.querySelector('[type="submit"]')
    const original = submitBtn?.innerHTML
    if (submitBtn) {
      submitBtn.disabled = true
      submitBtn.innerHTML = 'Guardando…'
    }
    try {
      await handler(new FormData(form))
      closeModal()
      window.dispatchEvent(new CustomEvent('itbi:changed'))
    } catch (err) {
      toast(err?.message || 'No se pudo guardar. Inténtalo de nuevo.', 'error')
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = original }
    }
  })
}

const chipFor = (cls, label) => `<span class="chip ${cls}">${esc(label)}</span>`

/* ── Confirmación genérica (popup de advertencia antes de borrar) ────────── */
export function confirmAction({ title, message, confirmText = 'Eliminar', onConfirm }) {
  const { overlay } = openModal({
    title,
    contentHtml: `
      <div class="flex items-start gap-3">
        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-400">${ic.alertTriangle('w-5 h-5')}</span>
        <p class="text-sm text-zinc-300 leading-relaxed">${message}</p>
      </div>`,
    footerHtml: `
      <button type="button" data-modal-close class="btn-ghost">Cancelar</button>
      <button type="button" data-confirm class="btn-danger">${ic.trash('w-4 h-4')} ${esc(confirmText)}</button>`,
  })
  overlay.querySelector('[data-confirm]')?.addEventListener('click', async () => {
    closeModal()
    try {
      await onConfirm?.()
    } catch (err) {
      toast(err?.message || 'No se pudo eliminar.', 'error')
    }
  })
}

/** Confirmación + borrado de un proyecto (se usa desde Dashboard y Mi Planner). */
export function confirmDeleteProject(projectId) {
  const p = projectById(projectId)
  if (!p) return toast('Proyecto no encontrado.', 'error')
  confirmAction({
    title: 'Eliminar proyecto',
    message: `¿Seguro que deseas eliminar <b>${esc(p.name)}</b>?<br>Se borrarán también sus avances y objetivos. <span class="text-zinc-500">Esta acción no se puede deshacer.</span>`,
    confirmText: 'Eliminar proyecto',
    onConfirm: async () => {
      await deleteProject(projectId)
      if (state.selectedProjectId === projectId) state.selectedProjectId = null
      toast('Proyecto eliminado ✓')
      window.dispatchEvent(new CustomEvent('itbi:changed'))
    },
  })
}

/* ─────────────────── 1. Modal: Nuevo Proyecto ───────────────────────────── */
export function openCreateProjectModal() {
  const { overlay } = openModal({
    title: 'Nuevo Proyecto',
    subtitle: 'Crea el proyecto con sus datos y elige a la persona a la que le harás seguimiento.',
    contentHtml: `
      <form id="frm-project" class="space-y-4" novalidate>
        <div>
          <label class="label" for="p-name">Nombre del proyecto *</label>
          <input id="p-name" name="name" class="input" required minlength="3"
                 maxlength="80" placeholder="Ej. Plataforma BI Self-Service" autocomplete="off" />
        </div>

        <!-- Persona a la que el jefe le hará seguimiento -->
        <div>
          <label class="label" for="p-assignee">Persona a la que le harás seguimiento (Responsable) *</label>
          <div class="relative">
            <select id="p-assignee" name="assigneeId" class="select" required>
              ${state.users.map((u) => `
                <option value="${esc(u.id)}" ${u.id === state.currentUser?.id ? 'selected' : ''}>
                  ${esc(u.fullName)}${u.role ? ` · ${esc(u.role)}` : ''}
                </option>`).join('')}
            </select>
            <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">${ic.chevronDown('w-4 h-4')}</span>
          </div>
          <p class="form-hint">El proyecto quedará en tu planner y esta persona aparecerá como Responsable.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="label" for="p-category">Categoría *</label>
            <div class="relative">
              <select id="p-category" name="category" class="select" required>
                ${CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join('')}
              </select>
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">${ic.chevronDown('w-4 h-4')}</span>
            </div>
          </div>
          <div>
            <label class="label" for="p-deadline">Fecha de implementación *</label>
            <input id="p-deadline" name="deadlineDate" type="date" class="input" required min="${todayISO()}" />
          </div>
        </div>

        <div>
          <label class="label" for="p-desc">Descripción</label>
          <textarea id="p-desc" name="description" class="textarea" rows="3"
                    maxlength="500" placeholder="Objetivo del proyecto, alcance, equipo involucrado…"></textarea>
          <p class="form-hint">La categoría determina el color del proyecto en los gráficos del Dashboard.</p>
        </div>
      </form>
    `,
    footerHtml: `
      <button type="button" data-modal-close class="btn-ghost">Cancelar</button>
      <button type="submit" form="frm-project" class="btn btn-primary">${ic.plus('w-4 h-4')} Crear proyecto</button>
    `,
  })

  bindSubmit(overlay.querySelector('#frm-project'), async (fd) => {
    const project = await createProject({
      name: fd.get('name'),
      description: fd.get('description'),
      category: fd.get('category'),
      deadlineDate: fd.get('deadlineDate'),
      assigneeId: fd.get('assigneeId'),
    })
    // Si estamos en Mi Planner, preseleccionar el proyecto recién creado
    state.selectedProjectId = project.id
    toast('Proyecto creado correctamente ✓')
  })
}

/* ─────────────────── 2. Modal: Nuevo Avance ─────────────────────────────── */
export function openCreateUpdateModal({ projectId } = {}) {
  const { overlay } = openModal({
    title: 'Nuevo Avance',
    subtitle: 'Registra un hito en la ruta de avances del proyecto.',
    contentHtml: `
      <form id="frm-update" class="space-y-4" novalidate>
        ${projectPickerHtml(projectId)}

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="label" for="u-type">Tipo / estado de avance *</label>
            <div class="relative">
              <select id="u-type" name="statusType" class="select" required>
                ${MANUAL_UPDATE_KEYS.map((k) => {
                  const t = UPDATE_TYPES[k]
                  return `<option value="${k}">${t.label}</option>`
                }).join('')}
              </select>
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">${ic.chevronDown('w-4 h-4')}</span>
            </div>
            <!-- Vista previa del estado seleccionado -->
            <p id="u-type-preview" class="mt-2"></p>
          </div>
          <div>
            <label class="label" for="u-date">Fecha del avance *</label>
            <input id="u-date" name="updateDate" type="date" class="input" required value="${todayISO()}" />
          </div>
        </div>

        <div>
          <label class="label" for="u-notes">Notas / detalle del avance</label>
          <textarea id="u-notes" name="notes" class="textarea" rows="6" maxlength="2000"
                    placeholder="Puedes describir el avance: acuerdos de reunión, pruebas ejecutadas, fragmentos de código, decisiones técnicas…"></textarea>
          <p class="form-hint">Consejo: incluye acuerdos de reunión y próximos pasos para que el equipo tenga contexto.</p>
        </div>
      </form>
    `,
    footerHtml: `
      <button type="button" data-modal-close class="btn-ghost">Cancelar</button>
      <button type="submit" form="frm-update" class="btn btn-primary">${ic.plus('w-4 h-4')} Guardar avance</button>
    `,
  })

  // Selector de tipo → chip de vista previa con color
  const typeSel = overlay.querySelector('#u-type')
  const typePreview = overlay.querySelector('#u-type-preview')
  const renderTypePreview = () => {
    const t = getUpdateType(typeSel.value)
    typePreview.innerHTML = `${chipFor(t.badge, t.label)} <span class="text-[11px] text-zinc-500 ml-1">${esc(t.desc)}</span>`
  }
  typeSel.addEventListener('change', renderTypePreview)
  renderTypePreview()

  bindSubmit(overlay.querySelector('#frm-update'), async (fd) => {
    await createUpdate({
      projectId: fd.get('projectId'),
      statusType: fd.get('statusType'),
      updateDate: fd.get('updateDate'),
      notes: fd.get('notes'),
    })
    toast('Avance registrado en el timeline ✓')
  })
}

/** Selector de proyecto (oculto si ya viene prefijado desde la vista). */
function projectPickerHtml(prefillId) {
  if (prefillId) {
    const p = projectById(prefillId)
    return `<input type="hidden" name="projectId" value="${esc(prefillId)}" />
            <p class="text-xs text-zinc-500 flex items-center gap-1.5">
              ${ic.folder('w-3.5 h-3.5 text-zinc-600')} Proyecto: <span class="font-medium text-zinc-300">${esc(p?.name ?? prefillId)}</span>
            </p>`
  }
  const options = state.projects
    .map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`)
    .join('')
  return `
    <div>
      <label class="label" for="u-project">Proyecto *</label>
      <div class="relative">
        <select id="u-project" name="projectId" class="select" required>
          <option value="" disabled selected>Selecciona un proyecto…</option>
          ${options}
        </select>
        <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">${ic.chevronDown('w-4 h-4')}</span>
      </div>
    </div>`
}

/* ─────────────── 3. Modal: Detalles de Avance (solo lectura) ────────────── */
export function openUpdateDetailModal(update) {
  const type = getUpdateType(update.statusType)
  const project = projectById(update.projectId)
  const health = project ? getHealthMeta(projectHealthSafe(project)) : null

  openModal({
    title: 'Detalles del Avance',
    subtitle: project ? `Proyecto: ${project.name}` : '',
    contentHtml: `
      <div class="space-y-4">
        <!-- Cabecera del avance: estado + fecha -->
        <div class="flex flex-wrap items-center gap-2">
          ${chipFor(type.badge, type.label)}
          <span class="chip bg-zinc-800/70 text-zinc-300 ring-zinc-700/60">${ic.calendar('w-3 h-3')} ${esc(fmtDate(update.updateDate))}</span>
          ${health ? chipFor(health.badge, health.label) : ''}
        </div>

        <div>
          <p class="label mb-1">Descripción del tipo</p>
          <p class="text-sm text-zinc-400 leading-relaxed">${esc(type.desc)}</p>
        </div>

        <div>
          <p class="label mb-1">Notas y acuerdos</p>
          ${update.notes
            ? `<div class="rounded-xl bg-zinc-950/60 ring-1 ring-zinc-800 px-4 py-3 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-[inherit]">${esc(update.notes)}</div>`
            : `<p class="text-sm text-zinc-500 italic">Sin notas registradas en este avance.</p>`}
        </div>
      </div>
    `,
    footerHtml: `
      <button type="button" data-modal-close class="btn-ghost">${ic.x('w-4 h-4')} Cerrar</button>
    `,
  })
}

/* ─────────────── 4. Modal: Nuevos Objetivos de la Semana (en bloque) ────── */
export function openCreateObjectiveModal({ projectId } = {}) {
  const project = projectById(projectId ?? state.selectedProjectId)
  if (!project) {
    toast('Primero selecciona un proyecto en Mi Planner.', 'info')
    return
  }
  const suggested = addDaysISO(todayISO(), 7) // próxima reunión (sugerida, editable)

  const { overlay } = openModal({
    title: 'Nuevos Objetivos de la Semana',
    subtitle: `Proyecto: ${project.name}`,
    wide: true,
    contentHtml: `
      <form id="frm-objective" class="space-y-4" novalidate>
        <div>
          <label class="label" for="o-lines">Objetivos a cumplir * <span class="text-zinc-600 font-normal normal-case tracking-normal">(uno por línea o con viñetas — se crean todos)</span></label>
          <textarea id="o-lines" name="lines" class="textarea" rows="6" autocomplete="off"
                    placeholder="Escribe un objetivo por línea o con viñetas:&#10;- Publicar el dashboard en el workspace&#10;- Cerrar la definición del KPI de churn&#10;• Corregir los tooltips en pantallas pequeñas"></textarea>
          <p class="form-hint">Cada línea se convierte en un objetivo independiente para revisar la próxima semana.</p>
        </div>

        <div>
          <label class="label" for="o-detail">Detalle / alcance (aplica a todos)</label>
          <textarea id="o-detail" name="detail" class="textarea" rows="2" maxlength="600"
                    placeholder="Entregable esperado, criterio de aceptación… (opcional)"></textarea>
        </div>

        <div>
          <label class="label" for="o-due">Fecha de revisión (próxima reunión) *</label>
          <input id="o-due" name="dueDate" type="date" class="input" required value="${suggested}" />
          <p class="form-hint">En esa fecha verificarás si los objetivos se cumplieron.</p>
        </div>
      </form>
    `,
    footerHtml: `
      <button type="button" data-copy-objectives class="btn-ghost"
              title="Copiar un resumen para pegar en el chat del equipo">
        ${ic.copy('w-4 h-4')} Copiar resumen
      </button>
      <span class="flex-1"></span>
      <button type="button" data-modal-close class="btn-ghost">Cancelar</button>
      <button type="submit" form="frm-objective" class="btn btn-primary">${ic.plus('w-4 h-4')} <span id="obj-count">Crear objetivo</span></button>
    `,
  })

  // Contador en vivo del número de objetivos a crear
  const linesEl = overlay.querySelector('#o-lines')
  const countEl = overlay.querySelector('#obj-count')
  const updateCount = () => {
    const n = parseObjectiveLines(linesEl.value).length
    countEl.textContent = n > 0 ? `Crear ${n} objetivo${n === 1 ? '' : 's'}` : 'Crear objetivo'
  }
  linesEl.addEventListener('input', updateCount)
  updateCount()

  // Copiar resumen profesional para el chat
  overlay.querySelector('[data-copy-objectives]')?.addEventListener('click', async () => {
    const lines = parseObjectiveLines(linesEl.value)
    if (!lines.length) return toast('Escribe al menos un objetivo para copiar.', 'info')
    const due = overlay.querySelector('#o-due')?.value || todayISO()
    const ok = await copyToClipboard(buildObjectivesMessage(project, lines, due))
    toast(ok ? 'Resumen copiado ✓ — pégalo en el chat' : 'No se pudo copiar.', ok ? 'success' : 'error')
  })

  bindSubmit(overlay.querySelector('#frm-objective'), async (fd) => {
    const lines = parseObjectiveLines(fd.get('lines'))
    if (!lines.length) throw new Error('Escribe al menos un objetivo.')
    const detail = (fd.get('detail') ?? '').trim()
    const dueDate = fd.get('dueDate')
    for (const title of lines) {
      await createObjective({ projectId: project.id, title, detail, dueDate })
    }
    toast(`${lines.length} objetivo${lines.length === 1 ? '' : 's'} creado${lines.length === 1 ? '' : 's'} ✓`)
  })
}

/* ─────────────── 5. Modal: Revisar Objetivo (siguiente reunión) ─────────── */
export function openReviewObjectiveModal(objective) {
  const project = projectById(objective.projectId)
  const { overlay } = openModal({
    title: 'Revisar Objetivo',
    subtitle: project ? `Proyecto: ${project.name} · Revisión del ${fmtDate(objective.dueDate)}` : '',
    contentHtml: `
      <form id="frm-review" class="space-y-4" novalidate>
        <div class="rounded-xl bg-zinc-950/60 ring-1 ring-zinc-800 px-4 py-3">
          <p class="text-sm font-semibold text-zinc-200">${esc(objective.title)}</p>
          ${objective.detail ? `<p class="mt-1 text-sm text-zinc-400 whitespace-pre-wrap">${esc(objective.detail)}</p>` : ''}
        </div>

        <div>
          <p class="label mb-2">¿Se cumplió? *</p>
          <div class="grid grid-cols-3 gap-2">
            ${[
              { v: 'pendiente', label: 'Pendiente', cls: 'bg-zinc-800/80 text-zinc-200 ring-zinc-700/70' },
              { v: 'cumplido', label: 'Cumplido ✓', cls: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30' },
              { v: 'no_cumplido', label: 'No cumplido ✗', cls: 'bg-rose-500/10 text-rose-400 ring-rose-500/30' },
            ].map((o) => `
              <label class="cursor-pointer">
                <input type="radio" name="status" value="${o.v}" class="sr-only peer"
                       ${objective.status === o.v ? 'checked' : ''} />
                <span class="block rounded-lg px-2 py-2 text-xs font-medium text-center ring-1 ring-inset transition
                             ${o.cls} peer-checked:ring-2 peer-checked:ring-brand-500">${o.label}</span>
              </label>`).join('')}
          </div>
        </div>

        <div>
          <label class="label" for="r-result">Resultado / nota de la revisión</label>
          <textarea id="r-result" name="result" class="textarea" rows="4" maxlength="800"
                    placeholder="¿Qué pasó? Anota el resultado, avance real o motivo del incumplimiento…">${esc(objective.result ?? '')}</textarea>
        </div>
      </form>
    `,
    footerHtml: `
      <button type="button" data-modal-close class="btn-ghost">Cancelar</button>
      <button type="submit" form="frm-review" class="btn btn-primary">Guardar revisión</button>
    `,
  })

  bindSubmit(overlay.querySelector('#frm-review'), async (fd) => {
    await updateObjective(objective.id, {
      status: fd.get('status'),
      result: fd.get('result'),
    })
    toast('Objetivo actualizado ✓')
  })
}

/* ─────────────────── 6. Modal: Línea de Tiempo del proyecto ─────────────── */
export function openProjectTimelineModal({ projectId } = {}) {
  const project = projectById(projectId)
  if (!project) {
    toast('Proyecto no encontrado.', 'error')
    return
  }
  const list = updatesOf(project.id)

  const { overlay } = openModal({
    title: 'Línea de Tiempo de Avances',
    subtitle: `${project.name}`,
    wide: true,
    contentHtml: `
      <div class="space-y-4">
        <!-- Leyenda compacta -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span class="text-[11px] uppercase tracking-wider text-zinc-600 mr-1">Estados</span>
          ${UPDATE_TYPE_KEYS.map((k) => {
            const t = UPDATE_TYPES[k]
            return `<span class="flex items-center gap-1.5 text-xs text-zinc-500">
                      <span class="w-2 h-2 rounded-full ${t.dot}"></span>${t.label}</span>`
          }).join('')}
        </div>

        ${list.length
          ? `<div class="rounded-2xl bg-zinc-950/50 ring-1 ring-zinc-800/80 px-4 py-3">
               ${timelineMarkup(list)}
             </div>
             <p class="text-xs text-zinc-500">Haz clic en un nodo para ver sus notas, acuerdos y detalles.</p>`
          : `<div class="py-8 flex flex-col items-center text-center gap-3">
               <span class="grid h-11 w-11 place-items-center rounded-xl bg-zinc-800/70 text-zinc-500">${ic.route('w-5 h-5')}</span>
               <p class="text-sm font-medium text-zinc-300">Este proyecto aún no tiene avances</p>
               <button type="button" data-action="open-update" data-id="${esc(project.id)}" class="btn btn-secondary mt-1">
                 ${ic.plus('w-4 h-4')} Registrar el primer avance
               </button>
             </div>`}
      </div>
    `,
    footerHtml: `
      <button type="button" data-modal-close class="btn-ghost">${ic.x('w-4 h-4')} Cerrar</button>
    `,
  })

  // Centra el track si no desborda (tras estar montado en el DOM)
  centerTimeline(overlay)
}

/* ─────────────── 7. Modal: Usuarios del Equipo (engranaje) ─────────────── */
export function openUsersModal() {
  const { overlay } = openModal({
    title: 'Usuarios del Equipo',
    subtitle: 'Miembros de TI/BI · gestiona el directorio y agrega nuevas personas.',
    wide: true,
    contentHtml: `
      <div class="flex flex-col gap-5">
        <!-- Alta de nuevo usuario -->
        <form id="frm-user" class="rounded-xl bg-zinc-950/50 ring-1 ring-zinc-800 p-4 space-y-3" novalidate>
          <div class="flex items-center gap-2">
            <span class="grid h-7 w-7 place-items-center rounded-lg bg-brand-500/10 text-brand-400">${ic.user('w-4 h-4')}</span>
            <p class="text-sm font-semibold text-zinc-200">Agregar miembro al equipo</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label" for="u-name">Nombre completo *</label>
              <input id="u-name" name="fullName" class="input" required minlength="3" maxlength="80"
                     placeholder="Ej. José Pérez" autocomplete="off" />
            </div>
            <div>
              <label class="label" for="u-email">Correo *</label>
              <input id="u-email" name="email" type="email" class="input" required maxlength="120"
                     placeholder="jose.perez@itbi.dev" autocomplete="off" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label class="label" for="u-role">Rol *</label>
              <div class="relative">
                <select id="u-role" name="role" class="select" required>
                  ${USER_ROLES.map((r) => `<option value="${r}">${r}</option>`).join('')}
                </select>
                <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">${ic.chevronDown('w-4 h-4')}</span>
              </div>
            </div>
            <button type="submit" class="btn btn-primary">${ic.plus('w-4 h-4')} Crear usuario</button>
          </div>
        </form>

        <!-- Lista de miembros -->
        <div>
          <p class="label mb-2">Miembros <span id="users-count" class="text-zinc-600"></span></p>
          <div id="users-list" class="flex flex-col divide-y divide-zinc-800/60 rounded-xl ring-1 ring-zinc-800/70 bg-zinc-950/40 max-h-72 overflow-y-auto"><!-- JS --></div>
        </div>
      </div>
    `,
    footerHtml: `
      <button type="button" data-modal-close class="btn-ghost">${ic.x('w-4 h-4')} Cerrar</button>
    `,
  })

  const listEl = overlay.querySelector('#users-list')
  const countEl = overlay.querySelector('#users-count')

  const renderList = () => {
    const ordered = [...state.users].sort((a, b) => {
      if (a.id === state.currentUser?.id) return -1
      if (b.id === state.currentUser?.id) return 1
      return (a.fullName ?? '').localeCompare(b.fullName ?? '')
    })
    countEl.textContent = `· ${ordered.length}`
    if (!ordered.length) {
      listEl.innerHTML = `<p class="px-4 py-8 text-center text-sm text-zinc-500">Aún no hay miembros.</p>`
      return
    }
    listEl.innerHTML = ordered.map((u) => {
      const isMe = u.id === state.currentUser?.id
      return `
        <div class="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/30 transition">
          ${avatarHtml(u, 'md')}
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-zinc-200 truncate">
              ${esc(u.fullName)}
              ${isMe ? '<span class="ml-1 text-[10px] uppercase tracking-wider text-brand-400">(tú)</span>' : ''}
            </p>
            <p class="text-xs text-zinc-500 truncate">${esc(u.email)}</p>
          </div>
          <span class="chip bg-zinc-800/70 text-zinc-300 ring-zinc-700/60 shrink-0">${esc(u.role ?? 'Miembro')}</span>
          ${isMe ? ''
            : `<button type="button" data-user-del="${esc(u.id)}"
                      class="btn-ghost !p-1.5 text-zinc-600 hover:text-rose-400 transition shrink-0"
                      title="Eliminar usuario">${ic.trash('w-3.5 h-3.5')}</button>`}
        </div>`
    }).join('')
  }
  renderList()

  // Delegación: eliminar usuario con confirmación (botón sutil en cada fila)
  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-user-del]')
    if (!btn) return
    const uid = btn.dataset.userDel
    const u = state.users.find((x) => x.id === uid)
    if (!u) return
    if (state.currentUser?.id === uid) return toast('No puedes eliminar tu propio usuario.', 'info')
    confirmAction({
      title: 'Eliminar usuario',
      message: `¿Seguro que deseas eliminar a <b>${esc(u.fullName)}</b>?<br>Sus proyectos quedarán sin responsable asignado.`,
      confirmText: 'Eliminar usuario',
      onConfirm: async () => {
        await deleteUser(uid)
        state.users = state.users.filter((x) => x.id !== uid)
        renderList()
        window.dispatchEvent(new CustomEvent('itbi:changed'))
        toast('Usuario eliminado ✓')
      },
    })
  })

  // Alta sin cerrar el modal: permite agregar varios usuarios seguidos
  const form = overlay.querySelector('#frm-user')
  const nameInput = overlay.querySelector('#u-name')
  const emailInput = overlay.querySelector('#u-email')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = form.querySelector('[type="submit"]')
    const original = btn.innerHTML
    btn.disabled = true
    btn.innerHTML = 'Creando…'
    try {
      const fd = new FormData(form)
      const row = await createUser({
        fullName: fd.get('fullName'),
        email: fd.get('email'),
        role: fd.get('role'),
      })
      if (!state.users.some((u) => u.id === row.id)) state.users.push(row)
      nameInput.value = ''
      emailInput.value = ''
      renderList()
      window.dispatchEvent(new CustomEvent('itbi:changed')) // refresca selects/asignaciones
      toast('Usuario creado ✓')
    } catch (err) {
      toast(err?.message || 'No se pudo crear el usuario.', 'error')
    } finally {
      btn.disabled = false
      btn.innerHTML = original
    }
  })
}

/* Evita import circular con utils si hiciera falta */
function projectHealthSafe(project) {
  const today = new Date().toISOString().slice(0, 10)
  const done = Number(project.progress) >= 100
  const past = project.deadlineDate && project.deadlineDate < today
  return done || !past ? 'on_time' : 'delayed'
}
