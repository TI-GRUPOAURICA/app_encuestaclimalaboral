import { createClient } from '@supabase/supabase-js';
import { PREGUNTAS_OFICIALES } from '../data/preguntasData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('tu-proyecto')
);

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Nombres de tablas con sufijo _encuesta para aislamiento absoluto
export const TABLAS = {
  CONTROL_DNI: 'control_dni_encuesta',
  PREGUNTAS: 'preguntas_encuesta',
  RESPUESTAS: 'respuestas_clima_encuesta'
};

// 11 Áreas oficiales de la empresa
export const AREAS_DISPONIBLES = [
  'Administración y Finanzas',
  'Contabilidad',
  'Administración y Recursos Humanos',
  'Operaciones, Refinería, Fundición y Producción',
  'Laboratorio',
  'Mantenimiento',
  'Logística y Almacén',
  'Seguridad y Resguardo',
  'SSO, Gestión Ambiental y PTARI',
  'Comercial y Comercio Exterior',
  'TI y BI'
];

/**
 * =========================================================================
 * 1. VERIFICAR DNI Y PREVENIR DOBLE VOTO
 * =========================================================================
 */
export async function verificarDNIEnPadron(dni) {
  if (!isConfigured) {
    await new Promise(r => setTimeout(r, 300));
    return {
      success: true,
      exists: true,
      alreadyVoted: false,
      metadata: {
        sede: 'Lima',
        area: 'Operaciones, Refinería, Fundición y Producción',
        antiguedad: '1 a 3 años',
        tipo_puesto: 'Operativo'
      }
    };
  }

  try {
    const { data, error } = await supabase
      .from(TABLAS.CONTROL_DNI)
      .select('dni, sede, area, antiguedad, tipo_puesto, voto')
      .eq('dni', dni)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return {
        success: true,
        exists: false,
        alreadyVoted: false,
        metadata: null
      };
    }

    if (data.voto === true) {
      return {
        success: true,
        exists: true,
        alreadyVoted: true,
        metadata: null
      };
    }

    return {
      success: true,
      exists: true,
      alreadyVoted: false,
      metadata: {
        sede: data.sede || 'Lima',
        area: data.area || 'Operaciones, Refinería, Fundición y Producción',
        antiguedad: data.antiguedad || '1 a 3 años',
        tipo_puesto: data.tipo_puesto || 'Operativo'
      }
    };
  } catch (err) {
    console.error('Error al verificar DNI en Supabase:', err);
    return {
      success: false,
      exists: false,
      alreadyVoted: false,
      error: err.message,
      metadata: null
    };
  }
}

/**
 * =========================================================================
 * 2. LLAMADA 1: MARCAR ASISTENCIA EN CONTROL_DNI_ENCUESTA
 * =========================================================================
 * Solo actualiza 'voto: true'. NO guarda ni vincula respuestas.
 */
export async function registrarParticipacionDNI(dni) {
  if (!isConfigured) {
    await new Promise(r => setTimeout(r, 250));
    return { data: { dni, voto: true }, error: null };
  }

  try {
    const { data, error } = await supabase
      .from(TABLAS.CONTROL_DNI)
      .update({ 
        voto: true,
        fecha_participacion: new Date().toISOString()
      })
      .eq('dni', dni);

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.warn('Aviso al actualizar control_dni_encuesta:', err.message);
    return { data: null, error: err };
  }
}

/**
 * =========================================================================
 * 3. LLAMADA 2: GUARDAR RESPUESTAS ANÓNIMAS (43 PREGUNTAS)
 * =========================================================================
 * Almacena el payload completo de evaluación sin DNI ni nombre.
 * Los segmentos (Sede, Área, Antigüedad, Puesto) provienen del padrón asociado.
 */
