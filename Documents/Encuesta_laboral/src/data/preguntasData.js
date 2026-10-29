// =========================================================================
// 43 PREGUNTAS DE EVALUACIÓN OFICIALES - GRUPO AURICA (ENCUESTA 2026)
// Distribuidas en 10 Bloques Oficiales según la estructura definitiva del CSV.
// =========================================================================

export const SECCIONES_ENCUESTA = [
  {
    id: 1,
    bloque_n: 1,
    titulo: 'Condiciones y recursos',
    rango: [1, 4],
    nota: '',
    descripcion: 'Ambiente físico, herramientas, materiales y condiciones de trabajo.'
  },
  {
    id: 2,
    bloque_n: 2,
    titulo: 'Organización y carga de trabajo',
    rango: [5, 7],
    nota: '',
    descripcion: 'Carga laboral asignada, claridad de funciones y distribución de tareas.'
  },
  {
    id: 3,
    bloque_n: 3,
    titulo: 'Comunicación y coordinación interna',
    rango: [8, 11],
    nota: '',
    descripcion: 'Información clara y oportuna, expresión de ideas y coordinación entre áreas.'
  },
  {
    id: 4,
    bloque_n: 4,
    titulo: 'Liderazgo y supervisión',
    rango: [12, 17],
    nota: 'Piensa en tu jefe o supervisor directo.',
    descripcion: 'Trato con respeto, comunicación de prioridades, retroalimentación y equidad.'
  },
  {
    id: 5,
    bloque_n: 5,
    titulo: 'Respeto y convivencia',
    rango: [18, 22],
    nota: '',
    descripcion: 'Compañerismo, inclusión, expresión libre de dudas y decisiones justas.'
  },
  {
    id: 6,
    bloque_n: 6,
    titulo: 'Trato en el trabajo',
    rango: [23, 29],
    nota: 'Nos gustaría contar con tu feedback, recuerda que es confidencial.',
    descripcion: 'Espacio confidencial para feedback sobre trato, convivencia y reporte seguro.'
  },
  {
    id: 7,
    bloque_n: 7,
    titulo: 'Seguridad y disciplina',
    rango: [30, 31],
    nota: '',
    descripcion: 'Seguridad física y aplicación consistente de normas y procedimientos de SSO.'
  },
  {
    id: 8,
    bloque_n: 8,
    titulo: 'Desarrollo y reconocimiento',
    rango: [32, 34],
    nota: '',
    descripcion: 'Oportunidades de capacitación, crecimiento interno y valoración del esfuerzo.'
  },
  {
    id: 9,
    bloque_n: 9,
    titulo: 'Pertenencia y compromiso',
    rango: [35, 39],
    nota: '',
    descripcion: 'Objetivos de empresa, orgullo, permanencia futura y recomendación eNPS.'
  },
  {
    id: 10,
    bloque_n: 10,
    titulo: 'Prioridades y comentarios',
    rango: [40, 43],
    nota: '',
    descripcion: 'Dimensiones prioritarias de mejora y comentarios abiertos constructivos.'
  }
];

