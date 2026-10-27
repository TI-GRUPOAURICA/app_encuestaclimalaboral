// 43 PREGUNTAS DE EVALUACIÓN OFICIALES (EXCLUYE DATOS GENERALES YA REGISTRADOS EN PADRÓN DNI)

export const SECCIONES_ENCUESTA = [
  { id: 1, titulo: 'Condiciones y Organización', rango: [1, 7], descripcion: 'Entorno de trabajo, herramientas y carga operativa.' },
  { id: 2, titulo: 'Comunicación y Liderazgo', rango: [8, 17], descripcion: 'Flujo de información, escucha activa y jefatura directa.' },
  { id: 3, titulo: 'Respeto, Convivencia y Trato', rango: [18, 29], descripcion: 'Compañerismo, equidad y canal de feedback confidencial.' },
  { id: 4, titulo: 'Seguridad, Crecimiento y Compromiso', rango: [30, 39], descripcion: 'Seguridad física, desarrollo profesional y recomendación eNPS.' },
  { id: 5, titulo: 'Prioridades y Sugerencias', rango: [40, 43], descripcion: 'Dimensiones prioritarias de mejora y comentarios constructivos.' }
];

export const PREGUNTAS_OFICIALES = [
  // --- CONDICIONES Y RECURSOS (1 a 4) ---
  {
    id: 1,
    orden: 1,
    seccion: 'Condiciones y Recursos',
    titulo: 'El ambiente físico de mi área de trabajo es seguro, adecuado y cómodo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 2,
    orden: 2,
    seccion: 'Condiciones y Recursos',
    titulo: 'Cuento con los equipos, herramientas y materiales necesarios para realizar bien mi trabajo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 3,
    orden: 3,
    seccion: 'Condiciones y Recursos',
    titulo: 'Las condiciones ambientales de mi lugar de trabajo (temperatura, ruido, iluminación y ventilación) son adecuadas para realizar mis funciones.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 4,
    orden: 4,
    seccion: 'Condiciones y Recursos',
    titulo: 'Los espacios de trabajo y áreas comunes que utilizo se mantienen limpios y en condiciones adecuadas.',
    tipo: 'escala_1_5',
    es_requerida: true
  },

  // --- ORGANIZACIÓN Y CARGA DE TRABAJO (5 a 7) ---
  {
    id: 5,
    orden: 5,
    seccion: 'Organización y Carga de Trabajo',
    titulo: 'La carga de trabajo que tengo asignada es razonable para cumplir adecuadamente mis funciones.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 6,
    orden: 6,
    seccion: 'Organización y Carga de Trabajo',
    titulo: 'Tengo claridad sobre mis funciones, responsabilidades y prioridades.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 7,
    orden: 7,
    seccion: 'Organización y Carga de Trabajo',
    titulo: 'La distribución del trabajo en mi área permite cumplir las responsabilidades de manera adecuada.',
    tipo: 'escala_1_5',
    es_requerida: true
  },

  // --- COMUNICACIÓN Y COORDINACIÓN INTERNA (8 a 11) ---
  {
    id: 8,
    orden: 8,
    seccion: 'Comunicación y Coordinación Interna',
    titulo: 'Recibo información clara y oportuna sobre los cambios y decisiones de la empresa que afectan mi trabajo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 9,
    orden: 9,
    seccion: 'Comunicación y Coordinación Interna',
    titulo: 'Puedo expresar mis ideas, sugerencias o desacuerdos sin temor a consecuencias negativas.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 10,
    orden: 10,
    seccion: 'Comunicación y Coordinación Interna',
    titulo: 'Existe buena comunicación y coordinación entre mi área y las demás áreas con las que trabajo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 11,
    orden: 11,
    seccion: 'Comunicación y Coordinación Interna',
    titulo: 'Sé a quién acudir cuando necesito información, apoyo o resolver un problema relacionado con mi trabajo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },

  // --- LIDERAZGO Y SUPERVISIÓN (12 a 17) ---
  {
    id: 12,
    orden: 12,
    seccion: 'Liderazgo y Supervisión',
    titulo: 'Mi jefe directo me trata con respeto y promueve un ambiente de confianza.',
    descripcion: 'Piensa en tu jefe o supervisor directo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 13,
    orden: 13,
    seccion: 'Liderazgo y Supervisión',
    titulo: 'Mi jefe comunica con claridad las expectativas y prioridades del trabajo.',
    descripcion: 'Piensa en tu jefe o supervisor directo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 14,
    orden: 14,
    seccion: 'Liderazgo y Supervisión',
    titulo: 'Mi jefe me brinda retroalimentación útil sobre mi trabajo.',
    descripcion: 'Piensa en tu jefe o supervisor directo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 15,
    orden: 15,
    seccion: 'Liderazgo y Supervisión',
    titulo: 'Mi jefe organiza y distribuye el trabajo de manera adecuada.',
    descripcion: 'Piensa en tu jefe o supervisor directo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 16,
    orden: 16,
    seccion: 'Liderazgo y Supervisión',
    titulo: 'Mi jefe escucha las opiniones y sugerencias del equipo.',
    descripcion: 'Piensa en tu jefe o supervisor directo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 17,
    orden: 17,
    seccion: 'Liderazgo y Supervisión',
    titulo: 'Las decisiones de mi jefe se aplican de manera justa y consistente.',
    descripcion: 'Piensa en tu jefe o supervisor directo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },

  // --- RESPETO Y CONVIVENCIA (18 a 22) ---
  {
    id: 18,
    orden: 18,
    seccion: 'Respeto y Convivencia',
    titulo: 'En mi área existe un ambiente de compañerismo y respeto.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 19,
    orden: 19,
    seccion: 'Respeto y Convivencia',
    titulo: 'Las personas son tratadas con respeto, independientemente de su cargo, área u otras características personales.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 20,
    orden: 20,
    seccion: 'Respeto y Convivencia',
    titulo: 'Puedo plantear dudas, reconocer errores o expresar preocupaciones sin temor a ser ridiculizado/a o tratado/a injustamente.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 21,
    orden: 21,
    seccion: 'Respeto y Convivencia',
    titulo: 'La empresa promueve un ambiente de respeto, inclusión y equidad.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 22,
    orden: 22,
    seccion: 'Respeto y Convivencia',
    titulo: 'Considero que las decisiones relacionadas con el personal se toman de manera justa.',
    tipo: 'escala_1_5',
    es_requerida: true
  },

  // --- TRATO EN EL TRABAJO (23 a 29) ---
  {
    id: 23,
    orden: 23,
    seccion: 'Trato en el Trabajo',
    titulo: 'En los últimos seis meses, ¿has experimentado personalmente conductas agresivas, humillantes, intimidantes o de maltrato en el trabajo?',
    descripcion: 'Espacio 100% confidencial y anónimo.',
    tipo: 'opcion_simple',
    opciones: ['Sí', 'No', 'No estoy seguro/a', 'Prefiero no responder'],
    es_requerida: true
  },
  {
    id: 24,
    orden: 24,
    seccion: 'Trato en el Trabajo',
    titulo: 'En los últimos seis meses, ¿has presenciado conductas agresivas, humillantes, intimidantes o de maltrato hacia otra persona en el trabajo?',
    descripcion: 'Espacio 100% confidencial y anónimo.',
    tipo: 'opcion_simple',
    opciones: ['Sí', 'No', 'No estoy seguro/a', 'Prefiero no responder'],
    es_requerida: true
  },
  {
    id: 25,
    orden: 25,
    seccion: 'Trato en el Trabajo',
    titulo: 'La situación ocurrió principalmente por parte de:',
    descripcion: 'Responde solo si marcaste «Sí» en alguna de las preguntas anteriores.',
    tipo: 'opcion_simple',
    opciones: ['Jefe/supervisor', 'Compañero/a', 'Persona a cargo', 'Tercero', 'Ninguno'],
    es_requerida: false
  },
  {
    id: 26,
    orden: 26,
    seccion: 'Trato en el Trabajo',
    titulo: '¿Sabes a quién acudir o qué canal utilizar si necesitas reportar una situación de hostigamiento, maltrato o discriminación?',
    tipo: 'opcion_simple',
    opciones: ['Sí', 'No', 'No estoy seguro/a', 'Prefiero no responder'],
    es_requerida: true
  },
  {
    id: 27,
    orden: 27,
    seccion: 'Trato en el Trabajo',
    titulo: 'Confío en que podría reportar una situación de maltrato, acoso o discriminación sin temor a represalias.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 28,
    orden: 28,
    seccion: 'Trato en el Trabajo',
    titulo: 'Considero que la empresa toma en serio estos casos y los atiende con confidencialidad y oportunidad.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 29,
    orden: 29,
    seccion: 'Trato en el Trabajo',
    titulo: 'Si deseas, puedes dejar un comentario confidencial sobre alguna situación de trato o convivencia laboral.',
    descripcion: 'Opcional y libre de remitente.',
    tipo: 'texto_libre',
    es_requerida: false
  },

  // --- SEGURIDAD Y DISCIPLINA (30 a 31) ---
  {
    id: 30,
    orden: 30,
    seccion: 'Seguridad y Salud Ocupacional',
    titulo: 'Me siento físicamente seguro/a en mi lugar de trabajo, incluyendo oficinas y espacios comunes.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 31,
    orden: 31,
    seccion: 'Seguridad y Salud Ocupacional',
    titulo: 'Las normas y procedimientos de seguridad y salud ocupacional se comunican claramente y se aplican de manera consistente.',
    tipo: 'escala_1_5',
    es_requerida: true
  },

  // --- DESARROLLO Y RECONOCIMIENTO (32 a 34) ---
  {
    id: 32,
    orden: 32,
    seccion: 'Desarrollo y Reconocimiento',
    titulo: 'Tengo oportunidades de aprendizaje y capacitación relacionadas con mi puesto.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 33,
    orden: 33,
    seccion: 'Desarrollo y Reconocimiento',
    titulo: 'Percibo oportunidades de crecimiento y desarrollo dentro de la empresa.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 34,
    orden: 34,
    seccion: 'Desarrollo y Reconocimiento',
    titulo: 'Siento que mi esfuerzo y el trabajo bien realizado son valorados.',
    tipo: 'escala_1_5',
    es_requerida: true
  },

  // --- PERTENENCIA Y COMPROMISO (35 a 39) ---
  {
    id: 35,
    orden: 35,
    seccion: 'Pertenencia y Compromiso',
    titulo: 'Conozco los objetivos de la empresa y entiendo cómo mi trabajo contribuye a lograrlos.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 36,
    orden: 36,
    seccion: 'Pertenencia y Compromiso',
    titulo: 'Me siento orgulloso/a de trabajar en la empresa.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 37,
    orden: 37,
    seccion: 'Pertenencia y Compromiso',
    titulo: 'Me siento comprometido/a con los objetivos de mi área y de la empresa.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 38,
    orden: 38,
    seccion: 'Pertenencia y Compromiso',
    titulo: 'Me gustaría continuar trabajando en la empresa durante los próximos años.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 39,
    orden: 39,
    seccion: 'Pertenencia y Compromiso',
    titulo: '¿Qué tan probable es que recomiendes la empresa como un buen lugar para trabajar?',
    descripcion: 'En una escala de 0 (Nada probable) a 10 (Totalmente probable).',
    tipo: 'escala_0_10',
    es_requerida: true
  },

  // --- PRIORIDADES Y COMENTARIOS FINALES (40 a 43) ---
  {
    id: 40,
    orden: 40,
    seccion: 'Prioridades y Sugerencias',
    titulo: '¿Cuáles son las DOS dimensiones que consideras más importante que la empresa debería mejorar?',
    descripcion: 'Selecciona hasta 2 dimensiones prioritarias.',
    tipo: 'opcion_multiple',
    max_opciones: 2,
    opciones: [
      'Condiciones y recursos',
      'Organización y carga',
      'Comunicación y coordinación',
      'Liderazgo y Supervisión',
      'Respeto y convivencia',
      'Trato en el trabajo',
      'Seguridad y disciplina',
      'Desarrollo y reconocimiento',
      'Pertenencia y compromiso'
    ],
    es_requerida: true
  },
  {
    id: 41,
    orden: 41,
    seccion: 'Prioridades y Sugerencias',
    titulo: '¿Qué es lo que más valoras actualmente de trabajar en la empresa?',
    tipo: 'texto_libre',
    es_requerida: false
  },
  {
    id: 42,
    orden: 42,
    seccion: 'Prioridades y Sugerencias',
    titulo: 'Si pudieras cambiar una sola cosa para mejorar tu experiencia de trabajo, ¿qué cambiarías?',
    tipo: 'texto_libre',
    es_requerida: false
  },
  {
    id: 43,
    orden: 43,
    seccion: 'Prioridades y Sugerencias',
    titulo: '¿Qué acción concreta consideras que debería priorizar la empresa para mejorar el clima laboral?',
    tipo: 'texto_libre',
    es_requerida: false
  }
];
