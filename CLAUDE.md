# CLAUDE.md

This is Lucas Maher's portfolio website.

## Commands

```bash
npm run dev       # dev server at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview the production build
```

No test runner or linter is configured.

## Architecture

Vanilla JS, no framework. Vite bundles `src/main.js` and `src/style.css`. Everything else lives in `public/` and is served as static assets.

The site has two "modes":
- **3D mode** — Three.js scene (`src/main.js`) rendered in `index.html`. The 3D craft/about/contact pages are in `public/*3d.html`.
- **2D mode** — Flat neumorphic design system. All 2D pages live in `public/*2d.html`. The landing page for 2D is `public/2D.html`.

## Page map

| File | What it is |
|---|---|
| `index.html` | 3D entry point (Three.js scene) |
| `public/2D.html` | 2D landing page — project grid (6 projects) |
| `public/about2d.html` | About page |
| `public/contact2d.html` | Contact page |
| `public/vaccine2d.html` | Project page — Double Packaging (01) |
| `public/mac-lamp2d.html` | Project page — Mac-Lamp (02) |
| `public/portfolio2d.html` | Project page — This Website (03) |
| `public/kaffeemaschine2d.html` | Project page — Cybercoffee (04) |
| `public/virtual_cooking2d.html` | Project page — Virtual Cooking (05) |
| `public/unify2d.html` | Project page — Unify (06) |
| `public/top_row_permanent_V3.html` | Nav bar — loaded as an iframe on every 2D page |

## Nav bar iframe

Every 2D page embeds the nav as a fixed iframe:

```html
<iframe id="top-bar" src="/top_row_permanent_V3.html" allowtransparency="true"></iframe>
```

CSS on the host page:
```css
#top-bar {
  position: fixed; top: 0; left: 0;
  width: 100%; height: 90px;   /* default — just the nav bar */
  border: none; z-index: 10;
  background: transparent; overflow: visible;
  transition: transform 300ms ease;
}
#top-bar.hide { transform: translateY(-220px); }
```

**Why 90px default / 280px on dropdown open:**
The iframe blocks pointer events across its full height. The nav bar itself is ~86px tall. Keeping the iframe at 90px means only a tiny sliver at the top of the page is blocked. When the Craft dropdown opens, the nav sends a `postMessage` and the parent expands the iframe to 280px to give the dropdown room:

```js
// In top_row_permanent_V3.html (show/hide functions):
window.parent.postMessage({ type: 'nav-expand' }, '*');
window.parent.postMessage({ type: 'nav-collapse' }, '*');

// In every host page:
window.addEventListener('message', function(e) {
  if (e.data.type === 'nav-expand') topBar.style.height = '280px';
  if (e.data.type === 'nav-collapse') topBar.style.height = '90px';
});
```

The Craft dropdown items in the nav link to all 4 project pages via `window.top.location.href`.

Pages with content that starts near the top (`contact2d`, `about2d`, `2D.html`) have `padding-top: 90px` on `.page-wrapper` to clear the nav.

## Design system (neumorphic)

Surface colour: `#DCDCE3`

```css
:root {
  --bg-surface:     #DCDCE3;
  --text-primary:   #1A1A1A;
  --text-secondary: #8E8E93;
  --text-tertiary:  #c7c7cc;
  --accent-orange:  #FF5C00;
  --border-color:   #6f6f6f;

  --shadow-raised-sm: 5px 5px 12px rgba(174,174,192,0.65), -5px -5px 12px rgba(255,255,255,1);
  --shadow-raised:    8px 8px 18px rgba(174,174,192,0.65), -8px -8px 18px rgba(255,255,255,1);
  --shadow-pressed:   inset 5px 5px 10px rgba(174,174,192,0.6), inset -5px -5px 10px rgba(255,255,255,1);
}
```

Raised shadow = element pops out. Pressed/inset shadow = element pushed in (used for text insets, active states).

## Fonts

- `OCR-A-BT` (local TTF at `/OCR-A-BT.ttf`) — headings / project titles
- `VT323` (Google Fonts) — labels, breadcrumbs, meta text, monospace UI elements
- `Roboto Flex` (Google Fonts) — body text

## Cybercoffee project (`kaffeemaschine2d.html`)

The interactive coffee machine is a self-contained mini-app:
- Lives in `public/kaffeemaschine/kaffeemaschine.html` with its own assets (images, cursor)
- Embedded as an iframe inside `.machine-frame-wrap` on `kaffeemaschine2d.html`
- The machine's own CSS caps its width: `width: min(504px, 96vw)` — changing the wrapper size alone won't resize the egg; both files need updating
- An overlay (`#machine-overlay`) grays out the machine on load with a bouncing "[ click me ]" prompt; clicking dismisses it via JS

## 2D page layout patterns

