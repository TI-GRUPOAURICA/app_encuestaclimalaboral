-- =========================================================================
-- ESQUEMA SQL DEFINITIVO: ENCUESTA 2026 (43 PREGUNTAS DE CLIMA LABORAL)
-- =========================================================================
-- Proyecto Supabase: ilhoyamrwxuduikricgr
-- Las variables sociolaborales (Sede, Área, Antigüedad, Puesto y Nombre) 
-- se cargan con cada DNI en el padrón, evitando que el usuario deba responderlas.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. TABLA: control_dni_encuesta (PADRÓN CON NOMBRE Y SEGMENTOS)
-- =========================================================================
DROP TABLE IF EXISTS public.control_dni_encuesta CASCADE;

CREATE TABLE public.control_dni_encuesta (
    dni VARCHAR(8) PRIMARY KEY,
    nombre VARCHAR(150), -- Nombre del colaborador para el control de asistencia
    sede VARCHAR(100) DEFAULT 'Lima',
    area VARCHAR(150) NOT NULL,
    antiguedad VARCHAR(50) DEFAULT '1 a 3 años',
    tipo_puesto VARCHAR(50) DEFAULT 'Operativo', -- 'Administrativo' | 'Operativo'
    voto BOOLEAN DEFAULT FALSE,
    fecha_participacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- 2. TABLA: preguntas_encuesta (43 PREGUNTAS DE EVALUACIÓN)
-- =========================================================================
DROP TABLE IF EXISTS public.preguntas_encuesta CASCADE;

CREATE TABLE public.preguntas_encuesta (
    id SERIAL PRIMARY KEY,
    orden INT UNIQUE NOT NULL,
    seccion VARCHAR(100) NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL DEFAULT 'escala_1_5', -- 'escala_1_5' | 'escala_0_10' | 'opcion_simple' | 'opcion_multiple' | 'texto_libre'
    opciones JSONB,
    max_opciones INT DEFAULT 1,
    es_requerida BOOLEAN NOT NULL DEFAULT TRUE,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- 3. TABLA: respuestas_clima_encuesta (RESPUESTAS 100% ANÓNIMAS PARA BI)
-- =========================================================================
-- Guarda las 43 respuestas y los segmentos (Sede, Área, Antigüedad, Puesto)
-- SIN DNI NI NOMBRE para preservar el anonimato total.
DROP TABLE IF EXISTS public.respuestas_clima_encuesta CASCADE;

CREATE TABLE public.respuestas_clima_encuesta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede VARCHAR(100),
    area VARCHAR(150),
    antiguedad VARCHAR(50),
    tipo_puesto VARCHAR(50),
    respuestas JSONB NOT NULL, -- Mapa completo de respuestas dinámicas { "1": 5, "39": 10... }
    enps_score SMALLINT, -- Puntaje eNPS directo (pregunta 39: 0 al 10)
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- 4. POLÍTICAS DE ACCESO (ROW LEVEL SECURITY - RLS)
-- =========================================================================
ALTER TABLE public.control_dni_encuesta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preguntas_encuesta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respuestas_clima_encuesta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir consultar DNI encuesta" ON public.control_dni_encuesta FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir marcar asistencia encuesta" ON public.control_dni_encuesta FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir insercion padron encuesta" ON public.control_dni_encuesta FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Permitir lectura preguntas encuesta" ON public.preguntas_encuesta FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir admin preguntas encuesta" ON public.preguntas_encuesta FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir insercion respuestas encuesta" ON public.respuestas_clima_encuesta FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Permitir lectura respuestas encuesta" ON public.respuestas_clima_encuesta FOR SELECT TO anon, authenticated USING (true);

-- =========================================================================
-- 5. CARGA DE LAS 43 PREGUNTAS DE EVALUACIÓN OFICIALES (1 A 43)
-- =========================================================================
INSERT INTO public.preguntas_encuesta (orden, seccion, titulo, descripcion, tipo, opciones, max_opciones, es_requerida, activa)
VALUES
-- CONDICIONES Y RECURSOS (1 a 4)
(1, 'Condiciones y recursos', 'El ambiente físico de mi área de trabajo es seguro, adecuado y cómodo.', NULL, 'escala_1_5', NULL, 1, true, true),
(2, 'Condiciones y recursos', 'Cuento con los equipos, herramientas y materiales necesarios para realizar bien mi trabajo.', NULL, 'escala_1_5', NULL, 1, true, true),
(3, 'Condiciones y recursos', 'Las condiciones ambientales de mi lugar de trabajo (temperatura, ruido, iluminación y ventilación) son adecuadas para realizar mis funciones.', NULL, 'escala_1_5', NULL, 1, true, true),
(4, 'Condiciones y recursos', 'Los espacios de trabajo y áreas comunes que utilizo se mantienen limpios y en condiciones adecuadas.', NULL, 'escala_1_5', NULL, 1, true, true),

-- ORGANIZACIÓN Y CARGA DE TRABAJO (5 a 7)
(5, 'Organización y carga de trabajo', 'La carga de trabajo que tengo asignada es razonable para cumplir adecuadamente mis funciones.', NULL, 'escala_1_5', NULL, 1, true, true),
(6, 'Organización y carga de trabajo', 'Tengo claridad sobre mis funciones, responsabilidades y prioridades.', NULL, 'escala_1_5', NULL, 1, true, true),
(7, 'Organización y carga de trabajo', 'La distribución del trabajo en mi área permite cumplir las responsabilidades de manera adecuada.', NULL, 'escala_1_5', NULL, 1, true, true),

-- COMUNICACIÓN Y COORDINACIÓN INTERNA (8 a 11)
(8, 'Comunicación y coordinación interna', 'Recibo información clara y oportuna sobre los cambios y decisiones de la empresa que afectan mi trabajo.', NULL, 'escala_1_5', NULL, 1, true, true),
(9, 'Comunicación y coordinación interna', 'Puedo expresar mis ideas, sugerencias o desacuerdos sin temor a consecuencias negativas.', NULL, 'escala_1_5', NULL, 1, true, true),
(10, 'Comunicación y coordinación interna', 'Existe buena comunicación y coordinación entre mi área y las demás áreas con las que trabajo.', NULL, 'escala_1_5', NULL, 1, true, true),
(11, 'Comunicación y coordinación interna', 'Sé a quién acudir cuando necesito información, apoyo o resolver un problema relacionado con mi trabajo.', NULL, 'escala_1_5', NULL, 1, true, true),

-- LIDERAZGO Y SUPERVISIÓN (12 a 17) - Nota: Piensa en tu jefe o supervisor directo.
(12, 'Liderazgo y supervisión', 'Mi jefe directo me trata con respeto y promueve un ambiente de confianza.', 'Piensa en tu jefe o supervisor directo.', 'escala_1_5', NULL, 1, true, true),
(13, 'Liderazgo y supervisión', 'Mi jefe comunica con claridad las expectativas y prioridades del trabajo.', 'Piensa en tu jefe o supervisor directo.', 'escala_1_5', NULL, 1, true, true),
(14, 'Liderazgo y supervisión', 'Mi jefe me brinda retroalimentación útil sobre mi trabajo.', 'Piensa en tu jefe o supervisor directo.', 'escala_1_5', NULL, 1, true, true),
(15, 'Liderazgo y supervisión', 'Mi jefe organiza y distribuye el trabajo de manera adecuada.', 'Piensa en tu jefe o supervisor directo.', 'escala_1_5', NULL, 1, true, true),
(16, 'Liderazgo y supervisión', 'Mi jefe escucha las opiniones y sugerencias del equipo.', 'Piensa en tu jefe o supervisor directo.', 'escala_1_5', NULL, 1, true, true),
(17, 'Liderazgo y supervisión', 'Las decisiones de mi jefe se aplican de manera justa y consistente.', 'Piensa en tu jefe o supervisor directo.', 'escala_1_5', NULL, 1, true, true),

-- RESPETO Y CONVIVENCIA (18 a 22)
(18, 'Respeto y convivencia', 'En mi área existe un ambiente de compañerismo y respeto.', NULL, 'escala_1_5', NULL, 1, true, true),
(19, 'Respeto y convivencia', 'Las personas son tratadas con respeto, independientemente de su cargo, área u otras características personales.', NULL, 'escala_1_5', NULL, 1, true, true),
(20, 'Respeto y convivencia', 'Puedo plantear dudas, reconocer errores o expresar preocupaciones sin temor a ser ridiculizado/a o tratado/a injustamente.', NULL, 'escala_1_5', NULL, 1, true, true),
(21, 'Respeto y convivencia', 'La empresa promueve un ambiente de respeto, inclusión y equidad.', NULL, 'escala_1_5', NULL, 1, true, true),
(22, 'Respeto y convivencia', 'Considero que las decisiones relacionadas con el personal se toman de manera justa.', NULL, 'escala_1_5', NULL, 1, true, true),

-- TRATO EN EL TRABAJO (23 a 29) - Nota: Nos gustaría contar con tu feedback, recuerda que es confidencial.
(23, 'Trato en el trabajo', 'En los últimos seis meses, ¿has experimentado personalmente conductas agresivas, humillantes, intimidantes o de maltrato en el trabajo?', 'Nos gustaría contar con tu feedback, recuerda que es confidencial.', 'opcion_simple', '["Sí", "No", "No estoy seguro/a", "Prefiero no responder"]'::jsonb, 1, true, true),
(24, 'Trato en el trabajo', 'En los últimos seis meses, ¿has presenciado conductas agresivas, humillantes, intimidantes o de maltrato hacia otra persona en el trabajo?', 'Nos gustaría contar con tu feedback, recuerda que es confidencial.', 'opcion_simple', '["Sí", "No", "No estoy seguro/a", "Prefiero no responder"]'::jsonb, 1, true, true),
(25, 'Trato en el trabajo', 'La situación ocurrió principalmente por parte de: (Responde solo si marcaste «Sí» en la pregunta 27 o 28.)', 'Responde solo si marcaste «Sí» en alguna de las preguntas anteriores.', 'opcion_simple', '["Jefe/supervisor", "Compañero/a", "Persona a cargo", "Tercero", "Ninguno"]'::jsonb, 1, false, true),
(26, 'Trato en el trabajo', '¿Sabes a quién acudir o qué canal utilizar si necesitas reportar una situación de hostigamiento, maltrato o discriminación?', 'Nos gustaría contar con tu feedback, recuerda que es confidencial.', 'opcion_simple', '["Sí", "No", "No estoy seguro/a", "Prefiero no responder"]'::jsonb, 1, true, true),
(27, 'Trato en el trabajo', 'Confío en que podría reportar una situación de maltrato, acoso o discriminación sin temor a represalias.', 'Nos gustaría contar con tu feedback, recuerda que es confidencial.', 'escala_1_5', NULL, 1, true, true),
(28, 'Trato en el trabajo', 'Considero que la empresa toma en serio estos casos y los atiende con confidencialidad y oportunidad.', 'Nos gustaría contar con tu feedback, recuerda que es confidencial.', 'escala_1_5', NULL, 1, true, true),
(29, 'Trato en el trabajo', 'Si deseas, puedes dejar un comentario confidencial para RR. HH. sobre alguna situación de trato o convivencia laboral.', 'Nos gustaría contar con tu feedback, recuerda que es confidencial.', 'texto_libre', NULL, 1, false, true),

-- SEGURIDAD Y DISCIPLINA (30 a 31)
(30, 'Seguridad y disciplina', 'Me siento físicamente seguro/a en mi lugar de trabajo, incluyendo oficinas y espacios comunes.', NULL, 'escala_1_5', NULL, 1, true, true),
(31, 'Seguridad y disciplina', 'Las normas y procedimientos de seguridad y salud ocupacional se comunican claramente y se aplican de manera consistente.', NULL, 'escala_1_5', NULL, 1, true, true),

-- DESARROLLO Y RECONOCIMIENTO (32 a 34)
(32, 'Desarrollo y reconocimiento', 'Tengo oportunidades de aprendizaje y capacitación relacionadas con mi puesto.', NULL, 'escala_1_5', NULL, 1, true, true),
(33, 'Desarrollo y reconocimiento', 'Percibo oportunidades de crecimiento y desarrollo dentro de la empresa.', NULL, 'escala_1_5', NULL, 1, true, true),
(34, 'Desarrollo y reconocimiento', 'Siento que mi esfuerzo y el trabajo bien realizado son valorados.', NULL, 'escala_1_5', NULL, 1, true, true),

-- PERTENENCIA Y COMPROMISO (35 a 39)
(35, 'Pertenencia y compromiso', 'Conozco los objetivos de la empresa y entiendo cómo mi trabajo contribuye a lograrlos.', NULL, 'escala_1_5', NULL, 1, true, true),
(36, 'Pertenencia y compromiso', 'Me siento orgulloso/a de trabajar en Grupo Aurica.', NULL, 'escala_1_5', NULL, 1, true, true),
(37, 'Pertenencia y compromiso', 'Me siento comprometido/a con los objetivos de mi área y de la empresa.', NULL, 'escala_1_5', NULL, 1, true, true),
(38, 'Pertenencia y compromiso', 'Me gustaría continuar trabajando en Grupo Aurica durante los próximos años.', NULL, 'escala_1_5', NULL, 1, true, true),
(39, 'Pertenencia y compromiso', 'En una escala de 0 a 10, ¿qué tan probable es que recomiendes Grupo Aurica como un buen lugar para trabajar?', 'En una escala de 0 (Nada probable) a 10 (Totalmente probable).', 'escala_0_10', '["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]'::jsonb, 1, true, true),

-- PRIORIDADES Y COMENTARIOS (40 a 43)
(40, 'Prioridades y comentarios', '¿Cuáles son las DOS dimensiones que consideras más importante que Grupo Aurica debería mejorar?', 'Selecciona hasta 2 dimensiones prioritarias.', 'opcion_multiple', '["Condiciones y recursos", "Organización y carga", "Comunicación y coordinación", "Liderazgo y Supervisión", "Respeto y convivencia", "Trato en el trabajo", "Seguridad y disciplina", "Desarrollo y reconocimiento", "Pertenencia y compromiso"]'::jsonb, 2, true, true),
(41, 'Prioridades y comentarios', '¿Qué es lo que más valoras actualmente de trabajar en Grupo Aurica?', NULL, 'texto_libre', NULL, 1, false, true),
(42, 'Prioridades y comentarios', 'Si pudieras cambiar una sola cosa para mejorar tu experiencia de trabajo, ¿qué cambiarías?', NULL, 'texto_libre', NULL, 1, false, true),
(43, 'Prioridades y comentarios', '¿Qué acción concreta consideras que debería priorizar la empresa para mejorar el clima laboral?', NULL, 'texto_libre', NULL, 1, false, true)
ON CONFLICT (orden) DO UPDATE 
SET seccion = EXCLUDED.seccion,
    titulo = EXCLUDED.titulo,
    descripcion = EXCLUDED.descripcion,
    tipo = EXCLUDED.tipo,
    opciones = EXCLUDED.opciones,
    max_opciones = EXCLUDED.max_opciones,
    es_requerida = EXCLUDED.es_requerida;

-- =========================================================================
-- 6. PADRÓN OFICIAL DE 107 COLABORADORES HABILITADOS
-- =========================================================================
-- =========================================================================
-- PADRÓN OFICIAL DE 107 COLABORADORES HABILITADOS (ENCUESTA 2026)
-- =========================================================================
-- 1. ELIMINAR LOS REGISTROS DEMO / EJEMPLOS ANTERIORES
-- =========================================================================
DELETE FROM public.control_dni_encuesta 
WHERE dni IN ('72345678', '12345678', '87654321', '44556677');

-- Asegurar política de eliminación para anon por si se requiere en el futuro
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'control_dni_encuesta' AND policyname = 'Permitir eliminar padron encuesta'
  ) THEN
    CREATE POLICY "Permitir eliminar padron encuesta" ON public.control_dni_encuesta FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

-- =========================================================================
-- 2. INSERCIÓN / ACTUALIZACIÓN DE LOS 107 COLABORADORES CON ÁREAS CORREGIDAS
-- =========================================================================
INSERT INTO public.control_dni_encuesta (dni, nombre, sede, area, antiguedad, tipo_puesto, voto)
VALUES
('73984964', 'Ricky Erick Alvis Pimentel', 'Chala', 'Administración y Finanzas', 'Menos de 1 año', 'Administrativo', false),
('73479987', 'Fiorella Martina Andrade Yepez', 'Chala', 'Administración y Finanzas', 'Menos de 1 año', 'Administrativo', false),
('76945246', 'Melanye Arapa Quispe', 'Chala', 'Administración y Finanzas', 'Menos de 1 año', 'Administrativo', false),
('46160463', 'Saul Cuba Casas', 'Lima', 'Administración y Finanzas', '1 a 3 años', 'Administrativo', false),
('46510924', 'Jose Rodar Guevara Sanchez', 'Chala', 'Administración y Finanzas', '1 a 3 años', 'Administrativo', false),
('44900049', 'Carlos Alberto Narro Alva', 'Chala', 'Administración y Finanzas', 'Más de 3 años', 'Administrativo', false),
('74659247', 'Roberto Carlos Soller Ybañez', 'Lima', 'Administración y Finanzas', '1 a 3 años', 'Administrativo', false),
('43691837', 'Luis Alexander Araujo Sanchez', 'Lima', 'TI y BI', 'Menos de 1 año', 'Administrativo', false),
('47662754', 'Hugo Erick Ramirez Huaman', 'Lima', 'TI y BI', 'Menos de 1 año', 'Administrativo', false),
('27141046', 'Silvio Alfonso Alva Castillo', 'Lima', 'Comercial y Comercio Exterior', 'Menos de 1 año', 'Administrativo', false),
('09542782', 'Nelson Alberto Alva Castillo', 'Lima', 'Comercial y Comercio Exterior', 'Más de 3 años', 'Administrativo', false),
('45336201', 'Roy Roger Barrientos Barcena', 'Lima', 'Comercial y Comercio Exterior', '1 a 3 años', 'Administrativo', false),
('75089728', 'Dayana Yesenia Espinoza Hernandez', 'Lima', 'Comercial y Comercio Exterior', '1 a 3 años', 'Administrativo', false),
('75119155', 'Keiko Marifer Quineche Lopez', 'Lima', 'Comercial y Comercio Exterior', '1 a 3 años', 'Administrativo', false),
('41377360', 'Roger Hernan Saldaña Matute', 'Lima', 'Comercial y Comercio Exterior', 'Más de 3 años', 'Administrativo', false),
('76770402', 'Lady Nicole Rodriguez Fernandez', 'Lima', 'Comercial y Comercio Exterior', 'Menos de 1 año', 'Administrativo', false),
('72932768', 'Kevin Yataco Marcelo', 'Lima', 'Comercial y Comercio Exterior', '1 a 3 años', 'Administrativo', false),
('42121667', 'Maria Dercy Condezo Neyra', 'Lima', 'Contabilidad', '1 a 3 años', 'Administrativo', false),
('07462161', 'Cesar Augusto Condori Condori', 'Lima', 'Contabilidad', '1 a 3 años', 'Administrativo', false),
('74996407', 'Stefany Pascuala Damacio Montalgo', 'Lima', 'Contabilidad', '1 a 3 años', 'Administrativo', false),
('75220348', 'Leonardo Jesus Olascoaga Añaños', 'Lima', 'Contabilidad', '1 a 3 años', 'Administrativo', false),
('47877352', 'Joselyn Anita Soto Silva', 'Lima', 'Contabilidad', '1 a 3 años', 'Administrativo', false),
('45277391', 'Areliz Lizzeth Villegas Huaman', 'Lima', 'Contabilidad', 'Más de 3 años', 'Administrativo', false),
('73756278', 'Karen Miluska Giraldez Mendoza', 'Lima', 'Contabilidad', 'Menos de 1 año', 'Administrativo', false),
('72182704', 'Jhoana Andreina Carranza Mendoza', 'Lima', 'Contabilidad', 'Menos de 1 año', 'Administrativo', false),
('76226242', 'Edelmira Koraima Santiago Ramon', 'Lima', 'Contabilidad', 'Menos de 1 año', 'Administrativo', false),
('71274989', 'Marcelo Franco Cardenas Morales', 'Lima', 'Operaciones, Refinería, Fundición y Producción', 'Más de 3 años', 'Operativo', false),
('40061641', 'Hector Milton Mamani Mamani', 'Lima', 'Operaciones, Refinería, Fundición y Producción', 'Más de 3 años', 'Operativo', false),
('46020059', 'Maria Pia Alva Arenas', 'Lima', 'Administración y Finanzas', 'Más de 3 años', 'Administrativo', false),
('46833954', 'Andrea Alva Arenas', 'Lima', 'Administración y Finanzas', 'Menos de 1 año', 'Administrativo', false),
('70771523', 'Maria Yolanda Moran De La Cruz', 'Lima', 'Administración y Finanzas', 'Menos de 1 año', 'Administrativo', false),
('07682421', 'Jorge Jaime Rivera Hinostroza', 'Lima', 'Administración y Finanzas', 'Más de 3 años', 'Administrativo', false),
('73900834', 'Sebastian Silviano Laverio Encarnacion', 'Lima', 'Administración y Finanzas', 'Menos de 1 año', 'Administrativo', false),
('76466277', 'Josett Daniel Tolentino Blas', 'Lima', 'SSO, Gestión Ambiental y PTARI', 'Menos de 1 año', 'Administrativo', false),
('70041696', 'Kety Milagros Vila Lazo', 'Lima', 'SSO, Gestión Ambiental y PTARI', '1 a 3 años', 'Administrativo', false),
('40831488', 'Carlos Julio Calero Ramos', 'Chala', 'Laboratorio', 'Menos de 1 año', 'Operativo', false),
('40669292', 'Eulogia Guillen Pacocha De Quiñones', 'Lima', 'Laboratorio', 'Más de 3 años', 'Operativo', false),
('70521243', 'Xiomara Angie Huahualuque Quispe', 'Chala', 'Laboratorio', '1 a 3 años', 'Operativo', false),
('72183180', 'Diego Martin Huaman Izquierdo', 'Chala', 'Laboratorio', 'Menos de 1 año', 'Operativo', false),
('60782763', 'Fiorella Estefany Huarca Huaycani', 'Chala', 'Laboratorio', 'Menos de 1 año', 'Operativo', false),
('44734956', 'Joel Mendoza Quispe', 'Chala', 'Laboratorio', 'Más de 3 años', 'Operativo', false),
('74654802', 'Edmee Katherine Quiñones Salcedo', 'Lima', 'Laboratorio', 'Más de 3 años', 'Operativo', false),
('74958675', 'Manuel Alexander Rodriguez Portilla', 'Lima', 'Laboratorio', 'Menos de 1 año', 'Operativo', false),
('41282380', 'Jorge Tevez Canahuiri', 'Chala', 'Laboratorio', 'Más de 3 años', 'Operativo', false),
('76195216', 'Rossilda Hancco Vargas', 'Chala', 'Laboratorio', 'Menos de 1 año', 'Operativo', false),
('41003499', 'Miguel Angel Cruz Martinez', 'Lima', 'Logística y Almacén', 'Menos de 1 año', 'Administrativo', false),
('71657849', 'Jhuvely Melina Lopez Alvarez', 'Lima', 'Logística y Almacén', 'Menos de 1 año', 'Administrativo', false),
('41348608', 'Victor Antonio Zuñiga Neyra', 'Lima', 'Logística y Almacén', 'Más de 3 años', 'Administrativo', false),
('41414099', 'Antonio Angel Hilaccama Quispe', 'Chala', 'Mantenimiento', 'Menos de 1 año', 'Administrativo', false),
('71902447', 'Frank Briyan Galindo Retamozo', 'Chala', 'Mantenimiento', 'Menos de 1 año', 'Administrativo', false),
('76865084', 'Danilo Alejandro Giraldo Rojas', 'Lima', 'Administración y Finanzas', '1 a 3 años', 'Administrativo', false),
('72393895', 'Maria Fernanda Navarro Vasquez', 'Lima', 'Administración y Finanzas', '1 a 3 años', 'Administrativo', false),
('71535233', 'Jefferson Elias Chong Goytizolo', 'Chala', 'Operaciones, Refinería, Fundición y Producción', 'Menos de 1 año', 'Operativo', false),
('43806413', 'Alex Richard Coronel Barreda', 'Chala', 'Operaciones, Refinería, Fundición y Producción', 'Menos de 1 año', 'Operativo', false),
('47913147', 'Edward Manuel Estrada Lopez', 'Chala', 'Operaciones, Refinería, Fundición y Producción', 'Menos de 1 año', 'Operativo', false),
('07325894', 'Teodocio Llamoca Yauri', 'Chala', 'Operaciones, Refinería, Fundición y Producción', 'Menos de 1 año', 'Operativo', false),
('43585627', 'Yosimar Lopez Gonzales', 'Chala', 'Operaciones, Refinería, Fundición y Producción', 'Menos de 1 año', 'Operativo', false),
('06684373', 'Adrian Palacios Lopez', 'Chala', 'Operaciones, Refinería, Fundición y Producción', 'Menos de 1 año', 'Operativo', false),
('42173511', 'Marco Gabriel Yzaziga Barrera', 'Chala', 'Operaciones, Refinería, Fundición y Producción', 'Menos de 1 año', 'Operativo', false),
('74166179', 'Carlos Daniel Apumayta Huarocc', 'Chala', 'Operaciones, Refinería, Fundición y Producción', '1 a 3 años', 'Operativo', false),
('48213463', 'Jorge Luis Asencios Rojas', 'Lima', 'Operaciones, Refinería, Fundición y Producción', 'Menos de 1 año', 'Operativo', false),
('72759210', 'Jackson Isaac Avalos Garcia', 'Chala', 'Operaciones, Refinería, Fundición y Producción', 'Menos de 1 año', 'Operativo', false),
('71820284', 'Cristhian Alexis Castillo Alva', 'Lima', 'Operaciones, Refinería, Fundición y Producción', '1 a 3 años', 'Operativo', false),
('73539538', 'Luis Enrique Cotrina Barrera', 'Arequipa', 'Operaciones, Refinería, Fundición y Producción', '1 a 3 años', 'Operativo', false),
('10602993', 'Karina Milagros Flores Caravantes', 'Lima', 'Operaciones, Refinería, Fundición y Producción', '1 a 3 años', 'Operativo', false),
('25852188', 'Elias Gamarra Diaz', 'Lima', 'Operaciones, Refinería, Fundición y Producción', 'Más de 3 años', 'Operativo', false),
('30494161', 'Reymundo Pedro Goyzueta Huamani', 'Chala', 'Operaciones, Refinería, Fundición y Producción', 'Más de 3 años', 'Operativo', false),
('16128204', 'Delfi Rully Huamalies Yauri', 'Lima', 'Operaciones, Refinería, Fundición y Producción', '1 a 3 años', 'Operativo', false),
('74304659', 'Juan Carlos Huillca Chavez', 'Lima', 'Operaciones, Refinería, Fundición y Producción', 'Menos de 1 año', 'Operativo', false),
('46611030', 'Aldo Leony Liñan Vasquez', 'Lima', 'Operaciones, Refinería, Fundición y Producción', 'Menos de 1 año', 'Operativo', false),
('73766083', 'Junnior Leonardo Marcelo Leon', 'Chala', 'Operaciones, Refinería, Fundición y Producción', '1 a 3 años', 'Operativo', false),
('70612487', 'Sebastian Andre Pinto Pazos', 'Chala', 'Operaciones, Refinería, Fundición y Producción', 'Menos de 1 año', 'Operativo', false),
('47584601', 'Efren Varani Quiñones Salcedo', 'Arequipa', 'Operaciones, Refinería, Fundición y Producción', 'Más de 3 años', 'Operativo', false),
('25797204', 'Vicente Terrones Gomez', 'Lima', 'Operaciones, Refinería, Fundición y Producción', '1 a 3 años', 'Operativo', false),
('43110214', 'Edinson Vela Sangama', 'Chala', 'Operaciones, Refinería, Fundición y Producción', 'Menos de 1 año', 'Operativo', false),
('60130061', 'Marcelo Tuanama Ishuiza', 'Chala', 'Operaciones, Refinería, Fundición y Producción', 'Menos de 1 año', 'Operativo', false),
('25836153', 'Cesar Antonio Alva Castillo', 'Lima', 'Mantenimiento', 'Más de 3 años', 'Operativo', false),
('42499840', 'Jose Luis Bermejo Mercado', 'Lima', 'Mantenimiento', 'Más de 3 años', 'Operativo', false),
('44814051', 'Arsenio Pablo Castillo Choque', 'Chala', 'Mantenimiento', 'Menos de 1 año', 'Operativo', false),
('72026170', 'Johan Piere Filio Maita', 'Lima', 'Mantenimiento', 'Menos de 1 año', 'Operativo', false),
('41629736', 'Daniel Eduardo Huallanca Ruiz', 'Lima', 'Mantenimiento', 'Más de 3 años', 'Operativo', false),
('45884132', 'Ronald Alexis Rodriguez Acuña', 'Lima', 'Mantenimiento', '1 a 3 años', 'Operativo', false),
('41698228', 'Jorge Marco Vega Flores', 'Lima', 'Mantenimiento', '1 a 3 años', 'Operativo', false),
('73634965', 'Dante Junhior Vargas Laverio', 'Lima', 'SSO, Gestión Ambiental y PTARI', '1 a 3 años', 'Administrativo', false),
('48483809', 'Dina Carolina Arteaga Honorio', 'Lima', 'Administración y Recursos Humanos', 'Menos de 1 año', 'Administrativo', false),
('40753423', 'Hilda Rocio Chaupi Gamarra', 'Lima', 'Administración y Recursos Humanos', 'Más de 3 años', 'Administrativo', false),
('40912739', 'Estela Herrera Salgado', 'Lima', 'Administración y Recursos Humanos', 'Más de 3 años', 'Administrativo', false),
('03846808', 'Consuelo Neira Curo', 'Lima', 'Administración y Recursos Humanos', '1 a 3 años', 'Administrativo', false),
('74804686', 'Nadia Zahily Ramos Montalvo', 'Lima', 'Administración y Recursos Humanos', 'Menos de 1 año', 'Administrativo', false),
('75281338', 'Katherine Cris Vega Terrones', 'Lima', 'Administración y Recursos Humanos', 'Menos de 1 año', 'Administrativo', false),
('10488049', 'Wuilfredo Avila Saldivar', 'Lima', 'Seguridad y Resguardo', 'Más de 3 años', 'Administrativo', false),
('72107759', 'Jeneer Estalin Calderon Castillo', 'Chala', 'Seguridad y Resguardo', '1 a 3 años', 'Administrativo', false),
('41651704', 'Sergio Henry Cornejo Peña', 'Lima', 'Seguridad y Resguardo', '1 a 3 años', 'Administrativo', false),
('42045409', 'David Justiniano Crisanto Chavez', 'Chala', 'Seguridad y Resguardo', 'Más de 3 años', 'Administrativo', false),
('71611432', 'Jesus Espinoza Ramos', 'Lima', 'Seguridad y Resguardo', 'Menos de 1 año', 'Administrativo', false),
('74937875', 'Victor Manuel Flores Mesones', 'Arequipa', 'Seguridad y Resguardo', 'Menos de 1 año', 'Administrativo', false),
('71608537', 'Jhordy Jack Loayza Velasquez', 'Chala', 'Seguridad y Resguardo', 'Menos de 1 año', 'Administrativo', false),
('43237285', 'Winke Natalio Rengifo', 'Arequipa', 'Seguridad y Resguardo', 'Más de 3 años', 'Administrativo', false),
('15702038', 'Jose Gustavo Quispe Celay', 'Lima', 'Seguridad y Resguardo', 'Más de 3 años', 'Administrativo', false),
('08834870', 'Belmin Eduardo Reyes Chavez', 'Lima', 'Seguridad y Resguardo', 'Más de 3 años', 'Administrativo', false),
('45235194', 'Gabriel Ruesta Granda', 'Chala', 'Seguridad y Resguardo', 'Más de 3 años', 'Administrativo', false),
('09161814', 'Alejandro Mario Arenas Taramona', 'Lima', 'Seguridad y Resguardo', 'Más de 3 años', 'Administrativo', false),
('71043053', 'Karol Fabiola Choquehuanca Huamani', 'Chala', 'SSO, Gestión Ambiental y PTARI', 'Más de 3 años', 'Administrativo', false),
('71262969', 'Gerson Jairo Lopez Vela', 'Lima', 'SSO, Gestión Ambiental y PTARI', 'Menos de 1 año', 'Administrativo', false),
('45737172', 'Leonar Jorge Antayhua Leon', 'Lima', 'TI y BI', '1 a 3 años', 'Administrativo', false),
('71705323', 'Stanley Fransshesco Castillo Canchari', 'Lima', 'TI y BI', 'Menos de 1 año', 'Administrativo', false),
('75713177', 'Danery Melysa Mendoza Broncano', 'Lima', 'Contabilidad', 'Menos de 1 año', 'Administrativo', false)
ON CONFLICT (dni) DO UPDATE
SET nombre = EXCLUDED.nombre,
    sede = EXCLUDED.sede,
    area = EXCLUDED.area,
    antiguedad = EXCLUDED.antiguedad,
    tipo_puesto = EXCLUDED.tipo_puesto;

-- =========================================================================
-- 3. VERIFICACIÓN FINAL: TOTAL DEBE SER 107
-- =========================================================================
SELECT COUNT(*) AS total_colaboradores FROM public.control_dni_encuesta;

-- Ver desglose por área corregida
SELECT area, COUNT(*) AS total 
FROM public.control_dni_encuesta 
GROUP BY area 
ORDER BY total DESC;
