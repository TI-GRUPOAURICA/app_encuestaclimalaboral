import './style.css';
import SignaturePad from 'signature_pad';
import Swal from 'sweetalert2';
import { 
  createVisitante, createRegistro, uploadFirmaPdf, 
  getPersonas, getRegistrosActivos, registrarSalida, getHistorial,
  loginWithMicrosoft, logout, getSession, getAllPerfiles, updatePerfilSede, getActasFirmadas,
  updateCorreoPersona, getPersonalAutorizado, checkActiveRegistro
} from './db.js';
import { supabase } from './supabase.js';
import { generateAcuerdoPDF } from './pdf-generator.js';
import { getWelcomeEmailHtml } from './email-template.js';
import { buscarDNI, buscarRUC } from './api.js';
import { exportHistorialToExcel, exportActasToExcel } from './excel-export.js';

// Escapa texto que se inyecta en innerHTML (evita HTML/JS que venga de la BD)
function esc(value) {
  return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// === DOM Elements ===
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
const navigateBtns = document.querySelectorAll('[data-navigate]');

let signaturePad = null;
let currentSelectedPersona = null;
let currentUserProfile = null;
let currentView = 'view-inicio';
let currentHistorialData = [];
let currentHistorialFilter = {
  mode: 'dia',
  startDate: null,
  endDate: null,
  periodoLabel: '',
  filenameSuffix: ''
};

async function init() {
  // Escuchar cambios de autenticación
  supabase.auth.onAuthStateChange((event) => {
    console.log("Evento Auth:", event);
    if (event === 'SIGNED_IN' && !currentUserProfile) {
      // Sin await dentro del callback (evita deadlock del lock de auth).
      setTimeout(async () => {
        const { profile } = await getSession();
        if (profile) setupInterface(profile);
      }, 0);
    }
  });

  // Check session first
  const { session, profile } = await getSession();
  
  if (!session) {
    // Show login overlay
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  } else {
    // Logged in
    setupInterface(profile);
  }

  // Bind Login/Logout
  const btnLoginMs = document.getElementById('btn-login-ms');
  
  btnLoginMs?.addEventListener('click', async () => {
    try {
      await loginWithMicrosoft();
    } catch (e) {
      console.error("Error en login:", e);
      Swal.fire("Error", "No se pudo iniciar sesión: " + e.message, "error");
    }
  });

  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await logout();
    window.location.reload();
  });

  // El PDF del acuerdo se genera SOLO al abrir el modal (openPdfModal).
  // Antes se pre-generaba en cada carga de pagina: embebia una imagen de
  // 22.731 px y congelaba el hilo principal durante segundos.
  let cachedPdfBytes = null;
  let cachedPdfUrl = null;

  // Devuelve los bytes del acuerdo (con cache) y prepara el blob de descarga.
  async function getAcuerdoPdf() {
    if (!cachedPdfBytes) {
      const emptyInfo = { nombres: '________________', apellidos: '________________ ________________', dni: '________' };
      const bytes = await generateAcuerdoPDF(emptyInfo, null);
      cachedPdfBytes = bytes;
      cachedPdfUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    }
    return cachedPdfBytes;
  }

  // ── Visor propio con PDF.js ────────────────────────────────────────────
  // Android Chrome y iOS Safari NO renderizan un PDF dentro de un <iframe>:
  // muestran el nombre del blob y ofrecen abrirlo con otra app. Pintando las
  // paginas en un <canvas> se ve igual en PC, Android e iOS.
  let pdfjsPromise = null;
  function loadPdfjs() {
    if (!pdfjsPromise) {
      pdfjsPromise = (async () => {
        // Polyfill para tablets con navegador antiguo (< Chrome 119)
        if (typeof Promise.withResolvers !== 'function') {
          Promise.withResolvers = function () {
            let resolve, reject;
            const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
            return { promise, resolve, reject };
          };
        }
        // Carga diferida: pdf.js solo se descarga al abrir el modal
        const [lib, worker] = await Promise.all([
          import('pdfjs-dist/legacy/build/pdf.mjs'),
          import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
        ]);
        lib.GlobalWorkerOptions.workerSrc = worker.default;
        return lib;
      })();
    }
    return pdfjsPromise;
  }

  async function paintAcuerdoPdf(bytes, maxWidth) {
    const pdfjsLib = await loadPdfjs();
    const pages = document.getElementById('modal-pdf-pages');
    pages.innerHTML = '';
    const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(maxWidth / base.width, 3);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';
      canvas.style.background = '#fff';
      canvas.style.boxShadow = '0 6px 20px rgba(0,0,0,0.35)';
      canvas.style.borderRadius = '4px';
      pages.appendChild(canvas);
      // PDF.js v6: se pasa 'canvas' (canvasContext quedo obsoleto)
      await page.render({ canvas, viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined }).promise;
    }
    return doc.numPages;
  }

  function openPdfModal() {
    const modal = document.getElementById('modal-acuerdo-pdf');
    const scroll = document.getElementById('modal-pdf-scroll');
    const pages = document.getElementById('modal-pdf-pages');
    const loading = document.getElementById('modal-pdf-loading');

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Ya pintado antes: se muestra al instante
    if (pages.childElementCount) {
      loading.style.display = 'none';
      scroll.style.display = 'block';
      return;
    }

    // El contenedor de scroll esta oculto, asi que el ancho se mide en su padre
    const host = scroll.parentElement;
    const avail = Math.max(280, (host ? host.clientWidth : 600) - 24);

    scroll.style.display = 'none';
    loading.style.display = 'flex';
    loading.innerHTML = '<i class="ph ph-spinner" style="font-size:1.5rem; animation: spin 1s linear infinite;"></i> Cargando documento...';

    (async () => {
      try {
        const bytes = await getAcuerdoPdf();
        await paintAcuerdoPdf(bytes, avail);
        loading.style.display = 'none';
        scroll.style.display = 'block';
      } catch (err) {
        console.error('Error mostrando el acuerdo:', err);
        // Plan B: si el visor falla, permitir abrir/descargar el PDF igual
        loading.style.display = 'none';
        scroll.style.display = 'block';
        pages.innerHTML =
          '<div style="color:#fff; text-align:center; padding:24px; font-size:1rem; line-height:1.7;">' +
          'No se pudo mostrar el documento en este dispositivo.<br>' +
          '<a href="' + (cachedPdfUrl || '#') + '" target="_blank" rel="noopener" ' +
          'style="display:inline-block; margin-top:18px; background:#245187; color:#fff; padding:12px 26px; border-radius:10px; text-decoration:none; font-weight:600;">Abrir el PDF</a>' +
          '</div>';
      }
    })();
  }

  function closePdfModal() {
    const modal = document.getElementById('modal-acuerdo-pdf');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Button: open modal
  document.getElementById('btn-ver-acuerdo-pdf')?.addEventListener('click', () => {
    openPdfModal();
  });

  // Close modal buttons
  document.getElementById('btn-close-modal-pdf')?.addEventListener('click', closePdfModal);
  document.getElementById('modal-acuerdo-backdrop')?.addEventListener('click', closePdfModal);
  document.getElementById('btn-modal-entendido')?.addEventListener('click', () => {
    closePdfModal();
    // Mark as read
    const btn = document.getElementById('btn-ver-acuerdo-pdf');
    btn.innerHTML = '<i class="ph-fill ph-check-circle" style="font-size: 1.6rem; color: #2e7d32;"></i> Acuerdo de Confidencialidad leído';
    btn.style.borderColor = '#2e7d32';
    btn.style.color = '#2e7d32';
    btn.style.background = 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)';
    const msg = document.getElementById('acuerdo-leido-msg');
    if (msg) msg.style.display = 'flex';
  });

  // 1. Navigation
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      navigateTo(e.currentTarget.getAttribute('data-target'));
    });
  });

  navigateBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      navigateTo(e.currentTarget.getAttribute('data-navigate'));
    });
  });

  // 2. Signature Pad (in Registrar screen)
  const canvas = document.getElementById('signature-pad-registro');
  if (canvas) {
    signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)' });
    document.getElementById('btn-clear-sig-reg').addEventListener('click', () => signaturePad.clear());
  }

  // 3. API Peru Lookups
  document.getElementById('btn-search-dni')?.addEventListener('click', async () => {
    const dni = document.getElementById('reg_dni').value;
    if (dni.length === 8) {
      const data = await buscarDNI(dni);
      if (data) {
        document.getElementById('reg_nombres').value = data.nombres || '';
        document.getElementById('reg_ape_pat').value = data.apellido_paterno || '';
        document.getElementById('reg_ape_mat').value = data.apellido_materno || '';
      }
    }
  });

  document.getElementById('btn-search-ruc')?.addEventListener('click', async () => {
    const ruc = document.getElementById('reg_ruc').value;
    if (ruc.length === 11) {
      const data = await buscarRUC(ruc);
      if (data) {
        document.getElementById('reg_empresa').value = data.nombre_o_razon_social || '';
      }
    }
  });

  // 4. Save Registrar
  document.getElementById('btn-save-visitor')?.addEventListener('click', handleSaveVisitante);

  // Toggle "Sin correo"
  document.getElementById('reg_sin_correo')?.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const correoInput = document.getElementById('reg_correo');
    const commentContainer = document.getElementById('container_comentario_correo');
    
    if (isChecked) {
      correoInput.value = 'auricasac@gmail.com';
      correoInput.readOnly = true;
      correoInput.style.backgroundColor = '#f0f0f0';
      commentContainer.style.display = 'flex';
    } else {
      correoInput.value = '';
      correoInput.readOnly = false;
      correoInput.style.backgroundColor = '';
      commentContainer.style.display = 'none';
      document.getElementById('reg_comentario_correo').value = '';
    }
  });

  // Toggle "Extranjero"
  document.getElementById('reg_is_extranjero')?.addEventListener('change', (e) => {
    const isExt = e.target.checked;
    const labelDoc = document.getElementById('label_doc_input');
    const inputDni = document.getElementById('reg_dni');
    const btnSearchDni = document.getElementById('btn-search-dni');
    
    if (isExt) {
      labelDoc.innerText = "Carné de Extranjería / Pasaporte";
      inputDni.placeholder = "Ingrese documento...";
      btnSearchDni.style.display = 'none';
      inputDni.style.paddingRight = '16px'; // Remove padding for button
      inputDni.setAttribute('inputmode', 'text');
      inputDni.removeAttribute('pattern');
    } else {
      labelDoc.innerText = "Documento de Identidad (DNI)";
      inputDni.placeholder = "Ingrese número...";
      btnSearchDni.style.display = 'flex';
      inputDni.style.paddingRight = '48px';
      inputDni.setAttribute('inputmode', 'numeric');
      inputDni.setAttribute('pattern', '[0-9]*');
    }
  });

  // Toggle "Sin Empresa"
  document.getElementById('reg_sin_empresa')?.addEventListener('change', (e) => {
    const isSinEmp = e.target.checked;
    const inputRuc = document.getElementById('reg_ruc');
    const inputEmp = document.getElementById('reg_empresa');
    const btnSearchRuc = document.getElementById('btn-search-ruc');
    const containerRuc = document.getElementById('container_ruc');
    
    if (isSinEmp) {
      inputRuc.value = '';
      inputEmp.value = 'Ninguna';
      inputRuc.disabled = true;
      inputEmp.disabled = true;
      btnSearchRuc.disabled = true;
      containerRuc.style.opacity = '0.5';
      inputEmp.style.backgroundColor = '#f0f0f0';
    } else {
      inputEmp.value = '';
      inputRuc.disabled = false;
      inputEmp.disabled = false;
      btnSearchRuc.disabled = false;
      containerRuc.style.opacity = '1';
      inputEmp.style.backgroundColor = '';
    }
  });

  // 5. Save Ingreso (Detalles)
  document.getElementById('btn-save-ingreso')?.addEventListener('click', handleSaveIngreso);

  // El marco rojo de un campo obligatorio se quita en cuanto se completa
  ['det_motivo', 'det_autoriza', 'det_resguardo', 'det_procedencia', 'det_comentario'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const limpiar = () => el.classList.remove('input-error');
    el.addEventListener('input', limpiar);
    el.addEventListener('change', limpiar);
  });

  // 6. Search in Ingreso screen
  // Busqueda con retardo: evita lanzar una consulta a la BD por cada tecla
  let searchDebounce = null;
  document.getElementById('search_ingreso_dni')?.addEventListener('input', (e) => {
    const q = e.target.value;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => loadPersonas(q), 300);
  });

  // 7. Controles de Historial (Día, Mes, Rango de fechas)
  initHistorialControls();

  // 8. Sede selector change (for Admins)
  document.getElementById('global_sede')?.addEventListener('change', () => {
    if (currentView === 'view-lista') loadRegistrosActivos();
    if (currentView === 'view-historial') loadHistorial();
  });

  // 9. Export Historial a Excel real (.xlsx)
  document.getElementById('btn-export-historial')?.addEventListener('click', async () => {
    if (!currentHistorialData || currentHistorialData.length === 0) {
      Swal.fire("Atención", "No hay datos en el historial para exportar en este período.", "warning");
      return;
    }
    const sede = document.getElementById('global_sede')?.value || 'Todas';

    Swal.fire({
      title: 'Generando Excel...',
      html: `Preparando <b>${currentHistorialData.length}</b> registros de <i>${esc(currentHistorialFilter.periodoLabel || 'Historial')}</i>...`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    try {
      await exportHistorialToExcel(currentHistorialData, {
        fecha: currentHistorialFilter.periodoLabel,
        periodo: currentHistorialFilter.periodoLabel,
        filenameSuffix: currentHistorialFilter.filenameSuffix,
        sede: sede
      });
      Swal.close();
    } catch (err) {
      console.error('Error exportando historial:', err);
      Swal.fire('Error', 'No se pudo generar el Excel: ' + err.message, 'error');
    }
  });

  // ── Paneles colapsables (menu lateral y buscador de DNI) ───────────────
  // La preferencia se recuerda en el propio dispositivo.
  const PANEL_KEY = 'aurica-paneles-v1';
  let panelPrefs = { sidebar: false, search: false };
  try {
    panelPrefs = Object.assign(panelPrefs, JSON.parse(localStorage.getItem(PANEL_KEY) || '{}'));
  } catch (e) { /* preferencias corruptas: se usan las de fabrica */ }

  function applyPanelPrefs() {
    document.getElementById('app')?.classList.toggle('sidebar-hidden', !!panelPrefs.sidebar);
    document.getElementById('ingreso-search')?.classList.toggle('collapsed', !!panelPrefs.search);
  }
  function savePanelPrefs() {
    try { localStorage.setItem(PANEL_KEY, JSON.stringify(panelPrefs)); } catch (e) {}
  }

  document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
    panelPrefs.sidebar = !panelPrefs.sidebar;
    applyPanelPrefs();
    savePanelPrefs();
  });
  document.getElementById('btn-toggle-search')?.addEventListener('click', () => {
    panelPrefs.search = !panelPrefs.search;
    applyPanelPrefs();
    savePanelPrefs();
  });
  applyPanelPrefs();

  // Initial View
  navigateTo('view-inicio');
}

