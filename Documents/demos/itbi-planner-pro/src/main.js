/* ═════════════════════════════════════════════════════════════════════════════
   main.js — Bootstrap y controlador de la SPA (entry point de Vite).

   Flujo de arranque:
     1. Importa estilos (Tailwind v4 compilado).
     2. initDataSource() → decide modo LIVE (Supabase + sesión) o DEMO (local).
     3. Carga usuarios / proyectos / avances en paralelo → estado global.
     4. Pinta el header (avatar), el indicador de fuente de datos y la vista
        según location.hash (#dashboard | #planner).
     5. Escucha eventos globales:
          · clic en [data-action]  → delegación única (modales y acciones)
          · 'itbi:changed'         → refresca datos y re-renderiza la vista
═════════════════════════════════════════════════════════════════════════════ */
import './style.css'

import { state } from './state.js'
import {
  initDataSource, useDemoFallback, currentMode,
  getCurrentUser, listUsers, listProjects, listUpdates, listObjectives,
} from './lib/data/index.js'
import { renderDashboard } from './ui/dashboard.js'
import { renderPlanner } from './ui/planner.js'
import {
  openCreateProjectModal, openCreateUpdateModal, openUpdateDetailModal,
  openCreateObjectiveModal, openReviewObjectiveModal, openProjectTimelineModal,
  openUsersModal, confirmDeleteProject,
} from './ui/modals.js'
import { openReportModal } from './ui/report.js'
import { toast } from './ui/toast.js'
import { ic } from './ui/icons.js'

/* ────────────────────────── Vista activa ────────────────────────────────── */
function currentView() {
  const h = location.hash.replace('#', '')
  return h === 'planner' ? 'planner' : 'dashboard'
}

function applyView(view, { force = false } = {}) {
  if (view === state.view && !force) return
  state.view = view
  location.hash = view

  // Toggle de paneles
  document.getElementById('view-dashboard').classList.toggle('hidden', view !== 'dashboard')
  document.getElementById('view-planner').classList.toggle('hidden', view !== 'planner')

  // Estado visual del switch del header
  document.querySelectorAll('[data-view-btn]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.viewBtn === view))
  })

  // Render perezoso de la vista activa
  if (view === 'dashboard') renderDashboard()
  else renderPlanner()
}

/* ─────────────────── Indicador de fuente de datos ──────────────────────── */
function renderSourceLabel() {
  const el = document.getElementById('data-source-label')
  const live = currentMode() === 'live'
  el.innerHTML = live
    ? `<span class="inline-flex items-center gap-1.5 text-brand-400">${ic.zap('w-3 h-3')} Supabase · PostgreSQL</span>`
    : `<span class="inline-flex items-center gap-1.5 text-zinc-500">${ic.folder('w-3 h-3')} Demo local (localStorage)</span>`
}

/* ─────────────────── Refresco de datos + vista ──────────────────────────── */
async function refreshAll() {
  try {
    const [users, projects, updates, objectives] = await Promise.all([
      listUsers(), listProjects(), listUpdates(), listObjectives(),
    ])
    state.users = users
    state.projects = projects
    state.updates = updates
    state.objectives = objectives

    // ── Nodo "Inicio de Proyecto" SIEMPRE presente ──
    // Garantiza que todo proyecto tenga su punto de inicio como primer nodo
    // de la línea de tiempo, AUNQUE ya tenga otros avances. Cubre:
    //   · proyectos creados antes de esta regla (sin nodo persistido)
    //   · proyectos creados fuera de la app (Supabase legacy)
    // Cuando el alta ya persiste su inicio (repoLocal/repoSupabase) la
    // condición es falsa y no se duplica nada.
    const todayISOStr = new Date().toISOString().slice(0, 10)
    for (const p of state.projects) {
      const hasStartNode = state.updates.some(
        (u) => u.projectId === p.id && u.statusType === 'inicio_proyecto',
      )
      if (!hasStartNode) {
        // Fecha del inicio: la creación del proyecto; si no existe (legacy),
        // se usa el avance más antiguo (o hoy) para que quede primero.
        const earliest = state.updates
          .filter((u) => u.projectId === p.id)
          .map((u) => u.updateDate)
          .sort()[0]
        state.updates.push({
          id: `start:${p.id}`,
          projectId: p.id,
          statusType: 'inicio_proyecto',
          updateDate: p.createdAt ?? earliest ?? todayISOStr,
          notes: 'Inicio del proyecto.\n- Definición inicial del alcance y los objetivos.\n- Pendiente: reunión de kickoff con el equipo.',
        })
      }
    }

    renderSourceLabel()
    applyView(state.view, { force: true }) // re-render de la vista actual
  } catch (err) {
    console.error('[refreshAll]', err)
    toast(err?.message || 'No se pudieron cargar los datos.', 'error')
  }
}

