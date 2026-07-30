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
3. Test both 2D and 3D modes (toggle in nav or mobile menu); in 3D, confirm both right-click-drag and middle-click-drag orbit the camera
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
- Iframe height: **140px** default/collapsed, expands to **400px** when Craft dropdown opens (via `postMessage`)
- Always `z-index: 9999` to sit above all page content
- **Critical:** Host page `.page-wrapper` must have `overflow: visible` (not `hidden`), else dropdown gets clipped
- **Dropdown expand height:** Increased from 280px to 400px to ensure full dropdown visibility without clipping
- **Collapse height must match the default (140px), not shrink to 90px.** See "Nav bar iframe" below — this was a live bug (nav bottom shadow got clipped after the Craft dropdown closed) fixed this session.

## Page map

| File | What it is |
|---|---|
| `index.html` | 3D entry point (Three.js scene) |
| `public/2D.html` | 2D landing page — project grid (5 projects) |
| `public/about2d.html` | About page |
| `public/contact2d.html` | Contact page |
| `public/unify2d.html` | Project page — Unify (01) |
| `public/virtual_cooking2d.html` | Project page — Virtual Cooking (02) |
| `public/kaffeemaschine2d.html` | Project page — Cybercoffee (03) |
| `public/mac-lamp2d.html` | Project page — Mac-Lamp (04) |
| `public/vaccine2d.html` | Project page — Double Packaging (05) |
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
  width: 100%; height: 140px;   /* default — enough to hold the nav pill's bottom shadow uncropped */
  border: none; z-index: 9999;
  background: transparent; overflow: visible;
  transition: transform 300ms ease;
}
#top-bar.hide { transform: translateY(-220px); }
```

**Why 140px default / 400px on dropdown open:**
The iframe blocks pointer events across its full height. The nav pill itself sits ~24px down and is ~64px tall, but its neumorphic box-shadow needs roughly another 17px of room below it — 140px is the smallest height that doesn't crop that shadow. When the Craft dropdown opens, the nav sends a `postMessage` and the parent expands the iframe to 400px to give the dropdown room:

```js
// In top_row_permanent_V3.html (show/hide functions):
window.parent.postMessage({ type: 'nav-expand' }, '*');
window.parent.postMessage({ type: 'nav-collapse' }, '*');

// In every host page:
window.addEventListener('message', function(e) {
  if (e.data.type === 'nav-expand') topBar.style.height = '400px';
  if (e.data.type === 'nav-collapse') topBar.style.height = '140px';   // must match the default, NOT 90px
});
```

**Bug fixed this session:** `nav-collapse` used to shrink the iframe to 90px (a stale value from an older, shorter iframe convention). At 90px the nav pill's bottom shadow gets clipped by the iframe's own bounding box — so the shadow looked fine on page load, then visibly lost its bottom edge the first time you hovered Craft and moved away. Fixed on all 9 host pages (`2D.html`, `about2d.html`, `contact2d.html`, `kaffeemaschine2d.html`, `mac-lamp2d.html`, `portfolio2d.html`, `vaccine2d.html`, `unify2d.html`, `virtual_cooking2d.html`) by changing the `nav-collapse` handler's target height from `90px` to `140px`.

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

**Standard pattern** (kaffeemaschine — vaccine and mac-lamp have since diverged, see below; portfolio2d.html, the page this pattern was originally shared with, was removed — see "Recent Changes"):
1. **Hero** — full-width image or split layout
2. **Header section** — breadcrumb, OCR-A-BT title, blinking orange dot, dotted divider
3. **Meta grid** — 4 neumorphic tiles (Timeline, Team, Role, Tools)
4. **Overview / Concept** — multi-column section with image + text
5. **Process** — step tiles (numbered cards with images/text)
6. **Project nav** — bottom bar linking to next project

**The current shared pattern** (mac-lamp, vaccine, virtual-cooking all follow this now; Unify is a variant of it):
1. Hero
2. Header (breadcrumb, title, dotted divider)
3. **At a Glance** — `.guide-section` with heading + `.glance-lead` paragraph, no bottom border, sits directly above the meta grid
4. Meta grid
5. Overview/Concept and/or Process — built from a shared set of ported classes: `.guide-section` (padded/bordered wrapper), `.guide-text` (plain paragraph), `.guide-media` (image/video card), `.stagger-row` / `.stagger-row.right` (portrait or near-square figure + text beside, alternating sides), `.process-shot.shift-right` / `.shift-left` (landscape still, caption above, alternating horizontal offset). A `.process-steps` / `.stagger-list` wrapper applies fluid-width centering (`width: calc(520px + 40vw); max-width: 100%; margin: auto`) so alternating blocks stay pulled together on ultra-wide monitors instead of sprawling to opposite edges.
6. Project nav

**Mac-Lamp (04)** — rebuilt this session (see "Recent Changes"):
1. Hero (image)
2. Header
3. At a Glance (placeholder)
4. Meta grid
5. **Process** (badge 0) — `1.png` + `2.MOV` as alternating `.process-shot` blocks, then `3.MOV`/`4.MOV` as a **scroll-driven dual-video pair** (`.lamp-scrolly*`, ported from Unify's `.scrolly` mechanism — sticky pin, scroll/click swaps active video, mirrored text-left/videos-right layout)
6. **Overview / Concept** (badge 1) — heading + real copy, then the full-width photo diashow/gallery (`5.jpg`–`9.jpg`, `aspect-ratio: 4/3`, `object-fit: contain`)
7. Project nav

**Double Packaging (05)** — rebuilt this session (see "Recent Changes"):
1. Hero (video)
2. Header
3. At a Glance (placeholder)
4. Meta grid
5. **Overview / Concept** (badge 0) — real copy, plain `.guide-text`
6. **Process** (no badge, `.process-sub` meta "5 Steps · Modeling → Render") — 5 alternating blocks in original order, natural image aspect ratios, no per-step badges
7. Project nav (no "next" — this is the last project in the list; see item 24 in "Recent Changes" for the current project order)

**Virtual Cooking (02)** — REBUILT (this session) from a new Figma reference. Middle sections were torn out and rebuilt; hero, header and project nav were kept. Text is all `[ Placeholder ]` pending real copy (English only, not yet in `TRANSLATIONS`).
1. **Hero** — full-width 16:10 image, now `side_v1_final_V1.png` (also used for the VC card on `2D.html`)
2. **Header** — breadcrumb + OCR-A-BT title + dotted divider
3. **At a Glance** — heading + big light lead paragraph (`.glance-lead`), sits ABOVE the meta grid
4. **Meta grid** — Timeline (May 2026 → Jul 2026), Team (Just Me), Role (Idea & Concept Designer), Tools (Blender / Three.js / HTML-CSS-JS / Vibe Coding)
5. **Identifying the problem** (step 0) — heading + dotted divider + 2 paragraphs
6. **Design process** (step 1) — `.stagger-list` of 3 transparent silver-panel renders (`Panel_Left.png` / `Panel_Right.png` / `Stopwatch.png`) in a STAGGERED layout (`.stagger-row` / `.right` / `.indent`, text beside each), then two `.process-shot` screenshots (`blender-modeling.png` shift-right, `app-preview.png` shift-left — caption ABOVE image, constrained width, staggered offsets)
7. **Final result** — heading + `5 STEPS · MODELING → RENDER` meta + dotted divider; two demo subheads (`.result-subhead`): "Instruction manual" (`manual_click_V2.mov` + caption), then "Timer & ingredients" in the order **heading → `.result-image-pair` (`back_final_V2.jpg`, `timer_click_V1.jpg`) → caption → `timer_V1.mov`**. The image pair sits directly under the *Timer & ingredients* heading, not under the Instruction-manual video where it originally lived.
8. **Project nav** — Unify (prev) / Cybercoffee (next)

Note: the old "single-track centered" VC layout (glance bullets, Overview/Concept, reflection sections, breakout image) no longer exists. Leftover unused CSS remains (`.breakout-media`, `.glance-list`).

**Unify (01)** — Extended blob hero + design-story sections + scroll-driven dual-video sections. **All copy is now filled (EN+DE for meta/overview/features; English-only for the new design-story sections).**
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
10. **Project nav** — (no "previous" — this is the first project in the list) / Virtual Cooking (next)

**Feature numbering / data-key mismatch (IMPORTANT):** displayed scroll order is 1 Home, 2 Timetable, 3 Socials, 4 Friends, 5 Navigation, 6 Settings. But internal i18n keys keep old names: display **3 Socials** = key `feat-socials-*`, **4 Friends** = key `feat-friends-*`, **5 Navigation** = key `feat-courses-*`. In `#nav-friends-scrolly` the **Friends** video/panel is now FIRST (is-active) and **Navigation** second, so scroll order reads 4→5. Titles: Home="Your Day at a Glance", Timetable="Your Timetable, and Everyone's", Socials="Beyond the Group Chat", Friends="Find Your Friends Indoors", Navigation="Find the Right Room", Settings="Profile & Friends".

**Page background colors**:
- **All 2D pages, Unify included: `#DCDCE3` (`--bg-surface`).**
- Unify used to be `#D8D7DC`, matched to the grey baked into the phone videos so no seam showed at the video edges. That constraint is **gone** — the videos are now clipped to the phone bezel with `clip-path` (see "Unify Page: Video Details"), so the page background is free to be any colour.

## Assets

Organized by project for clarity:

**Images** (`/public/images/`):
- `about/` — About page hero
- `mac-lamp/` — Mac-Lamp project images & diashow frames. Diashow items are `5.jpg`–`9.jpg` (converted from `.HEIC` this session — HEIC only renders in Safari, so gallery images must be JPG/PNG; the original `5.HEIC`–`8.HEIC` are still on disk but unused). Process-section stills: `1.png` (CAD render) + videos `2.MOV`/`3.MOV`/`4.MOV` in `videos/mac-lamp/`
- `portfolio/` — **orphaned.** Was "This Website" project screenshots; the page (`portfolio2d.html`) was removed this session (see "Recent Changes"). The image files are still on disk but nothing references them — safe to delete, left in place in case any of the removal was meant to be revisited.
- `vaccine/` — Double Packaging renders & process steps
- `vr-cookbook/` — Virtual Cooking assets: `side_v1_final_V1.png` (hero + card), `back_final_V2.jpg`, `timer_click_V1.jpg`, silver panel renders `Panel_Left.png` / `Panel_Right.png` / `Stopwatch.png` (transparent bg), and process screenshots `blender-modeling.png` + `app-preview.png` (⚠️ renamed from Figma exports that had spaces in the filename — keep filenames URL-safe)
- `unify/characters/` — `char-arch.svg`, `char-bird.svg`, `char-mountain.svg` (flattened, transparent-bg character exports)
- `site/` — favicon and shared UI assets. **Favicon:** orange (`#FF5C00`) circle with the site's actual logo mark (white, recolored from `logo-lm.png`) centered — `favicon.svg` (primary, self-contained: embeds a base64 PNG raster of the circle badge rather than a hand-drawn vector path, since the logo mark itself is raster art, not a traced shape) plus baked PNG fallbacks `favicon-16/32/48/512.png` and a legacy `/public/favicon.ico` (16/32/48 multi-size). **Originally (superseded, see "Recent Changes") the mark was a typed white "LM" monogram in a bold system sans-serif** (VT323 was tried first and blurred into illegibility at 16px) — replaced once the real Figma logo asset existed, so the favicon now matches the nav logo instead of approximating it with text. All PNG sizes are generated in Python/Pillow by supersampling a 2048px canvas (circle + centered white mark) and downsampling with LANCZOS per target size, rather than rendering the SVG in headless Chrome — simpler once the source mark is already a raster PNG. Linked via 3 tags in every page's `<head>` (right after `<meta charset>`): `<link rel="icon" type="image/svg+xml" href="/images/site/favicon.svg">`, a 32×32 PNG fallback, and `apple-touch-icon` (180×180) for iOS/bookmarks. Wired into `index.html` + all 13 real site pages (`2D.html`, `about2d/3d.html`, `contact2d/3d.html`, `controls_open3d.html`, `craft3d.html`, `kaffeemaschine2d.html`, `mac-lamp2d.html`, `unify2d.html`, `vaccine2d/3d.html`, `virtual_cooking2d.html`). Skipped `top_row_permanent_V3.html` (loaded only as an iframe, never gets its own browser tab) and the two standalone dev/experiment files `Questionmark_Button3d.html` / `blob_morph_bouncy.html` (not part of site navigation). **`favicon-180.png` / `favicon-192.png` are NOT the same transparent-circle design as the rest — they're a solid opaque orange square (no circle mask, no transparency) with the same white logo mark.** Root cause: `apple-touch-icon` (used by iOS Home Screen, Safari Favorites/Start Page tiles, and macOS "Add to Dock") ignores/fills transparency rather than respecting it — Apple's own icon convention always imposes a rounded-square mask on `apple-touch-icon` regardless of the source shape, so a transparent-cornered circle there rendered as "circle floating inside a visible square" once iOS/Safari filled the transparent corners with its own backdrop. Making that specific asset a full-bleed opaque orange square (not the circle used everywhere else) means the corners iOS reveals are already the brand orange, so the square mask reads as seamless instead of visibly framing the icon. The regular browser-tab favicon (`favicon.svg`, `favicon-16/32/48.png`, `favicon.ico`) is unaffected — those keep the genuine edge-to-edge circle since normal tab rendering respects transparency correctly. **If regenerating: `favicon-16/32/48/512.png` + `.ico` should stay the transparent-circle render; `favicon-180.png`/`favicon-192.png` should stay the separate opaque-square render — don't collapse them back into one asset.**

