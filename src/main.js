import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x0d0d14)
scene.fog = new THREE.Fog(0x0d0d14, 10, 60)

// Camera – YXZ order so yaw/pitch don't interfere
// near=0.1 (was 0.01): depth precision is concentrated near the near plane, so a
// 0.01/1000 range (100,000:1) left almost no precision at the ~8-16 unit distances
// objects actually sit at. The centre tower's panels and their grid lattice are only
// 0.022 apart — inside one depth quantum at that range — so which drew in front
// flipped with sub-pixel camera motion, causing a 1-frame brightness flash while
// moving. 0.1 is a 10x precision gain and ~10cm, closer than the player can get.
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.rotation.order = 'YXZ'

// Renderer
const isMobile = navigator.maxTouchPoints > 0
const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance' })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = !isMobile
renderer.outputColorSpace = THREE.SRGBColorSpace
// Tone mapping — without this, bright values (e.g. the emissive ceiling tiles,
// meant to read as glowing light sources) hard-clip to flat white instead of
// rolling off, and that clipping was also blowing out walls/floor nearby.
renderer.toneMapping = THREE.ACESFilmicToneMapping
// 0.3 was chosen back when 2.0 of the 2.5 total light intensity was flat ambient +
// hemisphere fill; that much uniform fill needed crushing down to not look washed out.
// Now that the rooms are lit by real PointLights at the ceiling fixtures (with proper
// 1/d² falloff) there is far less light to tame, so the exposure comes back up.
// This is the single best knob for overall "too bright / too dark" — adjust it first.
renderer.toneMappingExposure = 0.55
document.body.appendChild(renderer.domElement)

// Environment map — gives metalness/roughness materials something to reflect.
// Without this, any metallic material renders black/dead (no IBL to sample).
const pmremGenerator = new THREE.PMREMGenerator(renderer)
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture
// ...but RoomEnvironment is a BRIGHT studio-lit room, and as scene.environment it acts
// as a full image-based light on every PBR material — not just the metals it was added
// for. At full strength that is a large, perfectly uniform, direction-less flood which
// is a major reason the rooms read as flat, and it is invisible to any amount of
// trimming AmbientLight/HemisphereLight. Turning it down keeps metals alive (they still
// have something to reflect) while letting the ceiling fixtures actually shape the room.
// Raise this if metallic surfaces start looking dead; lower it for more contrast.
scene.environmentIntensity = 0.22

// Lights
// The rooms are meant to read as lit by their emissive ceiling fixtures. That CANNOT
// come from the emissive materials themselves — Three.js has no global illumination,
// so an emissive surface glows visually but casts exactly zero light. The actual
// illumination therefore comes from a real PointLight parked at each fixture's own
// position; see addFixtureLights() in the model-load callback below.
//
// These three are FILL ONLY — they exist to keep unlit corners (and PinkRoom, which
// has no emissive ceiling fixture at all) from going pure black. They are deliberately
// tiny. Previously they were ambient 0.6 + hemisphere 1.4 + directional 0.5, i.e. 2.0
// of the 2.5 total intensity was non-directional fill that lit every surface uniformly
// with no falloff — which is why the rooms read as flat and the light appeared to come
// from nowhere in particular. A DirectionalLight also emits parallel rays from
// infinitely far away, so it can never read as a localised fixture no matter where
// it is positioned; it is kept here only as a weak top-down shaper.
scene.add(new THREE.AmbientLight(0xffffff, 0.08))
scene.add(new THREE.HemisphereLight(0xffffff, 0xb0b0b0, 0.18))
const dirLight = new THREE.DirectionalLight(0xffffff, 0.12)
dirLight.position.set(0, 10, 0)
dirLight.castShadow = true
scene.add(dirLight)

