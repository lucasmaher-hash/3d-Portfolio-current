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
- `Roboto` (Google Fonts) — Unify typography-card labels
- `Nunito` (Google Fonts, weights 300/500/700/800) — Unify Typography-section preview text (the app's own typeface); imported on `unify2d.html`

## Languages / i18n

**Site is EN + DE only. French was removed entirely** (this was done deliberately):
- Nav (`top_row_permanent_V3.html`): `fr` button removed; `fr` dropped from `NAV_LANG`; any old stored `localStorage.lang === 'fr'` is coerced back to `'en'`.
- Every page's `TRANSLATIONS` object had its `fr:` block removed; `2D.html` also lost its `fr` `TITLES_BY_LANG` array.
- `applyLang` falls back to English for any unknown language, so nothing breaks. **Do NOT add French going forward.**
- New placeholder sections on Unify (color palette, typography, characters) and the whole rebuilt Virtual Cooking middle are **English-only, not yet wired into `TRANSLATIONS`** — wire them up when copy is finalized.

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

**Virtual Cooking (05)** — REBUILT (this session) from a new Figma reference. Middle sections were torn out and rebuilt; hero, header and project nav were kept. Text is all `[ Placeholder ]` pending real copy (English only, not yet in `TRANSLATIONS`).
1. **Hero** — full-width 16:10 image, now `side_v1_final_V1.png` (also used for the VC card on `2D.html`)
2. **Header** — breadcrumb + OCR-A-BT title + dotted divider
3. **At a Glance** — heading + big light lead paragraph (`.glance-lead`), sits ABOVE the meta grid
4. **Meta grid** — Timeline (May 2026 → Jul 2026), Team (Just Me), Role (Idea & Concept Designer), Tools (Blender / Three.js / HTML-CSS-JS / Vibe Coding)
5. **Identifying the problem** (step 0) — heading + dotted divider + 2 paragraphs
6. **Design process** (step 1) — `.stagger-list` of 3 transparent silver-panel renders (`Panel_Left.png` / `Panel_Right.png` / `Stopwatch.png`) in a STAGGERED layout (`.stagger-row` / `.right` / `.indent`, text beside each), then two `.process-shot` screenshots (`blender-modeling.png` shift-right, `app-preview.png` shift-left — caption ABOVE image, constrained width, staggered offsets)
7. **Final result** — heading + `5 STEPS · MODELING → RENDER` meta + dotted divider; two demo subheads (`.result-subhead`): "Instruction manual" (`manual_click_V2.mov` + caption), then "Timer & ingredients" in the order **heading → `.result-image-pair` (`back_final_V2.jpg`, `timer_click_V1.jpg`) → caption → `timer_V1.mov`**. The image pair sits directly under the *Timer & ingredients* heading, not under the Instruction-manual video where it originally lived.
8. **Project nav** — Cybercoffee (prev) / Unify (next)

Note: the old "single-track centered" VC layout (glance bullets, Overview/Concept, reflection sections, breakout image) no longer exists. Leftover unused CSS remains (`.breakout-media`, `.glance-list`).

**Unify (06)** — Extended blob hero + design-story sections + scroll-driven dual-video sections. **All copy is now filled (EN+DE for meta/overview/features; English-only for the new design-story sections).**
1. **Hero blob** (CUSTOM) — Large pink blob; pupils track cursor; sits above dotted divider (z-index: 3). Now horizontally centered at the 2/3 mark (`left: 66.667%; transform: translateX(-50%)`), drops in with a bounce on load (`blobDrop` keyframes), and scales 35% larger on true widescreen.
2. **Header + breadcrumb** — bottom-left of hero + dotted divider
3. **At a Glance** — overview paragraph (the app's origin/concept)
4. **Meta grid** — Timeline (Feb 2025 / Jun 2025), Team (Me / Sophie Meyer / Moritz Ackermann), Role (Concept, design, prototyping & vibe coding), Skills (Figma / UX research / Vibe coding). Multi-line values use `<br>` via `data-i18n-html`.
5. **Design story sections** (NEW this session, between meta and features):
   - **Design Process** — "Choosing the right colorpalette" + 3 color boxes (FF88C8 / F9F2EB / 1A1A1A, hex inside box)
   - **Typography** — 3 fully-rounded pills; preview text in **Nunito** (Header/Body/Info weights), left label+spec on one line with `·`
   - **Character based design** — 3 characters (`/images/unify/characters/char-arch.svg`, `char-bird.svg`, `char-mountain.svg` — flattened Figma exports) in a STAGGERED layout with an organic idle float animation; fluid centering (see gotchas)
   - **Final Product** header — has a `border-top` divider above it
6. **Feature 1: Home** — single video + text
7. **Features (scrolly A) — Timetable + Socials** (`#timetable-socials-scrolly`): text LEFT, videos RIGHT
8. **Features (scrolly B) — Friends + Navigation** (`#nav-friends-scrolly`): videos LEFT, text RIGHT
9. **Feature 6: Settings** — single video + text (reversed grid)
10. **Project nav** — Virtual Cooking (prev) / Double Packaging (next)

**Feature numbering / data-key mismatch (IMPORTANT):** displayed scroll order is 1 Home, 2 Timetable, 3 Socials, 4 Friends, 5 Navigation, 6 Settings. But internal i18n keys keep old names: display **3 Socials** = key `feat-socials-*`, **4 Friends** = key `feat-friends-*`, **5 Navigation** = key `feat-courses-*`. In `#nav-friends-scrolly` the **Friends** video/panel is now FIRST (is-active) and **Navigation** second, so scroll order reads 4→5. Titles: Home="Your Day at a Glance", Timetable="Your Timetable, and Everyone's", Socials="Beyond the Group Chat", Friends="Find Your Friends Indoors", Navigation="Find the Right Room", Settings="Profile & Friends".

**Page background colors**:
- **All 2D pages, Unify included: `#DCDCE3` (`--bg-surface`).**
- Unify used to be `#D8D7DC`, matched to the grey baked into the phone videos so no seam showed at the video edges. That constraint is **gone** — the videos are now clipped to the phone bezel with `clip-path` (see "Unify Page: Video Details"), so the page background is free to be any colour.

## Assets

Organized by project for clarity:

**Images** (`/public/images/`):
- `about/` — About page hero
- `mac-lamp/` — Mac-Lamp project images & diashow frames
- `portfolio/` — This Website project screenshots
- `vaccine/` — Double Packaging renders & process steps
- `vr-cookbook/` — Virtual Cooking assets: `side_v1_final_V1.png` (hero + card), `back_final_V2.jpg`, `timer_click_V1.jpg`, silver panel renders `Panel_Left.png` / `Panel_Right.png` / `Stopwatch.png` (transparent bg), and process screenshots `blender-modeling.png` + `app-preview.png` (⚠️ renamed from Figma exports that had spaces in the filename — keep filenames URL-safe)
- `unify/characters/` — `char-arch.svg`, `char-bird.svg`, `char-mountain.svg` (flattened, transparent-bg character exports)
- `site/` — favicon and shared UI assets

**Videos** (`/public/videos/`):
- `kaffeemaschine/` — Cybercoffee interface demo
- `mac-lamp/` — Mac-Lamp diashow video clips
- `vaccine/` — Double Packaging render video
- `vr-cookbook/` — Virtual Cooking demo clips (swipe, click, timer)
- `unify/` — Unify app screen recordings (portrait phone videos; each still has `#D8D7DC` baked in around the phone — the files are untouched, the grey is hidden with CSS `clip-path`, not removed)

**Other**:
- `/public/kaffeemaschine/kaffeemaschine.html` — Interactive coffee machine app (⚠️ missing from disk; needs restore)
- `/public/severance_V23.glb` — 3D model used in the Three.js scene
- `/public/OCR-A-BT.ttf` — custom monospace font

## Current Status & Missing / TBD

**Unify page (06):**
- ✅ Hero blob (pupil tracking, 2/3 centering, bounce-in, widescreen scaling)
- ✅ Scroll-driven dual-video scrollytelling; mobile fallback at ≤860px
- ✅ NEW design-story sections (Design Process/colors, Typography, Character design, Final Product)
- ✅ Meta tiles filled (Timeline/Team/Role/Skills)
- ✅ All 6 feature copy filled (EN+DE); titles updated
- ⏳ Design-story section copy (colors/typography/characters) is English-only, not yet in `TRANSLATIONS` (DE pending)

**Virtual Cooking (05):**
- ✅ Rebuilt middle from new Figma (see layout above)
- ⏳ All body text is `[ Placeholder ]` — real copy + DE translations pending
- Leftover unused CSS: `.breakout-media`, `.glance-list`

**Kaffeemaschine app** (`public/kaffeemaschine/kaffeemaschine.html`):
- ❌ **Missing from disk** — was deleted during asset cleanup
- Needs restoration from backup; `kaffeemaschine2d.html` embeds it as an iframe

**3D mode:**
- Index.html and Three.js scene stable; no recent changes

## Recent Changes (This Session)

1. **French removed site-wide** — see "Languages / i18n" section. EN + DE only now.

2. **Unify — new design-story sections** (between meta grid and Feature 1): Design Process + color palette, Typography (Nunito pills), Character based design (3 staggered SVG characters w/ idle float), Final Product header (with `border-top` divider). Characters extracted from Figma → `/images/unify/characters/*.svg`.

3. **Unify — all copy filled** (project context supplied by user): overview, color/typography/character text, all 6 feature copy (EN+DE), meta tiles. Feature titles rewritten. Features renumbered to scroll order 1–6; Friends/Navigation swapped in `#nav-friends-scrolly` (see feature-numbering note in the Unify layout section).

4. **Unify hero blob** — centered at 2/3 (`left: 66.667%` + `translateX(-50%)`), bounce-in on load (`blobDrop`), 35% larger + more hero height on true widescreen.

5. **Unify character centering** — fluid, no breakpoint: `.character-list { width: calc(520px + 40vw); max-width: 100%; margin-inline: auto }` — full-width on MacBook, progressively centers on wider screens. (Tune the `520px` base to move figures in/out.)

6. **Virtual Cooking — full middle rebuild** from new Figma (see layout section). Hero image → `side_v1_final_V1.png` (also the VC card on `2D.html`).

7. **Nav Craft dropdown** (`top_row_permanent_V3.html`) — items darkened to solid `#111114` (was `white` + `mix-blend-mode: difference`, which read faint/variable); hover → accent orange.

8. **`2D.html` divider fix** — `.project-section` `clip-path` changed `inset(0)` → `inset(0 0 -1px 0)` so the 1px `border-bottom` project dividers stop getting clipped away at fractional pixel heights (line between Project 02/03 was disappearing).

9. **Unify — video backgrounds clipped away** — all 6 phone videos now clipped to the phone bezel via per-file `clip-path` (see "Unify Page: Video Details"). The video files are unchanged; this is render-time only. Removed the long-standing constraint that the page background had to match the videos' baked-in grey.

10. **Unify — page background unified** — `body` background `#D8D7DC` → `var(--bg-surface)` (`#DCDCE3`), so Unify now matches every other 2D page. Only possible because of change 9.

11. **Virtual Cooking — Final result reordered** — the `.result-image-pair` moved out from under "Instruction manual" to sit directly beneath the "Timer & ingredients" heading; that block now reads heading → images → caption → video.

## Tips for Next Session

- **Always test the dropdown** before claiming work is done. Open 2D.html, hover Craft, check that project titles aren't cut off.
- **Check both desktop and mobile** (860px breakpoint). Scrollytelling has different behavior on each.
- **Video playback:** If videos don't autoplay, check browser autoplay policies. Muted + playsinline should bypass restrictions.
- **Color sampling:** Use Digital Color Meter (macOS, Apple App Store) in sRGB mode to sample exact colors if you need to match video backgrounds or adjust shadows. Note that matching the page to the Unify video grey is **no longer necessary** — see the `clip-path` approach in "Unify Page: Video Details".
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

**Source dimensions** (portrait; `mdls` prints Height before Width — easy to misread as landscape):

| File | Size |
|---|---|
| `homepage.mov` | 685 × 1400 |
| `timetable.mov` / `socials.mov` / `map-friends.mov` | 672 × 1382 |
| `settings.mov` | 672 × 1370 |
| `map-courses.mov` | 614 × 1250 (framed tighter than the rest) |

### Background removal — `clip-path`, not re-encoding

Every `.mov` has `#D8D7DC` (RGB 216,215,220) baked in as the app-UI background, filling the thin margin and the four corners around the phone. **The files are untouched.** The grey is hidden by clipping each `<video>` to the phone's rounded bezel in CSS:

```css
.feature-media video,
.scrolly-vid video {
  clip-path: inset(1.01% 1.79% 0.72% 1.79% round 15.8% / 7.7%);
}
```

Per-file overrides, because the phone sits slightly differently in each recording:

| Video | Selector | `clip-path: inset(...)` |
|---|---|---|
| default (timetable, socials, map-friends) | `.feature-media video, .scrolly-vid video` | `1.01% 1.79% 0.72% 1.79% round 15.8% / 7.7%` |
| homepage | `video[data-vid="homepage"]` | `0.50% 1.46% 0.29% 1.75% round 15.9% / 7.8%` |
| settings | `video[data-vid="settings"]` | `0.44% 1.79% 0.44% 1.79% round 15.8% / 7.7%` |
| map-courses | `#nav-friends-scrolly .scrolly-vid[data-step="courses"] video` | `1.04% 1.95% 0.30% 2.44% round 16.3% / 8.0%` |

The two standalone videos carry `data-vid="homepage"` / `data-vid="settings"` attributes purely so they can be targeted individually.

**Two-value radius is required.** `round 15.8% / 7.7%` states the same pixel radius twice — once against width, once against height. A single percentage resolves horizontally against width and vertically against height, which on a tall phone stretches the corners into ellipses. If you re-measure, recompute both.

**Re-measuring:** `qlmanage -t -s 1400 -o . <file>.mov` produces a PNG frame; find the first non-background pixel along the middle row/column for the insets, and the row where the left edge reaches its final x for the corner radius.

**Superseded:** `map-courses.mov` previously used `clip-path: inset(0 0 3px 0)` to crop an unwanted bottom line. That crop is now folded into its full inset above — don't re-add it.

**Transparent video files are NOT worth it for this site.** `.mov`/H.264 can't carry an alpha channel; real transparency needs WebM/VP9 (Chrome/Firefox) *plus* HEVC-with-alpha (Safari) — 12 files to replace 6, with quality loss. Only go there if the videos are needed outside the website. Requires `ffmpeg`, which is **not installed** on this machine.

## Known Patterns & Gotchas

- **`clip-path: inset(0 0 -1px 0)` on `.project-section`** in `2D.html` — clips top/left/right to contain the neumorphic tile shadows, but the bottom edge is relaxed by 1px so the `border-bottom` divider is never clipped off at fractional device-pixel heights (was `inset(0)`, which intermittently ate the dividers)
- **Widescreen-only tweaks — use the fraction ratio syntax:** `@media (min-width: 1600px) and (min-aspect-ratio: 17/10)`. **`min-aspect-ratio: 1.7` (decimal) is silently ignored by Safari** — always write it as `17/10` (or `16/10`). MacBook screens are ~1.54 aspect, so `17/10` (1.7) targets 16:9 monitors; `16/10` (1.6) also catches 16:10 monitors. For "center on wide, unchanged on MacBook" prefer a **fluid `calc()` width** over a breakpoint (see Unify `.character-list`) — it needs no media query and can't mis-match.
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
- **i18n on Unify:** Meta tiles + feature copy are filled (EN+DE) in the `TRANSLATIONS` object at the bottom of `unify2d.html`. The newer design-story sections (colors/typography/characters) are plain English in the HTML, not yet keyed into `TRANSLATIONS`. **EN + DE only — no French.**
- **Virtual Cooking layout:** rebuilt (this session) — At a Glance lead + meta grid + Identifying the problem + Design process (staggered `.stagger-*` panels + `.process-shot` screenshots) + Final result. All text is `[ Placeholder ]`. Reuses `.guide-section` / `.guide-media` classes.
