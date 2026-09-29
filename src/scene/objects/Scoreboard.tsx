import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { glowTexture, palette, tubeFrom, useCanvasTexture, useNodeState, useWorldFrame } from '../common'

/**
 * ScoreTechHockey — the laser-cut MDF sensor box with its LCD, a pole-mounted scoreboard
 * and a mini goal. Every few seconds the ball goes in: the goal sensor fires, the buzzer
 * ring pulses and the score on the display goes up.
 */

const Y0 = 0.18
const GOAL_EVERY = 6.5
const ORANGE = '#ff8a3d'

function scoreAt(t: number) {
  const n = Math.floor(t / GOAL_EVERY) % 9
  let home = 0
  let away = 0
  for (let i = 1; i <= n; i++) {
    if (i % 3 === 2) away++
    else home++
  }
  return { home, away, n }
}

function drawBoard(ctx: CanvasRenderingContext2D, home: number, away: number, clock: string, goal: boolean) {
  const W = 512
  const H = 288
  ctx.fillStyle = '#0d0c12'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = ORANGE
  ctx.fillRect(0, 0, W, 46)
  ctx.fillStyle = '#1a1015'
  ctx.font = '600 24px Sora, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText('ScoreTechHockey', 18, 24)
  ctx.textAlign = 'right'
  ctx.font = '500 20px "JetBrains Mono", monospace'
  ctx.fillText('● LIVE', W - 18, 24)
  ctx.textAlign = 'center'
  if (goal) {
    ctx.fillStyle = ORANGE
    ctx.font = '700 110px Sora, sans-serif'
    ctx.fillText('GOAL!', W / 2, 160)
  } else {
    ctx.fillStyle = '#f3ede4'
    ctx.font = '600 118px "JetBrains Mono", monospace'
    ctx.fillText(`${home}`, W * 0.25, 150)
    ctx.fillText(`${away}`, W * 0.75, 150)
    ctx.fillStyle = '#6b6577'
    ctx.fillText(':', W / 2, 146)
    ctx.font = '500 22px Sora, sans-serif'
    ctx.fillStyle = '#b9b2c6'
    ctx.fillText('HOME', W * 0.25, 222)
    ctx.fillText('AWAY', W * 0.75, 222)
  }
  ctx.fillStyle = '#2a2433'
  ctx.fillRect(W / 2 - 70, 244, 140, 34)
  ctx.fillStyle = '#ffd6b3'
  ctx.font = '500 24px "JetBrains Mono", monospace'
  ctx.fillText(clock, W / 2, 262)
}

function drawLcd(ctx: CanvasRenderingContext2D, text: string) {
  ctx.fillStyle = '#2335c9'
  ctx.fillRect(0, 0, 256, 72)
  ctx.fillStyle = '#dfe6ff'
  ctx.font = '500 26px "JetBrains Mono", monospace'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 14, 36)
}

function Engraving() {
  const { texture } = useCanvasTexture(512, 512, (ctx) => {
    ctx.clearRect(0, 0, 512, 512)
    ctx.fillStyle = 'rgba(70,40,18,0.85)'
    ctx.textAlign = 'center'
    ctx.font = '600 50px Sora, sans-serif'
    ctx.fillText('ScoreTechHockey', 256, 330)
    ctx.font = '400 26px Sora, sans-serif'
    ctx.fillText('MCT · Andreas Adam', 256, 372)
  })
  return (
    <mesh position={[0, 0, 0.452]}>
      <planeGeometry args={[0.9, 0.9]} />
      <meshStandardMaterial map={texture} transparent roughness={1} />
    </mesh>
  )
}

/** Laser-cut box with finger joints along the vertical edges. */
function MdfBox({ lcdTexture }: { lcdTexture: THREE.Texture }) {
  const tabs = useMemo(() => {
    const out: [number, number, number][] = []
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        for (let i = 0; i < 5; i++) if (i % 2 === 0) out.push([sx * 0.455, -0.36 + i * 0.18, sz * 0.455])
    return out
  }, [])
  return (
    <group position={[-0.75, Y0 + 0.45, 0.35]} rotation-y={0.25}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color={palette.mdf} roughness={0.95} />
      </mesh>
      {tabs.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.03, 0.18, 0.03]} />
          <meshStandardMaterial color="#a8784a" roughness={1} />
        </mesh>
      ))}
      {/* lid, slightly ajar */}
      <mesh position={[0.02, 0.47, 0]} rotation-z={-0.03} castShadow>
        <boxGeometry args={[0.94, 0.03, 0.94]} />
        <meshStandardMaterial color="#d2a672" roughness={0.95} />
      </mesh>
      {/* LCD */}
      <mesh position={[0, 0.2, 0.456]}>
        <boxGeometry args={[0.5, 0.15, 0.01]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0.2, 0.462]}>
        <planeGeometry args={[0.44, 0.11]} />
        <meshBasicMaterial map={lcdTexture} toneMapped={false} />
      </mesh>
      <Engraving />
      {/* shutdown button */}
      <mesh position={[0.3, -0.3, 0.46]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 10]} />
        <meshStandardMaterial color="#d33" />
      </mesh>
    </group>
  )
}

