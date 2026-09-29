import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { LANGS, useI18n } from '../i18n'
import { navigate, useRoute } from '../lib/route'
import { useIsTouch } from '../lib/device'
import { ui, useUi } from '../lib/store'

export function Hud({ hints }: { hints: boolean }) {
  const { t, l, lang, setLang } = useI18n()
  const route = useRoute()
  const touch = useIsTouch()
  const inWorld = route.name === 'world'

  return (
    <>
      <header className="hud hud-tl">
        <button className="brand" onClick={() => navigate({ name: 'world' })} data-magnetic>
          <span className="brand-name">{profile.name}</span>
          <span className="brand-role">{l(profile.role)}</span>
        </button>
      </header>

      <nav className="hud hud-tr" aria-label="Main">
        <button className={`nav-link ${route.name === 'about' ? 'is-on' : ''}`} onClick={() => navigate({ name: 'about' })} data-magnetic>
          {t('about')}
        </button>
        <button className={`nav-link ${route.name === 'contact' ? 'is-on' : ''}`} onClick={() => navigate({ name: 'contact' })} data-magnetic>
          {t('contact')}
        </button>
        <div className="lang" role="group" aria-label={t('language')}>
          {LANGS.map((x) => (
            <button key={x} className={x === lang ? 'is-on' : ''} onClick={() => setLang(x)} aria-pressed={x === lang} lang={x}>
              {x.toUpperCase()}
            </button>
          ))}
        </div>
      </nav>

      <div className={`hud hud-bl ${inWorld && hints ? '' : 'is-hidden'}`} aria-hidden="true">
        <span className="hint">
          <i className="hint-ico hint-ico--drag" /> {t('dragToExplore')}
        </span>
        <span className="hint">
          <i className="hint-ico hint-ico--click" /> {touch ? t('tapAnObject') : t('clickAnObject')}
        </span>
      </div>

      <ProjectIndex hidden={!inWorld} />
    </>
  )
}

/**
 * The semantic, keyboard-accessible layer of the world: every project as a real button.
 * Focus or hover highlights the matching 3D object; Enter opens it.
 */
function ProjectIndex({ hidden }: { hidden: boolean }) {
  const { t, l } = useI18n()
  const hovered = useUi((s) => s.hovered)
  return (
    <nav className={`hud hud-br ${hidden ? 'is-hidden' : ''}`} aria-label={t('projects')} inert={hidden}>
      <p className="index-label" aria-hidden="true">
        {t('projects')}
      </p>
      <ol className="index">
        {projects.map((p) => (
          <li key={p.slug}>
            <button
              className={`index-item ${hovered === p.slug ? 'is-on' : ''}`}
              style={{ ['--accent' as string]: p.accent }}
              onClick={() => navigate({ name: 'project', slug: p.slug })}
              onFocus={() => ui.set({ hovered: p.slug })}
              onBlur={() => ui.set({ hovered: null })}
              onMouseEnter={() => ui.set({ hovered: p.slug })}
              onMouseLeave={() => ui.set({ hovered: null })}
            >
              <span className="index-num">{p.id}</span>
              <span className="index-title">{p.title.split(' — ')[0]}</span>
              <span className="visually-hidden"> — {l(p.category)}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
