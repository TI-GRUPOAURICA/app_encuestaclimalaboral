import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Cambiamos a la SERVICE ROLE KEY para poder saltar las reglas de seguridad (RLS) en la importación masiva.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function importCsv() {
  try {
    console.log('Iniciando importación...');
    
    // Leer correos malos si existe
    const badDnis = new Map();
    if (fs.existsSync('correos_malos.csv')) {
      const badContent = fs.readFileSync('correos_malos.csv', 'utf-8');
      const badRecords = parse(badContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: ';' // El usuario pasó un CSV con punto y coma
      });
      badRecords.forEach(r => {
        if (r['DNI']) badDnis.set(r['DNI'].trim(), r['Motivo_Observacion'] || 'Correo mal registrado');
      });
      console.log(`Se cargaron ${badDnis.size} DNIs con correos malos observados.`);
    }

    const fileContent = fs.readFileSync('migracion.csv', 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Se encontraron ${records.length} registros en el CSV.`);
    
    let insertados = 0;
    let omitidos = 0;
    
    for (const record of records) {
      const dni = record['DNI']?.trim();
      if (!dni) continue;

      // Check if exists
      const { data: existing } = await supabase
        .from('personas')
        .select('id')
        .eq('dni', dni)
        .single();
        
      if (existing) {
        omitidos++;
        continue;
      }

      let correo = record['Correo']?.trim() || '';
      let comentario = null;
      let obs = record['Observaciones']?.trim() || '';

      // Verificar si está en la lista de correos malos
      if (badDnis.has(dni)) {
        correo = 'auricasac@gmail.com';
        comentario = 'OBSERVADO: ' + badDnis.get(dni);
      } else {
        // Clean invalid emails genéricamente si no están en la lista
        if (!correo.includes('@') || correo.length < 5) {
          if (correo.length > 0) comentario = correo;
          if (obs.length > 0) comentario = (comentario ? comentario + ' | ' + obs : obs);
          correo = 'auricasac@gmail.com';
        }

        if (!comentario && obs) {
          comentario = obs;
        }
      }
      
      // Mapear fecha a Date
      let createdAt = new Date();
      if (record['FechaRegistro']) {
        const parts = record['FechaRegistro'].split('/');
        if (parts.length === 3) {
          // DD/MM/YYYY
          createdAt = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
        }
      }

      const { error } = await supabase
        .from('personas')
        .insert([{
          dni: dni,
          nombres: record['Nombre']?.trim() || 'Sin Nombre',
          apellido_paterno: record['Apellido']?.trim() || '',
          apellido_materno: record['Apellido_Materno']?.trim() || '',
          empresa: record['Empresa']?.trim() || 'Particular',
          correo: correo,
          comentario_correo: comentario,
          firma_url: 'MIGRADO_SHAREPOINT',
          created_at: createdAt.toISOString()
        }]);

      if (error) {
        console.error(`Error insertando DNI ${dni}:`, error.message);
      } else {
        insertados++;
      }
    }

    console.log(`\nImportación completada!`);
    console.log(`- Nuevos visitantes insertados: ${insertados}`);
    console.log(`- Visitantes ya existentes (omitidos): ${omitidos}`);

  } catch (error) {
    console.error('Error procesando CSV:', error.message);
  }
}

importCsv();
