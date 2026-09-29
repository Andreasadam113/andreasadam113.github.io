import { useMemo, useRef } from 'react'
import { Sparkles, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { projects } from '../data/projects'
import { glowTexture, palette, tubeFrom, useRouteMaterial, useWorldFrame } from './common'

/* ------------------------------------------------------------------ sky + atmosphere */

const skyVertex = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const skyFragment = /* glsl */ `
  varying vec3 vPos;
  void main() {
    float h = vPos.y;
    vec3 top = vec3(0.03, 0.028, 0.075);
    vec3 mid = vec3(0.12, 0.07, 0.17);
    vec3 horizon = vec3(0.34, 0.16, 0.21);
    vec3 col = mix(horizon, mid, smoothstep(-0.02, 0.2, h));
    col = mix(col, top, smoothstep(0.2, 0.7, h));
    // below the horizon: keep the dusk glow and fade into a deep violet abyss (depth to fly over)
    vec3 below = mix(horizon, vec3(0.1, 0.05, 0.14), smoothstep(-0.02, -0.35, h));
    below = mix(below, vec3(0.04, 0.025, 0.07), smoothstep(-0.35, -0.9, h));
    col = h < -0.02 ? below : col;
    gl_FragColor = vec4(col, 1.0);
  }
`

export function Sky() {
  return (
    <mesh scale={180} renderOrder={-1}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial vertexShader={skyVertex} fragmentShader={skyFragment} side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  )
}

export function Atmosphere({ low }: { low: boolean }) {
  return (
    <>
      <Stars radius={120} depth={30} count={low ? 800 : 2200} factor={3.5} saturation={0} fade speed={0.4} />
      {/* dust drifting through the floodlight beams */}
      <Sparkles count={low ? 40 : 140} scale={[34, 10, 24]} position={[0, 5, 0]} size={2.4} speed={0.25} opacity={0.5} color={palette.amber} />
    </>
  )
}

export function Lights({ low }: { low: boolean }) {
  return (
    <>
      <hemisphereLight args={['#9c8ae0', '#2a1f33', 1.15]} />
      <ambientLight intensity={0.35} color="#b8a8ff" />
      {/* warm key light, as if from the brightest floodlight */}
      <directionalLight
        position={[14, 22, 10]}
        intensity={2.1}
        color="#ffd6a8"
        castShadow={!low}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-far={80}
        shadow-bias={-0.0006}
      />
      {/* cool rim light from the opposite corner */}
      <directionalLight position={[-16, 10, -14]} intensity={0.9} color="#6fa8ff" />
    </>
  )
}

/* ------------------------------------------------------------------ tactic routes from the centre spot */

function Route({ to, color, index }: { to: [number, number, number]; color: string; index: number }) {
  const mat = useRouteMaterial(color, 26, 0.5, 0.75)
  const geo = useMemo(() => {
    const end = new THREE.Vector3(to[0], 0.05, to[2])
    const dir = end.clone().setY(0).normalize()
    const start = dir.clone().multiplyScalar(2.1).setY(0.05)
    end.sub(dir.clone().multiplyScalar(2.45))
    const mid = start.clone().lerp(end, 0.5)
    const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(index % 2 ? 1.1 : -1.1)
    mid.add(side)
    return tubeFrom([start, mid, end], 0.04, 80)
  }, [to, index])
  return <mesh geometry={geo} material={mat} />
}

export function Routes() {
  return (
    <>
      {projects.map((p, i) => (
        <Route key={p.slug} to={p.position} color={p.accent} index={i} />
      ))}
    </>
  )
}

/** Slow ground glow on the centre spot, breathing with the world clock. */
export function CentreGlow() {
  const ref = useRef<THREE.Sprite>(null)
  useWorldFrame((t) => {
    if (ref.current) (ref.current.material as THREE.SpriteMaterial).opacity = 0.18 + Math.sin(t * 0.8) * 0.05
  })
  return (
    <sprite ref={ref} position={[0, 0.2, 0]} scale={[7, 7, 1]}>
      <spriteMaterial map={glowTexture()} color={palette.holo} transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  )
}
