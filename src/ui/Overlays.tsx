import { useEffect, useRef, useState, type ReactNode } from 'react'
import { profile } from '../data/profile'
import { getProject, projects } from '../data/projects'
import { useI18n } from '../i18n'
import { closeOverlay, navigate, useRoute } from '../lib/route'
import { ui, useUi } from '../lib/store'
import type { AboutEntry, Project } from '../types'
import { Media } from './Media'

/** Keeps the last opened value mounted while the overlay fades out. */
function useLatched<T>(value: T | null) {
  const [latched, setLatched] = useState<T | null>(value)
  if (value !== null && value !== latched) setLatched(value)
  return value ?? latched
}

/** Dialog shell: focus management, Esc handled globally in App. */
function Dialog({ open, label, className, children }: { open: boolean; label: string; className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const returnTo = useRef<Element | null>(null)
  useEffect(() => {
    if (open) {
      returnTo.current = document.activeElement
      // wait for the camera to start moving, then move focus into the dialog
      const id = setTimeout(() => ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true }), 60)
      return () => clearTimeout(id)
    }
    const el = returnTo.current as HTMLElement | null
    if (el && typeof el.focus === 'function' && document.contains(el)) el.focus({ preventScroll: true })
  }, [open])
  return (
    <div
      ref={ref}
      className={`overlay ${className} ${open ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      aria-hidden={!open}
      inert={!open}
    >
      {children}
    </div>
  )
}

function CloseButton() {
  const { t } = useI18n()
  return (
    <button className="close" onClick={closeOverlay} data-magnetic aria-label={t('close')} title={`${t('close')} (Esc)`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )
}

function Placeholder({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="ph">
      <span className="ph-tag">{t('placeholder')}</span>
      <span>{children}</span>
    </div>
  )
}

function LinkIcon({ kind }: { kind: 'live' | 'github' | 'article' | 'sketchfab' | 'linkedin' | 'mail' }) {
  const paths: Record<string, string> = {
    github:
      'M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 2.9.8.1-.6.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z',
    linkedin: 'M4.5 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3 9h3v12H3zM9 9h2.9v1.7h.1c.4-.8 1.4-1.7 3-1.7 3.1 0 3.7 2 3.7 4.7V21h-3v-6.3c0-1.5 0-3.4-2.1-3.4s-2.4 1.6-2.4 3.3V21H9z',
  }
  if (paths[kind])
    return (
      <svg viewBox="0 0 24 24" className="ico" aria-hidden="true">
        <path d={paths[kind]} fill="currentColor" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" className="ico" aria-hidden="true">
      <path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

/* ------------------------------------------------------------------ project */

/** Switches the project / About overlay between the compact side panel and a full-screen view. */
function ReaderToggle() {
  const { t } = useI18n()
  const reader = useUi((s) => s.readerMode)
  return (
    <button
      className="close reader-toggle"
      onClick={() => ui.set({ readerMode: !reader })}
      aria-pressed={reader}
      aria-label={reader ? t('compactMode') : t('readerMode')}
      title={reader ? t('compactMode') : t('readerMode')}
      data-magnetic
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {reader ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
      </svg>
    </button>
  )
}

function ProjectBody({ p }: { p: Project }) {
  const { t, l } = useI18n()
  const reader = useUi((s) => s.readerMode)
  const idx = projects.indexOf(p)
  const next = projects[(idx + 1) % projects.length]
  const links = [
    ...(p.liveUrl ? [{ kind: 'live' as const, label: t('liveDemo'), url: p.liveUrl }] : []),
    ...(p.github ? [{ kind: 'github' as const, label: 'GitHub', url: p.github }] : []),
    ...(p.links ?? []),
  ]
  const gallery = (p.images ?? []).filter((m) => m.kind === 'image')
  return (
    <>
      <aside className={`panel detail-panel ${reader ? 'is-reader' : ''}`} style={{ ['--accent' as string]: p.accent }}>
        <div className="panel-actions">
          <ReaderToggle />
          <CloseButton />
        </div>
        <div className="panel-scroll">
          {/* compact: head + body in one column, media beside the panel.
              reading view: head → big media + gallery → body (like an article). */}
          <div className="detail-layout">
            <header className="detail-head">
              <p className="eyebrow">
                <span className="eyebrow-num">{p.id}</span> {l(p.category)}
              </p>
              {p.highlight && (
                <p className="highlight">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" />
                  </svg>
                  {l(p.highlight)}
                </p>
              )}
              <h2 className="detail-title" data-autofocus tabIndex={-1}>
                {p.title}
              </h2>
              <dl className="meta">
                <div>
                  <dt>{t('year')}</dt>
                  <dd>{l(p.year)}</dd>
                </div>
                <div>
                  <dt>{t('role')}</dt>
                  <dd>{l(p.role)}</dd>
                </div>
              </dl>
            </header>

            {reader && (
              <div className="detail-side">
                <Media key={p.slug} project={p} />
                {gallery.length > 1 && (
                  <div className="reader-gallery" aria-label={t('gallery')}>
                    {gallery.map((m) =>
                      m.kind === 'image' ? (
                        <a key={m.src} href={m.src} target="_blank" rel="noopener noreferrer" className="reader-shot">
                          <img src={m.src} alt={l(m.alt)} loading="lazy" decoding="async" />
                        </a>
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="detail-body">
              <p className="lead">{l(p.shortDescription)}</p>
              <ul className="chips" aria-label={t('stack')}>
                {p.technologies.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              {links.length > 0 && (
                <div className="links">
                  {links.map((k) => (
                    <a key={k.url} className="btn" href={k.url} target="_blank" rel="noopener noreferrer" data-magnetic>
                      <LinkIcon kind={k.kind} />
                      {k.label}
                    </a>
                  ))}
                </div>
              )}

              {!reader && (
                <div className="media-inline">
                  <Media key={p.slug} project={p} />
                </div>
              )}

              <section>
                <h3>{t('theProject')}</h3>
                {p.description.map((para, i) => (
                  <p key={i}>{l(para)}</p>
                ))}
              </section>
            </div>
          </div>
        </div>
        <footer className="panel-foot">
          <button className="text-btn" onClick={closeOverlay} data-magnetic>
            ← {t('backToWorld')}
          </button>
          <button className="text-btn" onClick={() => navigate({ name: 'project', slug: next.slug })} data-magnetic>
            {t('next')} →
          </button>
        </footer>
      </aside>
      {!reader && (
        <div className="detail-media">
          <Media key={p.slug} project={p} />
        </div>
      )}
    </>
  )
}

export function ProjectOverlay() {
  const route = useRoute()
  const reader = useUi((s) => s.readerMode)
  const current = route.name === 'project' ? getProject(route.slug) ?? null : null
  const p = useLatched(current)
  return (
    <Dialog open={!!current} label={p?.title ?? ''} className={`overlay--detail ${reader ? 'is-reader' : ''}`}>
      {p && <ProjectBody p={p} />}
    </Dialog>
  )
}

/* ------------------------------------------------------------------ about */

export function AboutOverlay() {
  const route = useRoute()
  const { t, l } = useI18n()
  const open = route.name === 'about'
  const reader = useUi((s) => s.readerMode)
  const a = profile.about
  const stack = [...new Set(projects.flatMap((p) => p.technologies))]
  const list = (items: { en: string; nl: string; fr: string }[] | null) =>
    items ? (
      <ul className="bullets">
        {items.map((x, i) => (
          <li key={i}>{l(x)}</li>
        ))}
      </ul>
    ) : (
      <Placeholder>{t('listMissing')}</Placeholder>
    )
  // experience / education: title, place, period and an optional detail line
  const timeline = (items: AboutEntry[] | null) =>
    items ? (
      <ol className="timeline">
        {items.map((x, i) => (
          <li key={i}>
            <div className="timeline-head">
              <span className="timeline-what">{l(x.what)}</span>
              {x.when && <span className="timeline-when">{l(x.when)}</span>}
            </div>
            <div className="timeline-where">{x.where}</div>
            {x.detail && <p className="timeline-detail">{l(x.detail)}</p>}
          </li>
        ))}
      </ol>
    ) : (
      <Placeholder>{t('listMissing')}</Placeholder>
    )

  return (
    <Dialog open={open} label={t('about')} className={`overlay--about ${reader ? 'is-reader' : ''}`}>
      <aside className={`panel about-panel ${reader ? 'is-reader' : ''}`}>
        <div className="panel-actions">
          <ReaderToggle />
          <CloseButton />
        </div>
        <div className="panel-scroll">
          <p className="eyebrow">{t('about')}</p>
          <h2 className="detail-title" data-autofocus tabIndex={-1}>
            {profile.name}
          </h2>
          <p className="about-role">{l(profile.role)}</p>
          <p className="about-tagline">{l(profile.tagline)}</p>
          <p className="about-loc">
            <span className="dot" aria-hidden="true" /> {t('location')} {l(profile.location)}
          </p>

          <section>
            <h3>{t('bio')}</h3>
            {a.shortBio ? <p className="lead">{l(a.shortBio)}</p> : <Placeholder>{t('bioMissing')}</Placeholder>}
          </section>
          <section>
            <h3>{t('experience')}</h3>
            {timeline(a.experience)}
          </section>
          <section>
            <h3>{t('education')}</h3>
            {timeline(a.education)}
          </section>
          <div className="about-grid">
            <section className="span-all">
              <h3>{t('skills')}</h3>
              {a.skills ? (
                <ul className="chips">
                  {a.skills.map((s) => (
                    <li key={s.en}>{l(s)}</li>
                  ))}
                </ul>
              ) : (
                <Placeholder>{t('listMissing')}</Placeholder>
              )}
            </section>
            <section>
              <h3>{t('interests')}</h3>
              {list(a.interests)}
            </section>
            <section>
              <h3>{t('languages')}</h3>
              {list(a.languages)}
            </section>
          </div>
          <section>
            <h3>{t('stackAcross')}</h3>
            <ul className="chips chips--quiet">
              {stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
          <div className="links">
            <a className="btn" href={profile.contact.github} target="_blank" rel="noopener noreferrer" data-magnetic>
              <LinkIcon kind="github" /> GitHub
            </a>
            <a className="btn" href={profile.contact.linkedin} target="_blank" rel="noopener noreferrer" data-magnetic>
              <LinkIcon kind="linkedin" /> LinkedIn
            </a>
            <button className="btn btn--accent" onClick={() => navigate({ name: 'contact' })} data-magnetic>
              {t('contact')} →
            </button>
          </div>
        </div>
      </aside>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ contact */

export function ContactOverlay() {
  const route = useRoute()
  const { t } = useI18n()
  const open = route.name === 'contact'
  const [copied, setCopied] = useState(false)
  const email = profile.contact.email

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable — the mailto link still works */
    }
  }

  return (
    <Dialog open={open} label={t('contact')} className="overlay--contact">
      <div className="contact-card">
        <CloseButton />
        <p className="eyebrow">{t('contact')}</p>
        <h2 className="contact-title" data-autofocus tabIndex={-1}>
          {t('contactTitle')}
        </h2>
        <p className="contact-sub">{t('contactSub')}</p>
        <div className="contact-mail">
          <a className="mail" href={`mailto:${email}`} data-magnetic>
            {email}
          </a>
          <button className="btn btn--small" onClick={copy} data-magnetic aria-live="polite">
            {copied ? t('copied') : t('copy')}
          </button>
        </div>
        <div className="links links--center">
          <a className="btn" href={profile.contact.github} target="_blank" rel="noopener noreferrer" data-magnetic>
            <LinkIcon kind="github" /> GitHub
          </a>
          <a className="btn" href={profile.contact.linkedin} target="_blank" rel="noopener noreferrer" data-magnetic>
            <LinkIcon kind="linkedin" /> LinkedIn
          </a>
        </div>
      </div>
    </Dialog>
  )
}
