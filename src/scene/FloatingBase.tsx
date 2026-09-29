import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { glowTexture, makeBeamMaterial, palette, rng, useWorldFrame } from './common'

/**
 * Makes the stadium fly: a rounded platform with a glowing rim, a stepped hull underneath,
 * four downward-thrusting engines and a glowing core, a slow bob, and drifting clouds below.
 */

// platform footprint (covers pitch, stands and floodlight masts)
const PLAT = { w: 52, d: 44, cz: -1.5, r: 9 }

function roundedRect(w: number, d: number, r: number) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -d / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + d - r)
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d)
  s.lineTo(x + r, y + d)
  s.quadraticCurveTo(x, y + d, x, y + d - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

const BEVEL = 0.4

/** Horizontal slab from a rounded rectangle; flat top at y = 0 (bevel up to +BEVEL), `depth` downwards. */
function slab(w: number, d: number, r: number, depth: number, bevel = BEVEL) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w, d, r), {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
    curveSegments: 6,
  })
  g.rotateX(Math.PI / 2) // extrude along -y
  return g
}

const TIERS = [
  { w: PLAT.w, d: PLAT.d, r: PLAT.r, depth: 1.2, y: -0.05, color: '#2a2433' },
  // each tier's top slightly overlaps the bevelled bottom of the one above (no gaps)
  { w: 44, d: 36, r: 8, depth: 1.8, y: -1.6, color: '#231e2c' },
  { w: 33, d: 27, r: 7, depth: 2.2, y: -3.75, color: '#1d1925' },
  { w: 20, d: 16, r: 5, depth: 2.4, y: -6.3, color: '#18141f' },
]

function Hull() {
  const geos = useMemo(() => TIERS.map((t) => slab(t.w, t.d, t.r, t.depth)), [])
  const rim = useMemo(() => {
    const pts = roundedRect(PLAT.w + 0.8, PLAT.d + 0.8, PLAT.r + 0.4)
      .getSpacedPoints(160)
      .map((p) => new THREE.Vector3(p.x, -0.35, p.y))
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 320, 0.09, 5, true)
  }, [])
  const lowerRim = useMemo(() => {
    const t = TIERS[1]
    const pts = roundedRect(t.w + 0.8, t.d + 0.8, t.r + 0.4)
      .getSpacedPoints(120)
      .map((p) => new THREE.Vector3(p.x, t.y - t.depth - 0.2, p.y))
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 240, 0.06, 4, true)
  }, [])
  return (
    <group position={[0, 0, PLAT.cz]}>
      {TIERS.map((t, i) => (
        // the bevel rises BEVEL above the slab's top face, so shift down to keep the top at t.y
        <mesh key={i} geometry={geos[i]} position={[0, t.y - BEVEL, 0]} receiveShadow={i === 0}>
          <meshStandardMaterial color={t.color} flatShading roughness={0.85} metalness={0.25} />
        </mesh>
      ))}
      {/* glowing rim lights */}
      <mesh geometry={rim}>
        <meshBasicMaterial color={palette.holo} toneMapped={false} />
      </mesh>
      <mesh geometry={lowerRim}>
        <meshBasicMaterial color={palette.amber} transparent opacity={0.8} toneMapped={false} />
      </mesh>
    </group>
  )
}

// under the second tier, outside the third one
const ENGINES: [number, number][] = [
  [-19, -13],
  [19, -13],
  [-19, 10],
  [19, 10],
]

function Engine({ x, z, low, i }: { x: number; z: number; low: boolean; i: number }) {
  const beam = useMemo(() => makeBeamMaterial(palette.holo, 1, 0.35), [])
  const glow = useRef<THREE.SpriteMaterial>(null)
  const disc = useRef<THREE.MeshBasicMaterial>(null)
  useWorldFrame((t) => {
    const pulse = 0.75 + Math.sin(t * 3 + i * 1.7) * 0.15 + Math.sin(t * 11 + i) * 0.05
    if (glow.current) glow.current.opacity = 0.5 * pulse
    if (disc.current) disc.current.color.setScalar(pulse).multiply(new THREE.Color(palette.holo)).addScalar(0.15)
    beam.uniforms.uOpacity.value = 0.3 * pulse
  })
  const y = TIERS[1].y - TIERS[1].depth - BEVEL
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, -0.7, 0]}>
        <cylinderGeometry args={[1.5, 1.9, 1.4, 12]} />
        <meshStandardMaterial color="#2c2737" flatShading metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, -1.25, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[1.55, 0.12, 6, 24]} />
        <meshStandardMaterial color="#16131c" metalness={0.6} />
      </mesh>
      <mesh position={[0, -1.42, 0]} rotation-x={Math.PI / 2}>
        <circleGeometry args={[1.35, 24]} />
        <meshBasicMaterial ref={disc} color={palette.holo} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <sprite position={[0, -1.9, 0]} scale={7}>
        <spriteMaterial ref={glow} map={glowTexture()} color={palette.holo} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {!low && (
        <mesh position={[0, -6.4, 0]} scale={[1, 10, 1]} material={beam}>
          <cylinderGeometry args={[1.25, 3.2, 1, 24, 1, true]} />
        </mesh>
      )}
    </group>
  )
}