function Net() {
  const geo = useMemo(() => {
    const pts: number[] = []
    const W = 0.8
    const H = 0.4
    const D = 0.35
    for (let i = 0; i <= 8; i++) {
      const z = -W / 2 + (i / 8) * W
      pts.push(-D, 0, z, -D, H, z) // back verticals
      pts.push(0, H, z, -D, H, z) // roof
    }
    for (let j = 0; j <= 4; j++) {
      const y = (j / 4) * H
      pts.push(-D, y, -W / 2, -D, y, W / 2)
      pts.push(0, y, -W / 2, -D, y, -W / 2, 0, y, W / 2, -D, y, W / 2)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [])
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#e9e4dc" transparent opacity={0.55} />
    </lineSegments>
  )
}

export function Scoreboard() {
  const node = useNodeState()
  const board = useCanvasTexture(512, 288, (ctx) => drawBoard(ctx, 0, 0, '00:00', false))
  const lcd = useCanvasTexture(256, 72, (ctx) => drawLcd(ctx, 'HOME 0 - 0 AWAY'))
  const last = useRef({ sec: -1, goal: false, n: -1 })
  const ball = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  const ringMat = useRef<THREE.MeshBasicMaterial>(null)
  const screenGlow = useRef<THREE.SpriteMaterial>(null)
  const sensor = useRef<THREE.MeshBasicMaterial>(null)

  const cable = useMemo(
    () =>
      tubeFrom(
        [new THREE.Vector3(-0.4, Y0 + 0.05, 0.6), new THREE.Vector3(0.1, Y0 + 0.02, 1.0), new THREE.Vector3(0.75, Y0 + 0.02, 0.85), new THREE.Vector3(1.05, Y0 + 0.4, 0.62)],
        0.018,
        40,
      ),
    [],
  )
  const goalPos = new THREE.Vector3(1.25, Y0, 0.9)
  const shotFrom = new THREE.Vector3(-0.1, Y0 + 0.04, 1.6)
  const shotTo = new THREE.Vector3(1.12, Y0 + 0.04, 0.95)

  useWorldFrame((t) => {
    const phase = (t % GOAL_EVERY) / GOAL_EVERY
    // ball: rolls in during the last part of the cycle
    if (ball.current) {
      const k = THREE.MathUtils.smoothstep(phase, 0.55, 0.8)
      ball.current.position.lerpVectors(shotFrom, shotTo, k)
      ball.current.visible = phase > 0.5
    }
    const goalNow = phase > 0.8 && phase < 0.97
    const { home, away, n } = scoreAt(t + GOAL_EVERY * 0.2)
    const sec = Math.floor(t)
    const L = last.current
    if (sec !== L.sec || goalNow !== L.goal || n !== L.n) {
      const clockSecs = (sec * 7) % (35 * 60)
      const clock = `${String(Math.floor(clockSecs / 60)).padStart(2, '0')}:${String(clockSecs % 60).padStart(2, '0')}`
      board.redraw((ctx) => drawBoard(ctx, home, away, clock, goalNow))
      if (goalNow !== L.goal || n !== L.n) lcd.redraw((ctx) => drawLcd(ctx, goalNow ? '  ** GOAL **' : `HOME ${home} - ${away} AWAY`))
      L.sec = sec
      L.goal = goalNow
      L.n = n
    }
    // buzzer ring
    const r = goalNow ? (phase - 0.8) / 0.17 : 0
    if (ring.current && ringMat.current) {
      ring.current.scale.setScalar(0.4 + r * 2.2)
      ringMat.current.opacity = goalNow ? (1 - r) * 0.8 : 0
    }
    if (screenGlow.current) screenGlow.current.opacity = 0.2 + (goalNow ? 0.5 : 0) + node.current.hover * 0.25
    if (sensor.current) sensor.current.color.set(goalNow ? '#ff3b3b' : '#4dff88')
  })

  return (
    <group>
      <MdfBox lcdTexture={lcd.texture} />

      {/* buzzer pulse */}
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[-0.75, Y0 + 0.01, 0.35]}>
        <ringGeometry args={[0.55, 0.6, 32]} />
        <meshBasicMaterial ref={ringMat} color={ORANGE} transparent opacity={0} toneMapped={false} />
      </mesh>

      {/* pole-mounted external scoreboard */}
      <group position={[0.35, Y0, -0.75]} rotation-y={-0.15}>
        {[-0.55, 0.55].map((x) => (
          <mesh key={x} position={[x, 0.75, -0.02]} castShadow>
            <cylinderGeometry args={[0.035, 0.045, 1.5, 6]} />
            <meshStandardMaterial color="#2c2935" flatShading metalness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 1.55, -0.06]} castShadow>
          <boxGeometry args={[1.62, 0.95, 0.08]} />
          <meshStandardMaterial color="#17151d" flatShading />
        </mesh>
        <mesh position={[0, 1.55, -0.015]}>
          <planeGeometry args={[1.5, 0.84]} />
          <meshBasicMaterial map={board.texture} toneMapped={false} />
        </mesh>
        <sprite position={[0, 1.55, 0.25]} scale={[3, 2, 1]}>
          <spriteMaterial ref={screenGlow} map={glowTexture()} color={ORANGE} transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>

      {/* mini goal with the MPU sensor */}
      <group position={goalPos} rotation-y={Math.PI + 0.35}>
        {[-0.4, 0.4].map((z) => (
          <mesh key={z} position={[0, 0.2, z]}>
            <boxGeometry args={[0.03, 0.4, 0.03]} />
            <meshStandardMaterial color="#efeae2" />
          </mesh>
        ))}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.03, 0.03, 0.83]} />
          <meshStandardMaterial color="#efeae2" />
        </mesh>
        <Net />
        <mesh position={[0, 0.43, 0.3]}>
          <boxGeometry args={[0.06, 0.03, 0.06]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0, 0.455, 0.3]}>
          <sphereGeometry args={[0.012, 6, 4]} />
          <meshBasicMaterial ref={sensor} color="#4dff88" toneMapped={false} />
        </mesh>
      </group>
      <mesh geometry={cable}>
        <meshStandardMaterial color="#1b1a20" roughness={0.6} />
      </mesh>

      <mesh ref={ball} castShadow>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}
