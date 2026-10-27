import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, CheckCircle2 } from 'lucide-react';
import IncognitoIcon from './IncognitoIcon';

export default function TunnelTransition({ dni, onTunnelComplete }) {
  const [stepIndex, setStepIndex] = useState(0);

  const maskedDni = dni ? `${dni.slice(0, 2)}••••${dni.slice(-2)}` : '••••••••';

  const steps = [
    {
      title: "Verificando en padrón...",
      subtitle: "Comprobando llave de acceso en el padrón de colaboradores.",
      icon: UserCheck,
      isIncognito: false,
      color: "text-slate-900",
      bgColor: "bg-slate-100",
      borderColor: "border-slate-200",
      progress: 33,
    },
    {
      title: "Acceso concedido. Asistencia registrada...",
      subtitle: "Tu participación ha sido computada para la meta de tu área de trabajo.",
      icon: CheckCircle2,
      isIncognito: false,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      progress: 66,
    },
    {
      title: "Desconectando identidad... Activando Modo Incógnito",
      subtitle: "DNI desvinculado permanentemente. Entrando a un entorno 100% anónimo y sin remitente.",
      icon: null,
      isIncognito: true,
      color: "text-white",
      bgColor: "bg-slate-950",
      borderColor: "border-slate-800",
      progress: 100,
    },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStepIndex(1);
    }, 1100);

    const timer2 = setTimeout(() => {
      setStepIndex(2);
    }, 2200);

    const timer3 = setTimeout(() => {
      onTunnelComplete();
    }, 3600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onTunnelComplete]);

  const currentStep = steps[stepIndex];
  const StepIcon = currentStep.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-xl mx-auto px-4"
    >
      <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/50 border border-slate-200 text-center space-y-8">
        
        {/* Spinner dinámico con transición a ícono incógnito */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className={`absolute inset-0 rounded-full border-2 transition-colors duration-300 ${
              stepIndex === 2 
                ? 'border-slate-200 border-t-emerald-500 border-r-emerald-500' 
                : 'border-slate-200 border-t-slate-950 border-r-slate-950'
            }`}
          />

          <div className={`relative z-10 ${
            stepIndex === 2
              ? 'w-14 h-14 rounded-full bg-[#e8eaed] border border-slate-300 shadow-md'
              : `w-12 h-12 rounded-2xl ${currentStep.bgColor} ${currentStep.borderColor} border shadow-sm`
          } flex items-center justify-center transition-all duration-300`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={stepIndex}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                {currentStep.isIncognito ? (
                  <IncognitoIcon className="w-8 h-8 text-[#202124]" strokeWidth={5} />
                ) : (
                  <StepIcon className={`w-5 h-5 ${currentStep.color}`} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Textos dinámicos psicológicamente optimizados */}
        <div className="min-h-[85px] flex flex-col justify-center space-y-1.5">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="space-y-1.5"
            >
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {currentStep.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                {currentStep.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-2 max-w-sm mx-auto">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                stepIndex === 2 ? 'bg-slate-950' : 'bg-slate-900'
              }`}
              style={{ width: `${currentStep.progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono font-semibold text-slate-400">
            <span>PASO {stepIndex + 1} DE 3</span>
            <span>{currentStep.progress}% COMPLETADO</span>
          </div>
        </div>

        {/* Visualización de Desconexión de Identidad e Ingreso a Modo Incógnito */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
            <div className={`px-3.5 py-1.5 rounded-xl border font-mono font-medium transition-all duration-200 ${
              stepIndex === 2 
                ? 'bg-rose-50 border-rose-200 text-rose-600 line-through opacity-60' 
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              DNI: {stepIndex === 2 ? 'DESVINCULADO' : maskedDni}
            </div>

            <span className="text-slate-400 font-bold">➔</span>

            <div className={`px-3.5 py-1.5 rounded-xl border font-semibold transition-all duration-200 flex items-center gap-2 ${
              stepIndex === 2 
                ? 'bg-slate-950 border-slate-900 text-white shadow-sm' 
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              {stepIndex === 2 ? (
                <>
                  <IncognitoIcon className="w-4 h-4 text-emerald-400" />
                  <span>Modo Incógnito Activado</span>
                </>
              ) : (
                <span>Iniciando canal incógnito...</span>
              )}
            </div>
          </div>
          
          <p className="mt-3 text-xs text-slate-400 font-medium">
            Aislamiento criptográfico total &bull; Tus respuestas no tendrán remitente ni IP
          </p>
        </div>

      </div>
    </motion.div>
  );
}
