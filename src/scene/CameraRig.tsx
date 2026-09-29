import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getProject } from '../data/projects'
import { currentRoute, useRoute } from '../lib/route'
import { ui, worldClock } from '../lib/store'
import { isNarrow, isTouch, useReducedMotion } from '../lib/device'
import { damp } from './common'

/**
 * Orbit-style camera with damping:
 *  - drag / touch-drag → rotate, wheel / pinch → zoom (bounded)
 *  - subtle mouse parallax, slow idle drift
 *  - cinematic ease towards a project when one is opened, with the frustum shifted so the
 *    object sits beside the detail panel instead of behind it.
 */

const PHI_MIN = 0.62
// low enough to glimpse the hull and engines under the flying stadium
const PHI_MAX = 1.42
const HOME_TARGET = new THREE.Vector3(0, 0.7, 0)

const wrapNear = (angle: number, ref: number) => {
  const TAU = Math.PI * 2
  return angle + Math.round((ref - angle) / TAU) * TAU
}

export function CameraRig() {
  const { camera, gl, size } = useThree()
  const route = useRoute()
  const reduced = useReducedMotion()

  const aspect = size.width / size.height
  const fov = aspect < 0.8 ? 50 : 38
  const homePhi = aspect < 0.8 ? 0.72 : 0.96
  /** Distance at which the whole pitch fits the viewport horizontally. */
  const homeRadius = () => {
    const halfH = Math.atan(Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect)
    // fit the pitch (plus a bit of stand) horizontally
    // (a bit of margin so the glowing rim of the flying platform and the clouds show)
    return THREE.MathUtils.clamp((aspect < 0.8 ? 11 : 19.5) / Math.tan(halfH), 28, 66)
  }
  const s = useRef({
    theta: 0.08,
    phi: 1.02,
    radius: 80, // start far away: intro fly-in
    target: HOME_TARGET.clone(),
    gTheta: 0.08,
    gPhi: 1.02,
    gRadius: 25,
    gTarget: HOME_TARGET.clone(),
    userRadius: 25,
    offX: 0,
    offY: 0,
    px: 0,
    py: 0,
    lastInteract: 0,
  })

  // keep the resting zoom sensible for the viewport
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.fov = fov
    cam.updateProjectionMatrix()
    s.current.userRadius = homeRadius()
    if (currentRoute().name === 'world') {
      s.current.gRadius = s.current.userRadius
      s.current.gPhi = homePhi
      // portrait: look down the length of the pitch so it fills the tall screen
      if (aspect < 0.8) s.current.gTheta = wrapNear(Math.PI / 2 - 0.08, s.current.theta)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height])

  // react to route changes: focus a project / the avatar, or return home
  useEffect(() => {
    const st = s.current
    if (route.name === 'project') {
      const p = getProject(route.slug)!
      const [x, , z] = p.position
      st.gTarget.set(x, 0.9 * p.scale, z)
      // objects face outwards (local +z), so view them from outside at a 3/4 angle
      st.gTheta = wrapNear(p.rotation[1] + 0.3, st.theta)
      st.gPhi = 0.98
      st.gRadius = (isNarrow() ? 12 : 9.5) * p.scale
    } else if (route.name === 'about') {
      // frame the avatar from the knees up
      st.gTarget.set(0, 1.9, 0)
      st.gPhi = 1.4
      st.gRadius = isNarrow() ? 7.2 : 5.2
    } else if (route.name === 'contact') {
      st.gTarget.copy(HOME_TARGET)
      st.gPhi = 0.9
      st.gRadius = st.userRadius * 1.15
    } else {
      st.gTarget.copy(HOME_TARGET)
      st.gPhi = THREE.MathUtils.clamp(st.gPhi, homePhi - 0.1, homePhi + 0.1)
      st.gRadius = st.userRadius
    }
  }, [route, homePhi])

  // pointer / wheel / pinch controls
  useEffect(() => {
    const el = gl.domElement
    const pointers = new Map<number, { x: number; y: number }>()
    let pinch = 0
    const st = s.current
    const canOrbit = () => ui.get().sceneReady && location.hash.replace(/^#\/?/, '') === ''

    const down = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      st.lastInteract = performance.now()
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        pinch = Math.hypot(a.x - b.x, a.y - b.y)
      }
    }
    const move = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      st.px = ((e.clientX - rect.left) / rect.width) * 2 - 1
      st.py = ((e.clientY - rect.top) / rect.height) * 2 - 1
      const prev = pointers.get(e.pointerId)
      if (!prev || !canOrbit()) return
      if (pointers.size === 2) {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
        const [a, b] = [...pointers.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (pinch > 0) zoom((pinch - d) * 0.05)
        pinch = d
        return
      }
      const dx = e.clientX - prev.x
      const dy = e.clientY - prev.y
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (Math.abs(dx) + Math.abs(dy) > 1 && ui.get().cursor !== 'drag' && e.buttons) ui.set({ cursor: 'drag' })
      const k = isTouch() ? 0.008 : 0.005
      st.gTheta -= dx * k
      st.gPhi = THREE.MathUtils.clamp(st.gPhi - dy * k * 0.7, PHI_MIN, PHI_MAX)
      st.lastInteract = performance.now()
    }
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      pinch = 0
      if (ui.get().cursor === 'drag') ui.set({ cursor: ui.get().hovered ? 'project' : 'default' })
    }
    const zoom = (delta: number) => {
      const max = homeRadius() * 1.35
      // closer than ~18 the camera would end up behind the near stand
      st.userRadius = THREE.MathUtils.clamp(st.userRadius + delta, 18, max)
      st.gRadius = st.userRadius
      st.lastInteract = performance.now()
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      if (!canOrbit()) return
      zoom(e.deltaY * 0.012)
    }

    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl])

  const tmp = useRef(new THREE.Vector3())

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const st = s.current
    const cam = camera as THREE.PerspectiveCamera
    const focused = route.name !== 'world'

    // world clock: calm the stadium while something is open; freeze it for reduced motion
    worldClock.scale = reduced ? 0 : damp(worldClock.scale, route.name === 'project' ? 0.2 : 1, 2.5, dt)
    worldClock.t += dt * worldClock.scale

    // idle drift
    if (!focused && !reduced && performance.now() - st.lastInteract > 5000) st.gTheta += dt * 0.035

    const k = reduced ? 60 : focused ? 2.4 : 3.5
    st.theta = damp(st.theta, st.gTheta, k, dt)
    st.phi = damp(st.phi, st.gPhi, k, dt)
    st.radius = damp(st.radius, st.gRadius, reduced ? 60 : 1.8, dt)
    st.target.x = damp(st.target.x, st.gTarget.x, k, dt)
    st.target.y = damp(st.target.y, st.gTarget.y, k, dt)
    st.target.z = damp(st.target.z, st.gTarget.z, k, dt)

    // parallax (desktop only)
    const par = !reduced && !isTouch() ? (focused ? 0.015 : 0.05) : 0
    const theta = st.theta - st.px * par
    const phi = st.phi - st.py * par * 0.6

    tmp.current.setFromSphericalCoords(st.radius, phi, theta)
    cam.position.copy(st.target).add(tmp.current)
    cam.lookAt(st.target)

    // shift the frustum so the focused object sits beside the overlay panel
    const narrow = size.width < 760
    const panelSide = route.name === 'project' || route.name === 'about'
    const gx = panelSide && !narrow ? -size.width * 0.2 : 0
    const gy = panelSide ? size.height * (narrow ? 0.24 : route.name === 'project' ? 0.1 : 0) : 0
    st.offX = damp(st.offX, gx, reduced ? 60 : 3, dt)
    st.offY = damp(st.offY, gy, reduced ? 60 : 3, dt)
    if (Math.abs(st.offX) > 0.5 || Math.abs(st.offY) > 0.5) {
      cam.setViewOffset(size.width, size.height, st.offX, st.offY, size.width, size.height)
    } else if (cam.view?.enabled) {
      cam.clearViewOffset()
    }
  })

  return null
}
