const PROJECTS = [
{
  id:"vi3ion", name:"VI3ION",
  sub:"Gives your blind AI models their eyes — local OCR coordinates, layout geometry, per-element colour measurement, and version diffing. 100% private, no cloud, zero images leave your machine.",
  tags:["EYES FOR AI AGENTS","LOCAL OCR & GEOMETRY","MCP SERVER","PYPI & NPM PACKAGE"], badge:["● OPEN SOURCE","live"],
  cta:{ label:"View VI3ION on GitHub →", href:"https://github.com/Subadeepan-Y/VI3ION" },
  slides:[
    { feature:"Local Vision & Spatial Grounding for AI", tech:"Model Context Protocol · RapidOCR · CIELAB Colour Palette · Geometry & Layout Engine",
      desc:"AI models cannot see — they read text. Paste a screenshot into Claude Code, Cursor, or OpenCode and most agents guess what it shows. VI3ION analyzes images locally and hands agents precise measurements: what the text says, exact pixel bounding boxes, true colour hexes, contrast ratios, and alignment proofs.",
      specs:[
        "<b>No Cloud, Zero API Keys:</b> 100% local execution via ONNX / OpenCV. No images or prompt tokens ever leave your machine.",
        "<b>Standard MCP Interface:</b> 11 high-precision tools over stdio for Claude Code, Cursor, Windsurf, Zed, and OpenCode.",
        "<b>Exact Coordinates & Layout:</b> Extracts text rows, columns, alignment relationships, and bounding box coordinates in original pixels.",
        "<b>Per-Element Colour & Contrast:</b> Measures exact foreground ink and background hex values with WCAG-compliant contrast computation."
      ],
      art:'<div class="shot realshot"><div class="bar"><i></i><i></i><i></i></div>' +
        '<div style="background:#0b0f14;padding:24px;border-radius:6px;font-family:monospace;font-size:12px;color:#a8b3cf;line-height:1.6">' +
          '<div style="color:#22c55e;font-weight:bold;margin-bottom:12px">// VI3ION MCP Server — Measurement Output</div>' +
          '<div>Image 1280x800. Top bar: \"Settings\" <span style="color:#d4af37">ink:#f8f8f8 on:#1e3a8a contrast:9.8</span> @[44, 32, 168, 69]</div>' +
          '<div>Centre: \"Save\" (verified) <span style="color:#38bdf8">ink:#f8f8f8 on:#2563eb contrast:4.9</span> @[373, 619, 421, 640]</div>' +
          '<div>\"Cancel\" <span style="color:#94a3b8">ink:#384858 on:#ffffff contrast:9.4</span> @[557, 617, 620, 640]</div>' +
          '<div style="margin-top:14px;color:#cbd5e1;border-top:1px solid #1e293b;padding-top:10px"><b>Claim Verification:</b> \"Save is aligned with Cancel\" → <span style="color:#22c55e">VERIFIED</span> (Δy: 2px)</div>' +
        '</div>' +
        '<div class="shotcap">● EYES FOR AI AGENTS // PYPI: vi3ion · NPM: @subadeepan_y/vi3ion-opencode</div></div>' },
    { feature:"Published PyPI Package & OpenCode Plugin", tech:"pip install vi3ion · npm i -D @subadeepan_y/vi3ion-opencode · Multi-Agent Adapters",
      desc:"Distributed as an official package on PyPI and an extensible companion plugin on npm. Features self-healing CLI diagnostics (vi3ion doctor), local LLM runtime detection, and multi-version visual screen diffing.",
      specs:[
        "<b>Instant Install:</b> One command pip install vi3ion sets up the stdio MCP server for immediate agent consumption.",
        "<b>Multi-Version Visual Diffing:</b> Remembers previous screenshots to tell agents exactly what changed in text, layout, and pixel diffs.",
        "<b>Model Agnostic:</b> Works with both proprietary models and local LLMs (Ollama, llama.cpp, LM Studio, vLLM).",
        "<b>Active Ecosystem:</b> Shipped with comprehensive agent rules, semantic plugins, and automated CI test suites."
      ],
      art:'<div class="shot"><div class="bar"><i></i><i></i><i></i></div>' +
        '<div class="kv"><span>📦 PyPI Package</span><b>vi3ion · v0.1.x</b></div>' +
        '<div class="kv"><span>📦 NPM Package</span><b>@subadeepan_y/vi3ion-opencode</b></div>' +
        '<div class="kv"><span>⚡ Protocol</span><b>Model Context Protocol (MCP)</b></div>' +
        '<div class="kv"><span>🔒 Privacy</span><b>100% Local · Loopback Bound</b></div>' +
        '<div class="tagrow" style="justify-content:center;margin-top:14px"><span class="stag">PyPI</span><span class="stag">NPM</span><span class="stag">Claude Code</span><span class="stag">Cursor</span><span class="stag">Local LLMs</span></div>' +
        '<div class="shotcap mock">○ OPEN SOURCE AI VISION ENGINE</div></div>' }
  ]
},
{
  id:"manim", name:"manim-ts",
  sub:"A browser-native math and science animation library that brings 3Blue1Brown-style visual explainers directly to the web — with interactive timelines, draggable objects, spring physics, and plain-English scene generation.",
  tags:["MATH ANIMATION","INTERACTIVE SCENES","BROWSER NATIVE","OPEN SOURCE"], badge:["● OPEN SOURCE","live"],
  cta:{ label:"View on GitHub →", href:"https://github.com/Subadeepan-Y/manim-ts" },
  slides:[
    { feature:"Math & Science Animations Right in the Browser", tech:"25+ Shapes & Graphs · 50+ Animation Effects · 3D Objects · Zero Setup Required",
      desc:"Create crisp 3Blue1Brown-style mathematical animations that play directly inside any webpage — no heavy video rendering software or desktop installs required.",
      specs:[
        "<b>Rich Shape & Graph Library:</b> Includes circles, arcs, polygons, stars, coordinate axes, number planes, matrices, tables, network graphs, and 3D cubes and spheres.",
        "<b>50+ Built-In Animation Styles:</b> Draw outlines smoothly, fade and morph shapes, trace moving points, ripple waves through groups, or zoom and pan the camera.",
        "<b>Familiar & Easy to Write:</b> Designed so anyone familiar with classic math animation tools can pick it up immediately and run animations live on the web.",
        "<b>Crisp 60fps Playback:</b> Renders sharp vector curves and smooth motion at 60 frames per second on any screen size."
      ],
      art:`<div class="shot realshot"><div class="bar"><i></i><i></i><i></i></div>
        <img src="shots/manim_hero.png" alt="manim-ts rendered hero frame" loading="lazy">
        <div class="shotcap">● ACTUAL FRAME RENDERED BY MANIM-TS</div></div>` },
    { feature:"Smooth Shape Morphing & Vector Cutouts", tech:"Any-to-Any Shape Morphing · Shape Cutouts & Combinations · Flowing Vector Fields",
      desc:"Morph any shape smoothly into another — even a star into a circle or text into a graph — and combine overlapping shapes to create custom geometric figures.",
      specs:[
        "<b>Glitch-Free Shape Morphing:</b> Smoothly transforms one shape into a completely different shape without twisted edges or jumping corners.",
        "<b>Combine & Cut Out Shapes:</b> Merge overlapping shapes together, keep only their intersection, or punch cutouts through figures for Venn diagrams and geometry proofs.",
        "<b>Flowing Vector Fields:</b> Visualize magnetic fields, fluid flow, and differential equations with color-coded arrows and animated stream lines.",
        "<b>Glowing Motion Trails:</b> Attach fading trails to moving dots and pendulums to trace out orbits, waves, and cycloids."
      ],
      art:`<div class="shot realshot"><div class="bar"><i></i><i></i><i></i></div>
        <img src="shots/manim_shapes.png" alt="manim-ts rendered shapes frame" loading="lazy">
        <div class="shotcap">● ACTUAL FRAME RENDERED BY MANIM-TS</div></div>` },
    { feature:"Scrubbable Timelines & Interactive Scenes", tech:"Instant Timeline Scrubbing · Click & Drag Shapes · Live On-Screen Sliders",
      desc:"Unlike pre-rendered video files, animations stay completely interactive — viewers can scrub to any second on the timeline or grab shapes and sliders right on the canvas.",
      specs:[
        "<b>Jump to Any Moment:</b> Drag the timeline bar forward or backward to inspect any step of a proof with zero lag.",
        "<b>Click & Drag Geometry:</b> Let viewers grab points, shapes, or vectors with their mouse or finger and move them around the scene.",
        "<b>Live Parameter Sliders:</b> Add on-screen sliders so learners can change variables like slope, amplitude, or radius and watch the animation update live.",
        "<b>Playback Speed Control:</b> Slow down complex derivations to 0.5× or speed through to 4×."
      ],
      art:`<div class="shot"><div class="bar"><i></i><i></i><i></i></div>
        <svg width="100%" height="150" viewBox="0 0 400 150" style="background:#0c0c10;border-radius:8px">
        <circle class="drawcircle" cx="200" cy="75" r="52" fill="none" stroke="#e05545" stroke-width="3" stroke-dasharray="630" stroke-dashoffset="630"/></svg>
        <div class="scrub"><i></i><b></b></div>
        <div><span class="tbtn">▶ Play</span><span class="tbtn">⏸ Pause</span><span class="tbtn">1× ▾</span><span class="mono" style="font-size:11px;color:#8a8a94">02.41 / 06.20s</span></div></div>` },
    { feature:"Spring Physics, Math Equations & Animated Charts", tech:"Natural Spring Motion · Crisp Math Formulas · Animated Bar & Line Charts · Video & Web Export",
      desc:"Bring animations to life with natural spring bounce, handwritten-style math equations, animated data charts, and one-click export.",
      specs:[
        "<b>Natural Spring & Bounce Motion:</b> Choose gentle, snappy, or bouncy spring motion so objects settle into place with realistic weight.",
        "<b>Hand-Drawn Math Equations:</b> Render clean mathematical symbols, fractions, sums, and integrals that animate stroke by stroke on screen.",
        "<b>Live Animated Charts:</b> Transition smoothly between datasets on bar charts and line graphs as new numbers arrive.",
        "<b>Flexible Export Options:</b> Save your animation as a video file, a sharp vector graphic, or a standalone interactive webpage."
      ],
      art:`<div class="shot"><div class="bar"><i></i><i></i><i></i></div>
        <div class="mono" style="font-size:12px;margin-bottom:8px"><span class="fn">Gentle Spring</span> · <span class="fn">Snappy Spring</span> · <span class="fn">Bouncy</span> · <span class="fn">Elastic</span></div>
        <svg width="100%" height="110" viewBox="0 0 400 110" style="background:#0c0c10;border-radius:8px">
        <path d="M10,95 C120,95 130,95 170,60 C200,35 190,70 230,70 S300,70 390,20" fill="none" stroke="#e05545" stroke-width="2.5"/>
        <line x1="10" y1="95" x2="390" y2="95" stroke="#33333d"/></svg>
        <div style="margin-top:10px"><span class="statbadge">✓ Ready for Web &amp; Video</span></div></div>` },
    { feature:"Rendered Gallery — Formulas, Graphs & Calculus", tech:"Function Plotting · Shaded Area Under Curves · Moving Tangent Lines · Staggered Group Effects",
      desc:"Real frames rendered by the library — showing mathematical summation formulas, plotted curves with travelling points, shaded integrals, and multi-shape compositions.",
      specs:[
        "<b>Smooth Curve Plotting:</b> Plot any mathematical function on labeled coordinate axes with shaded regions underneath the curve.",
        "<b>Dynamic Labels & Counters:</b> Attach live-updating numbers, tangent lines, and coordinates that follow a point as it travels along a graph.",
        "<b>Choreographed Group Animations:</b> Sequence multiple steps one after another or trigger smooth wave animations across a group of shapes."
      ],
      art:`<div class="shot realshot"><div class="bar"><i></i><i></i><i></i></div>
        <img src="shots/manim_text.png" alt="manim-ts rendered text and summation formula" loading="lazy">
        <img src="shots/manim_axes.png" alt="manim-ts rendered axes parabola plot" loading="lazy">
        <div class="shotcap">● ACTUAL FRAMES RENDERED BY MANIM-TS</div></div>` },
    { feature:"LIVE PLAYGROUND & PLAIN-ENGLISH ANIMATOR", tech:"Interactive Live Canvas · 6 Built-In Demos · Type-to-Animate Generator · Timeline Scrubber",
      desc:"Try the animation engine right inside this window. Pick one of the preset demos on the right, or describe any animation in plain English — like a spinning solar system or a bouncing wave — and watch it play live.",
      specs:[
        "<b>Describe Any Scene in Plain English:</b> Type what you want to see and watch a custom animation get created and played on the canvas in seconds.",
        "<b>Full Interactive Controls:</b> Play, pause, restart, switch playback speeds from 0.5× to 4×, or drag the timeline slider across any animation."
      ],
      art:`<div class="shot" style="padding:8px"><div class="bar" style="padding:0 10px"><i></i><i></i><i></i></div>
        <iframe src="playground/index.html" style="width:100%;height:560px;border:0;border-radius:8px;background:#0a0a0a;display:block" title="manim-ts playground"></iframe>
        <div class="shotcap">● LIVE — TRY THE PRESETS OR TYPE ANY ANIMATION PROMPT!</div></div>` },
  ]
},
{
  id:"duel", name:"Duel Deck",
  sub:"A fast-paced 2-to-5 player online strategy card game where every card has a Light Side and a Dark Side — flip the deck mid-match to invert everyone's hand and escalate the stakes.",
  tags:["MULTIPLAYER CARD GAME","TWO-SIDED DECK","2–5 PLAYERS LIVE","SOLO & SQUAD MODES"], badge:["● LIVE","live"],
  cta:{ label:"Experience Duel Deck →", href:"https://dueldeck.vercel.app" },
  slides:[
    { feature:"Two-Sided Cards & Mid-Match Deck Flip", tech:"112 Two-Sided Cards · Light & Dark Rulesets · Instant Table Flip · Two-Side Hand Peek",
      desc:"Every card in the 112-card deck has two completely different faces — a classic Light Side and a high-stakes Dark Side. Whenever someone plays a Flip card, the entire table, the discard pile, and every player's hand flip over at once.",
      specs:[
        "<b>Light Side (Classic Tactical Play):</b> Play Red, Yellow, Green, and Blue number cards along with Draw +1, Reverse, Skip, Flip, Wild, and Wild Draw +2.",
        "<b>Dark Side (High-Stakes Chaos):</b> Flips the table to Pink, Teal, Orange, and Purple cards featuring brutal Draw +5, Skip Everyone (giving you an immediate extra turn), and Wild Draw Until Color.",
        "<b>Whole-Table Inversion:</b> Landing a Flip card instantly turns every player's hand inside out, changing safe hands into risky ones in a split second.",
        "<b>Peek at Your Other Side:</b> Peek at the back side of your own cards anytime during a match so you can plan the perfect moment to trigger a flip."
      ],
      art:`<div class="shot realshot"><div class="bar"><i></i><i></i><i></i></div>
        <img src="shots/duel_home.png" alt="Duel Deck landing page" loading="lazy">
        <div class="duelwrap" style="padding:10px 0 4px"><div class="dcard light"><span class="v">7</span><small>☀ LIGHT · RED</small></div>
        <div class="fliparr">⇄</div>
        <div class="dcard dark"><span class="v">+5</span><small>🌙 DARK · PURPLE</small></div></div>
        <div class="shotcap">● ACTUAL SCREENSHOT — LIVE AT DUELDECK.VERCEL.APP!</div></div>` },
    { feature:"Balanced Opening Deals & High-Stakes Wilds", tech:"Fair-Deal Hand Balancing · Guaranteed Clean Kickoff · Endless Deck Recycling",
      desc:"Built to keep every match competitive from the first turn — preventing lopsided starting hands while keeping Dark Side power cards thrilling.",
      specs:[
        "<b>Balanced 7-Card Opening Hands:</b> Every player's starting hand is automatically checked so nobody gets stuck with five or more cards of the exact same color on deal.",
        "<b>Clean Match Kickoff:</b> Every game is guaranteed to open on a standard number card so the first player isn't hit with an unfair penalty before taking a turn.",
        "<b>Draw Until Color Showdowns:</b> On the Dark Side, playing Wild Draw Color forces the next player to keep drawing cards one by one until they finally pull the chosen color.",
        "<b>Seamless Deck Reshuffling:</b> Long matches never stall — whenever the draw pile runs low, played cards are automatically reshuffled back into play."
      ],
      art:`<div class="shot"><div class="bar"><i></i><i></i><i></i></div>
        <div class="duelwrap" style="padding:14px 0"><div class="dcard light"><span class="v">+2</span><small>☀ WILD DRAW 2</small></div>
        <div class="fliparr">⚡</div>
        <div class="dcard dark"><span class="v">+5</span><small>🌙 DRAW FIVE</small></div>
        <div class="fliparr">⚡</div>
        <div class="dcard dark"><span class="v">⏭</span><small>🌙 SKIP ALL</small></div></div>
        <div class="tagrow" style="justify-content:center"><span class="stag">7-Card Balanced Deal</span><span class="stag">Draw Until Color</span><span class="stag">Extra-Turn Skip All</span></div>
        <div class="shotcap mock">○ CARD POWERS — LIGHT &amp; DARK ACTION ROSTER</div></div>` },
    { feature:"Live Squadron Lobbies & Private Room Codes", tech:"2–5 Player Rooms · Public & Private Tables · 6-Character Invite Codes · 10-Min Auto-Cleanup",
      desc:"Jump into public tables in seconds or host a private room for your squad using a 6-character invite code, with live seat updates and automatic cleanup for inactive rooms.",
      specs:[
        "<b>Public & Private Squadrons:</b> Host open tables that anyone can join from the Live Squadrons list, or lock your room behind a private 6-character code.",
        "<b>Easy-to-Share Invite Codes:</b> Room codes avoid confusing look-alike characters (like 0/O and 1/I) so friends can type and join effortlessly.",
        "<b>Instant Guest or Account Play:</b> Sign in with your account or jump straight into a match in one click as a guest with a custom callsign.",
        "<b>10-Minute Idle Room Timer:</b> Unstarted rooms display a live 10-minute countdown with a 2-minute audio warning so abandoned lobbies never clutter the server."
      ],
      art:`<div class="shot realshot"><div class="bar"><i></i><i></i><i></i></div>
        <img src="shots/duel_lobby.png" alt="Duel Deck live squadrons lobby" loading="lazy">
        <img src="shots/duel_room.png" alt="Duel Deck active squadron room with 10-minute auto-delete timer" loading="lazy">
        <div class="shotcap">● ACTUAL SCREENSHOTS — LIVE SQUADRON LOBBY &amp; ROOM COUNTDOWN!</div></div>` },
    { feature:"15-Second Turn Clock, UNO Calls & Player Reports", tech:"15s Turn Timer · Audio Countdown Ticks · UNO Alert Button · +2 Catch-a-Player Penalty",
      desc:"Every turn moves fast. A 15-second turn clock prevents stalling, and forgetting to shout UNO opens a live window where anyone at the table can report you for a 2-card penalty.",
      specs:[
        "<b>15-Second Turn Timer:</b> Keeps matches brisk with a visual countdown ring and ticking audio cues during the final 5 seconds before auto-drawing.",
        "<b>High-Tension UNO Calls:</b> When you drop to 1 or 2 cards, the glowing UNO button activates alongside a tense musical cue.",
        "<b>Catch & Report Opponents:</b> If an opponent reaches their last card without calling UNO, a Report banner pops up for the rest of the table — click it first to hand them 2 penalty cards.",
        "<b>Live Table Chat:</b> Send quick messages and reactions to the table during the match without leaving the board."
      ],
      art:`<div class="shot"><div class="bar"><i></i><i></i><i></i></div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
        <span class="statbadge">YOUR TURN</span><span class="tbtn">☀ LIGHT SIDE</span><span class="tbtn">PEEK DARK</span>
        <span class="mono" style="font-size:11px;color:#e0b45c">⏱ 0:12</span></div>
        <div style="text-align:center;padding:8px 0"><span class="glowbtn" style="font-size:15px;font-weight:700">CALL UNO!</span></div>
        <div class="chatb them" style="font-size:11.5px">⚠ NOVA FORGOT TO CALL UNO! — <b>CLICK TO REPORT (+2 CARDS)</b></div>
        <div class="shotcap mock">○ MATCH HUD PREVIEW — PLAY LIVE AT DUELDECK.VERCEL.APP!</div></div>` },
    { feature:"Smart AI Bots, Cheat-Proof Play & Synth Audio", tech:"5 AI Opponents · Cheat-Proof Private Hands · Custom Sound Effects · 3 Ambient Soundtracks",
      desc:"Play solo against five distinct AI personalities or with a full human squad — backed by fair-play protection so opponents can never peek at your cards, plus custom arcade sound effects and music.",
      specs:[
        "<b>5 Smart AI Challengers:</b> Fill empty seats with bots (Nova, Blitz, Echo, Apex, and Vortex) that strategize around their strongest colors, save action cards, and occasionally forget UNO so you can catch them.",
        "<b>Cheat-Proof Multiplayer:</b> Each player's cards remain completely private until played — other players only see how many cards you are holding.",
        "<b>15 Custom Arcade Sound Effects:</b> Every card slap, deck flip, skip, reverse, penalty draw, and victory fanfare triggers crisp custom audio.",
        "<b>3 Switchable Music Themes:</b> Choose between three atmospheric background tracks (Midnight Signal, Velvet Static, and Neon Drift) with instant mute controls."
      ],
      art:`<div class="shot"><div class="bar"><i></i><i></i><i></i></div><div class="flow">
        <div class="fnode"><b>Nova · Blitz · Echo</b><small>Smart AI Challengers</small></div><div class="farr">·</div>
        <div class="fnode"><b>Private Hands</b><small>Fair-Play Protected</small></div><div class="farr">·</div>
        <div class="fnode"><b>15 Custom SFX</b><small>Flip · Skip · UNO · Win</small></div><div class="farr">·</div>
        <div class="fnode"><b>3 Music Tracks</b><small>Switchable Themes</small></div>
      </div><div class="tagrow" style="justify-content:center;margin-top:12px"><span class="stag">Midnight Signal</span><span class="stag">Velvet Static</span><span class="stag">Neon Drift</span></div>
        <div class="shotcap mock">○ SOLO AI, FAIR PLAY &amp; SOUND DESIGN — LIVE AT DUELDECK.VERCEL.APP!</div></div>` },
  ]
},
{
  id:"buddy", name:"Desktop Buddy",
  sub:"A lightweight, privacy-first animated companion that lives on the corner of your screen — reacting to your apps, music, and late-night coding sessions in 5 Indian languages.",
  tags:["DESKTOP COMPANION","5 LANGUAGES","FOCUS TIMER","MINI-GAME"], badge:["◐ IN DEV","dev"],
  cta:{ label:"Star on GitHub →", href:"https://github.com/Subadeepan-Y" },
  slides:[
    { feature:"Meet Bones — Your Corner Screen Companion", tech:"100% Offline & Private · Ultra-Light Memory · 30-Day Activity Streaks · Windows Installer",
      desc:"Bones sits quietly on the corner of your desktop, keeping you company while you code, study, or browse — running completely offline on your PC so none of your screen activity ever leaves your device.",
      specs:[
        "<b>100% Local & Private:</b> Senses your active app title, battery level, and idle time locally on your computer with zero cloud tracking.",
        "<b>Featherlight on Battery & RAM:</b> Uses less than 100MB of memory so it never slows down your games, browser, or coding tools.",
        "<b>30-Day Streak Tracker:</b> Remembers your daily streaks and companion history even across app updates and restarts."
      ],
      art:`<div class="shot realshot"><div class="bar"><i></i><i></i><i></i></div>
        <img src="shots/buddy_logo.png" alt="Desktop Buddy avatar with sunglasses, lollipop and heart" loading="lazy" style="max-height:400px;width:auto;max-width:100%;margin:0 auto">
        <div class="shotcap">● ACTUAL ASSET — BONES DESKTOP COMPANION</div></div>` },
    { feature:"Corner Overlay, Cinema Mode & Focus Guard", tech:"Click-Through Overlay · Multi-Monitor Support · Auto-Hide in Fullscreen · Doomscroll Limiter",
      desc:"Stays visible above your windows without ever stealing your keyboard focus or blocking your clicks — and automatically steps out of the way whenever you watch a movie or launch a game.",
      specs:[
        "<b>Never Blocks Your Work:</b> Sits gently in the corner across single or multi-monitor setups without interrupting typing or mouse clicks.",
        "<b>Automatic Cinema Mode:</b> Detects fullscreen YouTube, Netflix, VLC, or gaming sessions and hides itself automatically until you finish.",
        "<b>Focus & Doomscroll Limiter:</b> Set a 1-to-60 minute timer that nudges you back to work when you spend too long scrolling social media."
      ],
      art:`<div class="shot realshot"><div class="bar"><i></i><i></i><i></i></div>
        <img src="shots/buddy_desktop.png" alt="Desktop Buddy live on desktop corner" loading="lazy">
        <div class="shotcap">● ACTUAL SCREENSHOT — LIVE DESKTOP OVERLAY</div></div>` },
    { feature:"5-Language Banter Across 100+ Apps", tech:"Tanglish · Kannada · Telugu · Malayalam · Hindi · 3 Speech Bubble Styles · Top-Bar Reminders",
      desc:"Recognizes over 100 popular apps — from VS Code, terminals, and Zoom meetings to Spotify and Valorant — cheering your wins and roasting your late-night bug streaks in five regional languages.",
      specs:[
        "<b>100+ App Reactions:</b> Notices when you switch between coding editors, browser tabs, video calls, music players, and games.",
        "<b>5 Regional Languages:</b> Banters naturally in Tanglish, Kannada, Telugu, Malayalam, and Hindi.",
        "<b>3 Speech Bubble Styles & Reminders:</b> Choose between a side chat box, a floating pill above Bones, or a bottom caption bar — plus sleek top-of-screen task reminders."
      ],
      art:`<div class="shot realshot"><div class="bar"><i></i><i></i><i></i></div>
        <img src="shots/buddy_chat.png" alt="Desktop Buddy Tanglish dialogue popup" loading="lazy">
        <div class="shotcap">● ACTUAL SCREENSHOT — LIVE TANGLISH BANTER</div></div>` },
    { feature:"Expressive Poses, Mini-Game & Control Hub", tech:"6 Animated Moods · Drag & Poke Reactions · Built-In Catch Mini-Game · Custom Size & Frequency",
      desc:"Toss Bones across the screen, poke him until he gets grumpy, watch him doze off when you step away, or open the Control Hub to customize his size, mood, and chatter.",
      specs:[
        "<b>Interactive Poses & Moods:</b> Switches between victory, facepalm, shock, cool sunglasses, heart-eyes, and a sleepy nap mode after 90 seconds of inactivity.",
        "<b>Playable Desktop Mini-Game:</b> Launch a quick built-in Catch & Catch game or preview all animations anytime you need a 2-minute break.",
        "<b>Full Control Hub:</b> Scale Bones anywhere from 1% to 100% size, adjust how often he talks, switch languages, and install one-click updates."
      ],
      art:`<div class="shot realshot"><div class="bar"><i></i><i></i><i></i></div>
        <img src="shots/buddy_pose.png" alt="Desktop Buddy floating reactive pose" loading="lazy" style="max-height:400px;width:auto;max-width:100%;margin:0 auto">
        <div class="shotcap">● ACTUAL SCREENSHOT — REACTIVE POSE RIG</div></div>` },
  ]
},
{
  id:"igradeify", name:"iGradeify",
  sub:"An all-in-one CBSE study workspace that turns your textbook PDFs and class notes into animated lessons, interactive mind maps, full 80-mark board practice papers, live group study rooms, and a personalized daily study plan.",
  tags:["AI STUDY WORKSPACE","ANIMATED LESSONS","BOARD EXAM PREP","STUDY ROOMS"], badge:["● LIVE","live"],
  cta:{ label:"Experience iGradeify →", href:"https://igradeify.vercel.app" },
  slides:[
    { feature:"PDF Study Hub & Multi-Chapter Library", tech:"Single PDFs · Multi-Chapter ZIPs · Subject Library · Private Study Workspace",
      desc:"Drop in a single chapter PDF or an entire subject ZIP archive to start studying immediately. Your files stay organized by subject and chapter inside your personal workspace, ready to power any study tool in one click.",
      specs:[
        "<b>Instant Chapter Setup:</b> Upload textbook chapters, handwritten scan PDFs, or multi-chapter ZIP bundles without waiting on slow uploads.",
        "<b>Smart Scan Check:</b> Automatically warns you if a scanned page is too blurry or faint to read clearly before you generate notes or tests.",
        "<b>Balanced Multi-Chapter Study:</b> Combine several chapters at once and get even coverage across every topic instead of only the first few pages.",
        "<b>Personal Subject Library:</b> Save generated notes, summaries, formula sheets, and flashcards neatly organized by subject."
      ],
      art:`<div class="shot realshot"><div class="bar"><i></i><i></i><i></i></div>
        <img src="shots/landing.png" alt="iGradeify landing and PDF Study Hub" loading="lazy">
        <div class="shotcap">● ACTUAL SCREENSHOT — MORE AT THE WEBSITE!</div></div>` },
    { feature:"The Desk — 7 Study Tools in One Place", tech:"Daily Study Plan · Spaced Revision Queue · Exam Readiness Tracker · Smart Timetable",
      desc:"One clean dashboard connecting all seven study tools around your progress: PDF Study Hub, Animated Visual Explainer, Mind Map Studio, Board Paper Generator, Group Study Rooms, Smart Timetable, and Subject Library.",
      specs:[
        "<b>Personalized Daily Plan:</b> Recommends exactly what to study today based on your weak topics, recent test scores, and upcoming exam dates.",
        "<b>Smart Revision Queue:</b> Brings back older topics right before you start forgetting them so you don't have to cram before boards.",
        "<b>Live Readiness & Streaks:</b> Tracks your daily study streak and shows a clear readiness level for every chapter from beginner to exam-ready.",
        "<b>Timetable & Exam Reminders:</b> Build a weekly study schedule and receive email reminders before your scheduled revision sessions."
      ],
      art:`<div class="shot realshot"><div class="bar"><i></i><i></i><i></i></div>
        <img src="shots/desk.png" alt="iGradeify tools dashboard" loading="lazy">
        <div class="shotcap">● ACTUAL SCREENSHOT — MORE AT THE WEBSITE!</div></div>` },
    { feature:"Animated Visual Explainer & Interactive Sims", tech:"Step-by-Step Math & Science Animations · Interactive Graphs · Physics Simulations · Speed Controls",
      desc:"Turns tough math, physics, and chemistry concepts into smooth, step-by-step visual animations, clean scientific graphs, and interactive simulations you can play with right on the page.",
      specs:[
        "<b>Watch Concepts Come Alive:</b> Type any topic or equation and watch geometric proofs, graphs, and derivations animate step by step.",
        "<b>Interactive Sliders & Calculators:</b> Adjust values like angle, velocity, or frequency and see graphs and physics simulations respond live.",
        "<b>Scientific Charts & Plots:</b> Generates clear, textbook-style plots, bar charts, and shaded area graphs for math and science chapters.",
        "<b>Full Playback Controls:</b> Pause on any step, scrub back and forth through the timeline, replay tricky parts, or change playback speed from 0.5× to 2×."
      ],
      art:`<div class="shot realshot"><div class="bar"><i></i><i></i><i></i></div>
        <img src="shots/explainer.png" alt="Animated explainer" loading="lazy">
        <div class="shotcap">● ACTUAL SCREENSHOT — MORE AT THE WEBSITE!</div></div>` },
    { feature:"Interactive Mind Map Studio", tech:"Auto-Organized Concept Maps · Practice Link Mode · Instant Feedback · PDF & Image Export",
      desc:"Breaks down long chapters into color-coded concept maps where you can zoom, pan, rearrange ideas, and test your understanding by connecting related concepts yourself.",
      specs:[
        "<b>Color-Coded Concept Grouping:</b> Automatically organizes chapters into core ideas, key definitions, formulas, cause-and-effect chains, and real-world examples.",
        "<b>Hands-On Connection Practice:</b> Drag and connect concept blocks yourself and get instant feedback explaining why a connection is right or what you missed.",
        "<b>Flexible Canvas Editing:</b> Add new notes, rearrange branches from four sides of any card, and undo or redo changes anytime.",
        "<b>One-Click Print & Export:</b> Download crisp high-resolution images or multi-page PDFs of your mind map for quick offline revision."
      ],
      art:`<div class="shot realshot"><div class="bar"><i></i><i></i><i></i></div>
        <img src="shots/mindmap.png" alt="Mind Map editor" loading="lazy">
        <div class="shotcap">● ACTUAL SCREENSHOT — MORE AT THE WEBSITE!</div></div>` },
    { feature:"Full 80-Mark CBSE Board Paper Generator", tech:"Sections A–E Blueprint · Past-Paper Style Questions · Custom Geometry Diagrams · Instant Grading",
      desc:"Creates realistic CBSE board-style practice papers from your uploaded chapters — complete with accurate math and science diagrams, timed exam mode, and step-by-step answer checking.",
      specs:[
        "<b>Authentic CBSE Exam Format:</b> Generates full 80-mark, 38-question papers across Sections A to E — including MCQs, Assertion-Reasoning, short and long answers, and Case-Study questions with internal choices.",
        "<b>Built-In Geometry & Science Figures:</b> Automatically draws labeled triangles, circles, ray diagrams, and graphs right inside the question paper.",
        "<b>Custom Practice Modes:</b> Choose between a full 3-hour board paper, a quick chapter quiz, or a targeted test focused only on your weak areas.",
        "<b>Step-by-Step Answer Marking:</b> Submit your answers to get a detailed mark breakdown, model solutions, and tips on where you lost marks."
      ],
      art:`<div class="shot realshot"><div class="bar"><i></i><i></i><i></i></div>
        <img src="shots/testgen.png" alt="Test Generator configuration" loading="lazy">
        <img src="shots/paper.png" alt="Generated board-pattern paper" loading="lazy">
        <div class="shotcap">● ACTUAL SCREENSHOTS — MORE AT THE WEBSITE!</div></div>` },
    { feature:"Live Group Study Rooms & Infinite Whiteboard", tech:"6-Letter Room Codes · Live Voice Chat · Smart Shape Drawing · Shared Files",
      desc:"Study with friends in real time using a 6-letter room code. Share an infinite drawing board, talk over built-in voice chat, and work through tough problems together.",
      specs:[
        "<b>Smooth Drawing & Highlighting:</b> Sketch equations and diagrams with pen, brush, highlighter, laser pointer, text boxes, and image stickers.",
        "<b>Auto-Snap Neat Shapes:</b> Draw a rough circle, rectangle, triangle, line, or arrow by hand and watch it snap into a clean geometric shape.",
        "<b>One-Tap Color Fill:</b> Fill closed shapes and diagram regions with color in a single click without messy edges.",
        "<b>Built-In Voice Desk:</b> Talk hands-free with your study group using built-in mic controls and live speaking indicators."
      ],
      art:`<div class="shot realshot"><div class="bar"><i></i><i></i><i></i></div>
        <img src="shots/studyroom.png" alt="Study Room whiteboard" loading="lazy">
        <div class="shotcap">● ACTUAL SCREENSHOT — MORE AT THE WEBSITE!</div></div>` },
    { feature:"24/7 AI Tutor, In-Chat Quizzes & Mastery Tracker", tech:"Inline Diagrams · Interactive Chat Quizzes · Mistake Insights · Spaced Revision",
      desc:"A personal tutor that explains concepts in plain language, sketches geometry figures directly inside the chat, quizzes you on the spot, and keeps track of what you have mastered.",
      specs:[
        "<b>Visual Explanations in Chat:</b> Ask a geometry or physics question and get a clear explanation paired with a custom labeled diagram right in the conversation.",
        "<b>Interactive Mini-Quizzes:</b> Practice with clickable multiple-choice cards inside the chat with hints and instant explanations.",
        "<b>Workspace Shortcuts:</b> Ask the tutor to turn your chat into a mind map, a saved library note, a whiteboard sketch, or a timetable slot.",
        "<b>Smart Mistake Tracking:</b> Spots patterns in your errors — like sign mistakes, formula mix-ups, or rushing — and schedules automatic review sessions after 1, 3, 7, 14, and 30 days."
      ],
      art:`<div class="shot"><div class="bar"><i></i><i></i><i></i></div>
        <div class="chatb me">why is angle B 90°?</div>
        <div class="chatb them">Because a tangent to a circle is always perpendicular to the radius at the point of contact:
        <svg width="150" height="105" viewBox="0 0 200 160" style="display:block;margin:8px 0;background:#0c0c10;border-radius:6px">
        <polygon points="40,130 40,40 150,40" fill="none" stroke="#f0ebe0" stroke-width="2"/>
        <path d="M40,58 L58,58 L58,40" fill="none" stroke="#c0392b" stroke-width="2"/></svg>
        <div class="quizblock"><b>Quick Check:</b> A tangent at point P meets the radius at…<span class="opt">A · 45°</span><span class="opt right">B · 90° ✓</span></div></div>
        <div class="shotcap mock">○ PREVIEW — THE REAL TUTOR LIVES AT THE WEBSITE!</div></div>` },
  ]
},
{
  id:"cloud", name:"Personal Cloud",
  sub:"A private, self-hosted 26GB cloud drive for storing large photos, videos, and study archives — with nested folders, instant search, trash recovery, and locked-down personal access.",
  tags:["PRIVATE CLOUD DRIVE","26GB STORAGE","LARGE FILE UPLOADS","SELF-HOSTED"], badge:["● PRIVATE","priv"],
  cta:null, note:"Self-hosted. Not public.",
  slides:[
    { feature:"Clean Vault Dashboard & 26GB Storage Pool", tech:"26GB Unified Drive · Nested Folder Tree · Grid & List Views · Trash Recovery",
      desc:"A calm, Japanese-ink inspired personal cloud drive that combines 26GB of cloud storage into one seamless dashboard for organizing raw photos, demo videos, and documents.",
      specs:[
        "<b>Full Folder Organization:</b> Create nested folders, move or rename files with breadcrumb navigation, switch between grid and list views, and restore accidentally deleted items from the Trash.",
        "<b>Instant Search & Media Filters:</b> Filter your drive by photos, videos, audio, documents, or archives with a live visual breakdown of used and free space.",
        "<b>Fast Browsing & Previews:</b> Browse large folders and inspect file details instantaneously without waiting for pages to reload."
      ],
      art:`<div class="shot"><div class="bar"><i></i><i></i><i></i></div>
        <div style="display:flex;gap:12px"><div style="flex:.8;font-size:11.5px;color:#b9b4ac">
        <div style="color:#fff;font-weight:700;margin-bottom:8px">subscloud</div>
        <div style="padding:4px 0">My Files</div><div style="padding:4px 0;color:#fff;background:rgba(192,57,43,.15);border-radius:5px">All Files</div>
        <div style="padding:4px 0">Trash</div><div style="padding:4px 0">Storage</div>
        <div class="mono" style="font-size:10px;color:#e0b45c;margin-top:8px">18.2 GB free of 26 GB</div></div>
        <div style="flex:1.6"><div class="mono" style="font-size:10.5px;color:#8a8a94;margin-bottom:8px">All Files / photos</div>
        <div class="kv"><span>📷 dusk-hike.raw</span><b>48 MB</b></div><div class="kv"><span>📄 thesis-notes.pdf</span><b>2 MB</b></div>
        <div class="kv"><span>🎞 demo-reel.mp4</span><b>310 MB</b></div>
        <div class="tagrow"><span class="stag">Files stored</span><span class="stag">Storage used</span><span class="stag">Remaining</span><span class="stag">Downloads</span></div></div></div></div>` },
    { feature:"Heavy-File Uploads & Locked-Down Private Access", tech:"Multi-Hundred-MB File Support · Integrity Verification · Emergency Backup Codes · Brute-Force Protection",
      desc:"Built to handle huge raw camera files and multi-hundred-megabyte videos reliably without upload timeouts, while keeping the entire drive locked to a single owner.",
      specs:[
        "<b>Reliable Large-File Uploads:</b> Smoothly uploads heavy video reels and raw archives with live progress tracking and automatic cleanup if your connection drops.",
        "<b>Verified File Integrity:</b> Checks every uploaded file automatically so downloads are always bit-for-bit identical to the original.",
        "<b>Owner-Only Security & Backup Codes:</b> Protected by private session sign-in, one-time emergency backup codes, and automatic lockouts against repeated password guessing."
      ],
      art:`<div class="shot"><div class="bar"><i></i><i></i><i></i></div>
        <div class="kv"><span>🎞 4k-project-master.mov</span><b>640 MB · ✓ Verified</b></div>
        <div class="kv"><span>📦 semester-archive.zip</span><b>185 MB · ✓ Verified</b></div>
        <div class="kv"><span>🔒 Vault Access</span><b>Owner Only · Protected</b></div>
        <div class="tagrow" style="justify-content:center;margin-top:10px"><span class="stag">Large Video &amp; RAW Support</span><span class="stag">Auto-Cleanup on Drop</span><span class="stag">Emergency Backup Codes</span></div>
        <div class="shotcap mock">○ PRIVATE SELF-HOSTED VAULT</div></div>` },
  ]
}
];
