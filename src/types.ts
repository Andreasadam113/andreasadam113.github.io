export type Lang = 'en' | 'nl' | 'fr'

/** A string in every supported language. */
export type Localized = Record<Lang, string>

/** One line in the About overlay's experience / education timeline. */
export type AboutEntry = { what: Localized; where: string; when?: Localized; detail?: Localized }

export type ObjectType =
  | 'portal'
  | 'screen'
  | 'device'
  | 'sculpture'
  | 'network'
  | 'world'
  | 'custom'

export type ProjectMedia =
  | { kind: 'image'; src: string; alt: Localized; fit?: 'cover' | 'contain' }
  | { kind: 'video'; src: string; poster?: string }
  | { kind: 'youtube' | 'vimeo'; id: string; title: string }
  /** Interactive Sketchfab viewer (model uid from the Sketchfab URL). */
  | { kind: 'sketchfab'; id: string; title: string }

export type ProjectLink = { label: string; url: string; kind: 'live' | 'github' | 'article' | 'sketchfab' }

export type Project = {
  id: string
  slug: string

  title: string
  year: Localized
  category: Localized
  /** Optional highlight badge shown on the detail panel, e.g. international experience. */
  highlight?: Localized

  shortDescription: Localized
  /** Paragraphs. */
  description: Localized[]
  role: Localized

  technologies: string[]

  position: [number, number, number]
  rotation: [number, number, number]
  scale: number

  objectType: ObjectType
  /** Which procedural 3D component represents this project. */
  model: 'hockey-tactics' | 'scoreboard' | 'checkpoints' | 'bridge-scan' | 'townhouse'
  /** Signature colour used in the 3D object, labels and placeholder visuals. */
  accent: string

  image?: string
  images?: ProjectMedia[]
  video?: ProjectMedia
  /** Shown when there are no images yet. */
  mediaNote?: Localized

  github?: string
  liveUrl?: string
  links?: ProjectLink[]
}
