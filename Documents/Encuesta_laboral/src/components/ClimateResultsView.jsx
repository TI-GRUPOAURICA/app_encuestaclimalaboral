import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Download, 
  RefreshCw, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  HeartHandshake, 
  MessageSquare, 
  CheckCircle2, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

// 9 Dimensiones Oficiales y sus preguntas asociadas
const DIMENSIONES = [
  { 
    id: 'condiciones', 
    nombre: 'Condiciones y Recursos', 
    preguntasIds: [1, 2, 3, 4],
    desc: 'Ambiente físico, herramientas, ergonomía y orden/limpieza.' 
  },
  { 
    id: 'organizacion', 
    nombre: 'Organización y Carga de Trabajo', 
    preguntasIds: [5, 6, 7],
    desc: 'Carga laboral razonable, claridad de funciones y distribución de tareas.' 
  },
  { 
    id: 'comunicacion', 
    nombre: 'Comunicación y Coordinación', 
    preguntasIds: [8, 9, 10, 11],
    desc: 'Información oportuna, libertad de expresión y coordinación entre áreas.' 
  },
  { 
    id: 'liderazgo', 
    nombre: 'Liderazgo y Supervisión', 
    preguntasIds: [12, 13, 14, 15, 16, 17],
    desc: 'Trato con respeto, claridad de expectativas, feedback y justicia en decisiones.' 
  },
  { 
    id: 'respeto', 
    nombre: 'Respeto y Convivencia', 
    preguntasIds: [18, 19, 20, 21, 22],
    desc: 'Compañerismo, inclusión, seguridad psicológica y equidad.' 
  },
  { 
    id: 'trato', 
    nombre: 'Trato en el Trabajo', 
    preguntasIds: [27, 28],
    desc: 'Confianza en canales de reporte y seriedad en atención de casos.' 
  },
  { 
    id: 'seguridad', 
    nombre: 'Seguridad y Salud Ocupacional', 
    preguntasIds: [30, 31],
    desc: 'Seguridad física y consistencia en normas de SSO.' 
  },
  { 
    id: 'desarrollo', 
    nombre: 'Desarrollo y Reconocimiento', 
    preguntasIds: [32, 33, 34],
    desc: 'Oportunidades de aprendizaje, crecimiento y valoración del esfuerzo.' 
  },
  { 
    id: 'pertenencia', 
    nombre: 'Pertenencia y Compromiso', 
    preguntasIds: [35, 36, 37, 38],
    desc: 'Identificación con metas de la empresa, orgullo y permanencia futura.' 
  }
];

