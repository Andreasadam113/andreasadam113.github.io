import { useRef, useState } from 'react'
import { useI18n } from '../i18n'
import type { Project, ProjectMedia } from '../types'

/** Horizontal carousel for images/videos. Swipe, arrows and keyboard ←/→ supported. */
export function Media({ project }: { project: Project }) {
  const { t, l } = useI18n()
  const items: ProjectMedia[] = [...(project.video ? [project.video] : []), ...(project.images ?? [])]
  const [i, setI] = useState(0)
  const touch = useRef<number | null>(null)

  if (items.length === 0) {
    return (
      <figure className="media media--generated">
        <GeneratedVisual project={project} />
        <figcaption>
          <span className="ph-tag">{t('generatedVisual')}</span>
          {project.mediaNote && <span>{l(project.mediaNote)}</span>}
        </figcaption>
      </figure>
    )
  }

  const go = (d: number) => setI((v) => (v + d + items.length) % items.length)
  const many = items.length > 1

  return (
    <div
      className="media"
      role="group"
      aria-roledescription="carousel"
      aria-label={t('gallery')}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1)
        if (e.key === 'ArrowLeft') go(-1)
      }}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return
        const dx = e.changedTouches[0].clientX - touch.current
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
        touch.current = null
      }}
    >
      <div className="media-track" style={{ transform: `translateX(${-i * 100}%)` }}>
        {items.map((m, k) => (
          <div className="media-slide" key={k} aria-hidden={k !== i} role="group" aria-label={`${t('image')} ${k + 1} / ${items.length}`}>
            <Slide m={m} active={k === i} />
          </div>
        ))}
      </div>
      {many && (
        <>
          <button className="media-arrow media-arrow--prev" onClick={() => go(-1)} aria-label={t('prev')} data-magnetic>
            ←
          </button>
          <button className="media-arrow media-arrow--next" onClick={() => go(1)} aria-label={t('next')} data-magnetic>
            →
          </button>
          <div className="media-dots">
            {items.map((_, k) => (
              <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`${t('image')} ${k + 1}`} aria-current={k === i} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Slide({ m, active }: { m: ProjectMedia; active: boolean }) {
  const { l } = useI18n()
  if (m.kind === 'image')
    return <img src={m.src} alt={l(m.alt)} loading="lazy" decoding="async" className={m.fit === 'contain' ? 'fit-contain' : ''} draggable={false} />
  if (m.kind === 'video') return <video src={m.src} poster={m.poster} controls playsInline preload="metadata" />
  if (!active) return <div className="media-video-wait" />
  const src =
    m.kind === 'youtube'
      ? `https://www.youtube-nocookie.com/embed/${m.id}`
      : m.kind === 'vimeo'
        ? `https://player.vimeo.com/video/${m.id}`
        : `https://sketchfab.com/models/${m.id}/embed?autostart=1&ui_theme=dark&ui_infos=0&ui_watermark=0&dnt=1`
  return (
    <iframe
      src={src}
      title={m.title}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen; xr-spatial-tracking"
      allowFullScreen
      loading="lazy"
    />
  )
}

/** Abstract visual generated from the project's 3D object when there are no images yet. */
export function GeneratedVisual({ project, compact = false }: { project: Project; compact?: boolean }) {
  const a = project.accent
  if (project.model === 'hockey-tactics') {
    return (
      <svg viewBox="0 0 320 200" className={`gen gen--tactics ${compact ? 'is-compact' : ''}`} role="img" aria-label={project.title}>
        <defs>
          <radialGradient id="gt-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0" stopColor={a} stopOpacity="0.28" />
            <stop offset="1" stopColor={a} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="320" height="200" fill="#0f1420" />
        <rect width="320" height="200" fill="url(#gt-glow)" />
        <g fill="none" stroke="#e8f1ea" strokeOpacity="0.55" strokeWidth="1.2">
          <rect x="20" y="22" width="280" height="156" rx="2" />
          <line x1="160" y1="22" x2="160" y2="178" />
          <line x1="94" y1="22" x2="94" y2="178" strokeOpacity="0.3" />
          <line x1="226" y1="22" x2="226" y2="178" strokeOpacity="0.3" />
          <path d="M20 58 A42 42 0 0 1 20 142" />
          <path d="M300 58 A42 42 0 0 0 300 142" />
        </g>
        <g fill="none" stroke="#7fe9ff" strokeWidth="2.4" strokeLinecap="round" className="gen-route">
          <path d="M58 100 Q90 72 130 64" />
          <path d="M80 150 Q130 158 180 138" />
          <path d="M112 108 Q170 104 212 96 T262 100" />
        </g>
        <g fill="none" stroke="#ffd08a" strokeWidth="1.6" strokeDasharray="4 5" className="gen-pass">
          <path d="M130 64 Q160 100 180 138" />
          <path d="M180 138 Q200 118 212 96" />
          <path d="M262 100 L296 104" />
        </g>
        <g fill="#4da3ff">
          {[
            [130, 64],
            [180, 138],
            [262, 100],
            [42, 70],
            [30, 100],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5.5" />
          ))}
        </g>
        <g fill="#ff8a3d">
          {[
            [214, 70],
            [230, 128],
            [256, 118],
            [168, 110],
            [292, 100],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5.5" />
          ))}
        </g>
        <circle cx="262" cy="100" r="3" fill="#fff" className="gen-ball" />
        <text x="22" y="194" fill="#7fe9ff" fontFamily="JetBrains Mono, monospace" fontSize="8" letterSpacing="1">
          XR · TACTIC 04 · SIMULATION
        </text>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 320 200" className="gen" role="img" aria-label={project.title}>
      <rect width="320" height="200" fill="#12101b" />
      {[30, 55, 80].map((r) => (
        <circle key={r} cx="160" cy="100" r={r} fill="none" stroke={a} strokeOpacity={0.6 - r / 200} />
      ))}
    </svg>
  )
}
