# Neev · Round 3 prototype

**Find the missing foundation.** Team NEXUS, Prasunex Innovathon 2026.

Neev traces a wrong answer back to the loose concept "brick" under it, proposes a ten-minute fix for the teacher, gives the child a short repair game, and rechecks on Day 3 and Day 10.

**Live:** https://neev-e3mt.onrender.com (free hosting: the first visit after a quiet spell can take about a minute)

## Run it

Needs Node 20 or later. The built site is already in `dist/`, so nothing has to be installed.

- **Windows:** double-click `Start-Neev.cmd`
- **Any system:** `npm start`, then open http://localhost:4173

The terminal also prints a Wi-Fi address for phones. To change the code: `npm install`, then `npm run build`. Tests: `npm test`.

## Put it online

| What you host | What works |
| --- | --- |
| `dist/` on any static host (Netlify, Vercel, GitHub Pages) | Everything except phones joining a live room. The same service code runs inside the page. |
| Whole folder on a Node host (Render, Railway, Docker), start command `node server/gateway.js` | Everything, including live rooms |

Use **https**. Phone cameras and offline install need it.

## First screen

- On a laptop: Mobile mode, Web mode, or the jury tour. Mobile mode shows a phone frame and a QR code to open it on a real phone.
- On a phone: no question asked, it opens straight into the phone app.

## Five-minute demo

1. **Jury tour**, narrated or silent: 16 stops that drive the real app.
2. **Mind Reader:** a judge pretends to be a child with a secret wrong method. Neev names it.
3. **Class check:** scan the room, dim the light slider, ask the probe, approve groups.
4. **Live room:** judges scan a QR and become the class.
5. **Offline sync:** break the network, sync, send it all again, read the counts.
6. **Under the hood:** what our slides promised, and where each item stands.

## What is real and what is not

| Area | Status |
| --- | --- |
| Rules, Bayes, information gain, graph, knowledge tracing | Real. Golden vector matches to 1e-9 in browser and server |
| Card detector | Real. Reads a rendered classroom by default, or your own camera |
| Sync, replay, consent hold, QR relay, roles, rate limit | Real. Event log is a file, not PostgreSQL |
| Class 6B, other sections, recheck results for the class | Simulated and labelled |
| Likelihoods and priors | Hand-set, not yet calibrated on real responses |
| AI drafts | Pre-written stand-ins. The checks are real |
| Hindi and Marathi | Our own drafts, need a reviewer before classroom use |
| Native Android, Kotlin core, Prasunex SSO, live ERP, SMS/WhatsApp sending | Not built yet |

The build uses JavaScript (Preact, Vite, Node) so one link runs on any phone or old lab PC. Round 2 named Kotlin and Next.js; the layers and boundaries are the same, and the port stays on the plan.

## Folders

`core/` neev-core engine and card detector · `server/` API gateway and services · `web/` the app · `tests/` automated tests · `dist/` built site

## Privacy

No real child's data is used. Sample names are made up. Camera frames stay in memory and are never saved or sent. Use fictional nicknames in live rooms.
