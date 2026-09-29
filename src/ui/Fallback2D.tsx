import { FIELD } from '../data/field'
import { projects } from '../data/projects'
import { profile } from '../data/profile'
import { useI18n } from '../i18n'
import { navigate } from '../lib/route'
import { ui, useUi } from '../lib/store'
import { GeneratedVisual } from './Media'

const HX = FIELD.length / 2 + FIELD.margin
const HZ = FIELD.width / 2 + FIELD.margin

/**
 * Shown when WebGL is unavailable (or with ?view=2d): the same stadium pitch, drawn as a
 * top-down tactics board. Every project is a real button and opens the same detail overlay.
 */
export function Fallback2D() {
  const { t, l } = useI18n()
  const hovered = useUi((s) => s.hovered)
  const left = (x: number) => 50 + (x / HX) * 50
  const top = (z: number) => 50 + (z / HZ) * 50
  const { length: Lf, width: Wf, quarter, circle } = FIELD

  return (
    <div className="fallback">
      <div className="fallback-map" style={{ aspectRatio: `${HX} / ${HZ}` }}>
        <svg viewBox={`${-HX} ${-HZ} ${HX * 2} ${HZ * 2}`} className="fallback-svg" aria-hidden="true">
          <rect x={-HX} y={-HZ} width={HX * 2} height={HZ * 2} rx="0.6" fill="#2c6048" />
          <rect x={-Lf / 2} y={-Wf / 2} width={Lf} height={Wf} fill="#1d4e8c" />
          <g fill="none" stroke="#eef3f7" strokeOpacity="0.75" strokeWidth="0.1">
            <rect x={-Lf / 2} y={-Wf / 2} width={Lf} height={Wf} />
            <line x1="0" y1={-Wf / 2} x2="0" y2={Wf / 2} />
            <line x1={-quarter} y1={-Wf / 2} x2={-quarter} y2={Wf / 2} strokeOpacity="0.4" />
            <line x1={quarter} y1={-Wf / 2} x2={quarter} y2={Wf / 2} strokeOpacity="0.4" />
            <path d={`M${-Lf / 2} ${-circle} A${circle} ${circle} 0 0 1 ${-Lf / 2} ${circle}`} />
            <path d={`M${Lf / 2} ${-circle} A${circle} ${circle} 0 0 0 ${Lf / 2} ${circle}`} />
          </g>
          <circle r="2.1" fill="none" stroke="#62f0e6" strokeOpacity="0.5" strokeWidth="0.1" />
          {projects.map((p, i) => {
            const [x, , z] = p.position
            const mx = x / 2 + (i % 2 ? -z : z) * 0.15
            const my = z / 2 + (i % 2 ? x : -x) * 0.15
            return (
              <path
                key={p.slug}
                d={`M${x * 0.25} ${z * 0.25} Q${mx} ${my} ${x * 0.7} ${z * 0.7}`}
                fill="none"
                stroke={p.accent}
                strokeWidth={hovered === p.slug ? 0.22 : 0.14}
                strokeDasharray="0.5 0.5"
                className="fallback-route"
              />
            )
          })}
        </svg>

        <button className="fallback-core" onClick={() => navigate({ name: 'about' })} style={{ left: '50%', top: '50%' }}>
          <span className="fallback-core-dot" aria-hidden="true" />
          <span>{profile.name}</span>
          <small>{t('about')}</small>
        </button>

        {projects.map((p) => (
          <button
            key={p.slug}
            className={`fallback-node ${hovered === p.slug ? 'is-on' : ''}`}
            style={{ left: `${left(p.position[0])}%`, top: `${top(p.position[2])}%`, ['--accent' as string]: p.accent }}
            onClick={() => navigate({ name: 'project', slug: p.slug })}
            onMouseEnter={() => ui.set({ hovered: p.slug })}
            onMouseLeave={() => ui.set({ hovered: null })}
          >
            <span className="fallback-thumb">
              {p.image ? <img src={p.image} alt="" loading="lazy" /> : <GeneratedVisual project={p} compact />}
            </span>
            <span className="fallback-meta">
              <span className="fallback-num">{p.id}</span>
              <span className="fallback-title">{p.title.split(' — ')[0]}</span>
              <span className="fallback-cat">{l(p.category)}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="fallback-note">{t('fallbackNote')}</p>
    </div>
  )
}
