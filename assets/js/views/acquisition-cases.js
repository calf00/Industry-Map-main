// 買収時の狙い、確認できた変化、まだ分からないことを事例ごとに比べる。
import { esc } from '../util.js';

function safeUrl(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value.trim())) return '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function sourcesHtml(sources = []) {
  const links = sources.map((source) => {
    const url = safeUrl(source.url);
    return url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a>` : '';
  }).filter(Boolean);
  return links.length ? `<div class="acq-sources" aria-label="出典">${links.join('')}</div>` : '';
}

function caseHtml(item) {
  const timeline = item.timeline || [];
  const unknowns = item.unknowns || [];
  return `<article class="acq-case" id="acq-${esc(item.id)}">
    <header class="acq-case-head">
      <span class="acq-kind">${esc(item.kind)}</span>
      <h3>${esc(item.title)}</h3>
    </header>
    <dl class="acq-fields">${(item.fields || []).map((field) => `<div class="acq-field">
      <dt>${esc(field.label)}</dt>
      <dd><p>${esc(field.text)}</p>${sourcesHtml(field.sources)}</dd>
    </div>`).join('')}</dl>
    <details class="acq-details">
      <summary>経緯と未解明の点</summary>
      <div class="acq-details-body">
        ${timeline.length ? `<h4>経緯</h4><ol class="acq-timeline">${timeline.map((event) => `<li>
          <span class="acq-date">${esc(event.date)}</span>
          <p>${esc(event.text)}</p>${sourcesHtml(event.sources)}
        </li>`).join('')}</ol>` : ''}
        ${unknowns.length ? `<h4>まだ分からないこと</h4><ul class="acq-unknowns">${unknowns.map((text) => `<li>${esc(text)}</li>`).join('')}</ul>` : ''}
      </div>
    </details>
  </article>`;
}

export function acquisitionCasesHtml(data, sectorId) {
  if (!data?.cases?.length) return '';
  const fieldCount = Math.max(0, ...data.cases.map((item) => (item.fields || []).length));
  return `<section class="card span2 acq-section">
    <div class="acq-heading">
      <h2>${esc(data.title)}</h2>
      ${data.updated ? `<p class="acq-updated">調査・確認：${esc(data.updated)}</p>` : ''}
    </div>
    ${data.intro ? `<p class="acq-intro">${esc(data.intro)}</p>` : ''}
    <a class="acq-net-link" href="#/${esc(encodeURIComponent(String(sectorId)))}/net">企業のつながりを図で見る</a>
    <div class="acq-grid" style="--acq-field-count:${fieldCount};--acq-row-count:${fieldCount + 2}">${data.cases.map(caseHtml).join('')}</div>
  </section>`;
}