// ── Ceiling-fixture lighting ─────────────────────────────────────
// One PointLight per emissive ceiling fixture, matched BY MESH NAME and positioned at
// that mesh's own world position. Name-matching (rather than hardcoded coordinates) is
// deliberate and load-bearing: the model is recentred at load time via
// model.position.sub(center), so its world coordinates shift whenever the Blender
// scene's bounding box changes — and Blender is Z-up while glTF is Y-up, so any
// coordinate copied out of Blender would also need a (x, z, -y) swap. Matching on the
// name sidesteps all three failure modes.
//
// TUNING: `intensity` is in candela and falls off as 1/d² (decay = 2), so illuminance
// on a floor ~5 units below a fixture is intensity/25. `distance` is a hard cutoff —
// it is kept just large enough to reach that room's own far corners, which also stops
// one room's light bleeding through the walls into its neighbours (these lights cast
// no shadows, so `distance` is the only thing containing them; 5 shadow-casting
// PointLights would mean 5 cube shadow maps per frame, which is far too expensive).
// Matched on the EMISSIVE MATERIAL name, not the mesh name. Two reasons, both learned
// the hard way:
//   1. A Blender object with two materials (base + emissive fixture) exports as one
//      glTF mesh with two primitives, which Three.js splits into a Group whose children
//      are named "<node>_0" / "<node>_1". So `name === 'Ceiling_Cassettes'` never
//      matches any Mesh — the Group holds that name and Groups are not meshes.
//      Ceiling_Cassettes and NewRoom_Ceiling are both 2-primitive nodes.
//   2. The material IS the fixture's real identity; the mesh name is incidental.
// Where a material is reused on non-ceiling geometry (BlueRoom_EmissivePanel is also on
// the front wall, floor and podium tops) a mesh-name guard narrows it to the ceiling.
const FIXTURE_LIGHTS = [
  // MainRoom — cool white cassette ceiling, room radius ~10.6, fixture at z 5.2
  { test: (n, mats) => mats.includes('Ceiling_Light'),
    color: 0xf2f7ff, intensity: 70, distance: 15 },
  // NewRoom / brown podium room — warm amber, room ~15.9 wide, fixture at z 5.25
  { test: (n, mats) => mats.includes('NewRoom_CeilingLight_Warm'),
    color: 0xffc773, intensity: 55, distance: 13 },
  // YellowRoom — warm, TWO separate ceiling panels (YellowRoom_Ceiling + .001), each
  // ~16 x 7.7, so this intentionally matches twice and yields two lights. The grid bars
  // use material 'Grid', not 'Ceiling', so they are excluded by the material match alone.
  { test: (n, mats) => mats.includes('Ceiling') && n.startsWith('YellowRoom_Ceiling'),
    color: 0xffebc7, intensity: 45, distance: 12 },
  // BlueRoom — cool blue panels, room ~11.8 x 10.7. Material guard + name guard.
  { test: (n, mats) => mats.includes('BlueRoom_EmissivePanel') && n.includes('Ceiling'),
    color: 0xb8dbff, intensity: 45, distance: 12 },
]

// Emissive fixtures are authored in Blender at wildly inconsistent strengths
// (NewRoom_CeilingLight_Warm = 60, Ceiling_Light = 25, YellowRoom Ceiling = 5.5,
// BlueRoom_EmissivePanel = 1.5). Blender exports those via KHR_materials_emissive_strength
// and Three.js applies them as material.emissiveIntensity — so at 60 the fixture is
// ~18x over pure white after tone mapping and hard-clips to a flat WHITE disc, losing
// its warm colour entirely. Clamping the hot ones brings them back to a bright-but-
// tinted glow. Small accent emissives (Lamp_* at 1.0, M_Purple at 0.18) are left alone.
const EMISSIVE_CLAMP = 2.0

function addFixtureLights(model) {
  const seen = []
  model.traverse(child => {
    if (!child.isMesh) return

    // Rein in over-bright emissives so the fixture reads as coloured light, not white.
    const mats = Array.isArray(child.material) ? child.material : [child.material]
    for (const m of mats) {
      if (m && m.emissiveIntensity > EMISSIVE_CLAMP) m.emissiveIntensity = EMISSIVE_CLAMP
    }

    const matNames = mats.filter(Boolean).map(m => m.name)
    const spec = FIXTURE_LIGHTS.find(f => f.test(child.name, matNames))
    if (!spec) return

    // Position from the GEOMETRY BOUNDING BOX, not getWorldPosition(). getWorldPosition
    // returns the object's transform ORIGIN, and several of these fixtures have their
    // Blender origin left at the world origin while the geometry itself sits tens of
    // units away — NewRoom_Ceiling's origin is (0,0,0) but its geometry is at
    // (-19.5, -1.2, 5.25), so using the origin would drop NewRoom's light into MainRoom.
    const pos = new THREE.Box3().setFromObject(child).getCenter(new THREE.Vector3())
    // Nudge the light just below the fixture surface so it lights the room rather
    // than being co-planar with (and partly occluded by) the ceiling geometry.
    pos.y -= 0.15

    const light = new THREE.PointLight(spec.color, spec.intensity, spec.distance, 2)
    light.position.copy(pos)
    scene.add(light)
    seen.push(`${child.name} @ ${pos.x.toFixed(1)},${pos.y.toFixed(1)},${pos.z.toFixed(1)}`)
  })
  console.log(`Fixture-Lichter: ${seen.length}`, seen)
  if (seen.length === 0) {
    console.warn('Keine Fixture-Lichter gefunden — Mesh-Namen im GLB haben sich geändert? ' +
                 'FIXTURE_LIGHTS in src/main.js prüfen.')
  }
}

