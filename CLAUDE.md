# CLAUDE.md

Lucas Maher's portfolio website — vanilla JS + Vite, neumorphic design system, Three.js 3D mode.

## Quick Start

```bash
# Install dependencies (first time only)
npm install

# Start dev server (local testing)
npm run dev
# Opens at http://localhost:5173 — hot-reload enabled

# Build for production
npm run build

# Preview production build locally
npm run preview
```

**No test runner or linter is configured.** All testing is manual.

## Session Startup Checklist

When resuming work in a new session:
1. `npm run dev` — start the dev server
2. Open http://localhost:5173 in browser
3. Test both 2D and 3D modes (toggle in nav or mobile menu)
4. Verify video playback on Unify page (steps 2–6 have portrait phone videos)
5. Check nav dropdown doesn't clip content on any page (iframe z-index and `.page-wrapper overflow` issues)
6. Inspect hero blob on Unify page — pupils should track cursor; blob should sit above header dotted line
7. Test mobile responsiveness at 860px breakpoint (scrollytelling switches from sticky pin to static layout)

## Architecture

**Vanilla JS, no framework.** Vite bundles `src/main.js` and `src/style.css`. Everything else lives in `public/` as static assets.

**Two modes:**
- **3D mode** — Three.js scene (`src/main.js` → `index.html`). 3D pages: `public/*3d.html`
- **2D mode** — Neumorphic flat design. All 2D pages: `public/*2d.html`. Landing: `public/2D.html`

**Navigation:**
- Every 2D page embeds nav as a fixed iframe (`#top-bar` → `/top_row_permanent_V3.html`)
- Iframe height: 90px default, expands to **400px** when Craft dropdown opens (via `postMessage`)
- Always `z-index: 9999` to sit above all page content
- **Critical:** Host page `.page-wrapper` must have `overflow: visible` (not `hidden`), else dropdown gets clipped
- **Dropdown expand height:** Increased from 280px to 400px to ensure full dropdown visibility without clipping

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

**Unify (06)** — Extended blob hero + scroll-driven dual-video sections:
1. **Hero blob** (CUSTOM) — Large pink blob extends off top of page; pupils track cursor; sits above dotted divider (z-index: 3)
2. **Header + breadcrumb** — Sits bottom-left of hero; includes dotted divider
3. **Meta grid** — 4 neumorphic tiles (Timeline/Team/Role/Skills — all `[ ... ]` placeholders)
4. **At a Glance** — Quick summary paragraph
5. **Feature 1: Home** — Standard single video + text (left-aligned)
6. **Features 2 & 5: Timetable + Socials** — SCROLL-DRIVEN DUAL-VIDEO section:
   - Layout: text LEFT, videos RIGHT (mirrored from steps 3&4)
   - Two videos side-by-side; one is full-size, one is 40% smaller
   - Scroll or click to toggle which is active; inactive video pauses
   - Video heights: active = `clamp(442px, 62.4vh, 676px)`; inactive = 60% of that
   - Mobile (≤860px): stacks vertically, both videos same size, both panels visible
7. **Features 3 & 4: Navigation + Friends** — SCROLL-DRIVEN DUAL-VIDEO section:
   - Layout: videos LEFT, text RIGHT (original layout)
   - Same scroll/click toggle behavior as steps 2&5
8. **Feature 6: Settings** — Standard single video + text (right-aligned, reversed grid)
9. **Project nav** — Links to Virtual Cooking (prev) and Double Packaging (next)

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

## Current Status & Missing / TBD

**Unify page (06):**
- ✅ Hero blob with pupil tracking
- ✅ Scroll-driven dual-video scrollytelling for steps 2&5 (text left, videos right) and 3&4 (videos left, text right)
- ✅ Mobile-responsive fallback (sticky pin → static layout at ≤860px)
- ⏳ Meta tiles: Timeline, Team, Role, Skills — all `[ ... ]` placeholders
- ⏳ Feature copy: all `[ Placeholder ]` markers; fill via TRANSLATIONS object (EN/DE/FR)

**Kaffeemaschine app** (`public/kaffeemaschine/kaffeemaschine.html`):
- ❌ **Missing from disk** — was deleted during asset cleanup
- Needs restoration from backup; `kaffeemaschine2d.html` embeds it as an iframe

**Virtual Cooking (05):**
- Current English text is draft; edit for tone/accuracy
- Layout is finalized; asset files stable

**3D mode:**
- Index.html and Three.js scene stable
- No recent changes

## Recent Changes (Last Session)

1. **Unify hero blob**
   - Created extended pink blob (Figma export) that bleeds off top of page
   - Implemented cursor-tracking pupils with SVG coordinate transforms
   - Positioned absolutely above page frame; z-index: 3 ensures it sits above header divider

