import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import { projects } from '../data/projects'
import { lowQuality } from '../lib/device'
import { labels } from '../lib/labels'
import { ui } from '../lib/store'
import type { Project } from '../types'
import { CameraRig } from './CameraRig'
import { palette } from './common'
import { Atmosphere, CentreGlow, Lights, Routes, Sky } from './Environment'
import { FloatingBase } from './FloatingBase'
import { Stadium } from './Stadium'
import { ProjectNode } from './ProjectNode'
import { BridgeScan } from './objects/BridgeScan'
import { Checkpoints } from './objects/Checkpoints'
import { Avatar } from './objects/Avatar'
import { HockeyTactics } from './objects/HockeyTactics'
import { Scoreboard } from './objects/Scoreboard'
import { Townhouse } from './objects/Townhouse'

function ProjectModel({ project, low }: { project: Project; low: boolean }) {
  switch (project.model) {
    case 'hockey-tactics':
      return <HockeyTactics low={low} />
    case 'scoreboard':
      return <Scoreboard />
    case 'checkpoints':
      return <Checkpoints />
    case 'bridge-scan':
      return <BridgeScan low={low} />
    case 'townhouse':
      return <Townhouse />
  }
}

/** Flags the scene as ready after a few rendered frames (drives the loading screen). */
function ReadyFlag() {
  const frames = useRef(0)
  useFrame(() => {
    if (++frames.current === 4) ui.set({ sceneReady: true })
  })
  return null
}

/** Moves each DOM label to its 3D anchor's screen position every frame. */
function LabelProjector() {
  const { camera, size } = useThree()
  const v = useRef(new THREE.Vector3())
  useFrame(() => {
    // the camera rig moved the camera this frame; refresh its matrices before projecting,
    // otherwise labels trail one frame behind while orbiting
    camera.updateMatrixWorld()
    for (const { anchor, el } of labels.values()) {
      if (!el || !anchor) continue
      anchor.updateWorldMatrix(true, false)
      v.current.setFromMatrixPosition(anchor.matrixWorld as THREE.Matrix4).project(camera)
      const behind = v.current.z > 1
      const x = (v.current.x * 0.5 + 0.5) * size.width
      const y = (-v.current.y * 0.5 + 0.5) * size.height
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`
      el.style.visibility = behind ? 'hidden' : ''
    }
  })
  return null
}

export default function World() {
  const low = lowQuality()

  return (
    <Canvas
      className="world-canvas"
      shadows={low ? false : { type: THREE.PCFShadowMap }}
      dpr={[1, low ? 1.5 : 2]}
      // near = 0.5 (not 0.1): the camera is never that close, and it gives far better depth
      // precision, which prevents flickering between thin, nearly coplanar surfaces
      camera={{ fov: 38, near: 0.5, far: 400, position: [20, 18, 40] }}
      gl={{ antialias: !low, powerPreference: 'high-performance', alpha: false }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        scene.fog = new THREE.Fog('#241230', 60, 160)
        scene.background = new THREE.Color(palette.night)
      }}
      onPointerMissed={() => ui.set({ hovered: null, cursor: 'default' })}
      aria-hidden="true"
    >
      <AdaptiveDpr pixelated={false} />
      <Sky />
      <Atmosphere low={low} />
      <Lights low={low} />
      <FloatingBase low={low}>
      <Stadium low={low} />
      <Routes />
      <CentreGlow />

      <ProjectNode
        id="core"
        position={[0, 0, 0]}
        accent={palette.holo}
        sink={0}
        ringRadius={1.35}
        hitRadius={1.0}
        hitHeight={3.3}
        labelHeight={3.45}
        to={{ name: 'about' }}
      >
        <Avatar />
      </ProjectNode>

      {projects.map((p) => (
        <ProjectNode
          key={p.slug}
          id={p.slug}
          position={p.position}
          rotation={p.rotation}
          scale={p.scale}
          accent={p.accent}
          to={{ name: 'project', slug: p.slug }}
        >
          <ProjectModel project={p} low={low} />
        </ProjectNode>
      ))}
      </FloatingBase>

      <CameraRig />
      <LabelProjector />
      <ReadyFlag />
    </Canvas>
  )
}
