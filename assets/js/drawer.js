// 左のメニュー：業界一覧と横断検索
import { esc, normalizeText, debounce } from './util.js?v=20261126-ux';
import { loadAllSectors, loadSector } from './data.js?v=20261126-ux';
import { icon, sectorIcon } from './icons.js?v=20261126-ux';

const drawer = document.getElementById('drawer');
const body = document.getElementById('drawerBody');
const input = document.getElementById('searchInput');
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('drawerClose');
const status = document.getElementById('drawerStatus');

let ctx = null; // { getState, onSector, onCompany }

export function initDrawer(c) {
  ctx = c;
  menuBtn.insertAdjacentHTML('afterbegin', icon('search'));
  input.insertAdjacentHTML('beforebegin', icon('search'));
  closeBtn.innerHTML = icon('close');
  menuBtn.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  drawer.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDrawer();
  });
  drawer.addEventListener('click', (event) => {
    if (event.target === drawer) closeDrawer();
  });
  input.addEventListener('input', debounce(renderBody, 120));
  body.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sector]');
    if (!b) return;
    closeDrawer();
    if (b.dataset.company) ctx.onCompany(b.dataset.sector, b.dataset.company);
    else ctx.onSector(b.dataset.sector);
  });
}

export function openDrawer() {
  if (drawer.open) return;
  drawer.showModal();
  menuBtn.setAttribute('aria-expanded', 'true');
  renderBody();
}

export function closeDrawer() {
  if (!drawer.open) return;
  drawer.close();
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.focus({ preventScroll: true });
}

export const isDrawerOpen = () => drawer.open;

function sectorItem(s, current) {
  return `<button type="button" class="dr-item" data-sector="${esc(s.id)}"${s.id === current ? ' aria-current="true"' : ''}>
    <span class="dr-ico">${sectorIcon(s.id)}</span>
    <span class="dr-text"><span class="dr-name">${esc(s.name)}</span>${s.description ? `<span class="dr-sub">${esc(s.description)}</span>` : ''}</span>
  </button>`;
}

async function renderBody() {
  if (!drawer.open) return;
  const { index, sectorId } = ctx.getState();
  const q = normalizeText(input.value);

  if (!q) {
    status.textContent = '';
    const cats = new Map();
    for (const s of index.sectors) {
      if (!cats.has(s.category)) cats.set(s.category, []);
      cats.get(s.category).push(s);
    }
    body.innerHTML = [...cats]
      .map(([cat, list]) => `<h3 class="dr-cat">${esc(cat)}</h3>${list.map((s) => sectorItem(s, sectorId)).join('')}`)
      .join('');
    return;
  }

  const sectorHits = index.sectors.filter((s) => normalizeText(`${s.name}${s.kana}${s.category}${s.description}`).includes(q));
  const companyHits = [];
  body.innerHTML = '<p class="dr-empty">検索中…</p>';
  status.textContent = '検索中';
  await loadAllSectors(index);
  if (!drawer.open || normalizeText(input.value) !== q) return;
  for (const meta of index.sectors) {
    let sector;
    try { sector = await loadSector(meta); } catch { continue; }
    for (const c of sector.companies) {
      const brandHit = c.brands.find((b) => normalizeText(b.name).includes(q));
      if (normalizeText(`${c.name}${c.short}${c.kana}${c.tags.join('')}`).includes(q) || brandHit) {
        companyHits.push({ meta, c, brand: brandHit && !normalizeText(c.name).includes(q) ? brandHit.name : '' });
      }
    }
  }

  if (!drawer.open || normalizeText(input.value) !== q) return;
  let html = '';
  if (sectorHits.length) html += `<h3 class="dr-cat">業界</h3>${sectorHits.map((s) => sectorItem(s, sectorId)).join('')}`;
  if (companyHits.length) {
    html += `<h3 class="dr-cat">企業・ブランド</h3>${companyHits
      .slice(0, 60)
      .map(({ meta, c, brand }) => `<button type="button" class="dr-item" data-sector="${esc(meta.id)}" data-company="${esc(c.id)}">
          <span class="dr-ico">${sectorIcon(meta.id)}</span>
          <span class="dr-text"><span class="dr-name">${esc(c.name)}</span><span class="dr-sub">${esc(meta.name)}${brand ? ` ・ ${esc(brand)}` : ''}${c.region === 'overseas' ? ' ・ 海外' : ''}</span></span>
        </button>`)
      .join('')}`;
  }
  body.innerHTML = html || `<p class="dr-empty">「${esc(input.value)}」に一致する業界・企業・ブランドはありません。</p>`;
  status.textContent = html ? `業界 ${sectorHits.length}件、企業・ブランド ${Math.min(companyHits.length, 60)}件` : '一致する結果はありません';
}
