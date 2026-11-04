// 工程ごとの根拠と、未確認のつながりを見せる。
import { esc } from '../util.js';

function sourceLinks(sources = []) {
  return sources.filter((s) => /^https?:\/\//i.test(s.url || '')).map((s) =>
    `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`
  ).join('');
}

function stepHtml(step, number) {
  const kind = step.status === '本作で確認' ? 'confirmed' : step.status === '部門の一般業務' ? 'department' : 'other';
  const links = sourceLinks(step.sources);
  return `<li class="sc-step">
    <div class="sc-step-number" aria-hidden="true">${number}</div>
    <div class="sc-step-body">
      <span class="sc-status is-${kind}">${esc(step.status)}</span>
      <h3>${esc(step.title)}</h3>
      <p>${esc(step.text)}</p>
      ${step.detail ? `<p class="sc-detail">${esc(step.detail)}</p>` : ''}
      ${links ? `<div class="sc-sources" aria-label="出典">${links}</div>` : ''}
    </div>
  </li>`;
}

export function renderSupplyChain(root, { sector }) {
  const sc = sector.supplyChain;
  root.innerHTML = `<div class="sc">
    <section class="sc-intro">
      <p class="sc-kicker">AIKATSU! ENCORE / SUPPLY CHAIN</p>
      <h2>カードと筐体は、<br>どうやって届く？</h2>
      <p>企画から製造、店舗、プレイヤーへ。公表された情報を手がかりに、モノと判断の流れを追いました。</p>
      <div class="sc-legend"><span class="sc-status is-confirmed">本作で確認</span><span class="sc-status is-department">部門の一般業務</span><span class="sc-status is-other">一般例・仮説・過去事例</span></div>
      <p class="sc-caution">矢印は工程の見取り図です。実際の取引先や経路が確認できていない部分を含みます。</p>
    </section>
    <nav class="sc-nav" aria-label="調べたい項目へ移動">
      <button type="button" data-jump="sc-card">カードの流れ ↓</button><button type="button" data-jump="sc-machine">筐体の流れ ↓</button><button type="button" data-jump="sc-decisions">生産の判断 ↓</button><button type="button" data-jump="sc-past">過去の事例 ↓</button>
    </nav>
    <div class="sc-lanes">${sc.lanes.map((lane, i) => `<section class="sc-lane" id="${['sc-plan', 'sc-card', 'sc-machine'][i]}">
      <div class="sc-lane-head"><span class="sc-lane-index">0${i + 1}</span><div><h2>${esc(lane.title)}</h2><p>${esc(lane.lead)}</p></div></div>
      <ol class="sc-steps">${lane.steps.map((s, j) => stepHtml(s, String(j + 1).padStart(2, '0'))).join('')}</ol>
    </section>`).join('')}</div>
    <section class="sc-lane" id="sc-decisions">
      <div class="sc-lane-head"><span class="sc-lane-index">04</span><div><h2>生産や追加は、どう決まる？</h2><p>公表された判断と、そこから考えられること</p></div></div>
      <ul class="sc-steps sc-no-arrows">${sc.decisions.map((s, j) => stepHtml(s, String(j + 1).padStart(2, '0'))).join('')}</ul>
    </section>
    <section class="sc-lane" id="sc-past">
      <div class="sc-lane-head"><span class="sc-lane-index">05</span><div><h2>過去の資料から見えること</h2><p>今作の取引関係とは区別して読む</p></div></div>
      <ul class="sc-steps sc-no-arrows">${sc.comparison.map((s, j) => stepHtml(s, String(j + 1).padStart(2, '0'))).join('')}</ul>
    </section>
    <p class="sc-end">調査日：${esc(sector.updated)} ／ 取引先や判断の詳細は、公開資料で新たに確認できたら更新します。</p>
  </div>`;
  // アプリはハッシュをルーティングに使うため、ページ内リンクは履歴を変えずに移動する。
  root.querySelectorAll('.sc-nav button').forEach((button) => button.addEventListener('click', () => {
    root.querySelector(`#${button.dataset.jump}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}
