# IT/BI Planner Pro 🗂️

Gestor de proyectos y avances para equipos de **TI & Business Intelligence**. SPA en **Dark Mode puro** (estilo DeepSeek), con dos vistas — *Dashboard Gerencial* y *Mi Planner* con timeline horizontal interactivo — construida con **Vite + Tailwind CSS v4 + Chart.js**, backend **Supabase** (PostgreSQL + Auth + RLS) y desplegable en **Cloudflare Pages**.

![Stack](https://img.shields.io/badge/stack-Vite%20%2B%20Tailwind%20v4%20%2B%20Chart.js-4d6bfe) ![DB](https://img.shields.io/badge/db-Supabase%20%28PostgreSQL%2BRLS%29-3fcf8e) ![Hosting](https://img.shields.io/badge/hosting-Cloudflare%20Pages-f38020)

---

## ✨ Funcionalidades

| Módulo | Descripción |
|---|---|
| **Dashboard Gerencial** | KPIs (total, al día, retrasados, miembros), gráfico de barras *avances por mes*, gráfico de anillo *proyectos por categoría* (Aplicación / Diagrama de Flujo) y tabla del equipo con la persona en seguimiento (Responsable), fecha límite, barra de progreso y badge de estado, más búsqueda/filtro. |
| **Mi Planner** | Planner del jefe: crea el proyecto con sus datos y elige la **persona a la que le hará seguimiento** (Responsable). Selector de proyecto, tarjeta de resumen con **anillo de progreso editable**, **objetivos semanales**, **timeline horizontal** (scroll-x) con nodos coloreados por estado y modal de detalle al hacer clic. |
| **Objetivos semanales** | Se crean en la reunión (con fecha de revisión = próxima reunión) y en esa fecha se verifican: **Cumplido / No cumplido** + resultado. La tarjeta muestra pendientes, revisados, próxima revisión y contadores. |
| **Notas rápidas** | Componedor "Anotar" en el planner: guarda cualquier duda, consulta o información con fecha en la línea de tiempo como nodo **Nota / Consulta** (clic para ver detalle). |
| **Modales** | Nuevo Proyecto (con persona en seguimiento), Nuevo Avance, Detalles de Avance (solo lectura), Nuevo Objetivo y Revisar Objetivo. |
| **Datos** | Modo **demo** (localStorage con semilla realista) sin configuración, o modo **live** contra Supabase cuando hay credenciales + sesión Auth. |

**Estados del timeline (leyenda):**

- ⚪ Inicio de Proyecto (automático, siempre presente como primer punto) · 🔵 Reunión Pendiente · 🔷 En Desarrollo · 🟡 Pruebas Iniciales · 🟣 Mejoras / Refactor · 🔴 Reparación de Bug · 🟢 Implementado / Ok · 🩵 Nota / Consulta

---

## 🚀 Arranque rápido (sin backend)

```bash
npm install
npm run dev        # http://localhost:5173  → abre en Modo Demo
```

Sin variables de entorno la app **arranca sola en Modo Demostración**: datos de ejemplo con fechas relativas a hoy persistidos en `localStorage` (bórralos con `localStorage.clear()` o `resetDemoDb()` para regenerar la semilla).

## 🗄️ Activar Supabase (PostgreSQL + Auth + RLS)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor** ejecuta [`supabase/schema.sql`](supabase/schema.sql) (tablas `users`, `projects`, `updates`, triggers de `updated_at`, creación de perfil al registrarse y políticas RLS).
3. Opcional: [`supabase/seed.example.sql`](supabase/seed.example.sql) inserta filas de ejemplo.
4. Copia `.env.example` → `.env` y pega tus credenciales (**Project Settings → API**):

```bash
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-public-key
```

5. Regístrate/inciia sesión con **Supabase Auth** (Authentication → Add user). El trigger `handle_new_user` crea su fila en `public.users`. Con una sesión activa la app conmuta automáticamente a **modo LIVE** (indicador en el footer).

> Sin sesión Auth, la app usa el modo demo aunque existan credenciales: así `npm run dev` nunca se rompe.

### Esquema relacional

```
users  (1) ──────── (N) projects  (1) ──────── (N) updates
 id                      user_id (FK)               project_id (FK)
 email, full_name,       name, description,         status_type, update_date,
 role, avatar_url        category, deadline_date,    notes
                         progress, status
```

### Funciones JS de referencia (CRUD)

```js
import { supabase } from './src/lib/supabase/client.js' // cliente inicializado

// ─ Leer proyectos para armar el Dashboard ─
const { data: projects, error } = await supabase
  .from('projects').select('*').order('created_at', { ascending: false })

// ─ Insertar un proyecto (RLS exige user_id = auth.uid()) ─
const { data: newProject } = await supabase
  .from('projects').insert({
    user_id: (await supabase.auth.getUser()).data.user.id,
    name: 'Plataforma BI Self-Service',
    category: 'BI',
    deadline_date: '2025-12-31',
    progress: 0,
  }).select().single()

// ─ Insertar un update (avance) ─
const { data: newUpdate } = await supabase
  .from('updates').insert({
    project_id: newProject.id,
    status_type: 'pruebas_iniciales',
    update_date: new Date().toISOString().slice(0, 10),
    notes: 'QA inicial completado sin incidencias.',
  }).select().single()
```

En el código real estas llamadas viven en [`src/lib/data/repoSupabase.js`](src/lib/data/repoSupabase.js) (mismas funciones, normalizadas a camelCase) y la UI solo consume la fachada [`src/lib/data/index.js`](src/lib/data/index.js).

## ☁️ Despliegue en Cloudflare Pages

**Opción A — Git (recomendada):**

1. Sube el repo a GitHub/GitLab.
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Configura el build:

| Campo | Valor |
|---|---|
| Build command | `npm install && npm run build` |
| Build output directory | `dist` |
| Variable de entorno | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Production) |