function setupInterface(profile) {
  currentUserProfile = profile;
  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  
  // Setup UI based on profile
  const sedeSelect = document.getElementById('global_sede');
  if (profile && profile.rol !== 'admin') {
    sedeSelect.value = profile.sede_asignada || 'LIMA (Sede Central)';
    sedeSelect.disabled = true; // Guards cannot change sede
  } else if (profile && profile.rol === 'admin') {
    document.getElementById('nav-admin').style.display = 'flex';
    document.getElementById('nav-actas').style.display = 'flex';
    sedeSelect.disabled = false;
  }
}

function navigateTo(targetViewId) {
  views.forEach(view => view.classList.remove('active'));
  const targetView = document.getElementById(targetViewId);
  if (targetView) targetView.classList.add('active');
  
  navItems.forEach(item => {
    if (item.getAttribute('data-target') === targetViewId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Run specific view loaders
  if(targetViewId === 'view-ingreso') loadPersonas();
  if(targetViewId === 'view-lista') loadRegistrosActivos();
  if(targetViewId === 'view-admin') loadAdminPanel();
  if(targetViewId === 'view-actas') loadActas();
  if(targetViewId === 'view-detalles') loadPersonalDropdowns();
  if(targetViewId === 'view-historial') {
    loadHistorial();
  }
  
  currentView = targetViewId;
}

// === PANTALLA: REGISTRAR ===
async function handleSaveVisitante() {
  if (signaturePad.isEmpty()) {
    Swal.fire("Atención", "El visitante debe firmar el acta.", "warning");
    return;
  }
  if (!document.getElementById('reg_acepto_acuerdo').checked) {
    Swal.fire("Atención", "Debe aceptar el Acuerdo de Confidencialidad.", "warning");
    return;
  }

  const btn = document.getElementById('btn-save-visitor');
  const originalText = btn.innerText;
  
  try {
    btn.innerText = "Guardando...";
    btn.disabled = true;

    const data = {
      dni: document.getElementById('reg_dni').value.trim(),
      ruc: document.getElementById('reg_ruc').value.trim(),
      nombres: document.getElementById('reg_nombres').value.trim(),
      ape_pat: document.getElementById('reg_ape_pat').value.trim(),
      ape_mat: document.getElementById('reg_ape_mat').value.trim(),
      empresa: document.getElementById('reg_empresa').value.trim(),
      correo: document.getElementById('reg_correo').value.trim(),
      comentario_correo: document.getElementById('reg_comentario_correo').value.trim()
    };

    const isExtranjero = document.getElementById('reg_is_extranjero').checked;

    if (!data.dni || !data.nombres || !data.ape_pat) {
      Swal.fire("Atención", "El documento, nombres y apellido paterno son obligatorios.", "warning");
      return;
    }
    
    if (!isExtranjero && data.dni.length !== 8) {
      Swal.fire("Atención", "El DNI nacional debe tener 8 dígitos. Si es extranjero, active el selector arriba.", "warning");
      return;
    }

    if (document.getElementById('reg_sin_correo').checked && !data.comentario_correo.trim()) {
      Swal.fire("Atención", "Debe ingresar el motivo por el cual no brinda correo.", "warning");
      return;
    }

    // Generate PDF & Upload
    const sigUrl = signaturePad.toDataURL();
    const pdfBytes = await generateAcuerdoPDF({nombres: data.nombres, apellidos: `${data.ape_pat} ${data.ape_mat}`, dni: data.dni, empresa: data.empresa}, sigUrl);
    const filename = `acuerdos/${data.dni}_${Date.now()}.pdf`;
    const firmaUrl = await uploadFirmaPdf(pdfBytes, filename);

    // Save Visitante
    data.firma_url = firmaUrl;
    await createVisitante(data);

    // ==========================================
    // ENVIAR CORREO (Supabase Edge Function)
    // ==========================================
    if (data.correo && data.correo !== 'auricasac@gmail.com') {
      try {
        const emailHtml = getWelcomeEmailHtml(data);
        // firmaUrl ya es la URL publica del bucket 'firmas' (la devuelve uploadFirmaPdf)
        const pdfUrl = firmaUrl;
        
        // Llamada a la Edge Function segura en Supabase
        const { error: funcError } = await supabase.functions.invoke('send-email', {
          body: {
            destinatario: data.correo,
            asunto: `Acuerdo de Confidencialidad - ${data.nombres} ${data.ape_pat}`,
            htmlBody: emailHtml,
            pdfUrl
          }
        });

        if (funcError) {
          console.error("Error desde Edge Function:", funcError);
        }
      } catch (emailErr) {
        console.error("Error enviando correo:", emailErr);
      }
    }

    Swal.fire({
      title: '¡Registrado!',
      text: 'Visitante y acta guardados con éxito.',
      icon: 'success',
      confirmButtonColor: '#245187'
    });
    
    // Reset Form
    ['reg_dni','reg_ruc','reg_nombres','reg_ape_pat','reg_ape_mat','reg_empresa','reg_correo','reg_comentario_correo'].forEach(id => document.getElementById(id).value = '');
    signaturePad.clear();
    const chkSinCorreo = document.getElementById('reg_sin_correo');
    chkSinCorreo.checked = false;
    chkSinCorreo.dispatchEvent(new Event('change'));
    document.getElementById('reg_acepto_acuerdo').checked = false;

    // Go to Ingreso to select them
    navigateTo('view-ingreso');

  } catch (error) {
    Swal.fire("Error", "Ocurrió un error al guardar: " + error.message, "error");
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

// === PANTALLA: INGRESO ===
async function loadPersonas(searchQuery = '') {
  const tbody = document.getElementById('ingreso-table-body');
  try {
    const personas = await getPersonas(searchQuery);
    tbody.innerHTML = '';
    
    if (personas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No se encontraron visitantes.</td></tr>';
      return;
    }

    personas.forEach(p => {
      const testEmails = ['auricasac@gmail.com', 'auriasac@gmail.com', 'sc@gmail.com', 'aurica@gmail.com'];
      const isTestEmail = p.correo && testEmails.includes(p.correo.toLowerCase());
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.nombres}</td>
        <td>${p.apellido_paterno} ${p.apellido_materno || ''}</td>
        <td>${p.dni}</td>
        <td style="display:flex; align-items:center; gap:8px;">
          <button class="btn btn-seleccionar" style="padding: 6px 16px;">Seleccionar</button>
          ${isTestEmail ? '<i class="ph-fill ph-warning-circle text-2xl" style="color:#d9534f; cursor:help;" title="Correo de prueba detectado"></i>' : ''}
        </td>
      `;
      tr.querySelector('.btn-seleccionar').addEventListener('click', async () => {
        if (isTestEmail) {
          const { value: formValues, isConfirmed } = await Swal.fire({
            title: 'Actualizar Correo',
            html: `
              <div style="background-color: #fff3f3; border: 1px solid #ffcdd2; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin-bottom:8px; color:#d9534f; font-weight:bold; font-size: 1.1rem;">Este visitante registró un correo temporal previo.</p>
                <p style="font-size:1rem; color: #333;"><strong>Motivo registrado:</strong> ${p.comentario_correo || 'No especificado'}</p>
              </div>
              <div style="text-align: left;">
                <label style="font-weight: bold; color: var(--primary-blue); display: block; margin-bottom: 8px;">Ingrese un correo electrónico real:</label>
                <input id="swal-correo" class="swal2-input swal-custom-input" placeholder="ejemplo@correo.com" value="" style="width: 100%; margin: 0 0 24px 0;">
                
                <label style="font-weight: bold; color: #555; display: block; margin-bottom: 8px;">O justifique si se mantiene sin correo:</label>
                <input id="swal-comentario" class="swal2-input swal-custom-input" placeholder="Nuevo motivo (Obligatorio si no pone correo)" value="${p.comentario_correo || ''}" style="width: 100%; margin: 0;">
              </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Actualizar y Continuar',
            cancelButtonText: 'Cancelar Ingreso',
            customClass: {
              popup: 'swal-custom-popup',
              title: 'swal-custom-title',
              confirmButton: 'swal-custom-confirm',
              cancelButton: 'swal-custom-cancel'
            },
            preConfirm: () => {
              const correo = document.getElementById('swal-correo').value.trim();
              const comentario = document.getElementById('swal-comentario').value.trim();
              if (!correo && !comentario) {
                Swal.showValidationMessage('Debe ingresar un correo real o un motivo justificando por qué sigue sin correo.');
              }
              return { correo, comentario };
            }
          });

          if (isConfirmed) {
            let finalCorreo = formValues.correo;
            let finalComentario = null;
            let correoActualizadoAReal = false;
            
            if (!finalCorreo) {
              finalCorreo = p.correo; // Mantener el correo de prueba actual
              finalComentario = formValues.comentario;
            } else {
              correoActualizadoAReal = true;
            }
            
            try {
              // 1. Mostrar toast indicando proceso
              const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timerProgressBar: true,
                didOpen: () => { Swal.showLoading(); }
              });
              
              if (correoActualizadoAReal && p.firma_url) {
                Toast.fire({ title: 'Actualizando y enviando acta...' });
              } else {
                Toast.fire({ title: 'Actualizando...' });
              }

              // 2. Actualizar en BD
              await updateCorreoPersona(p.id, finalCorreo, finalComentario);
              p.correo = finalCorreo; 
              p.comentario_correo = finalComentario;

              // 3. Enviar correo retroactivo si aplica
              if (correoActualizadoAReal && p.firma_url) {
                try {
                  const emailHtml = getWelcomeEmailHtml({
                    nombres: p.nombres,
                    ape_pat: p.apellido_paterno,
                    ape_mat: p.apellido_materno,
                    dni: p.dni,
                    empresa: p.empresa
                  });
                  // p.firma_url ya es la URL publica valida (bucket 'firmas')
                  
                  await supabase.functions.invoke('send-email', {
                    body: {
                      destinatario: finalCorreo,
                      asunto: `Acuerdo de Confidencialidad - ${p.nombres} ${p.apellido_paterno}`,
                      htmlBody: emailHtml,
                      pdfUrl: p.firma_url
                    }
                  });
                } catch (emailErr) {
                  console.error("Error enviando correo retroactivo:", emailErr);
                }
              }
              
              Swal.close();
              openDetalles(p);
            } catch(e) {
              Swal.fire("Error", "No se pudo actualizar el correo.", "error");
            }
          }
        } else {
          openDetalles(p);
        }
      });
      tbody.appendChild(tr);
    });
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color:red;">Error al cargar.</td></tr>`;
  }
}

