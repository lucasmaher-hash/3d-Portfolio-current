import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x0d0d14)
scene.fog = new THREE.Fog(0x0d0d14, 10, 60)

// Camera – YXZ order so yaw/pitch don't interfere
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.01, 1000)
camera.rotation.order = 'YXZ'

// Renderer
const isMobile = navigator.maxTouchPoints > 0
const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance' })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = !isMobile
renderer.outputColorSpace = THREE.SRGBColorSpace
document.body.appendChild(renderer.domElement)

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.8))
const dirLight = new THREE.DirectionalLight(0xffffff, 2.0)
dirLight.position.set(5, 8, 5)
dirLight.castShadow = true
scene.add(dirLight)

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

let playerHeight = -1.3601
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
})

let collidables = []
let clickables  = []

// ── Inhaltsverzeichnis: Objektname → Overlay-Inhalt ──────────────
const CONTENT = {
  'YellowRoom_CoffeeTable001': {
    title: 'Coffee Table',
    image: '',
    text:  'Placeholder-Text für den Coffee Table. Hier kannst du eine Beschreibung, Geschichte oder Information zu diesem Objekt eintragen.'
  },
  'NewRoom_Podium': {
    title: 'Vaccine Project',
    url: '/vaccine3d.html'
  }
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
  '/severance_V23.glb',
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

    console.log(`Modellgröße: x=${size.x.toFixed(2)} y=${size.y.toFixed(2)} z=${size.z.toFixed(2)}`)
    console.log(`floorY=${floorY.toFixed(3)} | playerHeight=${playerHeight.toFixed(4)} | spawnFound=${spawnFound}`)
    console.log(`Kamerastart: x=${camera.position.x.toFixed(2)} y=${camera.position.y.toFixed(2)} z=${camera.position.z.toFixed(2)}`)
  },
  undefined,
  err => console.error('GLB load error:', err)
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

// ── Project Overlay ──────────────────────────────────────────────
const projectOverlay = document.getElementById('project-overlay')

function ensureOverlayFrameLoaded(id) {
  const frame = document.getElementById(id)
  if (!frame) return
  const src = frame.dataset.src
  if (src && frame.src !== src) frame.src = src
}

const VACCINE_NATIVE_W = 1512

function scaleProjectFrame() {
  const frame    = document.getElementById('project-frame')
  const isMobileCoarse = window.matchMedia('(pointer: coarse)').matches
  const topbarH  = isMobileCoarse ? 57 : 0
  const wrapFrac = isMobileCoarse ? 0.85 : 0.6666
  const wrapW    = window.innerWidth  * wrapFrac
  const wrapH    = window.innerHeight * wrapFrac - topbarH
  const scale    = wrapW / VACCINE_NATIVE_W
  frame.style.width     = VACCINE_NATIVE_W + 'px'
  frame.style.height    = Math.round(wrapH / scale) + 'px'
  frame.style.transform = `scale(${scale})`
}

window.addEventListener('resize', scaleProjectFrame)

projectOverlay.addEventListener('click', e => {
  if (e.target === projectOverlay) {
    projectOverlay.classList.remove('open')
    isOverlayOpen = false
  }
})

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
  if (projectOverlay.classList.contains('open')) {
    projectOverlay.classList.remove('open')
    isOverlayOpen = false
  }
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
      ensureOverlayFrameLoaded('project-frame')
      projectOverlay.classList.add('open')
      isOverlayOpen = true
      scaleProjectFrame()
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
  ['project-close-btn',  () => { projectOverlay.classList.remove('open'); isOverlayOpen = false }],
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
  ['project-back-btn',  () => { projectOverlay.classList.remove('open'); isOverlayOpen = false }],
].forEach(([id, closeFn]) => {
  document.getElementById(id)?.addEventListener('click', () => {
    closeFn()
    openMobileMenu()
  })
})

