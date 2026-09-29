import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useRoute } from '../../lib/route'
import { damp, palette, rng, useNodeState, useWorldFrame } from '../common'

/**
 * Low-poly avatar of Andreas on the centre spot: tousled golden-brown hair with a curtain
 * fringe, navy knit crew-neck, dark jeans, white sneakers. Breathes, blinks, turns to face the
 * visitor and waves when hovered. Clicking opens About (handled by the wrapping ProjectNode).
 */

const C = {
  skin: '#efc4a6',
  skinShade: '#e2ad8c',
  hair: '#9a6c40',
  hairLight: '#d4a86f',
  hairDark: '#6e4a2c',
  knit: '#3d4c6b',
  rib: '#324060',
  denim: '#333c52',
  shoe: '#eeece7',
  sole: '#c9c3b9',
  eye: '#2a211c',
  lip: '#c07f73',
}

// head sits on top of the neck; all face/hair coordinates are relative to the head centre
const HEAD_R = 0.3

/** Point on the (ellipsoidal) head: polar angle from the top, azimuth from the front. */
function onHead(polar: number, az: number, r: number) {
  return new THREE.Vector3(Math.sin(polar) * Math.sin(az) * 0.9, Math.cos(polar) * 1.1, Math.sin(polar) * Math.cos(az) * 0.95).multiplyScalar(r)
}

/** How far down a lock may fall at a given azimuth: brow line at the front, ears at the sides, nape at the back. */
const tipPolar = (az: number) => 1.2 + 1.0 * THREE.MathUtils.smoothstep(Math.abs(az), 0.55, 2.3)

/**
 * Procedural hair made of real locks: tapered tubes that grow from the crown, follow the head
 * with some volume, wave a little and flick outward at the tips. The fringe is a curtain parted
 * just off-centre. All locks are merged into one mesh with a root→tip colour gradient.
 */
