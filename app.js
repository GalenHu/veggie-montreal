// Veggie Montréal — finds vegetarian/vegan places using OpenStreetMap data.
// Geocoding: Nominatim. Places: Overpass API. No API keys required.

const MONTREAL = { lat: 45.5152, lon: -73.5800, label: null, labelKey: 'center.downtown' };
const { t } = I18N;
// Where the search circle is centred, in words (user query or a translated label).
const whereLabel = () => state.center.label || t(state.center.labelKey);
// Rough bounding box for greater Montréal, used to bias address search.
const MTL_VIEWBOX = '-74.05,45.75,-73.35,45.35';
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const TZ = 'America/Toronto';

const state = {
  center: { ...MONTREAL },
  radiusKm: 2,
  diet: 'all',
  openNow: false,
  places: [],
  markers: new Map(),
  activeId: null,
  requestSeq: 0,
};

// ---------- Map ----------
const map = L.map('map', { zoomControl: true }).setView([MONTREAL.lat, MONTREAL.lon], 14);
const tileAttribution = () => `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ${t('map.contributors')}`;
let currentAttribution = tileAttribution();
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: currentAttribution }).addTo(map);
const markerLayer = L.markerClusterGroup({
  maxClusterRadius: 45,
  showCoverageOnHover: false,
  spiderfyOnMaxZoom: true,
  iconCreateFunction(cluster) {
    const kids = cluster.getAllChildMarkers();
    const fullyVeg = kids.filter((m) => m.options.kind !== 'opt').length;
    const n = kids.length;
    const size = n < 10 ? 34 : n < 50 ? 42 : 50;
    return L.divIcon({
      className: '',
      html: `<div class="cluster" style="width:${size}px;height:${size}px;--veg-share:${fullyVeg / n}"><span>${n}</span></div>`,
      iconSize: [size, size],
    });
  },
}).addTo(map);
let radiusCircle = null;
let centerMarker = null;

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const els = {
  form: $('search-form'), input: $('search-input'), locate: $('locate-btn'),
  radius: $('radius'), radiusLabel: $('radius-label'), openNow: $('open-now'),
  status: $('status'), results: $('results'), areaBtn: $('area-btn'),
  brochure: $('brochure-btn'), surprise: $('surprise-btn'),
};

function setStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.classList.toggle('error', isError);
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Data ----------
function buildQuery({ lat, lon }, radiusM) {
  const a = `(around:${radiusM},${lat},${lon})`;
  const food = '["amenity"~"^(restaurant|cafe|fast_food|ice_cream|food_court|bar|pub|biergarten)$"]';
  return `[out:json][timeout:25];
(
  nwr${food}["diet:vegan"~"^(yes|only|limited)$"]${a};
  nwr${food}["diet:vegetarian"~"^(yes|only|limited)$"]${a};
  nwr${food}["cuisine"~"vegan|vegetarian"]${a};
  nwr["shop"~"^(bakery|deli|pastry|confectionery)$"]["diet:vegan"~"^(yes|only|limited)$"]${a};
);
out center tags;`;
}

async function overpass(query) {
  let lastErr;
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000), // don't hang on a stalled mirror
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

function classify(tags, fallbackKind) {
  const vegan = tags['diet:vegan'];
  const veg = tags['diet:vegetarian'];
  const cuisine = (tags.cuisine || '').toLowerCase();
  if (vegan === 'only' || /(^|;)\s*vegan\s*($|;)/.test(cuisine)) return 'vegan';
  if (veg === 'only' || /(^|;)\s*vegetarian\s*($|;)/.test(cuisine)) return 'veg';
  if (!vegan && !veg && fallbackKind) return fallbackKind; // saved-list entries only
  return 'opt';
}

function distanceKm(a, b) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Raw OSM cuisine list → readable, translated text ("Thai, Sushi" / "Thaïlandaise, Sushi"). */
function prettyCuisine(c) {
  if (!c) return '';
  return c.split(';').map((s) => s.trim())
    .filter((s) => s && !/^(vegan|vegetarian)$/i.test(s))
    .map((s) => I18N.cuisine(s).replace(/_/g, ' '))
    .map((s) => s[0].toUpperCase() + s.slice(1)).join(', ');
}

