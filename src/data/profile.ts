import type { AboutEntry, Localized } from '../types'

/**
 * Personal info. A `null` field renders a visible "placeholder" block until it's filled in.
 * Private details from the CV (phone number, date of birth, nationality, driving licence)
 * are deliberately left out of the public site.
 */
export const profile = {
  name: 'Andreas Adam',
  role: {
    en: 'XR Development Student',
    nl: 'Student XR Development',
    fr: 'Étudiant en développement XR',
  } satisfies Localized,
  // Suggested tagline — swap for one of the alternatives in README.md if you prefer.
  tagline: {
    en: 'Building immersive XR tools and the connected systems behind them.',
    nl: 'Ik bouw immersieve XR-tools en de verbonden systemen erachter.',
    fr: 'Je conçois des outils XR immersifs et les systèmes connectés qui les animent.',
  } satisfies Localized,
  location: { en: 'Ghent, Belgium', nl: 'Gent, België', fr: 'Gand, Belgique' } satisfies Localized,

  contact: {
    // Personal address chosen over the student address so it keeps working after graduation.
    email: 'andreas.adam113@gmail.com',
    github: 'https://github.com/andreasadamhowest',
    linkedin: 'https://www.linkedin.com/in/andreas-adam-howest/',
  },

  about: {
    shortBio: {
      en: 'I’m a Multimedia & Creative Technology student at Howest in Ghent, focusing on XR development, with a background in Industrial ICT. Off-screen I play field hockey at a semi-professional level and coach players of all ages — and hockey shows up in my projects too. I’m hard-working, eager to learn, calm under pressure and at my best in a team.',
      nl: 'Ik studeer Multimedia & Creative Technology aan Howest in Gent, met focus op XR development, en heb een achtergrond in Industriële ICT. Naast het scherm speel ik hockey op semiprofniveau en geef ik training aan spelers van alle leeftijden — en ook in mijn projecten duikt hockey op. Ik ben een harde werker, leergierig, stressbestendig en het sterkst in een team.',
      fr: 'J’étudie le Multimedia & Creative Technology à la Howest à Gand, avec une spécialisation en développement XR, après une formation en ICT industrielle. En dehors des écrans, je joue au hockey sur gazon à un niveau semi-professionnel et j’entraîne des joueurs de tous âges — et le hockey se retrouve aussi dans mes projets. Travailleur, curieux d’apprendre, résistant au stress, je donne le meilleur de moi-même en équipe.',
    } as Localized | null,

    experience: [
      {
        what: { en: 'International industry project — FPT-AI', nl: 'Internationaal industrieproject — FPT-AI', fr: 'Projet industriel international — FPT-AI' },
        where: 'PTIT, Vietnam',
        when: { en: '2026', nl: '2026', fr: '2026' },
        detail: {
          en: 'Worked on site in Vietnam with the team on AI-based construction progress monitoring.',
          nl: 'Met het team ter plaatse in Vietnam gewerkt aan AI-gestuurde opvolging van bouwvoortgang.',
          fr: 'Travail sur place au Vietnam avec l’équipe sur le suivi de chantier par IA.',
        },
      },
      {
        what: { en: 'Hockey coach (student job)', nl: 'Hockeytrainer (jobstudent)', fr: 'Entraîneur de hockey (job étudiant)' },
        where: 'Constantia Hockeyclub, Waregem',
        detail: {
          en: 'Preparing and leading training sessions for young children and adult players, adapted to age and level; explaining technique and motivating players.',
          nl: 'Trainingen voorbereiden en geven aan jonge kinderen en volwassen spelers, afgestemd op leeftijd en niveau; technieken uitleggen en spelers motiveren.',
          fr: 'Préparer et animer des entraînements pour jeunes enfants et joueurs adultes, adaptés à l’âge et au niveau ; expliquer la technique et motiver les joueurs.',
        },
      },
      // (hospitality and shelf-stocking jobs are on the CV but left out here: not relevant for an XR portfolio)
    ] as AboutEntry[] | null,

    education: [
      {
        what: { en: 'Multimedia & Creative Technology (MCT)', nl: 'Multimedia & Creative Technology (MCT)', fr: 'Multimedia & Creative Technology (MCT)' },
        where: 'Howest',
        when: { en: 'Sep 2023 — present', nl: 'sept 2023 — heden', fr: 'sept. 2023 — aujourd’hui' },
      },
      {
        what: { en: 'Industrial ICT', nl: 'Industriële ICT', fr: 'ICT industrielle' },
        where: 'Don Bosco, Sint-Denijs-Westrem',
        when: { en: 'Sep 2021 — Jun 2023', nl: 'sept 2021 — juni 2023', fr: 'sept. 2021 — juin 2023' },
      },
    ] as AboutEntry[] | null,

    // soft skills from the CV; technical skills are shown via the project stack below
    skills: [
      { en: 'Teamwork', nl: 'Teamwork', fr: 'Travail d’équipe' },
      { en: 'Communication', nl: 'Communicatie', fr: 'Communication' },
      { en: 'Eager to learn', nl: 'Leergierig', fr: 'Curieux d’apprendre' },
      { en: 'Independent', nl: 'Zelfstandig', fr: 'Autonome' },
      { en: 'Stress-resistant', nl: 'Stressbestendig', fr: 'Résistant au stress' },
      { en: 'Leading a group', nl: 'Een groep leiden', fr: 'Diriger un groupe' },
    ] as Localized[] | null,

    interests: [
      { en: 'Field hockey at a semi-professional level', nl: 'Hockey op semiprofniveau', fr: 'Hockey sur gazon à un niveau semi-professionnel' },
      { en: 'Coaching hockey players of all ages', nl: 'Hockeytraining geven aan alle leeftijden', fr: 'Entraîner des joueurs de hockey de tous âges' },
    ] as Localized[] | null,

    languages: [
      { en: 'Dutch', nl: 'Nederlands', fr: 'Néerlandais' },
      { en: 'English', nl: 'Engels', fr: 'Anglais' },
      { en: 'French', nl: 'Frans', fr: 'Français' },
    ] as Localized[] | null,
  },
}