function Core() {
  const ring = useRef<THREE.Mesh>(null)
  const bottom = TIERS[3].y - TIERS[3].depth - BEVEL
  useWorldFrame((t) => {
    if (ring.current) ring.current.rotation.z = t * 0.2
  })
  return (
    <group position={[0, bottom, PLAT.cz]}>
      <mesh rotation-x={Math.PI / 2}>
        <circleGeometry args={[3.2, 32]} />
        <meshBasicMaterial color={palette.amber} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring} position={[0, -0.05, 0]} rotation-x={Math.PI / 2}>
        <ringGeometry args={[3.6, 4.0, 48, 1, 0, Math.PI * 1.5]} />
        <meshBasicMaterial color={palette.holo} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <sprite position={[0, -1, 0]} scale={16}>
        <spriteMaterial map={glowTexture()} color={palette.amber} transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <pointLight position={[0, -3, 0]} color={palette.amber} intensity={60} distance={40} decay={1.4} />
    </group>
  )
}

/** Low-poly cloud puffs drifting slowly around and below the stadium (one instanced mesh). */
function Clouds({ low }: { low: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const group = useRef<THREE.Group>(null)
  const puffs = useMemo(() => {
    const rand = rng(11)
    const out: { p: THREE.Vector3; s: number; c: THREE.Color }[] = []
    const clusters = low ? 22 : 46
    const tints = ['#8f6c9e', '#a07a9d', '#6e5a8c', '#b58a93'].map((c) => new THREE.Color(c))
    for (let k = 0; k < clusters; k++) {
      const a = rand() * Math.PI * 2
      // a ring below/around the stadium, plus some directly underneath
      const r = k % 5 === 0 ? rand() * 22 : 34 + rand() * 60
      const y = k % 5 === 0 ? -20 - rand() * 8 : -10 - rand() * 22
      const centre = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)
      const n = 3 + Math.floor(rand() * 4)
      const size = 3 + rand() * 4
      for (let i = 0; i < n; i++) {
        out.push({
          p: centre.clone().add(new THREE.Vector3((rand() - 0.5) * size * 2.4, (rand() - 0.3) * size * 0.6, (rand() - 0.5) * size * 1.6)),
          s: size * (0.6 + rand() * 0.6),
          c: tints[Math.floor(rand() * tints.length)],
        })
      }
    }
    return out
  }, [low])

  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const mat = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    puffs.forEach((pf, i) => {
      mat.compose(pf.p, q, new THREE.Vector3(pf.s, pf.s * 0.62, pf.s))
      m.setMatrixAt(i, mat)
      m.setColorAt(i, pf.c)
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [puffs])

  useWorldFrame((t) => {
    if (group.current) group.current.rotation.y = t * 0.006
  })

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, puffs.length]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial flatShading roughness={1} emissive="#3a2340" emissiveIntensity={0.35} />
      </instancedMesh>
    </group>
  )
}

/** Wraps the whole flying stadium so it bobs gently; clouds stay put for relative motion. */
export function FloatingBase({ low, children }: { low: boolean; children: ReactNode }) {
  const bob = useRef<THREE.Group>(null)
  useWorldFrame((t) => {
    if (!bob.current) return
    bob.current.position.y = Math.sin(t * 0.55) * 0.18
    bob.current.rotation.z = Math.sin(t * 0.37) * 0.004
    bob.current.rotation.x = Math.sin(t * 0.43 + 1) * 0.003
  })
  return (
    <>
      <group ref={bob}>
        <Hull />
        {ENGINES.map(([x, z], i) => (
          <Engine key={i} x={x} z={z} low={low} i={i} />
        ))}
        <Core />
        {children}
      </group>
      <Clouds low={low} />
    </>
  )
}
