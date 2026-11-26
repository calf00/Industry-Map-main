/**
 * Industry Map's original, monochrome icon set.
 *
 * Geometry is drawn on a 24 × 24 grid, with a shared stroke and optical inset.
 * Keep icons decorative: their neighbouring label or button aria-label names
 * the action. Fixed SVG geometry means data-file strings never become markup.
 */
const SECTORS = Object.freeze({
  aikatsu: '<path d="M7 7H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h9"/><rect x="7" y="2" width="14" height="17" rx="2"/><path d="m14 6 1.35 2.7 3 .45-2.18 2.1.52 3-2.69-1.42-2.69 1.42.52-3-2.18-2.1 3-.45L14 6Z"/>',
  energy: '<path d="m13.5 2-9 11h6L10 22l9.5-12h-6l0-8Z"/>',
  toys: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M6 8V4h4v4m4 0V4h4v4M7 13v3m5-3v3m5-3v3"/>',
  chemicals: '<path d="M9 3h6m-5 0v6l-5.5 9.4A2.4 2.4 0 0 0 6.6 22h10.8a2.4 2.4 0 0 0 2.1-3.6L14 9V3M7.7 13h8.6"/><circle cx="10" cy="17" r=".75" fill="currentColor" stroke="none"/><circle cx="14" cy="19" r=".75" fill="currentColor" stroke="none"/>',
  paper: '<path d="M7 2h8l5 5v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M15 2v5h5M9 11h7m-7 4h7M2 7v13a3 3 0 0 0 3 3"/>',
  glass: '<path d="M8 3h8m-7 0v4c0 3-4 4.5-4 8a7 7 0 0 0 14 0c0-3.5-4-5-4-8V3M7 12h10M8 16c0 1.8 1.3 3 3 3"/>',
  gyudon: '<path d="M3 10h18c-.5 5.6-3.8 9-9 9s-8.5-3.4-9-9ZM8 21h8M7 7c2-1.4-2-2.6 0-4m5 4c2-1.4-2-2.6 0-4m5 4c2-1.4-2-2.6 0-4"/>',
  cosmetics: '<rect x="5" y="9" width="11" height="13" rx="2"/><path d="M8 9V6h5v3M8 6V2h9v4h-4M8.5 13v5m11-10c0 0-2.5 3-2.5 4.5a2.5 2.5 0 0 0 5 0C22 11 19.5 8 19.5 8Z"/>',
  auto: '<path d="m5 8 1.4-4h11.2L19 8l2 3v8H3v-8l2-3Zm0 0h14M3 15h18M6 19v2m12-2v2M6 12h2m8 0h2"/>',
  textiles: '<path d="M6 3h12M6 21h12M8 3v18M16 3v18M8 6l8 4m-8 1 8 4m-8 1 8 4M16 8h2a3 3 0 0 1 3 3v6"/>',
  steel: '<path d="M5 3h14v4h-5v10h5v4H5v-4h5V7H5V3Z"/>',
  semiconductors: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9" y="9" width="6" height="6" rx=".5"/><path d="M9 2v4m6-4v4m-6 12v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>',
  nonferrous: '<path d="M7 5h10l4 8v6H3v-6l4-8ZM3 13h18m-9 0v6M7 5l5 8 5-8"/>',
  fashion: '<path d="M10 6a2.5 2.5 0 1 1 4.4 1.6L12 10v2L3.6 17A1.6 1.6 0 0 0 4.4 20h15.2a1.6 1.6 0 0 0 .8-3L12 12"/>',
  fallback: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5"/>',
});

const UI = Object.freeze({
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  rank: '<path d="M4 21V11h5v10m0 0V4h6v17m0 0V8h5v13M2 21h20"/>',
  brands: '<path d="M12 3v4m-7 4V7h14v4M12 7v4"/><rect x="2" y="11" width="6" height="9" rx="1.5"/><rect x="9" y="11" width="6" height="9" rx="1.5"/><rect x="16" y="11" width="6" height="9" rx="1.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none"/>',
  network: '<path d="m6.5 6.5 11 11m-11 0 11-11M7 5h10M5 7v10m14-10v10M7 19h10"/><circle cx="5" cy="5" r="2.5" fill="var(--surface, #fff)"/><circle cx="19" cy="5" r="2.5" fill="var(--surface, #fff)"/><circle cx="5" cy="19" r="2.5" fill="var(--surface, #fff)"/><circle cx="19" cy="19" r="2.5" fill="var(--surface, #fff)"/>',
  chevronDown: '<path d="m5 9 7 7 7-7"/>',
  layers: SECTORS.fallback,
  reset: '<path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/>',
});


function svg(geometry, className, sector = false) {
  // The public helpers accept CSS class names, never arbitrary attributes.
  const extra = String(className || '').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
  const classes = `ui-icon${sector ? ' sector-icon' : ''}${extra ? ` ${extra}` : ''}`;
  return `<svg class="${classes}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${geometry}</svg>`;
}

/** Returns a decorative sector glyph. Unknown sector IDs receive a layers mark. */
export function sectorIcon(id, className = '') {
  const geometry = Object.hasOwn(SECTORS, id) ? SECTORS[id] : SECTORS.fallback;
  return svg(geometry, className, true);
}

/** Returns a decorative interface glyph. Unknown names receive an info mark. */
export function icon(name, className = '') {
  const geometry = Object.hasOwn(UI, name) ? UI[name] : UI.info;
  return svg(geometry, className);
}