export const PREGUNTAS_OFICIALES = [
  // =========================================================================
  // BLOQUE 1: Condiciones y recursos (1 a 4)
  // =========================================================================
  {
    id: 1,
    orden: 1,
    bloque_n: 1,
    seccion: 'Condiciones y recursos',
    titulo: 'El ambiente físico de mi área de trabajo es seguro, adecuado y cómodo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 2,
    orden: 2,
    bloque_n: 1,
    seccion: 'Condiciones y recursos',
    titulo: 'Cuento con los equipos, herramientas y materiales necesarios para realizar bien mi trabajo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 3,
    orden: 3,
    bloque_n: 1,
    seccion: 'Condiciones y recursos',
    titulo: 'Las condiciones ambientales de mi lugar de trabajo (temperatura, ruido, iluminación y ventilación) son adecuadas para realizar mis funciones.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 4,
    orden: 4,
    bloque_n: 1,
    seccion: 'Condiciones y recursos',
    titulo: 'Los espacios de trabajo y áreas comunes que utilizo se mantienen limpios y en condiciones adecuadas.',
    tipo: 'escala_1_5',
    es_requerida: true
  },

  // =========================================================================
  // BLOQUE 2: Organización y carga de trabajo (5 a 7)
  // =========================================================================
  {
    id: 5,
    orden: 5,
    bloque_n: 2,
    seccion: 'Organización y carga de trabajo',
    titulo: 'La carga de trabajo que tengo asignada es razonable para cumplir adecuadamente mis funciones.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 6,
    orden: 6,
    bloque_n: 2,
    seccion: 'Organización y carga de trabajo',
    titulo: 'Tengo claridad sobre mis funciones, responsabilidades y prioridades.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 7,
    orden: 7,
    bloque_n: 2,
    seccion: 'Organización y carga de trabajo',
    titulo: 'La distribución del trabajo en mi área permite cumplir las responsabilidades de manera adecuada.',
    tipo: 'escala_1_5',
    es_requerida: true
  },

  // =========================================================================
  // BLOQUE 3: Comunicación y coordinación interna (8 a 11)
  // =========================================================================
  {
    id: 8,
    orden: 8,
    bloque_n: 3,
    seccion: 'Comunicación y coordinación interna',
    titulo: 'Recibo información clara y oportuna sobre los cambios y decisiones de la empresa que afectan mi trabajo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 9,
    orden: 9,
    bloque_n: 3,
    seccion: 'Comunicación y coordinación interna',
    titulo: 'Puedo expresar mis ideas, sugerencias o desacuerdos sin temor a consecuencias negativas.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 10,
    orden: 10,
    bloque_n: 3,
    seccion: 'Comunicación y coordinación interna',
    titulo: 'Existe buena comunicación y coordinación entre mi área y las demás áreas con las que trabajo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 11,
    orden: 11,
    bloque_n: 3,
    seccion: 'Comunicación y coordinación interna',
    titulo: 'Sé a quién acudir cuando necesito información, apoyo o resolver un problema relacionado con mi trabajo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },

  // =========================================================================
  // BLOQUE 4: Liderazgo y supervisión (12 a 17)
  // Nota del bloque: "Piensa en tu jefe o supervisor directo."
  // =========================================================================
  {
    id: 12,
    orden: 12,
    bloque_n: 4,
    seccion: 'Liderazgo y supervisión',
    titulo: 'Mi jefe directo me trata con respeto y promueve un ambiente de confianza.',
    descripcion: 'Piensa en tu jefe o supervisor directo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 13,
    orden: 13,
    bloque_n: 4,
    seccion: 'Liderazgo y supervisión',
    titulo: 'Mi jefe comunica con claridad las expectativas y prioridades del trabajo.',
    descripcion: 'Piensa en tu jefe o supervisor directo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 14,
    orden: 14,
    bloque_n: 4,
    seccion: 'Liderazgo y supervisión',
    titulo: 'Mi jefe me brinda retroalimentación útil sobre mi trabajo.',
    descripcion: 'Piensa en tu jefe o supervisor directo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 15,
    orden: 15,
    bloque_n: 4,
    seccion: 'Liderazgo y supervisión',
    titulo: 'Mi jefe organiza y distribuye el trabajo de manera adecuada.',
    descripcion: 'Piensa en tu jefe o supervisor directo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 16,
    orden: 16,
    bloque_n: 4,
    seccion: 'Liderazgo y supervisión',
    titulo: 'Mi jefe escucha las opiniones y sugerencias del equipo.',
    descripcion: 'Piensa en tu jefe o supervisor directo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 17,
    orden: 17,
    bloque_n: 4,
    seccion: 'Liderazgo y supervisión',
    titulo: 'Las decisiones de mi jefe se aplican de manera justa y consistente.',
    descripcion: 'Piensa en tu jefe o supervisor directo.',
    tipo: 'escala_1_5',
    es_requerida: true
  },

  // =========================================================================
  // BLOQUE 5: Respeto y convivencia (18 a 22)
  // =========================================================================
  {
    id: 18,
    orden: 18,
    bloque_n: 5,
    seccion: 'Respeto y convivencia',
    titulo: 'En mi área existe un ambiente de compañerismo y respeto.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 19,
    orden: 19,
    bloque_n: 5,
    seccion: 'Respeto y convivencia',
    titulo: 'Las personas son tratadas con respeto, independientemente de su cargo, área u otras características personales.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 20,
    orden: 20,
    bloque_n: 5,
    seccion: 'Respeto y convivencia',
    titulo: 'Puedo plantear dudas, reconocer errores o expresar preocupaciones sin temor a ser ridiculizado/a o tratado/a injustamente.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 21,
    orden: 21,
    bloque_n: 5,
    seccion: 'Respeto y convivencia',
    titulo: 'La empresa promueve un ambiente de respeto, inclusión y equidad.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 22,
    orden: 22,
    bloque_n: 5,
    seccion: 'Respeto y convivencia',
    titulo: 'Considero que las decisiones relacionadas con el personal se toman de manera justa.',
    tipo: 'escala_1_5',
    es_requerida: true
  },

  // =========================================================================
  // BLOQUE 6: Trato en el trabajo (23 a 29)
  // Nota del bloque: "Nos gustaría contar con tu feedback, recuerda que es confidencial."
  // =========================================================================
  {
    id: 23,
    orden: 23,
    bloque_n: 6,
    seccion: 'Trato en el trabajo',
    titulo: 'En los últimos seis meses, ¿has experimentado personalmente conductas agresivas, humillantes, intimidantes o de maltrato en el trabajo?',
    descripcion: 'Nos gustaría contar con tu feedback, recuerda que es confidencial.',
    tipo: 'opcion_simple',
    opciones: ['Sí', 'No', 'No estoy seguro/a', 'Prefiero no responder'],
    es_requerida: true
  },
  {
    id: 24,
    orden: 24,
    bloque_n: 6,
    seccion: 'Trato en el trabajo',
    titulo: 'En los últimos seis meses, ¿has presenciado conductas agresivas, humillantes, intimidantes o de maltrato hacia otra persona en el trabajo?',
    descripcion: 'Nos gustaría contar con tu feedback, recuerda que es confidencial.',
    tipo: 'opcion_simple',
    opciones: ['Sí', 'No', 'No estoy seguro/a', 'Prefiero no responder'],
    es_requerida: true
  },
  {
    id: 25,
    orden: 25,
    bloque_n: 6,
    seccion: 'Trato en el trabajo',
    titulo: 'La situación ocurrió principalmente por parte de: (Responde solo si marcaste «Sí» en la pregunta 23 o 24.)',
    descripcion: 'Responde solo si marcaste «Sí» en alguna de las preguntas anteriores.',
    tipo: 'opcion_simple',
    opciones: ['Jefe/supervisor', 'Compañero/a', 'Persona a cargo', 'Tercero', 'Ninguno'],
    es_requerida: false
  },
  {
    id: 26,
    orden: 26,
    bloque_n: 6,
    seccion: 'Trato en el trabajo',
    titulo: '¿Sabes a quién acudir o qué canal utilizar si necesitas reportar una situación de hostigamiento, maltrato o discriminación?',
    descripcion: 'Nos gustaría contar con tu feedback, recuerda que es confidencial.',
    tipo: 'opcion_simple',
    opciones: ['Sí', 'No', 'No estoy seguro/a', 'Prefiero no responder'],
    es_requerida: true
  },
  {
    id: 27,
    orden: 27,
    bloque_n: 6,
    seccion: 'Trato en el trabajo',
    titulo: 'Confío en que podría reportar una situación de maltrato, acoso o discriminación sin temor a represalias.',
    descripcion: 'Nos gustaría contar con tu feedback, recuerda que es confidencial.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 28,
    orden: 28,
    bloque_n: 6,
    seccion: 'Trato en el trabajo',
    titulo: 'Considero que la empresa toma en serio estos casos y los atiende con confidencialidad y oportunidad.',
    descripcion: 'Nos gustaría contar con tu feedback, recuerda que es confidencial.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 29,
    orden: 29,
    bloque_n: 6,
    seccion: 'Trato en el trabajo',
    titulo: 'Si deseas, puedes dejar un comentario confidencial para RR. HH. sobre alguna situación de trato o convivencia laboral.',
    descripcion: 'Nos gustaría contar con tu feedback, recuerda que es confidencial.',
    tipo: 'texto_libre',
    es_requerida: false
  },

  // =========================================================================
  // BLOQUE 7: Seguridad y disciplina (30 a 31)
  // =========================================================================
  {
    id: 30,
    orden: 30,
    bloque_n: 7,
    seccion: 'Seguridad y disciplina',
    titulo: 'Me siento físicamente seguro/a en mi lugar de trabajo, incluyendo oficinas y espacios comunes.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 31,
    orden: 31,
    bloque_n: 7,
    seccion: 'Seguridad y disciplina',
    titulo: 'Las normas y procedimientos de seguridad y salud ocupacional se comunican claramente y se aplican de manera consistente.',
    tipo: 'escala_1_5',
    es_requerida: true
  },

  // =========================================================================
  // BLOQUE 8: Desarrollo y reconocimiento (32 a 34)
  // =========================================================================
  {
    id: 32,
    orden: 32,
    bloque_n: 8,
    seccion: 'Desarrollo y reconocimiento',
    titulo: 'Tengo oportunidades de aprendizaje y capacitación relacionadas con mi puesto.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 33,
    orden: 33,
    bloque_n: 8,
    seccion: 'Desarrollo y reconocimiento',
    titulo: 'Percibo oportunidades de crecimiento y desarrollo dentro de la empresa.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 34,
    orden: 34,
    bloque_n: 8,
    seccion: 'Desarrollo y reconocimiento',
    titulo: 'Siento que mi esfuerzo y el trabajo bien realizado son valorados.',
    tipo: 'escala_1_5',
    es_requerida: true
  },

  // =========================================================================
  // BLOQUE 9: Pertenencia y compromiso (35 a 39)
  // =========================================================================
  {
    id: 35,
    orden: 35,
    bloque_n: 9,
    seccion: 'Pertenencia y compromiso',
    titulo: 'Conozco los objetivos de la empresa y entiendo cómo mi trabajo contribuye a lograrlos.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 36,
    orden: 36,
    bloque_n: 9,
    seccion: 'Pertenencia y compromiso',
    titulo: 'Me siento orgulloso/a de trabajar en Grupo Aurica.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 37,
    orden: 37,
    bloque_n: 9,
    seccion: 'Pertenencia y compromiso',
    titulo: 'Me siento comprometido/a con los objetivos de mi área y de la empresa.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 38,
    orden: 38,
    bloque_n: 9,
    seccion: 'Pertenencia y compromiso',
    titulo: 'Me gustaría continuar trabajando en Grupo Aurica durante los próximos años.',
    tipo: 'escala_1_5',
    es_requerida: true
  },
  {
    id: 39,
    orden: 39,
    bloque_n: 9,
    seccion: 'Pertenencia y compromiso',
    titulo: 'En una escala de 0 a 10, ¿qué tan probable es que recomiendes Grupo Aurica como un buen lugar para trabajar?',
    descripcion: 'En una escala de 0 (Nada probable) a 10 (Totalmente probable).',
    tipo: 'escala_0_10',
    opciones: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    es_requerida: true
  },

  // =========================================================================
  // BLOQUE 10: Prioridades y comentarios (40 a 43)
  // =========================================================================
  {
    id: 40,
    orden: 40,
    bloque_n: 10,
    seccion: 'Prioridades y comentarios',
    titulo: '¿Cuáles son las DOS dimensiones que consideras más importante que Grupo Aurica debería mejorar?',
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
    bloque_n: 10,
    seccion: 'Prioridades y comentarios',
    titulo: '¿Qué es lo que más valoras actualmente de trabajar en Grupo Aurica?',
    tipo: 'texto_libre',
    es_requerida: false
  },
  {
    id: 42,
    orden: 42,
    bloque_n: 10,
    seccion: 'Prioridades y comentarios',
    titulo: 'Si pudieras cambiar una sola cosa para mejorar tu experiencia de trabajo, ¿qué cambiarías?',
    tipo: 'texto_libre',
    es_requerida: false
  },
  {
    id: 43,
    orden: 43,
    bloque_n: 10,
    seccion: 'Prioridades y comentarios',
    titulo: '¿Qué acción concreta consideras que debería priorizar la empresa para mejorar el clima laboral?',
    tipo: 'texto_libre',
    es_requerida: false
  }
];
