import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useCanvasTexture, useNodeState, useWorldFrame } from '../common'

/**
 * Napels — a low-poly echo of Andreas' Blender townhouse: ochre facade with green shutters,
 * a blue-violet ground floor with a gelato shop and striped awning, a giant cone sign, a small
 * balcony, laundry swaying on a line, and a rooftop stair house. On hover the windows light up.
 */

const Y0 = 0.18
const W = 1.6 // width (x)
const D = 1.25 // depth (z); the front faces +z
const GROUND_H = 0.85
const TOP = 3.0
const C = {
  ochre: '#e3b766',
  base: '#7c7fb7',
  band: '#b9b6b0',
  shutter: '#2f8a57',
  frame: '#e9e2d6',
  glass: '#1d2330',
  road: '#4f5258',
  pave: '#d4c8b6',
  roofRed: '#b8432f',
  door: '#6b3f25',
}

const FLOORS = [1.28, 1.95, 2.58] // window centre heights (above Y0)

function Window({ x, y, z, rotY, glowRef }: { x: number; y: number; z: number; rotY: number; glowRef: (m: THREE.MeshStandardMaterial | null) => void }) {
  return (
    <group position={[x, Y0 + y, z]} rotation-y={rotY}>
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[0.24, 0.34]} />
        <meshStandardMaterial ref={glowRef} color={C.glass} emissive="#ffc98a" emissiveIntensity={0} />
      </mesh>
      {/* frame */}
      <mesh position={[0, -0.19, 0.02]}>
        <boxGeometry args={[0.3, 0.03, 0.05]} />
        <meshStandardMaterial color={C.frame} />
      </mesh>
      {/* open shutters */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.2, 0, 0.025]} rotation-y={s * 0.35}>
          <boxGeometry args={[0.12, 0.36, 0.02]} />
          <meshStandardMaterial color={C.shutter} flatShading />
        </mesh>
      ))}
    </group>
  )
}

