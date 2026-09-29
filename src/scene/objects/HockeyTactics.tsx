import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { glowTexture, palette, tubeFrom, useNodeState, useRouteMaterial, useWorldFrame } from '../common'

/**
 * XR Hockey Tactics Simulator — a miniature pitch where a drawn tactic plays itself out:
 * holographic routes, players following them, the ball travelling by passes and a shot on goal.
 * Above it floats the "command platform" the XR user starts on.
 */

const PITCH = { w: 3.4, d: 2.1, y: 0.24 }
const BLUE = '#4da3ff'
const ORANGE = '#ff8a3d'
const CYCLE = 8 // seconds per play

const ease = (x: number) => x * x * (3 - 2 * x)
const seg = (t: number, a: number, b: number) => ease(THREE.MathUtils.clamp((t - a) / (b - a), 0, 1))

type Runner = { curve: THREE.CatmullRomCurve3; start: number; end: number }

const v = (x: number, z: number) => new THREE.Vector3(x, PITCH.y + 0.01, z)

const attackers: Runner[] = [
  { curve: new THREE.CatmullRomCurve3([v(-1.25, 0), v(-0.75, -0.35), v(-0.2, -0.55)]), start: 0.02, end: 0.34 },
  { curve: new THREE.CatmullRomCurve3([v(-0.95, 0.6), v(-0.3, 0.72), v(0.35, 0.5)]), start: 0.08, end: 0.52 },
  { curve: new THREE.CatmullRomCurve3([v(-0.5, -0.15), v(0.25, -0.1), v(0.9, -0.2), v(1.25, 0.02)]), start: 0.12, end: 0.8 },
]
const bluesStatic = [v(-1.6, -0.55), v(-1.62, 0)]
const defenders = [v(0.55, -0.4), v(0.75, 0.35), v(1.1, -0.05), v(-0.05, 0.25), v(1.62, 0)]

const pos = (r: Runner, t: number, out: THREE.Vector3) => r.curve.getPoint(seg(t, r.start, r.end), out)

/** Ball timeline: carrier → pass → carrier → pass → carrier → shot. */
function ballAt(t: number, out: THREE.Vector3) {
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  if (t < 0.3) return pos(attackers[0], t, out).add(new THREE.Vector3(0.07, 0, 0.02))
  if (t < 0.42) {
    pos(attackers[0], 0.3, a)
    pos(attackers[1], 0.42, b)
    return out.lerpVectors(a, b, seg(t, 0.3, 0.42))
  }
  if (t < 0.6) return pos(attackers[1], t, out).add(new THREE.Vector3(0.07, 0, -0.02))
  if (t < 0.7) {
    pos(attackers[1], 0.6, a)
    pos(attackers[2], 0.7, b)
    return out.lerpVectors(a, b, seg(t, 0.6, 0.7))
  }
  if (t < 0.8) return pos(attackers[2], t, out).add(new THREE.Vector3(0.07, 0, 0))
  pos(attackers[2], 0.8, a)
  b.set(PITCH.w / 2 + 0.05, PITCH.y + 0.01, 0.08)
  return out.lerpVectors(a, b, seg(t, 0.8, 0.88))
}

function Player({ color, refCb }: { color: string; refCb?: (g: THREE.Group | null) => void }) {
  return (
    <group ref={refCb}>
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.08, 0.18, 6]} />
        <meshStandardMaterial color={color} flatShading emissive={color} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.21, 0]}>
        <sphereGeometry args={[0.05, 6, 5]} />
        <meshStandardMaterial color={palette.ink} flatShading />
      </mesh>
    </group>
  )
}

function Lines() {
  // polygonOffset pulls the lines towards the camera, so they always win over the turf
  const white = <meshBasicMaterial color="#e8f1ea" transparent opacity={0.8} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
  // clearly above the turf (seen from far away, a 1 mm gap flickers)
  const y = PITCH.y + 0.012
  const { w, d } = PITCH
  const bar = (x: number, z: number, sx: number, sz: number, k: string) => (
    <mesh key={k} position={[x, y, z]}>
      <boxGeometry args={[sx, 0.006, sz]} />
      {white}
    </mesh>
  )
  return (
    <group>
      {bar(0, -d / 2 + 0.03, w - 0.06, 0.018, 'n')}
      {bar(0, d / 2 - 0.03, w - 0.06, 0.018, 's')}
      {bar(-w / 2 + 0.03, 0, 0.018, d - 0.06, 'w')}
      {bar(w / 2 - 0.03, 0, 0.018, d - 0.06, 'e')}
      {bar(0, 0, 0.018, d - 0.06, 'c')}
      {bar(-0.8, 0, 0.012, d - 0.06, 'q1')}
      {bar(0.8, 0, 0.012, d - 0.06, 'q2')}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * w) / 2 - s * 0.03, y, 0]} rotation={[-Math.PI / 2, 0, s > 0 ? Math.PI / 2 : -Math.PI / 2]}>
          <ringGeometry args={[0.56, 0.58, 28, 1, 0, Math.PI]} />
          {white}
        </mesh>
      ))}
    </group>
  )
}

