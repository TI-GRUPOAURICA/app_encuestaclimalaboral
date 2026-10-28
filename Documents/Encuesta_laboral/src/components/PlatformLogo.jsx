import React from 'react';

export function GridLogoIcon({ className = "w-9 h-9" }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={`${className} shrink-0`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="6.5" fill="#345D9D" />
      <circle cx="6.5" cy="6.5" r="1.55" fill="white" />
      <circle cx="12" cy="6.5" r="1.55" fill="white" />
      <circle cx="17.5" cy="6.5" r="1.55" fill="white" />
      <circle cx="6.5" cy="12" r="1.55" fill="white" />
      <circle cx="12" cy="12" r="1.55" fill="white" />
      <circle cx="17.5" cy="12" r="1.55" fill="white" />
      <circle cx="6.5" cy="17.5" r="1.55" fill="white" />
      <circle cx="12" cy="17.5" r="1.55" fill="white" />
      <circle cx="17.5" cy="17.5" r="1.55" fill="white" />
    </svg>
  );
}

export default function PlatformLogo({ className = "", showSubtitle = true }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <GridLogoIcon className="w-8 h-8 sm:w-9 sm:h-9" />
      <div className="flex flex-col text-left leading-tight">
        <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
          Encuesta 2026
        </span>
        {showSubtitle && (
          <span className="text-[11px] sm:text-xs text-slate-500 font-normal">
            Servidor seguro de evaluación laboral
          </span>
        )}
      </div>
    </div>
  );
}