// ── Camera rotation ──────────────────────────────────────────────
let yaw   = 0
let pitch = 0
let spawnPos = null
let spawnYaw = 0
let spawnPitch = 0
const MOUSE_SENS  = 0.003
const SCROLL_SENS = 0.003
const PITCH_LIMIT = Math.PI / 2 - 0.01

function clampPitch() {
  pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch))
}
function applyRotation() {
  camera.rotation.y = yaw
  camera.rotation.x = pitch
}

let isLookDown = false
let lastX = 0, lastY = 0

renderer.domElement.addEventListener('mousedown', e => {
  if (isOverlayOpen) return
  if (e.button === 2 || e.button === 1) {
    if (e.button === 1) e.preventDefault()   // stop middle-click autoscroll
    isLookDown = true
    lastX = e.clientX
    lastY = e.clientY
    document.body.classList.add('looking')
  }
})
window.addEventListener('mouseup', e => {
  if (e.button === 2 || e.button === 1) { isLookDown = false; document.body.classList.remove('looking') }
})
window.addEventListener('contextmenu', e => e.preventDefault())
window.addEventListener('auxclick', e => { if (e.button === 1) e.preventDefault() })
window.addEventListener('mousemove', e => {
  if (!isLookDown || isOverlayOpen) return
  yaw   -= (e.clientX - lastX) * MOUSE_SENS
  pitch -= (e.clientY - lastY) * MOUSE_SENS
  lastX  = e.clientX
  lastY  = e.clientY
  clampPitch(); applyRotation()
})
renderer.domElement.addEventListener('wheel', e => {
  e.preventDefault()
  if (isOverlayOpen) return
  yaw   += e.deltaX * SCROLL_SENS
  pitch += e.deltaY * SCROLL_SENS
  clampPitch(); applyRotation()
}, { passive: false })

// ── Touch swipe camera look + inertia ────────────────────────────
const TOUCH_SENS    = 0.004
const INERTIA_DECAY = 5.0   // higher = snappier stop; fast swipes coast longer naturally
let cameraTouchId = null
let lastTouchX = 0, lastTouchY = 0
let yawVel = 0, pitchVel = 0  // radians per frame (smoothed)

renderer.domElement.addEventListener('touchstart', e => {
  if (isOverlayOpen || cameraTouchId !== null) return
  cameraTouchId = e.changedTouches[0].identifier
  lastTouchX    = e.changedTouches[0].clientX
  lastTouchY    = e.changedTouches[0].clientY
  yawVel = 0; pitchVel = 0  // kill leftover inertia on new touch
}, { passive: true })

renderer.domElement.addEventListener('touchmove', e => {
  if (cameraTouchId === null || isOverlayOpen) return
  e.preventDefault()
  for (const t of e.changedTouches) {
    if (t.identifier !== cameraTouchId) continue
    const dyaw   = (t.clientX - lastTouchX) * TOUCH_SENS
    const dpitch = (t.clientY - lastTouchY) * TOUCH_SENS
    lastTouchX = t.clientX
    lastTouchY = t.clientY
    yaw   += dyaw
    pitch += dpitch
    clampPitch(); applyRotation()
    // EMA smoothing so single-frame noise doesn't corrupt the kick velocity
    yawVel   = yawVel   * 0.5 + dyaw   * 0.5
    pitchVel = pitchVel * 0.5 + dpitch * 0.5
    break
  }
}, { passive: false })

renderer.domElement.addEventListener('touchend', e => {
  for (const t of e.changedTouches)
    if (t.identifier === cameraTouchId) { cameraTouchId = null; break }
}, { passive: true })

// ── Virtual joystick ──────────────────────────────────────────────
const JOYSTICK_MAX = 33
let joystickTouchId = null
let joystickX = 0, joystickY = 0
const joystickBase  = document.getElementById('joystick-base')
const joystickThumb = document.getElementById('joystick-thumb')

if (joystickBase) {
  joystickBase.addEventListener('touchstart', e => {
    e.stopPropagation()
    if (joystickTouchId !== null) return
    joystickTouchId = e.changedTouches[0].identifier
  }, { passive: true })

  window.addEventListener('touchmove', e => {
    if (joystickTouchId === null) return
    for (const t of e.changedTouches) {
      if (t.identifier !== joystickTouchId) continue
      const r  = joystickBase.getBoundingClientRect()
      const cx = r.left + r.width  / 2
      const cy = r.top  + r.height / 2
      let dx = t.clientX - cx
      let dy = t.clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > JOYSTICK_MAX) { dx *= JOYSTICK_MAX / dist; dy *= JOYSTICK_MAX / dist }
      joystickThumb.style.transform = `translate(${dx}px,${dy}px)`
      joystickX = dx / JOYSTICK_MAX
      joystickY = dy / JOYSTICK_MAX
      break
    }
  }, { passive: true })

  window.addEventListener('touchend', e => {
    for (const t of e.changedTouches) {
      if (t.identifier !== joystickTouchId) continue
      joystickTouchId = null
      joystickX = 0; joystickY = 0
      joystickThumb.style.transform = 'translate(0,0)'
      break
    }
  }, { passive: true })
}