**Opción B — Subida directa (sin repo):**

```bash
npm run build
# arrastra la carpeta dist/ a Pages → Create → Direct Upload
```

El enrutamiento SPA ya está resuelto con [`public/_redirects`](public/_redirects) (`/* /index.html 200`); puedes recargar `/#planner` directamente. (Opcional: en Pages → Settings → *Always use latest build* y *Single-page application = On*.)

## 🗂️ Estructura del proyecto

```
itbi-planner-pro/
├── index.html                  # Shell SPA: header fijo + vistas + modales
├── package.json / vite.config.js
├── public/_redirects           # SPA fallback para Cloudflare Pages
├── supabase/
│   ├── schema.sql              # Tablas, triggers, RLS
│   └── seed.example.sql        # Datos de ejemplo
└── src/
    ├── main.js                 # Bootstrap, switch de vistas, delegación de eventos
    ├── style.css               # Tailwind v4 + tokens + timeline + modales
    ├── state.js                # Estado global en memoria
    ├── lib/
    │   ├── utils.js            # Fechas es-ES, escape HTML, avatares
    │   ├── statuses.js         # 5 estados del timeline + categorías + salud
    │   ├── supabase/client.js  # createClient(Supabase)
    │   └── data/
    │       ├── index.js        # Fachada: decide demo/live
    │       ├── localDb.js      # Semilla demo (localStorage)
    │       ├── repoLocal.js    # CRUD demo (misma interfaz)
    │       └── repoSupabase.js # CRUD Supabase (snake→camel)
    └── ui/
        ├── common.js           # Avatares, barras de progreso
        ├── charts.js           # Chart.js bar + doughnut (dark)
        ├── dashboard.js        # Vista Dashboard Gerencial
        ├── planner.js          # Vista Mi Planner + timeline
        ├── modals.js           # 3 modales
        ├── icons.js            # Iconos SVG inline
        └── toast.js            # Notificaciones
```

## 🎨 Notas de diseño

- Fondo `#09090b` (zinc-950), tarjetas `#18181b` (zinc-900), bordes `#27272a` (zinc-800).
- Acento de marca `#4d6bfe` (blue estilo DeepSeek) definido como token `brand-*` en `@theme`.
- Tipografía **Inter** (fallback `system-ui`), texto primario `zinc-50/100`, secundario `zinc-400/500`.
- Layout sin sidebar: toda la navegación vive en el header superior (logo, switch de vistas, avatar). Sin campanita de notificaciones.
- Las clases de color se definen **literales** en `statuses.js` para que el purger de Tailwind siempre las detecte.

## 🛠️ Comandos

```bash
npm run dev      # desarrollo (hot reload)
npm run build    # build de producción → dist/
npm run preview  # previsualiza el build localmente
```

---

Hecho para equipos que viven entre tickets, dashboards y releases. ✦
