import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from 'react'
import { I18nProvider } from './i18n'
import { hasWebGL } from './lib/device'
import { closeOverlay, currentRoute } from './lib/route'
import { Cursor } from './ui/Cursor'
import { Fallback2D } from './ui/Fallback2D'
import { Hud } from './ui/Hud'
import { Labels } from './ui/Labels'
import { Loader } from './ui/Loader'
import { AboutOverlay, ContactOverlay, ProjectOverlay } from './ui/Overlays'

// three.js + the scene are split into their own chunk
const World = lazy(() => import('./scene/World'))

class WorldBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: unknown) {
    console.warn('3D world failed, showing 2D explorer instead.', err)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Wait (briefly) for web fonts so canvas-drawn screens use the right typefaces. */
function useFontsReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const done = () => setReady(true)
    const timer = setTimeout(done, 1500)
    document.fonts?.ready.then(done)
    return () => clearTimeout(timer)
  }, [])
  return ready
}

function Shell() {
  const [webgl] = useState(hasWebGL)
  const [failed, setFailed] = useState(false)
  const fontsReady = useFontsReady()
  const show3d = webgl && !failed

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentRoute().name !== 'world') {
        e.preventDefault()
        closeOverlay()
      }
    }
    // block accidental page scrolling (keys / touch overscroll) — the world is the page
    const onScrollKeys = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const inPanel = (e.target as HTMLElement)?.closest?.('.panel-scroll')
      if (!inPanel && tag !== 'INPUT' && tag !== 'TEXTAREA' && [' ', 'PageDown', 'PageUp'].includes(e.key) && tag !== 'BUTTON') e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keydown', onScrollKeys)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keydown', onScrollKeys)
    }
  }, [])

  return (
    <main className="app">
      {show3d ? (
        <WorldBoundary fallback={<FallbackAfterError onError={() => setFailed(true)} />}>
          <Suspense fallback={null}>{fontsReady && <World />}</Suspense>
        </WorldBoundary>
      ) : (
        <Fallback2D />
      )}
      {show3d && <Labels />}
      <Hud hints={show3d} />
      <ProjectOverlay />
      <AboutOverlay />
      <ContactOverlay />
      <Cursor />
      <Loader enabled={show3d} />
    </main>
  )
}

function FallbackAfterError({ onError }: { onError: () => void }) {
  useEffect(onError, [onError])
  return null
}

export default function App() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  )
}