**Videos** (`/public/videos/`):
- `kaffeemaschine/` — Cybercoffee interface demo
- `mac-lamp/` — Mac-Lamp diashow video clips
- `vaccine/` — Double Packaging render video
- `vr-cookbook/` — Virtual Cooking demo clips (swipe, click, timer)
- `unify/` — Unify app screen recordings (portrait phone videos; each still has `#D8D7DC` baked in around the phone — the files are untouched, the grey is hidden with CSS `clip-path`, not removed)

**Other**:
- `/public/kaffeemaschine/kaffeemaschine.html` — Interactive coffee machine app, plus its assets (`beans.png`, `logo.png`, `milk.png`, `screen.png`, `size.png`, `cursor.png`, `cursor@2x.png`) — all must sit beside the HTML
- `/public/current🟢.glb` — 3D model used in the Three.js scene, loaded in `src/main.js`. **Renamed by the user from `portfolio_scene.glb`** (historical "Recent Changes" items below still refer to it by that name, and briefly as `portfolio_scene🔴.glb`); note the emoji in the filename is an exception to the "URL-safe filenames" rule — browsers percent-encode it automatically, but keep emoji out of any future asset names. `severance_V23.glb` has been deleted from disk.
- `/public/OCR-A-BT.ttf` — custom monospace font

## Current Status & Missing / TBD

**Unify page (01):**
- ✅ Hero blob (pupil tracking, 2/3 centering, bounce-in, widescreen scaling)
- ✅ Scroll-driven dual-video scrollytelling; mobile fallback at ≤860px
- ✅ NEW design-story sections (Design Process/colors, Typography, Character design, Final Product)
- ✅ Meta tiles filled (Timeline/Team/Role/Skills)
- ✅ All 6 feature copy filled (EN+DE). **The 6 `feat-*-title` keys were missing from `TRANSLATIONS` entirely until 2026-07-30** — they had `data-i18n` in the markup but no entry in either language block, so German visitors always saw the English heading. The translated orange kicker above them partly masked it; removing the kickers exposed it. Now present in both blocks (55 keys each, verified symmetric).
- ✅ Design-story section copy (colors/typography/characters/Final Product heading) now wired into `TRANSLATIONS` with German (was English-only); also caught and fixed 3 pre-existing German blocks (`overview-text`, `feat-timetable-text`, `feat-socials-text`) that were translated but overflowed their English line count by 1–3 lines undetected until this pass

**Virtual Cooking (02):**
- ✅ Rebuilt middle from new Figma (see layout above)
- ⏳ All body text is `[ Placeholder ]` — real copy + DE translations pending
- Leftover unused CSS: `.breakout-media`, `.glance-list`

**Kaffeemaschine app** (`public/kaffeemaschine/kaffeemaschine.html`):
- ✅ **Restored and committed.** Copied from `~/Documents/creative-work/ongoing/GitHub/kaffeemaschine_external_copy/` (the 5 Jul version) and verified working in the iframe on `kaffeemaschine2d.html`.
- It had never been tracked by git in this repo, which is why it went missing with no way to recover it here. It **is** tracked now — keep it that way.

**Mac-Lamp (04):**
- ✅ Rebuilt this session — At a Glance, fixed gallery cropping, HEIC→JPG, new Process section with scrolly mechanism (see layout above)
- ⏳ At a Glance lead is `[ Placeholder ]`, not yet in `TRANSLATIONS` (EN+DE keys exist — `section-glance`/`glance-lead` — but text itself is placeholder)

**Double Packaging (05):**
- ✅ Rebuilt this session to match the shared pattern (see layout above); all real copy preserved
- ⏳ At a Glance lead is `[ Placeholder ]`; same `section-glance`/`glance-lead` keys pattern

**3D mode:**
- ✅ Camera look-around now triggers on right-click **or middle-click** (previously right-click only) — see "3D Mode: Camera Controls" section below
- Otherwise stable; no other recent changes

**Deployment:**
- ✅ Live at `https://lucasmaher.com` (custom domain, HTTPS working) and `https://lucasmaher-hash.github.io/3d-Portfolio-current/` — see "Deployment" section below

## Recent Changes (This Session)

Previous session's work (French removal, Unify design-story sections, hero blob, Virtual Cooking rebuild, nav dropdown, `2D.html` divider fix) is folded into the structural sections above rather than listed here — see "Languages / i18n," "Unify Page: Hero Blob Implementation," and the layout-pattern entries below.

1. **Virtual Cooking — Final result reordered.** `.result-image-pair` moved out from under "Instruction manual" to sit directly beneath the "Timer & ingredients" heading; that block now reads heading → images → caption → video.

2. **Unify — video backgrounds clipped away.** All 6 phone videos clipped to the phone bezel via per-file `clip-path` (see "Unify Page: Video Details"). Files unchanged; render-time only. Removed the constraint that the page background had to match the videos' baked-in grey.

3. **Unify — page background unified** to `var(--bg-surface)` (`#DCDCE3`), same as every other 2D page. Only possible because of change 2.

4. **`2D.html` landing card (Project 06 / Unify)** — `homepage.mov` clipped to the same phone-bezel `clip-path` used on `unify2d.html`; tile background dropped from `#D8D7DC` to `transparent` (no longer needed once the video is clipped).

5. **Kaffeemaschine app restored.** It had never been tracked by git in this repo — root cause was `public/kaffeemaschine/` being explicitly excluded in `.gitignore`. Removed that rule, copied the app (HTML + 7 assets) in from a working backup copy on disk, committed. See "Current Status" and "Assets" for details.

6. **Mac-Lamp (02) — substantially rebuilt.** No longer matches the generic "Standard pattern" below:
   - New "At a Glance" section added (placeholder copy, EN+DE) above the meta grid
   - Overview/Concept's side-by-side text panel removed; the diashow/gallery is now full-width
   - Gallery cropping bug fixed: frame was forced to a wide box with `object-fit: cover`, cutting the top/bottom off the photos' actual ~4:3 aspect. Now `aspect-ratio: 4/3` + `object-fit: contain`, frame capped at `min(988px, 100%)`, docked left (not centered); thumbnail row left-aligned under it
   - Gallery images 5–8 converted **HEIC → JPG** — HEIC only renders in Safari; Chrome/Firefox showed them blank. Files `5.jpg`–`8.jpg` added, `ITEMS` array updated, `.HEIC` originals left on disk unused
   - First 4 diashow items (`1.png` CAD render, `2.MOV` 3D-printing, `3.MOV` bandsaw, `4.MOV` sanding) pulled out of the gallery into a new **Process** section, ordered before Overview/Concept (badges renumbered: Process=0, Overview/Concept=1)
   - `1.png`/`2.MOV` laid out as alternating `.process-shot` blocks (caption above image, natural aspect ratio); `1.png` centered on the right-third line, `2.MOV` on the left-third line
   - `3.MOV`/`4.MOV` (the two portrait videos) rebuilt into a full **scroll-driven dual-video mechanism ported from Unify's `.scrolly`** — sticky-pinned pair, scroll-past-midpoint or click swaps which video is full-size, mirrored layout (text left, videos right). Namespaced `.lamp-scrolly*` to avoid colliding with Unify's own classes. Centered on the right-third line via `position: absolute; left: 66.667%; transform: translateX(-50%)` — chosen over a fixed margin-% because the pair's rendered width changes as the active/inactive video swap, and `translateX(-50%)` self-centers regardless of width
   - Hit the **sticky-positioning trap twice on one page**: both `html,body { overflow-x: hidden }` and `.page-wrapper { overflow: hidden }` were silently breaking `position: sticky` on the new scrolly section. Both changed to `overflow: clip`. See gotchas — this is a recurring trap because new 2D pages get bootstrapped from an older page's `<style>` block that predates the `clip` fix.
   - `.process-steps` (mac-lamp) / `.stagger-list` wrapper uses the same fluid-width centering formula as Unify's `.character-list` (`width: calc(520px + 40vw); max-width: 100%; margin: auto`) so alternating blocks don't sprawl apart on ultra-wide monitors

7. **Double Packaging (01) — rebuilt to match Mac-Lamp/Unify/Virtual Cooking structure.** Previously used a bespoke `specs-row`/`frame2`/`stack`/`step-tile` grid with forced-crop image cells; that system is fully removed.
   - New "At a Glance" placeholder section added (EN+DE)
   - Overview/Concept's boxed, shadowed `.overview-text` card converted to a plain `.guide-text` paragraph — same treatment as the other three pages; real copy (EN+DE) unchanged
   - Process section rebuilt as **5 alternating `.stagger-row`/`.process-shot` blocks**, same document order and exact real copy/headings as before (all i18n keys reused, nothing rewritten), each image at its **natural aspect ratio** (no crop): Modeling (portrait, stagger-row/left) → Topology (landscape, process-shot/right) → Vacuum Sim (near-square, stagger-row/left) → Shading (landscape, process-shot/right) → Final Render (landscape, process-shot/left)
   - Per user decision: individual per-step numbered badges (1–5) dropped; the "5 Steps · Modeling → Render" meta line next to the Process heading was kept
   - `.process-steps` wrapper uses the same fluid-width centering as Unify/Mac-Lamp

8. **GitHub Pages deployment configured** — see new "Deployment" section below for the full setup (workflow, custom domain, DNS).

