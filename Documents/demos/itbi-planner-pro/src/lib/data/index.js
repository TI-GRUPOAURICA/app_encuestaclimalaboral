/* ═════════════════════════════════════════════════════════════════════════════
   data/index.js — Fachada de datos. Decide el repositorio activo UNA vez:

     1. ¿Hay VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY?
     2. ¿Existe una sesión de Supabase Auth?
        · sí  → repoSupabase (modo LIVE, PostgreSQL + RLS)
        · no  → repoLocal    (modo DEMO, localStorage con semilla)

   La UI nunca toca repos: importa estas funciones y listo.
═════════════════════════════════════════════════════════════════════════════ */
import { isLive, supabase, logMode } from '../supabase/client.js'
import { localRepo } from './repoLocal.js'
import { supabaseRepo } from './repoSupabase.js'

let repo = null
let activeMode = 'demo'

/** Debe llamarse una vez, antes de cualquier lectura (ver src/main.js). */
export async function initDataSource() {
  if (isLive) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      repo = supabaseRepo
      activeMode = 'live'
      logMode(true)
      return
    }
    console.info('[IT/BI Planner] ⚠️ Supabase configurado pero sin sesión de Auth activa → usando demo.')
  }
  repo = localRepo
  activeMode = 'demo'
  logMode(false)
}

export const currentMode = () => activeMode

/** Fallback forzado a demo (se usa si la consulta live falla al arrancar). */
export function useDemoFallback() {
  repo = localRepo
  activeMode = 'demo'
}

const need = () => {
  if (!repo) throw new Error('initDataSource() no fue llamado todavía')
  return repo
}

/* ── API pública (idéntica para ambos repos) ─────────────────────────────── */
export const getCurrentUser    = () => need().getCurrentUser()
export const listUsers         = () => need().listUsers()
export const createUser        = (input) => need().createUser(input)
export const deleteUser        = (id) => need().deleteUser(id)
export const listProjects      = () => need().listProjects()
export const deleteProject     = (id) => need().deleteProject(id)
export const listUpdates       = () => need().listUpdates()
export const createProject     = (input) => need().createProject(input)
export const updateProject     = (id, patch) => need().updateProject(id, patch)
export const createUpdate      = (input) => need().createUpdate(input)
export const listObjectives    = () => need().listObjectives()
export const createObjective   = (input) => need().createObjective(input)
export const updateObjective   = (id, patch) => need().updateObjective(id, patch)