function openDetalles(persona) {
  currentSelectedPersona = persona;
  document.getElementById('det_nombre').value = persona.nombres;
  document.getElementById('det_apellido').value = `${persona.apellido_paterno} ${persona.apellido_materno || ''}`;
  document.getElementById('det_dni').value = persona.dni;
  document.getElementById('det_empresa').value = persona.empresa || '';
  
  navigateTo('view-detalles');
}

// === PANTALLA: DETALLES DE INGRESO ===
async function loadPersonalDropdowns() {
  const selAutoriza = document.getElementById('det_autoriza');
  const selResguardo = document.getElementById('det_resguardo');
  
  if (!selAutoriza || !selResguardo) return;
  
  // Guardar los valores actuales si los hay
  const currAuto = selAutoriza.value;
  const currResg = selResguardo.value;
  
  // Resetear
  selAutoriza.innerHTML = '<option value="">Cargando...</option>';
  selResguardo.innerHTML = '<option value="">Cargando...</option>';
  
  try {
    const personal = await getPersonalAutorizado();
    
    let htmlAuto = '<option value="">Seleccione o busque...</option>';
    let htmlResg = '<option value="">Seleccione o busque...</option>';
    
    personal.forEach(p => {
      if (p.rol === 'autorizador') {
        htmlAuto += `<option value="${p.nombre}">${p.nombre}</option>`;
      } else if (p.rol === 'resguardo') {
        htmlResg += `<option value="${p.nombre}">${p.nombre}</option>`;
      }
    });
    
    selAutoriza.innerHTML = htmlAuto;
    selResguardo.innerHTML = htmlResg;
    
    // Restaurar si existían
    if (currAuto) selAutoriza.value = currAuto;
    if (currResg) selResguardo.value = currResg;
    
  } catch (error) {
    selAutoriza.innerHTML = '<option value="">Error al cargar</option>';
    selResguardo.innerHTML = '<option value="">Error al cargar</option>';
  }
}

