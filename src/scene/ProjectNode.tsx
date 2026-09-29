import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { navigate, useRoute, type Route } from '../lib/route'
import { ui, useUi } from '../lib/store'
import { isTouch } from '../lib/device'
import { setLabelAnchor } from '../lib/labels'
import { NodeContext, damp, glowTexture, type NodeState } from './common'

type Props = {
  id: string
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  accent: string
  /** Where the invisible hit volume and label sit. */
  hitRadius?: number
  hitHeight?: number
  labelHeight?: number
  /** How far to lower the model (the objects were modelled on a 0.18-high base). */
  sink?: number
  ringRadius?: number
  to: Route
  children: ReactNode
}

/**
 * Wraps one interactive object: hover highlight, click → focus, and the floating label.
 * Children read eased hover/focus values via `useNodeState()`.
 */
export function ProjectNode({
  id,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  accent,
  hitRadius = 2.3,
  hitHeight = 3.4,
  labelHeight = 2.5,
  sink = 0.14,
  ringRadius = 2.2,
  to,
  children,
}: Props) {
  const route = useRoute()
  const hovered = useUi((s) => s.hovered === id)
  const focused =
    (route.name === 'project' && to.name === 'project' && route.slug === to.slug) ||
    (route.name === 'about' && to.name === 'about')
  const inWorld = route.name === 'world'

  const state = useRef<NodeState>({ hover: 0, focus: 0 })

  // anchor for the DOM label layer (see ui/Labels.tsx)
  // invisible anchor inside this node, so the label follows the (bobbing) stadium exactly
  const anchor = useRef<THREE.Group>(null)
  useLayoutEffect(() => {
    setLabelAnchor(id, anchor.current)
    return () => setLabelAnchor(id, null)
  }, [id])
  const group = useRef<THREE.Group>(null)
  const ring = useRef<THREE.MeshBasicMaterial>(null)
  const halo = useRef<THREE.SpriteMaterial>(null)

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1)
    const s = state.current
    s.hover = damp(s.hover, hovered && inWorld ? 1 : 0, 8, dt)
    s.focus = damp(s.focus, focused ? 1 : 0, 3, dt)
    if (group.current) group.current.scale.setScalar(scale * (1 + 0.06 * s.hover + 0.04 * s.focus))
    if (ring.current) ring.current.opacity = 0.75 * Math.max(s.hover, s.focus)
    if (halo.current) halo.current.opacity = 0.28 * Math.max(s.hover, s.focus)
  })

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!inWorld) return
    ui.set({ hovered: id, cursor: 'project' })
    // touch devices have no custom cursor; show the native pointer on hybrid devices
    if (isTouch()) document.body.style.cursor = 'pointer'
  }
  const out = () => {
    if (ui.get().hovered === id) ui.set({ hovered: null, cursor: 'default' })
    document.body.style.cursor = ''
  }
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    // ignore the click that ends a drag
    if (e.delta > 8 || !inWorld) return
    ui.set({ hovered: null, cursor: 'default' })
    navigate(to)
  }

  return (
    <group position={position} rotation={rotation}>
      <group ref={anchor} position={[0, labelHeight * scale, 0]} />
      <NodeContext.Provider value={state}>
        <group ref={group}>
          {/* hover / focus feedback: a thin ring of light on the turf, invisible at rest */}
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}>
            <ringGeometry args={[ringRadius - 0.07, ringRadius, 64]} />
            <meshBasicMaterial ref={ring} color={accent} transparent opacity={0} toneMapped={false} depthWrite={false} />
          </mesh>
          <sprite position={[0, 0.3, 0]} scale={[ringRadius * 2.6, ringRadius * 2.6, 1]}>
            <spriteMaterial ref={halo} map={glowTexture()} color={accent} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
          {/* models were built on a 0.18-high base; lower them to just above the turf and its lines */}
          <group position-y={-sink}>{children}</group>
        </group>
      </NodeContext.Provider>

      {/* invisible, generous hit volume so small parts don't make hovering fiddly */}
      <mesh position={[0, hitHeight / 2, 0]} onPointerOver={over} onPointerOut={out} onClick={click}>
        <cylinderGeometry args={[hitRadius, hitRadius, hitHeight, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

    </group>
  )
}
