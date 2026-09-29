import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Lang, Localized } from './types'

export const LANGS: Lang[] = ['en', 'nl', 'fr']

const ui = {
  about: { en: 'About', nl: 'Over mij', fr: 'À propos' },
  contact: { en: 'Contact', nl: 'Contact', fr: 'Contact' },
  dragToExplore: { en: 'Drag to explore', nl: 'Sleep om te verkennen', fr: 'Glissez pour explorer' },
  clickAnObject: { en: 'Click an object', nl: 'Klik op een object', fr: 'Cliquez sur un objet' },
  tapAnObject: { en: 'Tap an object', nl: 'Tik op een object', fr: 'Touchez un objet' },
  open: { en: 'Open', nl: 'Open', fr: 'Ouvrir' },
  backToWorld: { en: 'Back to world', nl: 'Terug naar de wereld', fr: 'Retour au monde' },
  close: { en: 'Close', nl: 'Sluiten', fr: 'Fermer' },
  role: { en: 'Role', nl: 'Rol', fr: 'Rôle' },
  year: { en: 'Year', nl: 'Jaar', fr: 'Année' },
  stack: { en: 'Stack', nl: 'Stack', fr: 'Stack' },
  theProject: { en: 'The project', nl: 'Het project', fr: 'Le projet' },
  placeholder: { en: 'Placeholder', nl: 'Placeholder', fr: 'Espace réservé' },
  liveDemo: { en: 'Live demo', nl: 'Live demo', fr: 'Démo' },
  next: { en: 'Next project', nl: 'Volgend project', fr: 'Projet suivant' },
  prev: { en: 'Previous', nl: 'Vorige', fr: 'Précédent' },
  media: { en: 'Media', nl: 'Media', fr: 'Médias' },
  projects: { en: 'Projects', nl: 'Projecten', fr: 'Projets' },
  location: { en: 'Based in', nl: 'Woont in', fr: 'Basé à' },
  bio: { en: 'Bio', nl: 'Bio', fr: 'Bio' },
  skills: { en: 'Skills', nl: 'Skills', fr: 'Compétences' },
  experience: { en: 'Experience', nl: 'Ervaring', fr: 'Expérience' },
  education: { en: 'Education', nl: 'Opleiding', fr: 'Formation' },
  interests: { en: 'Interests', nl: 'Interesses', fr: 'Centres d’intérêt' },
  languages: { en: 'Languages', nl: 'Talen', fr: 'Langues' },
  readerMode: { en: 'Full screen', nl: 'Volledig scherm', fr: 'Plein écran' },
  compactMode: { en: 'Compact', nl: 'Compact', fr: 'Compact' },
  stackAcross: { en: 'Stack across these projects', nl: 'Stack in deze projecten', fr: 'Technologies de ces projets' },
  bioMissing: {
    en: 'A short bio about who you are and what drives you.',
    nl: 'Een korte bio over wie je bent en wat je drijft.',
    fr: 'Une courte bio sur qui vous êtes et ce qui vous anime.',
  },
  listMissing: { en: 'To be added.', nl: 'Nog aan te vullen.', fr: 'À compléter.' },
  contactTitle: {
    en: 'Looking for an internship',
    nl: 'Op zoek naar een stage',
    fr: 'À la recherche d’un stage',
  },
  contactSub: {
    en: 'I’m an XR development student looking for an internship. Does your team build immersive or interactive experiences? I’d love to hear from you.',
    nl: 'Ik ben student XR development en op zoek naar een stageplek. Bouwt jouw team immersieve of interactieve ervaringen? Dan hoor ik graag van je.',
    fr: 'Étudiant en développement XR, je cherche un stage. Votre équipe crée des expériences immersives ou interactives ? Je serais ravi d’échanger avec vous.',
  },
  copy: { en: 'Copy', nl: 'Kopieer', fr: 'Copier' },
  copied: { en: 'Copied', nl: 'Gekopieerd', fr: 'Copié' },
  loading: { en: 'Lighting the floodlights', nl: 'De lichtmasten gaan aan', fr: 'Allumage des projecteurs' },
  fallbackNote: {
    en: 'Your browser can’t run the 3D world, so here is the stadium as a tactics board.',
    nl: 'Je browser kan de 3D-wereld niet draaien, dus hier is het stadion als tactiekbord.',
    fr: 'Votre navigateur ne peut pas afficher le monde 3D : voici le stade sous forme de tableau tactique.',
  },
  skipTo: { en: 'Projects', nl: 'Projecten', fr: 'Projets' },
  language: { en: 'Language', nl: 'Taal', fr: 'Langue' },
  gallery: { en: 'Gallery', nl: 'Galerij', fr: 'Galerie' },
  image: { en: 'Image', nl: 'Afbeelding', fr: 'Image' },
  generatedVisual: { en: 'Generated visual', nl: 'Gegenereerd beeld', fr: 'Visuel généré' },
} satisfies Record<string, Localized>

export type UiKey = keyof typeof ui

type I18n = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: UiKey) => string
  l: (value: Localized) => string
}

const Ctx = createContext<I18n | null>(null)

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('lang') as Lang | null
    if (saved && LANGS.includes(saved)) return saved
  } catch {
    /* storage unavailable */
  }
  const nav = (navigator.language || 'en').slice(0, 2) as Lang
  return LANGS.includes(nav) ? nav : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem('lang', l)
    } catch {
      /* storage unavailable */
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<I18n>(
    () => ({ lang, setLang, t: (key) => ui[key][lang], l: (v) => v[lang] }),
    [lang, setLang],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n outside I18nProvider')
  return ctx
}
