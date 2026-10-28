# PROJECT STATE & AGENT HANDOFF: PORTFOLIO-INK (KYOTO VOID // KAGE RECREATION)

> **Generated**: 2026-10-28  
> **Server**: `http://localhost:5000` (Node.js static server running `server.js`)  
> **Workspaces**: Both `D:\PROJECTS\portfolio-ink` (primary build root) and `d:\portfolio-ink` (workspace mirror) must remain byte-for-byte synchronized.

---

## 1. PROJECT OBJECTIVE & CORE IDENTITY

Build an atmospheric, cinematic, Kyoto-temple portfolio experience modeled strictly on the authored aesthetic and architecture of **KAGE** (`threeui.com/kage-landing-page`).

### Core Design Rules
1. **The Atmospheric Void (#040507 to #08080c)**:
   - Deep, cavernous negative space. No cluttered dashboard cards or bulky bordered containers.
   - Everything sits quietly in a vast physical gallery space.
2. **Editorial Typographic Hierarchy**:
   - Monumental, wide-tracked headings in crisp stark alabaster (`#fbfaf6`) with multi-layer depth text shadows (`0 2px 28px rgba(0,0,0,0.85)`). Contrast ratio exceeds **19.5:1** (WCAG AAA).
   - Body copy in warm parchment bone (`#e2ded4`) at **14.8:1** contrast.
   - Monospace tags and Japanese Kanji chapter watermarks (`NotoJP`) brushed into the void.
3. **Seamless Cinematic 3D Integration**:
   - The webpage does **not** scroll away standard HTML elements. Instead, `overflow: hidden; height: 100vh; position: fixed; inset: 0;`.
   - Scrolling drives a damped, continuous Catmull-Rom 3D camera spline (`z = +14.0` down to `z = -96.0`) along an expansive Japanese mountain temple avenue (*Sandō* 参道).
   - As the camera travels down the avenue, the user moves through **6 distinct, highly detailed Japanese architectural landmark estates** representing the 6 portfolio projects.
4. **Disciplined Palette Restraint**:
   - Monochromatic ink void punctuated solely by **Aki Vermilion** (`#e0231c` / `#c44030`) and **Kintsugi Gold** (`#c8a86a` / `#d4af37`).

---

## 2. STRICT CONSTRAINTS & FORBIDDEN TERMS

> [!CAUTION]
> **Strictly Forbidden Words**: The following terms must **NEVER** appear in user-facing text, comments, markdown, or generated markup:
> - `g-r-o-q`
> - `g-e-m-i-n-i`
> - `g-o-d-o-t`
> - `m-a-a---s-t-y-l-e`
> 
> Automated tests enforce 0 occurrences across the entire repository.

---

## 3. ARCHITECTURAL DEPLOYMENT (10 STAGES)

| Stage | Identifier | Japanese Marker | 3D Landmark / Scenic Setting | Camera Position & Target |
|:---:|:---|:---:|:---|:---|
| **0** | `HERO` | `影の道` | Grand Torii Gate, Tsuijibei stone boundary walls, blood moon (`z = -135`), drifting sakura & maple leaves. | `p: (0.0, 4.0, 14.0), t: (0.0, 4.5, -4.0)` |
| **1** | `THE MAKER` | `門跡` | Entrance avenue threshold, 3-column maker principles (`01 PRINCIPLE`, `02 TOOLCHAIN`, `03 RECORD`). | `p: (-3.5, 3.2, 8.0), t: (0.5, 3.4, -8.0)` |
| **2** | `IGRADEIFY` | `学宮` | **House 0**: Scholar's Grand Academy Palace (`x = -8.5, z = -14`). Curved Irimoya roof, Dougong brackets, Shoji bays, gold plaque, *tobi-ishi* stone path. | `p: (-4.0, 2.8, -6.0), t: (-8.5, 3.0, -14.0)` (Text right) |
| **3** | `MANIM-TS` | `三重塔` | **House 1**: 3-Tiered Astronomical Royal Pagoda (`x = 8.5, z = -26`). Upturned eaves, 12 fūrin bells, 9-ring copper spire (*sōrin*, `y = 16.22`), black pines. | `p: (3.5, 4.0, -18.0), t: (8.5, 5.5, -26.0)` (Text left) |
| **4** | `DUEL DECK` | `両極殿` | **House 2**: Twin Yin-Yang Pavilions & Arched Red Moon Bridge (`x = -7.5, z = -38`). Sun/Moon pavilions over obsidian reflection pool with dynamic water ripple shaders. | `p: (-3.0, 2.5, -30.0), t: (-7.5, 2.8, -38.0)` (Text right) |
| **5** | `DESKTOP BUDDY` | `茶室` | **House 3**: Royal Sukiya-zukuri Villa & Garden Teahouse (`x = 7.5, z = -50`). Hinoki engawa, cedar shingle roofs, bamboo fence (*takegaki*), stone basin (*tsukubai*). | `p: (3.0, 2.4, -42.0), t: (7.5, 2.5, -50.0)` (Text left) |
| **6** | `GREATE ENGINE` | `天守閣` | **House 4**: Imperial Castle Keep Fortress (`x = -8.0, z = -64`). Flared stone rampart (*ishigaki*), defensive palisade stakes, golden dragon-carp *shachihoko* finials. | `p: (-3.5, 3.8, -54.0), t: (-8.0, 4.8, -64.0)` (Text right) |
| **7** | `PERSONAL CLOUD` | `宝蔵` | **House 5**: Sacred Imperial Vault Sanctum (`x = 7.0, z = -76`). Azekura log cabin on heavy timber stilts, braided *shimenawa* cord with *shide*, iron-studded lock doors. | `p: (2.5, 3.0, -68.0), t: (7.0, 3.2, -76.0)` (Text left) |
| **8** | `THE RITUAL` | `作法` | Mountain summit terrace, 3 tactile glassmorphic process cards (`01 PRIMITIVES`, `02 KINETIC RIGOR`, `03 LASTING IMPACT`) with 3D tilt micro-parallax. | `p: (-1.0, 4.5, -78.0), t: (0.0, 4.2, -96.0)` |
| **9** | `AFTERLIGHT` | `残光` | Summit Moonwater Sanctuary (`z = -94` to `-108`). Reflective obsidian pool, solitary water-borne lantern on cairn islet with flame flicker, 7 basalt stepping stones, distant Torii archway. | `p: (0.0, 3.8, -88.0), t: (0.0, 4.5, -105.0)` |

---

## 4. SUBSYSTEMS & COMPLETED TECHNICAL SPECIFICATIONS

### A. Dynamic Foreground Cutout Engine (`#fg-sky`)
- Static cutouts completely eliminated.
- Viewport orchestration plane (`#fg-sky`, `z-index: 52`) manages 10 per-stage cutout sets using verified local WebP assets in `secret-pathways-assets/foreground/png/`:
  `tall-grass`, `sakura-branch`, `maple-leaves`, `basalt-stones`, `stone-lantern`, `pine-tree`, `garden-bush`, `temple-wall`, `hill`, `shrine-ruins`.
- Active stage receives `[data-fg-in]` directional entrance translations, staggered delays, and 18s organic wind sways (`.fg-el--sway`).
- Exiting stage receives `.fg-retiring` for a 480ms blur & fade dissolve before returning to home section.

### B. 13-Lantern Mountain Avenue & Atmospheric Lighting
- Continuous terrain (`160m x 220m`) with elevated granite central pathway (*Sandō* 参道) flanked by curbs from `z = 20` to `z = -105`.
- 13 stone lanterns alternating left/right (`z = 8` down to `-88`, `x = ±3.8`):
  - Dual-frequency fire flicker in lantern firebox PointLights.
  - 39 golden fireflies (3 per lantern) orbiting in 3D helical trajectories.
  - Concentric Zen raked gravel ripple rings (*Samon* 砂紋) with normal map furrows around all 13 bases.
  - Synchronously flickering warm ground light spill decals (`rgba(255, 160, 60, 0.55)`).

### C. 3D Landmark Raycasting & Interactive Focus Dolly
- Raycaster detects hover over 3D houses:
  - Expands custom cursor ring (`#cursorRing`) to 38px with pointer icon.
  - Flares active house Shoji screen emission and lantern lights by +25%.
  - Direct click on any 3D house invokes `openModal(targetProjIdx)` with synthesized tactile hanko click.
  - Touch safety: scroll swipe drag distance (> 8px) and 350ms post-touchend cooldown prevent false modal launches.
- Hovering project cards/text blocks eases `focusAmt` to 1.0, dollying camera 1.8 units closer along view vector for an intimate inspection zoom.
- Scroll velocity dynamically boosts wind breeze from 1.0x to 3.5x, swirling 24 sakura petals and 55 maple leaves into an atmospheric 3D vortex.

### D. Procedural Web Audio Soundscape (Zero Media Assets)
- Unmuting `#soundBtn` or pressing `[M]` starts synthetic acoustic soundscape:
  - 54Hz subterranean drone + 108Hz singing bowl harmonic warmth.
  - 600Hz biquad-filtered mountain wind whisper undulating with velocity.
  - 432Hz Zen bell chime on chapter transitions with 3.2s exponential decay.
  - 880Hz $\rightarrow$ 360Hz resonant woodblock micro-clicks on UI clicks.
  - 400ms linear ramp-in on unmute, 300ms ramp-out on mute.
  - Reactive 3-bar equalizer on `#soundBtn` driven by Web Audio `AnalyserNode`.

### E. Navigation, Dossier Modal & Lightbox Zoom
- **Right Vertical Progression Rail (`#rail`)**: 10 chapter buttons (`00`–`09`) with frosted glass hover reveal (index badge, high-contrast title, gold kanji badge) and active vermilion pulse halo.
- **Top Navigation Bar**: Seamless jumps for HERO (0), ABOUT (1), WORK (2), PROCESS (8), CONTACT (9), and Brand Logo reset.
- **Hero Bottom-Right Preview Card (`.peek`)**: 16:10 Kyoto Sanmon frame with play badge, kanji marker `山門`, label `'01 // THE ENTRY POINT'`, and 3D card tilt micro-parallax.
- **27-Slide Dossier Modal (`#dossierModal`)**: Covers all 6 projects with keyboard navigation (`[ArrowLeft]`/`[ArrowRight]`), touch swipe, 0.24s `.slide-glide` micro-transitions, segmented hairline slide stepper, and WCAG AAA typography.
- **Full-Screen Image Lightbox Zoom (`#lightboxModal`)**: Clicking any screenshot expands it to maximum resolution with 24px backdrop blur, gold border, and caption.
- **Hotkey Cheatsheet HUD (`#hotkeyModal`)**: Pressing `[?]` opens frosted guide modal showing all shortcuts.
- **Bottom Metadata Coordinates HUD (`#bottomMetaHud`)**: Coordinates (`35°00'N 135°46'E`), `1611 · ∞ · [00-09] · ∞ · 2026`, `EST. 2026 // STILLNESS IN CRAFT`.
- **Ambient Document Title Sync**: Updates with chapter landmark, switching to `SUBADEEPAN — Stillness in the Void` when tab is hidden.

---

## 5. FILE MANIFEST & COMPILATION PIPELINE

- **Master Template Generator**: [`build_kage_editorial.js`](file:///D:/PROJECTS/portfolio-ink/build_kage_editorial.js)  
  *All core HTML, CSS, Three.js shaders, and logic are defined here.*
- **Production HTML**: [`index.html`](file:///D:/PROJECTS/portfolio-ink/index.html)  
  *Compiled output of the generator script.*
- **Workspace Mirror**: [`d:\portfolio-ink\index.html`](file:///d:/portfolio-ink/index.html)  
  *Must remain identical to `D:\PROJECTS\portfolio-ink\index.html`.*
- **Static Server**: [`server.js`](file:///D:/PROJECTS/portfolio-ink/server.js) (Port 5000)

### To Recompile and Synchronize:
```powershell
node D:\PROJECTS\portfolio-ink\build_kage_editorial.js
Copy-Item -Path "D:\PROJECTS\portfolio-ink\index.html" -Destination "d:\portfolio-ink\index.html" -Force
Copy-Item -Path "D:\PROJECTS\portfolio-ink\build_kage_editorial.js" -Destination "d:\portfolio-ink\build_kage_editorial.js" -Force
```

---

## 6. VERIFICATION TEST SUITES (PLAYWRIGHT)

All test suites live in `D:\PROJECTS\portfolio-ink\` and must pass with 100% green assertions and 0 console/page errors:

1. `node test_master_production_journey.js`: Complete end-to-end audit (all 10 stages, all 27 dossier slides, cold-start, gyroscope tilt, forbidden words).
2. `node test_foreground_stages.js`: Validates dynamic 10-stage `#fg-sky` cutout reparenting and retirement lifecycles.
3. `node test_verify_house_raycast_dossier.js`: Validates 3D landmark raycast hover bloom (+25%) and direct click-to-open dossier modal.
4. `node test_ambient_soundscape_engine.js`: Validates native Web Audio 54Hz drone, 600Hz wind, 432Hz Zen chime, and visualizer.
5. `node test_dossier_lightbox_and_assets.js`: Validates all 27 slides, 15 screenshot assets, 1 interactive playground iframe, and lightbox zoom.
6. `node test_responsive_hotkey_suite.js`: Validates 0 horizontal overflow across Desktop (1920), Laptop (1440), Tablet (768), and Mobile (390).
7. `node test_kanji_breath_and_dossier_polish.js`: Validates calligraphic ink breath on `#kanjiWatermark` and WCAG AAA modal contrast.
8. `node test_bottom_hud_and_title_sync.js`: Validates bottom coordinates HUD and background tab title sync.

---

## 7. RECENTLY COMPLETED MASTER POLISH FEATURES (100% PASS)

1. **Interactive 3D Moon Raycast**: Hovering over the blood moon expands cursor ring with pointer; clicking triggers Totality Blood Moon Surge.
2. **Shakuhachi Bamboo Flute Breath**: Idle pauses (>6s) synthesize authentic pentatonic in-sen scale overtones (576Hz, 648Hz, 864Hz) with natural vibrato and soft envelope swell.
3. **PWA Service Worker Offline Cache**: sw.js caches static Three.js runtime, fonts, and 14 WebP foreground scene layers for zero-latency offline loading.
4. **Stage 9 Contact Toast Notification**: Clicking contact email copies to clipboard with hanko toast confirmation (EMAIL COPIED // 影).

## 7. NEXT IMMEDIATE ENHANCEMENTS FOR INCOMING AGENTS

When picking up the codebase, here are the recommended next micro-enhancements:
1. **Interactive Moon Phase Toggle or Eclipse Slider**: Allow clicking the blood moon in Stage 0/9 to trigger an eclipse corona expansion.
2. **Audio Track Switcher / Shinto Flute Synthesis**: Add subtle high-register *shakuhachi* bamboo flute overtone accents during long idle pauses.
3. **PWA Offline Manifest**: Add lightweight service worker caching the static local WebP assets and fonts for instant offline loading.