export async function guardarRespuestasAnonimas({ metadata, respuestasMap }) {
  const sedeFinal = metadata?.sede || 'Lima';
  const areaFinal = metadata?.area || 'Operaciones, Refinería, Fundición y Producción';
  const antiguedadFinal = metadata?.antiguedad || '1 a 3 años';
  const puestoFinal = metadata?.tipo_puesto || 'Operativo';
  
  // Pregunta 39 es el eNPS (escala 0 al 10)
  const enps = respuestasMap['39'] ?? respuestasMap[39];
  const enpsNumber = enps !== undefined && enps !== null && !isNaN(Number(enps)) ? Number(enps) : null;

  const payload = {
    sede: sedeFinal,
    area: areaFinal,
    antiguedad: antiguedadFinal,
    tipo_puesto: puestoFinal,
    respuestas: respuestasMap || {},
    enps_score: enpsNumber,
    fecha_envio: new Date().toISOString()
  };

  if (!isConfigured) {
    console.log('[SUPABASE SIMULADO] Guardando respuestas anónimas:', payload);
    await new Promise(r => setTimeout(r, 450));
    return { data: [payload], error: null };
  }

  try {
    const { data, error } = await supabase
      .from(TABLAS.RESPUESTAS)
      .insert([payload]);

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Error al insertar en respuestas_clima_encuesta:', err);
    return { data: null, error: err };
  }
}

/**
 * =========================================================================
 * 4. OBTENER PREGUNTAS ACTIVAS (OFICIALES O SUPABASE)
 * =========================================================================
 */
export async function obtenerPreguntasActivas() {
  if (!isConfigured) {
    return PREGUNTAS_OFICIALES;
  }

  try {
    const { data, error } = await supabase
      .from(TABLAS.PREGUNTAS)
      .select('*')
      .eq('activa', true)
      .order('orden', { ascending: true });

    if (error || !data || data.length === 0) {
      return PREGUNTAS_OFICIALES;
    }
    return data;
  } catch (err) {
    console.warn('Cargando preguntas oficiales integradas:', err);
    return PREGUNTAS_OFICIALES;
  }
}

/**
 * =========================================================================
 * 5. MÓDULO ADMINISTRADOR: CARGA MASIVA DE PREGUNTAS Y PADRÓN
 * =========================================================================
 */
