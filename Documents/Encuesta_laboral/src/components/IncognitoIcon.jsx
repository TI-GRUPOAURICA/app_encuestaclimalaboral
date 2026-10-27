import React from 'react';

/**
 * Ícono oficial de Modo Incógnito (Sombrero fedora con hendidura y gafas redondas con puente)
 * Idéntico al estándar de navegación privada de Google Chrome.
 */
export default function IncognitoIcon({ className = "w-6 h-6", color = "currentColor", strokeWidth = 5 }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`${className} shrink-0`} 
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Copa del sombrero con hendidura superior clásica */}
      <path d="M35 20 C 44 24, 56 24, 65 20 C 66.5 20, 67.5 21, 67.8 22.5 L 75 49 L 25 49 L 32.2 22.5 C 32.5 21, 33.5 20, 35 20 Z" />
      
      {/* Ala horizontal del sombrero */}
      <rect x="12" y="52" width="76" height="7" rx="3.5" />
      
      {/* Aros de las gafas con centro transparente/hueco */}
      <circle cx="34" cy="73" r="12" fill="none" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="66" cy="73" r="12" fill="none" stroke={color} strokeWidth={strokeWidth} />
      
      {/* Puente nasal curvado de las gafas */}
      <path d="M 45 71 C 47.5 66.5, 52.5 66.5, 55 71" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}
