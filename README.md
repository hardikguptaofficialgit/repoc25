<div align="center">

# C25Go

**Campus 25 indoor navigation — classrooms, floors, and facilities in one map.**

[![Live demo](https://img.shields.io/badge/demo-campus25fed.vercel.app-D34A09?style=for-the-badge)](https://campus25fed.vercel.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue?style=for-the-badge)](./LICENSE)

[Open app](https://campus25fed.vercel.app/) · [Report issue](https://github.com/hardikguptaofficialgit/repoc25/issues)

</div>

---

## Overview

C25Go helps students and visitors move around **Campus 25** with interactive floor plans, shortest-path routing, and quick access to stairs, lifts, washrooms, and other points of interest. It runs in the browser and can be installed as a **Progressive Web App** on phones.

## Features

| | |
|---|---|
| **Multi-floor routing** | Plan paths across floors with stairs and lifts |
| **Shortest path** | Graph-based pathfinding between rooms and nodes |
| **Nearest facility** | Find the closest washroom, lift, or stairwell from where you are |
| **Touch-friendly map** | Pan, zoom, and tap locations on mobile and desktop |
| **PWA** | Add to home screen; works offline after install (service worker) |
| **Brand-aligned UI** | Campus 25 styling with accessible contrast |

## Tech stack

- **UI:** React 19, React Router, Lucide / Hugeicons  
- **Canvas:** Konva, Fabric (map layers)  
- **Build:** Vite 5, ESLint  
- **Deploy:** Vercel (`campus25fed`)

## Quick start

**Requirements:** Node.js 18+ and npm.

```bash
git clone https://github.com/hardikguptaofficialgit/repoc25.git
cd repoc25
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run dev:network` | Dev server on LAN (test on phone) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run generate-icons` | Regenerate PWA map icons |

## Project layout

```
public/          PWA assets, manifest, icons
src/             React app, map UI, pathfinding
scripts/         Icon generation utilities
```

## Deployment

The production app is hosted on Vercel. Push to the connected branch to trigger a deploy, or run `npm run build` and upload `dist/` to any static host.

## Contributing

Issues and pull requests are welcome. Please keep changes focused and run `npm run lint` before opening a PR.

## License

This project is licensed under the [GNU Affero General Public License v3.0](./LICENSE) (AGPL-3.0). Network use of a modified version must make corresponding source available under the same license.

---

<div align="center">

**Built for Campus 25** · [hardikguptaofficialgit](https://github.com/hardikguptaofficialgit)

</div>
