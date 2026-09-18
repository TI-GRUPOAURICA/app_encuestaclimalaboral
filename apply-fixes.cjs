// apply-fixes.cjs — Aplica las mejoras al proyecto APP_Ingreso_Vigilancia
// en la carpeta REAL del usuario (fuera del workspace), de forma atomica y
// verificada. Ejecutar con: node apply-fixes.cjs
const fs = require('fs')
const path = require('path')

const REAL = 'C:/Users/Leonar/OneDrive - ylsolutionsperu.com/YL SOLUTIONS/GRUPO AURICA/Proyectos/APP_Ingreso_Vigilancia'

function applyAll(file, edits) {
  const p = path.join(REAL, file)
  if (!fs.existsSync(p)) {
    console.error('FALLO: no existe ' + p)
    process.exit(1)
  }
  const orig = fs.readFileSync(p, 'utf8')
  // 1) Validar que TODAS las ediciones existen antes de escribir nada
  edits.forEach(([from, to], idx) => {
    if (!orig.includes(from)) {
      console.error(`FALLO en ${file}: edicion #${idx + 1} no encontrada:`)
      console.error('----- buscado -----')
      console.error(from)
      console.error('-------------------')
      process.exit(1)
    }
  })
  // 2) Aplicar en orden (replace de string = solo primera ocurrencia)
  let s = orig
  for (const [from, to] of edits) s = s.replace(from, to)
  fs.writeFileSync(p, s, 'utf8')
  console.log(`OK ${file}: ${edits.length} edicion(es) (${orig.length} -> ${s.length} chars)`)
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. main.js — quitar el congelamiento + arreglar el bucket del PDF
// ─────────────────────────────────────────────────────────────────────────────
applyAll('src/main.js', [
  // (a) listener de auth sin await dentro del callback (evita deadlock)
  [
    `  supabase.auth.onAuthStateChange(async (event, session) => {\n    console.log("Evento Auth:", event);\n    if (event === 'SIGNED_IN' && !currentUserProfile) {\n      // Setup interface directly without reloading\n      const { profile } = await getSession();\n      if(profile) setupInterface(profile);\n    }\n  });`,
    `  supabase.auth.onAuthStateChange((event) => {\n    console.log("Evento Auth:", event);\n    if (event === 'SIGNED_IN' && !currentUserProfile) {\n      // Sin await dentro del callback (evita deadlock del lock de auth).\n      setTimeout(async () => {\n        const { profile } = await getSession();\n        if (profile) setupInterface(profile);\n      }, 0);\n    }\n  });`,
  ],
  // (b) eliminar la pre-generacion del PDF en cada carga de pagina
  [
    `  // Pre-generate PDF in background for instant display\n  let cachedPdfUrl = null;\n  (async function preGeneratePDF() {\n    try {\n      const emptyInfo = { nombres: '________________', apellidos: '________________ ________________', dni: '________' };\n      const pdfBytes = await generateAcuerdoPDF(emptyInfo, null);\n      const blob = new Blob([pdfBytes], { type: 'application/pdf' });\n      cachedPdfUrl = URL.createObjectURL(blob);\n      console.log('PDF del acuerdo pre-generado correctamente');\n    } catch (err) {\n      console.warn('Error pre-generando PDF:', err);\n    }\n  })();`,
    `  // El PDF del acuerdo se genera SOLO al abrir el modal (openPdfModal).\n  // Antes se pre-generaba en cada carga de pagina: embebia una imagen de\n  // 22.731 px y congelaba el hilo principal durante segundos.\n  let cachedPdfUrl = null;`,
  ],
  // (c) email al registrar: firmaUrl YA es la URL publica del bucket 'firmas'
  [
    `        const { data: publicData } = supabase.storage.from('acuerdos_pdf').getPublicUrl(firmaUrl);`,
    `        // firmaUrl ya es la URL publica del bucket 'firmas' (la devuelve uploadFirmaPdf)\n        const pdfUrl = firmaUrl;`,
  ],
  [
    `            pdfUrl: publicData?.publicUrl || firmaUrl`,
    `            pdfUrl`,
  ],
  // (d) email retroactivo: p.firma_url ya es la URL publica valida
  [
    `                  const { data: publicData } = supabase.storage.from('acuerdos_pdf').getPublicUrl(p.firma_url);`,
    `                  // p.firma_url ya es la URL publica valida (bucket 'firmas')`,
  ],
  [
    `                      pdfUrl: publicData?.publicUrl || p.firma_url`,
    `                      pdfUrl: p.firma_url`,
  ],
])

// ─────────────────────────────────────────────────────────────────────────────
// 2. pdf-generator.js — quitar el cache-buster (?v=Date.now())
// ─────────────────────────────────────────────────────────────────────────────
applyAll('src/pdf-generator.js', [
  [`const res1 = await fetch('/logos-empresa.png?v=' + Date.now());`, `const res1 = await fetch('/logos-empresa.png');`],
  [`const res2 = await fetch('/logo-empresa.png?v=' + Date.now());`, `const res2 = await fetch('/logo-empresa.png');`],
])

// ─────────────────────────────────────────────────────────────────────────────
// 3. Optimizar logos-empresa.png (22731x3350 -> 1600 px de ancho)
// ─────────────────────────────────────────────────────────────────────────────
;(async () => {
  try {
    const sharp = require(path.join(REAL, 'node_modules', 'sharp'))
    const src = path.join(REAL, 'public', 'logos-empresa.png')
    const bak = path.join(REAL, 'logos-empresa.original.png')

    fs.copyFileSync(src, bak) // respaldo fuera de public/ (no se sirve ni se buildea)

    const before = fs.statSync(src).size
    const tmp = src + '.tmp.png'
    const info = await sharp(src)
      .resize({ width: 1600, withoutEnlargement: true })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(tmp)
    fs.renameSync(tmp, src)
    const after = fs.statSync(src).size

    console.log(`OK imagen: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB, ahora ${info.width}x${info.height} px`)
    console.log('Respaldo guardado en: ' + bak)
  } catch (e) {
    console.error('FALLO optimizando imagen:', e.message)
    process.exit(1)
  }

  // ── Verificacion final ─────────────────────────────────────────────────────
  console.log('')
  console.log('===== VERIFICACION =====')
  const main = fs.readFileSync(path.join(REAL, 'src/main.js'), 'utf8')
  const pdfg = fs.readFileSync(path.join(REAL, 'src/pdf-generator.js'), 'utf8')
  console.log('main.js:      acuerdos_pdf ->', (main.match(/acuerdos_pdf/g) || []).length, 'ocurrencias (esperado 0)')
  console.log('main.js:      preGeneratePDF ->', (main.match(/preGeneratePDF/g) || []).length, 'ocurrencias (esperado 0)')
  console.log('pdf-gen:      ?v=Date.now() ->', (pdfg.match(/\?v=' \+ Date\.now/g) || []).length, 'ocurrencias (esperado 0)')
})()
