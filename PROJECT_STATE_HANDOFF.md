# PROJECT HANDOFF & ARCHITECTURAL OVERVIEW
**Project**: Subadeepan Personal Portfolio — Kyoto Sanctuary Edition (Kyoto Void)  
**Live Production URL**: [https://subadeepan.vercel.app](https://subadeepan.vercel.app) (also mirrored at [https://portfolio-ink.vercel.app](https://portfolio-ink.vercel.app))  
**Primary Repositories**:
- `https://github.com/Subadeepan-Y/portfolio-ink` (Connected to Vercel deployment)
- `https://github.com/sub858/portfolio-ink` (Mirror remote `origin`)
**Local Paths**:
- Active build/git workspace: `D:\PROJECTS\portfolio-ink`
- Working mirror: `D:\portfolio-ink`
**Latest Production Commit**: `8e86adc`

---

## 1. Project Concept & Architecture
The portfolio is an editorial WebGL interactive journey inspired by Kyoto architectural landscaping and Kage aesthetics. The camera travels along an atmospheric mountain path through 10 stages (0 to 9) populated by 6 distinct 3D Japanese estates, procedural weather/lighting, and editorial project dossiers.

### Technical Stack:
- **Core 3D Engine**: Three.js (`secret-pathways-assets/three.min.js`, self-hosted, offline-ready).
- **Build Architecture**: Single-file generator `build_kage_editorial.js` compiling into high-performance `index.html`.
- **Audio Synthesis**: Hybrid Web Audio API engine (procedural 54Hz subterranean drone, filtered wind noise bed, 432Hz Zen resonance) + procedural BGM playback + custom Base64 SFX for landmark arrival.
- **Typography**: 
  - Headlines & Monumental Display: **Integral CF** (`weight: 700 !important`, inline base64 embedded into CSS for 0ms render delay).
  - Body & Micro-labels: **DM Sans** (`font-style: normal`) + **Space Mono**.
- **Interactive Cutouts**: Dynamic foreground parallax system (`#fg-sky`) with entry/exit animations tuned per stage.

---

## 2. Landmarks & Stages (Z = 11 to -88)
- **Stage 0 (Hero // Z = +11.6)**: 
  - Headline: `BUILT TO SOLVE.` / `SHIPPED TO WORK.` (Integral CF with red square accents).
  - Subtitle: `AI tutors. Animation engines. Game compilers. Leveraging modern stacks to build what's missing.`
  - Header: `00 // PORTFOLIO // 2026`.
- **Stage 1 (The Maker // Z = +8.2)**: 
  - Headline: `TOOLS OTHER PEOPLE WISH EXISTED.`.
  - Philosophy cards: Zero Bloat Primitives, Modern Low-Latency Stack, 6 Shipped Products.
- **Stage 2 (iGradeify // Z = -5.5)**: 
  - 3D Landmark: **Academy Palace**.
  - Dossier: 7 slides covering AI grading system, sub-second edge runtimes, real UI screenshots.
- **Stage 3 (manim-ts // Z = -17.5)**: 
  - 3D Landmark: **3-Tiered Pagoda**.
  - Dossier: 6 slides with real mathematical animation engine frames and code examples.
- **Stage 4 (Duel Deck // Z = -29.6)**: 
  - 3D Landmark: **Twin Yin-Yang Pavilions & Arched Moon Bridge**.
  - Dossier: 5 slides with real production screenshots of competitive game loops.
- **Stage 5 (Desktop Buddy // Z = -41.4)**: 
  - 3D Landmark: **Sukiya Teahouse**.
  - Dossier: 4 slides highlighting local desktop agent runtime.
- **Stage 6 (Greate — Game Engine // Z = -53.6)**: 
  - 3D Landmark: **Castle Keep Fortress**.
  - Dossier: 3 slides explaining custom engine architecture.
- **Stage 7 (Personal Cloud // Z = -67.7)**: 
  - 3D Landmark: **Sacred Imperial Vault**.
  - Dossier: 2 slides covering self-hosted encrypted file system.
- **Stage 8 (The Ritual // Z = -77.8)**: 
  - Methodology overview cards: Core Architecture, Kinetic Rigor (60 FPS), Shipped to Production.
- **Stage 9 (The Exit // Z = -87.9)**: 
  - Headline: `LET'S BUILD` (solid fill) / `SOMETHING.` (outline stroke: `-webkit-text-stroke: 1.8px #fbfaf6; color: transparent;`).
  - Curated links:
    - **Mail**: `https://mail.google.com/mail/?view=cm&fs=1&to=subadeepankgm@gmail.com&su=Hello%20Subadeepan&body=I%20visited%20your%20website%20and...` (opens Gmail compose in new tab).
    - **Instagram**: `https://www.instagram.com/theepanxub/`
    - **GitHub**: `https://github.com/Subadeepan-Y`

---

## 3. What Has Been Completed & Polished
1. **Typography & Font Integrity**:
   - Integrated full, authentic **Integral CF** font (`FontsFree-Net-Integral-CF-Regular.ttf`, 47,456 bytes).
   - Inlined directly into CSS via Base64 data URI (`data:font/ttf;charset=utf-8;base64,...`) to completely prevent FOUT (Flash of Unstyled Text) or fallback glitches on normal refresh.
2. **Audio System & Mute Rigor**:
   - Fixed mute bug: `isMuted` state is strictly respected across all user interactions (`click`, `scroll`, `wheel`). Scrolling while muted never restarts audio.
   - Added user-provided custom house arrival sound effect (`uploaded_media_1793208285612.mp3`), inlined as Base64 audio, playing at volume `1.0` on every stage transition.
   - Immediate audio unlock on any first user gesture (`pointerdown`, `wheel`, `keydown`, `touchstart`).
3. **Responsive Visuals & Z-Index Hierarchy**:
   - Lowered `#fg-sky` z-index to `20` and elevated `#nav` to `90`, guaranteeing navigation and sound controls remain accessible.
   - On screens `<= 900px` (mobile/tablets), high-rising bushes and foreground sky cutouts are hidden (`display: none !important`), preventing text obstruction.
   - Dynamic pixel ratio: capped at `1.25` on mobile to prevent GPU thermal throttling, `1.5` on desktop.
4. **Project Dossier Modal**:
   - 27-slide multi-project modal with keyboard arrows, touch swipe, high-contrast buttons (`#ffffff` text on `#181818`, visible outline, red glow on hover), and lightbox zoom.
5. **Interactive Controls & 3D Polish**:
   - Removed cursor trail wisps per user request; restored native pointer cursor.
   - Raycasting on 3D landmarks (click to open estate dossier).
   - Totality Blood Moon Easter egg (click moon / triple-click hanko).
   - Local Dev Server: `server.js` configured on port `5000`.

---

## 4. Key Files in Workspace
- `build_kage_editorial.js`: Master script that generates `index.html`. Edit this file to make persistent template or logic updates.
- `index.html`: The compiled production bundle deployed to Vercel.
- `server.js`: Zero-dependency local Node.js static HTTP server with audio range-request streaming.
- `secret-pathways-assets/`: All local fonts, 3D scripts (`three.min.js`), sound files (`house-arrival.mp3`), and WebP cutouts.
- `sw.js`: Purge script that clears stale caches and unregisters old service workers.

---

## 5. Development & Deployment Workflow
When modifying the project:
1. Make changes inside `build_kage_editorial.js`.
2. Compile:
   ```bash
   node build_kage_editorial.js
   ```
3. Sync files to both workspace directories:
   ```powershell
   Copy-Item -Path "D:\PROJECTS\portfolio-ink\index.html" -Destination "D:\portfolio-ink\index.html" -Force
   Copy-Item -Path "D:\PROJECTS\portfolio-ink\build_kage_editorial.js" -Destination "D:\portfolio-ink\build_kage_editorial.js" -Force
   ```
4. Test locally using Playwright or run `node test_final_polish.js`.
5. Push to GitHub to trigger Vercel auto-deployment:
   ```bash
   gh auth switch --user CRACKnGUY
   git add index.html build_kage_editorial.js
   git commit -m "feat: <description>"
   git push subadeepan main
   gh auth switch --user sub858
   git push origin main
   ```
*(Note: Vercel project `portfolio-ink` is linked to `Subadeepan-Y/portfolio-ink` branch `main`).*
