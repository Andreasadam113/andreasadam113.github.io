import type { Project } from '../types'
import { faceIn, faceOut } from './field'

/** Public-folder URL that also works when the site is served from a sub-path (GitHub Pages). */
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

/**
 * All portfolio projects. The 3D scene, the detail overlay, the keyboard/screen-reader
 * navigation and the 2D fallback are all generated from this list.
 *
 * Arrangement: spatial (no ranking) — the four projects are spread over the pitch around
 * the headset on the centre spot, so the stadium stays balanced from every angle.
 */
export const projects: Project[] = [
  {
    id: '01',
    slug: 'scoretechhockey',
    title: 'ScoreTechHockey',
    year: { en: '2025', nl: '2025', fr: '2025' },
    category: {
      en: 'IoT · Real-time web',
      nl: 'IoT · Realtime web',
      fr: 'IoT · Web temps réel',
    },
    shortDescription: {
      en: 'A smart field-hockey scoreboard that detects goals with sensors and streams score and time live to a physical display and a web dashboard.',
      nl: 'Een slim scorebord voor veldhockey dat goals detecteert met sensoren en score en tijd live doorstuurt naar een fysiek display en een webdashboard.',
      fr: 'Un tableau de score intelligent pour le hockey sur gazon qui détecte les buts par capteurs et diffuse score et temps en direct vers un écran physique et un tableau de bord web.',
    },
    description: [
      {
        en: 'ScoreTechHockey is a scoreboard platform for field hockey that tracks goals and game time automatically. Players, referees and fans follow the match in real time — on an external display next to the field and on a responsive website.',
        nl: 'ScoreTechHockey is een scorebordplatform voor veldhockey dat goals en speeltijd automatisch bijhoudt. Spelers, scheidsrechters en supporters volgen de match in realtime — op een extern display naast het veld en op een responsive website.',
        fr: 'ScoreTechHockey est une plateforme de tableau de score pour le hockey sur gazon qui suit automatiquement les buts et le temps de jeu. Joueurs, arbitres et supporters suivent le match en temps réel — sur un écran à côté du terrain et sur un site responsive.',
      },
      {
        en: 'A Raspberry Pi 4 reads an MPU sensor mounted on the goal to detect when the ball goes in, a real-time clock keeps accurate time without Wi-Fi, and a humidity sensor logs field conditions. A buzzer sounds on every goal. Everything is stored in a normalised (3NF) database and pushed live to the web dashboard with FastAPI and Socket.IO.',
        nl: 'Een Raspberry Pi 4 leest een MPU-sensor op de goal uit om te detecteren wanneer de bal binnengaat, een real-time clock houdt de tijd bij zonder wifi en een vochtigheidssensor logt de veldomstandigheden. Bij elke goal klinkt een buzzer. Alles wordt opgeslagen in een genormaliseerde (3NF) database en live naar het webdashboard gestuurd via FastAPI en Socket.IO.',
        fr: 'Un Raspberry Pi 4 lit un capteur MPU fixé sur le but pour détecter l’entrée du ballon, une horloge temps réel garde l’heure sans Wi-Fi et un capteur d’humidité enregistre l’état du terrain. Un buzzer retentit à chaque but. Tout est stocké dans une base de données normalisée (3FN) et envoyé en direct au tableau de bord via FastAPI et Socket.IO.',
      },
      {
        en: 'The website shows a live dashboard (score, game timer, match history), the league standings, real-time sensor graphs and an admin area to edit the score, pause the game or shut the Pi down remotely. The electronics live in a laser-cut MDF case.',
        nl: 'De website toont een live dashboard (score, wedstrijdtimer, matchhistoriek), het klassement, realtime sensorgrafieken en een admingedeelte om de score aan te passen, de match te pauzeren of de Pi op afstand uit te schakelen. De elektronica zit in een lasergesneden MDF-behuizing.',
        fr: 'Le site affiche un tableau de bord en direct (score, chrono, historique), le classement, des graphiques de capteurs en temps réel et un espace admin pour modifier le score, mettre le match en pause ou éteindre le Pi à distance. L’électronique est logée dans un boîtier en MDF découpé au laser.',
      },
    ],
    role: { en: 'Solo developer & maker', nl: 'Solo developer & maker', fr: 'Développeur & maker (solo)' },
    technologies: ['Raspberry Pi 4', 'Python', 'FastAPI', 'Socket.IO', 'MySQL', 'HTML', 'CSS', 'JavaScript', 'Fritzing', 'Illustrator', 'Laser cutting'],
    position: [8.6, 0, -3.4],
    rotation: faceOut(8.6, -3.4),
    scale: 1.3,
    objectType: 'device',
    model: 'scoreboard',
    accent: '#ff8a3d',
    image: asset('projects/scoretechhockey/hero.webp'),
    images: [
      { kind: 'image', src: asset('projects/scoretechhockey/hero.webp'), alt: { en: 'The laser-cut ScoreTechHockey case with its LCD', nl: 'De lasergesneden ScoreTechHockey-behuizing met lcd', fr: 'Le boîtier ScoreTechHockey découpé au laser avec son écran LCD' } },
      { kind: 'image', src: asset('projects/scoretechhockey/dashboard.webp'), alt: { en: 'Live web dashboard with the score', nl: 'Live webdashboard met de score', fr: 'Tableau de bord web avec le score en direct' }, fit: 'contain' },
      { kind: 'image', src: asset('projects/scoretechhockey/goal.webp'), alt: { en: 'Hockey goal with the sensor setup', nl: 'Hockeygoal met de sensoropstelling', fr: 'But de hockey équipé des capteurs' } },
      { kind: 'image', src: asset('projects/scoretechhockey/circuit.webp'), alt: { en: 'Fritzing breadboard diagram', nl: 'Fritzing-breadboarddiagram', fr: 'Schéma de câblage Fritzing' }, fit: 'contain' },
      { kind: 'image', src: asset('projects/scoretechhockey/wiring.webp'), alt: { en: 'The prototype wiring', nl: 'De bedrading van het prototype', fr: 'Le câblage du prototype' } },
      { kind: 'image', src: asset('projects/scoretechhockey/database.webp'), alt: { en: 'EER diagram of the database', nl: 'EER-diagram van de database', fr: 'Diagramme EER de la base de données' }, fit: 'contain' },
      { kind: 'image', src: asset('projects/scoretechhockey/case-open.webp'), alt: { en: 'The case with its lid open', nl: 'De behuizing met open deksel', fr: 'Le boîtier ouvert' } },
    ],
    // The Howest classroom repo is private (404 for visitors). Make it public and uncomment to show it:
    // github: 'https://github.com/howest-mct/2024-2025-projectone-mct-AndreasAdam2',
    links: [
      { kind: 'article', label: 'Instructables', url: 'https://www.instructables.com/ScoreTechHockey-a-Real-time-Hockey-Scoreboard/' },
    ],
  },
  {
    id: '02',
    slug: 'tagrun',
    title: 'TagRun',
    year: { en: '2025', nl: '2025', fr: '2025' },
    category: { en: 'IoT · Sports tech', nl: 'IoT · Sporttech', fr: 'IoT · Tech sportive' },
    shortDescription: {
      en: 'An RFID-based training system for parkour and freerunning that tracks athletes at checkpoints and shows results in real time.',
      nl: 'Een RFID-trainingssysteem voor parkour en freerunning dat atleten volgt aan checkpoints en resultaten in realtime toont.',
      fr: 'Un système d’entraînement RFID pour le parkour et le freerunning qui suit les athlètes aux checkpoints et affiche les résultats en temps réel.',
    },
    description: [
      {
        en: 'TagRun turns a parkour or freerunning session into interactive checkpoint challenges. Athletes identify themselves at RFID checkpoints while they move, and their performance is tracked in real time — combining IoT, web development and gamification into a training and competition experience.',
        nl: 'TagRun maakt van een parkour- of freerunsessie een reeks interactieve checkpoint-uitdagingen. Atleten identificeren zich onderweg aan RFID-checkpoints en hun prestaties worden in realtime gevolgd — een combinatie van IoT, webontwikkeling en gamification tot een trainings- en competitie-ervaring.',
        fr: 'TagRun transforme une session de parkour ou de freerunning en défis interactifs à checkpoints. Les athlètes s’identifient aux checkpoints RFID en pleine course et leurs performances sont suivies en temps réel — un mélange d’IoT, de développement web et de gamification.',
      },
      {
        en: 'RFID hardware at each checkpoint captures the athlete, a Raspberry Pi handles the device side and forwards the data, FastAPI exposes it, and a React dashboard presents the results. Because it is used during physical challenges, the interface had to be fast and readable at a glance.',
        nl: 'RFID-hardware aan elk checkpoint registreert de atleet, een Raspberry Pi verwerkt de hardwarekant en stuurt de data door, FastAPI stelt ze beschikbaar en een React-dashboard toont de resultaten. Omdat het tijdens fysieke uitdagingen gebruikt wordt, moest de interface snel en in één oogopslag leesbaar zijn.',
        fr: 'Le matériel RFID de chaque checkpoint identifie l’athlète, un Raspberry Pi gère la partie matérielle et transmet les données, FastAPI les expose et un tableau de bord React affiche les résultats. Utilisée pendant l’effort, l’interface devait être rapide et lisible d’un coup d’œil.',
      },
    ],
    role: { en: 'Team project', nl: 'Teamproject', fr: 'Projet d’équipe' },
    technologies: ['Python', 'React', 'FastAPI', 'MySQL', 'Raspberry Pi', 'RFID', 'Electronics'],
    position: [5.4, 0, 4.4],
    rotation: faceOut(5.4, 4.4),
    scale: 1.3,
    objectType: 'custom',
    model: 'checkpoints',
    accent: '#62f0e6',
    image: asset('projects/tagrun/hero.webp'),
    images: [
      { kind: 'image', src: asset('projects/tagrun/hero.webp'), alt: { en: 'TagRun laser-cut checkpoint boxes with RFID readers', nl: 'Lasergesneden TagRun-checkpointboxen met RFID-lezers', fr: 'Boîtiers checkpoints TagRun découpés au laser avec lecteurs RFID' }, fit: 'contain' },
      { kind: 'image', src: asset('projects/tagrun/team.webp'), alt: { en: 'The TagRun team in the Howest sports hall, on the parkour setup', nl: 'Het TagRun-team in de sporthal van Howest, op de parkouropstelling', fr: 'L’équipe TagRun dans la salle de sport de Howest, sur le parcours' }, fit: 'contain' },
    ],
  },
  {
    id: '03',
    slug: 'fpt-ai',
    title: 'FPT-AI — Construction Progress Monitoring',
    year: { en: '2026', nl: '2026', fr: '2026' },
    category: { en: 'AI · Computer vision', nl: 'AI · Computervisie', fr: 'IA · Vision par ordinateur' },
    highlight: { en: 'International · Vietnam', nl: 'Internationaal · Vietnam', fr: 'International · Vietnam' },
    shortDescription: {
      en: 'An international industry project with PTIT in Vietnam that analyses drone footage and compares it with a 3D structural model to monitor construction progress automatically.',
      nl: 'Een internationaal industrieproject met PTIT in Vietnam dat dronebeelden analyseert en vergelijkt met een 3D-structuurmodel om bouwvoortgang automatisch op te volgen.',
      fr: 'Un projet industriel international avec le PTIT au Vietnam, qui analyse des images de drone et les compare à un modèle structurel 3D pour suivre automatiquement l’avancement d’un chantier.',
    },
    description: [
      {
        en: 'The project was carried out in collaboration with PTIT (Posts and Telecommunications Institute of Technology) in Vietnam, and our team travelled to Vietnam to work on it there.',
        nl: 'Het project liep in samenwerking met PTIT (Posts and Telecommunications Institute of Technology) in Vietnam, en ons team is naar Vietnam gereisd om er ter plaatse aan te werken.',
        fr: 'Le projet a été mené en collaboration avec le PTIT (Posts and Telecommunications Institute of Technology) au Vietnam, et notre équipe s’est rendue au Vietnam pour y travailler sur place.',
      },
      {
        en: 'This project automates construction progress monitoring with UAV (drone) footage and a 3D structural model. Computer vision detects structural elements such as beams and columns, aligns them with the digital model and estimates how far construction has progressed.',
        nl: 'Dit project automatiseert de opvolging van bouwvoortgang met UAV-beelden (drone) en een 3D-structuurmodel. Computervisie detecteert structurele elementen zoals balken en kolommen, lijnt ze uit met het digitale model en schat hoever de bouw gevorderd is.',
        fr: 'Ce projet automatise le suivi d’avancement de chantier à partir d’images de drone (UAV) et d’un modèle structurel 3D. La vision par ordinateur détecte les éléments structurels comme les poutres et colonnes, les aligne avec le modèle numérique et estime l’avancement.',
      },
      {
        en: 'Footage is processed into a point cloud (with MASt3R-SLAM and related AI tooling) and compared against the BIM / structural model. Unity and C# are used to map out the drone flight path. The result is a visual report of completed, partially completed and unfinished components — reducing manual on-site inspections and making site comparisons more consistent.',
        nl: 'De beelden worden verwerkt tot een pointcloud (met MASt3R-SLAM en verwante AI-tools) en vergeleken met het BIM-/structuurmodel. Unity en C# worden gebruikt om de vliegroute van de drone uit te stippelen. Het resultaat is een visueel rapport van afgewerkte, deels afgewerkte en onafgewerkte onderdelen — minder manuele inspecties op de werf en consistentere vergelijkingen.',
        fr: 'Les images sont transformées en nuage de points (avec MASt3R-SLAM et des outils d’IA associés) puis comparées au modèle BIM / structurel. Unity et C# servent à planifier la trajectoire du drone. Le résultat est un rapport visuel des éléments terminés, partiellement terminés et non terminés — moins d’inspections manuelles et des comparaisons plus cohérentes.',
      },
    ],
    role: {
      en: 'International industry project (team, with PTIT)',
      nl: 'Internationaal industrieproject (team, met PTIT)',
      fr: 'Projet industriel international (équipe, avec le PTIT)',
    },
    technologies: ['MASt3R-SLAM', 'Point clouds', 'BIM', 'Unity', 'C#', 'HTML', 'CSS', 'JavaScript'],
    position: [-7.2, 0, 3.9],
    rotation: faceOut(-7.2, 3.9),
    scale: 1.3,
    objectType: 'network',
    model: 'bridge-scan',
    accent: '#ffc94d',
    image: asset('projects/fpt-ai/hero.webp'),
    images: [
      {
        kind: 'image',
        src: asset('projects/fpt-ai/dashboard.webp'),
        alt: {
          en: 'Progress dashboard: drone video, 3D BIM model coloured completed / in progress / not started, overall progress and planned vs actual',
          nl: 'Voortgangsdashboard: dronevideo, 3D-BIM-model gekleurd als afgewerkt / bezig / niet gestart, totale voortgang en gepland vs. werkelijk',
          fr: 'Tableau de bord : vidéo drone, modèle BIM 3D coloré terminé / en cours / non commencé, avancement global et prévu vs réel',
        },
        fit: 'contain',
      },
      {
        kind: 'image',
        src: asset('projects/fpt-ai/reconstruction.webp'),
        alt: {
          en: '3D reconstruction of the site from drone footage, with the bridge deck highlighted',
          nl: '3D-reconstructie van de werf uit dronebeelden, met het brugdek gemarkeerd',
          fr: 'Reconstruction 3D du chantier à partir des images de drone, tablier du pont mis en évidence',
        },
        fit: 'contain',
      },
      {
        kind: 'image',
        src: asset('projects/fpt-ai/pointcloud-progress.webp'),
        alt: {
          en: 'Point cloud of the bridge coloured by construction progress',
          nl: 'Pointcloud van de brug, gekleurd volgens de bouwvoortgang',
          fr: 'Nuage de points du pont coloré selon l’avancement des travaux',
        },
        fit: 'contain',
      },
      { kind: 'image', src: asset('projects/fpt-ai/poster.webp'), alt: { en: 'FPT-AI project poster', nl: 'Projectposter FPT-AI', fr: 'Affiche du projet FPT-AI' }, fit: 'contain' },
      { kind: 'image', src: asset('projects/fpt-ai/hero.webp'), alt: { en: 'Aerial view of the bridge construction site', nl: 'Luchtbeeld van de brugwerf', fr: 'Vue aérienne du chantier du pont' }, fit: 'contain' },
    ],
  },
  {
    id: '04',
    slug: 'xr-hockey-tactics',
    title: 'XR Hockey Tactics Simulator',
    year: { en: 'In development', nl: 'In ontwikkeling', fr: 'En développement' },
    category: { en: 'XR · Sports analysis', nl: 'XR · Sportanalyse', fr: 'XR · Analyse sportive' },
    shortDescription: {
      en: 'A Meta Quest tool for designing, simulating and analysing field-hockey tactics in 3D — from a coach’s overview down to a player’s view on the pitch.',
      nl: 'Een Meta Quest-tool om hockeytactieken in 3D te ontwerpen, te simuleren en te analyseren — van het overzicht van de coach tot het zicht van een speler op het veld.',
      fr: 'Un outil Meta Quest pour concevoir, simuler et analyser des tactiques de hockey en 3D — de la vue d’ensemble du coach à la vue d’un joueur sur le terrain.',
    },
    description: [
      {
        en: 'Instead of a flat tactics board, the user stands above a virtual hockey field and works directly with player positions, movement routes and passes. The goal is to show how XR can improve the spatial understanding of sports tactics.',
        nl: 'In plaats van een plat tactiekbord staat de gebruiker boven een virtueel hockeyveld en werkt hij rechtstreeks met spelersposities, looplijnen en passes. Het doel is te tonen hoe XR het ruimtelijk inzicht in sporttactiek kan verbeteren.',
        fr: 'Au lieu d’un tableau tactique plat, l’utilisateur se tient au-dessus d’un terrain de hockey virtuel et manipule directement positions, courses et passes. L’objectif : montrer comment la XR améliore la compréhension spatiale des tactiques sportives.',
      },
      {
        en: 'Players of two teams are spawned as markers and grabbed into place with the Quest controllers. Routes are drawn straight onto the field and shown as glowing holographic lines and arrows. A simulation then plays the tactic out: players follow their routes and the ball moves between them through passes — with pause, reset and adjust to test alternatives, and a timeline to replay how the play develops.',
        nl: 'Spelers van twee teams worden als markers gespawnd en met de Quest-controllers op hun plaats gezet. Looplijnen worden rechtstreeks op het veld getekend en verschijnen als gloeiende holografische lijnen en pijlen. Een simulatie speelt de tactiek daarna af: spelers volgen hun route en de bal gaat via passes van speler naar speler — met pauze, reset en aanpassen om alternatieven te testen, en een tijdlijn om de fase te herbekijken.',
        fr: 'Les joueurs des deux équipes apparaissent comme des marqueurs et se placent à la main avec les manettes Quest. Les courses se dessinent directement sur le terrain, en lignes et flèches holographiques lumineuses. Une simulation joue ensuite la tactique : les joueurs suivent leurs trajets et le ballon circule par des passes — avec pause, réinitialisation et ajustements pour tester des alternatives, et une timeline pour revoir l’action.',
      },
      {
        en: 'The user starts on a floating command platform with a world-space interface, and can teleport to the sidelines or onto the pitch to watch the play from a player’s perspective — analysing spacing and timing in a way a traditional tactics board can’t.',
        nl: 'De gebruiker start op een zwevend commandoplatform met een interface in de 3D-ruimte en kan teleporteren naar de zijlijn of het veld op om de fase vanuit het perspectief van een speler te bekijken — zo analyseer je afstanden en timing op een manier die met een klassiek tactiekbord niet kan.',
        fr: 'L’utilisateur démarre sur une plateforme de commande flottante avec une interface dans l’espace 3D, et peut se téléporter sur la ligne de touche ou sur le terrain pour vivre l’action du point de vue d’un joueur — une analyse des distances et du timing impossible sur un tableau classique.',
      },
    ],
    role: { en: 'XR developer', nl: 'XR-developer', fr: 'Développeur XR' },
    technologies: ['Unity', 'Meta Quest', 'XR controllers', 'World-space UI'],
    position: [-5.6, 0, -4.2],
    rotation: faceOut(-5.6, -4.2),
    scale: 1.35,
    objectType: 'world',
    model: 'hockey-tactics',
    accent: '#4da3ff',
    mediaNote: {
      en: 'Screenshots coming soon — this visual is generated from the tactics object.',
      nl: 'Screenshots volgen binnenkort — dit beeld is gegenereerd op basis van het tactiekobject.',
      fr: 'Captures d’écran à venir — ce visuel est généré à partir de l’objet tactique.',
    },
  },
  {
    id: '05',
    slug: 'napels',
    title: 'Napels — Blender Townhouse',
    year: { en: '2026', nl: '2026', fr: '2026' },
    category: { en: '3D modelling · Blender', nl: '3D-modellering · Blender', fr: 'Modélisation 3D · Blender' },
    shortDescription: {
      en: 'A Naples-inspired townhouse modelled in Blender — from the gelato shop on the street to the laundry line and the rooftop terrace. Explore it in 3D right here.',
      nl: 'Een rijhuis geïnspireerd op Napels, gemodelleerd in Blender — van de ijssalon op straat tot de waslijn en het dakterras. Bekijk het hier meteen in 3D.',
      fr: 'Une maison de ville inspirée de Naples, modélisée dans Blender — du glacier dans la rue au linge qui sèche et à la terrasse sur le toit. À explorer ici en 3D.',
    },
    description: [
      {
        en: 'For a Blender assignment we each had to model a townhouse. I set mine in Naples: a narrow ochre building with green shutters, a weathered blue-violet ground floor and grey bands between the floors.',
        nl: 'Voor een Blender-opdracht moest iedereen een rijhuis modelleren. Het mijne speelt zich af in Napels: een smal okergeel gebouw met groene luiken, een verweerde blauwpaarse gelijkvloerse verdieping en grijze banden tussen de verdiepingen.',
        fr: 'Pour un exercice Blender, chacun devait modéliser une maison de ville. J’ai situé la mienne à Naples : un immeuble étroit ocre aux volets verts, un rez-de-chaussée bleu-violet patiné et des bandeaux gris entre les étages.',
      },
      {
        en: 'The scene tells the story of the street: a gelato shop with a striped awning and a giant cone sign, a scooter on the pavement, laundry drying under the windows, an air-conditioning unit, a small balcony, a fenced garden and a rooftop terrace with a table and chairs. The model is published on Sketchfab, so it can be explored interactively.',
        nl: 'De scène vertelt het verhaal van de straat: een ijssalon met gestreepte luifel en een reuzenijsje als uithangbord, een scooter op de stoep, was die te drogen hangt onder de ramen, een airco-unit, een klein balkon, een omheinde tuin en een dakterras met tafel en stoelen. Het model staat op Sketchfab, zodat je het interactief kunt bekijken.',
        fr: 'La scène raconte la rue : un glacier avec un store rayé et un cornet géant en enseigne, un scooter sur le trottoir, du linge qui sèche sous les fenêtres, un climatiseur, un petit balcon, un jardin clôturé et une terrasse sur le toit avec table et chaises. Le modèle est publié sur Sketchfab et peut être exploré en 3D.',
      },
    ],
    role: { en: 'Solo (school assignment)', nl: 'Solo (schoolopdracht)', fr: 'Solo (projet scolaire)' },
    technologies: ['Blender', '3D modelling', 'Texturing', 'Sketchfab'],
    position: [0.8, 0, -5.9],
    // street side towards the centre of the pitch
    rotation: faceIn(0.8, -5.9),
    scale: 1.3,
    objectType: 'sculpture',
    model: 'townhouse',
    accent: '#ef7a5c',
    image: asset('projects/napels/hero.webp'),
    // interactive, textured Sketchfab viewer first ("DAE Rowhomes - NAPLES")
    video: { kind: 'sketchfab', id: '21922c239eba45759c1a49439a541a7b', title: 'DAE Rowhomes - NAPLES (Sketchfab)' },
    images: [
      { kind: 'image', src: asset('projects/napels/hero.webp'), alt: { en: 'The Naples townhouse in full', nl: 'Het Napolitaanse rijhuis in zijn geheel', fr: 'La maison napolitaine en entier' }, fit: 'contain' },
      { kind: 'image', src: asset('projects/napels/shopfront.webp'), alt: { en: 'Gelato shop, scooter and balcony at street level', nl: 'IJssalon, scooter en balkon op straatniveau', fr: 'Glacier, scooter et balcon au niveau de la rue' }, fit: 'contain' },
      { kind: 'image', src: asset('projects/napels/laundry.webp'), alt: { en: 'Laundry drying between the green shutters', nl: 'Was die te drogen hangt tussen de groene luiken', fr: 'Linge qui sèche entre les volets verts' }, fit: 'contain' },
      { kind: 'image', src: asset('projects/napels/terrace.webp'), alt: { en: 'Rooftop terrace with table and chairs', nl: 'Dakterras met tafel en stoelen', fr: 'Terrasse sur le toit avec table et chaises' }, fit: 'contain' },
      { kind: 'image', src: asset('projects/napels/garden.webp'), alt: { en: 'The fenced garden next to the house', nl: 'De omheinde tuin naast het huis', fr: 'Le jardin clôturé à côté de la maison' }, fit: 'contain' },
    ],
    links: [
      { kind: 'sketchfab', label: 'Sketchfab', url: 'https://skfb.ly/pLqW9' },
    ],
  },
]

export const getProject = (slug: string) => projects.find((p) => p.slug === slug)
