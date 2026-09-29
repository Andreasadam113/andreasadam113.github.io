import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { useIsTouch } from '../lib/device'
import { useRoute } from '../lib/route'
import { useUi } from '../lib/store'

/**
 * Custom desktop cursor: small dot → expands over interactive UI → shows "OPEN" over a
 * project. Elements marked `data-magnetic` are gently pulled towards the pointer.
 * Not rendered on touch devices.
 */
export function Cursor() {
  const touch = useIsTouch()
  if (touch) return null
  return <CursorInner />
}

function CursorInner() {
  const { t } = useI18n()
  const ring = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const sceneMode = useUi((s) => s.cursor)
  const [overUi, setOverUi] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('custom-cursor')
    const pos = { x: -100, y: -100, rx: -100, ry: -100 }
    let magnet: HTMLElement | null = null
    let raf = 0

    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      pos.x = e.clientX
      pos.y = e.clientY
      setVisible(true)
      const target = e.target as HTMLElement | null
      const interactive = target?.closest<HTMLElement>('a, button, [role="button"], input, label')
      setOverUi(!!interactive)
      const m = target?.closest<HTMLElement>('[data-magnetic]') ?? null
      if (magnet && magnet !== m) magnet.style.transform = ''
      magnet = m
      if (m) {
        const r = m.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        m.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`
      }
    }
    const leave = () => setVisible(false)
    const loop = () => {
      pos.rx += (pos.x - pos.rx) * 0.2
      pos.ry += (pos.y - pos.ry) * 0.2
      if (ring.current) ring.current.style.transform = `translate3d(${pos.rx}px, ${pos.ry}px, 0)`
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    window.addEventListener('pointermove', move)
    document.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      document.documentElement.classList.remove('custom-cursor')
      if (magnet) magnet.style.transform = ''
    }
  }, [])

  // the 3D "OPEN" state only makes sense while exploring the world, never under an overlay
  const inWorld = useRoute().name === 'world'
  const mode = overUi ? 'hover' : !inWorld && sceneMode === 'project' ? 'default' : sceneMode
  return (
    <div className={`cursor cursor--${mode} ${visible ? '' : 'is-off'}`} aria-hidden="true">
      <div ref={ring} className="cursor-ring">
        <span className="cursor-label">{t('open')}</span>
      </div>
      <div ref={dot} className="cursor-dot" />
    </div>
  )
}
