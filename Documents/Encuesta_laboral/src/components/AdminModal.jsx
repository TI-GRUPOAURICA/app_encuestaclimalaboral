import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, Upload, Shield, CheckCircle, AlertCircle, 
  HelpCircle, Users, BarChart3, Lock, RefreshCw, Search, Filter, 
  CheckCircle2, Clock, Building2, MapPin, Briefcase, Check
} from 'lucide-react';
import { 
  adminSubirPreguntas, 
  adminSubirPadronDNI, 
  adminObtenerTodasLasPreguntas,
  obtenerDashboardGerencial,
  AREAS_DISPONIBLES 
} from '../lib/supabase';

export default function AdminModal({ isOpen, onClose, onQuestionsUpdated }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'preguntas' | 'padron'
  
  // Datos del Dashboard
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos'); // 'todos' | 'participaron' | 'pendientes'
  const [filterArea, setFilterArea] = useState('todas');

  // Datos de preguntas y feedback
  const [questionsList, setQuestionsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      cargarDatos();
    }
  }, [isOpen, isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === '2026' || pin === 'admin2026') {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('PIN incorrecto. El PIN por defecto es: 2026');
    }
  };

  const cargarDatos = async () => {
    setLoadingMetrics(true);
    const data = await obtenerDashboardGerencial();
    setMetrics(data);
    setLoadingMetrics(false);

    const questions = await adminObtenerTodasLasPreguntas();
    setQuestionsList(questions || []);
  };

  /**
   * =========================================================================
   * DESCARGAR REPORTE DE SEGUIMIENTO EN CSV PARA GERENCIA
   * =========================================================================
   */
  const handleExportTrackingReport = () => {
    if (!metrics || !metrics.colaboradores) return;

    let csv = 'DNI,Nombre,Sede,Area,Antiguedad,Tipo_Puesto,Estado,Fecha_Participacion\n';
    metrics.colaboradores.forEach(c => {
      csv += `"${c.dni}","${c.nombre || ''}","${c.sede || ''}","${c.area || ''}","${c.antiguedad || ''}","${c.tipo_puesto || ''}","${c.voto ? 'PARTICIPO' : 'PENDIENTE'}","${c.fecha_participacion || ''}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_participacion_encuesta_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * =========================================================================
   * DESCARGAR PLANTILLA CSV DE PREGUNTAS
   * =========================================================================
   */
  const handleDownloadQuestionsTemplate = () => {
    const csvContent = 
`orden,seccion,titulo,descripcion,tipo,es_requerida
1,Condiciones y Recursos,El ambiente físico de mi área de trabajo es seguro adecuado y cómodo,,escala_1_5,true
2,Condiciones y Recursos,Cuento con los equipos herramientas y materiales necesarios,,escala_1_5,true
39,Pertenencia y Compromiso,Qué tan probable es que recomiendes la empresa como un buen lugar para trabajar,Escala 0 al 10,escala_0_10,true
43,Prioridades y Sugerencias,Qué acción concreta consideras que debería priorizar la empresa,,texto_libre,false`;

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_preguntas_encuesta.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * =========================================================================
   * DESCARGAR PLANTILLA CSV DEL PADRÓN DNI (CON NOMBRE Y SEGMENTOS)
   * =========================================================================
   */
  const handleDownloadPadronTemplate = () => {
    const csvContent = 
`dni,nombre,sede,area,antiguedad,tipo_puesto
72345678,Carlos Ramos,Lima,Operaciones, Refinería, Fundición y Producción,1 a 3 años,Operativo
12345678,Ana Valdivia,Lima,Administración y Finanzas,Más de 3 años,Administrativo
87654321,Luis Benítez,Chala,Mantenimiento,1 a 3 años,Operativo
44556677,Elena Morales,Arequipa,Laboratorio,Menos de 1 año,Operativo`;

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_padron_colaboradores.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * =========================================================================
   * SUBIR PREGUNTAS DESDE CSV
   * =========================================================================
   */
  const handleUploadQuestionsCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setFeedback({ type: '', message: '' });

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      
      if (lines.length < 2) {
        throw new Error('El archivo CSV está vacío o no contiene preguntas.');
      }

      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length >= 2 && parts[2]) {
          parsed.push({
            orden: parseInt(parts[0], 10) || i,
            seccion: parts[1] || 'General',
            titulo: parts[2],
            descripcion: parts[3] || null,
            tipo: parts[4] || 'escala_1_5',
            es_requerida: parts[5] ? parts[5].toLowerCase() === 'true' : true,
            activa: true
          });
        }
      }

      const res = await adminSubirPreguntas(parsed);
      if (res.success) {
        setFeedback({ type: 'success', message: `¡Se cargaron ${parsed.length} preguntas exitosamente!` });
        await cargarDatos();
        if (onQuestionsUpdated) onQuestionsUpdated();
      } else {
        throw new Error(res.error || 'Error al guardar en Supabase.');
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  /**
   * =========================================================================
   * SUBIR PADRÓN DNI DESDE CSV
   * =========================================================================
   */
  const handleUploadPadronCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setFeedback({ type: '', message: '' });

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

      if (lines.length < 2) {
        throw new Error('El archivo CSV no contiene registros de colaboradores.');
      }

      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length >= 2 && parts[0]) {
          const dniSanitized = parts[0].replace(/\D/g, '').slice(0, 8);
          if (dniSanitized.length === 8) {
            parsed.push({
              dni: dniSanitized,
              nombre: parts[1] || 'Colaborador',
              sede: parts[2] || 'Lima',
              area: parts[3] || 'Operaciones, Refinería, Fundición y Producción',
              antiguedad: parts[4] || '1 a 3 años',
              tipo_puesto: parts[5] || 'Operativo',
              voto: false
            });
          }
        }
      }

      const res = await adminSubirPadronDNI(parsed);
      if (res.success) {
        setFeedback({ type: 'success', message: `¡Padrón actualizado con ${parsed.length} colaboradores!` });
        await cargarDatos();
      } else {
        throw new Error(res.error || 'Error al guardar padrón en Supabase.');
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  // Filtrado de lista de colaboradores
  const colaboradoresFiltrados = (metrics?.colaboradores || []).filter(c => {
    const matchesSearch = 
      (c.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.dni.includes(searchTerm);
    
    const matchesStatus = 
      filterStatus === 'todos' ||
      (filterStatus === 'participaron' && c.voto) ||
      (filterStatus === 'pendientes' && !c.voto);

    const matchesArea = 
      filterArea === 'todas' ||
      c.area === filterArea;

    return matchesSearch && matchesStatus && matchesArea;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left"
      >
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-emerald-400 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Panel de Control &bull; Encuesta 2026
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Monitoreo de participación gerencial y configuración de plataforma
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pantalla de Autenticación con PIN */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="p-8 sm:p-12 space-y-5 text-center max-w-sm mx-auto my-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Acceso Gerencial y TI</h4>
              <p className="text-xs text-slate-500 mt-1">
                Ingresa el PIN de seguridad para acceder al dashboard y gestión.
              </p>
            </div>

            <input
              type="password"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN (por defecto: 2026)"
              className="w-full text-center tracking-widest font-mono text-xl py-3 px-4 rounded-xl border border-slate-200 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10 outline-none"
              autoFocus
            />

            {pinError && (
              <p className="text-xs text-rose-600 font-medium">{pinError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-slate-950 hover:bg-black text-white font-bold text-sm transition-colors cursor-pointer shadow-sm"
            >
              Ingresar al Dashboard
            </button>
          </form>
        ) : (
          /* Contenido del Panel Autenticado */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Pestañas de navegación */}
            <div className="flex border-b border-slate-200 gap-6 text-xs sm:text-sm font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`pb-3 flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'border-b-2 border-slate-950 text-slate-950'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard Gerencial (En Vivo)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('padron')}
                className={`pb-3 flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'padron'
                    ? 'border-b-2 border-slate-950 text-slate-950'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                Padrón DNI y Colaboradores
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preguntas')}
                className={`pb-3 flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'preguntas'
                    ? 'border-b-2 border-slate-950 text-slate-950'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                Preguntas de la Encuesta
              </button>
            </div>

            {/* Mensajes de feedback */}
            {feedback.message && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm ${
                feedback.type === 'success' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {feedback.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* =========================================================================
                PESTAÑA 1: DASHBOARD GERENCIAL EN VIVO (CUÁNTOS YA HICIERON / CUÁNTOS FALTAN)
               ========================================================================= */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* 4 KPI Cards Gerenciales */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Total Padrón
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                      {metrics?.total ?? 0}
                    </div>
                    <p className="text-[11px] text-slate-400">Colaboradores habilitados</p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        Ya Completaron
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
                      {metrics?.participaron ?? 0}
                    </div>
                    <p className="text-[11px] text-emerald-600 font-semibold">
                      {metrics?.porcentaje ?? 0}% de avance
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                        Faltan Responder
                      </span>
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-mono">
                      {metrics?.faltan ?? 0}
                    </div>
                    <p className="text-[11px] text-amber-600 font-semibold">
                      {100 - (metrics?.porcentaje ?? 0)}% pendiente
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm space-y-1">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Meta de Cobertura
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-mono">
                      {metrics?.porcentaje ?? 0}%
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="h-full bg-slate-950 transition-all duration-300"
                        style={{ width: `${metrics?.porcentaje ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Desglose Gráfico: Por Sede y Por Área */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Desglose por Sede */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <MapPin className="w-4 h-4 text-slate-900" />
                        Participación por Sede
                      </div>
                      <span className="text-xs text-slate-400 font-mono">Completados / Total</span>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(metrics?.porSede || {}).map(([sede, data]) => {
                        const pct = data.total > 0 ? Math.round((data.votaron / data.total) * 100) : 0;
                        return (
                          <div key={sede} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-700">{sede}</span>
                              <span className="font-mono text-slate-500">
                                {data.votaron} / {data.total} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                              <div
                                className="h-full bg-slate-950 transition-all duration-200"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Desglose por Tipo de Puesto */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <Briefcase className="w-4 h-4 text-slate-900" />
                        Participación por Tipo de Puesto
                      </div>
                      <span className="text-xs text-slate-400 font-mono">Completados / Total</span>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(metrics?.porPuesto || {}).map(([puesto, data]) => {
                        const pct = data.total > 0 ? Math.round((data.votaron / data.total) * 100) : 0;
                        return (
                          <div key={puesto} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-700">{puesto}</span>
                              <span className="font-mono text-slate-500">
                                {data.votaron} / {data.total} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                              <div
                                className="h-full bg-slate-950 transition-all duration-200"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Desglose Completo por las 11 Áreas de Trabajo */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Building2 className="w-4 h-4 text-slate-900" />
                      Avance por Área de Trabajo ({Object.keys(metrics?.porArea || {}).length} áreas)
                    </div>
                    <button
                      onClick={cargarDatos}
                      className="text-xs text-slate-700 hover:text-black hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <RefreshCw className="w-3 h-3" /> Actualizar datos
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {Object.entries(metrics?.porArea || {}).map(([area, data]) => {
                      const pct = data.total > 0 ? Math.round((data.votaron / data.total) * 100) : 0;
                      return (
                        <div key={area} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-bold text-slate-800 line-clamp-1">{area}</span>
                            <span className={`text-[11px] font-mono font-bold shrink-0 ${pct === 100 ? 'text-emerald-700' : pct > 50 ? 'text-slate-950' : 'text-amber-700'}`}>
                              {data.votaron}/{data.total} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-200 ${pct === 100 ? 'bg-emerald-600' : 'bg-slate-950'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tabla de Seguimiento Nominal para Gerencia */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Listado de Seguimiento de Colaboradores
                      </h4>
                      <p className="text-xs text-slate-500">
                        Permite a Gerencia y RR. HH. identificar qué personas aún faltan completar la encuesta.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportTrackingReport}
                      className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Exportar Lista CSV
                    </button>
                  </div>

                  {/* Filtros de búsqueda */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar por DNI o Nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:border-blue-700 outline-none"
                      />
                    </div>

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="py-2 px-3 rounded-xl border border-slate-200 focus:border-blue-700 outline-none bg-white font-medium"
                    >
                      <option value="todos">Todos los Estados</option>
                      <option value="pendientes">Solo Pendientes (Faltan)</option>
                      <option value="participaron">Solo Completados (Ya votaron)</option>
                    </select>

                    <select
                      value={filterArea}
                      onChange={(e) => setFilterArea(e.target.value)}
                      className="py-2 px-3 rounded-xl border border-slate-200 focus:border-blue-700 outline-none bg-white font-medium truncate"
                    >
                      <option value="todas">Todas las Áreas</option>
                      {AREAS_DISPONIBLES.map((a, idx) => (
                        <option key={idx} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tabla con scroll */}
                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">DNI</th>
                          <th className="py-2.5 px-3">Colaborador</th>
                          <th className="py-2.5 px-3">Sede</th>
                          <th className="py-2.5 px-3">Área</th>
                          <th className="py-2.5 px-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {colaboradoresFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400">
                              No se encontraron registros con los filtros seleccionados.
                            </td>
                          </tr>
                        ) : (
                          colaboradoresFiltrados.map((c, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2 px-3 font-mono font-medium text-slate-700">
                                {c.dni}
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                {c.nombre || 'Colaborador'}
                              </td>
                              <td className="py-2 px-3 text-slate-600">
                                {c.sede || 'Lima'}
                              </td>
                              <td className="py-2 px-3 text-slate-600 truncate max-w-[180px]">
                                {c.area}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {c.voto ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <Check className="w-3 h-3" /> Completado
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                                    <Clock className="w-3 h-3" /> Pendiente
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono text-right">
                    Mostrando {colaboradoresFiltrados.length} colaboradores
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                PESTAÑA 2: CARGA DE PADRÓN DNI (CON NOMBRE Y SEGMENTOS)
               ========================================================================= */}
            {activeTab === 'padron' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Descargar Plantilla Padrón */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                      <Download className="w-4 h-4 text-emerald-600" />
                      1. Descargar Plantilla Padrón
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Descarga el formato con las columnas: <code>dni, nombre, sede, area, antiguedad, tipo_puesto</code>.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadPadronTemplate}
                      className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Plantilla Padrón (.csv)
                    </button>
                  </div>

                  {/* Subir Padrón Masivo */}
                  <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      2. Subir Padrón Colaboradores
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Carga la lista oficial de colaboradores con su nombre, sede, área y puesto.
                    </p>
                    <label className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm">
                      <Upload className="w-4 h-4" />
                      <span>{loading ? 'Procesando...' : 'Subir Padrón (.csv)'}</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleUploadPadronCSV}
                        disabled={loading}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {/* Lista de Áreas Oficiales Reconocidas */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h6 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Áreas Oficiales Reconocidas para Reportes BI:
                  </h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
                    {AREAS_DISPONIBLES.map((area, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0"></span>
                        <span className="truncate">{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                PESTAÑA 3: GESTOR DE PREGUNTAS
               ========================================================================= */}
            {activeTab === 'preguntas' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Descargar Plantilla */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                      <Download className="w-4 h-4 text-slate-900" />
                      1. Descargar Formato de Preguntas
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Descarga la plantilla CSV con el formato oficial (escala 1-5, eNPS 0-10, opción simple y texto libre).
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadQuestionsTemplate}
                      className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Plantilla (.csv)
                    </button>
                  </div>

                  {/* Subir Preguntas */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Upload className="w-4 h-4 text-slate-900" />
                      2. Subir Preguntas
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Sube tu archivo CSV completado para actualizar las preguntas en Supabase en tiempo real.
                    </p>
                    <label className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-black text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm">
                      <Upload className="w-4 h-4" />
                      <span>{loading ? 'Subiendo...' : 'Seleccionar archivo CSV'}</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleUploadQuestionsCSV}
                        disabled={loading}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {/* Vista previa de preguntas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Preguntas Registradas ({questionsList.length})
                    </h5>
                    <button
                      onClick={cargarDatos}
                      className="text-xs text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Actualizar
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-2 bg-slate-50">
                    {questionsList.map((q, idx) => (
                      <div key={q.id || idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900">
                            {q.orden}. {q.titulo}
                          </span>
                          <p className="text-[11px] text-slate-500 truncate max-w-sm">
                            {q.seccion} &bull; {q.descripcion || 'Sin descripción'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                            {q.tipo}
                          </span>
                          <span className={`text-[10px] font-bold ${q.es_requerida ? 'text-amber-700' : 'text-slate-400'}`}>
                            {q.es_requerida ? 'Requerida' : 'Opcional'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
