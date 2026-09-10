/* ═════════════════════════════════════════════════════════════════════════════
   charts.js — Gráficos con Chart.js, tematizados para dark mode.

   · chart-bar      : Avances registrados vs. implementados por mes (6 meses).
   · chart-doughnut : Distribución de proyectos por categoría.

   Reglas de uso:
   · Los canvases viven en index.html (no se re-renderiza su contenedor).
   · `mount()` reutiliza el canvas: si ya hay una instancia se destruye
     (evita el error clásico "Canvas is already in use").
═════════════════════════════════════════════════════════════════════════════ */
import Chart from 'chart.js/auto'
import { CATEGORY_META, getCategoryMeta } from '../lib/statuses.js'
import { lastMonthKeys, monthKeyOf, monthShortLabel } from '../lib/utils.js'

/* Paleta de texto/grid para el tema oscuro */
const FONT = { family: 'Inter, system-ui, sans-serif', size: 13 }
const TICK = '#9ca3af'                 // zinc-400 (más visible)
const GRID = 'rgba(255, 255, 255, 0.06)'
const LEGEND = '#d4d4d8'               // zinc-300
const TOOLTIP_BG = '#18181b'           // zinc-900

Chart.defaults.font = FONT
Chart.defaults.color = LEGEND

Chart.defaults.plugins.tooltip = {
  backgroundColor: TOOLTIP_BG,
  borderColor: '#27272a',
  borderWidth: 1,
  titleColor: '#f4f4f5',
  bodyColor: '#d4d4d8',
  padding: 12,
  cornerRadius: 10,
  boxPadding: 4,
  displayColors: true,
}

/** Crea (o reemplaza) el gráfico de un canvas. */
function mount(canvasId, config) {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return
  const existing = Chart.getChart(canvas)
  if (existing) existing.destroy()
  return new Chart(canvas, config)
}

/* ─────────────────────────── Render principal ───────────────────────────── */
export function renderDashboardCharts({ projects, updates }) {
  mount('chart-bar', barConfig(updates))
  mount('chart-doughnut', doughnutConfig(projects))
}

/* ── Gráfico de barras: avances por mes ──────────────────────────────────── */
function barConfig(updates) {
  const months = lastMonthKeys(6)

  const total = months.map((mk) => updates.filter((u) => monthKeyOf(u.updateDate) === mk).length)
  const done = months.map((mk) =>
    updates.filter((u) => monthKeyOf(u.updateDate) === mk && u.statusType === 'implementado_ok').length,
  )

  return {
    type: 'bar',
    data: {
      labels: months.map(monthShortLabel),
      datasets: [
        {
          label: 'Avances registrados',
          data: total,
          backgroundColor: '#3f3f46',          // zinc-700
          hoverBackgroundColor: '#52525b',
          borderRadius: 5,
          maxBarThickness: 22,
          order: 2,
        },
        {
          label: 'Implementados (OK)',
          data: done,
          backgroundColor: '#10b981',          // emerald-500
          hoverBackgroundColor: '#34d399',
          borderRadius: 5,
          maxBarThickness: 22,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      plugins: {
        legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 7, boxHeight: 7, padding: 14 } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} avance${ctx.parsed.y === 1 ? '' : 's'}`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: TICK } },
        y: {
          beginAtZero: true,
          ticks: { color: TICK, precision: 0 },
          grid: { color: GRID },
        },
      },
    },
  }
}

/* ── Gráfico de anillo (doughnut): proyectos por categoría ───────────────── */
function doughnutConfig(projects) {
  const categories = Object.keys(CATEGORY_META)
  const counts = categories.map((c) => projects.filter((p) => p.category === c).length)
  const colors = categories.map((c) => getCategoryMeta(c).hex)

  const total = projects.length || 1
  const totalTxt = projects.length ? `${projects.length} proyecto${projects.length === 1 ? '' : 's'}` : 'Sin datos'

  return {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [
        {
          data: counts,
          backgroundColor: colors,
          hoverBackgroundColor: colors,
          borderColor: '#18181b',
          borderWidth: 3,
          hoverOffset: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      animation: { duration: 500 },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 7, boxHeight: 7, padding: 16 } },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed
              const pct = Math.round((v / total) * 100)
              return ` ${ctx.label}: ${v} (${pct}%)`
            },
          },
        },
      },
    },
    // Texto centrado del anillo (lo pinta el plugin centerTextPlugin)
    _centerText: totalTxt,
  }
}

/* ── Plugin mínimo: texto centrado dentro del doughnut ───────────────────── */
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    const text = chart.config._centerText
    if (!text) return
    const { ctx, chartArea: { left, right, top, bottom } } = chart
    const cx = (left + right) / 2
    const cy = (top + bottom) / 2
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#f4f4f5'
    ctx.font = "600 20px Inter, system-ui, sans-serif"
    ctx.fillText(text, cx, cy)
    ctx.restore()
  },
}
Chart.register(centerTextPlugin)