export default function ClimateResultsView({ rawResponses = [], loading = false, onRefresh }) {
  // Filtros
  const [selectedSede, setSelectedSede] = useState('todas');
  const [selectedArea, setSelectedArea] = useState('todas');
  const [selectedPuesto, setSelectedPuesto] = useState('todos');
  const [selectedAntiguedad, setSelectedAntiguedad] = useState('todas');
  
  // Pestañas internas
  const [subTab, setSubTab] = useState('dimensiones'); // 'dimensiones' | 'enps' | 'cualitativo'
  const [cualitativaSeleccionada, setCualitativaSeleccionada] = useState('41'); // 41: valorado, 42: cambio, 43: accion, 29: trato
  const [expandedDimension, setExpandedDimension] = useState(null);

  // Modo Vista Previa con datos demo si no hay datos reales aún
  const [useDemoPreview, setUseDemoPreview] = useState(false);

  // Generador de datos simulados realistas para vista previa
  const demoData = useMemo(() => {
    const list = [];
    const sedesList = ['Lima', 'Chala', 'Arequipa'];
    const areasList = [
      'Operaciones, Refinería, Fundición y Producción',
      'Administración y Finanzas',
      'Contabilidad',
      'Laboratorio',
      'Seguridad y Resguardo',
      'TI y BI'
    ];
    const antiguedadesList = ['Menos de 1 año', '1 a 3 años', 'Más de 3 años'];
    const puestosList = ['Administrativo', 'Operativo'];

    for (let i = 1; i <= 38; i++) {
      const resp = {};
      for (let q = 1; q <= 38; q++) {
        if ([23, 24, 25, 26].includes(q)) {
          resp[q] = q === 26 ? 'Sí' : 'No';
        } else {
          // Notas entre 3 y 5
          resp[q] = Math.random() > 0.25 ? (Math.random() > 0.4 ? 5 : 4) : 3;
        }
      }
      resp[39] = Math.random() > 0.2 ? (Math.random() > 0.3 ? 10 : 9) : 7;
      resp[40] = ['Condiciones y recursos', 'Desarrollo y reconocimiento'];
      resp[41] = i % 2 === 0 ? 'El compañerismo dentro del equipo y la puntualidad en los pagos.' : 'Las oportunidades de aprender y el soporte del equipo.';
      resp[42] = i % 3 === 0 ? 'Agilizar los tiempos de compra de repuestos y suministros.' : 'Mayor integración entre sedes de Lima y Chala.';
      resp[43] = 'Programar charlas de liderazgo y reconocer las metas cumplidas.';

      list.push({
        id: `demo-${i}`,
        sede: sedesList[i % sedesList.length],
        area: areasList[i % areasList.length],
        antiguedad: antiguedadesList[i % antiguedadesList.length],
        tipo_puesto: puestosList[i % puestosList.length],
        respuestas: resp,
        enps_score: resp[39],
        fecha_envio: new Date(Date.now() - i * 3600000).toISOString()
      });
    }
    return list;
  }, []);

  const dataBase = (rawResponses && rawResponses.length > 0)
    ? rawResponses
    : (useDemoPreview ? demoData : []);

  // 1. Filtrar respuestas según selección
  const filteredData = useMemo(() => {
    return dataBase.filter(r => {
      if (selectedSede !== 'todas' && r.sede !== selectedSede) return false;
      if (selectedArea !== 'todas' && r.area !== selectedArea) return false;
      if (selectedPuesto !== 'todos' && r.tipo_puesto !== selectedPuesto) return false;
      if (selectedAntiguedad !== 'todas' && r.antiguedad !== selectedAntiguedad) return false;
      return true;
    });
  }, [dataBase, selectedSede, selectedArea, selectedPuesto, selectedAntiguedad]);

  // Protección de confidencialidad: Mínimo 3 respuestas para ver cortes demográficos
  const isConfidentialityProtected = filteredData.length > 0 && filteredData.length < 3;

  // 2. Cálculos Estadísticos Globales
  const stats = useMemo(() => {
    if (filteredData.length === 0 || isConfidentialityProtected) {
      return {
        total: filteredData.length,
        promedioGeneral: 0,
        favorabilidadGeneral: 0,
        enps: 0,
        promotoresPct: 0,
        pasivosPct: 0,
        detractoresPct: 0,
        dimensionesResultados: [],
        prioridades: [],
        comentarios: []
      };
    }

    let sumaEscala = 0;
    let totalEscalaCount = 0;
    let favorablesCount = 0;

    // eNPS
    const enpsValidos = filteredData.map(r => r.enps_score).filter(s => s !== null && s !== undefined && !isNaN(Number(s)));
    const promotores = enpsValidos.filter(s => s >= 9).length;
    const pasivos = enpsValidos.filter(s => s === 7 || s === 8).length;
    const detractores = enpsValidos.filter(s => s <= 6).length;
    const totalEnps = enpsValidos.length;
    const promotoresPct = totalEnps > 0 ? Math.round((promotores / totalEnps) * 100) : 0;
    const pasivosPct = totalEnps > 0 ? Math.round((pasivos / totalEnps) * 100) : 0;
    const detractoresPct = totalEnps > 0 ? Math.round((detractores / totalEnps) * 100) : 0;
    const enpsFinal = promotoresPct - detractoresPct;

    // Dimensiones
    const dimResultados = DIMENSIONES.map(dim => {
      let dimSuma = 0;
      let dimCount = 0;
      let dimFav = 0;

      filteredData.forEach(r => {
        const respuestas = r.respuestas || {};
        dim.preguntasIds.forEach(pId => {
          const val = Number(respuestas[pId]);
          if (!isNaN(val) && val >= 1 && val <= 5) {
            dimSuma += val;
            dimCount++;
            if (val >= 4) dimFav++;

            sumaEscala += val;
            totalEscalaCount++;
            if (val >= 4) favorablesCount++;
          }
        });
      });

      const promedio = dimCount > 0 ? (dimSuma / dimCount).toFixed(2) : '0.00';
      const favorabilidad = dimCount > 0 ? Math.round((dimFav / dimCount) * 100) : 0;

      return {
        ...dim,
        promedio: Number(promedio),
        favorabilidad,
        totalRespuestas: dimCount
      };
    });

    // Pregunta 40: Prioridades
    const conteoPrioridades = {};
    filteredData.forEach(r => {
      const p40 = r.respuestas?.['40'];
      if (Array.isArray(p40)) {
        p40.forEach(dimNombre => {
          conteoPrioridades[dimNombre] = (conteoPrioridades[dimNombre] || 0) + 1;
        });
      } else if (typeof p40 === 'string' && p40.trim()) {
        conteoPrioridades[p40] = (conteoPrioridades[p40] || 0) + 1;
      }
    });

    const prioridadesList = Object.entries(conteoPrioridades)
      .map(([nombre, votos]) => ({
        nombre,
        votos,
        porcentaje: Math.round((votos / filteredData.length) * 100)
      }))
      .sort((a, b) => b.votos - a.votos);

    // Comentarios cualitativos mezclados anónimamente
    const cualitativos = filteredData
      .map(r => ({
        sede: r.sede,
        puesto: r.tipo_puesto,
        texto: r.respuestas?.[cualitativaSeleccionada]
      }))
      .filter(item => item.texto && item.texto.trim().length > 2);

    return {
      total: filteredData.length,
      promedioGeneral: totalEscalaCount > 0 ? (sumaEscala / totalEscalaCount).toFixed(2) : '0.00',
      favorabilidadGeneral: totalEscalaCount > 0 ? Math.round((favorablesCount / totalEscalaCount) * 100) : 0,
      enps: enpsFinal,
      promotoresPct,
      pasivosPct,
      detractoresPct,
      dimensionesResultados: dimResultados,
      prioridades: prioridadesList,
      comentarios: cualitativos
    };
  }, [filteredData, isConfidentialityProtected, cualitativaSeleccionada]);

  // Manejar descarga CSV
  const handleDownloadCSV = () => {
    if (dataBase.length === 0) return;
    
    // Encabezados con BOM UTF-8 para Excel
    let csv = '\uFEFFID_Respuesta;Sede;Area;Antiguedad;Tipo_Puesto;Fecha_Envio;';
    for (let i = 1; i <= 43; i++) {
      csv += `P${i < 10 ? '0' + i : i};`;
    }
    csv += '\n';

    dataBase.forEach(r => {
      const resp = r.respuestas || {};
      const fecha = r.fecha_envio ? new Date(r.fecha_envio).toLocaleDateString('es-PE') : '';
      let row = `"${r.id}";"${r.sede}";"${r.area}";"${r.antiguedad}";"${r.tipo_puesto}";"${fecha}";`;
      
      for (let i = 1; i <= 43; i++) {
        let val = resp[i] ?? resp[String(i)] ?? '';
        if (Array.isArray(val)) {
          val = val.join(', ');
        }
        val = String(val).replace(/"/g, '""');
        row += `"${val}";`;
      }
      csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `matriz_respuestas_clima_laboral_2026_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Áreas únicas presentes en los datos
  const areasUnicas = useMemo(() => {
    const set = new Set();
    dataBase.forEach(r => {
      if (r.area) set.add(r.area);
    });
    return Array.from(set).sort();
  }, [dataBase]);

  return (
    <div className="space-y-6 text-left">
      {/* Barra superior de control: Título, Filtros rápidos y Exportación */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Análisis y Resultados de Clima 2026
            </h3>
            {useDemoPreview && (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Modo Simulación
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Métricas consolidadas, semáforo de clima por dimensión y eNPS corporativo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(!rawResponses || rawResponses.length === 0) && (
            <button
              onClick={() => setUseDemoPreview(!useDemoPreview)}
              className={`text-xs px-3 py-2 rounded-lg font-medium transition-all border ${
                useDemoPreview 
                  ? 'bg-amber-50 text-amber-900 border-amber-300' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {useDemoPreview ? 'Desactivar simulación' : 'Ver datos de muestra'}
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
            title="Recargar respuestas de Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            disabled={dataBase.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#345D9D] hover:bg-[#284a7e] text-white transition-colors disabled:opacity-40 shadow-md shadow-[#345D9D]/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Descargar Matriz CSV</span>
          </button>
        </div>
      </div>

      {/* Si no hay respuestas aún y no está en simulación */}
      {dataBase.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-200/80 flex items-center justify-center text-slate-500">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-base font-bold text-slate-900">Aún no se registran respuestas en Supabase</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              En cuanto los 107 colaboradores comiencen a responder la encuesta, los índices de favorabilidad, semáforos por dimensión y el cálculo del eNPS se calcularán en tiempo real automáticamente aquí.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setUseDemoPreview(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Activar vista previa con datos de muestra</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Barra de Filtros Segmentados */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Segmentación demográfica para análisis cruzado:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {/* Sede */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sede</label>
                <select
                  value={selectedSede}
                  onChange={(e) => setSelectedSede(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-[#345D9D] focus:ring-1 focus:ring-[#345D9D]/20"
                >
                  <option value="todas">Todas las Sedes</option>
                  <option value="Lima">Lima</option>
                  <option value="Chala">Chala</option>
                  <option value="Arequipa">Arequipa</option>
                </select>
              </div>

              {/* Área */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Área</label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-[#345D9D] focus:ring-1 focus:ring-[#345D9D]/20 truncate"
                >
                  <option value="todas">Todas las Áreas</option>
                  {areasUnicas.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Tipo de Puesto */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Puesto</label>
                <select
                  value={selectedPuesto}
                  onChange={(e) => setSelectedPuesto(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-[#345D9D] focus:ring-1 focus:ring-[#345D9D]/20"
                >
                  <option value="todos">Todos los Puestos</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Operativo">Operativo</option>
                </select>
              </div>

              {/* Antigüedad */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Antigüedad</label>
                <select
                  value={selectedAntiguedad}
                  onChange={(e) => setSelectedAntiguedad(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-[#345D9D] focus:ring-1 focus:ring-[#345D9D]/20"
                >
                  <option value="todas">Todas las Antigüedades</option>
                  <option value="Menos de 1 año">Menos de 1 año</option>
                  <option value="1 a 3 años">1 a 3 años</option>
                  <option value="Más de 3 años">Más de 3 años</option>
                </select>
              </div>
            </div>
          </div>

          {/* Alerta de Confidencialidad si la muestra filtrada es menor a 3 personas */}
          {isConfidentialityProtected ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold">Protección de Anonimato y Confidencialidad</p>
                <p className="text-amber-800">
                  El filtro seleccionado contiene únicamente <strong>{filteredData.length} participante(s)</strong>. Para proteger la confidencialidad de las respuestas individuales, se requiere un grupo mínimo de 3 colaboradores para visualizar resultados segmentados. Por favor selecciona un filtro más amplio.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 4 Tarjetas de Métricas Clave (KPIs Ejecutivos) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total Respuestas */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span className="font-medium">Muestra Analizada</span>
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{stats.total}</span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      / 107 en padrón
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {Math.round((stats.total / 107) * 100)}% de cobertura
                  </p>
                </div>

                {/* Índice Global Promedio */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span className="font-medium">Índice Global</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900">{stats.promedioGeneral}</span>
                    <span className="text-xs font-semibold text-slate-400">/ 5.00</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-semibold">
                    Escala estándar Likert
                  </p>
                </div>

                {/* % Favorabilidad Global */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span className="font-medium">Favorabilidad</span>
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900">{stats.favorabilidadGeneral}%</span>
                    <span className="text-[10px] font-bold text-slate-400">Positivo</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Calificaciones 4 (De acuerdo) y 5
                  </p>
                </div>

                {/* eNPS (Net Promoter Score) */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span className="font-medium">eNPS Laboral</span>
                    <HeartHandshake className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-black ${
                      stats.enps >= 30 ? 'text-emerald-600' : stats.enps >= 0 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {stats.enps > 0 ? `+${stats.enps}` : stats.enps}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">Puntos</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {stats.promotoresPct}% Promotores vs {stats.detractoresPct}% Detractores
                  </p>
                </div>
              </div>

              {/* Pestañas de Vista */}
              <div className="flex border-b border-slate-200 gap-6 text-xs font-bold pt-2">
                <button
                  onClick={() => setSubTab('dimensiones')}
                  className={`pb-2 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
                    subTab === 'dimensiones'
                      ? 'border-[#345D9D] text-[#345D9D]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Semáforo por Dimensiones</span>
                </button>

                <button
                  onClick={() => setSubTab('enps')}
                  className={`pb-2 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
                    subTab === 'enps'
                      ? 'border-[#345D9D] text-[#345D9D]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>eNPS y Prioridades de Mejora</span>
                </button>

                <button
                  onClick={() => setSubTab('cualitativo')}
                  className={`pb-2 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
                    subTab === 'cualitativo'
                      ? 'border-[#345D9D] text-[#345D9D]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Buzón Cualitativo Anónimo</span>
                </button>
              </div>

              {/* CONTENIDO SUB-PESTAÑA 1: SEMÁFORO DE DIMENSIONES */}
              {subTab === 'dimensiones' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Evaluación de las 9 dimensiones del clima corporativo:</span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> $\ge 75\%$ Favorable</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> $60-74\%$ Neutro</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> $&lt; 60\%$ Atención</span>
                    </div>
                  </div>

                  <div className="grid gap-2.5">
                    {stats.dimensionesResultados.map((dim, idx) => {
                      const colorBadge = dim.favorabilidad >= 75
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : dim.favorabilidad >= 60
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200';

                      const barColor = dim.favorabilidad >= 75
                        ? 'bg-emerald-500'
                        : dim.favorabilidad >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500';

                      const isExpanded = expandedDimension === dim.id;

                      return (
                        <div 
                          key={dim.id}
                          className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm transition-all hover:border-slate-300"
                        >
                          <div 
                            className="flex items-center justify-between cursor-pointer select-none"
                            onClick={() => setExpandedDimension(isExpanded ? null : dim.id)}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-bold text-slate-400">0{idx + 1}</span>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900">{dim.nombre}</h4>
                              </div>
                              <p className="text-[11px] text-slate-500">{dim.desc}</p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-sm font-black text-slate-900">{dim.promedio} <span className="text-[10px] font-normal text-slate-400">/ 5</span></div>
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${colorBadge}`}>
                                  {dim.favorabilidad}% favorable
                                </span>
                              </div>
                              <button className="text-slate-400 hover:text-slate-600">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Barra de progreso */}
                          <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                              style={{ width: `${Math.min(100, Math.max(0, dim.favorabilidad))}%` }}
                            />
                          </div>

                          {/* Detalle expandible de preguntas incluidas */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Preguntas evaluadas en esta dimensión:
                              </p>
                              <div className="space-y-1 text-[11px]">
                                {dim.preguntasIds.map(pNum => (
                                  <div key={pNum} className="flex items-center justify-between py-0.5 text-slate-700">
                                    <span>&bull; Pregunta {pNum}</span>
                                    <span className="font-mono text-slate-400">Escala Likert</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CONTENIDO SUB-PESTAÑA 2: eNPS Y PRIORIDADES */}
              {subTab === 'enps' && (
                <div className="space-y-6">
                  {/* Bloque eNPS */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Employee Net Promoter Score (eNPS)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Calculado a partir de la Pregunta 39: <em>«¿Qué tan probable es que recomiendes la empresa como un buen lugar para trabajar?» (Escala 0 al 10)</em>.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80">
                        <span className="text-xs font-bold text-emerald-800">Promotores (9-10)</span>
                        <div className="text-2xl font-black text-emerald-700">{stats.promotoresPct}%</div>
                        <p className="text-[10px] text-emerald-600">Embajadores comprometidos</p>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80">
                        <span className="text-xs font-bold text-amber-800">Pasivos (7-8)</span>
                        <div className="text-2xl font-black text-amber-700">{stats.pasivosPct}%</div>
                        <p className="text-[10px] text-amber-600">Satisfechos pero neutrales</p>
                      </div>

                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80">
                        <span className="text-xs font-bold text-rose-800">Detractores (0-6)</span>
                        <div className="text-2xl font-black text-rose-700">{stats.detractoresPct}%</div>
                        <p className="text-[10px] text-rose-600">Riesgo de desmotivación</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Fórmula Oficial: % Promotores ({stats.promotoresPct}%) &minus; % Detractores ({stats.detractoresPct}%)</span>
                        <span className="text-slate-900 font-mono text-sm">= {stats.enps > 0 ? `+${stats.enps}` : stats.enps}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {stats.enps >= 40 
                          ? 'Excelente: Nivel sobresaliente de lealtad y compromiso corporativo.'
                          : stats.enps >= 15
                          ? 'Bueno: Clima positivo con oportunidades concretas de fidelización.'
                          : 'Atención: Se requiere priorizar el plan de acción en áreas detractoras.'}
                      </p>
                    </div>
                  </div>

                  {/* Bloque Pregunta 40: Prioridades de Mejora */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Prioridades de Mejora señaladas por el Personal (Pregunta 40)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Dimensiones que los colaboradores eligieron como las 2 más importantes a intervenir:
                      </p>
                    </div>

                    {stats.prioridades.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No hay suficientes respuestas registradas en esta pregunta.</p>
                    ) : (
                      <div className="space-y-2">
                        {stats.prioridades.map((item, idx) => (
                          <div key={item.nombre} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-800">
                                #{idx + 1} {item.nombre}
                              </span>
                              <span className="font-mono text-slate-600 font-bold">
                                {item.votos} menciones ({item.porcentaje}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-[#345D9D] rounded-full transition-all duration-300" 
                                style={{ width: `${Math.min(100, item.porcentaje)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CONTENIDO SUB-PESTAÑA 3: BUZÓN CUALITATIVO */}
              {subTab === 'cualitativo' && (
                <div className="space-y-4">
                  {/* Selector de Pregunta de Texto Libre */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      { id: '41', label: 'P41: Lo que más valoran' },
                      { id: '42', label: 'P42: Lo que cambiarían' },
                      { id: '43', label: 'P43: Acción prioritaria sugerida' },
                      { id: '29', label: 'P29: Trato y convivencia' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setCualitativaSeleccionada(tab.id)}
                        className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                          cualitativaSeleccionada === tab.id
                            ? 'bg-[#345D9D] text-white border-[#345D9D] shadow-md shadow-[#345D9D]/20'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2.5">
                    {stats.comentarios.length === 0 ? (
                      <div className="p-8 text-center rounded-xl bg-slate-50 text-slate-400 text-xs">
                        No hay comentarios registrados para esta pregunta en el segmento seleccionado.
                      </div>
                    ) : (
                      stats.comentarios.map((c, i) => (
                        <div 
                          key={i} 
                          className="p-3.5 rounded-xl bg-white border border-slate-200 text-left space-y-1.5 shadow-sm"
                        >
                          <p className="text-xs text-slate-800 leading-relaxed italic">
                            &ldquo;{c.texto}&rdquo;
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                            <span>Sede: {c.sede}</span>
                            <span>&bull;</span>
                            <span>Puesto: {c.puesto}</span>
                            <span>&bull;</span>
                            <span className="text-emerald-600 font-semibold">100% Confidencial</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