function makeHairGeometry() {
  const rand = rng(7)
  const parts: THREE.BufferGeometry[] = []
  const bases = [C.hair, C.hair, C.hairLight, C.hairDark].map((c) => new THREE.Color(c))
  const light = new THREE.Color(C.hairLight)
  const PART = 0.12 // azimuth of the parting

  /**
   * One lock. `mess` (0..1) randomises it per lock — curl frequency and size, a sideways kink,
   * how far the tip flicks out and its length — so the hair looks tousled rather than combed.
   * Fringe locks only ever get shorter, never longer, so they stay out of the eyes.
   */
  const addLock = (
    p0: number,
    az0: number,
    opts: { drift: number; volume: number; thick: number; mess?: number; fringe?: boolean; tip?: number },
  ) => {
    const mess = opts.mess ?? 1
    const lengthJitter = opts.fringe ? -rand() * 0.14 * mess : (rand() - 0.5) * 0.32 * mess
    const tip = (opts.tip ?? tipPolar(az0)) + (rand() - 0.5) * 0.12 + lengthJitter
    if (tip - p0 < 0.25) return
    const phase = rand() * Math.PI * 2
    const freq = Math.PI * (3.4 + (rand() - 0.5) * 2.6 * mess)
    const curlK = 1 + (rand() - 0.4) * 1.1 * mess
    const flickK = 1 + (rand() - 0.3) * 1.6 * mess
    const kink = (rand() - 0.5) * 0.35 * mess
    const pts: THREE.Vector3[] = []
    const N = 18
    for (let i = 0; i <= N; i++) {
      const t = i / N
      const ease = 1 - Math.pow(1 - t, 1.6)
      // curls: a small spiral (in azimuth + radius) that grows towards the tip
      const curlA = t * freq + phase
      const amp = (0.3 + 0.9 * t) * curlK
      const polar = p0 + (tip - p0) * ease - 0.2 * flickK * THREE.MathUtils.smoothstep(t, 0.7, 1) + 0.06 * Math.cos(curlA) * amp // tip curls up
      const az = az0 + opts.drift * Math.pow(t, 1.4) + kink * Math.sin(Math.PI * t) + 0.16 * Math.sin(curlA) * amp // waves
      const flick = 0.18 * flickK * THREE.MathUtils.smoothstep(t, 0.65, 1) + 0.05 * Math.cos(curlA) * amp
      const r = HEAD_R * (1.02 + opts.volume * Math.sin(Math.PI * Math.min(1, t * 1.15)) + flick)
      pts.push(onHead(polar, az, r))
    }
    const curve = new THREE.CatmullRomCurve3(pts)
    const SEG = 26
    const RAD = 6
    const geo = new THREE.TubeGeometry(curve, SEG, opts.thick, RAD, false)
    // taper towards the tip and colour root → tip
    const pos = geo.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(pos.count * 3)
    const base = bases[Math.floor(rand() * bases.length)].clone()
    const c = new THREE.Color()
    const centre = new THREE.Vector3()
    const v = new THREE.Vector3()
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG
      curve.getPointAt(u, centre)
      const taper = 1 - 0.72 * Math.pow(u, 1.3)
      c.copy(base).multiplyScalar(0.72 + 0.28 * u).lerp(light, 0.45 * u * u)
      for (let j = 0; j <= RAD; j++) {
        const k = i * (RAD + 1) + j
        v.fromBufferAttribute(pos, k).sub(centre).multiplyScalar(taper).add(centre)
        pos.setXYZ(k, v.x, v.y, v.z)
        colors.set([c.r, c.g, c.b], k * 3)
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    parts.push(geo)
  }

  // crown, sides and back
  for (let i = 0; i < 190; i++) {
    const p0 = 0.02 + rand() * 0.7
    const az0 = (rand() * 2 - 1) * Math.PI
    if (Math.abs(az0) < 0.85) continue // the front is handled by the fringe
    addLock(p0, az0, { drift: (rand() - 0.5) * 0.45, volume: 0.17 + rand() * 0.12, thick: 0.055 + rand() * 0.02 })
  }
  // curtain fringe: from the front of the crown, sweeping out to both sides of the parting
  for (let i = 0; i < 30; i++) {
    const az0 = -1.05 + (i / 29) * 2.1 + (rand() - 0.5) * 0.1
    const p0 = 0.1 + rand() * 0.35
    const side = az0 < PART ? -1 : 1
    const nearPart = 1 - Math.min(1, Math.abs(az0 - PART) / 1.1)
    // a bit less tidy: some fringe locks cross over the parting
    const cross = rand() < 0.25 ? -side * 0.5 : 0
    addLock(p0, az0, {
      drift: side * (0.3 + 0.55 * nearPart) + cross,
      volume: 0.12 + rand() * 0.1,
      thick: 0.05 + rand() * 0.015,
      fringe: true,
    })
  }
  // loose, fluffy locks on top for the messy volume
  for (let i = 0; i < 40; i++) {
    const az0 = (rand() * 2 - 1) * Math.PI
    addLock(rand() * 0.3, az0, { drift: (rand() - 0.5) * 1.1, volume: 0.28 + rand() * 0.14, thick: 0.06 })
  }
  // stray, short locks sticking out of the crown every which way (bed-head)
  for (let i = 0; i < 22; i++) {
    const az0 = (rand() * 2 - 1) * Math.PI
    const p0 = rand() * 0.45
    addLock(p0, az0, {
      drift: (rand() - 0.5) * 1.6,
      volume: 0.38 + rand() * 0.18,
      thick: 0.045 + rand() * 0.015,
      // at the front, keep them above the brows
      tip: Math.min(p0 + 0.45 + rand() * 0.4, Math.abs(az0) < 0.9 ? 1.1 : Math.PI),
      mess: 1.3,
    })
  }

  const merged = mergeGeometries(parts)!
  parts.forEach((g) => g.dispose())
  return merged
}

/** One rigid arm (sleeve, cuff, hand) that pivots at the shoulder. */
function Arm({ side, armRef }: { side: 1 | -1; armRef: React.RefObject<THREE.Group | null> }) {
  return (
    <group ref={armRef} position={[side * 0.37, 1.66, 0]}>
      <mesh position={[0, -0.34, 0]} castShadow>
        <capsuleGeometry args={[0.095, 0.56, 4, 12]} />
        <meshStandardMaterial color={C.knit} roughness={0.95} />
      </mesh>
      {/* ribbed cuff */}
      <mesh position={[0, -0.68, 0]}>
        <cylinderGeometry args={[0.082, 0.076, 0.08, 12]} />
        <meshStandardMaterial color={C.rib} roughness={1} />
      </mesh>
      <mesh position={[0, -0.79, 0.01]} scale={[0.85, 1.1, 0.7]} castShadow>
        <sphereGeometry args={[0.085, 12, 10]} />
        <meshStandardMaterial color={C.skin} roughness={0.8} />
      </mesh>
    </group>
  )
}

export function Avatar() {
  const node = useNodeState()
  const route = useRoute()
  const { camera, pointer } = useThree()
  const hair = useMemo(() => makeHairGeometry(), [])

  const root = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const look = useRef({ yaw: 0, headY: 0, headX: 0 })

  // turn the whole body towards the camera (real time, so it also works with reduced motion)
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    if (!root.current) return
    const target = Math.atan2(camera.position.x, camera.position.z)
    let diff = target - look.current.yaw
    diff = Math.atan2(Math.sin(diff), Math.cos(diff))
    look.current.yaw += diff * (1 - Math.exp(-2.5 * dt))
    root.current.rotation.y = look.current.yaw

    // head follows the pointer a little while exploring
    const follow = route.name === 'world' ? 1 : 0
    look.current.headY = damp(look.current.headY, pointer.x * 0.35 * follow, 4, dt)
    look.current.headX = damp(look.current.headX, -pointer.y * 0.18 * follow, 4, dt)
  })

  useWorldFrame((t) => {
    const h = node.current.hover
    const breathe = Math.sin(t * 1.6)
    if (torso.current) {
      torso.current.scale.set(1 + breathe * 0.008, 1 + breathe * 0.012, 1 + breathe * 0.01)
      torso.current.rotation.z = Math.sin(t * 0.7) * 0.015
    }
    if (head.current) {
      head.current.rotation.y = look.current.headY
      head.current.rotation.x = look.current.headX + Math.sin(t * 0.9) * 0.02
      head.current.rotation.z = Math.sin(t * 0.6) * 0.03 + h * 0.08
    }
    // blink every ~4 s
    if (eyes.current) eyes.current.scale.y = t % 4.2 < 0.12 ? 0.12 : 1

    // right arm: hangs relaxed; on hover the whole arm swings up beside the head and waves
    // from the shoulder (eased, so it never snaps)
    if (armR.current) {
      const up = h * h * (3 - 2 * h)
      const wave = Math.sin(t * 5.5) * 0.3 * up
      armR.current.rotation.z = THREE.MathUtils.lerp(0.08 + breathe * 0.01, -2.7, up) + wave
      armR.current.rotation.x = THREE.MathUtils.lerp(0.05, -0.2, up)
    }
    // left arm relaxed
    if (armL.current) {
      armL.current.rotation.z = -0.08 - breathe * 0.01
      armL.current.rotation.x = 0.05
    }
    if (ring.current) ring.current.rotation.z = t * 0.3
  })

  return (
    <group>
      {/* light emitter on the centre spot */}
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.85, 0.93, 48]} />
        <meshBasicMaterial color={palette.holo} toneMapped={false} />
      </mesh>
      <mesh ref={ring} position={[0, 0.035, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.08, 1.12, 48, 1, 0, Math.PI * 1.4]} />
        <meshBasicMaterial color={palette.amber} transparent opacity={0.7} toneMapped={false} />
      </mesh>

      <group ref={root} scale={1.2}>
        {/* shoes */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.14, 0, 0.05]}>
            <RoundedBox args={[0.22, 0.13, 0.4]} radius={0.05} smoothness={2} position={[0, 0.075, 0]} castShadow>
              <meshStandardMaterial color={C.shoe} roughness={0.6} />
            </RoundedBox>
            <mesh position={[0, 0.02, 0]}>
              <boxGeometry args={[0.23, 0.04, 0.41]} />
              <meshStandardMaterial color={C.sole} />
            </mesh>
          </group>
        ))}
        {/* legs */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.14, 0.6, 0]} castShadow>
            <capsuleGeometry args={[0.13, 0.72, 4, 12]} />
            <meshStandardMaterial color={C.denim} roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 1.02, 0]} castShadow>
          <boxGeometry args={[0.5, 0.16, 0.28]} />
          <meshStandardMaterial color={C.denim} roughness={0.9} />
        </mesh>

        {/* sweater */}
        <group ref={torso} position={[0, 1.02, 0]}>
          <RoundedBox args={[0.64, 0.7, 0.38]} radius={0.17} smoothness={4} position={[0, 0.37, 0]} castShadow>
            <meshStandardMaterial color={C.knit} roughness={0.97} />
          </RoundedBox>
          {/* ribbed hem */}
          <RoundedBox args={[0.6, 0.08, 0.35]} radius={0.04} smoothness={2} position={[0, 0.06, 0]}>
            <meshStandardMaterial color={C.rib} roughness={1} />
          </RoundedBox>
          {/* crew neck */}
          <mesh position={[0, 0.72, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.1, 0.035, 8, 20]} />
            <meshStandardMaterial color={C.rib} roughness={1} />
          </mesh>
        </group>

        <Arm side={-1} armRef={armR} />
        <Arm side={1} armRef={armL} />

        {/* neck */}
        <mesh position={[0, 1.8, 0]}>
          <cylinderGeometry args={[0.075, 0.085, 0.16, 10]} />
          <meshStandardMaterial color={C.skinShade} roughness={0.8} />
        </mesh>

        <group ref={head} position={[0, 1.88, 0]}>
          <group position={[0, HEAD_R * 0.95, 0]}>
            {/* face */}
            <mesh scale={[0.9, 1.1, 0.95]} castShadow>
              <sphereGeometry args={[HEAD_R, 24, 18]} />
              <meshStandardMaterial color={C.skin} roughness={0.75} />
            </mesh>
            {/* ears */}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * HEAD_R * 0.9, -0.01, -0.01]} scale={[0.45, 0.8, 0.6]}>
                <sphereGeometry args={[0.08, 8, 6]} />
                <meshStandardMaterial color={C.skinShade} roughness={0.8} />
              </mesh>
            ))}
            {/* eyes */}
            <group ref={eyes} position={[0, 0.0, 0]}>
              {[-1, 1].map((s) => (
                <group key={s} position={[s * 0.095, 0.0, HEAD_R * 0.9]}>
                  <mesh scale={[1, 1.15, 0.6]}>
                    <sphereGeometry args={[0.032, 10, 8]} />
                    <meshStandardMaterial color={C.eye} roughness={0.3} />
                  </mesh>
                  <mesh position={[0.009, 0.012, 0.018]}>
                    <sphereGeometry args={[0.008, 6, 4]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                </group>
              ))}
            </group>
            {/* brows */}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.1, 0.075, HEAD_R * 0.9]} rotation-z={s * -0.08}>
                <boxGeometry args={[0.1, 0.018, 0.02]} />
                <meshStandardMaterial color={C.hairDark} />
              </mesh>
            ))}
            {/* nose */}
            <mesh position={[0, -0.05, HEAD_R * 0.97]} scale={[0.7, 1, 0.9]}>
              <sphereGeometry args={[0.035, 8, 6]} />
              <meshStandardMaterial color={C.skinShade} roughness={0.8} />
            </mesh>
            {/* soft smile */}
            <mesh position={[0, -0.135, HEAD_R * 0.86]} rotation-z={Math.PI}>
              <torusGeometry args={[0.045, 0.009, 6, 12, Math.PI * 0.8]} />
              <meshStandardMaterial color={C.lip} />
            </mesh>

            {/* hair: a dark base cap (so no scalp shows between locks) + the locks */}
            <mesh position={[0, 0.06, -0.04]} scale={[0.93, 1.05, 0.97]}>
              <sphereGeometry args={[HEAD_R * 1.02, 24, 16]} />
              <meshStandardMaterial color={C.hairDark} roughness={0.9} />
            </mesh>
            <mesh geometry={hair} castShadow>
              <meshStandardMaterial vertexColors roughness={0.6} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
