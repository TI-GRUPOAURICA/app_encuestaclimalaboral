/* ═════════════════════════════════════════════════════════════════════════════
   data/repoSupabase.js — Repositorio LIVE sobre Supabase (PostgreSQL + RLS).
   Misma interfaz que repoLocal.js, pero mapeando columnas snake_case
   (definidas en supabase/schema.sql) a objetos camelCase del dominio.

   ── Funciones CRUD de referencia (requerimiento de entrega) ─────────────
   · getCurrentUser() → SELECT * FROM users WHERE id = auth.uid()
   · listProjects()   → SELECT * FROM projects ORDER BY created_at DESC
   · listUpdates()    → SELECT * FROM updates
   · createProject()  → INSERT INTO projects (user_id, name, ...)
   · createUpdate()   → INSERT INTO updates (project_id, status_type, ...)
   · updateProject()  → UPDATE projects SET progress = $1 WHERE id = $2
═════════════════════════════════════════════════════════════════════════════ */
import { supabase } from '../supabase/client.js'

/* ── Mapeos de fila (snake_case de la BD → camelCase del dominio) ────────── */
const mapUser = (r) => ({
  id: r.id,
  email: r.email,
  fullName: r.full_name,
  role: r.role,
  avatarUrl: r.avatar_url,
})

const mapProject = (r) => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  description: r.description,
  category: r.category,
  deadlineDate: r.deadline_date, // 'YYYY-MM-DD' (las columnas date vienen como string)
  progress: r.progress,
  status: r.status,
  assigneeId: r.assignee_id ?? null,
  createdAt: r.created_at ? r.created_at.slice(0, 10) : null,
})

const mapUpdate = (r) => ({
  id: r.id,
  projectId: r.project_id,
  statusType: r.status_type,
  updateDate: r.update_date,
  notes: r.notes,
})

/* Helper: si la consulta falla se lanza con contexto (la UI muestra el toast). */
function guardError(label, { data, error }) {
  if (error) {
    console.error(`[Supabase] ${label}:`, error)
    throw new Error(`${label}: ${error.message}`)
  }
  return data
}

