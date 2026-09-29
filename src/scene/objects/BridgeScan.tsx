import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { makeBeamMaterial, rng, useNodeState, useWorldFrame } from '../common'

/**
 * FPT-AI — a cable-stayed bridge under construction, colour-coded like the progress report
 * (complete / partial / not started). A drone orbits the site and its scan builds up a
 * glowing point cloud of what's already there.
 */

const Y0 = 0.18
const DECK_Y = Y0 + 0.72
const SEGMENTS = 12
const SEG_L = 0.3
const DECK_W = 0.62
const PYLONS = [-0.9, 0.9]
const PYLON_H = 2.05
const AMBER = '#ffc94d'
const HOLO = '#62f0e6'
const ORBIT = { rx: 2.05, rz: 1.5, y: 2.45, period: 11 }

type Status = 'done' | 'partial' | 'todo'
const status = (i: number): Status => (i < 7 ? 'done' : i < 9 ? 'partial' : 'todo')
const segX = (i: number) => -((SEGMENTS - 1) * SEG_L) / 2 + i * SEG_L

/* point cloud shader: points light up as the drone sweeps over them, then settle */
const cloudVertex = /* glsl */ `
  uniform float uAngle;
  uniform float uSize;
  attribute float aAngle;
  varying float vFresh;
  void main() {
    float d = mod(uAngle - aAngle, 6.2831853);
    vFresh = 1.0 - smoothstep(0.0, 2.2, d);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * (0.6 + vFresh * 0.9) * (6.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`
const cloudFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uBase;
  varying float vFresh;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    float a = uBase + vFresh * 0.85;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), vFresh * 0.6), a);
  }
