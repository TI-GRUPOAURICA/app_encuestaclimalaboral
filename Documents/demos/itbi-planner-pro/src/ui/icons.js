/* ═════════════════════════════════════════════════════════════════════════════
   icons.js — Iconos SVG (estilo feather, stroke 1.8) usados en todo el markup.
   Cada función recibe clases extra (tamaño/color) y devuelve un <svg> completo.
═════════════════════════════════════════════════════════════════════════════ */

const S = (cls = 'w-4 h-4') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">`

const E = '</svg>'

export const ic = {
  plus: (cls) => `${S(cls)}<path d="M12 5v14M5 12h14"/>${E}`,
  x: (cls) => `${S(cls)}<path d="M18 6 6 18M6 6l12 12"/>${E}`,
  search: (cls) => `${S(cls)}<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>${E}`,
  chevronDown: (cls) => `${S(cls)}<path d="m6 9 6 6 6-6"/>${E}`,
  chevronRight: (cls) => `${S(cls)}<path d="m9 18 6-6-6-6"/>${E}`,
  copy: (cls) => `${S(cls)}<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>${E}`,

  folder: (cls) => `${S(cls)}<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>${E}`,
  calendar: (cls) => `${S(cls)}<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>${E}`,
  clock: (cls) => `${S(cls)}<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>${E}`,
  users: (cls) => `${S(cls)}<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>${E}`,
  user: (cls) => `${S(cls)}<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>${E}`,

  checkCircle: (cls) => `${S(cls)}<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>${E}`,
  alertTriangle: (cls) => `${S(cls)}<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>${E}`,
  activity: (cls) => `${S(cls)}<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>${E}`,
  flag: (cls) => `${S(cls)}<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>${E}`,
  layers: (cls) => `${S(cls)}<path d="m12 2 10 6-10 6L2 8z"/><path d="m2 14 10 6 10-6"/>${E}`,
  code: (cls) => `${S(cls)}<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>${E}`,

  barChart: (cls) => `${S(cls)}<path d="M12 20V10M18 20V4M6 20v-4"/>${E}`,
  donutChart: (cls) => `${S(cls)}<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>${E}`,
  fileText: (cls) => `${S(cls)}<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>${E}`,

  route: (cls) => `${S(cls)}<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H12"/>${E}`,
  edit: (cls) => `${S(cls)}<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>${E}`,
  trash: (cls) => `${S(cls)}<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>${E}`,
  zap: (cls) => `${S(cls)}<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>${E}`,
}