const TYPES = ['restaurant', 'cafe', 'fast_food', 'ice_cream', 'food_court', 'bar', 'pub', 'biergarten', 'bakery', 'deli', 'pastry', 'confectionery'];
const typeLabel = (p) => t(`type.${p.typeKey}`);
const kindLabel = (k) => t(`kind.${k}`);

function toPlace(el) {
  const t = el.tags || {};
  const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
  if (lat == null || !t.name) return null;
  const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
  return {
    id: `${el.type}/${el.id}`,
    name: t.name,
    lat, lon,
    kind: classify(t, el.fallbackKind),
    typeKey: TYPES.includes(t.amenity) ? t.amenity : TYPES.includes(t.shop) ? t.shop : 'place',
    cuisine: t.cuisine || '', // raw OSM value; translated when shown
    address: street,
    hours: t.opening_hours || '',
    website: t.website || t['contact:website'] || '',
    phone: t.phone || t['contact:phone'] || '',
    dist: distanceKm(state.center, { lat, lon }),
  };
}

// ---------- Opening hours (handles the common OSM forms) ----------
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
function nowInMontreal() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday);
  return { day, mins: +parts.hour * 60 + +parts.minute };
}
function expandDays(spec) {
  const out = new Set();
  for (const part of spec.split(',')) {
    const [a, b] = part.trim().split('-');
    const i = DAYS.indexOf(a), j = b ? DAYS.indexOf(b) : i;
    if (i < 0 || j < 0) return null;
    for (let k = i; ; k = (k + 1) % 7) { out.add(k); if (k === j) break; }
  }
  return out;
}
const toMins = (hm) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };

/** Returns true / false, or null when the hours can't be interpreted. */
function isOpenNow(hours) {
  if (!hours) return null;
  const h = hours.trim();
  if (h === '24/7') return true;
  const { day, mins } = nowInMontreal();
  const prevDay = (day + 6) % 7;
  let result = false;
  for (const rule of h.split(';').map((r) => r.trim()).filter(Boolean)) {
    const m = rule.match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:[-,](?:Mo|Tu|We|Th|Fr|Sa|Su))*)\s+(.+)$/);
    if (!m) return null; // PH, months, week numbers etc. — don't guess
    const days = expandDays(m[1]);
    if (!days) return null;
    const times = m[2].trim();
    if (times === 'off' || times === 'closed') {
      if (days.has(day)) result = false;
      continue;
    }
    for (const range of times.split(',')) {
      const r = range.trim().match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\+?$/);
      if (!r) return null;
      const start = toMins(r[1]); let end = toMins(r[2]);
      if (end <= start) end += 24 * 60; // past midnight
      if (days.has(day) && mins >= start && mins < end) result = true;
      if (days.has(prevDay) && end > 24 * 60 && mins < end - 24 * 60) result = true;
    }
  }
  return result;
}

// ---------- Rendering ----------

function filtered() {
  return state.places.filter((p) => {
    if (p.dist > state.radiusKm) return false;
    if (state.diet === 'vegan' && p.kind !== 'vegan') return false;
    if (state.diet === 'vegetarian' && p.kind === 'opt') return false;
    if (state.openNow && isOpenNow(p.hours) !== true) return false;
    return true;
  }).sort((a, b) => a.dist - b.dist);
}

