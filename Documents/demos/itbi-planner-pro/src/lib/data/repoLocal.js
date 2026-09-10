/* ═════════════════════════════════════════════════════════════════════════════
   data/repoLocal.js — Repositorio de DEMO (sin backend).
   Implementa la MISMA interfaz que repoSupabase.js, por lo que la UI es
   agnóstica al origen de los datos. Simula latencia de red para que el
   comportamiento sea idéntico al modo live.
═════════════════════════════════════════════════════════════════════════════ */
import { loadDb, saveDb } from './localDb.js'

const latency = () => new Promise((r) => setTimeout(r, 90 + Math.random() * 120))
const clone = (v) => JSON.parse(JSON.stringify(v))

/** Quita campos internos (isCurrent) antes de devolver al dominio. */
const sanitizeUser = ({ isCurrent, ...rest }) => rest

/* Validación mínima compartida con el esquema real de Supabase */
const CATEGORIES_OK = ['Desarrollo de Nuevo Software', 'Mantenimiento y Mejoras', 'Corrección de Errores (Bugs)', 'Análisis y Modelado', 'Integración de Sistemas']
const STATUS_OK = ['inicio_proyecto', 'reunion_pendiente', 'en_desarrollo', 'pruebas_iniciales', 'mejoras_refactor', 'reparacion_bug', 'implementado_ok', 'nota']

