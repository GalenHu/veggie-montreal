// Builds a printable tri-fold brochure from the finder's current results.
// The finder stores its results in localStorage under 'veggie-brochure'.

const { t } = I18N;
const MAX_PER_PANEL = 6;
const MIN_PER_PANEL = 3;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (id) => document.getElementById(id);
const kindLabel = (k) => t(`kind.${k}`);
// Older saved data stored an English `type`; newer data stores a `typeKey`.
const typeLabel = (p) => (p.typeKey ? t(`type.${p.typeKey}`) : p.type || '');

function readData() {
  if (new URLSearchParams(location.search).has('demo')) return demoData();
  try {
    const raw = localStorage.getItem('veggie-brochure');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Layout preview only — clearly fake names, never mixed with real data.
function demoData() {
  const kinds = ['vegan', 'veg', 'opt'];
  const places = Array.from({ length: 17 }, (_, i) => ({
    id: `demo/${i}`, name: `Sample Place ${i + 1}`, kind: kinds[i % 3],
    typeKey: i % 2 ? 'cafe' : 'restaurant', cuisine: i % 4 ? 'thai;sushi' : '',
    address: `${100 + i * 37} Sample Street`, hours: i % 3 ? 'Mo-Fr 11:00-22:00; Sa,Su 10:00-23:00' : '',
    website: i % 2 ? 'https://example.com' : '', lat: 45.515 + Math.sin(i) * 0.008, lon: -73.58 + Math.cos(i) * 0.012,
    dist: 0.2 + i * 0.1,
  }));
  return { area: 'Sample area (demo data)', center: { lat: 45.5152, lon: -73.58 }, radiusKm: 2, diet: 'all', created: new Date().toISOString(), places };
}

function prettyCuisine(c) {
  if (!c) return '';
  return c.split(';').map((s) => s.trim())
    .filter((s) => s && !/^(vegan|vegetarian)$/i.test(s))
    .map((s) => I18N.cuisine(s).replace(/_/g, ' '))
    .map((s) => s[0].toUpperCase() + s.slice(1)).join(', ');
}

function prettyHours(h) {
  if (!h) return '';
  if (h.trim() === '24/7') return t('b.open247');
  const days = t('b.days');
  const fr = I18N.lang === 'fr';
  const out = h.replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (d) => days[d])
    .replace(/(\d{2}):(\d{2})/g, (_, hh, mm) => (fr ? `${+hh} h${mm === '00' ? '' : ' ' + mm}` : mm === '00' ? String(+hh) : `${+hh}:${mm}`))
    .replace(/-/g, '–').replace(/,/g, ', ').replace(/;\s*/g, ' · ').replace(/\boff\b/g, t('b.closed'));
  return out.length > 70 ? out.slice(0, 68) + '…' : out;
}

function domain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

/** Fully veg places first, then by distance. */
function pick(places, n) {
  return [...places]
    .sort((a, b) => (a.kind === 'opt') - (b.kind === 'opt') || a.dist - b.dist)
    .slice(0, n);
}

function entryHtml(p, n) {
  const what = [typeLabel(p), prettyCuisine(p.cuisine)].filter(Boolean).join(' · ');
  const hours = prettyHours(p.hours);
  const site = p.website ? domain(p.website) : '';
  return `<article class="entry">
    <div class="num ${p.kind}">${n}</div>
    <div>
      <div class="e-kind ${p.kind}">${kindLabel(p.kind)}</div>
      <h3>${esc(p.name)}</h3>
      ${what ? `<p class="e-line">${esc(what)}</p>` : ''}
      <p class="e-line"><b>${esc(p.address || t('b.noAddress'))}</b> · ${I18N.dist(p.dist)}</p>
      ${hours ? `<p class="e-line">${esc(hours)}</p>` : ''}
      ${site ? `<p class="e-line">${esc(site)}</p>` : ''}
    </div>
  </article>`;
}

function renderInside(chosen, total, perPanel) {
  for (let i = 0; i < 3; i++) {
    const slice = chosen.slice(i * perPanel, (i + 1) * perPanel);
    const panel = $(`inside-${i + 1}`);
    panel.innerHTML = slice.length
      ? `<h2 class="panel-title">${t(`b.panel${i + 1}`)}</h2>` + slice.map((p, j) => entryHtml(p, i * perPanel + j + 1)).join('')
      : '';
  }
  const shown = Math.min(chosen.length, perPanel * 3);
  if (total > shown) {
    const last = [3, 2, 1].map((k) => $(`inside-${k}`)).find((el) => el.innerHTML) || $('inside-1');
    last.insertAdjacentHTML('beforeend', `<p class="more">${esc(t('b.more', { n: total - shown }))}</p>`);
  }
}

const overflows = () => [1, 2, 3].some((k) => { const el = $(`inside-${k}`); return el.scrollHeight > el.clientHeight + 1; });

function build(data) {
  const all = data.places || [];
  // Spread short lists evenly across the three inside panels.
  let perPanel = Math.min(MAX_PER_PANEL, Math.max(1, Math.ceil(all.length / 3)));
  let chosen = pick(all, perPanel * 3);
  renderInside(chosen, all.length, perPanel);
  // Shrink entries per panel until nothing is clipped.
  while (overflows() && perPanel > MIN_PER_PANEL) {
    perPanel--;
    chosen = pick(all, perPanel * 3);
    renderInside(chosen, all.length, perPanel);
  }

  // Cover
  const generic = data.areaIsDefault ?? /^(you|map centre)$/.test(data.area || '');
  const area = data.area && !generic ? data.area : 'Montréal';
  $('cover-title').textContent = t('b.coverTitle');
  $('cover-sub').textContent = area;
  $('cover-meta').textContent = t('b.coverMeta', {
    n: chosen.length, r: I18N.num(data.radiusKm),
    diet: t(`b.diet.${data.diet}`) || t('b.diet.all'),
    spots: t(chosen.length === 1 ? 'b.spot' : 'b.spots'),
  });
  document.title = `${t('b.title')} · ${area}`;

  // Flap picks
  $('picks').innerHTML = chosen.slice(0, 3)
    .map((p, i) => `<li><b>${esc(p.name)}</b> <small>· ${esc(t('b.pickLine', { kind: kindLabel(p.kind).toLowerCase(), n: i + 1 }))}</small></li>`).join('');

  const date = new Date(data.created || Date.now()).toLocaleDateString(I18N.lang === 'fr' ? 'fr-CA' : 'en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  $('made-date').textContent = t('b.made', { date });
  $('map-cap').textContent = t('b.mapCap', { where: area === 'Montréal' ? t('b.searchCentre') : area });

  buildMap(data, chosen);
}

function buildMap(data, chosen) {
  const map = L.map('mini-map', {
    zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false,
    doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false,
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  const pts = [];
  chosen.forEach((p, i) => {
    L.marker([p.lat, p.lon], {
      icon: L.divIcon({ className: '', html: `<div class="mk ${p.kind}">${i + 1}</div>`, iconSize: [18, 18], iconAnchor: [9, 9] }),
      interactive: false,
    }).addTo(map);
    pts.push([p.lat, p.lon]);
  });
  if (data.center) {
    L.marker([data.center.lat, data.center.lon], {
      icon: L.divIcon({ className: '', html: '<div class="mk-center"></div>', iconSize: [10, 10], iconAnchor: [5, 5] }),
      interactive: false,
    }).addTo(map);
    pts.push([data.center.lat, data.center.lon]);
  }
  if (pts.length) map.fitBounds(pts, { padding: [16, 16], maxZoom: 16 });
}

// ---------- Init ----------
I18N.apply();
document.title = t('b.title');
$('back-link').href = `index.html?lang=${I18N.lang}`;

const data = readData();
if (!data || !data.places?.length) {
  $('empty').classList.remove('hidden');
  $('sheets').classList.add('hidden');
} else {
  // Wait for web fonts so overflow measurement matches the final layout.
  (document.fonts?.ready || Promise.resolve()).then(() => build(data));
}

$('print-btn').addEventListener('click', () => window.print());
$('guides').addEventListener('change', (e) => $('sheets').classList.toggle('guides', e.target.checked));
// Switching language rebuilds the whole brochure, so a reload is simplest.
// (Edits to the cover title are lost on switch.)
$('lang-btn').addEventListener('click', () => {
  I18N.setLang(I18N.lang === 'fr' ? 'en' : 'fr');
  location.reload();
});
