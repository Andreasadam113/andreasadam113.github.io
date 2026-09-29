import { useSyncExternalStore } from 'react'
import { getProject } from '../data/projects'

/**
 * Hash routing so every overlay has its own URL and the browser back button
 * closes it — without ever reloading the 3D world.
 */
export type Route =
  | { name: 'world' }
  | { name: 'project'; slug: string }
  | { name: 'about' }
  | { name: 'contact' }

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'project' && parts[1] && getProject(parts[1])) return { name: 'project', slug: parts[1] }
  if (parts[0] === 'about') return { name: 'about' }
  if (parts[0] === 'contact') return { name: 'contact' }
  return { name: 'world' }
}

export function toHash(r: Route) {
  switch (r.name) {
    case 'project':
      return `#/project/${r.slug}`
    case 'about':
      return '#/about'
    case 'contact':
      return '#/contact'
    default:
      return '#/'
  }
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
let cachedHash = ''
let cachedRoute: Route = { name: 'world' }
const snapshot = () => {
  if (location.hash !== cachedHash) {
    cachedHash = location.hash
    cachedRoute = parseHash(cachedHash)
  }
  return cachedRoute
}

export const useRoute = () => useSyncExternalStore(subscribe, snapshot)
export const currentRoute = snapshot

const OVERLAY_MARK = 'portfolio-overlay'
const emit = () => window.dispatchEvent(new HashChangeEvent('hashchange'))

export function navigate(r: Route) {
  const from = snapshot()
  const hash = toHash(r)
  if (hash === location.hash) return
  if (r.name === 'world') return closeOverlay()
  if (from.name !== 'world') {
    // overlay → overlay: replace, so Back always returns to the world
    history.replaceState(history.state, '', hash)
  } else {
    // mark entries we pushed ourselves, so closing can simply go back
    history.pushState({ [OVERLAY_MARK]: true }, '', hash)
  }
  emit()
}

export function closeOverlay() {
  if (snapshot().name === 'world') return
  if (history.state?.[OVERLAY_MARK]) {
    history.back()
  } else {
    // opened via a deep link: there is no world entry behind us to go back to
    history.replaceState(null, '', '#/')
    emit()
  }
}