9. **Homepage footer polish (`2D.html`).** Removed the "Built with care and way too much coffee" `.footer-note` line entirely (deleted the markup, its CSS rule, and both `footer-note` EN/DE translation keys). The `.copyright` line ("© Lucas Maher. All Rights Reserved.") was nudged up **13px total** (`transform: translateY(-13px)` on `.copyright`, applied in two passes — 8px then another 5px) so it sits level with the "top" scroll button beside it. Year updated **2025 → 2026** in all three places it lives: the HTML default text, `TRANSLATIONS.en['footer-copyright']`, and `TRANSLATIONS.de['footer-copyright']` (it renders via `data-i18n`, so editing just the HTML default isn't enough). The `.footer-logo` "top" button already had a hover lift matching the nav (see item 12); left as-is.

10. **Nav bar bottom-shadow-cropped-on-dropdown-close bug fixed.** Root cause: the `nav-collapse` `postMessage` handler on every host page was shrinking the `#top-bar` iframe to `90px` — a stale value that predates the current 140px-default nav sizing. At 90px the iframe's own bounding box clips the nav pill's neumorphic bottom shadow, so the shadow looked correct on first load (iframe starts at 140px) but visibly lost its bottom edge the moment you hovered the Craft dropdown and it closed again. Fixed by changing the `nav-collapse` target height from `90px` to `140px` (matching the default) on all 9 host pages. See "Nav bar iframe" above for the full before/after.

11. **Nav bar narrowed 10px per side on MacBook aspect ratios only** (`top_row_permanent_V3.html`). Two independent constraints needed updating because different screen sizes hit different ones: `.top-row` padding (`--island-edge-x`) is what actually constrains the pill on 13"/14" MacBooks, so it became `calc(var(--island-edge-x) + 10px)`; `.nav-island`'s `max-width` is what constrains it on 16" MacBooks, so that dropped `1306px → 1286px`. The existing `@media (min-aspect-ratio: 17/10)` rule still forces `max-width: 1330px` on true widescreen monitors, which has enough headroom that the extra padding never engages there — so wide-aspect nav width is untouched, exactly as requested.

12. **Dotted-divider half-cut-dot bug fixed at the root cause, site-wide.** Every `.dot-divider` (breadcrumb dividers under page headers) is a `radial-gradient` dot pattern tiled via `background-size: 10px 4px` + `background-repeat: repeat-x`. Because a divider's rendered width is essentially never an exact multiple of 10px, `repeat-x` was clipping the **final partial tile** — producing a half-rendered dot at the line's end, and only *sometimes*, depending on where the container's width landed relative to the 10px tile boundary (this is why it looked randomly broken rather than consistently). Root-cause fix: switched every instance to `background-repeat: space no-repeat`, which per spec tiles "as much as possible without clipping" — whole dots are pinned to both ends and the leftover space is absorbed into the gaps between dots. Applied across all 13 files with a `.dot-divider` (see "Known Patterns & Gotchas" below for the full file list and the rule to follow for any new divider).

13. **Hover-lift strength unified across the entire site.** Audited every `:hover` rule with a `transform`/`box-shadow` lift and found two inconsistent groups: neumorphic pills (`.contact-item` on the Contact page, `.item` accordion rows on the About page) were using a shallower `6px 6px 18px` shadow than the nav/footer's `11px 11px 24px`; and several scale-only elements (`.btn-view-work`, `.project-nav-item` on 6 project pages, `.gallery-thumb` on Mac-Lamp) used `scale(1.04)` or `translateY(-3px)` instead of the nav's `translateY(-2px) scale(1.03)`. Normalized everything to the nav's values — see "Known Patterns & Gotchas" below for the exact convention to follow on any new hoverable element.

14. **Copyright moved up another 5px, year corrected to 2026.** Item 9's `translateY(-8px)` on `.copyright` (`2D.html`) became `translateY(-13px)` after a follow-up nudge (later nudged again — see item 21 for the final value). "© 2026 Lucas Maher..." — the copyright text specifically; the *project* year tags on the landing grid (unrelated `2025` strings) were left untouched.

15. **Nav bar narrowed on MacBook aspect only (round 2 — 10px tighter per side, on top of item 11's earlier pass).** Same two-constraint pattern as before: `.top-row` padding (`--island-edge-x`) governs 13"/14" MacBooks, `.nav-island`'s `max-width` governs 16" — both nudged another 10px per side. The `min-aspect-ratio: 17/10` widescreen override (`max-width: 1330px`) still has enough headroom that neither change reaches wide-aspect monitors, so that tier is still untouched.

16. **Dotted-divider half-cut-dot bug — the real fix, superseding item 12's `background-repeat: space` attempt.** Item 12's CSS-only fix tested correctly in Chrome but the user reported the bug persisted live — root cause turned out to be a Safari/WebKit bug where `background-repeat: space` doesn't reliably avoid clipping on gradient-image backgrounds (confirmed via an isolated Chrome-only test: `space` rendered perfectly there, so the remaining failure had to be engine-specific). Replaced with a JS-computed exact-divisor fix — see the corrected "Dotted dividers" entry under "Known Patterns & Gotchas" for the full mechanism and the `<script>` snippet to reuse. **Lesson: a CSS spec behavior "should" work isn't the same as it working in every engine — verify the actual fix in the browser the bug was reported in (this site's real-world testing browser is Safari, per the existing `min-aspect-ratio` decimal gotcha), not just Chrome headless.**

17. **Favicon replaced.** Old icon was an unrelated purple abstract-blob SVG that only `index.html` linked to — every other page had no favicon at all. New icon is an orange (`#FF5C00`) circle with a white "LM" monogram, matching the nav's own "LM" badge initials and the site's accent color. See the "Assets" section above for the full file list, why VT323 was swapped for a bold system sans in the icon text (illegible at 16px), and which pages were deliberately skipped.

18. **`apple-touch-icon` fixed to be a solid orange square, not a transparent circle.** The circle-on-transparent design from item 17 is correct for the regular browser-tab favicon, but iOS/Safari doesn't respect transparency on `apple-touch-icon` (used for Home Screen, Safari Favorites/Start Page tiles, and macOS "Add to Dock") — it always imposes its own rounded-square mask and fills any transparent area with its own backdrop, so the transparent-cornered circle rendered as "circle floating inside a visible square." Regenerated `favicon-180.png`/`favicon-192.png` specifically as a full-bleed opaque orange square (same white "LM" mark, no circle mask) so the corners iOS reveals are already brand orange — see the corrected "Assets" entry for the full explanation and which files must stay circular vs square if regenerating.

19. **Hero image sub-pixel gap fixed on all 4 image-based project heroes** (`kaffeemaschine2d.html`, `mac-lamp2d.html`, `portfolio2d.html`, `virtual_cooking2d.html`). Root cause: `.hero` sizes itself via `aspect-ratio`, and the `<img>` inside was `width:100%; height:100%; object-fit:cover` — ordinary in-flow sizing. `aspect-ratio` can compute a non-integer container height, and the container's own border-box edge vs. the image's box edge can independently round to different device pixels, leaving up to a ~1px gap at an edge (most visible at the bottom, right above the `border-bottom` divider) where the page's own background shows through as a thin seam. Fix: overscan the image 1px past every edge of `.hero` (`position: relative; overflow: hidden;`) so the excess gets silently clipped and no rounding direction can leave a visible gap. **Correct CSS — `width`/`height` must be explicit, `inset` alone is not enough:**
    ```css
    .hero img {
      position: absolute;
      top: -1px; left: -1px;
      width: calc(100% + 2px);
      height: calc(100% + 2px);
      object-fit: cover;
      object-position: center center;
      display: block;
    }
    ```
    **First attempt used `inset: -1px;` with no explicit width/height and briefly shipped broken — every hero rendered zoomed in to a tiny crop.** Cause: an absolutely positioned *replaced* element (`<img>`, `<video>`) with `width`/`height` left at `auto` does **not** stretch to satisfy `inset`/`top`+`bottom`+`left`+`right` constraints the way a non-replaced `<div>` would — replaced elements fall back to their own intrinsic (natural pixel) size instead, per the CSS2.1 replaced-element sizing rules. So each image collapsed to its native dimensions, and `object-fit: cover` then cropped that already-tiny box down further. **Lesson: absolutely positioned images/videos always need explicit `width`/`height` (or `calc(100% + Npx)`) — never rely on `inset` alone to size them, only to position them.** `vaccine2d.html`'s hero is a different, intentional design (a letterboxed video with visible black bars via `object-fit: contain` at 88% height) and isn't subject to the original gap bug, so it was left as-is; `unify2d.html`'s custom blob hero doesn't use the `.hero`/`.hero img` pattern at all, also left alone.

20. **Project-nav footer divider — reported "cut off"/"doesn't go all the way down" on two separate occasions (Cybercoffee, then Virtual Cooking); fixed for real on the second pass, on all 6 pages that have one** (`kaffeemaschine2d.html`, `portfolio2d.html`, `mac-lamp2d.html`, `vaccine2d.html`, `virtual_cooking2d.html`, `unify2d.html`). Original implementation: an absolutely-positioned `.project-nav::after` pseudo-element with `top: 0; bottom: -13px;` — a negative overshoot meant to bleed 13px past `.project-nav`'s own box so the line would visually touch `.page-wrapper`'s outer border (13px ≈ the wrapper's 12px `padding-bottom` + 1px border), relying on the ancestor's `overflow: hidden`/`clip` to trim it flush at the right spot. **First fix attempt** (`bottom: -13px` → `bottom: 0`) removed the overflow-dependence but only made the divider span exactly `.project-nav`'s own content box — the user reported it still didn't reach the true bottom (visible as a gap below the line, above the outer card border) on Virtual Cooking. **Actual fix: stopped using a pseudo-element entirely.** Replaced it with a real `border-left: 1px solid var(--border-color)` on the second flex item, via `.project-nav-item + .project-nav-item` — a border on a flex item always spans that item's exact rendered height automatically, with zero positioning math and zero overflow-clipping dependency, so there's no possible browser inconsistency left to trigger. Paired with `margin-bottom: -12px` on `.project-nav` itself (canceling `.page-wrapper`'s `padding-bottom: 12px`, confirmed identical across all 6 pages) so the nav's own box — and therefore the new real border — now sits flush against the wrapper's inner border edge (verified via direct DOM measurement over CDP: 1px gap remaining, which is exactly the wrapper's own border stroke, i.e. correctly flush). **Lesson, now proven twice on this divider alone: don't reach for an absolutely-positioned pseudo-element + negative-offset-under-overflow-clip to make a line "reach" a container edge — use a real border on an already-correctly-sized box instead, whenever the geometry allows it (flexbox stretch, in this case).** Any new footer-style divider should follow this pattern, not the old pseudo-element one.

21. **Copyright nudged up a third time — final value.** `.copyright` (`2D.html`) `transform: translateY(...)` went `-8px` (item 9) → `-13px` (item 14) → **`-18px` (current/final)**. If it ever needs adjusting again, this is the single line to edit — search `2D.html` for `.copyright {`.

22. **3D mode — middle mouse button now also orbits the camera, not just right-click.** `src/main.js` gated the look-around drag on `e.button === 2` (right button) only. Generalized: the tracking flag was renamed `isRightDown` → `isLookDown`, and the `mousedown`/`mouseup` handlers now trigger on `e.button === 2 || e.button === 1` (right or middle). Middle-mouse-down also calls `e.preventDefault()` (suppresses the browser's default autoscroll-icon behavior) and a new `auxclick` listener guards against the same for good measure. See "3D Mode: Camera Controls" below for the full mechanism.

23. **About + Contact page hover effects rebuilt; root cause of the "flicker" was `animation-fill-mode: forwards`, not the hover values.** The hover lift on `.item` (About accordion rows) and `.contact-item` (Contact Email/LinkedIn/Instagram buttons) appeared to flicker rather than lift. The values were already correct — the real cause was that both elements also carry the `.anim` staggered fade-in class, whose `forwards` fill permanently re-asserts `transform: translateY(0)` at animation priority, outranking `:hover { transform }` in the cascade. See the `animation-fill-mode` entry under "Known Patterns & Gotchas" for the full mechanism and the verification. Fixed by switching `.anim` to `backwards` + dropping its base `opacity: 0` on both pages (entrance animation unchanged), then rebuilding both hover rules with the homepage **"top" button** (`.footer-logo:hover` in `2D.html`) as the size/shadow reference — `transform: translateY(-2px) scale(1.03)` + `box-shadow: 11px 11px 24px rgba(174,174,192,0.9), -8px -8px 20px rgba(255,255,255,1)`. Also removed the now-redundant `overflow: hidden` from `.contact-item` (nothing overflows it, and rounded-clip + scale is a secondary repaint hazard); **kept** it on About's `.item`, where it's required to clip the accordion body during the `max-height` collapse.
    **`backwards` was NOT sufficient — three passes were needed, and only the third actually worked.** Passes 1–2 (switching `.anim` to `backwards`; then adding `will-change`/`backface-visibility` + symmetric easing) tested clean in headless Chrome but the user still reported "flickers, and definitely doesn't ease out." **Root cause of the remainder: in Safari a finished CSS animation stays attached to the element and keeps suppressing `transition` on the property it animated.** So `transform` had no transition at all — it snapped instantly — while `box-shadow` (never in the keyframes) eased over 260ms. An instant geometry snap next to a 260ms shadow fade *is* the "flicker," and it's also literally "doesn't ease out." `animation-fill-mode` can't fix this, because the problem is the animation *existing on the element*, not what it fills with.
    **Actual fix — separate the two concerns structurally: the `.anim` fade-in now lives on a WRAPPER `<div>`, never on the hover target.** `contact2d.html`'s three `<a class="contact-item anim anim-N">` became `<div class="anim anim-N"><a class="contact-item">…</a></div>`; same for About's three `.item` rows. The hover element now reports `animationName: "none"` and zero attached animations, so nothing can contest its `transform` in any engine. With the conflict gone, the compositing hints were unnecessary and were removed, and the transitions were restored to **byte-for-byte match `.footer-logo`**: base `transform 260ms cubic-bezier(.2,.7,.2,1), box-shadow 260ms cubic-bezier(.2,.7,.2,1)` (the ease-out on leave) plus `:hover { transition: transform 150ms ease, box-shadow 150ms ease; }` (the enter). Verified over CDP: real intermediate matrices in **both** directions, staggered entrance unchanged (wrapper is `opacity: 0; translateY(10px)` at 120ms → `opacity: 1; transform: none` by 1.5s), all 3 contact `href`s intact, About's accordion still expands (276px), and `<div>`/`</div>` counts balanced on both pages.
    **Rule going forward: never put an entrance animation that touches `transform` on the same element as a `:hover { transform }`.** Put the animation on a wrapper. Cascade tricks (`fill-mode`) only mask it in Chrome.

24. **Project order changed site-wide; "This Website" (`portfolio2d.html`) removed entirely.** New order: **01 Unify → 02 Virtual Cooking → 03 Cybercoffee → 04 Mac-Lamp → 05 Double Packaging** (previously 01 Double Packaging → 02 Mac-Lamp → 03 This Website → 04 Cybercoffee → 05 Virtual Cooking → 06 Unify). Every place the project order/list is duplicated across the codebase had to be updated by hand — there is no single source of truth for it:
    - **`portfolio2d.html` deleted** (`git rm`). No `portfolio3d.html` ever existed, so no 3D-mode counterpart to remove.
    - **`2D.html` landing grid** — the "This Website" `.project-section` block removed outright; the remaining 5 rebuilt in new order with renumbered `Project 0X` labels. Re-established a clean alternating left/right layout (`.reverse` class on positions 2 and 4) — the pre-existing grid had **three different DOM-wrapping patterns** for the image tile across projects (tile-div-is-direct-grid-child vs. `<a>`-wraps-tile-div), and critically, `.project-section.reverse .project-tile { grid-column: 1 }` only takes effect when `.project-tile` is a **direct** grid child — for the `<a>`-wraps-tile pattern (Cybercoffee/Virtual Cooking/Unify's own asset markup) the `reverse` class silently no-ops and the visual side is actually determined by plain DOM auto-placement instead. Controlled every row's side via **DOM child order** (content-first vs. tile-first), not the `reverse` class alone, since that's the mechanism that's reliable across all three wrapping patterns; kept the `reverse` class present on rows where it happens to also apply correctly, purely for stylistic consistency with the rest of the file.
    - **Craft dropdown** (`top_row_permanent_V3.html`) — the "This Website" `<span>` removed, remaining 5 reordered. Its `data-nav="this-website"` translation wiring removed from the language-toggle IIFE (`NAV_LANG.thisWebsite` key + the `[data-nav="this-website"]` lookup, both en/de). Also found and cleaned **four separate, independent** inline `parentPath.includes('portfolio2d')` checks scattered across different IIFEs in this file (mobile-collapse detection, nav-shadow detection, help-button visibility, Craft-dropdown-init guard, logo-button click handler) — this file does not centralize its "which 2D page am I on" logic, so any future page addition/removal needs a manual sweep of all `is2DView`/`isXxx2D` blocks, not just one.
    - **Every remaining project page's `.project-nav`** (prev/next links, `.project-nav-number`, title text, `data-i18n` keys) rewired to the new chain. First project (Unify) now has **no previous** (empty `<div class="project-nav-item">` placeholder, first slot); last project (Double Packaging) now has **no next** (empty placeholder, second slot) — a deliberate change from the *previous* inconsistent state where Unify's "next" silently wrapped around to Double Packaging (01) while Double Packaging itself had no "previous," i.e. a one-directional, asymmetric loop that was never actually documented as intentional. Resolved it into a clean non-cyclic start/end, matching the one behavior that *was* documented (item 7 above: "no previous — this is Project 01, the first").
    - **i18n cleanup, per page:** removed now-dead `data-i18n` keys from each page's `TRANSLATIONS` object (en+de) wherever the corresponding `nav-*` span was removed/replaced — `nav-this-website` (mac-lamp2d.html, kaffeemaschine2d.html), `nav-prev`+`nav-double-packaging` (unify2d.html, no longer has a "previous" item), and an already-dead unused `nav-double-packaging` key on virtual_cooking2d.html that predated this change. Added a fresh `nav-prev` key (en `'<< PREVIOUS'` / de `'<< ZURÜCK'`, matching the site-wide convention) to vaccine2d.html, which never needed one before since it used to be the first project. **Not every neighboring project title has a translated `data-i18n` key on every page** — some pages only ever localized the specific neighbor they happened to link to (an existing site-wide inconsistency, not something this reorder fixed) — where a page's new neighbor has no existing translation, the title was left as plain English text rather than inventing a new key, matching how the site already handles several such cases (e.g. vaccine2d.html's "Mac-Lamp" project-nav title has never been localized).
    - **`portfolio/` image folder now orphaned** — files left on disk, nothing references them (see "Assets").
    - **Vite dev-server quirk, not a bug:** `curl localhost:5173/portfolio2d.html` still returns `200` with `index.html`'s content after deletion — this is Vite's default `appType: 'spa'` fallback (serves `index.html` for any unmatched route) with no `vite.config.js` present to override it. GitHub Pages has no such fallback, so the deleted page correctly 404s in production. Don't mistake this local-only 200 for the removal having failed.

25. **New responsive tier: below-MacBook shrink with a gradual padding fade, synced border removal, and a desktop-only shrink cap — site-wide, all 8 non-3D pages.** Third layout tier alongside the existing MacBook/wide-screen work (see "Widescreen-only tweaks" and the new "Below-MacBook shrink" entry under "Known Patterns & Gotchas" for the full mechanism and formula derivation). Summary: outer padding now fades linearly from `55px` at `1440px` viewport width to exactly `0px` at `860px` (previously floored at a hard `20px` and then jump-snapped to `0` at the unrelated `640px` mobile breakpoint); `.page-wrapper`'s border/margin are removed in a new `@media (max-width: 860px)` rule timed to land exactly where the fade reaches zero, so there's no visible pop; and a `@media (hover: hover) and (pointer: fine) { html, body { min-width: 860px; } }` rule caps how far **real desktop/laptop** browser windows can keep shrinking — narrower than that, the page content stays pinned at 860px and the excess is clipped (relying on the already-present root `overflow-x: clip`) rather than reflowing into the mobile layout or exposing a horizontal scrollbar. `pointer: fine`/`hover: hover` deliberately excludes touch devices, so real phones/tablets are untouched and keep reflowing all the way to their actual widths via the pre-existing `@media (max-width: 640px)` rules. Along the way, standardized `overflow-x` to `clip` on the 2 pages that had `hidden` (`vaccine2d.html`, `virtual_cooking2d.html`) and the 3 that had none at all (`2D.html`, `about2d.html`, `contact2d.html`) — required for the shrink cap's clipping to actually work, and consistent with the existing `overflow-x: clip`-not-`hidden` sticky-positioning rule elsewhere in this doc. Verified numerically via CDP (not just visually): padding at the exact midpoint (1150px) computed to `27.5px`, precisely half of `55px`; `body.scrollWidth` stayed pinned at `860` for a desktop/`pointer:fine` viewport narrowed to 600px, but correctly tracked the real `600` for an emulated touch/`pointer:coarse` viewport at the same width.

26. **Nav logo swapped from "LM" text to an exported Figma asset.** Pulled the logo frame from Figma (`s3BSUt18g4pL15dYCYknz4`, node `515-152`) — it turned out to be a raster photo export, not a vector, so the highest-res PNG (10736×7128) was processed in Python/PIL with a luminance-based alpha mask (`new_alpha = 255 - luminance`, forced output color pure black) to turn its white background into a smoothly anti-aliased transparent one, then cropped to content and resized to 400px wide → `public/images/site/logo-lm.png`. In `top_row_permanent_V3.html` the `<a class="logo" id="logo-btn">LM</a>` text became `<img src="/images/site/logo-lm.png" alt="" class="logo-mark" />`, with a new `.logo-mark` rule (`height: auto; display: block; pointer-events: none`) and the now-irrelevant font properties stripped from `.logo`. Per two follow-up "increase the size another 20%" requests, `.logo-mark`'s `width` was bumped **24px → 28.8px → 34.56px** (each pass a +20% compound increase) — the 44px circular `.logo` button itself was left untouched both times, only the image inside it grew.

27. **Cybercoffee's "Design process" intro paragraph — text-align fix.** `process-intro` on `kaffeemaschine2d.html` had shipped with `text-align: center; max-width: 720px; margin: 0 auto;` inline, centering it against the left-docked convention every other `.guide-text` paragraph on the site follows. Removed all three properties so it renders as a plain left-aligned `.guide-text` block like the rest of the page.

28. **Double Packaging — Final Render caption removed, video nudged up 20px.** The paragraph under the "Final Render" process step (`final-render-text`) was deleted from the markup entirely, and the now-unused `final-render-text` key removed from both `en`/`de` in `vaccine2d.html`'s `TRANSLATIONS`. `.process-video`'s `margin-top` changed from its normal `clamp(44px, 9vw, 100px)` to an inline `clamp(44px, calc(9vw - 20px), 100px)` so the video sits 20px higher without touching the shared class rule other steps still use.

29. **German translations added/resynced across all four pages that got new or enriched English copy this session** (`virtual_cooking2d.html`, `kaffeemaschine2d.html`, `mac-lamp2d.html`; `vaccine2d.html` spot-checked). Virtual Cooking's `TRANSLATIONS` object still held ~20 dead keys from an earlier page layout (`section-overview`, `section-instructions`, `section-controllers`, `reflection-tag-1/2`, etc.) with no matching markup anywhere — all removed, replaced with the 16 keys the current HTML actually uses (`glance-lead`, `section-problem`, `problem-text-1/2/3`, `section-process`, `process-intro`, `panel-manual-text`, `panel-ingredients-text`, `panel-timer-text`, `process-blender-text`, `process-vscode-text`, `section-result`, `result-manual-heading`, `result-manual-text`, `result-timer-heading`, `result-timer-text`), each with a fresh German translation. Cybercoffee and Mac-Lamp's EN copy already existed but their German values were stale/placeholder (`hero-desc` in particular had completely different content — an old "why" paragraph vs. the current "how to use it" walkthrough) or, for Mac-Lamp's `result-text`, missing the DE key outright — all rewritten to match current EN.
    **Verification method, per explicit user instruction ("double check the translation roughly takes up the same size... before moving on to another section"):** rather than eyeballing character counts, drove headless Chrome over CDP (`Runtime.evaluate`), called `applyLang('de')` on the live dev-server page, and measured each translated element's real rendered `getBoundingClientRect().height` against its English counterpart, dividing by `getComputedStyle().lineHeight` to get an exact line-wrap count for both languages. Any German block that wrapped to more lines than its English counterpart was rewritten shorter (content trimmed, not just reworded) and re-measured until it matched — iterated live against the actual page rather than a static string-length guess, since font metrics/kerning make character-count parity an unreliable proxy for wrap-line parity. Caught and fixed 8 overflowing blocks this way across the four pages (Virtual Cooking: `glance-lead`, `problem-text-1`, `process-intro`, `panel-manual-text`, `panel-timer-text`; Cybercoffee: `glance-lead`, `process-1`, `hero-desc`; Mac-Lamp: `glance-lead`; Double Packaging: `process-intro`, `step1-text` — the latter two had been left as pre-existing stale German from before this pass and hadn't actually been checked against the current English length). Every element across all four pages now matches its English line count exactly (or comes in shorter, never longer).

30. **Unify — design-story sections wired into `TRANSLATIONS`; 3 pre-existing overflowing German blocks fixed.** The user reported "many text blocks on unify page are not translated to german." Investigation found two distinct causes: (a) the Design Process/colors, Typography, Character-design, and Final Product sections (added in an earlier session, see "Unify page (01)" status list) had never been wired to i18n at all — no `data-i18n` attributes, plain hardcoded English in the markup — so switching to German silently left them in English, matching the exact symptom reported. Added `data-i18n` to all 19 text nodes across these sections (`section-design-process`, `colors-title`, `colors-text`, `typography-title`, `typography-text`, 3× typography-card label/spec/preview triplets, `characters-title`, `characters-text-1/2/3`, `section-final-product`) and wrote fresh German for each. (b) Separately, three *already-wired* keys (`overview-text`, `feat-timetable-text`, `feat-socials-text`) had German translations from an earlier session that had never been checked against rendered line count — they overflowed their English counterpart by 1, 3, and 2 lines respectively (`feat-timetable-text` was the worst: 318px vs English's 245px). All shortened and re-measured via the same CDP line-height method as the other four pages (see item 29) until every block matched or came in under its English height — `characters-text-1/2/3` land 2px over (an imperceptible sub-pixel difference from kerning, not an extra wrapped line) and were accepted as-is; everything else is an exact or better match.

31. **3D-only fix: nav bar hover shadows no longer bleed past the bar's rounded edge.** In `top_row_permanent_V3.html`, `.pill:hover`/`.logo:hover` apply a large neumorphic box-shadow (`11px 11px 24px` + `-8px -8px 20px` blur) that always extends visibly past the hovered element's own box — that's true in both 2D and 3D, but only showed as a bug in 3D. Root cause: `.nav-island` (the outer rounded bar containing the logo, view toggle, and Craft/About/Contact links) has `overflow: visible` and its own solid `background: var(--bg-surface)`, identical to the flat page background on every 2D page — so the shadow bleed was always happening, it just blended invisibly into the matching-colour page background there. In 3D, the page behind the nav is the Three.js canvas, not a flat matching colour, so the same bleed appeared as a visible glowing smudge past the bar's rounded silhouette. Fixed by adding a 3D-only class: the existing `is2DView` path-detection IIFE (already computing this per page, see the "four separate checks" gotcha above) now also does `if (!is2DView) navIsland.classList.add('is-3d-view')`, paired with a new CSS rule `.nav-island.is-3d-view { overflow: hidden; }`. 2D pages are completely untouched (verified: `.nav-island` there still reports `overflow: visible` and only the pre-existing `is-2d-mode` class). Verified the fix itself by loading the nav standalone in headless Chrome, dispatching a real CDP mouse-move (not a synthetic `:hover` — that doesn't trigger real `:hover` styling) onto the Craft/About/Contact pill, and pixel-diffing a screenshot with the clip on vs. off: before, hovering "About" produced a bright halo bleeding past the bar's top-right corner; after, the same hover state clips cleanly at the bar's own rounded edge. `overflow: hidden` on `.nav-island` was already a safe, precedented pattern in this file — the existing mobile-3D `.nav-island.is-collapsible` rule (used for the collapse-behind-the-logo animation) already does the same thing without issue, and since nothing inside `.nav-island` uses `position: fixed` relying on it as a containing block (the Craft dropdown is `position: fixed` directly off the viewport, unaffected by a non-transformed ancestor's `overflow`), there was no risk to the dropdown or other nav features.

32. **About/Contact page hover — replaced with the working 3D-page version, after the earlier `.anim`-conflict fix (item 23) still didn't feel right to the user.** Item 23's fix was structurally correct (moved `.anim` off the hover element onto a wrapper, eliminating the flicker) but kept the hover shadow byte-for-byte matched to the homepage's `.footer-logo` "top" button — a dramatic, large lift (`11px 11px 24px` / `-8px -8px 20px`). The user pointed out `about3d.html`/`contact3d.html` (the 3D-mode equivalents of these pages, small standalone overlay files, not iframe-loaded) already had correct-feeling hover on their own `.item`/`.contact-item`, and asked to replace the 2D versions' buttons with the 3D ones rather than iterate further. Root cause of the feel difference: 3D's hover is a much subtler, proportional deepening of the *resting* shadow (`-6px -6px 18px @ white` / `6px 6px 18px @ 0.8`, scaled up only slightly from the resting `-5/-5/12` / `5/5/12`), with `transition: box-shadow 300ms ease-out, transform 300ms ease-out` as the base and `150ms ease` on hover — completely different in character from the "big lift" convention item 13 had unified the rest of the site onto. Ported `.item` (`about2d.html`) and `.contact-item` (`contact2d.html`) CSS to match `about3d.html`/`contact3d.html` exactly (box-shadow values, transition timing, and — a detail the earlier fix had deliberately removed — `overflow: hidden` back onto `.contact-item`, since the 3D version has it and it's harmless there). Confirmed zero leftover references to the old `11px 11px 24px` / `260ms cubic-bezier(.2,.7,.2,1)` values in either file. Per the user's explicit instruction, the *size* wasn't touched — `.item-label`/`.contact-label` font-size and `.btn` dimensions stay the 2D page's own fixed values (`20px` / `38×37px`), not adopted from the 3D pages' `clamp()`-based responsive versions (though these are numerically almost identical anyway at desktop widths). The `.anim`-on-a-wrapper structure from item 23 is unchanged and still required — 3D pages have no entrance animation at all so this conflict never existed there, but 2D pages still stagger-fade in on load, so the wrapper split still matters. Verified via CDP: dispatched a real mouse-move (not a synthetic `:hover`) onto `.item`/`.contact-item` on both pages and read back `getComputedStyle` — box-shadow and transform now match the 3D pages' hover state exactly; also confirmed the accordion still opens/closes, German translations still apply, and all three contact `href`s are intact.

33. **Favicon mark swapped from typed "LM" text to the real logo asset.** Once `logo-lm.png` (the Figma-exported logo mark, see item 26) existed, the favicon's monogram — previously a bold-sans "LM" string baked into `favicon.svg` — no longer needed to approximate the logo with text. Recolored `logo-lm.png`'s black shape to pure white (RGB→255 with the original alpha preserved), then composited it onto the existing orange (`#FF5C00`) circle badge at a 2048px supersampled resolution and downsampled per target size (16/32/48/512 + `favicon.ico`) via Pillow/LANCZOS for anti-aliased edges at every size — same orange-circle brand language as before, just the real mark instead of typed text. `favicon.svg` was rebuilt to embed a base64 raster of the circle badge (the mark itself is raster art with no traced vector path, so a hand-written `<circle>`+`<text>` SVG, as before, is no longer possible — self-contained embedded-image SVG is the closest equivalent). `favicon-180.png`/`favicon-192.png` regenerated the same way but onto the existing opaque full-bleed orange square (no circle mask), preserving the iOS-transparency fix from item 18. Verified all 8 regenerated files still serve `200` from the dev server and the SVG renders correctly via a CDP screenshot.

34. **3D scene model swapped: `severance_V23.glb` → `portfolio_scene.glb`.** In `src/main.js`, the `GLTFLoader.load()` path changed to the new file (user-provided, dropped into `public/`). The scene-loading code is fully data-driven off the model's own node names/bounding box — collision filtering uses relative size thresholds computed from the model's own dimensions, and interactive objects are matched via the `CONTENT` dictionary (`node name → overlay content`), not hardcoded coordinates — so most of it required no code changes. One key had to be updated: `'YellowRoom_CoffeeTable001'` → `'YellowRoom_CoffeeTable'`, matching the new model's node name for the same coffee-table object (the old model had a `001` suffix, the new one doesn't). `'NewRoom_Podium'` (→ `/vaccine3d.html`) needed no change — the node name is identical in both files. Verified via headless Chrome with SwiftShader software WebGL (`--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader` — plain `--disable-gpu` headless has no WebGL at all and silently fails to render): model loads with no errors, `Clickables gefunden: 2` (matches the 2 `CONTENT` keys), collision filtering runs cleanly across all 164 nodes with no crashes, and the spawn-point probe finds a valid floor position (screenshot confirmed: camera spawns facing the vaccine-bottle podium, nav bar renders correctly on top).
    **Important — the new model is much richer than the old one, and most of it isn't wired up yet.** Inspecting the glTF JSON directly (`portfolio_scene.glb` is a single self-contained binary glTF, no external textures) shows named node groups matching *every* project on the site, not just Vaccine: `Pivot_MacLamp`/`Pivot_MacLamp_Table` (two Mac-Lamp instances), `Pivot_Kaffeemaschine` (the Cybercoffee egg — `egg-body`, `display-screen`, `btn-L1..3`/`btn-R1..3`, `chev-L1..3`/`chev-R1..3`), `Pivot_UNify` (the Unify blob character — `Figur_Body/EyeL/EyeR/PupilL/PupilR`), `Pivot_VRPanel` (Virtual Cooking's silver panel — `Left_Card`/`Left_Glyph`/`Left_Heading`/`Left_Strip*`), and a second bottle instance `Pivot_Bottle` (separate from the podium's `Pivot_Bottle_Podest`). There are also two creature/character props (`PinkRoom_Creature_*`, `Monster2_*`) that don't obviously map to any project. **None of these are in the `CONTENT` dictionary yet** — only the pre-existing `NewRoom_Podium` (Vaccine) and `YellowRoom_CoffeeTable` (placeholder) are clickable; every other named group currently just renders as scenery. Wiring the rest up (which pivot → which project page, and what should happen to the two ambiguous creature props and the second bottle instance) needs the user's input on the intended mapping before guessing — flagged to the user as a natural follow-up, not done this session.

35. **Root cause found: the camera's eye-height constant was left over from the old (now-replaced) 3D model and put the viewer underground in the new one.** After the item-34 scene swap, the user asked twice to "increase the eye level by 30%" — each time `playerHeight` (added to the spawn-probe's `floorY` to get `camera.position.y`) was reduced in magnitude by 30% (`-1.3601 → -0.9521 → -0.6664`, since it's negative and the existing R/F debug-key comment confirms less-negative = higher). Both passes were verified via headless-Chrome screenshots that did show the camera moving — but the user reported neither was perceptible. Root-caused by parsing `portfolio_scene.glb`'s node transforms directly (walking the glTF node hierarchy, reading each mesh's accessor `min`/`max` to get world-space bounding boxes): the spawn probe's `floorY` (≈0.018) lands on `MainRoom_Floor`'s top surface, and `NewRoom_Podium` is a real 0.5-unit pedestal with the room's ceiling starting ~5 units up — confirming this scene is roughly 1 unit ≈ 1 meter. Against that, `playerHeight = -1.3601` put the camera **1.36 units *below* the floor**, not above it — a magic constant hand-tuned for `severance_V23.glb`'s entirely different coordinate scale that nobody re-tuned when item 34 swapped the model. Both 30%-reduction passes only made the underground offset smaller (1.36 → 0.95 → 0.67 units under the floor) — the camera was underground the entire time, which is why no amount of relative adjustment read as "higher": it never crossed back above ground. Fix: replaced the stale negative constant with a real positive standing eye-height, `playerHeight = 1.6` (a normal adult eye height at the scene's ~1-unit-per-meter scale, with headroom to spare under the ~5-unit ceiling). Verified via headless Chrome + SwiftShader: camera now sits at `floorY + 1.6 ≈ 1.62`, correctly above `MainRoom_Floor`, and the rendered screenshot shows a completely different, correctly-elevated standing perspective (not the marginal shift the two prior "30%" passes produced). **Lesson: a hand-tuned magic constant carried over from a replaced asset is a prime root-cause suspect once relative (percentage-based) tweaks to it visibly do nothing — verify the constant's sign/magnitude against the new asset's actual geometry (via glTF node/bbox inspection) rather than continuing to scale it.**
    After this fix, the user kept iterating on eye height with further relative "increase/decrease by N%" requests (all applied the same way: shrink/grow the signed `playerHeight`'s magnitude by N%, since less-negative/more-positive = higher). One request — "revert to original position, then move up 20%" — was ambiguous between the known-broken `-1.3601` and the fixed `1.6`; asked the user directly via `AskUserQuestion` rather than guessing, since reverting to the broken constant would silently reintroduce the underground bug just explained. The user explicitly chose the literal original (`-1.3601`), so subsequent "+20%" requests were applied to that broken baseline as asked (now `-1.3601 × 0.8 × 0.8 × 0.9`, still underground, just less deep each time) — complied with the explicit choice rather than re-litigating it, but the in-code comment and every reply flagged that it's still underground so the user always knows the current state.

36. **New debug key: `P` dumps the live camera position/angle as a ready-to-paste spawn override, and the site now opens on a fixed user-chosen spawn point instead of the auto-detected one.** The user wanted the page to always open at one specific, exact spot/angle in `portfolio_scene.glb` (a framed view of the green central-column pillar with doors either side) — impossible to reproduce precisely from a screenshot alone (especially the look direction), so a new debug key was added alongside the existing R/F height keys in `src/main.js`: pressing `P` logs and copies to the clipboard a snippet (`spawnPos = new THREE.Vector3(x,y,z); spawnYaw = …; spawnPitch = …;`) built from the live `camera.position`/`yaw`/`pitch`. The user pressed it in their own Safari tab at the desired spot and pasted the result back. That exact position/rotation is now hardcoded right after the existing floor-probe spawn logic in the `GLTFLoader.load()` callback: `camera.position.set(2.2970, -0.7653, 9.6615); yaw = 2.3400; pitch = 0.0540; applyRotation();`, then `spawnPos`/`spawnYaw`/`spawnPitch` are re-captured from those values (so the reset-view behavior returns here too). **Important subtlety this relied on:** `yaw`/`pitch` alone do nothing to the camera until `applyRotation()` (`camera.rotation.y = yaw; camera.rotation.x = pitch`) is actually called — the pre-existing floor-probe spawn code only ever *stored* `spawnYaw`/`spawnPitch` for later, it never called `applyRotation()` at spawn (which is why every previous spawn always faced the default yaw=0/pitch=0 direction regardless of the probed position). The floor-probe/collision-detection code above the override is deliberately left untouched — `floorY`, `collidables`, and `clickables` from that pass are still needed for live movement collision and the per-frame `floorY + playerHeight + bob` height system; only the *final* camera position/rotation gets overridden. Verified via headless Chrome: console log confirms `Kamerastart: x=2.30 y=-0.77 z=9.66`, and a screenshot comparison shows the same pillar/doors/ceiling framing as the user's reference screenshot.

37. **`vaccine3d.html` deleted; clicking a 3D-scene object now navigates directly to its 2D page instead of opening an overlay, and 4 more project objects got wired up.** Previously only the Vaccine podium was interactive, and clicking it opened `#project-overlay` (a scaled-iframe popup embedding `vaccine3d.html`, a standalone Blender-viewport-style page). All of that — `vaccine3d.html`, `#project-overlay`/`#project-wrapper`/`#project-frame` markup in `index.html`, matching CSS in `src/style.css`, and the whole overlay apparatus in `src/main.js` (`scaleProjectFrame`, `VACCINE_NATIVE_W`, its resize/click/escape/close-button listeners) — was removed. The click handler now does `window._nav(data.url + '?from=3d', 'left')` (the same slide-transition helper the site already uses for 2D↔3D navigation) instead of opening an overlay. The podium mesh itself (`NewRoom_Podium`) was deliberately dropped from `CONTENT` — clicking the pedestal now does nothing, only the bottle sitting on it navigates. Four more project pivots got wired to their pages in `CONTENT`: `Pivot_MacLamp`/`Pivot_MacLamp_Table` → `/mac-lamp2d.html`, `egg-rig` → `/kaffeemaschine2d.html`, `Pivot_UNify` → `/unify2d.html`, `Pivot_VRPanel` → `/virtual_cooking2d.html` (plus the existing bottle → `/vaccine2d.html`). Verified by dumping the live `clickables` array's mesh names from the running scene.

38. **3D-linked project pages show a fixed "Exit" pill instead of the usual nav bar, positioned to never overlap the page frame's border.** The `?from=3d` query param added in item 37 is checked by a small script added to the end of all 5 project pages (`vaccine2d.html`, `mac-lamp2d.html`, `kaffeemaschine2d.html`, `unify2d.html`, `virtual_cooking2d.html`): if present, it hides `#top-bar` and injects a fixed pill linking back to `/`. Originally placed top-right, then moved to top-left per request, with a live-measured position: it sits `24px` from the viewport edge while there's room for the whole button in `.page-wrapper`'s outer margin, and switches to `wrapperLeft + 16px` (tucked just inside the frame) the moment the margin would shrink enough for the border to pass under it — matches this codebase's established pattern of measuring real geometry via `getBoundingClientRect()` rather than guessing a CSS breakpoint (see the dot-divider fix). Verified across four viewport widths (1920/1440/1000/700px): zero overlap with the border at any of them, confirmed both numerically and via screenshot.

39. **Root-caused "the other 3D objects don't open their project pages" — two separate bugs, one already fixed in Blender, one a false alarm.** The user reported the Unify figure, Cybercoffee egg, and VR panel weren't clickable even standing right in front of them. Investigation initially misfired twice: a first click-simulation test used stale camera matrices (calling `project()` before `updateMatrixWorld()`, giving nonsense NDC coordinates for 2 of 6 objects) and a second aimed at `egg-body`'s own transform pivot, which — as later confirmed by inspecting its world-space bounding box — sits outside its own visible geometry, so "aim exactly at the object's position" missed the mesh entirely; both were artifacts of the *test method*, not real bugs (a grid of clicks across the actual visible mesh area hit reliably everywhere). The user separately had another Claude instance investigate on the **Blender** side and found the real cause: earlier in-session Blender work had merged/reparented the egg and VR-panel meshes and duplicated the Unify creature, which silently renamed the *reachable* in-room copies away from the names `CONTENT` matches on (`egg-rig`, `Pivot_VRPanel`, `Pivot_UNify`) — those names still existed, but only on unreachable staging duplicates parked off in the portfolio row (~y 38–55) that a player can never walk to. Fixed with **Blender renames only, no code change**: the reachable objects were renamed back to `egg-rig`/`Pivot_VRPanel`/`Pivot_UNify` (the staging duplicates renamed to `*_staging` first so Blender didn't collide/append `.001`), then `portfolio_scene.glb` was re-exported. Verified after re-export: live `clickables` array grew from 8 to 32 meshes across all 7 `CONTENT` keys, and a full click-simulation pass confirmed all 5 project objects now correctly fire `window._nav()` with the right URL. **Separately flagged, and disproven:** the Blender-side investigation, parsing the raw GLB file, found the bottle's node name has a literal space (`"bottle body_Podest"`) versus `CONTENT`'s underscore key (`'bottle_body_Podest'`) and suspected this as a live bug. Checking the *loaded* Three.js scene (not the raw file) showed the object's actual runtime `.name` is `"bottle_body_Podest"` — Three.js's GLTFLoader normalizes the space to an underscore on import, so this never manifested as a real mismatch; no fix was needed. **Lesson: when a "found via static file inspection" bug report and "found via live browser testing" disagree, trust the live runtime — the loader can normalize things the raw file's bytes don't show.**

40. **Clicking a 3D-scene object and then hitting "Exit" now returns to the exact spot/angle you clicked from, instead of resetting to the fixed spawn.** Since item 37 replaced the old overlay with a real page navigation, the round trip is a full reload of `index.html` — the entire Three.js scene tears down and reinitializes, so there's no in-memory state to fall back on. Fixed with `sessionStorage` (the same mechanism the page-slide transition already uses for its own direction flag): right before `window._nav()` fires in the click handler, `{x, y, z, yaw, pitch}` is saved to `sessionStorage['_3dReturnState']`. In the `GLTFLoader.load()` callback, right where the fixed-spawn override (item 36) used to unconditionally set `camera.position`/`yaw`/`pitch`, it now first checks for this saved state — if present, it's read, parsed, applied, and **immediately removed from `sessionStorage`**, and the fixed spawn is skipped entirely; if absent (a fresh visit — direct link, bookmark, or the nav bar's own 2D→3D toggle), the fixed spawn runs exactly as before. Consuming (not just reading) the saved state on every load is what keeps this safe: a subsequent fresh visit after a restore has nothing left to accidentally reuse. Verified with a full round-trip test in a single tab (sessionStorage doesn't survive across tabs, only within one, so this only works right for real users clicking through in the same tab — matches how they'd actually use it): moved the camera to an arbitrary test position/angle near the bottle, dispatched a real click (not a direct `window._nav()` call, so the actual save-on-click code path ran), confirmed `vaccine2d.html?from=3d` loaded with the exact position saved in `sessionStorage`, then navigated back to `/` (simulating the Exit button) and confirmed the camera landed back at that exact position/angle rather than the fixed spawn — and confirmed `sessionStorage['_3dReturnState']` was `null` afterward, proving the consume-once behavior. Works for the Exit button (a plain `<a href="/">`) and the browser's native back button equally, since both are just navigations to `/` in the same tab and `sessionStorage` doesn't care which one triggered it.

41. **3D-linked project pages also hide the `.project-nav` prev/next footer, not just the top nav bar.** A 3D-scene click is meant to open exactly one project page with no way to hop sideways to a different project — the prev/next footer (e.g. "01 << PREVIOUS UNIFY" / "NEXT >> 03 CYBERCOFFEE") let you do exactly that, so it defeats the point of the `?from=3d` mode. Same `?from=3d` script block added in item 38 (all 5 project pages) now also does `document.querySelector('.project-nav').style.display = 'none'` right alongside hiding `#top-bar`. Normal 2D access (no query param) is completely unaffected — the footer and its working prev/next links stay exactly as they were. Verified across all 5 pages in both states: `.project-nav` computes to `display: flex` with no Exit button present under normal access, and `display: none` with the Exit button present under `?from=3d`.

42. **`about3d.html`'s content scrolled with a visible native scrollbar inside the 3D scene's About overlay.** Unlike `contact3d.html` (`html, body { overflow: hidden }`), `about3d.html` never set an `overflow` rule on `html, body` — its accordion + photo content is legitimately taller than the fixed `#about-wrapper` box it's embedded in via iframe, so the iframe's own document scrolled natively and showed a scrollbar down its right edge. Clipping it outright (`overflow: hidden`, matching Contact) wasn't the right fix here, since About's content is genuinely taller than the box and needs to stay reachable — the fix instead was to keep it scrollable but hide the scrollbar chrome, reusing the exact `scrollbar-width: none` / `::-webkit-scrollbar { display: none }` pattern already used site-wide on the 2D pages for their own custom `#scroll-track` UI. Verified: `getComputedStyle(document.documentElement).scrollbarWidth` now reports `"none"` while `scrollHeight` (890px) still exceeds `clientHeight` (600px) — content stays fully scrollable, just without the visible scrollbar.
    `severance_V23.glb` has since been deleted by the user (see item 43).

43. **This session (loading screen, controls intro, i18n sweep, GLB rename).**
    - **Loading screen on `index.html`:** full-screen page-colored overlay, centered neumorphic circle (pressed inset shadow, max 192px) filling bottom-up with orange liquid (rotating-wave surface) and a VT323 0→100% counter. Driven by real GLTF download progress (`loader.load` onProgress in `src/main.js`) with easing; a **3-second minimum fill time** caps the target at `elapsed/3000` so fast loads still animate. On 100% it fades (1.2s) and removes itself; also dismisses on load error. **Gated to once per tab** — see "Intro gate" below.
    - **Fullscreen controls intro (`public/controls_fullscreen3d.html`):** shown automatically beneath the fading loader via a hidden fixed iframe in `index.html` (`z-index: 9999`, transparent background). Content panel matches the windowed controls overlay's size (66.66vw × 66.66vh, opaque `--bg-base` inside its thin border); the area outside is a translucent `rgba(220,220,227,0.85)` veil over the scene. Any click/key posts `intro-controls-dismiss` → parent fades (700ms) and removes the iframe. The old first-visit auto-open of the windowed controls overlay (`localStorage._seenIntro` in `src/main.js`) was **removed** — this intro replaces it; the "?" button still opens the windowed overlay.
    - **Intro gate (`window._introGate`, `index.html`):** one small script above `#load-overlay` decides ONCE per page load whether *both* the loading screen and the controls intro run, and stores the answer on `window._introGate.show`. Each of the two blocks checks it and, if false, removes its own element and returns early — the loader additionally never defines `window._loader`, which is the whole opt-out since `src/main.js` only ever calls it behind `if (window._loader)`. The `#intro-controls` iframe deliberately has **no `src` in the markup**; it's assigned from JS only when the intro will actually show, so a gated reload doesn't fetch `controls_fullscreen3d.html` at all (still early enough to preload during the 3s minimum fill).
      **The store is `sessionStorage.introSeen`, and that choice is the whole behaviour:** sessionStorage survives reloads within a tab but the browser wipes it when the tab closes — so the intro is skipped on every reload (including a hard reload) *and* on returning from a 2D project page in the same tab, but plays again in a genuinely fresh tab. **`localStorage` would be wrong** (shows once ever, then never again). The flag is set immediately on load rather than when the loader finishes, so reloading part-way through still counts as seen. Wrapped in `try/catch` so private mode / disabled storage falls back to showing rather than throwing.
      Deliberate edge cases: session restore (Cmd+Shift+T, "reopen windows from last time") and tab duplication both carry sessionStorage over, so the intro stays skipped there. Verified over CDP across fresh-tab / reload / reload-again / new-tab. **When testing this, wait for a real `Page.loadEventFired` before probing** — a fixed delay can read the pre-reload document and make a correctly-gated reload look like it still showed the intro.
    - **i18n sweep — every remaining untranslated element wired for EN+DE:** the five 3D overlay pages (`about3d`, `contact3d`, `craft3d`, `controls_open3d`, `controls_fullscreen3d`) had **no i18n at all** — each now has a small self-contained script (inline `T = {de:…, en:…}`, `data-i18n`/`data-i18n-html` attributes) that reads `localStorage.lang` on load (default `'de'`) and re-applies on the `storage` event, so switching language in the nav updates already-open overlays. about3d's German copy is 1:1 from about2d's TRANSLATIONS (its accordion `max-height: 700px` has headroom for the longer German). Also wired: breadcrumbs on kaffeemaschine/mac-lamp/vaccine (`Portfolio / Projekte / …`); `2D.html` "Project 01–05"→"Projekt", "top"→"oben", tags Industrial→Industrie / Fabrication→Fertigung / Lighting→Beleuchtung / Texturing→Texturierung; the **mobile hamburger menu** (Craft/About/Contact → Projekte/Über mich/Kontakt) on all 8 2D pages + `index.html` (which got its own mini i18n block listening for the nav's `lang-change` postMessage); contact Email→E-Mail (2D+3D); Cybercoffee "[ click me ]"→"[ klick mich ]". Proper nouns (project names, Blender/Figma/LinkedIn, Campus/Studio/Mobile/Prototyping) deliberately left untranslated. Controls DE: STEUERUNG / BEWEGEN / KAMERA / ANSEHEN / RESET.
    - **GLB renamed + cleanup (user-driven):** the scene model is now `public/current🟢.glb` (was `portfolio_scene.glb`, briefly `portfolio_scene🔴.glb`); `src/main.js` loads `/current🟢.glb`. `severance_V23.glb` deleted from disk.

44. **This session (3D lighting rebuilt around the ceiling fixtures; intro gated to once per tab; 3D-page slide-in removed).**
    - **Lighting rebuilt — see "3D Mode: Lighting" below for the full mechanism.** Short version: the rooms were flat because 2.0 of the 2.5 total light intensity was direction-less fill (`AmbientLight 0.6` + `HemisphereLight 1.4`), and a third uncounted flood — `scene.environment` from `RoomEnvironment`, added so metals aren't black — was lighting every PBR material at full strength. Fill cut to `0.08`/`0.18`/`0.12`, `scene.environmentIntensity = 0.22` added, `toneMappingExposure` `0.3 → 0.55`, and 5 real `PointLight`s now sit at the emissive ceiling fixtures. **Three.js has no global illumination, so an emissive material glows but casts zero light** — this is why the "lit by its ceiling panels" look could never come from Blender alone.
    - **NewRoom (brown podium room) is a `SpotLight`** — `angle 0.5` rad, `penumbra 0.55`, `intensity 70`, plus a co-located `PointLight` at `16` as fill so the walls keep a warm gradient (that fill is the "make it less drastic" dial). Only small props cast shadows (`SHADOW_CASTER_MAX_SIZE = 6`) so walls/ceilings don't dump the room's own shell into the shadow map. `dirLight.castShadow` was turned **off**: it had been `true` but inert (nothing had `receiveShadow`), and enabling receivers would have switched it on with its default ±5-unit shadow camera, clipping into a hard visible edge across MainRoom.
    - **PinkRoom has no emissive ceiling fixture at all**, so it gets no fixture light and reads darker than the others. Needs an emissive ceiling material in Blender plus a `FIXTURE_LIGHTS` entry if that's unwanted.
    - **Intro gate** — loading screen + controls intro now run once per tab via `sessionStorage.introSeen`. See the "Intro gate" bullet under item 43.
    - **3D-page horizontal slide-in REMOVED** (`index.html`). Arriving at the 3D page used to hold the entire `<html>` element off-screen at `translateX(±100%)` with `overflow: hidden`, then animate it in over 380ms via injected `_sR`/`_sL` keyframes, with `#top-bar` counter-animated in the opposite direction so the nav appeared stationary. All of it deleted along with its now-unused `KF`/`DUR`/`EASE`/`OPP` locals — the scene just appears, and the orange-bubble loader covers any wait. **`sessionStorage.removeItem('_sv')` is still called on load and must stay:** a 2D page sets `_sv` on its way out, and without the 3D page consuming it the flag would linger and fire a stray slide on whatever page was visited next. **The 2D pages still slide in** — that is a separate implementation living in each 2D page's own script (each animates a wrapper element, guards on `prefers-reduced-motion`, and defines its own `_sR`/`_sL` keyframes), so nothing was shared with the 3D page and nothing there was touched. Verified over CDP: 14 samples across the load window show zero transform/animation on `<html>` or `#top-bar`.

## Project-page section sub-headings (`.feature-title`)

Sub-headings inside a project section, above a per-item image/video. **OCR-A-BT only — there is no orange kicker.** Unify originally had a `.feature-kicker` (small orange VT323 label like `03 — SOZIALES`) above each title; that pattern was extended to Virtual Cooking and Mac-Lamp and then **removed everywhere on 2026-07-30 per Lucas — the orange label didn't work for him. Do not reintroduce it.** Zero `feature-kicker` references remain site-wide.

```css
.feature-title {
  font-family: 'OCR-A-BT', monospace;
  font-size: clamp(20px, 2.6vw, 26px);   /* NOT Unify's clamp(22px, 3vw, 34px) */
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}
```

**Size matters:** on Virtual Cooking / Mac-Lamp these are sub-items inside a section that already has a `.section-title` at `clamp(28px, 4vw, 44px)`, so they use the smaller ramp (matching `.result-subhead`) to stay below it. Unify's are top-level per-feature headings and keep the larger ramp.

**Where they are, and where they deliberately are NOT.** Only content that is genuinely *one discrete named item per visual* gets a heading:
- **Unify** — 6 feature panels (`feat-home/timetable/socials/friends/courses/settings-title`)
- **Virtual Cooking** — the 3 `.stagger-row` panel blocks in "Design process" (`panel-manual/ingredients/timer-title`)
- **Mac-Lamp** — the 4 Process stages (`process-cad/print/cut/sand-title`)
- **Cybercoffee** — none, by explicit decision
- **Double Packaging** — not done yet
- **Skipped on every page:** At a Glance, meta grids, `.section-title`s (they already carry the shared OCR-A-BT + dotted-divider rhythm), multi-paragraph prose sections (kickers/headings fragment a single continuous argument), and "Final result" demo blocks.

**Two retrofit gotchas, both hit in practice:**
1. `.stagger-copy` (Virtual Cooking) and `.lamp-scrolly-panel` (Mac-Lamp) were `<p>` elements — they cannot hold a heading. Each needed a container. For **`.lamp-scrolly-panel` the class and its `data-step` must stay on the container**: the scrolly JS toggles `.is-active` by matching `p.dataset.step`, and the CSS positions/fades that element. The body copy moves to an inner `<p class="guide-text">`.
2. Moving a `max-width` off the old paragraph onto the new wrapper means **every responsive override of that width must move too** — Virtual Cooking's `@media (min-width:1600px) and (min-aspect-ratio:17/10)` had to split into separate `.stagger-body` and `.stagger-copy` rules, or the text column silently loses its constraint on wide monitors.

**`data-i18n` is applied with `textContent`, not `innerHTML`** — so a translation value must contain a real `&`, never `&amp;`, or the entity renders literally as "Profil &amp; Freunde". Use `data-i18n-html` if a value genuinely needs markup.

## 3D Mode: Lighting

All illumination is created in `src/main.js` — **the Blender scene contains zero light objects.** Do lighting work in the code, not Blender: Three.js has no global illumination, so emissive materials glow without casting light, and iterating in Blender would cost a full GLB re-export per tweak. Only the fixture's *appearance* (its emissive material) belongs in Blender.

**Knobs, in the order to reach for them:**
1. `renderer.toneMappingExposure` (currently `0.55`) — overall brightness.
2. `scene.environmentIntensity` (currently `0.22`) — flatness vs. contrast. `RoomEnvironment` is a bright studio-lit room acting as a full IBL on every material; at full strength it flattens everything and **no amount of trimming `AmbientLight`/`HemisphereLight` will touch it**. Raise if metals look dead.
3. Per-room `intensity`/`color`/`angle` in the `FIXTURE_LIGHTS` table.

**`FIXTURE_LIGHTS` matches on the EMISSIVE MATERIAL name, never the mesh name.** Two hard-won reasons:
- A Blender object with two materials (base + emissive) exports as one glTF node with two primitives, which `GLTFLoader` splits into a `Group` whose child meshes are named after Blender's **mesh-data** name plus an index — unrelated to the object name and effectively unpredictable. Measured: object `Ceiling_Cassettes` arrives as **`Ceiling004_1`**, and `NewRoom_Ceiling` arrives as **`MainRoom_Ceiling_Mesh_1`**. Exact object-name matching silently found neither.
- Where a material is reused on non-ceiling geometry (`BlueRoom_EmissivePanel` is also on the front wall, floor and podium tops), add a mesh-name guard.

**Position from the geometry bounding box, not `getWorldPosition()`.** `getWorldPosition()` returns the transform *origin*, which in this scene is frequently left at the world origin while the geometry sits tens of units away — `NewRoom_Ceiling`'s origin is `(0,0,0)` but its geometry is at `(−19.5, −1.2, 5.25)`, so using the origin drops NewRoom's light into MainRoom. Also drop the light below `box.min.y`, not below the centre: the fixture slab has thickness, so centre-minus-a-nudge is still *inside* the mesh — invisible for a shadowless `PointLight`, but it makes a spot's own fixture geometry occlude its entire beam.

**`EMISSIVE_CLAMP = 2.0`.** Fixtures are authored in Blender at wildly inconsistent emission strengths (`NewRoom_CeilingLight_Warm` = 60, `Ceiling_Light` = 25, YellowRoom `Ceiling` = 5.5, `BlueRoom_EmissivePanel` = 1.5). Blender exports these via `KHR_materials_emissive_strength` and Three.js applies them as `material.emissiveIntensity`, so at 60 the fixture is ~18× over pure white after tone mapping and **hard-clips to a flat white disc, losing its colour entirely.** Clamping restores a bright-but-tinted glow. Small accent emissives (`Lamp_*` at 1.0, `M_Purple` at 0.18) are below the clamp and untouched.

**A `SpotLight` needs its `target` positioned AND added to the scene** — it defaults to the world origin, so miss either step and the cone aims sideways across the whole building with no error. Spots are the affordable way to get shadows here: one 2D shadow map versus a shadow-casting `PointLight`'s 6 cube faces. Shadows are desktop-only (`renderer.shadowMap.enabled = !isMobile`), so on phones a spot degrades to cone falloff with no contact shadow.

## 3D Mode: Camera Controls

Look-around (yaw/pitch) is hand-rolled in `src/main.js` — no OrbitControls/Three.js addon, just raw pointer/wheel events driving `camera.rotation` directly (`camera.rotation.order = 'YXZ'` so yaw/pitch don't fight each other).

**Desktop — click-drag to look:**
- Triggered by **right-click OR middle-click** (`e.button === 2 || e.button === 1`) — see item 22 above; originally right-click only.
- `isLookDown` flag set true on `mousedown`, false on `mouseup`; while true, `mousemove` deltas drive `yaw`/`pitch` at `MOUSE_SENS = 0.003`.
- `contextmenu` is globally suppressed (`e.preventDefault()`) so right-click-drag doesn't pop the browser context menu; middle-click gets the same treatment via `auxclick` (middle-click otherwise triggers OS-level autoscroll).
- `pitch` is clamped to `±(π/2 − 0.01)` (`clampPitch()`) so you can't flip past straight up/down.

**Desktop — scroll wheel:** `wheel` event also nudges `yaw`/`pitch` (`SCROLL_SENS = 0.003`), independent of the click-drag path — lets you look around without holding a mouse button.

**Mobile — touch swipe with inertia:** single-finger drag on the canvas (`touchstart`/`touchmove`) drives the same yaw/pitch at `TOUCH_SENS = 0.004`, with velocity tracked per-frame and inertia decay (`INERTIA_DECAY = 5.0`) so a fast swipe keeps coasting briefly after release, matching the general "momentum projection" feel used elsewhere in the site's interactions.

**If adding a new input method (e.g. two-finger drag, a dedicated look-joystick):** hook into the same `yaw`/`pitch` variables + `clampPitch(); applyRotation();` pair — don't build a parallel rotation path, since `applyRotation()` is the single place that writes `camera.rotation`.

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

## Deployment

**Live at:** `https://lucasmaher.com` (custom domain) and `https://lucasmaher-hash.github.io/3d-Portfolio-current/` (GitHub Pages default URL, still works).

**Repo:** `github.com/lucasmaher-hash/3d-Portfolio-current` — public (required for free-tier GitHub Pages on a private repo you'd need a paid plan). Was renamed from `first_3d_web_draft-main`; GitHub auto-redirects the old remote URL, but the local `origin` was updated to the new one directly.

**How it deploys:** `.github/workflows/deploy.yml` — GitHub Actions builds with `npm ci && npm run build` and deploys `dist/` via `actions/deploy-pages`, triggered on every push to `main` (or manually via "Run workflow" in the Actions tab). Nothing manual needed for routine updates — commit, push, done. Pages source is set to **"GitHub Actions"** in Settings → Pages (not "Deploy from a branch").

**Custom domain wiring:**
- `public/CNAME` contains `lucasmaher.com` — lives in `public/` specifically so Vite copies it into `dist/` on every build (a repo-root-only `CNAME` would NOT reach the deployed site, since GitHub Actions deploys `dist/`, not the raw repo)
- Domain also saved under Settings → Pages → Custom domain on GitHub's side (this is what actually triggers Let's Encrypt certificate issuance — the file alone isn't enough)
- Domain registered via **Cloudflare Registrar** (`lucasmaher.com`)
- DNS records at Cloudflare: 4 **A** records on `@` → GitHub Pages' IPs (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`), plus 1 **CNAME** on `www` → `lucasmaher-hash.github.io`
- **All records set to "DNS only" (grey cloud), not "Proxied" (orange cloud).** Cloudflare's proxy sits in front of the domain and can block GitHub from validating ownership to issue the HTTPS certificate. Can revisit proxying later once HTTPS is confirmed stable — not attempted yet.
- HTTPS certificate issued and confirmed working same-day; propagation + cert issuance together took under an hour

**If the site ever needs to move off this domain/repo:** update `public/CNAME`, the Settings → Pages custom domain field, and the DNS records together — they're three independent places holding the same domain name, and Pages will misbehave if only some of them are updated.

## Known Patterns & Gotchas

- **`clip-path: inset(0 0 -1px 0)` on `.project-section`** in `2D.html` — clips top/left/right to contain the neumorphic tile shadows, but the bottom edge is relaxed by 1px so the `border-bottom` divider is never clipped off at fractional device-pixel heights (was `inset(0)`, which intermittently ate the dividers)
- **Widescreen-only tweaks — use the fraction ratio syntax:** `@media (min-width: 1600px) and (min-aspect-ratio: 17/10)`. **`min-aspect-ratio: 1.7` (decimal) is silently ignored by Safari** — always write it as `17/10` (or `16/10`). MacBook screens are ~1.54 aspect, so `17/10` (1.7) targets 16:9 monitors; `16/10` (1.6) also catches 16:10 monitors. For "center on wide, unchanged on MacBook" prefer a **fluid `calc()` width** over a breakpoint (see Unify `.character-list`) — it needs no media query and can't mis-match.
- **Below-MacBook shrink (site-wide, all 8 non-3D pages): outer padding fades to 0 gradually between 1440px→860px, borders vanish exactly at 860px, and desktop windows are capped from shrinking further.** Previously the outer padding used `clamp(20px, 3.9vw, 55px)` (floor 20px, never 0) and a separate `@media (max-width: 640px)` rule hard-snapped padding/margin/border to 0 — a visible jump rather than a fade, and it happened at 640px (where the nav *also* switches to its hamburger), not the wider point the design called for. Fixed with three pieces, present on every page's `html, body` rule:
  1. **Fluid padding, exact zero at 860px:** `padding: 0 clamp(0px, calc(9.483vw - 81.552px), 55px);`. This is a straight-line interpolation between `(1440px → 55px)` and `(860px → 0px)` expressed in `vw` — solve `55px = m·1440px + b` and `0 = m·860px + b` and the coefficients fall out (`m = 55/(1440-860) = 9.483vw`, `b = -m·860px = -81.552px`). The outer `clamp(0px, …, 55px)` just holds the two ends flat past their target widths, so behavior above 1440px and below 860px is unchanged from before. Verified via CDP at 1150px (exact midpoint) → `27.5px`, precisely half of 55px.
  2. **Border/margin removal, synced to the same 860px point:** a border can't fade sub-pixel, so it's cut outright — `@media (max-width: 860px) { html, body { padding: 0; } .page-wrapper { margin: 0; border-left: none; border-right: none; } }`. Because the padding formula already reaches exactly 0 at that width, there's no visible jump. The *existing* `@media (max-width: 640px)` block still exists for the real mobile layout (hamburger nav, stacked grids, etc.) — it just had its padding/margin/border lines **removed** (now redundant, handled by the 860px rule) and everything else left untouched.
  3. **Desktop-only shrink cap:** `@media (hover: hover) and (pointer: fine) { html, body { min-width: 860px; } }`. Below 860px, a real desktop/laptop (mouse or trackpad) stops reflowing further — the browser window can keep narrowing, but the page content stays pinned at 860px and the excess is silently clipped by the existing root `overflow-x: clip` (no horizontal scrollbar ever appears; vertical scroll is untouched). `pointer: fine` + `hover: hover` specifically targets non-touch input, so **real phones/tablets are unaffected** and keep reflowing all the way down to their actual widths via the normal 640px mobile rules — verified via CDP touch emulation (`pointer: coarse`): at 600px viewport, `body.scrollWidth` correctly tracked the real 600px, not the 860px desktop pin.
  **Two pages (`vaccine2d.html`, `virtual_cooking2d.html`) had `overflow-x: hidden` instead of `clip`** — changed to `clip` for consistency and because `hidden` would turn `html`/`body` into a scroll container, breaking `position: sticky` if either page ever grows a sticky section (see the `overflow-x: clip` gotcha above). **Two pages (`2D.html`, `about2d.html`, `contact2d.html`) had no `overflow-x` at all** (default `visible`) — added `clip`, required for the min-width cap's overflow to actually stay hidden instead of showing a scrollbar. **If a new 2D page is ever added, copy all three pieces from any existing page's `html, body` block — don't just copy the old `clamp(20px, 3.9vw, 55px)` pattern.**
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
  - `.page-wrapper` must be `overflow: visible` (not `hidden`) so nav dropdown doesn't get clipped — EXCEPT pages using sticky scroll sections, where `.page-wrapper` needs `overflow: clip` instead (see below)
  - Root `html`/`body` must be `overflow-x: clip` (not `hidden`) so sticky positioning doesn't break
  - `.project-section` uses `clip-path: inset(0)` to prevent shadow bleed without breaking stickiness
  - **This trap recurs on every new page that adds a sticky/scrolly section**, because new 2D pages get bootstrapped by copying an older page's `<style>` block, and older pages predate the `clip` fix — they still have `overflow-x: hidden` on `html, body` and/or `overflow: hidden` on `.page-wrapper`. Both silently kill `position: sticky` for every descendant with zero console error; the symptom is a sticky element rendering static plus a mysterious empty gap where the pin should have held it in view. Hit this on Unify originally and again on Mac-Lamp's Process section this session. **Always check both `html,body` and `.page-wrapper` for stray `overflow: hidden` before debugging a sticky element any other way.**
- **i18n on Unify:** Meta tiles + feature copy are filled (EN+DE) in the `TRANSLATIONS` object at the bottom of `unify2d.html`. The newer design-story sections (colors/typography/characters) are plain English in the HTML, not yet keyed into `TRANSLATIONS`. **EN + DE only — no French.**
- **Virtual Cooking layout:** rebuilt (this session) — At a Glance lead + meta grid + Identifying the problem + Design process (staggered `.stagger-*` panels + `.process-shot` screenshots) + Final result. All text is `[ Placeholder ]`. Reuses `.guide-section` / `.guide-media` classes.
- **Dotted dividers (`.dot-divider`) — the fix is JS-computed exact tiling, NOT a CSS `background-repeat` value.** The pattern is a `radial-gradient(circle, ... 1.5px, transparent 1.5px)` background tiled at `background-size: 10px 4px`. With `repeat-x`, a container width that isn't an exact multiple of 10px leaves a **partial last tile that gets clipped** — a half-cut dot at the end of the line, and *intermittent* (whether you see it depends on where `width mod 10px` falls). **First attempt this session — switching to `background-repeat: space` — looked correct in Chrome (confirmed via isolated test) but did NOT fix it in Safari:** WebKit has a longstanding bug where `space` doesn't reliably avoid clipping on gradient-image backgrounds, so the half-dot persisted for the user even after that change shipped. **Actual fix:** a small inline `<script>` at the bottom of each page (right before `</body>`) that, on `DOMContentLoaded`/`load`/`resize`, measures every `.dot-divider`'s real `offsetWidth` and sets `background-size` to `width / Math.round(width / 10)` (min 2 dots) with plain `background-repeat: repeat-x`. Because that tile size is an *exact* integer divisor of the measured width, there is no remainder pixel left for any browser's tiling engine to mis-handle — this sidesteps the Safari bug entirely rather than depending on a spec behavior WebKit doesn't honor correctly. Added to the 8 pages that actually render a `.dot-divider` in markup (`about2d.html`, `contact2d.html`, `kaffeemaschine2d.html`, `mac-lamp2d.html`, `portfolio2d.html`, `unify2d.html`, `vaccine2d.html`, `virtual_cooking2d.html` — `2D.html` and the `*3d.html` pages carry the CSS rule but never actually use the class, so they were skipped). **If a new dotted divider is added anywhere, it needs this same JS snippet, not just the CSS class** — copy the `<script>` block verbatim from any of the 8 pages above.
- **Standard hover-lift strength (site-wide convention, unified this session):** every interactive lift-on-hover element — nav `.logo`/`.pill` (`top_row_permanent_V3.html`), footer `.footer-logo` "top" button, contact page `.contact-item` (Email/LinkedIn/Instagram), about page's `.item` accordion rows, `.btn-view-work`, and every project page's `.project-nav-item` / `.gallery-thumb` — now uses the **same** transform, `translateY(-2px) scale(1.03)`, over `transition: transform 150ms ease` (box-shadow pairs with `box-shadow 150ms ease` where the element has a neumorphic base shadow). Neumorphic pill elements (raised dual-shadow base — nav, footer top button, contact buttons, about accordion) deepen to the same shadow on hover: `box-shadow: 11px 11px 24px rgba(174,174,192,0.9), -8px -8px 20px rgba(255,255,255,1)`. Before this session `.contact-item`/`.item` used a shallower `6px 6px 18px` shadow and several `.project-nav-item`/`.btn-view-work` instances used `scale(1.04)` or `translateY(-3px)` — all now normalized to the values above. **When adding any new hoverable element, match these exact values** rather than inventing a new lift strength.
- **Absolutely positioned `<img>`/`<video>` needs explicit `width`/`height` — `inset` alone will NOT size it.** A replaced element (`img`, `video`) with `position: absolute` and `width`/`height` left at `auto` ignores `inset`/`top`+`bottom`+`left`+`right` for sizing and falls back to its own intrinsic pixel dimensions instead (CSS2.1 replaced-element rules) — this shipped visibly broken once this session (every project hero rendered zoomed into a tiny crop; see item 19 in "Recent Changes"). Always pair `inset: -Npx` (or `top`/`left`) with explicit `width: calc(100% + 2×Npx); height: calc(100% + 2×Npx);` when overscanning a replaced element to hide a sub-pixel gap.
- **NEVER put an entrance animation that touches `transform` on the same element as a `:hover { transform }` — move the animation to a wrapper `<div>`.** This cost three debugging passes on `about2d.html` (`.item` accordion rows) and `contact2d.html` (`.contact-item` buttons), where the hover targets also carried the `.anim` staggered fade-in (`@keyframes fadeUp` animates `opacity` **and** `transform: translateY`). Two separate failure modes stack up:
  1. **With `animation-fill-mode: forwards`,** the animation keeps asserting its final keyframe (`transform: translateY(0)`) forever after finishing, and **CSS animations outrank normal author declarations in the cascade**, so it beats `:hover { transform }` outright — the lift never applies.
  2. **Even after switching to `backwards`,** Safari keeps a *finished* animation attached to the element and lets it **suppress the `transition`** on the property it animated. So `transform` jumped with no easing while `box-shadow` (absent from the keyframes) eased normally.
  Both modes present the same misleading symptom: **a "flicker"** — a shadow changing with either no movement at all, or with movement that snaps instantly. It looks like a value/duration problem and it is not; **tuning values or easing curves cannot fix it, and `fill-mode` only masks mode 1 in Chrome.** The only robust fix is structural — keep the animation and the hover on **different elements**:
  ```html
  <!-- animation on the wrapper, hover on the inner element -->
  <div class="anim anim-2">
    <a class="contact-item">…</a>
  </div>
  ```
  Confirm the fix by checking the hover target reports `getComputedStyle(el).animationName === "none"` and `el.getAnimations().length === 0`. **These were the only two pages with `.anim` on a hoverable element** (all others checked), which is exactly why the nav and the homepage "top" button never exhibited it. **Diagnostic rule: if a hover transform does nothing, or flickers, or won't ease — look for a competing `animation` on that element before touching a single value.**
- **A real CSS border beats an absolutely-positioned pseudo-element for "draw a line spanning this box."** Twice this session (see item 20 in "Recent Changes"), a divider built as `::after { position: absolute; top: 0; bottom: <value>; }` failed to reliably reach the container's true edge — first because a negative `bottom` value depended on how an ancestor's `overflow: hidden`/`clip` trimmed it (inconsistent, Safari especially), then because `bottom: 0` only matched the *pseudo-element's own* containing block, not the visual edge the user actually wanted. The fix that actually held up: a real `border-left`/`border-top` etc. on an already-correctly-sized flexbox/grid item — borders automatically span the box's full rendered dimension with zero positioning math and zero overflow-dependence. **Prefer a real border over an absolutely-positioned divider whenever the layout (flex/grid stretch) already gives the element the right size.**