export function Townhouse() {
  const node = useNodeState()
  const glass = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const towels = useRef<(THREE.Group | null)[]>([])
  const cone = useRef<THREE.Group>(null)

  const awning = useCanvasTexture(128, 64, (ctx) => {
    const cols = ['#2a9a52', '#f4f1ea', '#d8343a', '#f4f1ea']
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = cols[i % cols.length]
      ctx.fillRect(i * 8, 0, 8, 64)
    }
  })

  const windows = useMemo(() => {
    const out: { x: number; y: number; z: number; rotY: number }[] = []
    FLOORS.forEach((y, f) => {
      // front: two per floor, except the balcony door on the first floor (left)
      ;[-0.42, 0.42].forEach((x, i) => {
        if (f === 0 && i === 0) return
        out.push({ x, y, z: D / 2, rotY: 0 })
      })
      // side (+x): two per floor
      ;[-0.3, 0.3].forEach((z) => out.push({ x: W / 2, y, z, rotY: Math.PI / 2 }))
    })
    return out
  }, [])

  const towelColors = ['#e8e4dc', '#d8343a', '#4fb3d9', '#f2c14e', '#c89ad6']

  useWorldFrame((t) => {
    const h = node.current.hover
    glass.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = h * (0.6 + 0.4 * Math.sin(i * 2.3)) + 0.05
    })
    towels.current.forEach((m, i) => {
      if (m) m.rotation.x = Math.sin(t * 2.2 + i * 0.9) * 0.18 + 0.05
    })
    if (cone.current) cone.current.rotation.y = Math.sin(t * 0.8) * 0.25
  })

  return (
    <group>
      {/* street + pavement in front */}
      <mesh position={[0, Y0 + 0.02, D / 2 + 0.75]} receiveShadow>
        <boxGeometry args={[2.6, 0.04, 0.6]} />
        <meshStandardMaterial color={C.road} roughness={0.9} />
      </mesh>
      {[-0.9, -0.3, 0.3, 0.9].map((x) => (
        <mesh key={x} position={[x, Y0 + 0.042, D / 2 + 0.75]}>
          <boxGeometry args={[0.28, 0.005, 0.04]} />
          <meshBasicMaterial color="#f4f1ea" />
        </mesh>
      ))}
      <mesh position={[0, Y0 + 0.035, D / 2 + 0.23]} receiveShadow>
        <boxGeometry args={[2.2, 0.07, 0.46]} />
        <meshStandardMaterial color={C.pave} roughness={0.95} flatShading />
      </mesh>

      {/* building */}
      <mesh position={[0, Y0 + GROUND_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, GROUND_H, D]} />
        <meshStandardMaterial color={C.base} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, Y0 + (GROUND_H + TOP) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, TOP - GROUND_H, D]} />
        <meshStandardMaterial color={C.ochre} roughness={0.95} flatShading />
      </mesh>
      {[GROUND_H, 1.62, 2.28].map((y) => (
        <mesh key={y} position={[0, Y0 + y, 0]}>
          <boxGeometry args={[W + 0.03, 0.07, D + 0.03]} />
          <meshStandardMaterial color={C.band} flatShading />
        </mesh>
      ))}
      {/* parapet + roof */}
      <mesh position={[0, Y0 + TOP + 0.06, 0]} castShadow>
        <boxGeometry args={[W + 0.12, 0.14, D + 0.12]} />
        <meshStandardMaterial color={C.band} flatShading />
      </mesh>
      <mesh position={[0, Y0 + TOP + 0.08, 0]}>
        <boxGeometry args={[W - 0.08, 0.14, D - 0.08]} />
        <meshStandardMaterial color="#3a3a40" />
      </mesh>
      {/* rooftop stair house */}
      <group position={[0.45, Y0 + TOP, -0.35]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.4, 0.6, 0.4]} />
          <meshStandardMaterial color={C.ochre} flatShading />
        </mesh>
        <mesh position={[0, 0.63, 0]}>
          <boxGeometry args={[0.48, 0.06, 0.48]} />
          <meshStandardMaterial color={C.roofRed} flatShading />
        </mesh>
        <mesh position={[0, 0.24, 0.205]}>
          <planeGeometry args={[0.2, 0.4]} />
          <meshStandardMaterial color="#2f4a5c" />
        </mesh>
      </group>

      {windows.map((w, i) => (
        <Window key={i} {...w} glowRef={(m) => (glass.current[i] = m)} />
      ))}

      {/* balcony with door (first floor, front left) */}
      <group position={[-0.42, Y0 + FLOORS[0], D / 2]}>
        <mesh position={[0, 0, 0.005]}>
          <planeGeometry args={[0.24, 0.42]} />
          <meshStandardMaterial color="#35505e" />
        </mesh>
        <mesh position={[0, -0.23, 0.12]}>
          <boxGeometry args={[0.42, 0.04, 0.24]} />
          <meshStandardMaterial color={C.band} />
        </mesh>
        <mesh position={[0, -0.1, 0.235]}>
          <boxGeometry args={[0.42, 0.22, 0.01]} />
          <meshStandardMaterial color="#2a2a2e" wireframe />
        </mesh>
      </group>

      {/* ground floor: shop opening, awning, door */}
      <mesh position={[-0.38, Y0 + 0.35, D / 2 + 0.005]}>
        <planeGeometry args={[0.5, 0.6]} />
        <meshStandardMaterial color="#141418" />
      </mesh>
      {/* gelato counter with coloured tubs */}
      <mesh position={[-0.38, Y0 + 0.18, D / 2 + 0.05]}>
        <boxGeometry args={[0.36, 0.28, 0.08]} />
        <meshStandardMaterial color="#f1efe9" />
      </mesh>
      {['#f7a3b5', '#9fe0a8', '#fbe38a', '#b5d8ff', '#f5b27a'].map((c, i) => (
        <mesh key={c} position={[-0.52 + i * 0.07, Y0 + 0.33, D / 2 + 0.06]}>
          <boxGeometry args={[0.05, 0.02, 0.06]} />
          <meshBasicMaterial color={c} />
        </mesh>
      ))}
      <mesh position={[-0.38, Y0 + 0.74, D / 2 + 0.17]} rotation-x={0.55}>
        <boxGeometry args={[0.66, 0.02, 0.38]} />
        <meshStandardMaterial map={awning.texture} />
      </mesh>
      <mesh position={[0.42, Y0 + 0.3, D / 2 + 0.005]}>
        <planeGeometry args={[0.28, 0.52]} />
        <meshStandardMaterial color={C.door} />
      </mesh>

      {/* giant gelato cone sign on the pavement */}
      <group ref={cone} position={[0.02, Y0 + 0.07, D / 2 + 0.3]}>
        <mesh position={[0, 0.22, 0]} rotation-x={Math.PI}>
          <coneGeometry args={[0.09, 0.3, 8]} />
          <meshStandardMaterial color="#d9a15a" flatShading />
        </mesh>
        {[
          ['#f7a3b5', -0.05, 0.4],
          ['#9fe0a8', 0.05, 0.4],
          ['#fbe38a', 0, 0.48],
        ].map(([c, x, y]) => (
          <mesh key={c as string} position={[x as number, y as number, 0]}>
            <sphereGeometry args={[0.065, 10, 8]} />
            <meshStandardMaterial color={c as string} roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* air-conditioning unit on the side */}
      <mesh position={[W / 2 + 0.07, Y0 + 2.2, 0.28]}>
        <boxGeometry args={[0.12, 0.16, 0.24]} />
        <meshStandardMaterial color="#e9e9ea" />
      </mesh>

      {/* laundry line under the second-floor windows (front) */}
      <mesh position={[0, Y0 + 1.72, D / 2 + 0.14]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.006, 0.006, W + 0.1, 4]} />
        <meshStandardMaterial color="#9a9aa0" metalness={0.5} />
      </mesh>
      {towelColors.map((c, i) => (
        // the group pivots on the line, the towel hangs below it
        <group key={c} ref={(g) => (towels.current[i] = g)} position={[-0.6 + i * 0.3, Y0 + 1.72, D / 2 + 0.14]}>
          <mesh position={[0, -0.14, 0]}>
            <planeGeometry args={[0.2, 0.28]} />
            <meshStandardMaterial color={c} side={THREE.DoubleSide} roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
