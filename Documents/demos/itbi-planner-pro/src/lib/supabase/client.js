/* ═════════════════════════════════════════════════════════════════════════════
   supabase/client.js — Inicialización del cliente de Supabase.
   Lee las variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.

   ── Modo de operación ────────────────────────────────────────────────────
   · Sin variables de entorno  → `isLive = false` → la app usa el repositorio
     de demostración (localStorage). Así puedes correrla sin backend.
   · Con variables de entorno  → `isLive = true` → el repositorio de Supabase
     se activa SOLO si hay una sesión de Auth activa (ver lib/data/index.js).

   Ejemplo de credenciales (Supabase Dashboard → Settings → API):
     VITE_SUPABASE_URL   = https://xxxx.supabase.co
     VITE_SUPABASE_ANON_KEY = eyJhbGciOi...
═════════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

/** true si el desarrollador configuró credenciales en el entorno. */
export const isLive = Boolean(supabaseUrl && supabaseAnonKey)

/** Cliente compartido (null en modo demo). */
export const supabase = isLive ? createClient(supabaseUrl, supabaseAnonKey) : null

/** Pequeño helper tipográfico para logs de arranque. */
export function logMode(active) {
  if (active) {
    console.info('[IT/BI Planner] ✅ Modo LIVE — conectado a Supabase.')
  } else {
    console.info('[IT/BI Planner] 🧪 Modo DEMO — datos de ejemplo en localStorage. ' +
      'Configura VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY para modo live.')
  }
}
