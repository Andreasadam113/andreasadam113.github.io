import { createContext, useContext, useEffect, useMemo, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { worldClock } from '../lib/store'

export const palette = {
  night: '#0b0a14',
  ink: '#f3ede4',
  amber: '#ffb35c',
  holo: '#62f0e6',
  turf: '#2a463c',
  rock: '#3a2b40',
  stone: '#26222f',
  mdf: '#c99a62',
  concrete: '#5d5a68',
}

/** Per-project interaction state, eased 0..1, readable inside useFrame. */
export type NodeState = { hover: number; focus: number }
export const NodeContext = createContext<RefObject<NodeState> | null>(null)
export function useNodeState() {
  const ctx = useContext(NodeContext)
  if (!ctx) throw new Error('useNodeState outside ProjectNode')
  return ctx
}

/** useFrame with the shared (slow-down-able) world time. */
export function useWorldFrame(cb: (t: number, dt: number) => void) {
  useFrame((_, delta) => cb(worldClock.t, Math.min(delta, 0.1) * worldClock.scale))
}

export const damp = (current: number, target: number, lambda: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt))

/** Deterministic pseudo-random generator so the stadium looks the same on every visit. */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ---------------------------------------------------------------------------------- */
/* Flowing dashed "tactics route" material — the visual thread of the whole stadium.  */
/* ---------------------------------------------------------------------------------- */

const routeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const routeFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uDashes;
  uniform float uSpeed;
  varying vec2 vUv;
  void main() {
    float d = fract(vUv.x * uDashes - uTime * uSpeed);
    float dash = smoothstep(0.0, 0.12, d) * (1.0 - smoothstep(0.5, 0.62, d));
    float ends = smoothstep(0.0, 0.06, vUv.x) * (1.0 - smoothstep(0.94, 1.0, vUv.x));
    float a = (0.25 + 0.75 * dash) * ends * uOpacity;
    gl_FragColor = vec4(uColor * (1.0 + dash), a);
  }
`

export function useRouteMaterial(color: string, dashes = 18, speed = 0.6, opacity = 0.9) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: routeVertex,
        fragmentShader: routeFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
          uDashes: { value: dashes },
          uSpeed: { value: speed },
        },
      }),
    [color, dashes, speed, opacity],
  )
  useEffect(() => () => mat.dispose(), [mat])
  useWorldFrame((t) => {
    mat.uniforms.uTime.value = t
  })
  return mat
}

/* ---------------------------------------------------------------------------------- */
/* Soft light-beam cone (fake volumetric light).                                        */
/* ---------------------------------------------------------------------------------- */

const beamVertex = /* glsl */ `
  uniform float uHeight;
  varying float vH;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    vH = position.y / uHeight + 0.5;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`
const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vH;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    float edge = pow(abs(dot(vN, vView)), 1.6);
    float a = pow(vH, 1.4) * edge * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }
`

export function makeBeamMaterial(color: string, height: number, opacity = 0.18) {
  return new THREE.ShaderMaterial({
    vertexShader: beamVertex,
    fragmentShader: beamFragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uHeight: { value: height },
    },
  })
}

/* ---------------------------------------------------------------------------------- */
/* Canvas textures for screens, engravings and labels.                                */
/* ---------------------------------------------------------------------------------- */

export function useCanvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void, deps: unknown[] = []) {
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    return { canvas, texture }
  }, [width, height])

  useEffect(() => {
    draw(canvas.getContext('2d')!)
    texture.needsUpdate = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, texture, ...deps])

  useEffect(() => () => texture.dispose(), [texture])

  return {
    texture,
    redraw: (fn: (ctx: CanvasRenderingContext2D) => void) => {
      fn(canvas.getContext('2d')!)
      texture.needsUpdate = true
    },
  }
}

let glowTex: THREE.Texture | null = null
/** Radial gradient sprite used for lamp halos and soft glows. */
export function glowTexture() {
  if (glowTex) return glowTex
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  glowTex = new THREE.CanvasTexture(c)
  return glowTex
}

/** Curve → tube geometry helper. */
export function tubeFrom(points: THREE.Vector3[], radius = 0.03, segments = 64, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal')
  return new THREE.TubeGeometry(curve, segments, radius, 6, closed)
}
