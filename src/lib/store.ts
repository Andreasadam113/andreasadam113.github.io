import { useSyncExternalStore } from 'react'

/** Minimal observable store — enough for the few bits of shared UI/3D state. */
function createStore<T extends object>(initial: T) {
  let state = initial
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set(patch: Partial<T>) {
      let changed = false
      for (const k in patch) if (patch[k] !== state[k]) changed = true
      if (!changed) return
      state = { ...state, ...patch }
      listeners.forEach((l) => l())
    },
    subscribe(l: () => void) {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

export type CursorMode = 'default' | 'hover' | 'project' | 'drag'

export const ui = createStore({
  /** Slug of the hovered object ('core' = the avatar on the centre spot). */
  hovered: null as string | null,
  cursor: 'default' as CursorMode,
  sceneReady: false,
  /** Project overlay shown full-screen (reading view) instead of as a side panel. */
  readerMode: false,
})

export function useUi<K>(select: (s: ReturnType<typeof ui.get>) => K) {
  return useSyncExternalStore(ui.subscribe, () => select(ui.get()))
}

/**
 * World clock shared by all animated objects. `scale` eases towards 0 while a
 * project is focused so ambient motion calms down, and is 0 with reduced motion.
 */
export const worldClock = { t: 0, scale: 1 }