function directionsUrl(p) {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`;
}

function popupHtml(p) {
  return `<strong>${esc(p.name)}</strong><br>${esc(kindLabel(p.kind))} · ${esc(typeLabel(p))}` +
    (p.address ? `<br>${esc(p.address)}` : '') +
    `<br><a href="${directionsUrl(p)}" target="_blank" rel="noopener">${t('directions')}</a>`;
}

function render() {
  const list = filtered();
  markerLayer.clearLayers();
  state.markers.clear();
  els.results.innerHTML = '';
  const newMarkers = [];

  for (const p of list) {
    const icon = L.divIcon({ className: '', html: `<div class="pin ${p.kind}"></div>`, iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -24] });
    const mk = L.marker([p.lat, p.lon], { icon, title: p.name, kind: p.kind }).bindPopup(popupHtml(p));
    mk.on('click', () => highlight(p.id, false));
    newMarkers.push(mk);
    state.markers.set(p.id, mk);

    const open = isOpenNow(p.hours);
    const li = document.createElement('li');
    li.className = 'card';
    li.dataset.id = p.id;
    const metaBits = [typeLabel(p), prettyCuisine(p.cuisine)].filter(Boolean).join(' · ');
    li.innerHTML = `
      <div class="card-top"><h3>${esc(p.name)}</h3><span class="dist">${I18N.dist(p.dist)}</span></div>
      <div class="meta">${esc(metaBits)}</div>
      ${p.address ? `<div class="meta">${esc(p.address)}</div>` : ''}
      <div class="tags">
        <span class="tag ${p.kind}">${kindLabel(p.kind)}</span>
        ${open === true ? `<span class="tag open">${t('openTag')}</span>` : open === false ? `<span class="tag closed">${t('closedTag')}</span>` : ''}
      </div>
      <div class="links">
        <a href="${directionsUrl(p)}" target="_blank" rel="noopener">${t('directions')}</a>
        ${p.website ? `<a href="${esc(p.website)}" target="_blank" rel="noopener">${t('website')}</a>` : ''}
        ${p.phone ? `<a href="tel:${esc(p.phone.replace(/\s/g, ''))}">${t('call')}</a>` : ''}
        <a href="https://www.openstreetmap.org/${p.id}" target="_blank" rel="noopener">OSM</a>
      </div>`;
    li.addEventListener('click', (e) => { if (e.target.tagName !== 'A') highlight(p.id, true); });
    els.results.appendChild(li);
  }

  markerLayer.addLayers(newMarkers); // bulk add is much faster for clusters
  els.brochure.disabled = !list.length;
  els.surprise.disabled = !list.length;
  const total = state.places.filter((p) => p.dist <= state.radiusKm).length;
  if (!list.length) {
    setStatus(total ? t('status.noMatch') : t('status.none'));
  } else {
    setStatus(t('status.count', {
      n: list.length, places: t(list.length === 1 ? 'status.place' : 'status.places'),
      r: I18N.num(state.radiusKm), where: whereLabel(),
    }));
  }
  if (state.usingBackup) {
    els.status.textContent += t('status.backup', { n: state.places.length, date: state.backupDate });
    if (!list.length) els.status.textContent += t('status.biggerRadius');
  }
}

function highlight(id, fly) {
  state.activeId = id;
  document.querySelectorAll('.card').forEach((c) => c.classList.toggle('active', c.dataset.id === id));
  const card = document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
  card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  const mk = state.markers.get(id);
  // Zoom until the pin is out of its cluster, then open its popup.
  if (mk && fly) markerLayer.zoomToShowLayer(mk, () => mk.openPopup());
}

function drawCenter() {
  radiusCircle?.remove();
  centerMarker?.remove();
  radiusCircle = L.circle([state.center.lat, state.center.lon], {
    radius: state.radiusKm * 1000, color: '#2f7d4a', weight: 1, fillOpacity: 0.04, interactive: false,
  }).addTo(map);
  centerMarker = L.marker([state.center.lat, state.center.lon], {
    icon: L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }),
    interactive: false, keyboard: false,
  }).addTo(map);
}

// ---------- Loading ----------
let fetchedFor = null; // { lat, lon, radiusKm } of the last successful fetch

async function load({ fit = true } = {}) {
  const seq = ++state.requestSeq;
  drawCenter();
  if (fit) {
    map.invalidateSize();
    map.fitBounds(L.latLng(state.center.lat, state.center.lon).toBounds(state.radiusKm * 2000), { padding: [20, 20] });
  }
  els.areaBtn.classList.add('hidden');

  // Reuse the last fetch if it already covers this circle.
  if (fetchedFor && distanceKm(fetchedFor, state.center) + state.radiusKm <= fetchedFor.radiusKm) {
    state.places.forEach((p) => { p.dist = distanceKm(state.center, p); });
    render();
    return;
  }

  // 1) MapComplete's tile cache: fast, and cached in memory after the first load.
  setStatus(t('status.loading'));
  try {
    const elements = await window.MapCompleteTiles.fetchVegElements(state.center, state.radiusKm);
    if (seq !== state.requestSeq) return;
    const seen = new Set();
    state.places = elements.map(toPlace).filter((p) => p && !seen.has(p.id) && seen.add(p.id));
    fetchedFor = null; // tiles are cached, so recomputing from them is instant
    state.usingBackup = false;
    render();
    return;
  } catch (e) {
    if (seq !== state.requestSeq) return;
    console.warn('MapComplete tiles failed, trying Overpass:', e);
  }

  // 2) Overpass. 3) Saved list.
  // Live search failed recently: go straight to the saved list instead of waiting again.
  if (Date.now() < liveDownUntil) {
    await showBackup(seq);
    return;
  }

  setStatus(t('status.searching'));
  els.results.innerHTML = '';
  try {
    const data = await overpass(buildQuery(state.center, Math.round(state.radiusKm * 1000)));
    if (seq !== state.requestSeq) return;
    const seen = new Set();
    state.places = data.elements.map(toPlace).filter((p) => p && !seen.has(p.id) && seen.add(p.id));
    fetchedFor = { ...state.center, radiusKm: state.radiusKm };
    state.usingBackup = false;
    render();
  } catch (e) {
    if (seq !== state.requestSeq) return;
    console.warn('Live search failed, using saved list:', e);
    liveDownUntil = Date.now() + LIVE_RETRY_MS;
    await showBackup(seq);
  }
}

// ---------- Saved (offline) list ----------
const LIVE_RETRY_MS = 5 * 60 * 1000;
let liveDownUntil = 0;
let backupCache = null;

async function showBackup(seq) {
  try {
    backupCache ??= await (await fetch('data/montreal-backup.json')).json();
  } catch (e) {
    console.error(e);
    setStatus(t('status.offline'), true);
    return;
  }
  if (seq !== state.requestSeq) return;
  fetchedFor = null; // always recompute distances from the saved list
  state.usingBackup = true;
  state.backupDate = backupCache.fetched;
  state.places = backupCache.elements.map(toPlace).filter(Boolean);
  render();
}

async function geocode(q) {
  const params = new URLSearchParams({
    q, format: 'jsonv2', limit: '1', countrycodes: 'ca', viewbox: MTL_VIEWBOX, bounded: '0', 'accept-language': 'fr,en',
  });
  // Nudge plain neighbourhood names toward Montréal.
  if (!/montr[eé]al|qc|qu[eé]bec|laval|longueuil/i.test(q)) params.set('q', `${q}, Montréal`);
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  let hits = await res.json();
  if (!hits.length && params.get('q') !== q) {
    params.set('q', q);
    hits = await (await fetch(`https://nominatim.openstreetmap.org/search?${params}`)).json();
  }
  return hits[0] || null;
}

