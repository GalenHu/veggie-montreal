// Live data from MapComplete's OpenStreetMap tile cache (https://mapcomplete.org).
// Their server pre-cuts OSM food places into vector tiles; one zoom-10 tile
// covers greater Montréal with every tag we need, so a search is usually one
// or two downloads, then instant from the in-memory cache.

(() => {
  const BASE = 'https://cache.mapcomplete.org/public.';
  const ZOOM = 10;
  const LAYERS = ['pois_food', 'polygons_food', 'pois_ice_cream', 'pois_food_shops'];
  const VEG = /^(yes|only|limited)$/;
  const TYPES = { N: 'node', W: 'way', R: 'relation' };

  const tileCache = new Map(); // "layer/z/x/y" -> Promise<elements[]>
  let libs;

  function loadLibs() {
    libs ??= Promise.all([
      import('https://cdn.jsdelivr.net/npm/@mapbox/vector-tile@2.0.3/+esm'),
      import('https://cdn.jsdelivr.net/npm/pbf@4.0.1/+esm'),
    ]).then(([vt, pbf]) => ({ VectorTile: vt.VectorTile, Pbf: pbf.default }));
    return libs;
  }

  const lonToX = (lon, z) => ((lon + 180) / 360) * 2 ** z;
  const latToY = (lat, z) => {
    const r = (lat * Math.PI) / 180;
    return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
  };
  const xToLon = (x, z) => (x / 2 ** z) * 360 - 180;
  const yToLat = (y, z) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** z))) * 180) / Math.PI;

  function isVeg(tags) {
    const c = tags.cuisine || '';
    return VEG.test(tags['diet:vegan'] || '') || VEG.test(tags['diet:vegetarian'] || '') || /vegan|vegetarian/.test(c);
  }

  async function loadTile(layer, x, y) {
    const key = `${layer}/${ZOOM}/${x}/${y}`;
    if (!tileCache.has(key)) {
      const p = (async () => {
        const { VectorTile, Pbf } = await loadLibs();
        const res = await fetch(`${BASE}${layer}/${ZOOM}/${x}/${y}.pbf`, { signal: AbortSignal.timeout(20000) });
        if (!res.ok) throw new Error(`MapComplete tile ${key}: HTTP ${res.status}`);
        const tile = new VectorTile(new Pbf(await res.arrayBuffer()));
        const out = [];
        for (const ly of Object.values(tile.layers)) {
          for (let i = 0; i < ly.length; i++) {
            const f = ly.feature(i);
            const tags = { ...f.properties };
            if (!tags.name || !isVeg(tags)) continue;
            // Point: first coordinate. Polygon/line: average of the outer ring.
            const ring = f.loadGeometry()[0];
            const px = ring.reduce((s, p) => s + p.x, 0) / ring.length;
            const py = ring.reduce((s, p) => s + p.y, 0) / ring.length;
            const type = TYPES[tags.osm_type] || 'node';
            const id = tags.osm_id;
            delete tags.osm_type; delete tags.osm_id;
            out.push({
              type, id, tags,
              lon: xToLon(x + px / ly.extent, ZOOM),
              lat: yToLat(y + py / ly.extent, ZOOM),
            });
          }
        }
        return out;
      })();
      p.catch(() => tileCache.delete(key)); // let a failed tile be retried later
      tileCache.set(key, p);
    }
    return tileCache.get(key);
  }

  /** Veg-friendly OSM elements in all tiles touching the search circle. */
  async function fetchVegElements(center, radiusKm) {
    const dLat = radiusKm / 111;
    const dLon = radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180));
    const x0 = Math.floor(lonToX(center.lon - dLon, ZOOM)), x1 = Math.floor(lonToX(center.lon + dLon, ZOOM));
    const y0 = Math.floor(latToY(center.lat + dLat, ZOOM)), y1 = Math.floor(latToY(center.lat - dLat, ZOOM));
    const jobs = [];
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (const l of LAYERS) jobs.push(loadTile(l, x, y));
    const results = await Promise.allSettled(jobs);
    const ok = results.filter((r) => r.status === 'fulfilled');
    // The main food layer must load, otherwise treat the whole lookup as failed.
    if (!ok.length || results.slice(0, 1).some((r) => r.status === 'rejected')) {
      throw results.find((r) => r.status === 'rejected')?.reason || new Error('No tiles loaded');
    }
    return ok.flatMap((r) => r.value);
  }

  window.MapCompleteTiles = { fetchVegElements };
})();
