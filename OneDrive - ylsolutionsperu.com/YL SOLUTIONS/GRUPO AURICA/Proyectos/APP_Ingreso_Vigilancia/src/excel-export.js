/* ═════════════════════════════════════════════════════════════════════════════
   excel-export.js — Exportación a Excel real (.xlsx)

   Genera libros con título, subtítulo, encabezado formateado, bordes, anchos
   de columna, fila de encabezado congelada y autofiltro.

   ExcelJS se carga de forma DIFERIDA (import dinámico): solo pesa cuando el
   usuario realmente exporta, no en la carga normal de la aplicación.
═════════════════════════════════════════════════════════════════════════════ */

const BRAND = 'FF245187'        // azul institucional (ARGB)
const BRAND_SOFT = 'FFEAF1F8'
const LINE = 'FFD1D0D1'
const TEXT = 'FF333333'
const DATE_FMT = 'dd/mm/yyyy hh:mm'

let ExcelJS = null
async function getExcelJS() {
  if (!ExcelJS) {
    const mod = await import('exceljs')
    ExcelJS = mod.default || mod
  }
  return ExcelJS
}

const s = (v) => (v === null || v === undefined ? '' : String(v))
const asDate = (v) => (v ? new Date(v) : null)
const ahora = () =>
  new Date().toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  })

const THIN = {
  top: { style: 'thin', color: { argb: LINE } },
  left: { style: 'thin', color: { argb: LINE } },
  bottom: { style: 'thin', color: { argb: LINE } },
  right: { style: 'thin', color: { argb: LINE } }
}

/* Título (fila 1), subtítulo (fila 2) y altura de la fila de encabezado (3). */
function paintTitle(ws, cols, titulo, subtitulo) {
  ws.mergeCells(1, 1, 1, cols)
  const t = ws.getCell(1, 1)
  t.value = titulo
  t.font = { bold: true, size: 15, color: { argb: 'FFFFFFFF' } }
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } }
  t.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(1).height = 32

  ws.mergeCells(2, 1, 2, cols)
  const st = ws.getCell(2, 1)
  st.value = subtitulo
  st.font = { size: 10, color: { argb: 'FF575656' } }
  st.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_SOFT } }
  st.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(2).height = 20
  ws.getRow(3).height = 26
}

/* Encabezado (fila 3) + cuerpo de la tabla con bordes finos. */
function paintTable(ws, headerRow, firstDataRow, lastDataRow, cols) {
  const head = ws.getRow(headerRow)
  for (let c = 1; c <= cols; c++) {
    const cell = head.getCell(c)
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = THIN
  }
  for (let r = firstDataRow; r <= lastDataRow; r++) {
    const row = ws.getRow(r)
    for (let c = 1; c <= cols; c++) {
      const cell = row.getCell(c)
      cell.font = { size: 10, color: { argb: TEXT } }
      cell.alignment = { vertical: 'top', wrapText: true }
      cell.border = THIN
    }
  }
}

/* Descarga el libro generado como archivo .xlsx */
async function save(wb, filename) {
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(function () { URL.revokeObjectURL(url) }, 5000)
}

/* ── HISTORIAL DE VISITAS ────────────────────────────────────────────── */
export async function exportHistorialToExcel(registros, opts) {
  const o = opts || {}
  const lib = await getExcelJS()
  const wb = new lib.Workbook()
  wb.creator = 'Grupo Aurica · Sistema de Ingreso y Salida'
  const ws = wb.addWorksheet('Historial', {
    views: [{ state: 'frozen', ySplit: 3 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  })

  const specs = [
    { header: 'N°', width: 6 },
    { header: 'DNI', width: 14 },
    { header: 'Nombres', width: 24 },
    { header: 'Apellidos', width: 26 },
    { header: 'Empresa', width: 28 },
    { header: 'Ingreso', width: 18 },
    { header: 'Salida', width: 18 },
    { header: 'Autoriza', width: 24 },
    { header: 'Resguardo responsable', width: 24 },
    { header: 'Procedencia', width: 15 },
    { header: 'Comentario', width: 46 },
    { header: 'Sede', width: 24 }
  ]
  specs.forEach(function (c, i) { ws.getColumn(i + 1).width = c.width })

  const periodoText = o.periodo || o.fecha || ''
  const subtitulo = [
    'Sede: ' + s(o.sede || 'Todas'),
    (periodoText ? 'Período: ' + s(periodoText) : ''),
    'Registros: ' + registros.length,
    'Generado: ' + ahora()
  ].filter(Boolean).join('   ·   ')
  paintTitle(ws, specs.length, 'HISTORIAL DE VISITAS · GRUPO AURICA', subtitulo)
  ws.getRow(3).values = specs.map(function (c) { return c.header })

  registros.forEach(function (r, i) {
    const p = r.personas || {}
    const row = ws.getRow(4 + i)
    row.values = [
      i + 1,
      s(p.dni),
      s(p.nombres),
      (s(p.apellido_paterno) + ' ' + s(p.apellido_materno)).trim(),
      s(p.empresa),
      asDate(r.fecha_ingreso),
      asDate(r.fecha_salida),
      s(r.autoriza),
      s(r.resguardo_responsable),
      s(r.procedencia),
      s(r.comentario),
      s(r.sede)
    ]
    row.getCell(6).numFmt = DATE_FMT
    row.getCell(7).numFmt = DATE_FMT
  })

  const last = 3 + registros.length
  paintTable(ws, 3, 4, last, specs.length)
  ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: specs.length } }

  const suffix = (o.filenameSuffix || periodoText || '')
    .toString()
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, '_')
  const filename = 'Historial_Visitas_Aurica' + (suffix ? '_' + suffix : '') + '.xlsx'
  await save(wb, filename)
}

/* ── ACTAS FIRMADAS ─────────────────────────────────────────────────── */
export async function exportActasToExcel(actas) {
  const lib = await getExcelJS()
  const wb = new lib.Workbook()
  wb.creator = 'Grupo Aurica · Sistema de Ingreso y Salida'
  const ws = wb.addWorksheet('Actas', {
    views: [{ state: 'frozen', ySplit: 3 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  })

  const specs = [
    { header: 'N°', width: 6 },
    { header: 'DNI', width: 14 },
    { header: 'Nombres y apellidos', width: 38 },
    { header: 'Empresa', width: 30 },
    { header: 'Correo', width: 34 },
    { header: 'Fecha de registro', width: 20 }
  ]
  specs.forEach(function (c, i) { ws.getColumn(i + 1).width = c.width })

  paintTitle(
    ws,
    specs.length,
    'ACUERDOS DE CONFIDENCIALIDAD FIRMADOS · GRUPO AURICA',
    'Total de actas: ' + actas.length + '   ·   Generado: ' + ahora()
  )
  ws.getRow(3).values = specs.map(function (c) { return c.header })

  actas.forEach(function (a, i) {
    const row = ws.getRow(4 + i)
    row.values = [
      i + 1,
      s(a.dni),
      (s(a.nombres) + ' ' + s(a.apellido_paterno) + ' ' + s(a.apellido_materno)).trim(),
      s(a.empresa),
      s(a.correo),
      asDate(a.created_at)
    ]
    row.getCell(6).numFmt = DATE_FMT
  })

  const last = 3 + actas.length
  paintTable(ws, 3, 4, last, specs.length)
  ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: specs.length } }

  await save(wb, 'Registro_Actas_Aurica_' + Date.now() + '.xlsx')
}