`

function samplePointCloud(count: number) {
  const rand = rng(99)
  const pos: number[] = []
  const ang: number[] = []
  const push = (x: number, y: number, z: number) => {
    pos.push(x, y, z)
    ang.push(Math.atan2(z / ORBIT.rz, x / ORBIT.rx))
  }
  for (let n = 0; n < count; n++) {
    const r = rand()
    if (r < 0.6) {
      // deck surface of built segments
      const i = Math.floor(rand() * 9)
      const len = status(i) === 'partial' ? SEG_L * 0.55 : SEG_L
      push(segX(i) - SEG_L / 2 + rand() * len, DECK_Y + 0.05, (rand() - 0.5) * DECK_W)
    } else {
      // pylon legs
      const px = PYLONS[Math.floor(rand() * 2)]
      const side = rand() > 0.5 ? 1 : -1
      const h = rand()
      push(px + (rand() - 0.5) * 0.1, Y0 + h * PYLON_H, side * (0.36 - h * 0.14) + (rand() - 0.5) * 0.08)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('aAngle', new THREE.Float32BufferAttribute(ang, 1))
  return g
}

function Pylon({ x }: { x: number }) {
  const leg = (side: number) => {
    const bottom = new THREE.Vector3(x, Y0, side * 0.36)
    const top = new THREE.Vector3(x, Y0 + PYLON_H, side * 0.22)
    const mid = bottom.clone().lerp(top, 0.5)
    const len = bottom.distanceTo(top)
    const tilt = Math.atan2(top.z - bottom.z, PYLON_H)
    return (
      <mesh key={side} position={mid} rotation-x={tilt} castShadow>
        <boxGeometry args={[0.1, len, 0.09]} />
        <meshStandardMaterial color="#d8d2c8" flatShading roughness={0.85} />
      </mesh>
    )
  }
  return (
    <group>
      {leg(1)}
      {leg(-1)}
      {[DECK_Y - 0.08, Y0 + PYLON_H - 0.35].map((y) => (
        <mesh key={y} position={[x, y, 0]}>
          <boxGeometry args={[0.1, 0.07, 0.62 - (y - Y0) * 0.14]} />
          <meshStandardMaterial color="#cfc8bd" flatShading />
        </mesh>
      ))}
    </group>
  )
}

/** Small Vietnamese flag: the project was done with PTIT, on site in Vietnam. */
function VietnamFlag() {
  const cloth = useRef<THREE.Group>(null)
  const star = useMemo(() => {
    const s = new THREE.Shape()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.026 : 0.062
      const a = Math.PI / 2 + (i * Math.PI) / 5
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    return new THREE.ShapeGeometry(s)
  }, [])
  useWorldFrame((t) => {
    if (cloth.current) cloth.current.rotation.y = Math.sin(t * 2.2) * 0.18
  })
  return (
    <group position={[0, 1.95, 0]}>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.44, 5]} />
        <meshStandardMaterial color="#d9d4cc" metalness={0.4} />
      </mesh>
      <group ref={cloth} position={[0, 0.34, 0]}>
        <mesh position={[0.15, 0, 0]}>
          <planeGeometry args={[0.3, 0.2]} />
          <meshStandardMaterial color="#da251d" side={THREE.DoubleSide} emissive="#da251d" emissiveIntensity={0.25} />
        </mesh>
        {[0.002, -0.002].map((z) => (
          <mesh key={z} geometry={star} position={[0.15, 0, z]} rotation-y={z < 0 ? Math.PI : 0}>
            <meshBasicMaterial color="#ffde00" toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Crane() {
  const jib = useRef<THREE.Group>(null)
  useWorldFrame((t) => {
    if (jib.current) jib.current.rotation.y = Math.sin(t * 0.25) * 0.9 + 0.6
  })
  return (
    <group position={[1.55, Y0, -0.85]}>
      <VietnamFlag />
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[0.09, 1.9, 0.09]} />
        <meshStandardMaterial color={AMBER} wireframe />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[0.05, 1.9, 0.05]} />
        <meshStandardMaterial color={AMBER} />
      </mesh>
      <group ref={jib} position={[0, 1.92, 0]}>
        <mesh position={[-0.45, 0, 0]}>
          <boxGeometry args={[1.25, 0.05, 0.05]} />
          <meshStandardMaterial color={AMBER} />
        </mesh>
        <mesh position={[0.28, -0.04, 0]}>
          <boxGeometry args={[0.16, 0.12, 0.12]} />
          <meshStandardMaterial color="#6a6475" />
        </mesh>
        <mesh position={[-0.85, -0.3, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.6, 3]} />
          <meshBasicMaterial color="#222" />
        </mesh>
        <mesh position={[-0.85, -0.62, 0]}>
          <boxGeometry args={[0.28, 0.04, 0.08]} />
          <meshStandardMaterial color="#b9b2a8" />
        </mesh>
      </group>
    </group>
  )
}

function Drone({ low }: { low: boolean }) {
  const g = useRef<THREE.Group>(null)
  const rotors = useRef<(THREE.Mesh | null)[]>([])
  const cone = useMemo(() => makeBeamMaterial(HOLO, 1, 0.28), [])
  const light = useRef<THREE.MeshBasicMaterial>(null)
  useWorldFrame((t, dt) => {
    const a = (t / ORBIT.period) * Math.PI * 2
    if (g.current) {
      g.current.position.set(Math.cos(a) * ORBIT.rx, ORBIT.y + Math.sin(t * 1.7) * 0.06, Math.sin(a) * ORBIT.rz)
      g.current.rotation.y = -a
      g.current.rotation.z = 0.12
    }
    rotors.current.forEach((r) => r && (r.rotation.y += dt * 40))
    if (light.current) light.current.color.set(Math.sin(t * 8) > 0 ? '#ff4d4d' : '#3a1010')
  })
  return (
    <group ref={g}>
      <mesh castShadow>
        <boxGeometry args={[0.16, 0.05, 0.12]} />
        <meshStandardMaterial color="#e9e6ef" flatShading />
      </mesh>
      <mesh position={[0, -0.04, 0]}>
        <sphereGeometry args={[0.03, 8, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {[
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ].map(([sx, sz], i) => (
        <group key={i} position={[sx * 0.13, 0.02, sz * 0.11]}>
          <mesh rotation-y={Math.atan2(sz, sx)} position={[-sx * 0.05, -0.005, -sz * 0.04]}>
            <boxGeometry args={[0.12, 0.015, 0.015]} />
            <meshStandardMaterial color="#bfbac8" />
          </mesh>
          <mesh ref={(m) => (rotors.current[i] = m)} position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.065, 0.065, 0.004, 12]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.25} depthWrite={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.08, 0.03, 0]}>
        <sphereGeometry args={[0.012, 6, 4]} />
        <meshBasicMaterial ref={light} color="#ff4d4d" toneMapped={false} />
      </mesh>
      {/* scanning frustum */}
      {!low && (
        <mesh position={[0, -0.85, 0]} rotation-x={Math.PI} scale={[1, 1.7, 1]} material={cone}>
          <coneGeometry args={[0.7, 1, 24, 1, true]} />
        </mesh>
      )}
    </group>
  )
}

export function BridgeScan({ low }: { low: boolean }) {
  const node = useNodeState()
  const cloud = useMemo(() => samplePointCloud(low ? 600 : 1600), [low])
  const cloudMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: cloudVertex,
        fragmentShader: cloudFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uAngle: { value: 0 }, uSize: { value: 5 }, uColor: { value: new THREE.Color(HOLO) }, uBase: { value: 0.12 } },
      }),
    [],
  )
  const todoMat = useRef<THREE.LineBasicMaterial>(null)

  const cables = useMemo(() => {
    const pts: number[] = []
    for (const px of PYLONS) {
      const topY = Y0 + PYLON_H - 0.12
      for (let k = 1; k <= 4; k++)
        for (const dir of [-1, 1]) {
          const x = px + dir * k * 0.28
          const i = Math.round((x - segX(0)) / SEG_L)
          if (i < 0 || i >= SEGMENTS || status(i) !== 'done') continue
          for (const side of [-1, 1]) pts.push(px, topY, side * 0.23, x, DECK_Y + 0.03, side * 0.27)
        }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [])
  const todoEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(SEG_L - 0.01, 0.08, DECK_W)), [])

  useWorldFrame((t) => {
    // drone angle expressed in the same elliptical parametrisation as aAngle
    cloudMat.uniforms.uAngle.value = ((t / ORBIT.period) * Math.PI * 2) % (Math.PI * 2)
    cloudMat.uniforms.uBase.value = 0.12 + node.current.hover * 0.25
    if (todoMat.current) todoMat.current.opacity = 0.35 + 0.25 * Math.sin(t * 2) + node.current.hover * 0.3
  })

  return (
    <group>
      {/* river */}
      <mesh rotation-x={-Math.PI / 2} position={[0, Y0 + 0.004, 0]} receiveShadow>
        <planeGeometry args={[1.1, 3.7]} />
        <meshStandardMaterial color="#1c3b5a" roughness={0.25} metalness={0.3} emissive="#0d2238" />
      </mesh>

      {PYLONS.map((x) => (
        <Pylon key={x} x={x} />
      ))}
      {/* end piers */}
      {[segX(0) - 0.05, segX(SEGMENTS - 1) + 0.05].map((x) => (
        <mesh key={x} position={[x, (Y0 + DECK_Y) / 2, 0]} castShadow>
          <boxGeometry args={[0.16, DECK_Y - Y0, 0.4]} />
          <meshStandardMaterial color="#bdb6ac" flatShading />
        </mesh>
      ))}

      {/* deck segments, colour-coded like the progress report */}
      {Array.from({ length: SEGMENTS }, (_, i) => {
        const s = status(i)
        if (s === 'todo')
          return (
            <lineSegments key={i} geometry={todoEdges} position={[segX(i), DECK_Y, 0]}>
              <lineBasicMaterial ref={i === SEGMENTS - 1 ? todoMat : undefined} color={HOLO} transparent opacity={0.45} />
            </lineSegments>
          )
        const len = s === 'partial' ? SEG_L * 0.55 : SEG_L - 0.01
        return (
          <mesh key={i} position={[segX(i) - (SEG_L - len) / 2, DECK_Y, 0]} castShadow receiveShadow>
            <boxGeometry args={[len, 0.08, DECK_W]} />
            <meshStandardMaterial
              color={s === 'done' ? '#dcd6cc' : AMBER}
              emissive={s === 'partial' ? AMBER : '#000'}
              emissiveIntensity={s === 'partial' ? 0.35 : 0}
              flatShading
            />
          </mesh>
        )
      })}
      <lineSegments geometry={cables}>
        <lineBasicMaterial color="#f1ece4" transparent opacity={0.7} />
      </lineSegments>

      <points geometry={cloud} material={cloudMat} />
      <Crane />
      <Drone low={low} />

      {/* legend chips on the ground */}
      {(
        [
          ['#dcd6cc', 0.85],
          [AMBER, 1.1],
          [HOLO, 1.35],
        ] as const
      ).map(([c, x]) => (
        <mesh key={x} rotation-x={-Math.PI / 2} position={[x, Y0 + 0.006, 1.3]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color={c} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}
