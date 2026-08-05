/* ── Site analytics ────────────────────────────────────────────────
   Umami Cloud: cookieless and stores no personal data, so it needs no
   consent banner (unlike GA4). Loaded from every TOP-LEVEL page —
   index.html plus the *2d.html project pages and 2D.html, which are
   real navigations (`window._nav` sets location.href), not iframes.

   Deliberately NOT loaded in the *3d.html overlay documents or
   top_row_permanent_V3.html: those live inside iframes on index.html,
   and a tracker in a frame registers its own pageview + session, which
   would double-count every visit and split one visitor into several.
   Overlay opens are reported from the parent instead, as `nav_open`
   events fired by src/main.js.

   Pageviews alone say almost nothing here — the 3D scene is a single
   document, so walking around, opening Craft and reading About is one
   pageview. The custom events fired via window.track() are the actual
   signal. Event names/props are listed in README.md.
   ──────────────────────────────────────────────────────────────── */
(function () {
  // From Umami → Settings → Websites → (this site) → Edit → Website ID.
  var WEBSITE_ID = 'e12aba99-68ae-4818-b968-7c4baca00675';

  // Only the live domain reports. `npm run dev`, `vite --host` on the LAN,
  // and any *.github.io preview all no-op, so local walking-around never
  // shows up in the dashboard as real traffic.
  var LIVE = /(^|\.)lucasmaher\.com$/.test(location.hostname);

  var queue = [];
  var tries = 0;

  window.track = function (name, data) {
    if (!LIVE) { console.debug('[track]', name, data || {}); return; }
    if (window.umami) { window.umami.track(name, data); return; }

    // The umami script is async, and some events fire before it lands
    // (webgl_failed can happen on the very first frame) — hold those and
    // flush once it exists. Gives up after ~10s so a blocked/ad-blocked
    // script leaves no interval running forever.
    queue.push([name, data]);
    if (queue.length > 1) return;
    var t = setInterval(function () {
      if (window.umami) {
        clearInterval(t);
        queue.forEach(function (a) { window.umami.track(a[0], a[1]); });
        queue = [];
      } else if (++tries > 50) {
        clearInterval(t);
        queue = [];
      }
    }, 200);
  };

  if (!LIVE) return;

  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://cloud.umami.is/script.js';
  s.setAttribute('data-website-id', WEBSITE_ID);
  document.head.appendChild(s);
})();
