import { supabase } from './supabase.js';

export async function createVisitante(data) {
  const { data: result, error } = await supabase
    .from('personas')
    .insert([{
      dni: data.dni,
      ruc: data.ruc,
      nombres: data.nombres,
      apellido_paterno: data.ape_pat,
      apellido_materno: data.ape_mat,
      empresa: data.empresa,
      correo: data.correo,
      comentario_correo: data.comentario_correo,
      firma_url: data.firma_url,
      tipo: 'visitante'
    }])
    .select()
    .single();

  if (error) {
    console.error("Error saving visitante:", error);
    throw error;
  }
  return result;
}

export async function uploadFirmaPdf(pdfBytes, filename) {
  const { data, error } = await supabase.storage
    .from('firmas')
    .upload(filename, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (error) {
    console.error("Error uploading PDF:", error);
    throw error;
  }
  
  const { data: publicUrlData } = supabase.storage
    .from('firmas')
    .getPublicUrl(filename);
    
  return publicUrlData.publicUrl;
}

export async function createRegistro(data) {
  const { data: result, error } = await supabase
    .from('registros')
    .insert([{
      persona_id: data.persona_id,
      motivo_visita: data.motivo,
      autoriza: data.autoriza,
      resguardo_responsable: data.resguardo,
      procedencia: data.procedencia,
      comentario: data.comentario,
      sede: data.sede
    }])
    .select();

  if (error) {
    console.error("Error saving registro:", error);
    throw error;
  }
  return result;
}

export async function checkActiveRegistro(personaId) {
  // Checks if the persona has a record with fecha_salida IS NULL for today (or simply IS NULL, meaning they haven't left)
  const { data, error } = await supabase
    .from('registros')
    .select('id')
    .eq('persona_id', personaId)
    .is('fecha_salida', null)
    .limit(1);
    
  if (error) {
    console.error("Error checking active registro:", error);
    throw error;
  }
  return data && data.length > 0;
}

export async function getPersonas(searchQuery = '') {
  let query = supabase
    .from('personas')
    .select('id, dni, nombres, apellido_paterno, apellido_materno, empresa, correo, comentario_correo, firma_url')
    .order('created_at', { ascending: false });
    
  if (searchQuery) {
    query = query.ilike('dni', `%${searchQuery}%`);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching personas:", error);
    throw error;
  }
  return data;
}

export async function getRegistrosActivos(sedeFiltro = null) {
  let query = supabase
    .from('registros')
    .select(`
      id, fecha_ingreso, comentario,
      personas (nombres, apellido_paterno, apellido_materno, dni, empresa)
    `)
    .is('fecha_salida', null);
    
  if (sedeFiltro) {
    query = query.eq('sede', sedeFiltro);
  }
  
  const { data, error } = await query.order('fecha_ingreso', { ascending: false });
    
  if (error) throw error;
  return data;
}

export async function registrarSalida(registroId) {
  const { data, error } = await supabase
    .from('registros')
    .update({ fecha_salida: new Date().toISOString() })
    .eq('id', registroId);
    
  if (error) throw error;
  return data;
}

export async function getHistorial(dateString = null, sedeFiltro = null) {
  let query = supabase
    .from('registros')
    .select(`
      id, fecha_ingreso, fecha_salida, autoriza, procedencia, comentario, resguardo_responsable, sede,
      personas (nombres, apellido_paterno, apellido_materno, dni)
    `);
    
  if (dateString) {
    const start = new Date(dateString + 'T00:00:00');
    const end = new Date(dateString + 'T23:59:59');
    query = query
      .gte('fecha_ingreso', start.toISOString())
      .lte('fecha_ingreso', end.toISOString());
  }
  
  if (sedeFiltro) {
    query = query.eq('sede', sedeFiltro);
  }
  
  const { data, error } = await query.order('fecha_ingreso', { ascending: false });
  if (error) throw error;
  return data;
}

// === AUTHENTICATION & PROFILES ===
export async function loginWithMicrosoft() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      scopes: 'email',
      redirectTo: window.location.origin
    },
  });
  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (data.session) {
    // get profile
    const { data: profile } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', data.session.user.id)
      .single();
    
    return { session: data.session, profile: profile };
  }
  return { session: null, profile: null };
}

export async function getAllPerfiles() {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updatePerfilSede(userId, newSede, newRol) {
  const { data, error } = await supabase
    .from('perfiles')
    .update({ sede_asignada: newSede, rol: newRol })
    .eq('id', userId);
  if (error) throw error;
  return data;
}

export async function updateCorreoPersona(personaId, nuevoCorreo, nuevoComentario = null) {
  const { data, error } = await supabase
    .from('personas')
    .update({ correo: nuevoCorreo, comentario_correo: nuevoComentario })
    .eq('id', personaId);
  if (error) throw error;
  return data;
}

export async function getActasFirmadas() {
  const { data, error } = await supabase
    .from('personas')
    .select('dni, nombres, apellido_paterno, apellido_materno, empresa, correo, created_at, firma_url')
    .not('firma_url', 'is', null)
    .neq('firma_url', 'MIGRADO_SHAREPOINT')
    .order('created_at', { ascending: false });
  if (error) {
    console.error("DB Error:", error);
    throw error;
  }
  return data;
}

export async function getPersonalAutorizado() {
  const { data, error } = await supabase
    .from('personal_autorizado')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true });
  if (error) {
    console.error("Error fetching personal autorizado:", error);
    return [];
  }
  return data;
}
