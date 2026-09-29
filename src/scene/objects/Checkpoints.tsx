import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { palette, useCanvasTexture, useNodeState, useRouteMaterial, useWorldFrame } from '../common'

/**
 * TagRun — a small parkour course with laser-cut RFID checkpoint boxes. A runner loops the
 * course; each checkpoint lights up when tagged and a floating lap timer keeps count.
 */

const Y0 = 0.18
const HOLO = '#62f0e6'
const LAP = 9 // seconds per lap

type Checkpoint = { pos: [number, number, number]; size: number; stack?: number; emblem?: boolean; button?: boolean; yaw: number }

const checkpoints: Checkpoint[] = [
  { pos: [-1.25, 0, -0.35], size: 0.46, emblem: true, yaw: 0.6 },
  { pos: [-0.1, 0, -1.2], size: 0.5, stack: 0.36, button: true, yaw: -0.2 },
  { pos: [1.25, 0, -0.25], size: 0.42, yaw: -0.9 },
  { pos: [0.35, 0, 1.15], size: 0.44, emblem: true, yaw: 2.6 },
]

// the runner taps each box from its front side
const tapPoints = checkpoints.map((c) => {
  const f = new THREE.Vector3(Math.sin(c.yaw), 0, Math.cos(c.yaw)).multiplyScalar(c.size / 2 + 0.22)
  return new THREE.Vector3(c.pos[0], Y0, c.pos[2]).add(f)
})

/** Obstacles sit on the runner's path: `along` = path parameter, size = [across, height, along-path]. */
const obstacles: { along: number; size: [number, number, number] }[] = [
  { along: 0.125, size: [0.5, 0.22, 0.26] },
  { along: 0.375, size: [0.62, 0.3, 0.12] },
  { along: 0.63, size: [0.55, 0.18, 0.3] },
]

