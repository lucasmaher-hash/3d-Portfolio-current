# 3D Portfolio

An interactive first-person portfolio built with Three.js. Visitors walk through a 3D environment and click on objects to open project pages.

## Tech stack

| Layer | Tool |
|---|---|
| Bundler | Vite |
| 3D engine | Three.js (`three@^0.184`) |
| 3D model | GLTF/GLB (`severance_V23.glb`) |
| Fonts | OCR-A BT (local), VT323 + Roboto (Google Fonts) |
| Language | Vanilla JS (ES modules) |

## Project structure

```
3D_Portfolio/
├── index.html                    # App shell — HUD, overlays, nav iframe
├── src/
│   ├── main.js                   # Scene setup, controls, collision, click handling
│   └── style.css                 # Global styles and overlay components
├── public/
│   ├── severance_V23.glb         # Main 3D scene model
│   ├── top_row_permanent_V3.html # Navigation bar (loaded as iframe)
│   ├── project_page_vaccine.html # Project detail page (loaded as iframe)
│   ├── OCR-A-BT.ttf              # Monospace display font
│   └── icons.svg / favicon.svg
└── dist/                         # Vite build output
```

## Getting started

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview the production build
```

Requires Node.js 18+.

## Controls

| Input | Action |
|---|---|
| `W A S D` | Move forward / left / backward / right |
| Right-click + drag | Look around |
| Scroll | Pitch / yaw camera |
| Left-click | Interact with highlighted objects |
| `Escape` | Close any open overlay |
| `R` / `F` | Raise / lower eye height (dev only) |

## How it works

### Scene loading (`main.js`)

The GLB model is loaded via `GLTFLoader`. After load, the code:

1. **Collision filtering** — traverses all meshes and excludes thin geometry (rails, grids, cylinders below a size threshold) from the collidable set so the player doesn't get stuck on decorative detail.
2. **Spawn detection** — fires downward raycasts from five probe positions to find the first valid floor surface with enough vertical clearance, then positions the camera there.
3. **Clickable registration** — meshes whose name (or parent name) appears in the `CONTENT` map are added to the `clickables` array.

### Movement and collision

Each frame, the desired movement vector is tested against `collidables` with a short-range raycaster. On a hit, the movement is projected onto the wall surface normal (wall-sliding) and retested before applying. Head bobbing is layered on top via a sine wave that fades in/out with movement.

### Interactable objects (`CONTENT` map)

Objects are registered by mesh name in the `CONTENT` object at the top of `main.js`:

```js
const CONTENT = {
  'MeshName': {
    title: 'Display title',
    text:  'Description text shown in the info overlay.',
    image: '/optional-image.png',   // omit or leave empty to hide
  },
  'AnotherMesh': {
    title: 'Project name',
    url: '/project_page.html',      // opens the scaled iframe overlay instead
  },
}
```

A click on a registered mesh opens either:
- **Info overlay** — dark panel with title, optional image, and text.
- **Project overlay** — a scaled `<iframe>` at 66 % viewport size, pixel-perfect via CSS `transform: scale()`.

### Navigation bar

`top_row_permanent_V3.html` is embedded as a transparent `<iframe>` pinned to the top of the viewport. It contains a neumorphic pill-style nav with a 2D/3D view toggle and Craft / About / Contact links. The iframe approach keeps the nav CSS isolated from the Three.js canvas.

## Adding a new project

1. Create your project page HTML in `public/` (e.g. `public/my_project.html`).
2. Find the exact mesh name in the 3D model — check the browser console on click (`Geklickt → Mesh: ...`).
3. Add an entry to `CONTENT` in `src/main.js`:

```js
'YourMeshName': {
  title: 'My Project',
  url: '/my_project.html',
},
```

## Adjusting eye height

Press `R` / `F` at runtime to raise/lower `playerHeight`. The current value logs to the console — copy it and hardcode it in `main.js` at line 84:

```js
let playerHeight = -1.3601  // update this value
```

## Analytics

Umami Cloud (cookieless, no consent banner required). Loaded by `public/analytics.js`, which is
linked from `index.html` and every top-level `*2d.html` / `2D.html` page — **not** from the
`*3d.html` overlay documents or `top_row_permanent_V3.html`, which are iframes and would each
register their own pageview and session.

**Setup:** create the site in Umami, then replace `WEBSITE_ID` at the top of `public/analytics.js`
with the ID from Settings → Websites → Edit. Until that's done the script loads and no-ops.

Only `lucasmaher.com` reports. On localhost, `vite --host` and `*.github.io`, `window.track()`
logs to `console.debug` and no script is fetched — dev sessions never reach the dashboard.

Pageviews barely mean anything here: the 3D scene is one document, so walking around, opening
Craft and reading About counts as a single view. The custom events are the signal:

| Event | Props | Fired from |
|---|---|---|
| `scene_loaded` | `mobile`, `seconds` (bucket), `ms` | GLTF load callback, `src/main.js` |
| `scene_load_failed` | `mobile` | GLTF error callback |
| `webgl_failed` | `mobile`, `error` | Renderer construction — separates "couldn't run it" from a bounce |
| `project_open` | `project`, `via` (`3d-click` / `info-overlay` / `overlay`) | Canvas raycast click, `openOverlay`, `openKaffeemaschine` |
| `nav_open` | `panel` (`about` / `craft` / `contact` / `controls`) | The four overlay open functions |
| `mobile_menu_open` | — | `openMenu()` in `index.html` |

`project` is `CONTENT[name].title`, not the mesh name — Mac-Lamp alone spans six meshes, and the
dashboard should show one row per project.

## Collision tuning

Two thresholds control which meshes block movement (computed from the model's bounding box after load):

| Variable | Default | Effect |
|---|---|---|
| `thinThresh` | 4 % of model height | Excludes meshes thinner than this |
| `volThresh` | 0.005 % of model volume | Excludes meshes smaller than this volume |

Meshes with names containing `Grid`, `Rail`, or `Gitter` are always excluded.