// ---------- Events ----------
els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = els.input.value.trim();
  if (!q) return;
  setStatus(t('status.lookingUp', { q }));
  try {
    const hit = await geocode(q);
    if (!hit) { setStatus(t('status.notFound', { q }), true); return; }
    state.center = { lat: +hit.lat, lon: +hit.lon, label: q };
    load();
  } catch (err) {
    console.error(err);
    setStatus(t('status.geocodeDown'), true);
  }
});

els.locate.addEventListener('click', () => {
  if (!navigator.geolocation) { setStatus(t('status.noGeo'), true); return; }
  setStatus(t('status.locating'));
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.center = { lat: pos.coords.latitude, lon: pos.coords.longitude, label: null, labelKey: 'center.you' };
      load();
    },
    () => setStatus(t('status.geoDenied'), true),
    { enableHighAccuracy: true, timeout: 10000 },
  );
});

document.querySelectorAll('.seg-btn').forEach((b) => b.addEventListener('click', () => {
  state.diet = b.dataset.diet;
  document.querySelectorAll('.seg-btn').forEach((x) => {
    x.classList.toggle('active', x === b);
    x.setAttribute('aria-checked', String(x === b));
  });
  render();
}));

let radiusTimer;
els.radius.addEventListener('input', () => {
  state.radiusKm = +els.radius.value;
  els.radiusLabel.textContent = `${I18N.num(state.radiusKm)} km`;
  drawCenter();
  clearTimeout(radiusTimer);
  radiusTimer = setTimeout(() => load(), 450);
});

