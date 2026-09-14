/* Puddle Lane. Plain JS, no build step. Everything here decorates a page that
   already reads top to bottom without it. */
(function () {
  'use strict';

  var PREFIX = 'pl';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(key, val) { try { if (val === undefined) return localStorage.getItem(PREFIX + '-' + key); localStorage.setItem(PREFIX + '-' + key, val); } catch (e) { return null; } }

  /* ---------- Menu ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('main-nav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); toggle.focus(); } });
    document.addEventListener('click', function (e) { if (nav.classList.contains('open') && !e.target.closest('.site-header')) setMenu(false); });
  }

  /* ---------- Open just now? Friday and Saturday, 10am to 4pm, Europe/London ---------- */
  var status = document.getElementById('open-status');
  function openStatus(now) {
    var parts;
    try {
      parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(now);
    } catch (e) { return null; }
    var get = function (t) { var p = parts.filter(function (x) { return x.type === t; })[0]; return p ? p.value : ''; };
    var day = get('weekday'); var mins = (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10);
    if (isNaN(mins)) return null;
    var tradingDay = day === 'Fri' || day === 'Sat';
    if (tradingDay && mins >= 600 && mins < 960) return { open: true, text: 'Open just now, until 4pm' };
    if (tradingDay && mins < 600) return { open: false, text: 'Opens today at 10am' };
    if (day === 'Fri') return { open: false, text: 'Closed just now, back Saturday at 10am' };
    return { open: false, text: 'Closed just now, back Friday at 10am' };
  }
  function paintStatus() {
    if (!status) return;
    var s = openStatus(new Date());
    if (!s) return;
    status.textContent = s.text;
    status.classList.toggle('is-open', s.open);
    status.hidden = false;
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------- Who's it for? The signature move: pick an occasion, the shelves re-sort
     and the "put it by" email writes itself. Only Liza's six real categories. ---------- */
  var PICKS = {
    baby:        { label: 'a new baby',      shelves: ['little', 'cards', 'seasonal'] },
    home:        { label: 'a new home',      shelves: ['candles', 'cards', 'seasonal'] },
    birthday:    { label: 'a big birthday',  shelves: ['jewellery', 'bags', 'candles', 'cards'] },
    anniversary: { label: 'an anniversary',  shelves: ['jewellery', 'candles', 'cards'] },
    wedding:     { label: 'a wedding',       shelves: ['candles', 'seasonal', 'cards'] },
    thanks:      { label: 'a thank you',     shelves: ['candles', 'cards', 'seasonal'] },
    sympathy:    { label: 'a sympathy card', shelves: ['cards', 'candles'] },
    because:     { label: 'no reason at all', shelves: ['jewellery', 'bags', 'seasonal'] }
  };
  var shelf = document.getElementById('shelf');
  var shopHeading = document.getElementById('shop-heading');
  var hint = document.getElementById('occasion-hint');
  var occasionButtons = Array.prototype.slice.call(document.querySelectorAll('.occasion'));
  var reserveLinks = Array.prototype.slice.call(document.querySelectorAll('.reserve-link'));
  var defaultHeading = shopHeading ? shopHeading.textContent : '';
  var defaultOrder = shelf ? Array.prototype.slice.call(shelf.children) : [];
  var current = null;

  function mailto(label) {
    var subject = label ? 'Something for ' + label : 'Could you put something by for me?';
    var body = 'Hi Liza,\n\n' + (label ? "I'm after something for " + label + '.' : "I've seen something I like.") + ' Could you put something by for me to collect on Friday or Saturday?\n\nThanks,';
    return 'mailto:puddlelane@yahoo.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  function applyPick(key) {
    if (!shelf) return;
    var pick = key ? PICKS[key] : null;
    var items = Array.prototype.slice.call(shelf.children);
    var ordered;
    if (pick) {
      var first = pick.shelves.map(function (id) { return items.filter(function (li) { return li.dataset.shelf === id; })[0]; }).filter(Boolean);
      var rest = defaultOrder.filter(function (li) { return first.indexOf(li) === -1; });
      ordered = first.concat(rest);
      items.forEach(function (li) {
        var tag = li.querySelector('.shelf-tag');
        var picked = first.indexOf(li) !== -1;
        li.classList.toggle('is-rest', !picked);
        if (tag) { tag.hidden = !picked; tag.textContent = picked ? 'For ' + pick.label : ''; }
      });
    } else {
      ordered = defaultOrder;
      items.forEach(function (li) { li.classList.remove('is-rest'); var tag = li.querySelector('.shelf-tag'); if (tag) { tag.hidden = true; tag.textContent = ''; } });
    }
    ordered.forEach(function (li) { shelf.appendChild(li); });
    if (shopHeading) shopHeading.textContent = pick ? 'For ' + pick.label + ', start here.' : defaultHeading;
    reserveLinks.forEach(function (a) { a.setAttribute('href', mailto(pick ? pick.label : null)); });
    if (hint) {
      hint.innerHTML = pick
        ? 'Sorted for <strong>' + pick.label + '</strong>. <a href="#shop">See the shelves</a>, or pick again.'
        : '';
    }
  }

  function choose(key) {
    var next = key === current ? null : key;
    occasionButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.occasion === next)); });
    var run = function () { applyPick(next); };
    current = next;
    if (next && shopHeading) {
      var r = shopHeading.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * 0.6) {
        setTimeout(function () { document.getElementById('shop').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }, 60);
      }
    }
    if (!reduceMotion && document.startViewTransition) {
      defaultOrder.forEach(function (li) { li.style.viewTransitionName = 'shelf-' + li.dataset.shelf; });
      if (shopHeading) shopHeading.style.viewTransitionName = 'shop-heading';
      document.startViewTransition(run);
    } else {
      run();
    }
  }
  occasionButtons.forEach(function (b) { b.addEventListener('click', function () { choose(b.dataset.occasion); }); });

  /* ---------- Reveal on scroll. Only if the browser can and the visitor wants motion. ---------- */
  var revealables = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (!reduceMotion && 'IntersectionObserver' in window && revealables.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) return; /* already on screen: never hide it */
      el.classList.add('reveal'); io.observe(el);
    });
  }

  /* ---------- Consent and the map ----------
     The page sets no cookies. The map is the one third party (CARTO tiles), so it
     waits for a yes, either on the bar or on the "Show the map" button. If analytics
     is ever added, enableAnalytics() is where it goes, and it stays behind the same yes. */
  var consent = document.getElementById('consent');
  var mapEl = document.getElementById('shop-map');
  var placeholder = document.getElementById('map-placeholder');
  var mapButton = document.getElementById('map-load');
  var mapState = 'idle';

  function setConsentHeight() {
    var h = consent && !consent.hidden ? consent.getBoundingClientRect().height + 24 : 0;
    document.documentElement.style.setProperty('--consent-h', h + 'px');
  }
  function showConsent() { if (!consent) return; consent.hidden = false; setConsentHeight(); }
  function hideConsent() { if (!consent) return; consent.hidden = true; setConsentHeight(); }

  function enableAnalytics() {
    /* Nothing runs yet. When Liza's site is live on its own domain and she wants visitor
       counts, a cookieless script (e.g. Plausible) goes here, and only here. */
  }

  function loadAsset(tag, attrs) {
    return new Promise(function (resolve, reject) {
      var el = document.createElement(tag);
      Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
      el.onload = resolve; el.onerror = reject;
      document.head.appendChild(el);
    });
  }

  function loadMap() {
    if (!mapEl || mapState !== 'idle') return;
    mapState = 'loading';
    if (mapButton) { mapButton.disabled = true; mapButton.textContent = 'Loading the map'; }
    Promise.all([
      loadAsset('link', { rel: 'stylesheet', href: 'vendor/leaflet/leaflet.css' }),
      loadAsset('script', { src: 'vendor/leaflet/leaflet.js' })
    ]).then(function () {
      var L = window.L; if (!L) throw new Error('Leaflet missing');
      var SHOP = [55.999059, -3.784378]; /* verified centroid of FK1 1ED */
      var map = L.map(mapEl, { center: SHOP, zoom: 17, scrollWheelZoom: false, zoomControl: true, attributionControl: false });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19 }).addTo(map);
      var pin = L.divIcon({ className: 'shop-pin', html: '<span class="shop-pin__pulse"></span><span class="shop-pin__dot"></span>', iconSize: [26, 26], iconAnchor: [13, 13] });
      L.marker(SHOP, { icon: pin, keyboard: false, alt: 'Puddle Lane' }).addTo(map).bindPopup('<strong>Puddle Lane</strong><br>109 High Street, Falkirk');
      map.on('click', function () { map.scrollWheelZoom.enable(); });
      map.on('mouseout', function () { map.scrollWheelZoom.disable(); });
      var resizeTimer;
      window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(function () { map.invalidateSize(); }, 180); });
      if (placeholder) placeholder.hidden = true;
      mapState = 'ready';
    }).catch(function () {
      mapState = 'idle';
      if (mapButton) { mapButton.disabled = false; mapButton.textContent = 'Try the map again'; }
    });
  }

  function armMapOnScroll() {
    if (!mapEl) return;
    if (!('IntersectionObserver' in window)) { loadMap(); return; }
    var mio = new IntersectionObserver(function (entries) {
      if (entries.some(function (en) { return en.isIntersecting; })) { loadMap(); mio.disconnect(); }
    }, { rootMargin: '200px 0px' });
    mio.observe(mapEl);
  }

  function decide(choice) {
    store('consent', choice);
    hideConsent();
    if (choice === 'accept') { enableAnalytics(); armMapOnScroll(); }
  }

  if (consent) {
    consent.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]'); if (b) decide(b.dataset.consent);
    });
    var saved = store('consent');
    if (saved === 'accept') { armMapOnScroll(); }
    else if (saved !== 'reject') { showConsent(); }
    window.addEventListener('resize', setConsentHeight);
  }
  if (mapButton) mapButton.addEventListener('click', loadMap);

  var reopen = document.getElementById('cookie-settings');
  if (reopen) reopen.addEventListener('click', function () { showConsent(); var first = consent.querySelector('[data-consent]'); if (first) first.focus(); });
  /* Legal pages link back to ./#cookie-settings. hashchange does not fire cross-document, so check on load. */
  function reopenFromHash() {
    if (location.hash !== '#cookie-settings') return;
    showConsent();
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }
  window.addEventListener('hashchange', reopenFromHash); reopenFromHash();
})();
