import { useEffect, useState } from 'react'
import { profile } from '../data/profile'
import { useI18n } from '../i18n'
import { useUi } from '../lib/store'

/** Intro screen shown until the 3D world has rendered its first frames. */
export function Loader({ enabled }: { enabled: boolean }) {
  const { t, l } = useI18n()
  const ready = useUi((s) => s.sceneReady)
  const [minTimePassed, setMinTimePassed] = useState(false)
  const [gone, setGone] = useState(!enabled)

  useEffect(() => {
    const id = setTimeout(() => setMinTimePassed(true), 900)
    return () => clearTimeout(id)
  }, [])

  const done = !enabled || (ready && minTimePassed)
  useEffect(() => {
    if (!done) return
    const id = setTimeout(() => setGone(true), 1000)
    return () => clearTimeout(id)
  }, [done])

  if (gone) return null
  return (
    <div className={`loader ${done ? 'is-done' : ''}`} role="status" aria-live="polite">
      <div className="loader-inner">
        <p className="loader-name">{profile.name}</p>
        <p className="loader-role">{l(profile.role)}</p>
        <p className="loader-tagline">{l(profile.tagline)}</p>
        <div className="loader-bar">
          <span />
        </div>
        <p className="loader-msg">{t('loading')}…</p>
      </div>
    </div>
  )
}
