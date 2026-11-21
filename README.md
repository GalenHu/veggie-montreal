# 🌱 Veggie Montréal

Find vegetarian and vegan restaurants near any spot in Montréal, then turn the results into a printable tri-fold brochure.

**Live site: https://galenhu.github.io/veggie-montreal/**

## Features

- **Search by place**: address, neighbourhood, métro station, or your current location
- **Filters**: any veg dish / 100% vegetarian / 100% vegan, radius (0.5–10 km), open now
- **Map**: clustered pins; each cluster's ring shows the share of fully-veg places
- **🎲 Surprise me**: picks a random place from your current results
- **🗞️ Make brochure**: builds a Letter-size, double-sided tri-fold guide (cover, map, picks, listings) ready to print

## Run it locally

It's a static site with no build step and no API keys:

```bash
python3 -m http.server 8140
```

Then open http://localhost:8140.

## Where the data comes from

All place data is from [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL), © OpenStreetMap contributors.

1. **Live**: vector tiles from [MapComplete](https://mapcomplete.org)'s OSM cache (`tiles.js`)
2. **Fallback**: the [Overpass API](https://overpass-api.de)
3. **Offline fallback**: `data/montreal-backup.json`, a saved snapshot of places that were checked one by one against OpenStreetMap

Address search uses [Nominatim](https://nominatim.org). The map uses [Leaflet](https://leafletjs.com) and [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster).

Missing or wrong place? Fix it on OpenStreetMap (for example with MapComplete's food theme), and it will show up here once their cache refreshes.

## Files

| File | What it does |
| --- | --- |
| `index.html`, `style.css`, `app.js` | The finder |
| `tiles.js` | Reads MapComplete's vector tiles |
| `brochure.html`, `brochure.css`, `brochure.js` | The printable tri-fold |
| `data/montreal-backup.json` | Offline fallback list |
