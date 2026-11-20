(() => {
'use strict';

const { RAW, PEOPLE, TAGS, THEMES, SECTORS, ENTORNS, AVISOS } = window.DB;

/* ---------- utilitats ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, ms));
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

/* ---------- les dues empreses i com puntuen ---------- */
const TIERS = { alta: 'Prioritat alta', mitjana: 'Prioritat mitjana', baixa: 'Prioritat baixa', no: 'No encaixa' };
const TIER_SHORT = { alta: 'Alta', mitjana: 'Mitjana', baixa: 'Baixa', no: 'No' };
const TIER_OPTS = Object.entries(TIERS);

function scorer(max, cuts, fn) {
  return p => {
    const motius = []; let score = 0;
    const add = (pts, txt) => { score += pts; motius.push({ pts, txt }); };
    const why = fn(p, add);
    if (why) return { ok: false, score: 0, max, tier: 'no', motius: [{ pts: null, txt: why }] };
    const tier = score >= cuts[0] ? 'alta' : score >= cuts[1] ? 'mitjana' : 'baixa';
    return { ok: true, score, max, tier, motius };
  };
}

const COMPANIES = {
  repas: {
    nom: 'Start-up de classes de repàs',
    curt: 'Repàs',
    desc: "Classes de reforç per a alumnes d'ESO i batxillerat. Qui decideix i paga és la família, així que el client potencial és el pare o la mare, no l'alumne.",
    rules: [
      ['Requisit', 'Té fills. Sense fills no hi ha ningú a qui fer classes.'],
      ['+3', '40 anys o més: els fills probablement fan ESO o batxillerat.'],
      ['+2', "De 35 a 39 anys: fills a primària o començant l'ESO."],
      ['+1', "Menys de 35 anys: fills petits, client d'aquí a uns anys."],
      ['+2', 'Viu en un entorn urbà o residencial, on es pot obrir un local a prop.'],
      ['+1', 'Li costa conciliar feina i família: té menys temps per ajudar amb els deures.'],
      ['−1', 'Té problemes financers: mirarà molt el preu.']
    ],
    note: "Alta a partir de 5 punts, mitjana amb 3 o 4. L'edat dels fills no surt a la base: es dedueix de l'edat del pare o la mare, i per això la puntuació és una estimació.",
    eval: scorer(6, [5, 3], (p, add) => {
      if (!p.fills) return 'No consta que tingui fills, i les classes són per als fills.';
      if (p.edat >= 40) add(3, `Té ${p.edat} anys: els fills probablement fan ESO o batxillerat.`);
      else if (p.edat >= 35) add(2, `Té ${p.edat} anys: fills a primària o començant l'ESO.`);
      else add(1, `Té ${p.edat} anys: fills probablement petits.`);
      if (p.tipus === 'rural') add(0, "Viu en una zona rural: només s'hi arribaria amb classes en línia.");
      else add(2, `Viu en un entorn ${p.tipus === 'urba' ? 'urbà' : 'residencial'} (${p.entornLabel.toLowerCase()}): es pot obrir un local a prop.`);
      const conc = p.tags.find(t => TAGS[t].tema === 'conciliacio');
      if (conc) add(1, `Esmenta «${TAGS[conc].label.toLowerCase()}»: té poc temps per ajudar amb els deures.`);
      if (p.temes.includes('finances')) add(-1, 'Esmenta problemes financers: mirarà molt el preu.');
    })
  },
  farma: {
    nom: 'Farmacèutica',
    curt: 'Farmàcia',
    desc: 'Laboratori que ven a través de metges, hospitals i farmàcies. Els medicaments amb recepta no es poden anunciar al públic general, així que el client potencial és el professional sanitari que recepta o recomana.',
    rules: [
      ['Requisit', 'Treballa al sector de la salut. La resta només serien pacients.'],
      ['+4', 'És metge o metgessa: decideix quin medicament es recepta.'],
      ['+2', 'És infermer o infermera: administra tractaments i aconsella el pacient.'],
      ['+0', 'És psicòloga clínica: no recepta medicaments.'],
      ['+2', 'Treballa en un hospital: molts pacients i compres centralitzades.'],
      ['+1', 'Treballa en una clínica: menys volum de pacients.'],
      ['+1', 'Atén pacients directament cada dia.']
    ],
    note: "Alta a partir de 6 punts, mitjana de 3 a 5. A la base no hi ha cap farmàcia ni cap distribuïdora, que són l'altra meitat dels clients d'un laboratori.",
    eval: scorer(7, [6, 3], (p, add) => {
      if (p.sector !== 'salut') return 'No treballa a la salut. Només podria ser pacient, i els medicaments amb recepta no es poden promocionar al públic.';
      const s = p.salut;
      if (s.rol === 'metge') add(4, `És ${p.g === 'D' ? 'metgessa' : 'metge'}: decideix quin medicament es recepta.`);
      else if (s.rol === 'infermer') add(2, `És ${p.g === 'D' ? 'infermera' : 'infermer'}: administra tractaments i aconsella el pacient.`);
      else add(0, 'És psicòloga clínica: no recepta medicaments.');
      if (s.lloc === 'hospital') add(2, 'Treballa en un hospital: molts pacients i compres centralitzades.');
      else if (s.lloc === 'clinica') add(1, 'Treballa en una clínica: menys volum de pacients.');
      else add(0, 'La base no diu on treballa.');
      if (p.tags.includes('pac')) add(1, 'Atén pacients directament cada dia.');
      else if (p.tags.includes('terap')) add(1, 'Fa teràpia amb pacients cada dia.');
    })
  }
};

const CUTS = {
  alta: { label: 'Només prioritat alta', tiers: ['alta'] },
  mitjana: { label: 'Alta i mitjana', tiers: ['alta', 'mitjana'] },
  tots: { label: 'Tothom que compleix el requisit', tiers: ['alta', 'mitjana', 'baixa'] }
};

/* ---------- camps calculats ---------- */
const EC = { S: { H: 'Solter', D: 'Soltera' }, C: { H: 'Casat', D: 'Casada' }, D: { H: 'Divorciat', D: 'Divorciada' } };
const band = a => a < 30 ? '25-29' : a < 35 ? '30-34' : a < 40 ? '35-39' : '40-45';

PEOPLE.forEach(p => {
  p.codi = 'C-' + String(p.id).padStart(3, '0');
  p.nomComplet = p.nom + ' ' + p.cognom;
  p.inicials = p.nom[0] + p.cognom[0];
  p.franja = band(p.edat);
  p.gLabel = p.g === 'D' ? 'Dona' : 'Home';
  p.ecLabel = EC[p.ec][p.g];
  p.entornLabel = ENTORNS[p.entorn].label;
  p.tipus = ENTORNS[p.entorn].tipus;
  p.sectorLabel = SECTORS[p.sector];
  p.temes = [...new Set(p.tags.map(t => TAGS[t].tema))];
  p.av = { repas: COMPANIES.repas.eval(p), farma: COMPANIES.farma.eval(p) };
  p.hay = fold([p.codi, p.nomComplet, p.edat + ' anys', p.gLabel, p.ecLabel, p.fills ? 'amb fills' : 'sense fills',
    p.entornLabel, p.prof, p.sectorLabel, ...p.tags.map(t => TAGS[t].label), ...p.temes.map(t => THEMES[t]), RAW[p.id - 1]].join(' | '));
});

/* ---------- variables per filtrar, agrupar i pintar ---------- */
const DIMS = {
  genere: { label: 'Gènere', opts: [['D', 'Dona'], ['H', 'Home']], get: p => p.g },
  franja: { label: 'Edat', opts: [['25-29', '25 a 29 anys'], ['30-34', '30 a 34 anys'], ['35-39', '35 a 39 anys'], ['40-45', '40 a 45 anys']], get: p => p.franja, ordinal: true },
  ec: { label: 'Estat civil', opts: [['C', 'Casat/ada'], ['S', 'Solter/a'], ['D', 'Divorciat/ada']], get: p => p.ec },
  fills: { label: 'Fills', opts: [['1', 'Amb fills'], ['0', 'Sense fills']], get: p => String(p.fills) },
  tipus: { label: 'Entorn', opts: [['urba', 'Urbà'], ['residencial', 'Residencial o suburbà'], ['rural', 'Rural']], get: p => p.tipus },
  sector: { label: 'Sector', opts: Object.entries(SECTORS), get: p => p.sector },
  tema: { label: 'Preocupació', opts: Object.entries(THEMES), get: p => p.temes },
  repas: { label: 'Client de repàs', opts: TIER_OPTS, get: p => p.av.repas.tier, ordinal: true },
  farma: { label: 'Client de farmàcia', opts: TIER_OPTS, get: p => p.av.farma.tier, ordinal: true }
};
const GROUPS = [['cap', 'Tots junts'], ['edat', 'Edat'], ['genere', 'Gènere'], ['ec', 'Estat civil'], ['fills', 'Fills'], ['tipus', 'Entorn'], ['sector', 'Sector'], ['repas', 'Client de repàs'], ['farma', 'Client de farmàcia']];
const COLORS = [['fills', 'Fills'], ['genere', 'Gènere'], ['ec', 'Estat civil'], ['tipus', 'Entorn'], ['franja', 'Edat'], ['repas', 'Client de repàs'], ['farma', 'Client de farmàcia']];

/* Classe de color de cada valor. n = categories sense ordre, s = escala ordenada. */
const tierPal = { alta: 's4', mitjana: 's2', baixa: 's1', no: 's0' };
const PAL = {
  fills: { 1: 'n1', 0: 'n2' },
  genere: { D: 'n1', H: 'n2' },
  ec: { C: 'n1', S: 'n2', D: 'n3' },
  tipus: { urba: 'n1', residencial: 'n2', rural: 'n3' },
  franja: { '25-29': 's1', '30-34': 's2', '35-39': 's3', '40-45': 's4' },
  repas: tierPal,
  farma: tierPal
};
const colorOf = (p, dim) => PAL[dim][DIMS[dim].get(p)];

/* ---------- estat ---------- */
let booted = false;
const S = { q: '', terms: [], f: {}, sort: { k: 'id', dir: 1 }, group: 'cap', color: 'fills', company: 'repas', cut: 'mitjana', touched: false };
Object.keys(DIMS).forEach(k => { S.f[k] = new Set(); });

function matches(p, skip) {
  if (S.terms.length && !S.terms.every(t => p.hay.includes(t))) return false;
  for (const k in S.f) {
    if (k === skip) continue;
    const set = S.f[k];
    if (!set.size) continue;
    const v = DIMS[k].get(p);
    if (Array.isArray(v) ? !v.some(x => set.has(x)) : !set.has(v)) return false;
  }
  return true;
}
const anyFilter = () => S.terms.length > 0 || Object.values(S.f).some(s => s.size);

/* ---------- petites animacions ---------- */
function tween(node, to) {
  const from = Number(node.dataset.v) || 0;
  node.dataset.v = to;
  if (reduced || from === to) { node.textContent = to; return; }
  const t0 = performance.now();
  (function step(t) {
    const k = Math.min(1, (t - t0) / 480);
    node.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

/* Mou cada element des d'on era fins on queda després del canvi. */
function flip(nodes, mutate) {
  if (reduced) { mutate(); return; }
  const first = new Map();
  nodes.forEach(n => { if (!n.hidden) first.set(n, n.getBoundingClientRect()); });
  mutate();
  nodes.forEach(n => {
    if (n.hidden) return;
    const a = first.get(n), b = n.getBoundingClientRect();
    if (!a) { n.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' }); return; }
    /* el desplaçament es limita perquè una fila llunyana no deixi el seu lloc buit massa estona */
    const dx = a.left - b.left, dy = Math.max(-140, Math.min(140, a.top - b.top));
    if (dx || dy) n.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 560, easing: 'cubic-bezier(.2,.9,.25,1)' });
  });
}

function hl(text) {
  text = String(text);
  if (!S.terms.length) return esc(text);
  const f = fold(text);
  if (f.length !== text.length) return esc(text);
  const on = new Array(text.length).fill(false);
  for (const t of S.terms) {
    let i = 0;
    while ((i = f.indexOf(t, i)) > -1) { for (let j = i; j < i + t.length; j++) on[j] = true; i += t.length; }
  }
  let out = '', open = false;
  for (let i = 0; i < text.length; i++) {
    if (on[i] !== open) { out += open ? '</mark>' : '<mark>'; open = !open; }
    out += esc(text[i]);
  }
  return out + (open ? '</mark>' : '');
}

function buildSeg(root, options, current, onPick) {
  root.innerHTML = '';
  options.forEach(([v, label]) => {
    const b = el('button', 'chip', esc(label));
    b.type = 'button';
    b.dataset.v = v;
    b.setAttribute('aria-pressed', String(v === current));
    b.addEventListener('click', () => {
      $$('.chip', root).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      onPick(v);
    });
    root.append(b);
  });
}
const setSeg = (root, v) => $$('.chip', root).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.v === v)));

/* ---------- capçalera: del text d'una cel·la a camps ---------- */
const demo = (() => {
  const rawEl = $('#demoRaw'), refEl = $('#demoRef'), clean = $('#demoClean'), toggle = $('#demoToggle');
  const dd = k => $(`[data-f="${k}"] dd`, clean);
  let i = 0, playing = !reduced, visible = true, token = 0;

  const values = p => ({
    codi: esc(p.codi), nom: esc(p.nomComplet), edat: p.edat + ' anys', genere: p.gLabel, ec: p.ecLabel,
    fills: p.fills ? 'Sí' : 'No consta', entorn: esc(p.entornLabel), prof: esc(p.prof), sector: esc(p.sectorLabel),
    tags: p.tags.map(t => `<span class="tag">${esc(TAGS[t].label)}</span>`).join('')
  });
  /* Cada tros del text original i els camps on va a parar. */
  const MAP = [[0, ['nom']], [1, ['edat']], [2, ['genere', 'ec']], [3, ['entorn']], [4, ['prof', 'sector']], [5, ['fills']], [6, ['tags']]];

  function paint(p, filled) {
    const segs = RAW[p.id - 1].split('|').slice(1, -1).map(s => s.trim());
    rawEl.innerHTML = segs.map((s, j) => `<span class="pipe">|</span> <span class="seg-raw" data-s="${j}">${esc(s)}</span> `).join('') + '<span class="pipe">|</span>';
    refEl.textContent = 'A' + p.fila;
    const v = values(p);
    Object.keys(v).forEach(k => { const d = dd(k); d.innerHTML = v[k]; d.classList.toggle('in', filled); });
    return v;
  }

  function fly(from, to, text) {
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const g = el('span', 'ghost'); g.textContent = text;
    g.style.left = a.left + 'px'; g.style.top = a.top + 'px'; g.style.maxWidth = Math.max(120, a.width) + 'px';
    document.body.append(g);
    const anim = g.animate([
      { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${(b.left - a.left) * .5}px,${(b.top - a.top) * .5 - 26}px) rotate(-3deg)`, opacity: 1, offset: .55 },
      { transform: `translate(${b.left - a.left}px,${b.top - a.top}px) rotate(0deg)`, opacity: .2 }
    ], { duration: 620, easing: 'cubic-bezier(.45,0,.2,1)' });
    return anim.finished.catch(() => {}).then(() => g.remove());
  }

  async function play() {
    const my = ++token;
    const alive = () => my === token && playing && visible;
    while (alive()) {
      const p = PEOPLE[i];
      paint(p, false);
      rawEl.classList.remove('typed'); void rawEl.offsetWidth; rawEl.classList.add('typed');
      await wait(650); if (!alive()) return;
      dd('codi').classList.add('in');
      for (const [s, targets] of MAP) {
        const seg = $(`[data-s="${s}"]`, rawEl);
        seg.classList.add('hot');
        await Promise.all(targets.map((k, n) => wait(n * 90).then(() => fly(seg, dd(k), seg.textContent)).then(() => dd(k).classList.add('in'))));
        if (!alive()) return;
        seg.classList.add('done');
        await wait(70);
      }
      await wait(2300); if (!alive()) return;
      i = (i + 1) % PEOPLE.length;
    }
  }
  function sync() {
    /* el mateix botó atura tot el que es mou sol: la demostració, la cinta i els adhesius */
    toggle.textContent = playing ? 'Atura les animacions' : 'Reprèn les animacions';
    document.documentElement.classList.toggle('paused', !playing);
    if (playing && visible) play(); else { token++; paint(PEOPLE[i], true); $$('.seg-raw', rawEl).forEach(s => s.classList.add('hot', 'done')); }
  }
  toggle.addEventListener('click', () => { playing = !playing; sync(); });
  if (reduced) toggle.hidden = true;
  new IntersectionObserver(es => { const v = es[0].isIntersecting; if (v !== visible) { visible = v; if (playing) sync(); } }, { threshold: .15 }).observe($('#demo'));
  document.addEventListener('visibilitychange', () => { const v = !document.hidden; if (playing && v) play(); else token++; });
  return { start: sync };
})();

/* ---------- cinta amb el text original ---------- */
(() => {
  const line = RAW.map(r => `<span>${esc(r)}</span>`).join('');
  $('#ticker').innerHTML = line + line;
})();

/* ---------- camp d'adhesius: una persona, un punt ---------- */
const tip = el('div', 'tip'); tip.hidden = true; document.body.append(tip);

function createField(stage, init) {
  const st = Object.assign({ group: 'cap', color: 'fills', on: null }, init);
  const labels = el('div', 'field-labels');
  stage.append(labels);
  stage.setAttribute('role', 'group');
  stage.setAttribute('aria-label', "Adhesius de les 30 persones. Amb les fletxes del teclat et mous d'un adhesiu a l'altre i amb Retorn n'obres la fitxa.");
  let lastPos = [];
  const dots = PEOPLE.map((p, i) => {
    const b = el('button', 'gomet', `<span>${esc(p.inicials)}</span>`);
    b.type = 'button';
    /* un sol adhesiu entra a l'ordre del tabulador; la resta s'hi arriba amb les fletxes */
    b.tabIndex = i === 0 ? 0 : -1;
    b.addEventListener('click', () => openFitxa(p));
    const show = () => {
      const r = b.getBoundingClientRect();
      tip.innerHTML = `<b>${esc(p.nomComplet)}</b><span>${p.edat} anys, ${esc(p.prof.toLowerCase())}</span>`;
      tip.hidden = false;
      const w = tip.offsetWidth;
      tip.style.left = Math.min(innerWidth - w - 8, Math.max(8, r.left + r.width / 2 - w / 2)) + 'px';
      tip.style.top = (r.top + scrollY - tip.offsetHeight - 8) + 'px';
    };
    const hide = () => { tip.hidden = true; };
    b.addEventListener('pointerenter', show); b.addEventListener('pointerleave', hide);
    b.addEventListener('focus', () => { dots.forEach(x => { x.tabIndex = x === b ? 0 : -1; }); show(); });
    b.addEventListener('blur', hide);
    stage.append(b);
    return b;
  });

  /* fletxes: salta a l'adhesiu més proper en aquella direcció */
  stage.addEventListener('keydown', e => {
    const i = dots.indexOf(document.activeElement);
    if (i < 0) return;
    let to = null;
    if (e.key === 'Home') to = dots[0];
    else if (e.key === 'End') to = dots[dots.length - 1];
    else if (e.key.startsWith('Arrow') && lastPos[i]) {
      const horiz = e.key === 'ArrowLeft' || e.key === 'ArrowRight', sign = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
      let best = Infinity;
      dots.forEach((b, j) => {
        if (j === i) return;
        const dx = lastPos[j][0] - lastPos[i][0], dy = lastPos[j][1] - lastPos[i][1];
        const along = (horiz ? dx : dy) * sign, across = Math.abs(horiz ? dy : dx);
        if (along < 1) return;
        const cost = along + across * 2;
        if (cost < best) { best = cost; to = b; }
      });
    } else return;
    e.preventDefault();
    if (to) to.focus();
  });

  function layout() {
    const W = stage.clientWidth;
    if (!W) return;
    const d = W < 480 ? 30 : W < 860 ? 36 : 44, gap = W < 480 ? 4 : 6, step = d + gap;
    const pos = new Array(PEOPLE.length), L = [];
    let H = 0;
    const isOn = p => !st.on || st.on.has(p.id);

    if (st.group === 'cap') {
      const c = d * .66, R = c * Math.sqrt(PEOPLE.length) + d / 2, cx = W / 2, cy = R + 10;
      PEOPLE.forEach((p, i) => { const r = c * Math.sqrt(i + .5), a = i * 2.399963; pos[i] = [cx + r * Math.cos(a) - d / 2, cy + r * Math.sin(a) - d / 2]; });
      H = 2 * R + 20;
    } else if (st.group === 'edat') {
      const x0 = 2, x1 = W - d - 2, X = a => x0 + (a - 25) / 20 * (x1 - x0);
      const order = [...PEOPLE].sort((a, b) => a.edat - b.edat || a.id - b.id), last = [], at = {};
      order.forEach(p => { const x = X(p.edat); let r = 0; while (last[r] !== undefined && x - last[r] < d + 2) r++; last[r] = x; at[p.id] = [x, r]; });
      const base = last.length * step + 10;
      PEOPLE.forEach((p, i) => { pos[i] = [at[p.id][0], base - (at[p.id][1] + 1) * step]; });
      L.push({ cls: 'axis', x: 0, y: base, w: W });
      [25, 30, 35, 40, 45].forEach(a => L.push({ cls: 'tick', x: X(a) + d / 2, y: base + 8, html: a + (a === 25 ? ' anys' : '') }));
      H = base + 36;
    } else {
      const dim = DIMS[st.group];
      let groups = dim.opts.map(([v, label]) => ({ label, items: PEOPLE.filter(p => dim.get(p) === v) }));
      if (!dim.ordinal && groups.length > 3) groups.sort((a, b) => b.items.length - a.items.length);
      const order = {}; DIMS[st.color].opts.forEach(([v], n) => { order[v] = n; });
      groups.forEach(g => g.items.sort((a, b) => order[DIMS[st.color].get(a)] - order[DIMS[st.color].get(b)] || a.edat - b.edat));
      const colW = W / groups.length;
      const count = g => { const n = g.items.filter(isOn).length; return n === g.items.length ? String(n) : `${n} de ${g.items.length}`; };
      if (colW >= 92) {
        const maxN = Math.max(...groups.map(g => g.items.length));
        const k = Math.min(Math.max(1, Math.floor((colW - 14) / step)), Math.max(1, Math.ceil(maxN / 5)));
        const base = Math.ceil(maxN / k) * step + 10;
        groups.forEach((g, gi) => {
          const cx = colW * gi + colW / 2, w = k * step - gap;
          g.items.forEach((p, j) => { pos[p.id - 1] = [cx - w / 2 + (j % k) * step, base - (Math.floor(j / k) + 1) * step]; });
          L.push({ cls: 'col', x: colW * gi + 4, y: base + 10, w: colW - 8, html: `<b>${count(g)}</b><span>${esc(g.label)}</span>` });
        });
        L.push({ cls: 'axis', x: 0, y: base, w: W });
        H = base + 76;
      } else {
        const per = Math.max(1, Math.floor((W + gap) / step));
        let y = 0;
        groups.forEach(g => {
          L.push({ cls: 'row', x: 0, y, w: W, html: `<b>${count(g)}</b><span>${esc(g.label)}</span>` });
          y += 28;
          g.items.forEach((p, j) => { pos[p.id - 1] = [(j % per) * step, y + Math.floor(j / per) * step]; });
          y += Math.max(1, Math.ceil(g.items.length / per)) * step + 12;
        });
        H = y;
      }
    }

    stage.style.height = Math.ceil(H) + 'px';
    stage.style.setProperty('--d', d + 'px');
    lastPos = pos;
    const cdim = DIMS[st.color], cnames = Object.fromEntries(cdim.opts);
    PEOPLE.forEach((p, i) => {
      const b = dots[i];
      b.setAttribute('aria-label', `${p.nomComplet}, ${p.edat} anys, ${p.prof}. ${cdim.label}: ${cnames[cdim.get(p)]}.${isOn(p) ? '' : ' Fora de la selecció.'} Obre la fitxa`);
      b.style.setProperty('--x', pos[i][0].toFixed(1) + 'px');
      b.style.setProperty('--y', pos[i][1].toFixed(1) + 'px');
      b.style.setProperty('--delay', (i * 14) + 'ms');
      b.className = 'gomet ' + colorOf(p, st.color) + (isOn(p) ? '' : ' off');
    });
    labels.innerHTML = '';
    L.forEach(l => {
      const n = el('div', 'fl fl-' + l.cls, l.html || '');
      n.style.left = l.x + 'px'; n.style.top = l.y + 'px';
      if (l.w) n.style.width = l.w + 'px';
      labels.append(n);
    });
  }

  /* només es recol·loca quan canvia l'amplada; l'alçada la canvia el mateix camp */
  let lastW = stage.clientWidth;
  new ResizeObserver(() => { const w = stage.clientWidth; if (w !== lastW) { lastW = w; layout(); } }).observe(stage);
  layout();
  requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add('ready')));
  return { set(o) { Object.assign(st, o); layout(); } };
}

/* ---------- apartat a: adhesius, temes, filtres i taula ---------- */
const field = createField($('#field'), { group: S.group, color: S.color });

function renderLegend() {
  const dim = DIMS[S.color];
  $('#legend').innerHTML = dim.opts.map(([v, label]) => {
    const n = PEOPLE.filter(p => dim.get(p) === v).length;
    return `<span class="lg"><i class="gomet mini ${PAL[S.color][v]}"></i>${esc(label)} <b>${n}</b></span>`;
  }).join('');
}

buildSeg($('#groupBy'), GROUPS, S.group, v => { S.group = v; S.touched = true; field.set({ group: v }); });
buildSeg($('#colorBy'), COLORS, S.color, v => { S.color = v; S.touched = true; field.set({ color: v }); renderLegend(); paintRowDots(); });

/* La primera vegada que es veu, els adhesius s'ordenen sols per edat. */
if (!reduced) {
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    setTimeout(() => { if (S.touched) return; S.group = 'edat'; setSeg($('#groupBy'), 'edat'); field.set({ group: 'edat' }); }, 900);
  }, { threshold: .5 });
  io.observe($('#field'));
}

/* temes */
const themeBars = $('#themeBars');
Object.entries(THEMES).forEach(([k, label]) => {
  const b = el('button', 'bar', `<span class="bar-l">${esc(label)}</span><span class="bar-t"><i></i></span><b class="bar-n" data-v="0">0</b>`);
  b.type = 'button'; b.dataset.k = k;
  b.addEventListener('click', () => { toggleFilter('tema', k); });
  themeBars.append(b);
});
function renderThemes() {
  const base = PEOPLE.filter(p => matches(p, 'tema'));
  const counts = {}; Object.keys(THEMES).forEach(k => { counts[k] = base.filter(p => p.temes.includes(k)).length; });
  const max = Math.max(1, ...Object.values(counts));
  const bars = $$('.bar', themeBars);
  flip(bars, () => {
    bars.sort((a, b) => counts[b.dataset.k] - counts[a.dataset.k]).forEach(b => themeBars.append(b));
  });
  bars.forEach(b => {
    const n = counts[b.dataset.k];
    $('i', b).style.width = (n / max * 100) + '%';
    tween($('.bar-n', b), n);
    b.setAttribute('aria-pressed', String(S.f.tema.has(b.dataset.k)));
    b.classList.toggle('zero', n === 0);
  });
}

/* filtres */
const facetsEl = $('#facets');
Object.entries(DIMS).forEach(([k, dim]) => {
  const d = el('details', 'facet');
  d.name = 'facet';
  d.dataset.k = k;
  d.innerHTML = `<summary><span>${esc(dim.label)}</span><b class="facet-n" hidden></b></summary>
    <div class="pop">${dim.opts.map(([v, label]) => `<label class="opt"><input type="checkbox" id="f-${k}-${v}" value="${esc(v)}"><span>${esc(label)}</span><i class="opt-n"></i></label>`).join('')}</div>`;
  /* si el desplegable surt per la dreta de la pantalla, es mou cap a l'esquerra */
  d.addEventListener('toggle', () => {
    const pop = $('.pop', d);
    pop.style.left = '0px';
    if (!d.open) return;
    const over = pop.getBoundingClientRect().right - (document.documentElement.clientWidth - 12);
    if (over > 0) pop.style.left = -over + 'px';
  });
  d.addEventListener('change', e => { const c = e.target; if (c.checked) S.f[k].add(c.value); else S.f[k].delete(c.value); refresh(); });
  facetsEl.append(d);
});
document.addEventListener('click', e => { $$('.facet[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; }); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  tip.hidden = true;
  /* en tancar un filtre amb Esc, el focus torna al seu botó en lloc de perdre's */
  $$('.facet[open]').forEach(d => { const inside = d.contains(document.activeElement); d.open = false; if (inside) $('summary', d).focus(); });
});

function toggleFilter(k, v) { const s = S.f[k]; if (s.has(v)) s.delete(v); else s.add(v); refresh(); }

function renderFacets() {
  $$('.facet', facetsEl).forEach(d => {
    const k = d.dataset.k, dim = DIMS[k], base = PEOPLE.filter(p => matches(p, k));
    $$('input', d).forEach(c => {
      const n = base.filter(p => { const v = dim.get(p); return Array.isArray(v) ? v.includes(c.value) : v === c.value; }).length;
      c.checked = S.f[k].has(c.value);
      c.nextElementSibling.nextElementSibling.textContent = n;
      c.closest('.opt').classList.toggle('zero', n === 0 && !c.checked);
    });
    const b = $('.facet-n', d);
    b.hidden = !S.f[k].size; b.textContent = S.f[k].size;
    d.classList.toggle('active', S.f[k].size > 0);
  });
}

/* taula */
const COLS = [['id', 'Codi'], ['nom', 'Nom'], ['edat', 'Edat'], ['g', 'Gènere'], ['ec', 'Estat civil'], ['fills', 'Fills'], ['entorn', 'Entorn'], ['prof', 'Professió'], ['sector', 'Sector'], ['repas', 'Repàs'], ['farma', 'Farmàcia'], ['tags', 'Preocupacions']];
const rank = a => a.ok ? a.score : -1;
const SORTV = {
  id: p => p.id, nom: p => p.nomComplet, edat: p => p.edat, g: p => p.gLabel, ec: p => p.ecLabel, fills: p => -p.fills,
  entorn: p => p.entornLabel, prof: p => p.prof, sector: p => p.sectorLabel, repas: p => -rank(p.av.repas), farma: p => -rank(p.av.farma)
};
$('#thead').innerHTML = COLS.map(([k, label]) => SORTV[k]
  ? `<th scope="col" data-k="${k}"><button type="button" class="th-btn">${label}<i class="arrow" aria-hidden="true"></i></button></th>`
  : `<th scope="col">${label}</th>`).join('');
$('#thead').addEventListener('click', e => {
  const th = e.target.closest('th[data-k]'); if (!th) return;
  const k = th.dataset.k;
  S.sort = { k, dir: S.sort.k === k ? -S.sort.dir : 1 };
  refresh();
});

const tierPill = a => `<span class="tier t-${a.tier}">${TIER_SHORT[a.tier]}${a.ok ? ` <i>${a.score}/${a.max}</i>` : ''}</span>`;
const tbody = $('#tbody');
const rows = PEOPLE.map(p => {
  const tr = el('tr');
  tr.dataset.id = p.id;
  tr.innerHTML = `
    <td data-l="Codi" class="c-codi" data-t="codi"></td>
    <td data-l="Nom" class="c-nom"><button type="button" class="row-open"><i class="gomet mini"></i><span data-t="nomComplet"></span></button></td>
    <td data-l="Edat" class="num">${p.edat}</td>
    <td data-l="Gènere" data-t="gLabel"></td>
    <td data-l="Estat civil" data-t="ecLabel"></td>
    <td data-l="Fills">${p.fills ? 'Sí' : '<span class="nc">No consta</span>'}</td>
    <td data-l="Entorn" data-t="entornLabel"></td>
    <td data-l="Professió" data-t="prof"></td>
    <td data-l="Sector" data-t="sectorLabel"></td>
    <td data-l="Repàs">${tierPill(p.av.repas)}</td>
    <td data-l="Farmàcia">${tierPill(p.av.farma)}</td>
    <td data-l="Preocupacions" class="c-tags"></td>`;
  tr.addEventListener('click', e => { if (!getSelection().toString()) openFitxa(p); e.stopPropagation(); });
  tbody.append(tr);
  return tr;
});
function paintRowDots() { rows.forEach((tr, i) => { $('.gomet', tr).className = 'gomet mini ' + colorOf(PEOPLE[i], S.color); }); }
function paintRowText() {
  rows.forEach((tr, i) => {
    const p = PEOPLE[i];
    $$('[data-t]', tr).forEach(n => { n.innerHTML = hl(p[n.dataset.t]); });
    $('.c-tags', tr).innerHTML = p.tags.map(t => `<span class="tag${S.f.tema.has(TAGS[t].tema) ? ' tag-on' : ''}">${hl(TAGS[t].label)}</span>`).join('');
  });
}

function renderTable(visible) {
  const ids = new Set(visible.map(p => p.id));
  const get = SORTV[S.sort.k];
  const sorted = [...PEOPLE].sort((a, b) => {
    const x = get(a), y = get(b);
    const c = typeof x === 'number' ? x - y : x.localeCompare(y, 'ca');
    return (c || a.id - b.id) * (c ? S.sort.dir : 1);
  });
  flip(rows, () => {
    sorted.forEach(p => { const tr = rows[p.id - 1]; tr.hidden = !ids.has(p.id); tbody.append(tr); });
  });
  paintRowText();
  $$('#thead th[data-k]').forEach(th => {
    th.setAttribute('aria-sort', th.dataset.k === S.sort.k ? (S.sort.dir === 1 ? 'ascending' : 'descending') : 'none');
  });
  $('#empty').hidden = visible.length > 0;
  $('#tbl').classList.toggle('is-empty', visible.length === 0);
}

/* Avís per a lectors de pantalla: un sol missatge quan el resultat s'ha estabilitzat. */
let statusT = 0;
function say(node, text) { clearTimeout(statusT); statusT = setTimeout(() => { node.textContent = text; }, 500); }

function refresh() {
  const visible = PEOPLE.filter(p => matches(p));
  tween($('#count'), visible.length);
  if (booted) say($('#status'), visible.length ? `${visible.length} de ${PEOPLE.length} persones a la taula.` : 'Cap persona compleix aquests filtres.');
  $('#clear').hidden = !anyFilter();
  renderFacets();
  renderThemes();
  renderTable(visible);
  field.set({ on: anyFilter() ? new Set(visible.map(p => p.id)) : null });
}

$('#q').addEventListener('input', e => {
  S.q = e.target.value;
  S.terms = fold(S.q).split(/\s+/).filter(Boolean);
  refresh();
});
function clearAll() {
  S.q = ''; S.terms = []; $('#q').value = '';
  Object.values(S.f).forEach(s => s.clear());
}
$('#clear').addEventListener('click', () => { clearAll(); refresh(); });

/* exportació */
$('#csv').addEventListener('click', () => {
  const head = ['codi', 'fila_excel', 'nom', 'cognom', 'edat', 'franja_edat', 'genere', 'estat_civil', 'te_fills', 'entorn', 'tipus_entorn', 'professio', 'sector', 'feina_propia',
    'preocupacio_1', 'preocupacio_2', 'preocupacio_3', 'temes', 'repas_prioritat', 'repas_punts', 'farma_prioritat', 'farma_punts'];
  const tipus = Object.fromEntries(DIMS.tipus.opts);
  const lines = PEOPLE.filter(p => matches(p)).map(p => [p.codi, p.fila, p.nom, p.cognom, p.edat, p.franja, p.gLabel, p.ecLabel, p.fills ? 'Sí' : 'No consta', p.entornLabel, tipus[p.tipus], p.prof, p.sectorLabel, p.propi ? 'Sí' : 'No',
    ...p.tags.map(t => TAGS[t].label), p.temes.map(t => THEMES[t]).join(', '), TIERS[p.av.repas.tier], p.av.repas.ok ? p.av.repas.score : '', TIERS[p.av.farma.tier], p.av.farma.ok ? p.av.farma.score : '']);
  const csv = '﻿' + [head, ...lines].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const a = el('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'base-clients-ra2.csv';
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  const b = $('#csv'), t = b.textContent;
  b.textContent = 'CSV baixat'; setTimeout(() => { b.textContent = t; }, 1600);
});

/* ---------- fitxa d'una persona ---------- */
const dlg = $('#fitxa'), dlgIn = $('#fitxaIn');
function openFitxa(p) {
  tip.hidden = true;
  const tipus = Object.fromEntries(DIMS.tipus.opts);
  const av = k => {
    const a = p.av[k], c = COMPANIES[k];
    return `<div class="av">
      <div class="av-head"><b>${esc(c.nom)}</b>${a.ok ? `<span class="tier t-${a.tier}">${TIERS[a.tier]} <i>${a.score}/${a.max}</i></span>` : `<span class="tier t-no">No encaixa</span>`}</div>
      <ul class="motius">${a.motius.map(m => `<li${m.pts == null ? ' class="solo"' : ''}>${m.pts == null ? '' : `<b class="pts${m.pts < 0 ? ' neg' : ''}">${m.pts > 0 ? '+' : m.pts < 0 ? '−' : ''}${Math.abs(m.pts)}</b>`}<span>${esc(m.txt)}</span></li>`).join('')}</ul>
    </div>`;
  };
  dlgIn.innerHTML = `
    <button type="button" class="btn ghost fitxa-close" id="fitxaClose">Tanca</button>
    <div class="fitxa-top">
      <span class="gomet big ${colorOf(p, S.color)}"><span>${esc(p.inicials)}</span></span>
      <div>
        <p class="fitxa-codi">${p.codi}</p>
        <h2 id="fitxaNom">${esc(p.nomComplet)}</h2>
        <p class="fitxa-sub">${p.edat} anys. ${esc(p.prof)}.</p>
      </div>
    </div>
    ${AVISOS[p.id] ? `<p class="avis"><b>Cal revisar-ho.</b> ${esc(AVISOS[p.id])}</p>` : ''}
    <dl class="fitxa-dl">
      <div><dt>Gènere</dt><dd>${p.gLabel}</dd></div>
      <div><dt>Estat civil</dt><dd>${p.ecLabel}</dd></div>
      <div><dt>Fills</dt><dd>${p.fills ? 'Sí' : 'No consta'}</dd></div>
      <div><dt>Entorn</dt><dd>${esc(p.entornLabel)} <small>(${tipus[p.tipus].toLowerCase()})</small></dd></div>
      <div><dt>Sector</dt><dd>${esc(p.sectorLabel)}</dd></div>
      <div><dt>Feina</dt><dd>${p.propi ? 'Negoci propi' : "Per compte d'altri"}</dd></div>
    </dl>
    <h3>Preocupacions</h3>
    <ul class="fitxa-tags">${p.tags.map(t => `<li><b>${esc(TAGS[t].label)}</b><span>${esc(THEMES[TAGS[t].tema])}</span></li>`).join('')}</ul>
    <h3>Com a client potencial</h3>
    ${av('repas')}${av('farma')}
    <h3>Registre original</h3>
    <p class="hint">Fila ${p.fila} de l'Excel, columna A.</p>
    <code class="raw-block" lang="es">${esc(RAW[p.id - 1])}</code>`;
  dlg.showModal();
  dlg.scrollTop = 0;
  $('#fitxaClose').addEventListener('click', () => dlg.close());
}
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

/* ---------- apartat b: clients potencials ---------- */
const field2 = createField($('#field2'), { group: S.company, color: S.company });
const companiesEl = $('#companies');
Object.entries(COMPANIES).forEach(([k, c]) => {
  const b = el('button', 'company', `<span class="company-name">${esc(c.nom)}</span><span class="company-n"><b data-v="0">0</b> clients potencials</span>`);
  b.type = 'button'; b.dataset.k = k;
  b.addEventListener('click', () => { S.company = k; renderB(); });
  companiesEl.append(b);
});
buildSeg($('#cut'), Object.entries(CUTS).map(([k, c]) => [k, c.label]), S.cut, v => { S.cut = v; renderB(); });

const chosen = k => PEOPLE.filter(p => CUTS[S.cut].tiers.includes(p.av[k].tier));

function renderB() {
  const k = S.company, c = COMPANIES[k], list = chosen(k);
  $$('.company', companiesEl).forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.k === k));
    tween($('b', b), chosen(b.dataset.k).length);
  });
  $('#bDesc').textContent = c.desc;
  tween($('#bNum'), list.length);
  $('#bNumTxt').textContent = ` de ${PEOPLE.length} persones serien clients potencials`;
  if (booted) $('#bStatus').textContent = `${c.nom}: ${list.length} de ${PEOPLE.length} persones serien clients potencials.`;
  $('#rules').innerHTML = c.rules.map(([pts, txt]) => `<li><b class="pts${pts === 'Requisit' ? ' req' : pts[0] === '−' ? ' neg' : ''}">${pts}</b><span>${esc(txt)}</span></li>`).join('');
  $('#rulesNote').textContent = c.note;
  field2.set({ group: k, color: k, on: new Set(list.map(p => p.id)) });

  const sorted = [...list].sort((a, b) => b.av[k].score - a.av[k].score || b.edat - a.edat);
  $('#bListTitle').textContent = list.length ? `Qui són (${list.length})` : 'Qui són';
  const ol = $('#bList');
  ol.innerHTML = sorted.map((p, n) => {
    const a = p.av[k];
    return `<li class="who" style="--n:${n}">
      <button type="button" class="who-open" data-id="${p.id}"><i class="gomet mini ${tierPal[a.tier]}"></i><span class="who-name">${esc(p.nomComplet)}</span></button>
      <span class="who-meta">${p.edat} anys, ${esc(p.prof.toLowerCase())}</span>
      <span class="who-score"><span class="meter"><i style="width:${a.score / a.max * 100}%"></i></span><b>${a.score}/${a.max}</b><span class="tier t-${a.tier}">${TIER_SHORT[a.tier]}</span></span>
      <ul class="motius">${a.motius.map(m => `<li><b class="pts${m.pts < 0 ? ' neg' : ''}">${m.pts > 0 ? '+' : m.pts < 0 ? '−' : ''}${Math.abs(m.pts)}</b><span>${esc(m.txt)}</span></li>`).join('')}</ul>
    </li>`;
  }).join('') || '<li class="who who-empty">Ningú arriba a aquesta prioritat.</li>';
}
$('#bList').addEventListener('click', e => { const b = e.target.closest('.who-open'); if (b) openFitxa(PEOPLE[b.dataset.id - 1]); });
$('#bToTable').addEventListener('click', () => {
  clearAll();
  CUTS[S.cut].tiers.forEach(t => S.f[S.company].add(t));
  S.sort = { k: S.company, dir: 1 };
  refresh();
  $('#finder').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
});

/* ---------- apartat c: què hi falta ---------- */
(() => {
  // Traducció al català de la capçalera i de la primera fila de l'Excel (l'original és a la fitxa de cada persona).
  const heads = ['Nom i cognoms', 'Edat', 'Dades demogràfiques', 'Entorn personal', 'Entorn professional', 'Rol personal i professional', 'Reptes i necessitats personals i professionals', 'Inquietuds i obstacles personals i professionals'];
  const cells = ['Alberto Pérez', '27', 'Home, solter', 'Centre urbà', 'Programador de programari', 'Solter, programador', 'Innovació tecnològica, pressió pels projectes, estabilitat emocional'];
  $('#cdHead').innerHTML = heads.map((h, i) => `<span class="cd-chip${i >= 6 ? ' cd-warn' : ''}">${esc(h)}</span>`).join('');
  $('#cdRow').innerHTML = cells.map((c, i) => `<span class="cd-chip${i === 6 ? ' cd-warn' : ''}">${esc(c)}</span>`).join('') + '<span class="cd-chip cd-miss">no hi és</span>';

  const ISSUES = [
    ['Tot en una sola columna', "Cada persona era un text dins la columna A, amb les dades separades per barres. L'Excel no hi podia filtrar ni ordenar res.", 'Ara cada dada té el seu camp.'],
    ['La capçalera anuncia 8 camps i les files en porten 7', '«Reptes i necessitats» i «Inquietuds i obstacles» arriben barrejats en una sola llista de tres elements, sense dir quin és quin.', "S'han unit en un camp, «Preocupacions», i cada element porta un tema."],
    ['Tres taules enganxades', 'La capçalera es repeteix a les files 2, 16 i 30, amb files buides entremig.', 'Una sola taula de 30 registres, cadascun amb un codi propi.'],
    ['Camps que barregen dues dades', '«Home, solter» ajunta gènere i estat civil. «Pare, comptable» ajunta si té fills i la professió.', 'Separats en gènere, estat civil, fills i professió.'],
    ['Dades repetides', "L'estat civil i la professió surten dues vegades a cada fila, en columnes diferents.", 'Es guarden una sola vegada.'],
    ['Categories sense criteri', '«Ciutat», «Centre urbà» i «Zona urbana» volen dir gairebé el mateix. «Suburbi» i «Zona residencial» se solapen.', "Camp nou «Tipus d'entorn» amb tres valors: urbà, residencial i rural."],
    ['Una contradicció', 'Juan Pérez (fila 10) consta com a «solter» i, dues columnes després, com a «pare».', "S'ha conservat com a solter amb fills i la fitxa porta un avís."],
    ['Un possible duplicat', 'Laura Martínez (fila 20) i Carolina Martínez (fila 38) coincideixen en edat, entorn, professió i preocupacions.', "No s'ha esborrat cap de les dues. Les dues fitxes porten un avís."]
  ];
  $('#issues').innerHTML = ISSUES.map(([t, a, b]) => `<li class="issue"><h4>${esc(t)}</h4><p class="issue-bad">${esc(a)}</p><p class="issue-fix">${esc(b)}</p></li>`).join('');

  const MISSING = [
    ['Per a qualsevol empresa', [
      ['Correu o telèfon', "Sense cap contacte no es pot fer cap acció comercial."],
      ['Consentiment i origen de les dades', 'La base és comprada. Cal saber si cada persona ha acceptat rebre publicitat, com demana el RGPD.'],
      ['Municipi o codi postal', '«Ciutat» no diu quina. No es pot saber qui viu a prop.'],
      ["Nivell d'ingressos", 'Per saber qui pot pagar i quin preu acceptaria.'],
      ["Data de l'última actualització", "L'edat, la feina i l'estat civil canvien amb el temps."]
    ]],
    ['Per a les classes de repàs', [
      ['Quants fills té, quina edat tenen i quin curs fan', "És la dada clau. Només se sap que té fills, no si estan en edat d'ESO o batxillerat."],
      ['Assignatures que els costen i notes', 'Per decidir quines classes oferir primer.'],
      ['Si ja van a una acadèmia o tenen professor particular', 'Per saber contra qui es competeix.'],
      ["Quant gasten al mes en educació", 'Per fixar el preu dels grups i de les classes particulars.'],
      ['Horaris lliures i si prefereixen classes presencials o en línia', "Sobretot per a les famílies que diuen que els costa conciliar."]
    ]],
    ['Per a la farmacèutica', [
      ['Especialitat mèdica', "Per a un medicament de dermatologia no serveix igual un dermatòleg que un traumatòleg."],
      ['Centre on treballa i si és públic o privat', 'A la sanitat pública les compres es decideixen de manera diferent.'],
      ['Nombre de pacients i de receptes', 'Per decidir a qui visiten primer els delegats.'],
      ['Número de col·legiat', 'Per comprovar que realment és un professional sanitari.'],
      ['Quins medicaments recepta ara i de quins laboratoris', 'Per saber quina competència hi ha a cada consulta.'],
      ['Farmàcies i distribuïdores', "A la base no n'hi ha cap, i són un canal de venda sencer."]
    ]]
  ];
  $('#missing').innerHTML = MISSING.map(([t, items]) => `<div class="miss"><h4>${esc(t)}</h4><ul>${items.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ul></div>`).join('');

  const SCHEMA = [
    ['codi', 'Text', 'Nou', 'Identificador únic, de C-001 a C-030.'],
    ['fila_excel', 'Nombre', 'Original', "Fila on era el registre al full de càlcul."],
    ['nom, cognom', 'Text', 'Separat', 'Abans anaven junts a «Nom i cognoms».'],
    ['edat', 'Nombre', 'Original', 'De 25 a 45 anys.'],
    ['franja_edat', 'Categoria', 'Nou', 'Quatre franges per poder comparar grups.'],
    ['genere', 'Categoria', 'Separat', 'Sortia dins de «Dades demogràfiques».'],
    ['estat_civil', 'Categoria', 'Separat', 'Sortia dins de «Dades demogràfiques» i repetit al rol.'],
    ['te_fills', 'Sí o no consta', 'Deduït', 'Del rol «pare» o «mare».'],
    ['entorn', 'Categoria', 'Original', 'Els sis noms que feia servir la base.'],
    ['tipus_entorn', 'Categoria', 'Nou', 'Urbà, residencial o rural.'],
    ['professio', 'Text', 'Original', 'De la columna «Entorn professional».'],
    ['sector', 'Categoria', 'Nou', 'Deu sectors per agrupar les professions.'],
    ['feina_propia', 'Sí o no', 'Deduït', 'Si la professió diu que té negoci propi.'],
    ['preocupacions', 'Llista de 3', 'Original', 'Reptes, necessitats i inquietuds, que venien barrejats.'],
    ['temes', 'Llista', 'Nou', 'Nou temes per comptar què preocupa més.'],
    ['repas, farma', 'Prioritat i punts', 'Calculat', "Puntuació com a client de cada empresa, amb els criteris de l'apartat b."]
  ];
  $('#schema').innerHTML = `<thead><tr><th scope="col">Camp</th><th scope="col">Tipus</th><th scope="col">D'on surt</th><th scope="col">Què guarda</th></tr></thead><tbody>${SCHEMA.map(([a, b, c, d]) => `<tr><td data-l="Camp" class="c-codi">${a}</td><td data-l="Tipus">${b}</td><td data-l="D'on surt"><span class="orig o-${fold(c)}">${c}</span></td><td data-l="Què guarda">${d}</td></tr>`).join('')}</tbody>`;
})();

/* ---------- navegació ---------- */
(() => {
  const links = $$('[data-nav]');
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.dataset.nav === e.target.id)); });
  }, { rootMargin: '-35% 0px -60% 0px' });
  ['base', 'potencials', 'falta'].forEach(id => io.observe(document.getElementById(id)));
  new IntersectionObserver(es => { if (es[0].isIntersecting) links.forEach(a => a.classList.remove('on')); }, { threshold: .4 }).observe($('#inici'));

  /* els cercles de bolígraf vermell es dibuixen quan arriben a la pantalla */
  const seen = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('seen'); seen.unobserve(e.target); } }); }, { threshold: .5 });
  seen.observe($('#countDemo'));
})();

/* ---------- arrencada ---------- */
renderLegend();
paintRowDots();
refresh();
renderB();
booted = true;
demo.start();
document.documentElement.classList.add('js');
})();
