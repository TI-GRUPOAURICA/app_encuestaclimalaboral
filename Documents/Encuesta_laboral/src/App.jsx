import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import ValidationScreen from './components/ValidationScreen';
import TunnelTransition from './components/TunnelTransition';
import SurveyScreen from './components/SurveyScreen';
import SuccessScreen from './components/SuccessScreen';
import AdminModal from './components/AdminModal';
import { registrarParticipacionDNI, guardarRespuestasAnonimas, isConfigured } from './lib/supabase';
import { Shield, Settings } from 'lucide-react';

export default function App() {
  // Estados del flujo SPA: 'validation' | 'tunnel' | 'survey' | 'success'
  const [stage, setStage] = useState('validation');
  
  // DNI almacenado temporalmente solo para la validación y el registro de asistencia
  const [dni, setDni] = useState('');

  // Metadatos demográficos para reportes (Sede, Área, Antigüedad, Tipo de Puesto)
  const [demographicMetadata, setDemographicMetadata] = useState(null);
  
  // Estado de carga durante el envío
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal de administración de preguntas y padrón
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Asegurar fondo corporativo claro, limpio y legible en todo el documento
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.className = 'min-h-full bg-slate-50 text-slate-900 font-sans antialiased selection:bg-slate-900 selection:text-white';
  }, []);

  // Paso 1 -> Paso 2: Usuario valida su DNI y entra al túnel
  const handleValidateDni = (validatedDni, metadata) => {
    setDni(validatedDni);
    setDemographicMetadata(metadata);
    setStage('tunnel');
  };

  // Paso 2 -> Paso 3: El túnel finaliza la desconexión
  const handleTunnelComplete = () => {
    setStage('survey');
  };

  /**
   * =========================================================================
   * ENVÍO DE LA ENCUESTA: EJECUCIÓN DE DOS LLAMADAS DESACOPLADAS A SUPABASE
   * =========================================================================
   */
  const handleSurveySubmit = async (payload) => {
    setIsSubmitting(true);

    try {
      /**
       * LLAMADA 1: Registrar que el DNI ya emitió su voto (control de asistencia)
       * Código exacto para conectar con Supabase:
       * await supabase.from('control_dni').update({ voto: true }).eq('dni', dni);
       */
      const call1Promise = registrarParticipacionDNI(dni);

      /**
       * LLAMADA 2: Insertar respuestas 100% anónimas (Totalmente separada, NO incluye el DNI)
       * Incluye Sede, Área, Antigüedad, Tipo de Puesto y Respuestas para reportes cruzados
       */
      const call2Promise = guardarRespuestasAnonimas({
        metadata: demographicMetadata,
        respuestasMap: payload.respuestasMap,
        comentarios: payload.comentarios
      });

      // Ejecutar ambas llamadas simultáneamente de forma independiente
      const [res1, res2] = await Promise.all([call1Promise, call2Promise]);

      if (res1.error) {
        console.warn('Aviso en Llamada 1 (Control DNI):', res1.error);
      }
      if (res2.error) {
        console.warn('Aviso en Llamada 2 (Respuestas Clima):', res2.error);
      }

      // Descartar el DNI de la memoria de la aplicación inmediatamente tras cumplir el propósito
      setDni('');

      // Transición a la pantalla de éxito
      setStage('success');
    } catch (err) {
      console.error('Error durante el envío de la encuesta:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reiniciar flujo
  const handleReset = () => {
    setDni('');
    setDemographicMetadata(null);
    setStage('validation');
  };

  const isSurvey = stage === 'survey';

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-500 ${
      isSurvey ? 'bg-[#181a20]' : 'bg-slate-50'
    }`}>
      {/* Contenido principal centrado */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {stage === 'validation' && (
            <ValidationScreen
              key="validation-screen"
              onValidate={handleValidateDni}
            />
          )}

          {stage === 'tunnel' && (
            <TunnelTransition
              key="tunnel-screen"
              dni={dni}
              onTunnelComplete={handleTunnelComplete}
            />
          )}

          {stage === 'survey' && (
            <SurveyScreen
              key="survey-screen"
              demographicMetadata={demographicMetadata}
              onSubmit={handleSurveySubmit}
              isSubmitting={isSubmitting}
            />
          )}

          {stage === 'success' && (
            <SuccessScreen
              key="success-screen"
              onReset={handleReset}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Pie de página neutral adaptable */}
      <footer className={`py-5 px-6 border-t transition-colors duration-500 ${
        isSurvey 
          ? 'border-slate-800 bg-[#121316]/90 text-slate-400' 
          : 'border-slate-200/60 bg-white/50 text-slate-500 backdrop-blur-sm'
      }`}>
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-xs">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>
            Canal Criptográfico de Evaluación Laboral &bull; Respuestas 100% Desvinculadas
          </span>
        </div>
      </footer>

      {/* Acceso privado sutil para TI / Gerencia: casi transparente en la esquina */}
      <button
        type="button"
        onClick={() => setIsAdminOpen(true)}
        title="Configuración"
        aria-label="Panel de Control y Métricas"
        className={`fixed bottom-2.5 right-2.5 z-40 p-2.5 opacity-20 hover:opacity-100 transition-all duration-200 rounded-full cursor-pointer focus:outline-none ${
          isSurvey 
            ? 'text-slate-500 hover:text-white hover:bg-slate-800' 
            : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200/50'
        }`}
      >
        <Settings className="w-4 h-4" />
      </button>

      {/* Modal de Administración */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onQuestionsUpdated={() => {
          // Forzar recarga si estamos en la encuesta
        }}
      />
    </div>
  );
}