function Emblem() {
  // simple running-figure engraving
  const { texture } = useCanvasTexture(256, 256, (ctx) => {
    ctx.clearRect(0, 0, 256, 256)
    ctx.strokeStyle = 'rgba(60,34,14,0.9)'
    ctx.lineWidth = 16
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.arc(150, 62, 18, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(135, 95)
    ctx.lineTo(112, 150) // torso
    ctx.moveTo(112, 150)
    ctx.lineTo(150, 180)
    ctx.lineTo(140, 222) // front leg
    ctx.moveTo(112, 150)
    ctx.lineTo(80, 180)
    ctx.lineTo(50, 170) // back leg
    ctx.moveTo(130, 108)
    ctx.lineTo(170, 125)
    ctx.lineTo(192, 105) // arm
    ctx.moveTo(130, 108)
    ctx.lineTo(95, 110)
    ctx.lineTo(80, 135)
    ctx.stroke()
  })
  return texture
}

function Box({ c, emblem, pulseRef }: { c: Checkpoint; emblem: THREE.Texture; pulseRef: (m: THREE.MeshBasicMaterial | null) => void }) {
  const base = c.stack ?? 0
  const s = c.size
  return (
    <group position={[c.pos[0], Y0, c.pos[2]]} rotation-y={c.yaw}>
      {c.stack && (
        <mesh position={[0, c.stack / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[s + 0.2, c.stack, s + 0.2]} />
          <meshStandardMaterial color={palette.concrete} flatShading />
        </mesh>
      )}
      <mesh position={[0, base + s / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[s, s, s]} />
        <meshStandardMaterial color="#cf9f6a" roughness={0.95} />
      </mesh>
      {/* RFID reader */}
      <mesh position={[0, base + s / 2, s / 2 + 0.006]}>
        <ringGeometry args={[s * 0.16, s * 0.24, 24]} />
        <meshBasicMaterial ref={pulseRef} color="#1a1a1f" toneMapped={false} />
      </mesh>
      {c.emblem && (
        <mesh position={[s / 2 + 0.004, base + s / 2, 0]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[s * 0.8, s * 0.8]} />
          <meshStandardMaterial map={emblem} transparent roughness={1} />
        </mesh>
      )}
      {c.button && (
        <mesh position={[0, base + s + 0.02, 0]}>
          <sphereGeometry args={[s * 0.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#2fd06b" emissive="#2fd06b" emissiveIntensity={0.4} roughness={0.3} />
        </mesh>
      )}
    </group>
  )
}

function drawTimer(ctx: CanvasRenderingContext2D, text: string, cp: number) {
  ctx.clearRect(0, 0, 256, 96)
  ctx.fillStyle = 'rgba(10,30,34,0.75)'
  ctx.fillRect(0, 0, 256, 96)
  ctx.strokeStyle = HOLO
  ctx.lineWidth = 3
  ctx.strokeRect(2, 2, 252, 92)
  ctx.fillStyle = HOLO
  ctx.font = '500 20px "JetBrains Mono", monospace'
  ctx.fillText(`LAP · CP ${cp}/4`, 16, 30)
  ctx.fillStyle = '#e9fdff'
  ctx.font = '600 40px "JetBrains Mono", monospace'
  ctx.fillText(text, 16, 76)
}

export function Checkpoints() {
  const node = useNodeState()
  const emblem = Emblem()
  const trailMat = useRouteMaterial(HOLO, 30, 0.8, 0.55)
  const pulses = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const rings = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const runner = useRef<THREE.Group>(null)
  const timer = useCanvasTexture(256, 96, (ctx) => drawTimer(ctx, '00:00.0', 0))
  const lastTimer = useRef('')
  const panel = useRef<THREE.Group>(null)

  // closed loop through all tap points
  const path = useMemo(() => new THREE.CatmullRomCurve3(tapPoints.map((p) => p.clone()), true, 'centripetal', 0.5), [])
  // parameter along the path where each checkpoint is tagged
  const tapT = useMemo(() => tapPoints.map((_, i) => i / tapPoints.length), [])
  const pathGeo = useMemo(() => {
    const pts = path.getSpacedPoints(120).map((p) => p.clone().setY(Y0 + 0.012))
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 160, 0.012, 4, true)
  }, [path])
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const obstaclePlacements = useMemo(
    () =>
      obstacles.map((o) => {
        const tan = path.getTangent(o.along)
        return { o, p: path.getPoint(o.along), yaw: Math.atan2(tan.x, tan.z) }
      }),
    [path],
  )

  useWorldFrame((t) => {
    const u = (t % LAP) / LAP
    const g = runner.current
    if (g) {
      path.getPoint(u, tmp)
      // small running bounce plus a vault over each obstacle
      let y = Math.abs(Math.sin(u * Math.PI * 34)) * 0.03
      for (const o of obstacles) {
        const d = Math.abs(u - o.along)
        if (d < 0.05) y += Math.cos((d / 0.05) * (Math.PI / 2)) * (o.size[1] + 0.12)
      }
      g.position.set(tmp.x, Y0 + y, tmp.z)
      const tan = path.getTangent(u)
      g.rotation.y = Math.atan2(tan.x, tan.z)
      g.rotation.x = 0.25
    }
    let reached = 0
    tapT.forEach((tt, i) => {
      const since = (u - tt + 1) % 1 // time since this checkpoint was tagged (0..1)
      if (u >= tt) reached = i + 1
      const k = Math.max(0, 1 - since * 5)
      const p = pulses.current[i]
      if (p) p.color.setRGB(0.1 + k * 0.3, 0.1 + k * 0.85, 0.12 + k * 0.8)
      const r = rings.current[i]
      if (r) r.opacity = 0.12 + k * 0.8 + node.current.hover * 0.2
    })
    const secs = u * LAP * 1.37
    const text = `00:${secs.toFixed(1).padStart(4, '0')}`
    if (text !== lastTimer.current) {
      lastTimer.current = text
      timer.redraw((ctx) => drawTimer(ctx, text, reached))
    }
    if (panel.current) panel.current.position.y = 1.55 + Math.sin(t * 1.3) * 0.04
    trailMat.uniforms.uOpacity.value = 0.45 + node.current.hover * 0.4
  })

  return (
    <group>
      {checkpoints.map((c, i) => (
        <group key={i}>
          <Box c={c} emblem={emblem} pulseRef={(m) => (pulses.current[i] = m)} />
          <mesh rotation-x={-Math.PI / 2} position={[c.pos[0], Y0 + 0.006, c.pos[2]]}>
            <ringGeometry args={[c.size * 0.85, c.size * 0.95, 32]} />
            <meshBasicMaterial ref={(m) => (rings.current[i] = m)} color={HOLO} transparent opacity={0.15} toneMapped={false} depthWrite={false} />
          </mesh>
        </group>
      ))}

      {obstaclePlacements.map(({ o, p, yaw }, i) => (
        <mesh key={i} position={[p.x, Y0 + o.size[1] / 2, p.z]} rotation-y={yaw} castShadow receiveShadow>
          <boxGeometry args={o.size} />
          <meshStandardMaterial color={palette.concrete} flatShading roughness={0.9} />
        </mesh>
      ))}

      <mesh geometry={pathGeo} material={trailMat} />

      {/* runner */}
      <group ref={runner}>
        <mesh position={[0, 0.16, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.14, 3, 6]} />
          <meshStandardMaterial color={palette.ink} flatShading />
        </mesh>
        <mesh position={[0, 0.3, 0.02]}>
          <sphereGeometry args={[0.05, 7, 5]} />
          <meshStandardMaterial color={palette.ink} flatShading />
        </mesh>
        {/* RFID tag on the wrist */}
        <mesh position={[0.07, 0.17, 0.02]}>
          <boxGeometry args={[0.03, 0.03, 0.03]} />
          <meshBasicMaterial color={HOLO} toneMapped={false} />
        </mesh>
      </group>

      {/* floating lap timer */}
      <group ref={panel} position={[0.2, 1.55, 0]}>
        <mesh>
          <planeGeometry args={[0.95, 0.36]} />
          <meshBasicMaterial map={timer.texture} transparent side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
        </mesh>
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.85, 4]} />
          <meshBasicMaterial color={HOLO} transparent opacity={0.4} />
        </mesh>
      </group>
    </group>
  )
}