// ── WASD ─────────────────────────────────────────────────────────
const keys = {}
window.addEventListener('keydown', e => { keys[e.code] = true })
window.addEventListener('keyup',   e => { keys[e.code] = false })

const SPEED          = 3.0
const COLLISION_DIST = 0.4

// NOTE: -1.3601 is the ORIGINAL pre-session constant, hand-tuned for the OLD
// severance_V23.glb scene's coordinate system. It was never re-tuned when
// the model was swapped to portfolio_scene.glb (see CLAUDE.md item 34/35),
// and in the new model's coordinates it puts the camera BELOW the actual
// floor (spawn probe's floorY lands on `MainRoom_Floor` at world Y≈0.018 —
// see item 35 for the full root-cause writeup and glTF-verified room scale,
// ~1 unit ≈ 1 meter). User explicitly chose to keep iterating on this
// known-underground original rather than switch to the root-cause-fixed 1.6
// baseline. Per the confirmed R/F convention (less-negative = higher), each
// requested raise shrinks this negative offset's magnitude by that percent
// (×0.8, ×0.8, now ×0.9) — still underground at every step so far, just
// less deep (currently ~0.77 units below the floor).
let playerHeight = -1.3601 * 0.8 * 0.8 * 0.9
let floorY       = 0

// R = höher, F = tiefer (live, kein Reload nötig)
window.addEventListener('keydown', e => {
  if (e.code === 'KeyR') {
    playerHeight += 0.05
    console.log('R gedrückt — playerHeight:', playerHeight.toFixed(4))
    e.preventDefault()
  }
  if (e.code === 'KeyF') {
    playerHeight -= 0.05
    console.log('F gedrückt — playerHeight:', playerHeight.toFixed(4))
    e.preventDefault()
  }
  // P = dump the current camera position/angle as a ready-to-paste spawn
  // override (also copies to clipboard) — press it while standing where
  // you want the page to spawn, then send the printed snippet back.
  if (e.code === 'KeyP') {
    const snippet = `spawnPos = new THREE.Vector3(${camera.position.x.toFixed(4)}, ${camera.position.y.toFixed(4)}, ${camera.position.z.toFixed(4)}); spawnYaw = ${yaw.toFixed(4)}; spawnPitch = ${pitch.toFixed(4)};`
    console.log('P gedrückt — Spawn-Snippet:', snippet)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(snippet).then(
        () => console.log('(in die Zwischenablage kopiert)'),
        () => {}
      )
    }
    e.preventDefault()
  }
})

let collidables = []
let clickables  = []

// ── Inhaltsverzeichnis: Objektname → Overlay-Inhalt ──────────────
const CONTENT = {
  'YellowRoom_CoffeeTable': {
    title: 'Coffee Table',
    image: '',
    text:  'Placeholder-Text für den Coffee Table. Hier kannst du eine Beschreibung, Geschichte oder Information zu diesem Objekt eintragen.'
  },
  // Project pivots → their 2D project pages. Keyed on the DIRECT parent name
  // of each object's clickable meshes (checked one level up in the click
  // handler below), not the outer Pivot_* group — verified per-mesh via the
  // "Mesh: X | Parent: Y" console logging in the model-load traversal.
  // Only the product objects themselves are clickable (NewRoom_Podium, the
  // display pedestal, is deliberately NOT a key — clicking the podium itself
  // should do nothing, only the bottle sitting on it).
  'bottle_body_Podest': { title: 'Double Packaging', url: '/vaccine2d.html' },        // bottle on NewRoom_Podium
  'bottle_body':        { title: 'Double Packaging', url: '/vaccine2d.html' },        // second bottle instance (Pivot_Bottle)
  'Pivot_MacLamp':       { title: 'Mac-Lamp',         url: '/mac-lamp2d.html' },
  'Pivot_MacLamp_Table': { title: 'Mac-Lamp',         url: '/mac-lamp2d.html' },
  'egg-rig':             { title: 'Cybercoffee',      url: '/kaffeemaschine2d.html' }, // Pivot_Kaffeemaschine's mesh parent
  'Pivot_UNify':         { title: 'Unify',            url: '/unify2d.html' },
  'Pivot_VRPanel':       { title: 'Virtual Cooking',  url: '/virtual_cooking2d.html' },
}