export const localRepo = {
  mode: 'demo',

  async getCurrentUser() {
    await latency()
    const db = loadDb()
    const me = db.users.find((u) => u.isCurrent) ?? db.users[0]
    return clone(sanitizeUser(me))
  },

  async listUsers() {
    await latency()
    return clone(loadDb().users.map(sanitizeUser))
  },

  /** Alta de un miembro del equipo (demo: se añade a la lista local). */
  async createUser({ fullName, email, role = 'Desarrollador' }) {
    await latency()
    const db = loadDb()
    const row = {
      id: crypto.randomUUID(),
      email: String(email || '').trim().toLowerCase(),
      fullName: String(fullName || '').trim(),
      role: String(role || 'Desarrollador').trim(),
      avatarUrl: '',
      isCurrent: false,
    }
    if (!row.fullName || !row.email) throw new Error('El nombre y el email son obligatorios.')
    db.users.push(row)
    saveDb(db)
    return clone(sanitizeUser(row))
  },

  async listProjects() {
    await latency()
    return clone(loadDb().projects)
  },

  async listUpdates() {
    await latency()
    return clone(loadDb().updates)
  },

  /** Crea un proyecto: el dueño es el usuario actual (el jefe) y se le asigna
      una persona a la que hacer seguimiento (assigneeId = Responsable).
      Inserta además el nodo inicial "inicio_proyecto" en el timeline. */
  async createProject({ name, description = '', category = 'Desarrollo de Nuevo Software', deadlineDate, assigneeId }) {
    await latency()
    const db = loadDb()
    const owner = db.users.find((u) => u.isCurrent) ?? db.users[0]
    const createdAt = new Date().toISOString().slice(0, 10)
    const assignee = db.users.find((u) => u.id === assigneeId)
    const row = {
      id: crypto.randomUUID(),
      userId: owner.id,
      assigneeId: assignee ? assignee.id : owner.id,
      name: String(name).trim(),
      description: String(description).trim(),
      category: CATEGORIES_OK.includes(category) ? category : 'Desarrollo de Nuevo Software',
      deadlineDate: deadlineDate || null,
      progress: 0,
      status: 'active',
      createdAt,
    }
    db.projects.push(row)
    // Primer punto del timeline: "Inicio de Proyecto"
    db.updates.push({
      id: crypto.randomUUID(),
      projectId: row.id,
      statusType: 'inicio_proyecto',
      updateDate: createdAt,
      notes: 'Inicio del proyecto.\n- Definición inicial del alcance y los objetivos.\n- Pendiente: reunión de kickoff con el equipo.',
    })
    saveDb(db)
    return clone(row)
  },

  /** Actualización parcial de un proyecto (p.ej. el slider de progreso). */
  async updateProject(id, patch) {
    await latency()
    const db = loadDb()
    const p = db.projects.find((x) => x.id === id)
    if (!p) throw new Error(`Proyecto no encontrado: ${id}`)
    if (patch.progress !== undefined) p.progress = Math.min(100, Math.max(0, Number(patch.progress)))
    if (patch.status !== undefined) p.status = patch.status
    if (patch.name !== undefined) p.name = String(patch.name).trim()
    if (patch.description !== undefined) p.description = String(patch.description).trim()
    if (patch.category !== undefined && CATEGORIES_OK.includes(patch.category)) p.category = patch.category
    if (patch.deadlineDate !== undefined) p.deadlineDate = patch.deadlineDate
    if (patch.assigneeId !== undefined) {
      const assignee = db.users.find((u) => u.id === patch.assigneeId)
      if (assignee) p.assigneeId = assignee.id
    }
    saveDb(db)
    return clone(p)
  },

  /** Inserta un avance (update) en el timeline de un proyecto. */
  async createUpdate({ projectId, statusType, updateDate, notes = '' }) {
    await latency()
    const db = loadDb()
    if (!db.projects.some((p) => p.id === projectId)) throw new Error(`Proyecto no encontrado: ${projectId}`)
    const row = {
      id: crypto.randomUUID(),
      projectId,
      statusType: STATUS_OK.includes(statusType) ? statusType : 'reunion_pendiente',
      updateDate: updateDate || new Date().toISOString().slice(0, 10),
      notes: String(notes).trim(),
    }
    db.updates.push(row)
    saveDb(db)
    return clone(row)
  },

  /* ── Objetivos semanales (se crean en la reunión, se verifican en la siguiente) ── */
  async listObjectives() {
    await latency()
    return clone(loadDb().objectives ?? [])
  },

  async createObjective({ projectId, title, detail = '', dueDate, status = 'pendiente', result = '' }) {
    await latency()
    const db = loadDb()
    if (!db.projects.some((p) => p.id === projectId)) throw new Error(`Proyecto no encontrado: ${projectId}`)
    const row = {
      id: crypto.randomUUID(),
      projectId,
      title: String(title).trim(),
      detail: String(detail).trim(),
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      status: ['pendiente', 'cumplido', 'no_cumplido'].includes(status) ? status : 'pendiente',
      result: String(result).trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    }
    db.objectives = db.objectives ?? []
    db.objectives.push(row)
    saveDb(db)
    return clone(row)
  },

  async updateObjective(id, patch) {
    await latency()
    const db = loadDb()
    const o = (db.objectives ?? []).find((x) => x.id === id)
    if (!o) throw new Error(`Objetivo no encontrado: ${id}`)
    if (patch.title !== undefined) o.title = String(patch.title).trim()
    if (patch.detail !== undefined) o.detail = String(patch.detail).trim()
    if (patch.dueDate !== undefined) o.dueDate = patch.dueDate
    if (patch.status !== undefined && ['pendiente', 'cumplido', 'no_cumplido'].includes(patch.status)) o.status = patch.status
    if (patch.result !== undefined) o.result = String(patch.result).trim()
    saveDb(db)
    return clone(o)
  },

  /* ── Eliminación (con datos relacionados) ── */
  async deleteUser(id) {
    await latency()
    const db = loadDb()
    if (db.users.some((u) => u.isCurrent && u.id === id)) {
      throw new Error('No puedes eliminar tu propio usuario.')
    }
    db.users = db.users.filter((u) => u.id !== id)
    // Los proyectos que le asignaste a esa persona quedan sin responsable
    for (const p of db.projects) {
      if (p.assigneeId === id) p.assigneeId = null
    }
    saveDb(db)
    return { id }
  },

  async deleteProject(id) {
    await latency()
    const db = loadDb()
    db.projects = db.projects.filter((p) => p.id !== id)
    db.updates = db.updates.filter((u) => u.projectId !== id)
    db.objectives = (db.objectives ?? []).filter((o) => o.projectId !== id)
    saveDb(db)
    return { id }
  },
}
