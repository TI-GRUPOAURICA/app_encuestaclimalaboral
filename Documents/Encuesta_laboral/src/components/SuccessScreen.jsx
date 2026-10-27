import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import IncognitoIcon from './IncognitoIcon';

export default function SuccessScreen({ onReset }) {
  const timestamp = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full max-w-xl md:max-w-2xl mx-auto text-center px-4 py-8"
    >
      <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 relative space-y-6">
        
        {/* Icono de verificación sobrio y corporativo (sin animaciones festivas) */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-700">
          <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
        </div>

        {/* Título y mensaje */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Respuestas Registradas
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
            Tu opinión anónima ha sido integrada con éxito en el sistema general. Gracias por contribuir con tu perspectiva sincera.
          </p>
        </div>

        {/* Tarjeta de Confirmación Limpia */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs sm:text-sm space-y-3">
          <div className="flex justify-between items-center text-slate-500 border-b border-slate-200 pb-3">
            <span className="flex items-center gap-2 text-slate-900 font-bold">
              <IncognitoIcon className="w-4 h-4 text-emerald-600" />
              Sesión en Modo Incógnito Concluida
            </span>
            <span className="text-xs text-slate-400 font-mono">{timestamp}</span>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-500">Estado de participación:</span>
            <span className="text-emerald-700 font-bold">Registrada para la meta del área</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Privacidad de respuestas:</span>
            <span className="text-slate-900 font-bold">Sin remitente ni identificador</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
            <span className="text-slate-500">Vínculo con DNI:</span>
            <span className="text-slate-700 font-bold uppercase tracking-wider">Desconectado permanentemente</span>
          </div>
        </div>

        {/* Acción de salida */}
        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={onReset}
            className="w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base bg-slate-900 hover:bg-slate-800 text-white transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Volver a la pantalla inicial</span>
          </button>

          <p className="text-xs sm:text-sm text-slate-400">
            Ya puedes cerrar esta pestaña con total seguridad.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
