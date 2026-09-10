/* ═════════════════════════════════════════════════════════════════════════════
   state.js — Estado global en memoria de la SPA (fuente de verdad de la vista).
   Los datos se recargan desde el repositorio en cada mutación (evento
   'itbi:changed' → refreshAll en main.js).
═════════════════════════════════════════════════════════════════════════════ */

export const state = {
  view: 'dashboard',          // 'dashboard' | 'planner'
  users: [],
  projects: [],
  updates: [],
  objectives: [],
  currentUser: null,
  selectedProjectId: null,    // proyecto elegido en "Mi Planner"
}

/** Proyectos cuyo dueño es el usuario actual (para Mi Planner del jefe). */
export const myProjects = () =>
  state.currentUser ? state.projects.filter((p) => p.userId === state.currentUser.id) : []

/**
 * Persona asignada/responsable del proyecto (la persona a la que el jefe le
 * hace seguimiento). Si el proyecto no tiene assigneeId (datos antiguos),
 * cae al dueño del proyecto.
 */
export const assigneeOf = (project) =>
  project ? userById(project.assigneeId) ?? userById(project.userId) ?? null : null

/** Avances de un proyecto ordenados cronológicamente (timeline izq → der). */
export function updatesOf(projectId) {
  return state.updates
    .filter((u) => u.projectId === projectId)
    .sort((a, b) => (a.updateDate < b.updateDate ? -1 : a.updateDate > b.updateDate ? 1 : 0))
}

export const projectById = (id) => state.projects.find((p) => p.id === id) ?? null
export const userById = (id) => state.users.find((u) => u.id === id) ?? null

/** Objetivos de un proyecto: primero los pendientes (por fecha), luego revisados. */
export function objectivesOf(projectId) {
  return state.objectives
    .filter((o) => o.projectId === projectId)
    .sort((a, b) => {
      if ((a.status === 'pendiente') !== (b.status === 'pendiente')) {
        return a.status === 'pendiente' ? -1 : 1
      }
      return (a.dueDate ?? '9999') < (b.dueDate ?? '9999') ? -1 : 1
    })
}

export const objectiveById = (id) => state.objectives.find((o) => o.id === id) ?? null