2. **Scroll-driven scrollytelling**
   - Implemented two dual-video sections with scroll-triggered state toggles
   - Videos at 40% size when inactive; enlarge to full size when active
   - Only active video plays; inactive pauses to prevent audio overlap
   - Click a video to scroll-jump to that step; smooth scroll triggers toggle via scroll listener
   - Mobile fallback: stacks vertically, disables sticky pin, shows both panels

3. **Layout mirroring**
   - Steps 2&5 (Timetable/Socials): text LEFT, videos RIGHT (flex-direction: row-reverse)
   - Steps 3&4 (Navigation/Friends): videos LEFT, text RIGHT (original order)

4. **Video crop**
   - Step 3 (map-courses.mov): cropped bottom 3px via clip-path to remove unwanted line

5. **Dropdown fixes** (applied to all 9 2D pages)
   - `.page-wrapper` overflow changed from `hidden` to `visible`
   - Iframe expand height increased from 280px → 400px to give dropdown room
   - `z-index: #top-bar` increased from 10 → 9999 to sit above all content
   - Ensures nav dropdown displays fully without clipping

## Tips for Next Session

- **Always test the dropdown** before claiming work is done. Open 2D.html, hover Craft, check that project titles aren't cut off.
- **Check both desktop and mobile** (860px breakpoint). Scrollytelling has different behavior on each.
- **Video playback:** If videos don't autoplay, check browser autoplay policies. Muted + playsinline should bypass restrictions.
- **Color sampling:** Use Digital Color Meter (macOS, Apple App Store) in sRGB mode to sample exact colors if you need to match video backgrounds or adjust shadows.
- **SVG coordinates:** The blob's pupil positions come from Figma. If you re-export the blob, update: eye centers (ex, ey), pupil rest positions (rx, ry), and MAX travel distance in the tracking JS.
- **Sticky positioning fragile:** Root-level `overflow-x: hidden` breaks sticky pins. Use `clip` instead. Page-wrapper `overflow: visible` needed for dropdown; use `clip-path` on child sections for shadow boundaries.
- **i18n:** All text strings on Unify are in the `TRANSLATIONS` object (bottom of `unify2d.html`). Add new keys there; reference via `data-i18n` or `data-i18n-html` attributes in HTML.

## Unify Page: Hero Blob Implementation

