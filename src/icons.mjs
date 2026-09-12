// Thin line icons (24x24 grid, currentColor stroke). Keep them simple and uniform.
const s = (body, w = 1.25) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

export const icons = {
  logo: s('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  home: s('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>'),
  blueprint: s('<rect x="3" y="4" width="18" height="16" rx="1"/><rect x="8" y="9" width="8" height="6"/><path d="M3 8h2M19 8h2M3 16h2M19 16h2"/>'),
  bricks: s('<rect x="3" y="14" width="18" height="5"/><rect x="5" y="9" width="14" height="5"/><rect x="8" y="4" width="8" height="5"/>'),
  helmet: s('<path d="M3 16a9 9 0 0 1 18 0"/><path d="M2 16h20v2H2z"/><path d="M9 8V5h6v3"/>'),
  permit: s('<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 8h8M8 12h8M8 16h4"/>'),
  award: s('<circle cx="12" cy="9" r="5"/><path d="M9 13.5 7.5 21l4.5-2.5L16.5 21 15 13.5"/>'),
  building: s('<rect x="4" y="3" width="16" height="18"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>'),
  doc: s('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>'),
  'shield-check': s('<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  shield: s('<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z"/>'),
  steps: s('<path d="M4 20h4v-4h4v-4h4V8h4"/><path d="M3 4h6"/>'),
  camera: s('<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>'),
  calendar: s('<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M7 14h2M11 14h2M15 14h2"/>'),
  phone: s('<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 5a2 2 0 0 1 2-2z"/>'),
  mail: s('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  pin: s('<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
  clock: s('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
  whatsapp: s('<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z"/><path d="M8.5 9c0 3.5 3 6.5 6.5 6.5.5 0 1-.4 1-1l-.2-1-2-.6-1 1a6 6 0 0 1-2.7-2.7l1-1-.6-2-1-.2c-.6 0-1 .5-1 1z"/>'),
  arrow: s('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  star: s('<path d="m12 4 2.4 5 5.6.8-4 3.9 1 5.5L12 16.6 7 19.2l1-5.5-4-3.9L9.6 9z"/>'),
  close: s('<path d="M6 6l12 12M18 6 6 18"/>', 1.5),
  menu: s('<path d="M4 7h16M4 12h16M4 17h16"/>', 1.5),
  globe: s('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>'),
  check: s('<path d="m5 13 4 4L19 7"/>', 1.5),
  chevron: s('<path d="m6 9 6 6 6-6"/>'),
};

export const icon = (name) => icons[name] || icons.check;
export const starRow = (n = 5) =>
  `<span class="stars" aria-label="${n}/5">${Array.from({ length: n }, () => `<svg viewBox="0 0 24 24" class="star" aria-hidden="true"><path d="m12 4 2.4 5 5.6.8-4 3.9 1 5.5L12 16.6 7 19.2l1-5.5-4-3.9L9.6 9z" fill="currentColor"/></svg>`).join('')}</span>`;