async function handleSaveIngreso() {
  if (!currentSelectedPersona) {
    Swal.fire('Atención', 'Seleccione primero un visitante de la lista.', 'warning');
    return;
  }
  
  const sedeSelect = document.getElementById('global_sede');
  const btn = document.getElementById('btn-save-ingreso');
  const originalHtml = btn.innerHTML;
  // ── Campos obligatorios: todos los datos de la visita ──────────────────
  const camposObligatorios = [
    { id: 'det_motivo', label: 'Motivo de Visita' },
    { id: 'det_autoriza', label: 'Autoriza' },
    { id: 'det_resguardo', label: 'Resguardo Responsable' },
    { id: 'det_procedencia', label: 'Procedencia' },
    { id: 'det_comentario', label: 'Comentario' }
  ];
  // Un <select> sin opciones cargadas no se puede completar: avisamos de eso
  const sinOpciones = (el) =>
    !!el && el.tagName === 'SELECT' &&
    Array.from(el.options).filter((o) => String(o.value || '').trim() !== '').length === 0;

  const faltantes = [];
  camposObligatorios.forEach((c) => {
    const el = document.getElementById(c.id);
    const vacio = !el || String(el.value || '').trim() === '';
    if (el) el.classList.toggle('input-error', vacio);
    if (vacio) faltantes.push({ id: c.id, label: c.label, sinLista: sinOpciones(el) });
  });

  if (faltantes.length) {
    const items = faltantes.map((f) =>
      '<li>' + esc(f.label) + (f.sinLista ? ' <em>(la lista no tiene opciones cargadas)</em>' : '') + '</li>'
    ).join('');
    const hayListaVacia = faltantes.some((f) => f.sinLista);
    Swal.fire({
      title: 'Faltan datos obligatorios',
      html:
        '<div style="text-align:left;">Complete los siguientes campos antes de confirmar el ingreso:' +
        '<ul style="margin:12px 0 0 18px; color:#d9534f; font-weight:600;">' + items + '</ul>' +
        (hayListaVacia
          ? '<p style="margin-top:14px; font-size:0.85rem; color:#64748b;">Hay listas sin opciones: solicite al administrador que cargue el personal autorizado (tabla personal_autorizado).</p>'
          : '') +
        '</div>',
      icon: 'warning',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#245187'
    });
    const primero = document.getElementById(faltantes[0].id);
    if (primero) primero.focus();
    return;
  }
  
  try {
    btn.innerHTML = '...';
    btn.disabled = true;

    // VALIDACION: Evitar doble ingreso
    const isActive = await checkActiveRegistro(currentSelectedPersona.id);
    if (isActive) {
      Swal.fire({
        title: 'Ingreso Bloqueado',
        text: 'Esta persona ya se encuentra registrada en las instalaciones. Registre su salida antes de volver a ingresarla.',
        icon: 'warning',
        confirmButtonColor: '#245187'
      });
      return;
    }

    const registroData = {
      persona_id: currentSelectedPersona.id,
      motivo: document.getElementById('det_motivo').value,
      autoriza: document.getElementById('det_autoriza').value,
      resguardo: document.getElementById('det_resguardo').value,
      procedencia: document.getElementById('det_procedencia').value,
      comentario: document.getElementById('det_comentario').value,
      sede: sedeSelect ? sedeSelect.value : 'LIMA (Sede Central)'
    };

    await createRegistro(registroData);
    
    Swal.fire({
      title: 'Ingreso Autorizado',
      text: 'Se registró correctamente en ' + registroData.sede,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
    
    // Clear
    ['det_motivo','det_autoriza','det_resguardo','det_procedencia','det_comentario'].forEach(id => document.getElementById(id).value = '');
    navigateTo('view-lista');
    
  } catch (error) {
    Swal.fire("Error", "Error al procesar: " + error.message, "error");
  } finally {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
}

// === PANTALLA: LISTA (Activos) ===
async function loadRegistrosActivos() {
  const tbody = document.getElementById('lista-table-body');
  const sedeFiltro = document.getElementById('global_sede').value;
  try {
    const registros = await getRegistrosActivos(sedeFiltro);
    tbody.innerHTML = '';
    
    if (registros.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay nadie dentro en este momento.</td></tr>';
      return;
    }

    registros.forEach(r => {
      const p = r.personas;
      const dIngreso = new Date(r.fecha_ingreso).toLocaleString('es-PE', { hour12: false });
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.nombres}</td>
        <td>${p.apellido_paterno}</td>
        <td>${p.dni}</td>
        <td>${p.empresa || '-'}</td>
        <td>${dIngreso}</td>
        <td><button class="btn btn-salida" style="font-size:0.85rem; padding:6px 12px;">Registrar salida</button></td>
        <td><button class="btn-icon btn-comentario"><i class="ph ph-chat-text"></i></button></td>
      `;
      
      tr.querySelector('.btn-salida').addEventListener('click', async () => {
        // Confirmacion: evita cerrar una visita por un toque accidental
        const nombreVisitante = (p.nombres + ' ' + (p.apellido_paterno || '')).trim();
        const confirma = await Swal.fire({
          title: '\u00bfRegistrar salida?',
          html:
            '<div style="text-align:center; line-height:1.6;">' +
            '<div style="font-size:1.15rem; font-weight:700; color:#245187;">' + esc(nombreVisitante) + '</div>' +
            '<div style="font-size:0.95rem; color:#666; margin-top:4px;">DNI ' + esc(p.dni || '') + '</div>' +
            '<div style="font-size:0.95rem; color:#666; margin-top:12px;">Ingres\u00f3: ' + esc(dIngreso) + '</div>' +
            '<div style="font-size:0.85rem; color:#94a3b8; margin-top:14px;">Esta acci\u00f3n cierra su visita y no se puede deshacer.</div>' +
            '</div>',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'S\u00ed, registrar salida',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#245187',
          cancelButtonColor: '#94a3b8',
          reverseButtons: true,
          focusCancel: true,
          customClass: {
            popup: 'swal-custom-popup',
            title: 'swal-custom-title',
            confirmButton: 'swal-custom-confirm',
            cancelButton: 'swal-custom-cancel'
          }
        });
        if (!confirma.isConfirmed) return;
        try {
          await registrarSalida(r.id);
          Swal.fire({
            title: 'Salida registrada',
            html: '<b>' + esc(nombreVisitante) + '</b> ya no figura dentro de las instalaciones.',
            icon: 'success',
            confirmButtonColor: '#245187'
          });
          loadRegistrosActivos();
        } catch(e) {
          Swal.fire("Error", "No se pudo registrar la salida.", "error");
        }
      });

      tr.querySelector('.btn-comentario').addEventListener('click', () => {
        Swal.fire({
          title: 'Comentario',
          html: `<div style="font-size: 1.25rem; font-weight: 500; color: #333; margin: 10px 0;">${r.comentario || 'Sin comentarios registrados.'}</div>`,
          icon: 'info'
        });
      });
      
      tbody.appendChild(tr);
    });
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color:red;">Error al cargar.</td></tr>';
  }
}

// === PANTALLA: HISTORIAL ===
const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function initHistorialControls() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');

  const todayStr = `${y}-${m}-${d}`;
  const monthStr = `${y}-${m}`;
  const monthStartStr = `${y}-${m}-01`;

  const histDate = document.getElementById('historial-date');
  const histMonth = document.getElementById('historial-month');
  const histStartDate = document.getElementById('historial-start-date');
  const histEndDate = document.getElementById('historial-end-date');

  if (histDate) histDate.value = todayStr;
  if (histMonth) histMonth.value = monthStr;
  if (histStartDate) histStartDate.value = monthStartStr;
  if (histEndDate) histEndDate.value = todayStr;

  // Tabs de selección de modo (Día, Mes, Rango)
  const tabBtns = document.querySelectorAll('.hist-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      setHistorialMode(mode);
    });
  });

  // Eventos change en inputs para auto-filtrar
  histDate?.addEventListener('change', () => {
    if (currentHistorialFilter.mode === 'dia') loadHistorial();
  });
  histMonth?.addEventListener('change', () => {
    if (currentHistorialFilter.mode === 'mes') loadHistorial();
  });
  histStartDate?.addEventListener('change', () => {
    if (currentHistorialFilter.mode === 'rango') loadHistorial();
  });
  histEndDate?.addEventListener('change', () => {
    if (currentHistorialFilter.mode === 'rango') loadHistorial();
  });

  // Botón Consultar
  document.getElementById('btn-buscar-historial')?.addEventListener('click', () => {
    loadHistorial();
  });
}

function setHistorialMode(mode) {
  currentHistorialFilter.mode = mode;

  // Actualizar estilo visual de las pestañas
  document.querySelectorAll('.hist-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-mode') === mode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Mostrar / Ocultar contenedores según el modo
  const grpDia = document.getElementById('hist-group-dia');
  const grpMes = document.getElementById('hist-group-mes');
  const grpRango = document.getElementById('hist-group-rango');

  if (grpDia) grpDia.style.display = (mode === 'dia' ? 'block' : 'none');
  if (grpMes) grpMes.style.display = (mode === 'mes' ? 'block' : 'none');
  if (grpRango) grpRango.style.display = (mode === 'rango' ? 'flex' : 'none');

  // Recargar datos con el nuevo modo seleccionado
  loadHistorial();
}

async function loadHistorial() {
  const tbody = document.getElementById('historial-table-body');
  const counterEl = document.getElementById('historial-total-count');
  const sedeFiltro = document.getElementById('global_sede')?.value || null;

  let startDate = null;
  let endDate = null;
  let periodoLabel = '';
  let filenameSuffix = '';

  const mode = currentHistorialFilter.mode;

  if (mode === 'dia') {
    const dateVal = document.getElementById('historial-date')?.value;
    if (!dateVal) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">Seleccione una fecha válida.</td></tr>';
      if (counterEl) counterEl.textContent = '0';
      return;
    }
    startDate = dateVal + 'T00:00:00';
    endDate = dateVal + 'T23:59:59.999';
    periodoLabel = 'Día: ' + formatDisplayDate(dateVal);
    filenameSuffix = dateVal;
  } else if (mode === 'mes') {
    const monthVal = document.getElementById('historial-month')?.value;
    if (!monthVal) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">Seleccione un mes válido.</td></tr>';
      if (counterEl) counterEl.textContent = '0';
      return;
    }
    const [y, m] = monthVal.split('-').map(Number);
    // Inicio y fin del mes en tiempo local
    const dStart = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const dEnd = new Date(y, m, 0, 23, 59, 59, 999);

    startDate = dStart;
    endDate = dEnd;
    const nombreMes = MESES_ES[m - 1] || '';
    periodoLabel = `Mes: ${nombreMes} ${y}`;
    filenameSuffix = `Mes_${nombreMes}_${y}`;
  } else if (mode === 'rango') {
    const startVal = document.getElementById('historial-start-date')?.value;
    const endVal = document.getElementById('historial-end-date')?.value;

    if (!startVal || !endVal) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">Seleccione fecha desde y hasta.</td></tr>';
      if (counterEl) counterEl.textContent = '0';
      return;
    }
    if (startVal > endVal) {
      Swal.fire('Atención', 'La fecha inicial no puede ser posterior a la fecha final.', 'warning');
      tbody.innerHTML = '<tr><td colspan="9" class="text-center" style="color:#d32f2f;">Rango de fechas inválido.</td></tr>';
      if (counterEl) counterEl.textContent = '0';
      return;
    }
    startDate = startVal + 'T00:00:00';
    endDate = endVal + 'T23:59:59.999';
    periodoLabel = `Del ${formatDisplayDate(startVal)} al ${formatDisplayDate(endVal)}`;
    filenameSuffix = `Rango_${startVal}_al_${endVal}`;
  }

  currentHistorialFilter.startDate = startDate;
  currentHistorialFilter.endDate = endDate;
  currentHistorialFilter.periodoLabel = periodoLabel;
  currentHistorialFilter.filenameSuffix = filenameSuffix;

  tbody.innerHTML = '<tr><td colspan="9" class="text-center">Cargando registros...</td></tr>';

  try {
    const registros = await getHistorial({ startDate, endDate }, sedeFiltro);
    currentHistorialData = registros;

    if (counterEl) counterEl.textContent = String(registros.length);
    tbody.innerHTML = '';

    if (registros.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center">No hay registros de visitas para el período seleccionado (${esc(periodoLabel)}).</td></tr>`;
      return;
    }

    registros.forEach(r => {
      const p = r.personas || {};
      const dIngreso = new Date(r.fecha_ingreso).toLocaleString('es-PE', { hour12: false });
      const dSalida = r.fecha_salida ? new Date(r.fecha_salida).toLocaleString('es-PE', { hour12: false }) : '-';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${esc(p.dni || '-')}</td>
        <td>${esc(p.nombres || '-')}</td>
        <td>${esc(((p.apellido_paterno || '') + ' ' + (p.apellido_materno || '')).trim() || '-')}</td>
        <td>${dIngreso}</td>
        <td>${dSalida}</td>
        <td>${esc(r.autoriza || '-')}</td>
        <td>${esc(r.procedencia || '-')}</td>
        <td>${esc(r.comentario || '-')}</td>
        <td>${esc(r.resguardo_responsable || '-')}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch(e) {
    console.error("Error al cargar historial:", e);
    tbody.innerHTML = '<tr><td colspan="9" class="text-center" style="color:red;">Error al cargar historial.</td></tr>';
    if (counterEl) counterEl.textContent = '0';
  }
}

// === PANTALLA: ACTAS ===
let actasGlobalData = []; // Para poder exportarlas a Excel

async function loadActas() {
  const tbody = document.getElementById('actas-table-body');
  try {
    const actas = await getActasFirmadas();
    actasGlobalData = actas; // Guardar referencia global
    tbody.innerHTML = '';
    
    if (actas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay actas registradas.</td></tr>';
      return;
    }

    actas.forEach(a => {
      const fecha = new Date(a.created_at).toLocaleString('es-PE', { hour12: false });
      const apellidos = `${a.apellido_paterno} ${a.apellido_materno || ''}`;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${a.dni}</td>
        <td>${a.nombres} ${apellidos}</td>
        <td>${a.empresa || '-'}</td>
        <td>${a.correo || '-'}</td>
        <td>${fecha}</td>
        <td>
          <button class="btn btn-view-pdf" style="padding:6px 12px; display:flex; align-items:center; gap:6px;">
            <i class="ph ph-file-pdf"></i> Ver Acta
          </button>
        </td>
      `;
      
      tr.querySelector('.btn-view-pdf').addEventListener('click', () => {
        if (a.firma_url) {
          window.open(a.firma_url, '_blank');
        } else {
          Swal.fire("Error", "No se encontró el enlace del documento.", "error");
        }
      });
      
      tbody.appendChild(tr);
    });
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color:red;">Error al cargar las actas.</td></tr>';
  }
}

// === EXPORTAR ACTAS A EXCEL (.xlsx) ===
document.getElementById('btn-export-actas')?.addEventListener('click', async () => {
  if (!actasGlobalData || actasGlobalData.length === 0) {
    Swal.fire("Atención", "No hay datos para exportar", "warning");
    return;
  }
  Swal.fire({
    title: 'Generando Excel...',
    html: 'Preparando el archivo, un momento.',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });
  try {
    await exportActasToExcel(actasGlobalData);
    Swal.close();
  } catch (err) {
    console.error('Error exportando actas:', err);
    Swal.fire('Error', 'No se pudo generar el Excel: ' + err.message, 'error');
  }
});
// === PANTALLA: ADMIN ===
async function loadAdminPanel() {
  const tbody = document.getElementById('admin-table-body');
  try {
    const perfiles = await getAllPerfiles();
    tbody.innerHTML = '';
    
    if (perfiles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay usuarios registrados.</td></tr>';
      return;
    }

    perfiles.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.email}</td>
        <td>
          <select class="input-field rol-select" style="padding:4px; margin:0;" data-id="${p.id}">
            <option value="vigilante" ${p.rol === 'vigilante' ? 'selected' : ''}>Vigilante</option>
            <option value="admin" ${p.rol === 'admin' ? 'selected' : ''}>Administrador</option>
          </select>
        </td>
        <td>
          <select class="input-field sede-select" style="padding:4px; margin:0;" data-id="${p.id}">
            <option value="LIMA (Sede Central)" ${p.sede_asignada === 'LIMA (Sede Central)' ? 'selected' : ''}>LIMA</option>
            <option value="Arequipa (Mineralab)" ${p.sede_asignada === 'Arequipa (Mineralab)' ? 'selected' : ''}>Mineralab</option>
            <option value="Arequipa (Gianlu)" ${p.sede_asignada === 'Arequipa (Gianlu)' ? 'selected' : ''}>Gianlu</option>
            <option value="Arequipa (Aurica)" ${p.sede_asignada === 'Arequipa (Aurica)' ? 'selected' : ''}>Aurica</option>
          </select>
        </td>
        <td><button class="btn btn-save-admin" data-id="${p.id}" style="padding:6px 12px;">Guardar</button></td>
      `;
      
      tr.querySelector('.btn-save-admin').addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const rol = tr.querySelector('.rol-select').value;
        const sede = tr.querySelector('.sede-select').value;
        try {
          await updatePerfilSede(id, sede, rol);
          Swal.fire({title: 'Actualizado', text: 'Permisos guardados', icon: 'success', toast: true, position: 'top-end', timer:2000, showConfirmButton:false});
        } catch(err) {
          Swal.fire("Error", "No se pudo actualizar.", "error");
        }
      });
      
      tbody.appendChild(tr);
    });
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="color:red;">Error al cargar perfiles.</td></tr>';
  }
}

// Start
document.addEventListener('DOMContentLoaded', init);