**SVG Blob** (exported from Figma, sits in `<div class="hero-blob">` inside `.hero-top`):
- Large pink shape (#FF88C8) with two white circles (eyes) and two dark pupils
- SVG viewBox: `"-10 -65 760 830"` — allows head to bleed off top edge
- Positioned absolute: `top: clamp(-85px, -6vw, -50px); right: clamp(-10px, 2vw, 48px);`
- Height: `clamp(440px, 50vw, 680px)`; width: `auto` (maintains aspect ratio)
- **Z-index: 3** — sits above header (z-index: 2) so blob appears above dotted divider line

**Pupil Tracking** (JavaScript at bottom of `unify2d.html`):
- Listens for `pointermove` events; converts client coords to SVG space via `getScreenCTM()`
- Each pupil (id: `unify-pupil-l` / `unify-pupil-r`) constrained within its eye circle
- Max travel: 108px from eye center (prevents pupils escaping white areas)
- Smooth follow: 0.18 easing factor per frame (requestAnimationFrame loop)
- **Edge case:** When pointer leaves window, pupils ease back to rest position

**Hero Section CSS:**
```css
.hero-top {
  position: relative;
  padding: 0 clamp(40px, 8vw, 80px);
  min-height: clamp(400px, 44vw, 620px);
  display: flex;
  align-items: flex-end;
}

.page-wrapper {
  overflow: visible;  /* CRITICAL: allows blob to bleed past top border */
}

/* At root level: */
html { overflow-x: clip; }  /* Not 'hidden' — clip allows sticky positioning */
```

## Unify Page: Scroll-Driven Dual-Video Sections (Scrollytelling)

**HTML Structure** (two sections with identical pattern):
```html
<section class="scrolly" id="timetable-socials-scrolly">  <!-- Steps 2 & 5 -->
  <div class="scrolly-sticky">
    <div class="scrolly-media">
      <div class="scrolly-vid is-active" data-step="timetable"> ... </div>
      <div class="scrolly-vid" data-step="socials"> ... </div>
    </div>
    <div class="scrolly-copy">
      <div class="scrolly-panel is-active" data-step="timetable"> ... </div>
      <div class="scrolly-panel" data-step="socials"> ... </div>
    </div>
  </div>
</section>

<section class="scrolly" id="nav-friends-scrolly">  <!-- Steps 3 & 4 -->
  <!-- Same structure, different data-step values: "courses" / "friends" -->
</section>
```

**CSS Details:**
```css
.scrolly {
  position: relative;
  height: 175vh;  /* Tall spacer: allows ~75vh of scroll "room" before/after sticky pin */
}

.scrolly-sticky {
  position: sticky;
  top: 12vh;  /* Sits 12vh from top; leaves room for nav + breathing space */
  height: 76vh;
  display: flex;
  align-items: center;
  gap: clamp(28px, 5vw, 64px);
  padding: 0 clamp(40px, 8vw, 80px);
}

/* Only #timetable-socials-scrolly mirrors layout (text LEFT, videos RIGHT) */
#timetable-socials-scrolly .scrolly-sticky {
  flex-direction: row-reverse;
}
#timetable-socials-scrolly .scrolly-media {
  margin-right: 50px;  /* Nudge videos toward center from the right */
}

/* #nav-friends-scrolly keeps original order (videos LEFT, text RIGHT) */
#nav-friends-scrolly .scrolly-media {
  margin-left: 50px;  /* Nudge videos toward center from the left */
}

.scrolly-vid video {
  height: calc(clamp(442px, 62.4vh, 676px) * 0.6);  /* Inactive: 40% smaller */
  transition: height 480ms cubic-bezier(0.4, 0, 0.2, 1);
}
.scrolly-vid.is-active video {
  height: clamp(442px, 62.4vh, 676px);  /* Active: full size, matches other videos */
}

.scrolly-copy {
  flex: 1 1 auto;
  align-self: center;
}

.scrolly-panel {
  position: absolute;
  top: 50%;
  left: 0; right: 0;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 350ms ease;
  pointer-events: none;
}
.scrolly-panel.is-active {
  opacity: 1;
  pointer-events: auto;
}
```

**JavaScript Behavior** (`initScrolly()` function runs on both `.scrolly` sections):
1. Measures scroll progress as fraction of section height (0 to 1)
2. At midpoint (0.5), toggles active video/panel to the second step
3. Only active video plays; inactive pauses (prevents audio overlap)
4. Click a video → smooth scroll to position (0.15 or 0.85 of section) that triggers the toggle
5. Throttled with `requestAnimationFrame` to avoid excessive updates

**Mobile fallback** (≤860px breakpoint):
- `.scrolly` height → `auto` (no tall spacer)
- `.scrolly-sticky` → `position: static` (no sticky pin); `flex-direction: column` (stack vertically)
- Both videos same height; both panels visible; no toggle behavior
- Useful on small screens where scroll range is too small to trigger transitions

## Unify Page: Video Details

**Video files** (all in `/public/videos/unify/`):
- `homepage.mov` — Feature 1 (Home)
- `timetable.mov` — Feature 2 (Timetable, scrolly section)
- `map-courses.mov` — Feature 3 (Navigation, scrolly section)
- `map-friends.mov` — Feature 4 (Friends, scrolly section)
- `socials.mov` — Feature 5 (Socials, scrolly section)
- `settings.mov` — Feature 6 (Settings)

**Critical:** All video filenames use hyphens (not spaces). `<source>` URLs break with spaces.

**Background color:** All Unify videos embed `#D8D7DC` (RGB 216,215,220) as their app UI background. Page background matches exactly to eliminate seams at video edges. ⚠️ If colors drift, use Digital Color Meter (macOS) in sRGB mode to sample.

**Crop note:** Step 3 (map-courses.mov) has bottom 3px cropped via `clip-path: inset(0 0 3px 0)` to remove an unwanted line.

## Known Patterns & Gotchas

- **`clip-path: inset(0)` on `.project-section`** in `2D.html` — prevents neumorphic white box-shadow highlight from bleeding across borders
- **`minmax(0, 1fr)` in CSS grid** — required when a column holds long OCR-A-BT titles; otherwise title overflows and crushes the other column
- **`position: fixed` inside iframes clipped to iframe viewport** — why Craft dropdown uses `postMessage` to expand iframe instead of relying on `overflow: visible` alone
- **Scroll-hide nav** — every 2D page adds/removes `.hide` on `#top-bar` based on scroll direction (250px down threshold / 180px up threshold)
- **Video filenames must be URL-safe** — no spaces; use hyphens (e.g., `map-courses.mov` not `map courses.mov`)
- **Z-index stack** (top to bottom):
  - `z-index: 9999` — #top-bar (nav iframe; all 2D pages)
  - `z-index: 3` — .hero-blob (sits above header/divider on Unify)
  - `z-index: 2` — .hero-header (breadcrumb, title, divider on Unify)
  - `z-index: 200` — .mobile-menu (mobile overlay)
  - `z-index: auto` (0) — page content, project grid
- **Overflow handling:**
  - `.page-wrapper` must be `overflow: visible` (not `hidden`) so nav dropdown doesn't get clipped
  - Root `html` must be `overflow-x: clip` (not `hidden`) so sticky positioning doesn't break
  - `.project-section` uses `clip-path: inset(0)` to prevent shadow bleed without breaking stickiness
- **i18n on Unify:** Meta tiles and feature copy are placeholders (`[ ... ]`). Edit via `TRANSLATIONS` object at bottom of `unify2d.html` (EN/DE/FR)
- **Virtual Cooking layout:** Uses `.guide-section` (standard padding) for centered single-track layout, not a custom narrower wrapper