els.openNow.addEventListener('change', () => { state.openNow = els.openNow.checked; render(); });

map.on('moveend', () => {
  const c = map.getCenter();
  const moved = distanceKm(state.center, { lat: c.lat, lon: c.lng });
  els.areaBtn.classList.toggle('hidden', moved < state.radiusKm * 0.5);
});
els.areaBtn.addEventListener('click', () => {
  const c = map.getCenter();
  state.center = { lat: c.lat, lon: c.lng, label: null, labelKey: 'center.map' };
  load({ fit: false });
});

// Pick a random place from the current (filtered) results, never the same one twice in a row.
let lastPickId = null;
let shuffling = false;
els.surprise.addEventListener('click', () => {
  const list = filtered();
  if (!list.length || shuffling) return;
  const pool = list.length > 1 ? list.filter((p) => p.id !== lastPickId) : list;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  lastPickId = pick.id;

  const finish = () => {
    shuffling = false;
    els.surprise.disabled = false;
    setStatus(t('status.surprise', { name: pick.name, kind: kindLabel(pick.kind).toLowerCase(), dist: I18N.dist(pick.dist) }));
    highlight(pick.id, true);
    const card = document.querySelector(`.card[data-id="${CSS.escape(pick.id)}"]`);
    document.querySelectorAll('.card.picked').forEach((c) => c.classList.remove('picked'));
    void card?.offsetWidth; // restart the animation
    card?.classList.add('picked');
  };

  // A short name shuffle for fun; skipped for people who prefer reduced motion.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || list.length < 3) return finish();
  shuffling = true;
  els.surprise.disabled = true;
  let ticks = 0;
  const timer = setInterval(() => {
    setStatus(`🎲 ${list[Math.floor(Math.random() * list.length)].name}…`);
    if (++ticks >= 10) { clearInterval(timer); finish(); }
  }, 70);
});

// Hand the current results to the brochure page (opened in a new tab).
els.brochure.addEventListener('click', () => {
  const payload = {
    area: whereLabel(),
    areaIsDefault: !state.center.label, // generic label: brochure uses "Montréal" instead
    center: { lat: state.center.lat, lon: state.center.lon },
    radiusKm: state.radiusKm,
    diet: state.diet,
    created: new Date().toISOString(),
    places: filtered(),
  };
  try {
    localStorage.setItem('veggie-brochure', JSON.stringify(payload));
  } catch {
    setStatus(t('status.storageBlocked'), true);
    return;
  }
  window.open(`brochure.html?lang=${I18N.lang}`, '_blank');
});

// ---------- Language ----------
function applyLanguage() {
  I18N.apply();
  document.title = t('meta.title');
  $('lang-btn').textContent = t('lang.switch');
  els.radiusLabel.textContent = `${I18N.num(state.radiusKm)} km`;
  map.attributionControl.removeAttribution(currentAttribution);
  currentAttribution = tileAttribution();
  map.attributionControl.addAttribution(currentAttribution);
  if (state.places.length) render();
}
$('lang-btn').addEventListener('click', () => {
  I18N.setLang(I18N.lang === 'fr' ? 'en' : 'fr');
  applyLanguage();
});
applyLanguage();

load();