const ray = new THREE.Raycaster()
ray.far = COLLISION_DIST

function canMove(origin, direction) {
  if (collidables.length === 0) return true
  ray.set(origin, direction)
  return ray.intersectObjects(collidables, false).length === 0
}

// ── Load model ───────────────────────────────────────────────────
const loader = new GLTFLoader()
loader.load(
  '/current🟢.glb',
  (gltf) => {
    const model  = gltf.scene
    const box    = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    const size   = box.getSize(new THREE.Vector3())
    model.position.sub(center)
    scene.add(model)

    // Relative Schwellenwerte basierend auf der tatsächlichen Modellgröße
    const thinThresh = size.y * 0.04                        // 4 % der Gebäudehöhe
    const volThresh  = size.x * size.y * size.z * 0.00005  // 0.005 % des Modell-Volumens
    console.log(`Kollisions-Filter: thinThresh=${thinThresh.toFixed(3)}  volThresh=${volThresh.toFixed(3)}`)

    const EXCLUDE_NAMES = ['Grid', 'Rail', 'Gitter']

    model.traverse(child => {
      if (!child.isMesh) return

      const mb     = new THREE.Box3().setFromObject(child)
      const ms     = mb.getSize(new THREE.Vector3())
      const minDim = Math.min(ms.x, ms.y, ms.z)
      const volume = ms.x * ms.y * ms.z

      const nameExcluded = EXCLUDE_NAMES.some(p => child.name.includes(p))
      const isThinCylinder = child.name.includes('Wall_Cylinder') && minDim < thinThresh

      if (nameExcluded || isThinCylinder || (minDim < thinThresh && volume < volThresh)) {
        console.log('Kollision ignoriert:', JSON.stringify(child.name), `minDim=${minDim.toFixed(3)} vol=${volume.toFixed(3)}`)
      } else {
        collidables.push(child)
      }

      console.log('Mesh:', JSON.stringify(child.name), '| Parent:', JSON.stringify(child.parent?.name))
      if (child.name in CONTENT || (child.parent && child.parent.name in CONTENT))
        clickables.push(child)
    })
    console.log('Clickables gefunden:', clickables.length)

    // Place a PointLight at each emissive ceiling fixture (and clamp over-bright
    // emissives). Must run AFTER model.position.sub(center) above, since it reads each
    // fixture's final world position.
    addFixtureLights(model)

    const fixedClearance = size.y * 0.20
    const roofCutoff     = size.y * 0.35  // obere 35% = Dach, wird ausgeschlossen

    const probeRay = new THREE.Raycaster()
    probeRay.far   = size.y * 2
    const down     = new THREE.Vector3(0, -1, 0)
    const probes   = [
      [0, 0], [0, -size.z * 0.15], [0, size.z * 0.15],
      [-size.x * 0.15, 0], [size.x * 0.15, 0],
    ]

    let spawnFound = false
    for (const [ox, oz] of probes) {
      probeRay.set(new THREE.Vector3(ox, size.y / 2, oz), down)
      const hits = probeRay.intersectObjects(collidables, false)

      // Dach explizit ausschließen (obere 35% der Bounding Box)
      const floors = hits
        .filter(h => h.face && h.face.normal.y > 0.5 && h.point.y < roofCutoff)
        .sort((a, b) => a.point.y - b.point.y)  // tiefster Boden zuerst

      for (const hit of floors) {
        const clearRay = new THREE.Raycaster(
          new THREE.Vector3(ox, hit.point.y + 0.02, oz),
          new THREE.Vector3(0, 1, 0), 0, fixedClearance
        )
        if (clearRay.intersectObjects(collidables, false).length > 0) continue

        floorY = hit.point.y
        camera.position.set(ox, floorY + playerHeight, oz)
        spawnPos = camera.position.clone()
        spawnYaw = yaw; spawnPitch = pitch
        spawnFound = true
        break
      }
      if (spawnFound) break
    }

    if (!spawnFound) {
      floorY = -size.y * 0.4  // 40% von unten = knapp über Bodenplatte
      camera.position.set(0, floorY + playerHeight, 0)
      spawnPos = camera.position.clone()
      spawnYaw = yaw; spawnPitch = pitch
    }

    // Fixed initial spawn (user-captured via the P debug key) — overrides
    // the auto-detected floor-probe spawn point above so the page normally
    // opens at this exact position/angle. floorY/collidables from the
    // probing above are kept as-is (still needed for live movement
    // collision + the per-frame floorY+playerHeight+bob height system).
    //
    // EXCEPTION: if the user is returning from a project page's "Exit"
    // button, restore the exact spot they clicked the object from instead
    // (saved to sessionStorage right before navigating away — see the click
    // handler below) so the scene continues where they left it rather than
    // resetting to the fixed spawn every time.
    let restoredReturnState = false
    const returnStateRaw = sessionStorage.getItem('_3dReturnState')
    sessionStorage.removeItem('_3dReturnState')
    if (returnStateRaw) {
      try {
        const rs = JSON.parse(returnStateRaw)
        camera.position.set(rs.x, rs.y, rs.z)
        yaw = rs.yaw
        pitch = rs.pitch
        restoredReturnState = true
      } catch (e) { /* malformed/stale — fall through to the fixed spawn */ }
    }
    if (!restoredReturnState) {
      camera.position.set(2.2970, -0.7653, 9.6615)
      yaw = 2.3400
      pitch = 0.0540
    }
    applyRotation()
    spawnPos = camera.position.clone()
    spawnYaw = yaw
    spawnPitch = pitch

    console.log(`Modellgröße: x=${size.x.toFixed(2)} y=${size.y.toFixed(2)} z=${size.z.toFixed(2)}`)
    console.log(`floorY=${floorY.toFixed(3)} | playerHeight=${playerHeight.toFixed(4)} | spawnFound=${spawnFound}`)
    console.log(`Kamerastart: x=${camera.position.x.toFixed(2)} y=${camera.position.y.toFixed(2)} z=${camera.position.z.toFixed(2)}`)

    if (window._loader) window._loader.done()
  },
  e => {
    // Real download progress for the loading screen (e.total is 0 if the
    // server sends no content-length — then the loader just eases on done())
    if (window._loader && e.total) window._loader.progress(e.loaded / e.total)
  },
  err => {
    console.error('GLB load error:', err)
    if (window._loader) window._loader.done()
  }
)

