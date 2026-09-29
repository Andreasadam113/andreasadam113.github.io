/**
 * Registry linking 3D anchor objects to DOM label elements. Each ProjectNode registers an
 * invisible anchor Object3D (so the label follows the bobbing stadium), the DOM layer registers
 * elements, and a projector in the render loop moves each label to its anchor's screen position.
 */
// structural type (not THREE.Object3D) so the main bundle doesn't pull in three.js
export type LabelAnchor = {
  matrixWorld: { elements: ArrayLike<number> }
  updateWorldMatrix: (updateParents: boolean, updateChildren: boolean) => void
}
type Entry = { anchor: LabelAnchor | null; el: HTMLElement | null }
export const labels = new Map<string, Entry>()

const entry = (id: string) => {
  let e = labels.get(id)
  if (!e) {
    e = { anchor: null, el: null }
    labels.set(id, e)
  }
  return e
}

export const setLabelAnchor = (id: string, anchor: LabelAnchor | null) => {
  entry(id).anchor = anchor
}
export const setLabelElement = (id: string, el: HTMLElement | null) => {
  entry(id).el = el
}
