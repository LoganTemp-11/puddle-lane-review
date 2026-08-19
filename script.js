const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('main-nav');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    });
  });
}

/* Shop map. Coordinates are the verified centroid of FK1 1ED. */
const SHOP = [55.999059, -3.784378];
const mapEl = document.getElementById('shop-map');

if (mapEl && window.L) {
  const map = L.map(mapEl, {
    center: SHOP,
    zoom: 17,
    scrollWheelZoom: false,
    zoomControl: true,
    attributionControl: false
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  const pin = L.divIcon({
    className: 'shop-pin',
    html: '<span class="shop-pin__pulse"></span><span class="shop-pin__dot"></span>',
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });

  L.marker(SHOP, { icon: pin, keyboard: false, alt: 'Puddle Lane' })
    .addTo(map)
    .bindPopup('<strong>Puddle Lane</strong><br>109 High Street, Falkirk');

  // Click to enable wheel zoom, so the page still scrolls past the map normally.
  map.on('click', () => map.scrollWheelZoom.enable());
  map.on('mouseout', () => map.scrollWheelZoom.disable());

  // Repaint tiles when the container changes size, e.g. window resize or a phone rotating.
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => map.invalidateSize(), 180);
  });
}
