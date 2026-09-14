/* Puddle Lane. Plain JS on top of scroll-craft. Everything here decorates a page
   that already reads top to bottom without it. */
(function () {
  'use strict';

  var PREFIX = 'pl';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(key, val) { try { if (val === undefined) return localStorage.getItem(PREFIX + '-' + key); localStorage.setItem(PREFIX + '-' + key, val); } catch (e) { return null; } }
  function cssPx(name) { var v = getComputedStyle(document.documentElement).getPropertyValue(name); return parseFloat(v) || 0; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  if (window.ScrollCraft) ScrollCraft.mount(document.body);

  /* The scene: on a phone the drawing frames the door, the open sign and the number,
     so the tags on it are readable. Desktop sees the whole shopfront. */
  var art = document.getElementById('shop-art');
  function frameArt() {
    if (!art) return;
    var phone = window.matchMedia('(max-width: 700px)').matches;
    art.setAttribute('viewBox', phone ? '860 120 330 600' : '0 0 1200 720');
    art.setAttribute('preserveAspectRatio', phone ? 'xMaxYMid slice' : 'xMidYMid slice');
  }
  frameArt(); window.addEventListener('resize', frameArt);

  /* ---------- Who's it for? The pick goes on the tag. ----------
     Only Liza's six real categories; the mapping is editorial, nothing is invented. */
  var PICKS = {
    baby:        { label: 'a new baby',       shelves: ['little', 'cards', 'seasonal'] },
    home:        { label: 'a new home',       shelves: ['candles', 'cards', 'seasonal'] },
    birthday:    { label: 'a big birthday',   shelves: ['jewellery', 'bags', 'candles', 'cards'] },
    anniversary: { label: 'an anniversary',   shelves: ['jewellery', 'candles', 'cards'] },
    wedding:     { label: 'a wedding',        shelves: ['candles', 'seasonal', 'cards'] },
    thanks:      { label: 'a thank you',      shelves: ['candles', 'cards', 'seasonal'] },
    sympathy:    { label: 'a sympathy card',  shelves: ['cards', 'candles'] },
    because:     { label: 'no reason at all', shelves: ['jewellery', 'bags', 'seasonal'] }
  };
  var tag = document.getElementById('tag');
  var tagWho = document.getElementById('tag-who');
  var giftWho = document.getElementById('gift-who');
  var pickNote = document.getElementById('pick-note');
  var reserve = document.getElementById('reserve-link');
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.occasion'));
  var shelves = Array.prototype.slice.call(document.querySelectorAll('[data-shelf]'));
  var current = null;

  function mailto(label) {
    var subject = label ? 'Something for ' + label : 'Could you put something by for me?';
    var body = 'Hi Liza,\n\n' + (label ? "I'm after something for " + label + '.' : "I've seen something I like.") + ' Could you put something by for me to collect on Friday or Saturday?\n\nThanks,';
    return 'mailto:puddlelane@yahoo.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }
  function applyPick(key) {
    var pick = key ? PICKS[key] : null;
    var who = pick ? pick.label : '';
    if (tagWho) tagWho.textContent = who;
    if (giftWho) giftWho.textContent = who;
    if (tag) { tag.classList.toggle('is-set', !!pick); }
    shelves.forEach(function (s) {
      var mark = s.querySelector('.shelf__for'); if (!mark) return;
      var on = !!pick && pick.shelves.indexOf(s.dataset.shelf) !== -1;
      mark.hidden = !on; mark.textContent = on ? 'For ' + who : '';
    });
    if (reserve) reserve.setAttribute('href', mailto(who || null));
    if (pickNote) pickNote.innerHTML = pick ? 'On the tag: <strong>' + who + '</strong>. Scroll on, the shelves that suit it are ticked.' : '';
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.occasion === key)); });
  }
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      current = b.dataset.occasion === current ? null : b.dataset.occasion;
      applyPick(current);
      if (tag && current && !reduceMotion) { tag.classList.remove('is-nudge'); void tag.offsetWidth; tag.classList.add('is-nudge'); }
    });
  });

  /* ---------- The ribbon and the bow ----------
     A ribbon fixed down the left edge grows with scroll. At the close it curves in
     to the gift tag, a second ribbon crosses the page, and the bow ties. */
  var rb = document.getElementById('ribbon-base'), rs = document.getElementById('ribbon-sheen'), re = document.getElementById('ribbon-edge');
  var close = document.getElementById('close');
  var bow = document.getElementById('bow');
  var giftTag = document.getElementById('gift-tag');
  var across = document.getElementById('bow-across'), acrossSheen = document.getElementById('bow-across-sheen'), knot = document.getElementById('bow-knot'), knotScale = document.getElementById('bow-knot-scale');
  var curve = null, curveSheen = null, tail = null;
  if (bow) {
    var ns = 'http://www.w3.org/2000/svg';
    curve = document.createElementNS(ns, 'path'); curve.setAttribute('class', 'bow__across'); curve.setAttribute('pathLength', '1');
    curveSheen = document.createElementNS(ns, 'path'); curveSheen.setAttribute('class', 'bow__across-sheen'); curveSheen.setAttribute('pathLength', '1');
    tail = document.createElementNS(ns, 'path'); tail.setAttribute('class', 'bow__across'); tail.setAttribute('pathLength', '1');
    bow.insertBefore(tail, across); bow.insertBefore(curve, across); bow.insertBefore(curveSheen, across);
  }
  var ticking = false;
  function ease(t) { return 1 - Math.pow(1 - t, 2); }
  function paint() {
    ticking = false;
    var vh = window.innerHeight, vw = window.innerWidth;
    var max = document.documentElement.scrollHeight - vh;
    var p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 1;
    var x = cssPx('--ribbon-x'), w = cssPx('--ribbon-w');
    var stripEl = document.querySelector('.strip'); var chrome = stripEl ? stripEl.getBoundingClientRect().bottom : 0;
    var tip = chrome + (vh - chrome) * (0.12 + 0.88 * ease(p));
    var tie = 0, closeTop = vh;
    if (close) {
      var r = close.getBoundingClientRect();
      closeTop = r.top;
      tie = clamp((vh - r.top) / Math.max(1, Math.min(r.height, vh) * 0.85), 0, 1);
      close.style.setProperty('--pl-tie', tie.toFixed(3));
    }
    /* the fixed ribbon hands over to the in-flow one at the close's top edge */
    var y2 = Math.max(0, Math.min(tip, closeTop));
    [rb, rs, re].forEach(function (l) { if (!l) return; l.setAttribute('x1', x); l.setAttribute('x2', x); l.setAttribute('y1', 0); l.setAttribute('y2', y2); });
    if (rb) rb.setAttribute('stroke-width', w);
    if (re) re.setAttribute('x1', x + w / 2 - 0.5), re.setAttribute('x2', x + w / 2 - 0.5);
    if (tag) tag.classList.toggle('is-hidden', tie > 0.3);

    if (bow && giftTag && close) {
      var cw = close.clientWidth, ch = close.clientHeight;
      var cr = close.getBoundingClientRect(), tr = giftTag.getBoundingClientRect();
      var knotX = Math.round(tr.left - cr.left + 4);
      var knotY = Math.round(tr.top - cr.top + 10);
      bow.setAttribute('viewBox', '0 0 ' + cw + ' ' + ch);
      var d = 'M' + x + ' 0 C' + x + ' ' + (knotY * 0.55) + ' ' + knotX + ' ' + (knotY * 0.45) + ' ' + knotX + ' ' + knotY;
      curve.setAttribute('d', d); curveSheen.setAttribute('d', d);
      curve.setAttribute('stroke-width', w); curveSheen.setAttribute('stroke-width', Math.max(2, w * 0.28));
      tail.setAttribute('d', 'M' + knotX + ' ' + knotY + ' V' + ch); tail.setAttribute('stroke-width', w);
      [across, acrossSheen].forEach(function (l) { l.setAttribute('d', 'M' + knotX + ' ' + knotY + ' H' + cw); });
      across.setAttribute('stroke-width', w); acrossSheen.setAttribute('stroke-width', Math.max(2, w * 0.28));
      /* three beats inside tie: the curve in (0 to .45), the across and tail (.35 to .8), the knot (.7 to 1) */
      var a = clamp(tie / 0.45, 0, 1), b = clamp((tie - 0.35) / 0.45, 0, 1), c = clamp((tie - 0.7) / 0.3, 0, 1);
      curve.style.strokeDashoffset = 1 - a; curveSheen.style.strokeDashoffset = 1 - a;
      across.style.strokeDashoffset = 1 - b; acrossSheen.style.strokeDashoffset = 1 - b; tail.style.strokeDashoffset = 1 - b;
      knot.setAttribute('transform', 'translate(' + knotX + ' ' + knotY + ') scale(' + (w / 14 * 1.5) + ')');
      knotScale.style.transform = 'scale(' + (c * c) + ')';
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onScroll);
  paint();

  /* ---------- Consent and the map ----------
     The page sets no cookies. The map is the one third party (CARTO tiles), so it waits
     for a yes, on the bar or on "Show the map". Analytics, if ever added, goes behind
     the same yes in enableAnalytics(). Nothing is injected today. */
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
  function enableAnalytics() { /* cookieless counter (e.g. Plausible) goes here, and only here, once the site is live */ }

  function loadAsset(tagName, attrs) {
    return new Promise(function (resolve, reject) {
      var el = document.createElement(tagName);
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
      var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { map.invalidateSize(); }, 180); });
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
    consent.addEventListener('click', function (e) { var b = e.target.closest('[data-consent]'); if (b) decide(b.dataset.consent); });
    var saved = store('consent');
    if (saved === 'accept') { armMapOnScroll(); } else if (saved !== 'reject') { showConsent(); }
    window.addEventListener('resize', setConsentHeight);
  }
  if (mapButton) mapButton.addEventListener('click', loadMap);
  var reopen = document.getElementById('cookie-settings');
  if (reopen) reopen.addEventListener('click', function () { showConsent(); var f = consent.querySelector('[data-consent]'); if (f) f.focus(); });
  function reopenFromHash() {
    if (location.hash !== '#cookie-settings') return;
    showConsent();
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }
  window.addEventListener('hashchange', reopenFromHash); reopenFromHash();
})();