function Goal({ x }: { x: number }) {
  const s = Math.sign(x)
  return (
    <group position={[x, PITCH.y, 0]}>
      {[-0.17, 0.17].map((z) => (
        <mesh key={z} position={[0, 0.07, z]}>
          <boxGeometry args={[0.02, 0.14, 0.02]} />
          <meshStandardMaterial color={palette.ink} />
        </mesh>
      ))}
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.02, 0.02, 0.36]} />
        <meshStandardMaterial color={palette.ink} />
      </mesh>
      <mesh position={[s * 0.07, 0.07, 0]}>
        <boxGeometry args={[0.13, 0.14, 0.34]} />
        <meshStandardMaterial color={palette.ink} wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  )
}

export function HockeyTactics({ low }: { low: boolean }) {
  const node = useNodeState()
  const routeMat = useRouteMaterial('#7fe9ff', 10, 0.9, 1)
  const passMat = useRouteMaterial('#ffd08a', 8, 1.4, 0.85)

  const runners = useRef<(THREE.Group | null)[]>([])
  const defs = useRef<(THREE.Group | null)[]>([])
  const ball = useRef<THREE.Mesh>(null)
  const goalFlash = useRef<THREE.SpriteMaterial>(null)
  const platform = useRef<THREE.Group>(null)
  const holo = useRef<THREE.MeshBasicMaterial>(null)
  const frame = useRef<THREE.LineBasicMaterial>(null)

  const routeGeos = useMemo(
    () => attackers.map((r) => new THREE.TubeGeometry(r.curve, 48, 0.018, 5, false)),
    [],
  )
  const arrowHeads = useMemo(
    () =>
      attackers.map((r) => {
        const end = r.curve.getPoint(1)
        const tan = r.curve.getTangent(1).setY(0).normalize()
        return { end, quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan) }
      }),
    [],
  )
  const passGeos = useMemo(() => {
    const a = new THREE.Vector3()
    const b = new THREE.Vector3()
    const lift = (p: THREE.Vector3, q: THREE.Vector3) => p.clone().lerp(q, 0.5).setY(PITCH.y + 0.18)
    const make = (p: THREE.Vector3, q: THREE.Vector3) => tubeFrom([p.clone(), lift(p, q), q.clone()], 0.012, 32)
    const shotFrom = pos(attackers[2], 0.8, new THREE.Vector3())
    return [
      make(pos(attackers[0], 0.3, a), pos(attackers[1], 0.42, b)),
      make(pos(attackers[1], 0.6, a), pos(attackers[2], 0.7, b)),
      make(shotFrom, new THREE.Vector3(PITCH.w / 2 + 0.05, PITCH.y + 0.01, 0.08)),
    ]
  }, [])
  const frameGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(PITCH.w + 0.2, 0.7, PITCH.d + 0.2)), [])

  const tmp = useMemo(() => new THREE.Vector3(), [])

  useWorldFrame((time) => {
    const t = (time % CYCLE) / CYCLE
    attackers.forEach((r, i) => {
      const g = runners.current[i]
      if (!g) return
      pos(r, t, g.position)
      const tan = r.curve.getTangent(seg(t, r.start, r.end))
      g.rotation.y = Math.atan2(tan.x, tan.z)
    })
    const b = ballAt(t, tmp)
    // defenders drift towards the ball
    defenders.forEach((d, i) => {
      const g = defs.current[i]
      if (!g) return
      const pull = i === 4 ? 0.15 : 0.22
      g.position.set(d.x + (b.x - d.x) * pull * 0.5, d.y, d.z + (b.z - d.z) * pull)
    })
    if (ball.current) {
      ball.current.position.copy(b).setY(PITCH.y + 0.04 + (t > 0.3 && t < 0.42 ? Math.sin(seg(t, 0.3, 0.42) * Math.PI) * 0.06 : 0))
    }
    if (goalFlash.current) goalFlash.current.opacity = t > 0.88 && t < 0.98 ? (1 - (t - 0.88) / 0.1) * 0.9 : 0
    if (platform.current) platform.current.position.y = 1.55 + Math.sin(time * 1.1) * 0.05
    const h = node.current.hover
    if (holo.current) holo.current.opacity = 0.35 + 0.35 * h + Math.sin(time * 3) * 0.05
    if (frame.current) frame.current.opacity = 0.15 + 0.45 * h
    routeMat.uniforms.uOpacity.value = 0.75 + 0.25 * h
  })

  return (
    <group>
      {/* pitch */}
      {/* base plate: its top sits well below the turf (6 cm) so the two never fight for depth,
          not even from far away. (No polygonOffset on the turf: that pushed it behind the base
          plate at a distance, which made the pitch look black when zoomed out.) */}
      <mesh position={[0, PITCH.y - 0.09, 0]} receiveShadow castShadow>
        <boxGeometry args={[PITCH.w + 0.16, 0.06, PITCH.d + 0.16]} />
        <meshStandardMaterial color="#1e2f4a" flatShading />
      </mesh>
      <mesh position={[0, PITCH.y - 0.03, 0]} receiveShadow>
        <boxGeometry args={[PITCH.w, 0.06, PITCH.d]} />
        <meshStandardMaterial color="#1f7a57" roughness={0.9} />
      </mesh>
      <Lines />
      <Goal x={-PITCH.w / 2 - 0.02} />
      <Goal x={PITCH.w / 2 + 0.02} />

      {/* holographic frame — the XR "volume" around the tactic */}
      <lineSegments geometry={frameGeo} position={[0, PITCH.y + 0.35, 0]}>
        <lineBasicMaterial ref={frame} color={palette.holo} transparent opacity={0.2} />
      </lineSegments>

      {/* drawn routes + arrowheads */}
      {routeGeos.map((g, i) => (
        <mesh key={i} geometry={g} material={routeMat} />
      ))}
      {arrowHeads.map((a, i) => (
        <mesh key={i} position={a.end} quaternion={a.quat}>
          <coneGeometry args={[0.045, 0.1, 3]} />
          <meshBasicMaterial color="#7fe9ff" toneMapped={false} />
        </mesh>
      ))}
      {passGeos.map((g, i) => (
        <mesh key={i} geometry={g} material={passMat} />
      ))}

      {/* players */}
      {attackers.map((_, i) => (
        <Player key={i} color={BLUE} refCb={(g) => (runners.current[i] = g)} />
      ))}
      {bluesStatic.map((p, i) => (
        <group key={i} position={p}>
          <Player color={BLUE} />
        </group>
      ))}
      {defenders.map((_, i) => (
        <Player key={i} color={ORANGE} refCb={(g) => (defs.current[i] = g)} />
      ))}
      <mesh ref={ball} castShadow>
        <sphereGeometry args={[0.035, 8, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
      </mesh>
      <sprite position={[PITCH.w / 2, PITCH.y + 0.15, 0]} scale={1.1}>
        <spriteMaterial ref={goalFlash} map={glowTexture()} color="#7fe9ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      {/* floating command platform */}
      <group ref={platform} position={[-0.9, 1.55, -1.15]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.42, 0.34, 0.08, 6]} />
          <meshStandardMaterial color="#2b2838" flatShading metalness={0.3} />
        </mesh>
        <mesh position={[0, -0.05, 0]} rotation-x={Math.PI / 2}>
          <ringGeometry args={[0.28, 0.34, 6]} />
          <meshBasicMaterial color={palette.holo} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        {/* world-space panel */}
        <group position={[0, 0.34, 0.26]} rotation-x={-0.35}>
          <mesh>
            <planeGeometry args={[0.52, 0.3]} />
            <meshBasicMaterial ref={holo} color={palette.holo} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          {[-0.14, 0, 0.14].map((x) => (
            <mesh key={x} position={[x, -0.06, 0.005]}>
              <planeGeometry args={[0.1, 0.06]} />
              <meshBasicMaterial color="#e9fdff" toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
        {/* tiny coach */}
        <mesh position={[0, 0.16, -0.08]}>
          <capsuleGeometry args={[0.05, 0.13, 3, 6]} />
          <meshStandardMaterial color={palette.ink} flatShading />
        </mesh>
        {!low && (
          <sprite position={[0, -0.12, 0]} scale={1.2}>
            <spriteMaterial map={glowTexture()} color={palette.holo} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        )}
      </group>
    </group>
  )
}