// ── Render loop ──────────────────────────────────────────────────
let isOverlayOpen = false
let lastCollisionLog = 0
const forward = new THREE.Vector3()
const right   = new THREE.Vector3()
const UP      = new THREE.Vector3(0, 1, 0)
const clock   = new THREE.Clock()

// ── Head bob ─────────────────────────────────────────────────────
let bobTime      = 0
let bobIntensity = 0
const BOB_AMPLITUDE = 0.07   // vertikale Schwingweite in Einheiten
const BOB_FREQ      = 2.0    // Zyklen pro Sekunde (Schrittrhythmus)

function animate() {
  requestAnimationFrame(animate)

  const delta = clock.getDelta()
  camera.getWorldDirection(forward)
  forward.y = 0
  forward.normalize()
  right.crossVectors(forward, UP).normalize()

  if (isOverlayOpen) { renderer.render(scene, camera); return }

  // Touch inertia — coasts after finger lifts, decays exponentially
  if (cameraTouchId === null && (yawVel !== 0 || pitchVel !== 0)) {
    yaw   += yawVel
    pitch += pitchVel
    clampPitch(); applyRotation()
    const decay = Math.exp(-INERTIA_DECAY * delta)
    yawVel   *= decay
    pitchVel *= decay
    if (Math.abs(yawVel) < 0.00005) yawVel = 0
    if (Math.abs(pitchVel) < 0.00005) pitchVel = 0
  }

  const move = new THREE.Vector3()
  if (keys['KeyA'] || keys['KeyD']) move.addScaledVector(right,   keys['KeyD'] ? 1 : -1)
  if (keys['KeyW'] || keys['KeyS']) move.addScaledVector(forward, keys['KeyW'] ? 1 : -1)
  if (joystickX !== 0 || joystickY !== 0) {
    move.addScaledVector(right,   joystickX)
    move.addScaledVector(forward, -joystickY)
  }

  if (move.lengthSq() > 0) {
    move.normalize()
    ray.far = COLLISION_DIST
    ray.set(camera.position, move)
    const hits = ray.intersectObjects(collidables, false)
    if (hits.length > 0) {
      const now = performance.now()
      if (now - lastCollisionLog > 500) {
        lastCollisionLog = now
        console.log('BLOCKIERT von:', JSON.stringify(hits[0].object.name), '| Parent:', JSON.stringify(hits[0].object.parent?.name), '| face:', !!hits[0].face)
      }
    }
    if (hits.length === 0) {
      camera.position.addScaledVector(move, SPEED * delta)
    } else if (hits[0].face) {
      // Wand-Normal in World-Space umrechnen
      const normal = hits[0].face.normal.clone()
      hits[0].object.updateWorldMatrix(true, false)
      normal.transformDirection(hits[0].object.matrixWorld)
      normal.y = 0
      normal.normalize()
      // Bewegung entlang der Wand projizieren (Normal-Anteil entfernen)
      const slide = move.clone().addScaledVector(normal, -move.dot(normal))
      slide.y = 0
      if (slide.lengthSq() > 0.001) {
        slide.normalize()
        ray.set(camera.position, slide)
        if (ray.intersectObjects(collidables, false).length === 0)
          camera.position.addScaledVector(slide, SPEED * delta)
      }
    }
  }

  const isMoving = move.lengthSq() > 0
  bobIntensity += ((isMoving ? 1 : 0) - bobIntensity) * Math.min(1, 7 * delta)
  bobTime      += delta * bobIntensity
  const bob     = Math.sin(bobTime * Math.PI * 2 * BOB_FREQ) * BOB_AMPLITUDE * bobIntensity

  camera.position.y = floorY + playerHeight + bob

  renderer.render(scene, camera)
}

animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// ── Controls Overlay ────────────────────────────────────────────
const controlsOverlay = document.getElementById('controls-overlay')

function openControls() {
  ensureOverlayFrameLoaded('controls-frame')
  controlsOverlay.classList.add('open')
  isOverlayOpen = true
}

function closeControls() {
  controlsOverlay.classList.remove('open')
  isOverlayOpen = false
}

controlsOverlay.addEventListener('click', e => { if (e.target === controlsOverlay) closeControls() })

// The first-visit greeting is now the fullscreen controls intro in index.html
// (shown after the loading screen), so the windowed overlay no longer auto-opens.

// Listen for message from floating button iframe
window.addEventListener('message', e => {
  if (e.data.type === 'openControls') {
    openControls()
  }
})

// ── Craft Overlay ────────────────────────────────────────────────
const craftOverlay = document.getElementById('craft-overlay')

function openCraft() {
  ensureOverlayFrameLoaded('craft-frame')
  craftOverlay.classList.add('open')
  isOverlayOpen = true
}

function closeCraft() {
  craftOverlay.classList.remove('open')
  isOverlayOpen = false
  const topBar = document.getElementById('top-bar')
  if (topBar && topBar.contentDocument) {
    topBar.contentDocument.querySelectorAll('.nav-pill .pill__seg').forEach(s => {
      s.classList.remove('is-active')
      s.setAttribute('aria-selected', 'false')
    })
  }
}

window.openCraftOverlay = openCraft

craftOverlay.addEventListener('click', e => { if (e.target === craftOverlay) closeCraft() })

// ── Contact Overlay ───────────────────────────────────────────────
const contactOverlay = document.getElementById('contact-overlay')

function openContact() {
  ensureOverlayFrameLoaded('contact-frame')
  contactOverlay.classList.add('open')
  isOverlayOpen = true
}

function closeContact() {
  contactOverlay.classList.remove('open')
  isOverlayOpen = false
  const topBar = document.getElementById('top-bar')
  if (topBar && topBar.contentDocument) {
    topBar.contentDocument.querySelectorAll('.nav-pill .pill__seg').forEach(s => {
      s.classList.remove('is-active')
      s.setAttribute('aria-selected', 'false')
    })
  }
}

window.openContactOverlay = openContact

contactOverlay.addEventListener('click', e => { if (e.target === contactOverlay) closeContact() })

// ── About Overlay ────────────────────────────────────────────────
const aboutOverlay = document.getElementById('about-overlay')

function openAbout() {
  ensureOverlayFrameLoaded('about-frame')
  aboutOverlay.classList.add('open')
  isOverlayOpen = true
}

function closeAbout() {
  aboutOverlay.classList.remove('open')
  isOverlayOpen = false
  const topBar = document.getElementById('top-bar')
  if (topBar && topBar.contentDocument) {
    topBar.contentDocument.querySelectorAll('.nav-pill .pill__seg').forEach(s => {
      s.classList.remove('is-active')
      s.setAttribute('aria-selected', 'false')
    })
  }
}

window.openAboutOverlay = openAbout

window.resetScene = function () {
  if (!spawnPos) return
  camera.position.copy(spawnPos)
  yaw   = spawnYaw
  pitch = spawnPitch
  applyRotation()
}

aboutOverlay.addEventListener('click', e => { if (e.target === aboutOverlay) closeAbout() })

function ensureOverlayFrameLoaded(id) {
  const frame = document.getElementById(id)
  if (!frame) return
  const src = frame.dataset.src
  if (src && frame.src !== src) frame.src = src
}