/* ─────────────────────────────── Boot ───────────────────────────────────── */
async function boot() {
  try {
    await initDataSource()
  } catch (err) {
    console.error('[init]', err)
    toast('Supabase no disponible; usando datos de demostración.', 'info')
    useDemoFallback()
  }

  try {
    const currentUser = await getCurrentUser()
    if (currentUser) state.currentUser = currentUser
  } catch (err) {
    console.error('[getCurrentUser]', err)
  }

  // Respeta el deep link (#dashboard | #planner) al cargar
  state.view = currentView()
  await refreshAll()
}

/* ────────────────────────────── Eventos ─────────────────────────────────── */
function bindViewSwitch() {
  document.querySelectorAll('[data-view-btn]').forEach((btn) => {
    btn.addEventListener('click', () => applyView(btn.dataset.viewBtn))
  })
}

/* Delegación única de acciones sobre elementos dinámicos ([data-action]) */
function bindDelegatedActions() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]')
    if (!el) return
    const action = el.dataset.action

    switch (action) {
      case 'view-dashboard':
        applyView('dashboard')
        break
      case 'open-new-project':
        openCreateProjectModal()
        break
      case 'open-new-update': {
        const pid = state.selectedProjectId
        if (!pid) toast('Primero selecciona o crea un proyecto en Mi Planner.', 'info')
        else openCreateUpdateModal({ projectId: pid })
        break
      }
      case 'open-update':            // fila del dashboard
        openCreateUpdateModal({ projectId: el.dataset.id })
        break
      case 'open-avance-detail': {   // nodo del timeline
        const u = state.updates.find((x) => x.id === el.dataset.updateId)
        if (u) openUpdateDetailModal(u)
        break
      }
      case 'open-new-objective': {   // objetivo semanal para el proyecto activo
        const pid = state.selectedProjectId
        if (!pid) toast('Primero selecciona un proyecto en Mi Planner.', 'info')
        else openCreateObjectiveModal({ projectId: pid })
        break
      }
      case 'open-objective-project': { // crear objetivo desde una fila del dashboard
        openCreateObjectiveModal({ projectId: el.dataset.id })
        break
      }
      case 'open-timeline': {          // línea de tiempo de avances (dashboard)
        openProjectTimelineModal({ projectId: el.dataset.id })
        break
      }
      case 'open-users':               // engranaje del header: usuarios del equipo
        openUsersModal()
        break
      case 'delete-project':           // eliminar proyecto (con confirmación)
        confirmDeleteProject(el.dataset.id)
        break
      case 'open-report':              // informe de avance gerencial
        openReportModal()
        break
      case 'review-objective': {     // verificar objetivo en la siguiente reunión
        const o = state.objectives.find((x) => x.id === el.dataset.id)
        if (o) openReviewObjectiveModal(o)
        break
      }
    }
  })

  // Accesibilidad: Enter/Espacio en elementos role="button"
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-action][role="button"]')) {
      e.preventDefault()
      e.target.click()
    }
  })
}

/* Refresco tras cualquier mutación guardada por un modal / slider */
function bindDataChanged() {
  document.addEventListener('itbi:changed', refreshAll)
}

/* ────────────────────────────── Init ────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  bindViewSwitch()
  bindDelegatedActions()
  bindDataChanged()
  // Reacciona al hash (p.ej. recarga directa sobre #planner)
  window.addEventListener('hashchange', () => applyView(currentView()))
  boot()
})
