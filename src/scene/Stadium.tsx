import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { FIELD } from '../data/field'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { glowTexture, makeBeamMaterial, palette, rng, useWorldFrame } from './common'

/**
 * "Night Match" — an empty field-hockey stadium under floodlights. The blue pitch is the
 * portfolio: projects stand on it like players, Andreas' avatar stands on the centre spot.
 */

const { length: L, width: W, margin: M } = FIELD
const HL = L / 2
const HW = W / 2
const LINE = '#eef3f7'
const Y_TURF = 0.02
const Y_LINE = 0.031

/* ------------------------------------------------------------------ pitch */

function useStripeTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 8
    const g = c.getContext('2d')!
    const n = 14
    for (let i = 0; i < n; i++) {
      g.fillStyle = i % 2 ? '#1c4a86' : '#20548f'
      g.fillRect((i / n) * 512, 0, 512 / n + 1, 8)
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
}

function Line({ x, z, lx, lz }: { x: number; z: number; lx: number; lz: number }) {
  return (
    <mesh position={[x, Y_LINE, z]} receiveShadow>
      <boxGeometry args={[lx, 0.004, lz]} />
      <meshBasicMaterial color={LINE} transparent opacity={0.85} />
    </mesh>
  )
}

function Arc({ x, radius, dashed = false }: { x: number; radius: number; dashed?: boolean }) {
  const s = Math.sign(x)
  // semicircle opening towards the centre of the pitch
  const start = s > 0 ? Math.PI / 2 : -Math.PI / 2
  if (!dashed)
    return (
      <mesh position={[x, Y_LINE, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[radius - 0.06, radius + 0.06, 64, 1, start, Math.PI]} />
        <meshBasicMaterial color={LINE} transparent opacity={0.85} />
      </mesh>
    )
  const n = 18
  return (
    <group position={[x, Y_LINE, 0]} rotation-x={-Math.PI / 2}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i}>
          <ringGeometry args={[radius - 0.05, radius + 0.05, 6, 1, start + (i / n) * Math.PI, (Math.PI / n) * 0.55]} />
          <meshBasicMaterial color={LINE} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function Goal({ x }: { x: number }) {
  const s = Math.sign(x)
  const net = useMemo(() => {
    const pts: number[] = []
    const w = 1.3
    const h = 0.72
    const d = 0.6
    for (let i = 0; i <= 10; i++) {
      const z = -w / 2 + (i / 10) * w
      pts.push(s * d, 0, z, s * d, h, z, 0, h, z, s * d, h, z)
    }
    for (let j = 0; j <= 5; j++) {
      const y = (j / 5) * h
      pts.push(s * d, y, -w / 2, s * d, y, w / 2, 0, y, -w / 2, s * d, y, -w / 2, 0, y, w / 2, s * d, y, w / 2)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [s])
  return (
    <group position={[x, 0, 0]}>
      {[-0.65, 0.65].map((z) => (
        <mesh key={z} position={[0, 0.36, z]} castShadow>
          <boxGeometry args={[0.07, 0.72, 0.07]} />
          <meshStandardMaterial color="#f4f1ea" />
        </mesh>
      ))}
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[0.07, 0.07, 1.37]} />
        <meshStandardMaterial color="#f4f1ea" />
      </mesh>
      {/* backboard */}
      <mesh position={[s * 0.6, 0.12, 0]}>
        <boxGeometry args={[0.04, 0.24, 1.3]} />
        <meshStandardMaterial color="#1b2f55" />
      </mesh>
      <lineSegments geometry={net}>
        <lineBasicMaterial color="#e9e4dc" transparent opacity={0.45} />
      </lineSegments>
    </group>
  )
}

function Pitch() {
  const stripes = useStripeTexture()
  return (
    <group>
      {/* run-off */}
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[L + M * 2, 0.04, W + M * 2]} />
        <meshStandardMaterial color="#2c6048" roughness={0.95} />
      </mesh>
      {/* blue turf */}
      <mesh rotation-x={-Math.PI / 2} position={[0, Y_TURF, 0]} receiveShadow>
        <planeGeometry args={[L, W]} />
        <meshStandardMaterial map={stripes} roughness={0.85} />
      </mesh>

      {/* markings */}
      <Line x={0} z={-HW} lx={L} lz={0.1} />
      <Line x={0} z={HW} lx={L} lz={0.1} />
      <Line x={-HL} z={0} lx={0.1} lz={W} />
      <Line x={HL} z={0} lx={0.1} lz={W} />
      <Line x={0} z={0} lx={0.1} lz={W} />
      <Line x={-FIELD.quarter} z={0} lx={0.08} lz={W} />
      <Line x={FIELD.quarter} z={0} lx={0.08} lz={W} />
      {[-HL, HL].map((x) => (
        <group key={x}>
          <Arc x={x} radius={FIELD.circle} />
          <Arc x={x} radius={FIELD.circle + 1.5} dashed />
          <mesh position={[x - Math.sign(x) * 1.95, Y_LINE, 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.09, 12]} />
            <meshBasicMaterial color={LINE} />
          </mesh>
          <Goal x={x + Math.sign(x) * 0.05} />
        </group>
      ))}
      {/* centre stage ring around the avatar */}
      <mesh rotation-x={-Math.PI / 2} position={[0, Y_LINE, 0]}>
        <ringGeometry args={[2.05, 2.13, 64]} />
        <meshBasicMaterial color={palette.holo} transparent opacity={0.35} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ LED advertising boards */

function useLedTexture() {
  return useMemo(() => {
    const text = [profile.name.toUpperCase(), 'XR DEVELOPMENT', 'GENT', ...projects.map((p) => p.title.split(' — ')[0].toUpperCase())]
    const font = '600 34px Sora, sans-serif'
    const gap = 60
    // measure first, so the canvas is exactly one loop wide and wraps seamlessly
    const probe = document.createElement('canvas').getContext('2d')!
    probe.font = font
    const widths = text.map((t) => probe.measureText(t).width)
    const total = Math.ceil(widths.reduce((a, w) => a + w + gap, 0))
    const c = document.createElement('canvas')
    c.width = total
    c.height = 64
    const g = c.getContext('2d')!
    g.fillStyle = '#07060c'
    g.fillRect(0, 0, total, 64)
    g.font = font
    g.textBaseline = 'middle'
    let x = gap / 2
    text.forEach((t, i) => {
      g.fillStyle = i === 0 ? palette.amber : i % 2 ? '#eef3f7' : palette.holo
      g.fillText(t, x, 34)
      x += widths[i] + gap
      g.fillStyle = '#5b5670'
      g.fillText('•', x - gap / 2 - 6, 34)
    })
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = THREE.RepeatWrapping
    // world units per loop: keep the letters' aspect ratio on a 0.44-high board
    return { tex, loop: (total / 64) * 0.44 }
  }, [])
}

function LedBoards() {
  const { tex, loop } = useLedTexture()
  const boards = useMemo(() => {
    const len = L + M * 2 - 0.4
    const wid = W + M * 2 - 0.4
    const mk = (length: number) => {
      const t = tex.clone()
      t.repeat.x = length / loop
      t.needsUpdate = true
      return t
    }
    return [
      { pos: [0, 0.3, -(HW + M - 0.2)] as const, rot: 0, len, tex: mk(len) },
      { pos: [0, 0.3, HW + M - 0.2] as const, rot: Math.PI, len, tex: mk(len) },
      { pos: [-(HL + M - 0.2), 0.3, 0] as const, rot: Math.PI / 2, len: wid, tex: mk(wid) },
      { pos: [HL + M - 0.2, 0.3, 0] as const, rot: -Math.PI / 2, len: wid, tex: mk(wid) },
    ]
  }, [tex, loop])

  useWorldFrame((t) => {
    for (const b of boards) b.tex.offset.x = (t * 0.02) % 1
  })

  return (
    <group>
      {boards.map((b, i) => (
        <group key={i} position={b.pos as unknown as [number, number, number]} rotation-y={b.rot}>
          <mesh castShadow>
            <boxGeometry args={[b.len, 0.6, 0.12]} />
            <meshStandardMaterial color="#121019" />
          </mesh>
          <mesh position={[0, 0.02, 0.065]}>
            <planeGeometry args={[b.len - 0.1, 0.44]} />
            <meshBasicMaterial map={b.tex} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ stands */

const ROW_H = 0.5
const ROW_D = 0.95
// supporters: club colours (blue / amber / white) plus a mix of everyday shirts
const SHIRTS = ['#2d6fd6', '#2d6fd6', '#ffb35c', '#ffb35c', '#f2f0ea', '#e8533f', '#3aa66b', '#1d2a44', '#c43a7a', '#f2c14e', '#6d6a78']
const SKINS = ['#f1c7a8', '#e8b692', '#d49a72', '#b97b55', '#8d5a3b', '#f5d6bf']

type StandProps = {
  position: [number, number, number]
  rotationY: number
  length: number
  rows: number
  roof?: boolean
  low: boolean
  seed: number
}

/** Stepped stand. Local +z points away from the pitch; the front edge sits at the origin. */
function Stand({ position, rotationY, length, rows, roof = false, low, seed }: StandProps) {
  const seats = useRef<THREE.InstancedMesh>(null)
  const bodies = useRef<THREE.InstancedMesh>(null)
  const heads = useRef<THREE.InstancedMesh>(null)
  const spacing = low ? 1.1 : 0.62
  const perRow = Math.floor((length - 1) / spacing)
  const count = perRow * rows

  // which seats are taken by a (tiny, low-poly) supporter
  const crowd = useMemo(() => {
    const rand = rng(seed * 31 + 7)
    const out: { x: number; r: number; lean: number; turn: number; shirt: string; skin: string; h: number }[] = []
    for (let r = 0; r < rows; r++)
      for (let i = 0; i < perRow; i++) {
        if (rand() > (low ? 0.45 : 0.68)) continue
        out.push({
          x: -length / 2 + 0.5 + (i + 0.5) * spacing,
          r,
          lean: (rand() - 0.5) * 0.25,
          turn: (rand() - 0.5) * 0.6,
          shirt: SHIRTS[Math.floor(rand() * SHIRTS.length)],
          skin: SKINS[Math.floor(rand() * SKINS.length)],
          h: 0.92 + rand() * 0.18,
        })
      }
    return out
  }, [rows, perRow, length, spacing, seed, low])

  useLayoutEffect(() => {
    const mesh = seats.current
    if (!mesh) return
    const rand = rng(seed)
    const m = new THREE.Matrix4()
    const c = new THREE.Color()
    const seatColors = ['#223a66', '#1f3560', '#27447a']
    let k = 0
    for (let r = 0; r < rows; r++)
      for (let i = 0; i < perRow; i++) {
        const x = -length / 2 + 0.5 + (i + 0.5) * spacing
        m.makeTranslation(x, (r + 1) * ROW_H + 0.14, r * ROW_D + 0.35)
        mesh.setMatrixAt(k, m)
        c.set(seatColors[Math.floor(rand() * 3)])
        mesh.setColorAt(k, c)
        k++
      }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [rows, perRow, length, spacing, seed])

  // supporters sit on the seats, facing the pitch (local -z)
  useLayoutEffect(() => {
    const b = bodies.current
    const hd = heads.current
    if (!b || !hd) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const c = new THREE.Color()
    crowd.forEach((p, k) => {
      const seatTop = (p.r + 1) * ROW_H + 0.28
      const z = p.r * ROW_D + 0.38
      e.set(-p.lean, Math.PI + p.turn, p.lean * 0.5)
      q.setFromEuler(e)
      m.compose(new THREE.Vector3(p.x, seatTop + 0.2 * p.h, z), q, new THREE.Vector3(1, p.h, 1))
      b.setMatrixAt(k, m)
      b.setColorAt(k, c.set(p.shirt))
      m.compose(new THREE.Vector3(p.x, seatTop + 0.5 * p.h, z - p.lean * 0.1), q, new THREE.Vector3(1, 1, 1))
      hd.setMatrixAt(k, m)
      hd.setColorAt(k, c.set(p.skin))
    })
    b.instanceMatrix.needsUpdate = true
    hd.instanceMatrix.needsUpdate = true
    if (b.instanceColor) b.instanceColor.needsUpdate = true
    if (hd.instanceColor) hd.instanceColor.needsUpdate = true
  }, [crowd])

  const top = rows * ROW_H
  const depth = rows * ROW_D

  return (
    <group position={position} rotation-y={rotationY}>
      {Array.from({ length: rows }, (_, r) => (
        <mesh key={r} position={[0, ((r + 1) * ROW_H) / 2, r * ROW_D + ROW_D / 2]} castShadow receiveShadow>
          <boxGeometry args={[length, (r + 1) * ROW_H, ROW_D]} />
          <meshStandardMaterial color={r % 2 ? '#34303f' : '#3a3546'} roughness={0.95} flatShading />
        </mesh>
      ))}
      <instancedMesh ref={seats} args={[undefined, undefined, count]} castShadow={!low}>
        <boxGeometry args={[0.44, 0.28, 0.36]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
      {/* the crowd: tapered torso + round head, a handful of polygons each */}
      <instancedMesh ref={bodies} args={[undefined, undefined, crowd.length]} castShadow={!low}>
        <cylinderGeometry args={[0.15, 0.12, 0.4, 6]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, crowd.length]}>
        <icosahedronGeometry args={[0.1, 1]} />
        <meshStandardMaterial roughness={0.8} flatShading />
      </instancedMesh>
      {/* back wall */}
      <mesh position={[0, (top + 1.4) / 2, depth + 0.15]} castShadow>
        <boxGeometry args={[length, top + 1.4, 0.3]} />
        <meshStandardMaterial color="#26222f" flatShading />
      </mesh>
      {/* side walls */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * length) / 2, (top + 0.4) / 2, depth / 2]} castShadow>
          <boxGeometry args={[0.3, top + 0.4, depth + 0.3]} />
          <meshStandardMaterial color="#2b2735" flatShading />
        </mesh>
      ))}
      {roof && <Roof length={length} top={top} depth={depth} />}
    </group>
  )
}

function Roof({ length, top, depth }: { length: number; top: number; depth: number }) {
  // The roof covers the back part of the stand. When the camera orbits round behind this
  // stand, the roof would hide the near half of the pitch, so it is hidden then.
  const y = top + 2.4
  const front = 2.5
  const back = depth + 0.3
  const posts = Math.floor(length / 6)
  const group = useRef<THREE.Group>(null)
  const out = useMemo(() => new THREE.Vector3(), [])
  const { camera } = useThree()
  useFrame(() => {
    if (!group.current) return
    // this stand's outward direction in world space (local +z)
    out.set(0, 0, 1).transformDirection(group.current.matrixWorld)
    const behind = camera.position.x * out.x + camera.position.z * out.z > 6
    group.current.visible = !behind
  })
  return (
    <group ref={group}>
      <mesh position={[0, y, (front + back) / 2]} rotation-x={-0.06} castShadow>
        <boxGeometry args={[length + 0.6, 0.18, back - front]} />
        <meshStandardMaterial color="#1e1b26" flatShading metalness={0.3} />
      </mesh>
      {/* warm light strip under the front edge */}
      <mesh position={[0, y - 0.15, front + 0.05]}>
        <boxGeometry args={[length, 0.06, 0.1]} />
        <meshBasicMaterial color="#ffd9a8" toneMapped={false} />
      </mesh>
      {Array.from({ length: posts + 1 }, (_, i) => (
        <mesh key={i} position={[-length / 2 + (i / posts) * length, y / 2 + 0.4, depth + 0.2]} castShadow>
          <boxGeometry args={[0.22, y, 0.22]} />
          <meshStandardMaterial color="#2c2836" flatShading />
        </mesh>
      ))}
    </group>
  )
}

function Dugout({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.55, -0.45]} castShadow>
        <boxGeometry args={[2.6, 1.1, 0.1]} />
        <meshStandardMaterial color="#26222f" />
      </mesh>
      <mesh position={[0, 1.12, -0.05]} rotation-x={0.12}>
        <boxGeometry args={[2.7, 0.05, 1.0]} />
        <meshStandardMaterial color="#a9c8ff" transparent opacity={0.35} roughness={0.1} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.28, -0.2]}>
        <boxGeometry args={[2.3, 0.08, 0.4]} />
        <meshStandardMaterial color={palette.amber} roughness={0.6} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ floodlights */

const MAST_H = 17
const MASTS: [number, number][] = [
  [HL + M + 6.5, HW + M + 6],
  [-(HL + M + 6.5), HW + M + 6],
  [HL + M + 6.5, -(HW + M + 6)],
  [-(HL + M + 6.5), -(HW + M + 6)],
]

function Floodlight({ x, z, low, withLight }: { x: number; z: number; low: boolean; withLight: boolean }) {
  const yaw = Math.atan2(-x, -z)
  const aim = Math.hypot(x, z) * 0.62
  const len = Math.hypot(MAST_H, aim)
  const alpha = Math.atan2(aim, MAST_H) // beam angle from vertical
  const beam = useMemo(() => makeBeamMaterial(palette.amber, 1, 0.22), [])
  const pole = useRef<THREE.Mesh>(null)
  const head = useRef<THREE.Group>(null)
  const { camera } = useThree()

  // Hide the mast while it stands between the camera and the pitch (the camera orbits past
  // the corners); the light it casts stays on.
  useFrame(() => {
    const cx = camera.position.x
    const cz = camera.position.z
    const len2 = cx * cx + cz * cz
    const t = THREE.MathUtils.clamp((x * cx + z * cz) / len2, 0, 1) // mast projected on camera→centre
    const dist = Math.hypot(x - cx * t, z - cz * t)
    // near the camera's own corner, or standing in the line of sight to the pitch
    const nearCamera = Math.hypot(x - cx, z - cz) < 17
    const blocking = nearCamera || (t > 0.3 && dist < 5)
    if (pole.current) pole.current.visible = !blocking
    if (head.current) head.current.visible = !blocking
  })

  return (
    <group position={[x, 0, z]} rotation-y={yaw}>
      <mesh ref={pole} position={[0, MAST_H / 2, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.3, MAST_H, 6]} />
        <meshStandardMaterial color="#2a2733" flatShading metalness={0.4} roughness={0.6} />
      </mesh>
      <group ref={head} position={[0, MAST_H, 0.2]} rotation-x={Math.PI / 2 - alpha}>
        <mesh>
          <boxGeometry args={[2.8, 1.7, 0.2]} />
          <meshStandardMaterial color="#1c1a23" flatShading />
        </mesh>
        {[-1.0, -0.33, 0.33, 1.0].map((lx) =>
          [-0.5, 0, 0.5].map((ly) => (
            <mesh key={`${lx}${ly}`} position={[lx, ly, 0.11]}>
              <circleGeometry args={[0.22, 12]} />
              <meshBasicMaterial color="#fff3dc" toneMapped={false} />
            </mesh>
          )),
        )}
        <sprite position={[0, 0, 0.6]} scale={6}>
          <spriteMaterial map={glowTexture()} color={palette.amber} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
      {!low && (
        <mesh position={[0, MAST_H / 2, aim / 2]} rotation-x={-alpha} scale={[1, len, 1]} material={beam}>
          <cylinderGeometry args={[0.9, 7, 1, 32, 1, true]} />
        </mesh>
      )}
      {withLight && <pointLight position={[0, MAST_H - 2, 4]} color="#ffcf96" intensity={120} distance={48} decay={1.5} />}
    </group>
  )
}

/* ------------------------------------------------------------------ assembly */

export function Stadium({ low }: { low: boolean }) {
  const standGap = M + 1.1
  return (
    <group>
      <Pitch />
      <LedBoards />

      {/* main stand with roof (far side), lower stand opposite, end stands */}
      <Stand position={[0, 0, -(HW + standGap)]} rotationY={Math.PI} length={L + 4} rows={9} roof low={low} seed={3} />
      <Stand position={[0, 0, HW + standGap]} rotationY={0} length={L - 2} rows={4} low={low} seed={5} />
      <Stand position={[HL + standGap + 0.6, 0, 0]} rotationY={Math.PI / 2} length={W - 1} rows={5} low={low} seed={7} />
      <Stand position={[-(HL + standGap + 0.6), 0, 0]} rotationY={-Math.PI / 2} length={W - 1} rows={5} low={low} seed={9} />

      <Dugout x={-3.6} z={-(HW + M * 0.45)} />
      <Dugout x={3.6} z={-(HW + M * 0.45)} />

      {MASTS.map(([x, z], i) => (
        <Floodlight key={i} x={x} z={z} low={low} withLight={!low || i % 2 === 0} />
      ))}
    </group>
  )
}
