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
