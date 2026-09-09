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

// === DOM Elements ===
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
const navigateBtns = document.querySelectorAll('[data-navigate]');

let signaturePad = null;
let currentSelectedPersona = null;
let currentUserProfile = null;
let currentView = 'view-inicio';
let currentHistorialData = [];

async function init() {
  // Escuchar cambios de autenticación
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Evento Auth:", event);
    if (event === 'SIGNED_IN' && !currentUserProfile) {
      // Setup interface directly without reloading
      const { profile } = await getSession();
      if(profile) setupInterface(profile);
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

  // Load PDF Preview
  async function loadPreviewPDF() {
    try {
      const iframe = document.getElementById('iframe-acuerdo-preview');
      if (iframe) {
        const emptyInfo = { nombres: '________________', apellidos: '________________', dni: '________' };
        const pdfBytes = await generateAcuerdoPDF(emptyInfo, null);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        iframe.src = url;
      }
    } catch (err) {
      console.warn("Error cargando preview del PDF:", err);
    }
  }
  loadPreviewPDF();

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

  // 6. Search in Ingreso screen
  document.getElementById('search_ingreso_dni')?.addEventListener('input', (e) => {
    loadPersonas(e.target.value);
  });

  // 7. Date picker in Historial
  const histDate = document.getElementById('historial-date');
  if(histDate) {
    // Set default local date
    const today = new Date();
    const localDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    histDate.value = localDate;
    
    histDate.addEventListener('change', (e) => loadHistorial(e.target.value));
  }

  // 8. Sede selector change (for Admins)
  document.getElementById('global_sede')?.addEventListener('change', () => {
    if (currentView === 'view-lista') loadRegistrosActivos();
    if (currentView === 'view-historial') loadHistorial(document.getElementById('historial-date').value);
  });

  // 9. Export Historial to Excel
  document.getElementById('btn-export-historial')?.addEventListener('click', () => {
    if (currentHistorialData.length === 0) {
      Swal.fire("Atención", "No hay datos en el historial para exportar.", "warning");
      return;
    }
    
    // Generar CSV
    const headers = ['DNI', 'Nombres', 'Apellidos', 'Empresa', 'Ingreso', 'Salida', 'Autoriza', 'Procedencia', 'Comentario', 'Resguardo Responsable', 'Sede'];
    const rows = currentHistorialData.map(r => {
      const p = r.personas || {};
      const dIngreso = new Date(r.fecha_ingreso).toLocaleString('es-PE', { hour12: false });
      const dSalida = r.fecha_salida ? new Date(r.fecha_salida).toLocaleString('es-PE', { hour12: false }) : '-';
      return [
        `"${p.dni || ''}"`,
        `"${p.nombres || ''}"`,
        `"${(p.apellido_paterno || '') + ' ' + (p.apellido_materno || '')}"`,
        `"${p.empresa || ''}"`,
        `"${dIngreso}"`,
        `"${dSalida}"`,
        `"${r.autoriza || ''}"`,
        `"${r.procedencia || ''}"`,
        `"${r.comentario || ''}"`,
        `"${r.resguardo_responsable || ''}"`,
        `"${r.sede || ''}"`
      ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const dateSelected = document.getElementById('historial-date').value;
    link.setAttribute("download", `Historial_Visitas_Aurica_${dateSelected}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

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
    const d = document.getElementById('historial-date').value;
    loadHistorial(d);
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
        const { data: publicData } = supabase.storage.from('acuerdos_pdf').getPublicUrl(firmaUrl);
        
        // Llamada a la Edge Function segura en Supabase
        const { error: funcError } = await supabase.functions.invoke('send-email', {
          body: {
            destinatario: data.correo,
            asunto: `Acuerdo de Confidencialidad - ${data.nombres} ${data.ape_pat}`,
            htmlBody: emailHtml,
            pdfUrl: publicData?.publicUrl || firmaUrl
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
                  const { data: publicData } = supabase.storage.from('acuerdos_pdf').getPublicUrl(p.firma_url);
                  
                  await supabase.functions.invoke('send-email', {
                    body: {
                      destinatario: finalCorreo,
                      asunto: `Acuerdo de Confidencialidad - ${p.nombres} ${p.apellido_paterno}`,
                      htmlBody: emailHtml,
                      pdfUrl: publicData?.publicUrl || p.firma_url
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
  if (!currentSelectedPersona) return;
  
  const sedeSelect = document.getElementById('global_sede');
  const btn = document.getElementById('btn-save-ingreso');
  const originalHtml = btn.innerHTML;
  
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
        try {
          await registrarSalida(r.id);
          Swal.fire({
            title: 'Salida Registrada',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
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
async function loadHistorial(dateString) {
  const tbody = document.getElementById('historial-table-body');
  const sedeFiltro = document.getElementById('global_sede').value;
  try {
    const registros = await getHistorial(dateString, sedeFiltro);
    currentHistorialData = registros; // Save for export
    tbody.innerHTML = '';
    
    if (registros.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">No hay historial para esta fecha.</td></tr>';
      return;
    }

    registros.forEach(r => {
      const p = r.personas;
      const dIngreso = new Date(r.fecha_ingreso).toLocaleString('es-PE', { hour12: false });
      const dSalida = r.fecha_salida ? new Date(r.fecha_salida).toLocaleString('es-PE', { hour12: false }) : '-';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.dni}</td>
        <td>${p.nombres}</td>
        <td>${p.apellido_paterno} ${p.apellido_materno || ''}</td>
        <td>${dIngreso}</td>
        <td>${dSalida}</td>
        <td>${r.autoriza || '-'}</td>
        <td>${r.procedencia || '-'}</td>
        <td>${r.comentario || '-'}</td>
        <td>${r.resguardo_responsable || '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center" style="color:red;">Error al cargar.</td></tr>';
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

// === EXPORTAR ACTAS A EXCEL (CSV) ===
document.getElementById('btn-export-actas')?.addEventListener('click', () => {
  if (!actasGlobalData || actasGlobalData.length === 0) {
    Swal.fire("Atención", "No hay datos para exportar", "warning");
    return;
  }
  
  // Crear contenido CSV (Usamos punto y coma para Excel en español)
  const cabeceras = ["DNI", "Nombres y Apellidos", "Empresa", "Correo", "Fecha de Registro"];
  const filasCSV = [cabeceras.join(";")];
  
  actasGlobalData.forEach(a => {
    const fecha = new Date(a.created_at).toLocaleString('es-PE', { hour12: false });
    const apellidos = `${a.apellido_paterno} ${a.apellido_materno || ''}`;
    // Limpiar punto y coma para no romper el CSV
    const empresa = (a.empresa || '').replace(/;/g, ''); 
    const nombresFull = (a.nombres + ' ' + apellidos).replace(/;/g, '');
    const correo = (a.correo || '').replace(/;/g, '');
    
    const fila = [a.dni, nombresFull, empresa, correo, fecha].join(";");
    filasCSV.push(fila);
  });
  
  const csvBlob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), filasCSV.join("\r\n")], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(csvBlob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Registro_Actas_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
