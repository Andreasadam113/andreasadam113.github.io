import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { useI18n } from '../i18n'
import { setLabelElement } from '../lib/labels'
import { useRoute } from '../lib/route'
import { useUi } from '../lib/store'

/**
 * Markers for the 3D objects, positioned every frame by the scene's LabelProjector:
 * a small pulsing dot at rest, expanding to title + category while the object is hovered.
 */
export function Labels() {
  const { t, l } = useI18n()
  const route = useRoute()
  const hovered = useUi((s) => s.hovered)
  const ready = useUi((s) => s.sceneReady)
  const inWorld = route.name === 'world'

  const items = [
    { id: 'core', title: profile.name, cat: t('about'), accent: '#62f0e6' },
    ...projects.map((p) => ({ id: p.slug, title: p.title.split(' — ')[0], cat: l(p.category), accent: p.accent })),
  ]

  return (
    <div className={`labels ${inWorld && ready ? '' : 'is-hidden'}`} aria-hidden="true">
      {items.map((it) => (
        <div key={it.id} ref={(el) => setLabelElement(it.id, el)} className="label-anchor">
          <div className={`tag ${hovered === it.id ? 'is-active' : ''} ${it.id === 'core' ? 'tag--core' : ''}`} style={{ ['--accent' as string]: it.accent }}>
            <span className="tag-dot" />
            <span className="tag-text">
              <span className="tag-title">{it.title}</span>
              <span className="tag-cat">{it.cat}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
