import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import IncognitoIcon from './IncognitoIcon';
import { GridLogoIcon } from './PlatformLogo';
import { obtenerPreguntasActivas } from '../lib/supabase';
import { PREGUNTAS_OFICIALES, SECCIONES_ENCUESTA } from '../data/preguntasData';

const GRUPOS_SECCIONES = SECCIONES_ENCUESTA;

export default function SurveyScreen({ anonymousId, demographicMetadata, onSubmit, isSubmitting }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0); // 0 a 4
  const [loading, setLoading] = useState(true);
  const [validationError, setValidationError] = useState('');

  const scale1To5Labels = [
    { value: 1, label: 'Totalmente en desacuerdo', short: 'Totalmente en desacuerdo' },
    { value: 2, label: 'En desacuerdo', short: 'En desacuerdo' },
    { value: 3, label: 'Neutro', short: 'Neutro' },
    { value: 4, label: 'De acuerdo', short: 'De acuerdo' },
    { value: 5, label: 'Totalmente de acuerdo', short: 'Totalmente de acuerdo' },
  ];

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await obtenerPreguntasActivas();
      const list = data && data.length > 0 ? data : PREGUNTAS_OFICIALES;
      setQuestions(list);
      setLoading(false);
    }
    load();
  }, [demographicMetadata]);

  // Preguntas correspondientes al paso actual
  const currentGroup = GRUPOS_SECCIONES[currentStep];
  const stepQuestions = questions.filter(
    q => q.orden >= currentGroup.rango[0] && q.orden <= currentGroup.rango[1]
  );

  // Manejo de selecciones
  const handleSingleSelect = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    if (validationError) setValidationError('');
  };

  const handleMultipleSelect = (questionId, option, max = 2) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      const exists = current.includes(option);
      let updated;
      if (exists) {
        updated = current.filter(item => item !== option);
      } else {
        if (current.length >= max) {
          updated = [...current.slice(1), option];
        } else {
          updated = [...current, option];
        }
      }
      return { ...prev, [questionId]: updated };
    });
    if (validationError) setValidationError('');
  };

  const handleTextChange = (questionId, text) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  // Validar si el paso actual cumple con las requeridas
  const validateCurrentStep = () => {
    const missing = stepQuestions.filter(q => {
      if (!q.es_requerida) return false;
      const ans = answers[q.id || q.orden];
      if (ans === undefined || ans === null || ans === '') return true;
      if (Array.isArray(ans) && ans.length === 0) return true;
      return false;
    });

    if (missing.length > 0) {
      setValidationError(`Por favor responde las preguntas obligatorias de esta sección antes de avanzar (faltan ${missing.length}).`);
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep(prev => Math.min(prev + 1, GRUPOS_SECCIONES.length - 1));
    }
  };

  const handlePrevStep = () => {
    setValidationError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    const missingTotal = questions.filter(q => {
      if (!q.es_requerida) return false;
      const ans = answers[q.id || q.orden];
      if (ans === undefined || ans === null || ans === '') return true;
      if (Array.isArray(ans) && ans.length === 0) return true;
      return false;
    });

    if (missingTotal.length > 0) {
      setValidationError(`Faltan responder algunas preguntas obligatorias en secciones anteriores (${missingTotal.length}).`);
      return;
    }

    onSubmit({
      metadata: demographicMetadata,
      respuestasMap: answers
    });
  };

  if (loading) {
    return (
      <div className="w-full max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-slate-500 font-medium">Cargando cuestionario oficial 2026...</p>
      </div>
    );
  }

  // Progreso global
  const totalQuestions = questions.length || 43;
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '' && (!Array.isArray(answers[k]) || answers[k].length > 0)).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5"
    >
      {/* 1. HEADER SUPERIOR DE LA ENCUESTA (Matching Image 3) */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 sm:px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <GridLogoIcon className="w-8 h-8" />
          <span className="font-bold text-slate-900 text-sm sm:text-base">
            Encuesta 2026
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200/90 px-3 py-1.5 rounded-full">
          <IncognitoIcon className="w-4 h-4 text-slate-900" />
          <span>Modo Incógnito</span>
        </div>
      </div>

      {/* 2. BANNER DE SESIÓN SEGURA CON ÍCONO INCÓGNITO DE GOOGLE */}
      <div className="rounded-2xl bg-[#244372] text-white p-4 sm:p-5 text-left flex items-center gap-4 shadow-md border border-[#345D9D]/50">
        <div className="w-12 h-12 rounded-full bg-[#e8eaed] flex items-center justify-center shrink-0 shadow-md">
          <IncognitoIcon className="w-8 h-8 text-[#202124]" strokeWidth={5} />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
              MODO INCÓGNITO ACTIVADO &bull; CANAL DESVINCULADO
            </span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
            Tus respuestas son 100% anónimas y no guardan relación con tu identidad ni DNI.
          </p>
        </div>
      </div>

      {/* 3. BARRA DE PROGRESO SEGMENTADA EN 10 BLOQUES */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <div className="font-bold text-slate-900 text-xs sm:text-sm">
            Bloque {currentStep + 1} de {GRUPOS_SECCIONES.length} &bull; {currentGroup?.titulo}
          </div>
          <span className="text-slate-500 font-medium">
            {answeredCount} de {totalQuestions} respondidas ({progressPercent}%)
          </span>
        </div>

        {/* 10 Segmentos de barra de progreso */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
          {GRUPOS_SECCIONES.map((_, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div 
                key={idx}
                className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200"
              >
                {isCompleted && <div className="h-full w-full bg-[#345D9D]" />}
                {isCurrent && (
                  <div 
                    className="h-full bg-[#345D9D] transition-all duration-300"
                    style={{ 
                      width: `${Math.max(15, Math.min(100, (stepQuestions.filter(q => answers[q.id || q.orden] !== undefined).length / Math.max(1, stepQuestions.length)) * 100))}%` 
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Nota contextual del bloque si aplica (Bloque 4 o Bloque 6) */}
        {currentGroup?.nota && (
          <div className="mt-2 p-3 sm:p-3.5 rounded-xl bg-blue-50/90 border border-blue-200/80 text-[#244372] text-xs sm:text-sm font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#345D9D] shrink-0" />
            <span>{currentGroup.nota}</span>
          </div>
        )}
      </div>

      {/* 4. PREGUNTAS DEL PASO ACTUAL (Matching Image 3) */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 sm:space-y-5"
          >
            {stepQuestions.map((q) => {
              const qKey = q.id || q.orden;
              const val = answers[qKey];
              const isAnswered = val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0);

              return (
                <div
                  key={qKey}
                  className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-sm text-left space-y-4"
                >
                  {/* Encabezado de la pregunta: "PREGUNTA X · REQUERIDA" */}
                  <div className="flex items-center justify-between text-[11px] font-bold tracking-widest uppercase text-slate-400">
                    <span>
                      PREGUNTA {q.orden} &bull; {q.es_requerida ? 'REQUERIDA' : 'OPCIONAL'}
                    </span>
                    {isAnswered && (
                      <span className="text-emerald-700 font-bold flex items-center gap-1 normal-case tracking-normal text-xs">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Respondida
                      </span>
                    )}
                  </div>

                  {/* Título de la pregunta */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {q.titulo}
                  </h3>

                  {q.descripcion && (
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed -mt-1">
                      {q.descripcion}
                    </p>
                  )}

                  {/* TIPO: ESCALA 1 AL 5 (Horizontal 5 buttons matching Image 3) */}
                  {q.tipo === 'escala_1_5' && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5 pt-1">
                      {scale1To5Labels.map((opt) => {
                        const isSelected = val === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSingleSelect(qKey, opt.value)}
                            className={`p-3 sm:p-3.5 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-150 cursor-pointer select-none ${
                              isSelected
                                ? 'border-2 border-[#345D9D] bg-blue-50/50 text-[#345D9D] shadow-sm ring-1 ring-[#345D9D]/20'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-700'
                            }`}
                          >
                            {/* Radio circle + número */}
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected ? 'border-[#345D9D] bg-white' : 'border-slate-300'
                              }`}>
                                {isSelected && (
                                  <span className="w-2 h-2 rounded-full bg-[#345D9D]" />
                                )}
                              </span>
                              <span className="text-sm sm:text-base font-extrabold font-mono">
                                {opt.value}
                              </span>
                            </div>

                            {/* Etiqueta de la escala */}
                            <span className="text-[11px] sm:text-xs font-normal text-slate-600 leading-tight">
                              {opt.short}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* TIPO: ESCALA 0 AL 10 (eNPS) */}
                  {q.tipo === 'escala_0_10' && (
                    <div className="space-y-2.5 pt-1">
                      <div className="grid grid-cols-6 sm:grid-cols-11 gap-1 sm:gap-1.5">
                        {Array.from({ length: 11 }, (_, i) => i).map((num) => {
                          const isSelected = val === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleSingleSelect(qKey, num)}
                              className={`py-3 px-1 rounded-xl border font-mono font-bold text-sm sm:text-base flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-2 border-[#345D9D] bg-[#345D9D] text-white shadow-sm ring-2 ring-[#345D9D]/20'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-400 font-medium px-1">
                        <span>0 = Nada probable</span>
                        <span>10 = Totalmente probable</span>
                      </div>
                    </div>
                  )}

                  {/* TIPO: OPCIÓN SIMPLE (Sedes / Datos si aplica) */}
                  {q.tipo === 'opcion_simple' && q.opciones && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.opciones.map((opt, oIdx) => {
                        const isSelected = val === opt;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleSingleSelect(qKey, opt)}
                            className={`p-3.5 rounded-xl border text-left font-medium text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'border-2 border-[#345D9D] bg-blue-50/50 text-[#345D9D] font-bold shadow-sm'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <span>{opt}</span>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-[#345D9D]' : 'border-slate-300'
                            }`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-[#345D9D]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* TIPO: OPCIÓN MÚLTIPLE (Prioridades, máx 2) */}
                  {q.tipo === 'opcion_multiple' && q.opciones && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Selecciona hasta 2 opciones prioritarias:</span>
                        <span className="font-mono font-bold text-[#345D9D]">
                          {(val || []).length} / 2 seleccionadas
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.opciones.map((opt, oIdx) => {
                          const isSelected = (val || []).includes(opt);
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => handleMultipleSelect(qKey, opt, q.max_opciones || 2)}
                              className={`p-3.5 rounded-xl border text-left font-medium text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'border-2 border-[#345D9D] bg-blue-50/50 text-[#345D9D] font-bold shadow-sm'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <span>{opt}</span>
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-[#345D9D] bg-[#345D9D] text-white' : 'border-slate-300'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TIPO: TEXTO LIBRE */}
                  {q.tipo === 'texto_libre' && (
                    <div className="space-y-1.5 pt-1">
                      <textarea
                        rows={3}
                        maxLength={800}
                        value={val || ''}
                        onChange={(e) => handleTextChange(qKey, e.target.value)}
                        placeholder="Escribe tus observaciones o comentarios confidenciales..."
                        className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-xl p-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/10 transition-all resize-y min-h-[90px]"
                      />
                      <div className="flex justify-end text-[11px] font-mono text-slate-400">
                        <span>{(val || '').length} / 800 caracteres</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* ALERTA DE VALIDACIÓN */}
        {validationError && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* NAVEGACIÓN ENTRE SECCIONES: BOTÓN NEGRO SÓLIDO */}
        <div className="flex items-center justify-between gap-3 pt-3">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            className={`py-3 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              currentStep === 0
                ? 'opacity-0 pointer-events-none'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sección anterior</span>
          </button>

          {currentStep < GRUPOS_SECCIONES.length - 1 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="py-3 px-6 rounded-xl font-bold text-xs sm:text-sm bg-[#345D9D] hover:bg-[#284a7e] text-white flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#345D9D]/20 active:scale-[0.99]"
            >
              <span>Continuar a sección {currentStep + 2}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3.5 px-7 rounded-xl font-bold text-xs sm:text-sm bg-[#345D9D] hover:bg-[#284a7e] text-white flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#345D9D]/20 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Enviando respuestas anónimas...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Finalizar y Enviar Respuestas</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* PIE INFERIOR CON PROTOCOLOS */}
        <div className="pt-2 text-center text-xs text-slate-400 font-medium">
          Cifrado TLS 1.3 &bull; Protocolo Zero-Knowledge &bull; Servidor neutral
        </div>
      </form>
    </motion.div>
  );
}