export const supabaseRepo = {
  mode: 'live',

  /** El usuario logueado (sesión Supabase Auth). null si no hay sesión. */
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle()
    if (error) throw error
    // Si el trigger handle_new_user aún no creó la fila, usamos los datos de Auth.
    return data ? mapUser(data) : { id: user.id, email: user.email, fullName: user.email, role: 'member', avatarUrl: null }
  },

  async listUsers() {
    const rows = guardError('listUsers', await supabase.from('users').select('*').order('full_name'))
    return rows.map(mapUser)
  },

  /** Alta de un miembro del directorio (public.users).
      Nota: en producción el alta suele venir del propio Supabase Auth (el
      trigger handle_new_user crea la fila). Este método permite registrar
      manualmente a un miembro del equipo. */
  async createUser({ fullName, email, role = 'Desarrollador' }) {
    const rows = guardError('createUser', await supabase
      .from('users')
      .insert({
        email: String(email || '').trim().toLowerCase(),
        full_name: String(fullName || '').trim(),
        role: String(role || 'Desarrollador').trim(),
        avatar_url: null,
      })
      .select()
      .single())
    return mapUser(rows)
  },

  async listProjects() {
    const rows = guardError('listProjects',
      await supabase.from('projects').select('*').order('created_at', { ascending: false }))
    return rows.map(mapProject)
  },

  async listUpdates() {
    const rows = guardError('listUpdates',
      await supabase.from('updates').select('*').order('update_date', { ascending: false }))
    return rows.map(mapUpdate)
  },

  /** INSERT INTO projects (...) VALUES (...); RLS exige user_id = auth.uid()
      (el jefe/creador). assignee_id = persona a la que se le hace seguimiento.
      Se inserta además el nodo inicial "inicio_proyecto" en el timeline. */
  async createProject({ name, description = '', category = 'Desarrollo de Nuevo Software', deadlineDate, assigneeId }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No hay sesión activa en Supabase')
    const rows = guardError('createProject', await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        assignee_id: assigneeId ?? user.id,
        name: String(name).trim(),
        description: String(description).trim(),
        category,
        deadline_date: deadlineDate || null,
        progress: 0,
        status: 'active',
      })
      .select()
      .single())

    // Primer nodo del timeline
    await guardError('createProjectStartUpdate', await supabase
      .from('updates')
      .insert({
        project_id: rows.id,
        status_type: 'inicio_proyecto',
        update_date: new Date().toISOString().slice(0, 10),
        notes: 'Inicio del proyecto.\n- Definición inicial del alcance y los objetivos.\n- Pendiente: reunión de kickoff con el equipo.',
      }))

    return mapProject(rows)
  },

  /** UPDATE projects SET ... WHERE id = $id (RLS: solo el dueño). */
  async updateProject(id, patch) {
    const set = {}
    if (patch.progress !== undefined) set.progress = Math.min(100, Math.max(0, Number(patch.progress)))
    if (patch.status !== undefined) set.status = patch.status
    if (patch.name !== undefined) set.name = String(patch.name).trim()
    if (patch.description !== undefined) set.description = String(patch.description).trim()
    if (patch.category !== undefined) set.category = patch.category
    if (patch.deadlineDate !== undefined) set.deadline_date = patch.deadlineDate
    if (patch.assigneeId !== undefined) set.assignee_id = patch.assigneeId
    const rows = guardError('updateProject',
      await supabase.from('projects').update(set).eq('id', id).select().single())
    return mapProject(rows)
  },

  /** INSERT INTO updates (project_id, status_type, update_date, notes). */
  async createUpdate({ projectId, statusType, updateDate, notes = '' }) {
    const rows = guardError('createUpdate', await supabase
      .from('updates')
      .insert({
        project_id: projectId,
        status_type: statusType,
        update_date: updateDate || new Date().toISOString().slice(0, 10),
        notes: String(notes).trim(),
      })
      .select()
      .single())
    return mapUpdate(rows)
  },

  /* ── Objetivos semanales (se crean en la reunión, se verifican en la siguiente) ── */
  async listObjectives() {
    const rows = guardError('listObjectives',
      await supabase.from('objectives').select('*').order('due_date', { ascending: true }))
    return rows.map(mapObjective)
  },

  async createObjective({ projectId, title, detail = '', dueDate, status = 'pendiente', result = '' }) {
    const rows = guardError('createObjective', await supabase
      .from('objectives')
      .insert({
        project_id: projectId,
        title: String(title).trim(),
        detail: String(detail).trim(),
        due_date: dueDate || new Date().toISOString().slice(0, 10),
        status,
        result: String(result).trim(),
      })
      .select()
      .single())
    return mapObjective(rows)
  },

  async updateObjective(id, patch) {
    const set = {}
    if (patch.title !== undefined) set.title = String(patch.title).trim()
    if (patch.detail !== undefined) set.detail = String(patch.detail).trim()
    if (patch.dueDate !== undefined) set.due_date = patch.dueDate
    if (patch.status !== undefined && ['pendiente', 'cumplido', 'no_cumplido'].includes(patch.status)) set.status = patch.status
    if (patch.result !== undefined) set.result = String(patch.result).trim()
    const rows = guardError('updateObjective',
      await supabase.from('objectives').update(set).eq('id', id).select().single())
    return mapObjective(rows)
  },

  /* ── Eliminación (los FK/cascada se encargan de lo relacionado) ── */
  async deleteUser(id) {
    // Evita borrar la propia cuenta autenticada (se identifica por auth.uid())
    const { data: { user } } = await supabase.auth.getUser()
    if (user && user.id === id) throw new Error('No puedes eliminar tu propio usuario.')
    guardError('deleteUser', await supabase.from('users').delete().eq('id', id))
    return { id }
  },

  async deleteProject(id) {
    guardError('deleteProject', await supabase.from('projects').delete().eq('id', id))
    return { id }
  },
}

const mapObjective = (r) => ({
  id: r.id,
  projectId: r.project_id,
  title: r.title,
  detail: r.detail,
  dueDate: r.due_date,
  status: r.status,
  result: r.result,
  createdAt: r.created_at ? r.created_at.slice(0, 10) : null,
})