export async function adminSubirPreguntas(preguntasArray) {
  if (!isConfigured) {
    return { success: true, count: preguntasArray.length };
  }

  try {
    const { data, error } = await supabase
      .from(TABLAS.PREGUNTAS)
      .upsert(preguntasArray, { onConflict: 'orden' });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function adminSubirPadronDNI(colaboradoresArray) {
  if (!isConfigured) {
    return { success: true, count: colaboradoresArray.length };
  }

  try {
    const { data, error } = await supabase
      .from(TABLAS.CONTROL_DNI)
      .upsert(colaboradoresArray, { onConflict: 'dni' });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function adminObtenerTodasLasPreguntas() {
  if (!isConfigured) {
    return PREGUNTAS_OFICIALES;
  }

  try {
    const { data, error } = await supabase
      .from(TABLAS.PREGUNTAS)
      .select('*')
      .order('orden', { ascending: true });

    if (error || !data || data.length === 0) {
      return PREGUNTAS_OFICIALES;
    }
    return data;
  } catch (err) {
    return PREGUNTAS_OFICIALES;
  }
}

/**
 * =========================================================================
 * 6. DASHBOARD GERENCIAL: MÉTRICAS DE PARTICIPACIÓN EN VIVO
 * =========================================================================
 * Consulta control_dni_encuesta para saber cuántos ya votaron y cuántos faltan.
 */
export async function obtenerDashboardGerencial() {
  if (!isConfigured) {
    // Datos simulados de alta calidad para pruebas locales
    const mockColaboradores = [
      { dni: '72345678', nombre: 'Carlos Ramos', sede: 'Lima', area: 'Operaciones, Refinería, Fundición y Producción', tipo_puesto: 'Operativo', voto: true, fecha_participacion: '2026-10-27T10:15:00Z' },
      { dni: '12345678', nombre: 'Ana Valdivia', sede: 'Lima', area: 'Administración y Finanzas', tipo_puesto: 'Administrativo', voto: true, fecha_participacion: '2026-10-27T11:00:00Z' },
      { dni: '87654321', nombre: 'Luis Benítez', sede: 'Chala', area: 'Mantenimiento', tipo_puesto: 'Operativo', voto: false, fecha_participacion: null },
      { dni: '44556677', nombre: 'Elena Morales', sede: 'Arequipa', area: 'Laboratorio', tipo_puesto: 'Operativo', voto: true, fecha_participacion: '2026-10-27T09:30:00Z' },
      { dni: '11223344', nombre: 'Miguel Huamán', sede: 'Lima', area: 'Seguridad y Resguardo', tipo_puesto: 'Operativo', voto: false, fecha_participacion: null },
      { dni: '55667788', nombre: 'Patricia Flores', sede: 'Lima', area: 'SSO, Gestión Ambiental y PTARI', tipo_puesto: 'Administrativo', voto: false, fecha_participacion: null },
      { dni: '99887766', nombre: 'Roberto Castro', sede: 'Lima', area: 'Comercial y Comercio Exterior', tipo_puesto: 'Administrativo', voto: true, fecha_participacion: '2026-10-27T08:45:00Z' },
      { dni: '33445566', nombre: 'Lucía Vargas', sede: 'Lima', area: 'TI y BI', tipo_puesto: 'Administrativo', voto: false, fecha_participacion: null },
      { dni: '66778899', nombre: 'David Cárdenas', sede: 'Chala', area: 'Operaciones, Refinería, Fundición y Producción', tipo_puesto: 'Operativo', voto: true, fecha_participacion: '2026-10-27T11:30:00Z' },
      { dni: '77889900', nombre: 'Sofía Navarro', sede: 'Arequipa', area: 'Contabilidad', tipo_puesto: 'Administrativo', voto: false, fecha_participacion: null }
    ];
    return procesarMetricas(mockColaboradores);
  }

  try {
    const { data, error } = await supabase
      .from(TABLAS.CONTROL_DNI)
      .select('dni, nombre, sede, area, antiguedad, tipo_puesto, voto, fecha_participacion')
      .order('area', { ascending: true });

    if (error) throw error;
    return procesarMetricas(data || []);
  } catch (err) {
    console.error('Error al obtener dashboard gerencial:', err);
    return null;
  }
}

function procesarMetricas(colaboradores) {
  // Filtrar registros demo si existieran
  const demoDnis = ['72345678', '12345678', '87654321', '44556677'];
  const listaOficial = (colaboradores || []).filter(c => 
    !demoDnis.includes(c.dni) && 
    !c.nombre?.toLowerCase().includes('demo') && 
    !c.nombre?.toLowerCase().includes('inactivo')
  );

  const total = listaOficial.length;
  const participaron = listaOficial.filter(c => c.voto === true).length;
  const faltan = total - participaron;
  const porcentaje = total > 0 ? Math.round((participaron / total) * 100) : 0;

  // Desglose por Sede
  const porSede = {};
  // Desglose por Área
  const porArea = {};
  // Desglose por Puesto
  const porPuesto = {};

  listaOficial.forEach(c => {
    // Sede
    const sedeKey = c.sede || 'Sin Sede';
    if (!porSede[sedeKey]) porSede[sedeKey] = { total: 0, votaron: 0 };
    porSede[sedeKey].total++;
    if (c.voto) porSede[sedeKey].votaron++;

    // Área
    const areaKey = c.area || 'Sin Área';
    if (!porArea[areaKey]) porArea[areaKey] = { total: 0, votaron: 0 };
    porArea[areaKey].total++;
    if (c.voto) porArea[areaKey].votaron++;

    // Puesto
    const puestoKey = c.tipo_puesto || 'Operativo';
    if (!porPuesto[puestoKey]) porPuesto[puestoKey] = { total: 0, votaron: 0 };
    porPuesto[puestoKey].total++;
    if (c.voto) porPuesto[puestoKey].votaron++;
  });

  return {
    total,
    participaron,
    faltan,
    porcentaje,
    porSede,
    porArea,
    porPuesto,
    colaboradores: listaOficial
  };
}

/**
 * =========================================================================
 * 7. OBTENER RESULTADOS ANÓNIMOS DE CLIMA LABORAL (PEOPLE ANALYTICS)
 * =========================================================================
 * Consulta respuestas_clima_encuesta para análisis estadístico y gerencial.
 */
export async function obtenerRespuestasClima() {
  if (!isConfigured) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from(TABLAS.RESPUESTAS)
      .select('*')
      .order('fecha_envio', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error al obtener respuestas de clima:', err);
    return { data: [], error: err.message };
  }
}



