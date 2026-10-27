import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, AlertCircle, Info } from 'lucide-react';
import PlatformLogo from './PlatformLogo';
import { verificarDNIEnPadron } from '../lib/supabase';

export default function ValidationScreen({ onValidate }) {
  const [dni, setDni] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [warningMsg, setWarningMsg] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleDniChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo dígitos
    if (value.length <= 8) {
      setDni(value);
      if (errorMsg) setErrorMsg('');
      if (warningMsg) setWarningMsg('');
    }
  };

  const isDniValid = dni.length === 8;
  const canSubmit = isDniValid && hasAgreed && !isValidating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isDniValid) {
      setErrorMsg('El DNI debe contener exactamente 8 dígitos numéricos.');
      return;
    }
    if (!hasAgreed) {
      setErrorMsg('Debes confirmar el entendimiento de la política de anonimato para continuar.');
      return;
    }

    setIsValidating(true);
    setErrorMsg('');
    setWarningMsg('');

    try {
      // Bloqueo explícito de DNIs de prueba
      const DEMO_DNIS = ['72345678', '12345678', '87654321', '44556677'];
      if (DEMO_DNIS.includes(dni)) {
        setErrorMsg('El DNI ingresado no figura en el padrón de colaboradores habilitados.');
        setIsValidating(false);
        return;
      }

      const res = await verificarDNIEnPadron(dni);

      if (!res.exists || !res.metadata) {
        setErrorMsg('El DNI ingresado no figura en el padrón de colaboradores autorizados para la encuesta.');
        setIsValidating(false);
        return;
      }

      if (res.alreadyVoted) {
        setWarningMsg('Este DNI ya completó la encuesta previamente. ¡Muchas gracias por tu participación!');
        setIsValidating(false);
        return;
      }

      onValidate(dni, res.metadata);
    } catch (err) {
      console.error('Error al validar DNI:', err);
      setErrorMsg('Error de conexión al verificar el DNI. Por favor intenta de nuevo.');
    } finally {
      setIsValidating(false);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Tarjeta corporativa estilo minimalista oficial */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden text-left">
        {/* Barra superior de estado */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <PlatformLogo showSubtitle={true} />
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-500 stroke-[2]" />
            <span>Canal cifrado</span>
          </div>
        </div>

        {/* Cuerpo del formulario */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Título: NEUTRAL · ANÓNIMA y Encuesta 2026 */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              NEUTRAL &bull; ANÓNIMA
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Encuesta 2026
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
              Plataforma independiente y segura para la evaluación del entorno de trabajo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input DNI */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label 
                  htmlFor="dni-input" 
                  className="font-bold text-slate-700 uppercase tracking-wider"
                >
                  DOCUMENTO NACIONAL DE IDENTIDAD (DNI)
                </label>
                <span className={`font-mono font-medium ${
                  isDniValid ? 'text-emerald-600 font-bold' : 'text-slate-400'
                }`}>
                  {dni.length} / 8 dígitos
                </span>
              </div>

              <input
                id="dni-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={dni}
                onChange={handleDniChange}
                placeholder="Ingresa tu DNI"
                autoFocus
                className={`w-full text-base sm:text-lg font-medium py-3 px-4 rounded-xl border transition-all duration-150 outline-none placeholder:text-slate-400 ${
                  isDniValid
                    ? 'border-slate-900 bg-white text-slate-900 ring-2 ring-slate-900/10'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10'
                }`}
              />

              <p className="text-xs text-slate-400 pt-0.5">
                Usa tu DNI registrado en la planilla corporativa.
              </p>
            </div>

            {/* Caja de Transparencia */}
            <div className="rounded-xl p-4 sm:p-5 bg-slate-50 border border-slate-200/80 space-y-1.5 text-left">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                Transparencia
              </h2>
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                <strong className="text-slate-800">¿Por qué te pedimos tu DNI?</strong> Solo lo usamos para marcar tu asistencia en la base de datos y que tu área cumpla la meta. Al presionar Entrar, el sistema desconectará tu identidad. Tus respuestas viajarán por un túnel 100% anónimo. Sistemas no podrá ver qué marcaste.
              </p>
            </div>

            {/* Checkbox */}
            <div className="pt-1">
              <label 
                htmlFor="agree-checkbox" 
                className="flex items-start gap-3 cursor-pointer select-none group text-left"
              >
                <input
                  id="agree-checkbox"
                  type="checkbox"
                  checked={hasAgreed}
                  onChange={(e) => {
                    setHasAgreed(e.target.checked);
                    if (errorMsg) setErrorMsg('');
                    if (warningMsg) setWarningMsg('');
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-black focus:ring-slate-900 cursor-pointer accent-black"
                />
                <span className="text-xs sm:text-[13px] text-slate-700 font-normal leading-snug group-hover:text-slate-900">
                  Entiendo que mi DNI actúa solo como llave de acceso y que mis respuestas no serán rastreables.
                </span>
              </label>
            </div>

            {/* Avisos de advertencia / error */}
            {warningMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-medium"
              >
                <Info className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{warningMsg}</span>
              </motion.div>
            )}

            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {/* Botón Principal: Negro sólido ("en lugar de ese azul, usemos el negro para todo") */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-150 ${
                canSubmit
                  ? 'bg-slate-950 hover:bg-black text-white shadow-sm active:scale-[0.99] cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Validar y Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Pie inferior con protocolos */}
      <div className="pt-4 text-center text-xs text-slate-400 font-medium">
        Cifrado TLS 1.3 &bull; Protocolo Zero-Knowledge &bull; Servidor neutral
      </div>
    </motion.div>
  );
}