// ── Info-Overlay ─────────────────────────────────────────────────
const infoOverlay = document.getElementById('info-overlay')
const infoTitle   = document.getElementById('info-title')
const infoImage   = document.getElementById('info-image')
const infoText    = document.getElementById('info-text')
const infoClose   = document.getElementById('info-close')

function openOverlay(name) {
  const data = CONTENT[name]
  if (!data) return
  infoTitle.textContent = data.title
  infoText.textContent  = data.text
  if (data.image) {
    infoImage.src = data.image
    infoImage.classList.remove('hidden')
  } else {
    infoImage.src = ''
    infoImage.classList.add('hidden')
  }
  infoOverlay.classList.add('open')
  isOverlayOpen = true
}

function closeOverlay() {
  infoOverlay.classList.remove('open')
  isOverlayOpen = false
}

infoClose.addEventListener('click', closeOverlay)
infoOverlay.addEventListener('click', e => { if (e.target === infoOverlay) closeOverlay() })

// Escape key closes any open overlay
window.addEventListener('keydown', e => {
  if (e.code !== 'Escape') return
  if (aboutOverlay.classList.contains('open')) {
    closeAbout()
  }
  if (contactOverlay.classList.contains('open')) {
    closeContact()
  }
  if (craftOverlay.classList.contains('open')) {
    closeCraft()
  }
  if (controlsOverlay.classList.contains('open')) {
    closeControls()
  }
})

// Raycasting für Klick-Erkennung
const clickRay = new THREE.Raycaster()
const mouse    = new THREE.Vector2()

renderer.domElement.addEventListener('click', e => {
  if (isOverlayOpen) return
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
  clickRay.setFromCamera(mouse, camera)

  // Zuerst gegen ALLE collidables testen, um zu sehen was getroffen wird
  const allHits = clickRay.intersectObjects(collidables, false)
  if (allHits.length > 0) {
    const o = allHits[0].object
    console.log('Geklickt → Mesh:', JSON.stringify(o.name), '| Parent:', JSON.stringify(o.parent?.name))
  }

  const hits = clickRay.intersectObjects(clickables, false)
  if (hits.length === 0) return
  const obj  = hits[0].object
  const name = obj.name in CONTENT ? obj.name : obj.parent?.name
  if (name) {
    const data = CONTENT[name]
    if (data.url) {
      // Save the exact spot we're leaving from so the Exit button on the
      // destination page can bring us right back to it (read back by the
      // restore logic right after the GLTFLoader spawn block above).
      sessionStorage.setItem('_3dReturnState', JSON.stringify({
        x: camera.position.x, y: camera.position.y, z: camera.position.z,
        yaw, pitch
      }))
      // ?from=3d tells the destination page it was opened from the 3D scene,
      // so it swaps its usual nav bar for a fixed "Exit" button that returns
      // here — see the per-page <script> block that checks this param.
      window._nav(data.url + '?from=3d', 'left')
    } else {
      openOverlay(name)
    }
  }
})

// ── Kaffeemaschine Overlay ───────────────────────────────────────
const kaffeemaschineOverlay = document.getElementById('kaffeemaschine-overlay')

function openKaffeemaschine() {
  ensureOverlayFrameLoaded('kaffeemaschine-frame')
  kaffeemaschineOverlay.classList.add('open')
  isOverlayOpen = true
}

function closeKaffeemaschine() {
  kaffeemaschineOverlay.classList.remove('open')
  isOverlayOpen = false
}

window.openKaffeemaschineOverlay = openKaffeemaschine
kaffeemaschineOverlay.addEventListener('click', e => { if (e.target === kaffeemaschineOverlay) closeKaffeemaschine() })

// ── Mobile overlay close buttons ─────────────────────────────────
;[
  ['about-close-btn',          closeAbout],
  ['contact-close-btn',        closeContact],
  ['craft-close-btn',          closeCraft],
  ['controls-close-btn',       closeControls],
  ['kaffeemaschine-close-btn', closeKaffeemaschine],
].forEach(([id, fn]) => {
  document.getElementById(id)?.addEventListener('click', fn)
})

// ── Mobile overlay back buttons (close overlay → reopen menu) ────
const mobileMenu = document.getElementById('mobile-menu')
const openMobileMenu = () => mobileMenu?.classList.add('open')
;[
  ['about-back-btn',          closeAbout],
  ['contact-back-btn',        closeContact],
  ['craft-back-btn',          closeCraft],
  ['controls-back-btn',       closeControls],
  ['kaffeemaschine-back-btn', closeKaffeemaschine],
].forEach(([id, closeFn]) => {
  document.getElementById(id)?.addEventListener('click', () => {
    closeFn()
    openMobileMenu()
  })
})

