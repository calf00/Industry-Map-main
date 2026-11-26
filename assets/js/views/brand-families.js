// ブランド名から、その運営会社と親会社をたどる。
import { esc, normalizeText } from '../util.js?v=20261126-ux';
import { icon } from '../icons.js?v=20261126-ux';

function safeUrl(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value.trim())) return '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function sourceLinks(sources = []) {
  return sources.map((source) => {
    const url = safeUrl(source?.url);
    return url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(source.title || '公式資料')}</a>` : '';
  }).filter(Boolean).join('');
}

// 正規化した検索語に対応する元の文字範囲を残し、かな・全半角の違いも強調する。
function highlight(value, query) {
  const text = String(value ?? '');
  if (!query) return esc(text);
  const chars = Array.from(text);
  const positions = [];
  let normalized = '';
  chars.forEach((char, index) => {
    const part = normalizeText(char);
    normalized += part;
    for (let i = 0; i < part.length; i++) positions.push(index);
  });
  const ranges = [];
  let start = normalized.indexOf(query);
  while (start !== -1) {
    const from = positions[start];
    const to = positions[start + query.length - 1] + 1;
    const previous = ranges[ranges.length - 1];
    if (previous && from <= previous[1]) previous[1] = Math.max(previous[1], to);
    else ranges.push([from, to]);
    start = normalized.indexOf(query, start + query.length);
  }
  if (!ranges.length) return esc(text);
  let cursor = 0;
  let html = '';
  ranges.forEach(([from, to]) => {
    html += esc(chars.slice(cursor, from).join(''));
    html += `<mark>${esc(chars.slice(from, to).join(''))}</mark>`;
    cursor = to;
  });
  return html + esc(chars.slice(cursor).join(''));
}

function matches(query, ...values) {
  return !!query && values.some((value) => normalizeText(value).includes(query));
}

export function renderBrandFamilies(root, ctx) {
  const { sector, state } = ctx;
  const data = sector.brandFamilies || {};
  const families = Array.isArray(data.families) ? data.families : [];
  const companies = sector.companyMap || new Map((sector.companies || []).map((company) => [company.id, company]));
  const company = (id) => id ? companies.get(id) : null;
  state.brandFamilies ||= {};
  const saved = state.brandFamilies[sector.id] ||= { query: '', family: '' };
  saved.query = String(saved.query || '');
  if (!families.some((family) => family.id === saved.family)) saved.family = '';

  const fieldId = `bf-${sector.id}`;
  root.innerHTML = `<section class="bf-view" aria-labelledby="${esc(fieldId)}-title">
    <header class="bf-intro">
      <h2 id="${esc(fieldId)}-title">${esc(data.title || 'このブランド、どのグループ？')}</h2>
    </header>
    <div class="bf-tools">
      <div class="bf-search-field">
        <label for="${esc(fieldId)}-query">ブランド・会社を検索</label>
        <div class="bf-search-control">${icon('search')}<input id="${esc(fieldId)}-query" class="bf-search" type="search" value="${esc(saved.query)}" placeholder="ブランド名や会社名を入力" autocomplete="off" spellcheck="false" aria-controls="${esc(fieldId)}-results"></div>
        <div class="bf-examples"><span>たとえば</span>${['KATE', 'アテニア', 'THREE'].map((name) => `<button type="button" data-bf-example="${esc(name)}">${esc(name)}</button>`).join('')}</div>
      </div>
      <div class="bf-family-field">
        <label for="${esc(fieldId)}-family">親会社で絞る</label>
        <select id="${esc(fieldId)}-family" class="bf-family-filter" aria-controls="${esc(fieldId)}-results">
          <option value="">すべてのグループ</option>
          ${families.map((family) => `<option value="${esc(family.id)}"${family.id === saved.family ? ' selected' : ''}>${esc(family.name)}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="bf-result-bar">
      <p class="bf-count" role="status" aria-live="polite" aria-atomic="true"></p>
      <button type="button" class="bf-clear" data-bf-clear hidden>${icon('reset')}条件をクリア</button>
      ${data.intro || data.note || data.updated ? `<details class="bf-reading">
        <summary>図の読み方${icon('chevronDown')}</summary>
        <div>
          ${data.intro ? `<p class="bf-description">${esc(data.intro)}</p>` : ''}
          ${data.note ? `<p>${esc(data.note)}</p>` : ''}
          ${data.updated ? `<p class="bf-updated">確認日：<time>${esc(data.updated)}</time></p>` : ''}
        </div>
      </details>` : ''}
    </div>
    <div class="bf-results" id="${esc(fieldId)}-results"></div>
  </section>`;

  const view = root.querySelector('.bf-view');
  const search = view.querySelector('.bf-search');
  const familyFilter = view.querySelector('.bf-family-filter');
  const results = view.querySelector('.bf-results');
  const count = view.querySelector('.bf-count');
  const clear = view.querySelector('.bf-clear');

  function selectFamilies(query) {
    return families.filter((family) => !saved.family || family.id === saved.family).map((family) => {
      const parent = company(family.companyId);
      const parentMatch = matches(query, family.name, parent?.name, parent?.kana);
      const branches = (family.branches || []).map((branch) => {
        const branchCompany = company(branch.companyId);
        const branchMatch = matches(query, branch.label, branchCompany?.name, branchCompany?.kana);
        const brands = (branch.brands || []).map((brand) => ({
          ...brand,
          matched: matches(query, brand.name, ...(brand.aliases || [])),
        }));
        return { ...branch, matched: branchMatch, brands, matchedBrands: brands.filter((brand) => brand.matched) };
      }).filter((branch) => !query || parentMatch || branch.matched || branch.matchedBrands.length);
      return { ...family, matched: parentMatch, branches };
    }).filter((family) => !query || family.matched || family.branches.length);
  }

  function brandHtml(brand, query) {
    const body = `<span class="bf-brand-name">${highlight(brand.name, query)}</span>${brand.note ? `<span class="bf-brand-note">${esc(brand.note)}</span>` : ''}`;
    const classes = `bf-brand${brand.matched ? ' is-match' : ''}`;
    return company(brand.companyId)
      ? `<button type="button" class="${classes}" data-bf-company="${esc(brand.companyId)}" aria-label="${esc(brand.name)}（ブランド）の詳細">${body}</button>`
      : `<span class="${classes}">${body}</span>`;
  }

  function branchHtml(branch, family, query) {
    const branchCompany = company(branch.companyId);
    const brands = query && !family.matched && !branch.matched ? branch.matchedBrands : branch.brands;
    const label = highlight(branch.label, query);
    return `<li class="bf-branch${branch.matched ? ' is-match' : ''}">
      <div class="bf-branch-head">
        ${branch.kind === 'company' || branchCompany ? '<span class="bf-kind bf-company-kind">会社</span>' : ''}
        <h4>${branchCompany ? `<button type="button" class="bf-company-link" data-bf-company="${esc(branch.companyId)}">${label}</button>` : label}</h4>
      </div>
      ${branch.relation ? `<p class="bf-relation">${esc(branch.relation)}</p>` : ''}
      ${brands.length ? `<p class="bf-brands-label">展開ブランド</p><div class="bf-brands">${brands.map((brand) => brandHtml(brand, query)).join('')}</div>` : ''}
    </li>`;
  }

  function familyHtml(family, query, index) {
    const parent = company(family.companyId);
    const evidence = [
      sourceLinks(family.sources) ? `<div class="bf-source-group"><p>${esc(family.name)}</p><div class="bf-source-links">${sourceLinks(family.sources)}</div></div>` : '',
      ...family.branches.map((branch) => {
        const links = sourceLinks(branch.sources);
        return links ? `<div class="bf-source-group"><p>${esc(branch.label)}</p><div class="bf-source-links">${links}</div></div>` : '';
      }),
    ].filter(Boolean).join('');
    return `<article class="bf-card" aria-labelledby="${esc(fieldId)}-family-${index}">
      <header class="bf-card-head${family.matched ? ' is-match' : ''}">
        <span class="bf-kind bf-parent-kind">親会社</span>
        <h3 id="${esc(fieldId)}-family-${index}">${highlight(family.name, query)}</h3>
        ${family.summary ? `<p>${esc(family.summary)}</p>` : ''}
      </header>
      <ul class="bf-tree">${family.branches.map((branch) => branchHtml(branch, family, query)).join('')}</ul>
      <div class="bf-actions">
        ${parent ? `<button type="button" data-bf-company="${esc(family.companyId)}">会社の詳細</button>` : ''}
        ${sector.network?.nodeMap.has(family.companyId) ? `<button type="button" data-bf-network="${esc(family.companyId)}">つながり図</button>` : ''}
        ${family.acquisitionCaseId ? `<button type="button" class="bf-case-link" data-bf-acquisition="${esc(family.acquisitionCaseId)}">買収の狙いとその後</button>` : ''}
      </div>
      ${evidence ? `<details class="bf-evidence"><summary>関係の根拠を読む</summary><div class="bf-evidence-body">${data.updated ? `<p class="bf-updated">確認日：${esc(data.updated)}</p>` : ''}${evidence}</div></details>` : ''}
    </article>`;
  }

  function updateResults() {
    const query = normalizeText(saved.query);
    const selected = selectFamilies(query);
    const brandCount = selected.reduce((total, family) => total + family.branches.reduce((sum, branch) => sum + (query && !family.matched && !branch.matched ? branch.matchedBrands.length : branch.brands.length), 0), 0);
    count.textContent = `${selected.length}グループ・${brandCount}ブランド`;
    clear.hidden = !saved.query && !saved.family;
    results.innerHTML = selected.length
      ? `<div class="bf-grid">${selected.map((family, index) => familyHtml(family, query, index)).join('')}</div>`
      : `<div class="bf-empty"><h3>該当するブランド・会社が見つかりません</h3><p>別の名前で検索するか、上の「条件をクリア」で全体を見てみてください。</p></div>`;
  }

  // 結果だけを更新するので、日本語入力中もフォーカスとカーソルを保つ。
  search.addEventListener('input', () => {
    saved.query = search.value;
    updateResults();
  });
  familyFilter.addEventListener('change', () => {
    saved.family = familyFilter.value;
    updateResults();
  });
  view.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !view.contains(button)) return;
    if (button.hasAttribute('data-bf-example')) {
      saved.query = button.dataset.bfExample;
      saved.family = '';
      search.value = saved.query;
      familyFilter.value = '';
      updateResults();
      search.focus();
    } else if (button.hasAttribute('data-bf-clear')) {
      saved.query = '';
      saved.family = '';
      search.value = '';
      familyFilter.value = '';
      updateResults();
      search.focus();
    } else if (button.dataset.bfCompany && company(button.dataset.bfCompany)) {
      ctx.onSelect?.(button.dataset.bfCompany);
    } else if (button.dataset.bfNetwork && company(button.dataset.bfNetwork)) {
      ctx.onNetwork?.(button.dataset.bfNetwork);
    } else if (button.dataset.bfAcquisition) {
      ctx.onAcquisition?.(button.dataset.bfAcquisition);
    }
  });
  updateResults();
}
