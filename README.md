# Andreas Adam — Interactive 3D Portfolio

A fullscreen 3D portfolio: **"Night Match"**, an empty field-hockey stadium under floodlights.
Each project is a small interactive diorama on the pitch, around an avatar of Andreas on the
centre spot. No scrolling, no card grid: you
explore the world, and the projects open as overlays.

Stack: Vite · React 19 · TypeScript · Three.js · React Three Fiber · Drei.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve dist/ locally
npm run lint
```

`dist/` is a static site. Upload it to any static host (GitHub Pages, Netlify, Vercel, Howest
server, …). Routing uses the URL hash (`#/project/tagrun`), so it needs no server configuration.

Test URLs:

- `/?view=2d` forces the 2D fallback (the same view browsers without WebGL get)
- `#/project/<slug>`, `#/about` and `#/contact` open an overlay directly

## Where things live

| What | Where |
| --- | --- |
| Projects (text, links, 3D position, colour) | `src/data/projects.ts` |
| Name, role, tagline, contact, About content | `src/data/profile.ts` |
| Interface text (EN / NL / FR) | `src/i18n.tsx` |
| Project images | `public/projects/<slug>/*.webp` |
| 3D objects per project | `src/scene/objects/*.tsx` |
| Stadium (pitch, stands, floodlights, LED boards) | `src/scene/Stadium.tsx` |
| Sky, lights, tactic routes | `src/scene/Environment.tsx` |
| Pitch dimensions | `src/data/field.ts` |
| Camera behaviour | `src/scene/CameraRig.tsx` |
| Overlays (project, About, Contact) | `src/ui/Overlays.tsx` |

## Adding a project

1. Put the images in `public/projects/<slug>/`. WebP at a max of ~1400 px works best.
2. Add an entry to `src/data/projects.ts`: title, texts in `en/nl/fr`, `technologies`,
   `images`, `github`/`liveUrl`, and a `position` on the pitch (x between −12 and 12, z between −6
   and 6, away from the other projects). Use `rotation: faceOut(x, z)` so the object faces
   the stands; the camera uses that angle.
3. Pick a `model`. You can reuse an existing 3D object, or create a new file in
   `src/scene/objects/` and add it to the `switch` in `src/scene/World.tsx`.
4. The route line, label, keyboard navigation and 2D fallback are generated automatically.

## Still to fill in (shown on the site as "placeholder")

- **About:** filled in from the CV (bio, experience, education, soft skills, interests, languages)
  in `profile.about` in `src/data/profile.ts`. Technical skills are not listed separately yet; the
  "stack across these projects" list is generated from the projects.
- **XR Hockey Tactics:** screenshots and/or video (`images`, `video`). The site currently shows a
  generated tactics visual.
- **ScoreTechHockey GitHub:** the Howest repo is private (404 for visitors). Make it public and
  uncomment `github` in `projects.ts`.

### Alternative taglines (`profile.tagline`)

- "Designing spatial experiences you can step into."
- "XR student turning ideas into worlds you can walk around in."
- "From sensors to headsets — building things that react to the real world."
- "Immersive tools, real-time systems, and everything that connects them."