**Standard pattern** (vaccine, mac-lamp, portfolio, kaffeemaschine):
1. **Hero** — full-width image or split layout
2. **Header section** — breadcrumb, OCR-A-BT title, blinking orange dot, dotted divider
3. **Meta grid** — 4 neumorphic tiles (Timeline, Team, Role, Tools)
4. **Overview / Concept** — multi-column section with image + text
5. **Process** — step tiles (numbered cards with images/text)
6. **Project nav** — bottom bar linking to next project

**Virtual Cooking (05)** — Single-track centered layout:
1. **Hero** — full-width 16:10 render image
2. **Header + meta grid** — standard
3. **At a Glance** — quick summary bullets (What / Interaction / Status / Best Fit)
4. **Overview / Concept** — centered full-width text with hero image, followed by reflection sections
5. **Feature sections** — Instructions, Ingredients & Timers, No Controllers (each with video + text)
6. **Full-bleed breakout image** — rendered view, full-width with padding
7. **Concept disclaimer** — two reflection sections (Reality Check, Where This Could Work)
8. **Project nav** — points to Unify (06)

**Unify (06)** — Phone video showcase layout:
1. **Hero device** — centered portrait phone video (homepage)
2. **Header + meta grid** — standard (placeholders; Timeline/Team/Role/Tools TBD)
3. **At a Glance** — quick summary (same as Virtual Cooking)
4. **Feature rows** (6 total) — alternating left/right phone video + text block pairs:
   - 01 Home, 02 Timetable, 03 Navigation, 04 Friends, 05 Socials, 06 Settings
5. **Project nav** — points to Double Packaging (01, wrap)

**Page background colors**:
- Standard pages: `#DCDCE3` (--bg-surface)
- Unify: `#D8D7DC` (matched to phone video app background to eliminate seams)

## Assets

Organized by project for clarity:

**Images** (`/public/images/`):
- `about/` — About page hero
- `mac-lamp/` — Mac-Lamp project images & diashow frames
- `portfolio/` — This Website project screenshots
- `vaccine/` — Double Packaging renders & process steps
- `vr-cookbook/` — Virtual Cooking 3D renders (back, side views)
- `site/` — favicon and shared UI assets

**Videos** (`/public/videos/`):
- `kaffeemaschine/` — Cybercoffee interface demo
- `mac-lamp/` — Mac-Lamp diashow video clips
- `vaccine/` — Double Packaging render video
- `vr-cookbook/` — Virtual Cooking demo clips (swipe, click, timer)
- `unify/` — Unify app screen recordings (portrait phone videos, all use `#D8D7DC` background)

**Other**:
- `/public/kaffeemaschine/kaffeemaschine.html` — Interactive coffee machine app (⚠️ missing from disk; needs restore)
- `/public/severance_V23.glb` — 3D model used in the Three.js scene
- `/public/OCR-A-BT.ttf` — custom monospace font

## Missing / TBD

- **Kaffeemaschine app** (`public/kaffeemaschine/kaffeemaschine.html`) — deleted from disk in asset cleanup. Needs restoration from backup. The page `kaffeemaschine2d.html` expects this as an iframe.
- **Unify page content** — All meta tiles (Timeline, Team, Role, Tools) and feature section copy are placeholders (`[ ... ]`). Fill in real values and feature descriptions.
- **Virtual Cooking English copy** — Current text is my draft. You'll edit for tone/accuracy.

## Known patterns / gotchas

- **`clip-path: inset(0)` on `.project-section`** in `2D.html` — prevents neumorphic box-shadow from the `--shadow-raised` white highlight bleeding across section borders
- **`minmax(0, 1fr)` in CSS grid** — required when a grid column contains a long OCR-A-BT title; without it the title overflows and collapses the other column
- **`position: fixed` inside iframes is clipped to the iframe's viewport height** — this is why the Craft dropdown needed the postMessage resize approach rather than just `overflow: visible`
- **Scroll-hide nav** — every 2D page adds/removes `.hide` on `#top-bar` based on scroll direction with 250px down / 180px up thresholds
- **Video filenames must be URL-safe** — video files with spaces in names (e.g., `map courses.mov`) break as `<source src>` URLs; rename to hyphens (e.g., `map-courses.mov`)
- **Unify video background color** — The phone videos embed a light gray app UI background (`#D8D7DC`, RGB 216,215,220). The page background is set to this exact color to eliminate the seam at video edges. Use Digital Color Meter in sRGB mode to sample if the hue drifts across devices.
- **Virtual Cooking layout uses guide-section** — The single-track centered layout reuses `.guide-section` (same padding as other sections) rather than adding a narrower `.guide-col` wrapper. This keeps consistent page-wrapper border framing.
- **i18n placeholders** — Unify page meta tiles and feature copy use `[ Placeholder ]` markers. Fill these in via the TRANSLATIONS object at the bottom of `unify2d.html` (EN/DE/FR).
