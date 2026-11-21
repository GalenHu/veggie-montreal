// Tiny EN/FR translation helper shared by the finder and the brochure.
// Language: ?lang=fr|en, else the saved choice, else the browser language.

(() => {
  const STRINGS = {
    en: {
      'meta.title': 'Veggie Montréal',
      'meta.description': 'Find vegetarian and vegan restaurants near you in Montréal.',
      'lang.switch': 'Français',
      'lang.switchAria': 'Afficher le site en français',
      tagline: 'Vegetarian & vegan spots near you',
      'search.label': 'Address, neighbourhood or métro',
      'search.placeholder': 'Plateau, Mile End, Berri-UQAM, an address…',
      'search.button': 'Search',
      locate: '📍 Use my location',
      'diet.aria': 'Diet',
      'diet.all': 'Any veg dish',
      'diet.vegetarian': '100% veg',
      'diet.vegan': '100% vegan',
      radius: 'Radius',
      openNow: 'Open now (when hours are known)',
      surprise: '🎲 Surprise me',
      brochure: '🗞️ Make brochure',
      areaBtn: 'Search this area',
      'foot.data': 'Data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors, served by <a href="https://mapcomplete.org" target="_blank" rel="noopener">MapComplete</a>\'s tile cache.',
      'foot.missing': 'Missing a place? <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener">Add it to OSM</a>.',
      'map.contributors': 'contributors',

      'kind.vegan': '100% vegan', 'kind.veg': '100% vegetarian', 'kind.opt': 'Veg options',
      'type.restaurant': 'Restaurant', 'type.cafe': 'Café', 'type.fast_food': 'Fast food', 'type.ice_cream': 'Ice cream',
      'type.food_court': 'Food court', 'type.bar': 'Bar', 'type.pub': 'Pub', 'type.biergarten': 'Beer garden',
      'type.bakery': 'Bakery', 'type.deli': 'Deli', 'type.pastry': 'Pastry', 'type.confectionery': 'Sweets', 'type.place': 'Place',
      openTag: 'Open now', closedTag: 'Closed now',
      directions: 'Directions', website: 'Website', call: 'Call',

      'center.downtown': 'Downtown Montréal', 'center.you': 'you', 'center.map': 'map centre',
      'status.loading': 'Loading veg-friendly places…',
      'status.searching': 'Searching for veg-friendly places…',
      'status.count': '{n} {places} within {r} km of {where}',
      'status.place': 'place', 'status.places': 'places',
      'status.noMatch': 'No places match these filters — try widening them.',
      'status.none': 'No veg-friendly places found here. Try a bigger radius.',
      'status.backup': ' · Live search is down, showing our saved list ({n} places, {date}).',
      'status.biggerRadius': ' Try a bigger radius.',
      'status.offline': 'Could not reach the OpenStreetMap servers. Please try again in a moment.',
      'status.lookingUp': 'Looking up “{q}”…',
      'status.notFound': 'Couldn’t find “{q}”. Try a street address or neighbourhood.',
      'status.geocodeDown': 'Address search is unavailable right now.',
      'status.noGeo': 'Your browser does not support location.',
      'status.locating': 'Getting your location…',
      'status.geoDenied': 'Location permission was denied. Search an address instead.',
      'status.surprise': '🎲 How about {name}? ({kind}, {dist} away)',
      'status.storageBlocked': 'Your browser blocked storage, so the brochure can’t be built.',

      // Brochure
      'b.title': 'Veggie Brochure',
      'b.back': '← Back to finder',
      'b.hint': 'Click the cover title or subtitle to edit it. Print on Letter, landscape, double-sided, flip on short edge, then fold in thirds.',
      'b.guides': 'Fold guides',
      'b.print': '🖨️ Print',
      'b.empty': 'No brochure data yet. Go back to the <a href="index.html">finder</a>, run a search, then press “Make brochure”.',
      'b.side1': 'Side 1 · Outside', 'b.side2': 'Side 2 · Inside',
      'b.goodToKnow': 'Good to know',
      'b.legendVegan': '<b>100% vegan</b>: nothing animal on the menu.',
      'b.legendVeg': '<b>100% vegetarian</b>: no meat or fish; may use dairy or eggs.',
      'b.legendOpt': '<b>Veg options</b>: a regular menu with at least some vegetarian dishes.',
      'b.picks': 'Our picks',
      'b.pickLine': '{kind}, #{n} inside',
      'b.phrases': 'Handy phrases',
      'b.phrasesList': '<li><i>Je suis végane / végétarien·ne.</i> = I’m vegan / vegetarian.</li><li><i>Est-ce qu’il y a du lait ou des œufs?</i> = Is there milk or egg in it?</li><li><i>Sans viande, s’il vous plaît.</i> = No meat, please.</li>',
      'b.note': 'Hours and menus change, so check before you go.',
      'b.findWay': 'Find your way',
      'b.mapCap': 'Numbers match the listings inside. The red dot marks {where}.',
      'b.searchCentre': 'the search centre',
      'b.made': 'Made {date}',
      'b.credit': 'Listings & map data © OpenStreetMap contributors (openstreetmap.org/copyright). Served via MapComplete (mapcomplete.org). Places are community-mapped and may be incomplete.',
      'b.kicker': 'A pocket guide to',
      'b.coverTitle': 'Veggie Eats',
      'b.band': 'Végé · Végane · Délicieux',
      'b.coverMeta': '{n} {diet} {spots} within {r} km',
      'b.spot': 'spot', 'b.spots': 'spots',
      'b.diet.all': 'vegetarian & vegan-friendly', 'b.diet.vegetarian': 'fully vegetarian', 'b.diet.vegan': 'fully vegan',
      'b.panel1': 'Where to eat', 'b.panel2': 'Keep exploring', 'b.panel3': 'Worth the walk',
      'b.noAddress': 'Address not listed',
      'b.more': '+ {n} more nearby. Search Veggie Montréal for the full list.',
      'b.open247': 'Open 24/7', 'b.closed': 'closed',
      'b.days': { Mo: 'Mon', Tu: 'Tue', We: 'Wed', Th: 'Thu', Fr: 'Fri', Sa: 'Sat', Su: 'Sun', PH: 'Holidays' },
    },

    fr: {
      'meta.title': 'Végé Montréal',
      'meta.description': 'Trouvez des restaurants végétariens et végétaliens près de chez vous à Montréal.',
      'lang.switch': 'English',
      'lang.switchAria': 'View the site in English',
      tagline: 'Adresses végétariennes et véganes près de vous',
      'search.label': 'Adresse, quartier ou métro',
      'search.placeholder': 'Plateau, Mile End, Berri-UQAM, une adresse…',
      'search.button': 'Chercher',
      locate: '📍 Me localiser',
      'diet.aria': 'Régime',
      'diet.all': 'Option végé',
      'diet.vegetarian': '100 % végé',
      'diet.vegan': '100 % végane',
      radius: 'Rayon',
      openNow: 'Ouvert maintenant (si les heures sont connues)',
      surprise: '🎲 Surprends-moi',
      brochure: '🗞️ Créer un dépliant',
      areaBtn: 'Chercher dans cette zone',
      'foot.data': 'Données © les contributeurs d’<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>, servies par le cache de tuiles de <a href="https://mapcomplete.org" target="_blank" rel="noopener">MapComplete</a>.',
      'foot.missing': 'Une adresse manque? <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener">Ajoutez-la à OSM</a>.',
      'map.contributors': 'contributeurs',

      'kind.vegan': '100 % végane', 'kind.veg': '100 % végétarien', 'kind.opt': 'Options végé',
      'type.restaurant': 'Restaurant', 'type.cafe': 'Café', 'type.fast_food': 'Restauration rapide', 'type.ice_cream': 'Crèmerie',
      'type.food_court': 'Aire de restauration', 'type.bar': 'Bar', 'type.pub': 'Pub', 'type.biergarten': 'Terrasse à bière',
      'type.bakery': 'Boulangerie', 'type.deli': 'Épicerie fine', 'type.pastry': 'Pâtisserie', 'type.confectionery': 'Confiserie', 'type.place': 'Lieu',
      openTag: 'Ouvert', closedTag: 'Fermé',
      directions: 'Itinéraire', website: 'Site web', call: 'Appeler',

      // Read after "à moins de 2 km de …", so each must work after "de".
      'center.downtown': 'Montréal (centre-ville)', 'center.you': 'vous', 'center.map': 'ce point de la carte',
      'status.loading': 'Chargement des adresses végé…',
      'status.searching': 'Recherche d’adresses végé…',
      'status.count': '{n} {places} à moins de {r} km de {where}',
      'status.place': 'adresse', 'status.places': 'adresses',
      'status.noMatch': 'Aucune adresse ne correspond à ces filtres. Essayez de les élargir.',
      'status.none': 'Aucune adresse végé trouvée ici. Essayez un plus grand rayon.',
      'status.backup': ' · La recherche en direct est indisponible; voici notre liste enregistrée ({n} adresses, {date}).',
      'status.biggerRadius': ' Essayez un plus grand rayon.',
      'status.offline': 'Impossible de joindre les serveurs d’OpenStreetMap. Réessayez dans un moment.',
      'status.lookingUp': 'Recherche de « {q} »…',
      'status.notFound': 'Impossible de trouver « {q} ». Essayez une adresse ou un quartier.',
      'status.geocodeDown': 'La recherche d’adresse est indisponible pour le moment.',
      'status.noGeo': 'Votre navigateur ne permet pas la localisation.',
      'status.locating': 'Localisation en cours…',
      'status.geoDenied': 'L’accès à la position a été refusé. Cherchez plutôt une adresse.',
      'status.surprise': '🎲 Que diriez-vous de {name}? ({kind}, à {dist})',
      'status.storageBlocked': 'Votre navigateur bloque le stockage; impossible de créer le dépliant.',

      // Brochure
      'b.title': 'Dépliant végé',
      'b.back': '← Retour à la recherche',
      'b.hint': 'Cliquez sur le titre ou le sous-titre de la couverture pour les modifier. Imprimez en format Lettre, paysage, recto verso (retourner sur le bord court), puis pliez en trois.',
      'b.guides': 'Repères de pliage',
      'b.print': '🖨️ Imprimer',
      'b.empty': 'Aucune donnée pour le dépliant. Retournez à la <a href="index.html">recherche</a>, lancez une recherche, puis cliquez sur « Créer un dépliant ».',
      'b.side1': 'Recto · Extérieur', 'b.side2': 'Verso · Intérieur',
      'b.goodToKnow': 'Bon à savoir',
      'b.legendVegan': '<b>100 % végane</b> : aucun produit animal au menu.',
      'b.legendVeg': '<b>100 % végétarien</b> : ni viande ni poisson; peut contenir des produits laitiers ou des œufs.',
      'b.legendOpt': '<b>Options végé</b> : un menu régulier avec au moins quelques plats végétariens.',
      'b.picks': 'Nos coups de cœur',
      'b.pickLine': '{kind}, n° {n} à l’intérieur',
      'b.phrases': 'Phrases utiles',
      'b.phrasesList': '<li><i>I’m vegan / vegetarian.</i> = Je suis végane / végétarien·ne.</li><li><i>Is there milk or egg in it?</i> = Est-ce qu’il y a du lait ou des œufs?</li><li><i>No meat, please.</i> = Sans viande, s’il vous plaît.</li>',
      'b.note': 'Les heures et les menus changent; vérifiez avant d’y aller.',
      'b.findWay': 'Pour vous y retrouver',
      'b.mapCap': 'Les numéros correspondent aux adresses à l’intérieur. Le point rouge indique {where}.',
      'b.searchCentre': 'le centre de la recherche',
      'b.made': 'Créé le {date}',
      'b.credit': 'Adresses et carte © les contributeurs d’OpenStreetMap (openstreetmap.org/copyright). Données servies par MapComplete (mapcomplete.org). Les lieux sont cartographiés par la communauté et peuvent être incomplets.',
      'b.kicker': 'Petit guide de',
      'b.coverTitle': 'Bouffe végé',
      'b.band': 'Végé · Végane · Délicieux',
      'b.coverMeta': '{n} {spots} {diet} à moins de {r} km',
      'b.spot': 'adresse', 'b.spots': 'adresses',
      'b.diet.all': 'avec options végé', 'b.diet.vegetarian': '100 % végétariennes', 'b.diet.vegan': '100 % véganes',
      'b.panel1': 'Où manger', 'b.panel2': 'Continuez l’exploration', 'b.panel3': 'Ça vaut le détour',
      'b.noAddress': 'Adresse non indiquée',
      'b.more': '+ {n} autres à proximité. Consultez Végé Montréal pour la liste complète.',
      'b.open247': 'Ouvert 24 h/24, 7 j/7', 'b.closed': 'fermé',
      'b.days': { Mo: 'lun', Tu: 'mar', We: 'mer', Th: 'jeu', Fr: 'ven', Sa: 'sam', Su: 'dim', PH: 'fériés' },
    },
  };

  // Common OSM cuisine values in French (others are shown as-is).
  const CUISINE_FR = {
    pizza: 'pizza', burger: 'burger', sandwich: 'sandwich', coffee_shop: 'café', breakfast: 'déjeuner',
    brunch: 'brunch', sushi: 'sushi', japanese: 'japonaise', chinese: 'chinoise', vietnamese: 'vietnamienne',
    thai: 'thaïlandaise', indian: 'indienne', italian: 'italienne', french: 'française', mexican: 'mexicaine',
    lebanese: 'libanaise', syrian: 'syrienne', middle_eastern: 'moyen-orientale', greek: 'grecque',
    korean: 'coréenne', ramen: 'ramen', noodle: 'nouilles', dumpling: 'dumplings', asian: 'asiatique',
    american: 'américaine', regional: 'régionale', salad: 'salades', soup: 'soupes', juice: 'jus',
    smoothie: 'smoothies', bagel: 'bagels', crepe: 'crêpes', ice_cream: 'crème glacée', pastry: 'pâtisserie',
    cake: 'gâteaux', donut: 'beignes', chicken: 'poulet', kebab: 'kébab', falafel: 'falafel',
    shawarma: 'shawarma', poke: 'poké', bubble_tea: 'thé aux perles', tea: 'thé', organic: 'bio',
    portuguese: 'portugaise', peruvian: 'péruvienne', venezuelan: 'vénézuélienne', arab: 'arabe',
    ethiopian: 'éthiopienne', african: 'africaine', caribbean: 'antillaise', haitian: 'haïtienne',
    spanish: 'espagnole', tapas: 'tapas', mediterranean: 'méditerranéenne', fish_and_chips: 'fish and chips',
    friture: 'friture', poutine: 'poutine', healthy: 'santé', fusion: 'fusion', international: 'internationale',
    hot_dog: 'hot-dogs', bbq: 'BBQ', steak_house: 'grillades', seafood: 'fruits de mer', tacos: 'tacos',
  };

  function detect() {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'fr' || q === 'en') return q;
    try {
      const saved = localStorage.getItem('veggie-lang');
      if (saved === 'fr' || saved === 'en') return saved;
    } catch { /* storage blocked */ }
    return (navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
  }

  const I18N = {
    lang: detect(),

    t(key, vars = {}) {
      const s = STRINGS[I18N.lang][key] ?? STRINGS.en[key] ?? key;
      return typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : s;
    },

    /** Locale-aware number: 1.4 → "1,4" in French. */
    num(n, digits = 1) {
      return n.toLocaleString(I18N.lang === 'fr' ? 'fr-CA' : 'en-CA', { maximumFractionDigits: digits });
    },

    dist(km) {
      return km < 1 ? `${Math.round(km * 1000)} m` : `${I18N.num(km)} km`;
    },

    cuisine(value) {
      return I18N.lang === 'fr' ? (CUISINE_FR[value] || value) : value;
    },

    setLang(lang) {
      I18N.lang = lang;
      try { localStorage.setItem('veggie-lang', lang); } catch { /* storage blocked */ }
      const url = new URL(location.href);
      url.searchParams.set('lang', lang);
      history.replaceState(null, '', url);
      I18N.apply();
    },

    /** Fill every element marked with data-i18n* attributes. */
    apply(root = document) {
      document.documentElement.lang = I18N.lang;
      root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = I18N.t(el.dataset.i18n); });
      root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = I18N.t(el.dataset.i18nHtml); });
      root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = I18N.t(el.dataset.i18nPlaceholder); });
      root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', I18N.t(el.dataset.i18nAria)); });
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.content = I18N.t('meta.description');
    },
  };

  window.I18N = I18N;
})();
