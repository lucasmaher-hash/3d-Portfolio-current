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
| `public/2D.html` | 2D landing page — project grid |
| `public/about2d.html` | About page |
| `public/contact2d.html` | Contact page |
| `public/kaffeemaschine2d.html` | Project page — Cybercoffee |
| `public/vaccine2d.html` | Project page — Double Packaging |
| `public/mac-lamp2d.html` | Project page — Mac-Lamp |
| `public/portfolio2d.html` | Project page — This Website |
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

## 2D page layout pattern

All project pages follow the same structure:
1. **Hero** — either a split (egg left / text right) or full-width video/image
2. **Header section** — breadcrumb, OCR-A-BT title, blinking orange dot, dotted divider
3. **Meta grid** — 4 neumorphic tiles (Timeline, Team, Role, Tools)
4. **Overview / Concept** — section heading + dotted divider + text
5. **Process** — section heading + dotted divider + step tiles
6. **Project nav** — bottom bar linking to the next project

## Assets

- `/public/images/` — shared images and videos
- `/public/kaffeemaschine/` — coffee machine app assets
- `/public/severance_V23.glb` — 3D model used in the Three.js scene
- `/public/OCR-A-BT.ttf` — custom font

## Known patterns / gotchas

- **`clip-path: inset(0)` on `.project-section`** in `2D.html` — prevents neumorphic box-shadow from the `--shadow-raised` white highlight bleeding across section borders
- **`minmax(0, 1fr)` in CSS grid** — required when a grid column contains a long OCR-A-BT title; without it the title overflows and collapses the other column
- **`position: fixed` inside iframes is clipped to the iframe's viewport height** — this is why the Craft dropdown needed the postMessage resize approach rather than just `overflow: visible`
- **Scroll-hide nav** — every 2D page adds/removes `.hide` on `#top-bar` based on scroll direction with 250px down / 180px up thresholds
