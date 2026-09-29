import { useSyncExternalStore } from 'react'

function mediaHook(query: string) {
  const mql = typeof window !== 'undefined' ? window.matchMedia(query) : null
  const subscribe = (cb: () => void) => {
    mql?.addEventListener('change', cb)
    return () => mql?.removeEventListener('change', cb)
  }
  const get = () => mql?.matches ?? false
  return { use: () => useSyncExternalStore(subscribe, get), get }
}

const reduced = mediaHook('(prefers-reduced-motion: reduce)')
const coarse = mediaHook('(pointer: coarse)')
const narrow = mediaHook('(max-width: 760px)')

export const useReducedMotion = reduced.use
export const prefersReducedMotion = reduced.get
export const useIsTouch = coarse.use
export const isTouch = coarse.get
export const useIsNarrow = narrow.use
export const isNarrow = narrow.get

/** Lower-cost rendering for phones / touch-first devices. */
export const lowQuality = () => isTouch() || isNarrow() || (navigator.hardwareConcurrency ?? 8) <= 4

export function hasWebGL() {
  const params = new URLSearchParams(location.search)
  if (params.get('view') === '2d') return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
