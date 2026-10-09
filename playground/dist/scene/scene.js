// Scene — port of manim/scene/scene.py (async/await edition for the browser).
//
// Python manim:   self.play(Create(c)); self.wait(1)
// This port:      await this.play(new Create(c)); await this.wait(1)
// inside `async construct()`.
import { isAnimationBuilder } from "../mobject/base.js";
import { Camera, MovingCamera } from "../camera/camera.js";
import { CanvasRenderer } from "../renderer/canvas_renderer.js";
import { Animation, Wait } from "../animation/all.js";
import { config } from "../config.js";
function isPlayOpts(x) {
    if (!x || typeof x !== "object")
        return false;
    if (x instanceof Animation)
        return false;
    if (isAnimationBuilder(x))
        return false;
    const r = x;
    if (typeof r.interpolate === "function")
        return false;
    if (typeof r.build === "function" && r.__isAnimationBuilder)
        return false;
    return true;
}
function animRunTime(a) {
    const r = a;
    if (typeof r["run_time"] === "number")
        return r["run_time"];
    if (typeof r["runTime"] === "number")
        return r["runTime"];
    return 1;
}
function setAnimRunTime(a, rt) {
    a["run_time"] = rt;
}
function setAnimRate(a, fn) {
    a["rate_func"] = fn;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export class Scene {
    constructor(canvasOrCtx, opts = {}) {
        Object.defineProperty(this, "camera", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Any Renderer backend (Canvas 2D by default; SVG/GPU adapters plug in). */
        Object.defineProperty(this, "renderer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mobjects", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "headless", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "frameRate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "time", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        /** Directed mode: record a seekable timeline while playing (playground scrubber). */
        Object.defineProperty(this, "directed", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        /** Recorded timeline segments (only populated when `directed` is on). */
        Object.defineProperty(this, "segments", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        /** Pristine first-appearance snapshots powering `seek()`. */
        Object.defineProperty(this, "initialStates", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        /** Mobjects in first-appearance order (replay stage list). */
        Object.defineProperty(this, "appearanceOrder", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        /** Playback controls (real-time pacing honors both). */
        Object.defineProperty(this, "paused", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "speed", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "recorder", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "recordedChunks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.camera = opts.camera ?? new Camera();
        this.renderer = opts.renderer ?? new CanvasRenderer(this.camera);
        this.headless = opts.headless ?? (!canvasOrCtx ? true : false);
        this.frameRate = opts.frameRate ?? opts.frame_rate ?? config.frame_rate;
        if (canvasOrCtx) {
            if (this.renderer instanceof CanvasRenderer &&
                typeof canvasOrCtx.getContext === "function") {
                this.renderer.attachToCanvas(canvasOrCtx);
                this.headless = opts.headless ?? false;
            }
            else if (this.renderer instanceof CanvasRenderer) {
                this.renderer.setContext(canvasOrCtx);
                this.headless = opts.headless ?? false;
            }
        }
    }
    // ---------- scene graph ----------
    add(...mobjects) {
        for (const m of mobjects) {
            if (!this.mobjects.includes(m))
                this.mobjects.push(m);
        }
        if (!this.headless)
            this.render_frame();
        return this;
    }
    remove(...mobjects) {
        this.mobjects = this.mobjects.filter((m) => !mobjects.includes(m));
        return this;
    }
    clear() {
        this.mobjects = [];
        return this;
    }
    bring_to_front(...mobjects) {
        this.remove(...mobjects);
        this.mobjects.push(...mobjects);
        return this;
    }
    bring_to_back(...mobjects) {
        this.remove(...mobjects);
        this.mobjects.unshift(...mobjects);
        return this;
    }
    bringToFront(...m) { return this.bring_to_front(...m); }
    bringToBack(...m) { return this.bring_to_back(...m); }
    get_mobjects() { return [...this.mobjects]; }
    render_frame() {
        if (this.headless)
            return;
        this.renderer.render(this.mobjects);
    }
    // ---------- directed timeline (scrubber support) ----------
    /** All mobjects driven by a set of animations. */
    moversOf(anims) {
        const out = [];
        for (const a of anims) {
            const movers = typeof a.get_moving_mobjects === "function"
                ? a.get_moving_mobjects()
                : [a.mobject].filter(Boolean);
            for (const m of movers)
                if (m && !out.includes(m))
                    out.push(m);
        }
        return out;
    }
    /** Snapshot first-appearance states so `seek()` can restore them later. */
    snapshotNewcomers(movers) {
        for (const m of [...movers, ...this.mobjects]) {
            if (!this.initialStates.has(m.uuid)) {
                this.initialStates.set(m.uuid, m.copy());
                this.appearanceOrder.push(m);
            }
        }
    }
    /** Total recorded timeline duration (0 when not directed). */
    getDuration() {
        return this.segments.reduce((s, g) => s + (g.kind === "play" ? g.runTime : g.duration), 0);
    }
    get_duration() {
        return this.getDuration();
    }
    /** Pace one real-time frame fraction, honoring pause + speed. */
    async paceFraction(frac, runTime, t0) {
        // With speed s the animation must reach frac in runTime/s wall-seconds, so
        // the target wall time is scaled by 1/s. The old code divided only the
        // remaining sleep by s, which still aligned to the FULL runTime — speed had
        // no effect. A paused interval is banked back into t0 so the remaining
        // animation keeps its real duration.
        const scale = Math.max(0.01, this.speed);
        for (;;) {
            if (this.paused) {
                const p0 = performance.now();
                while (this.paused)
                    await sleep(50);
                t0.t0 += (performance.now() - p0) / scale;
                continue;
            }
            const expected = t0.t0 + (frac * runTime * 1000) / scale;
            const remain = expected - performance.now();
            if (remain <= 0)
                return;
            await sleep(Math.min(remain, 100));
        }
    }
    // ---------- override point ----------
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async construct() {
        // override in subclasses
    }
    // ---------- play / wait ----------
    async play(...args) {
        let opts = {};
        let anims = args;
        if (args.length && isPlayOpts(args[args.length - 1])) {
            opts = args[args.length - 1];
            anims = args.slice(0, -1);
        }
        // auto-build .animate builders
        anims = anims.map((a) => isAnimationBuilder(a)
            ? a.build(opts)
            : a);
        if (!anims.length)
            return;
        const globalRt = opts.run_time ?? opts.runTime;
        const globalRate = opts.rate_func ?? opts.rateFunc;
        if (globalRt !== undefined)
            anims.forEach((a) => setAnimRunTime(a, globalRt));
        if (globalRate)
            anims.forEach((a) => setAnimRate(a, globalRate));
        const runTime = Math.max(...anims.map(animRunTime), 0.0001);
        // ensure animated mobjects are on stage
        const movers = this.moversOf(anims);
        for (const m of movers)
            if (!this.mobjects.includes(m))
                this.mobjects.push(m);
        if (this.directed) {
            this.snapshotNewcomers(movers);
            this.segments.push({ kind: "play", anims: [...anims], runTime });
        }
        for (const a of anims)
            a.begin();
        if (this.headless) {
            // fast-forward: a few interpolation steps, no sleeping
            const steps = 5;
            for (let i = 1; i <= steps; i++) {
                const alpha = i / steps;
                for (const a of anims) {
                    a.interpolate(alpha);
                    a.update_mobjects?.(runTime / steps);
                }
                for (const m of this.mobjects)
                    m.update(runTime / steps);
                this.time += runTime / steps;
            }
        }
        else {
            const fps = this.frameRate;
            const totalFrames = Math.max(1, Math.round(runTime * fps));
            const t0 = { t0: performance.now() };
            for (let i = 1; i <= totalFrames; i++) {
                const alpha = i / totalFrames;
                const dt = runTime / totalFrames;
                for (const a of anims) {
                    a.interpolate(alpha);
                    a.update_mobjects?.(dt);
                }
                for (const m of this.mobjects)
                    m.update(dt);
                this.time += dt;
                this.render_frame();
                await this.paceFraction(i / totalFrames, runTime, t0);
            }
        }
        for (const a of anims)
            a.finish();
        // handle removers
        for (const a of anims) {
            if (a.remover) {
                const movers = typeof a.get_moving_mobjects === "function"
                    ? a.get_moving_mobjects()
                    : [];
                this.remove(...movers);
            }
        }
        this.render_frame();
    }
    async wait(duration = 1, opts = {}) {
        const w = new Wait({ run_time: duration });
        if (opts.frozen_frame) {
            if (this.directed) {
                this.snapshotNewcomers([]);
                this.segments.push({ kind: "wait", duration, updates: false });
            }
            if (!this.headless)
                await sleep(duration * 1000);
            this.time += duration;
            return;
        }
        if (this.directed) {
            this.snapshotNewcomers([]);
            this.segments.push({ kind: "wait", duration, updates: true });
        }
        if (this.headless) {
            for (const m of this.mobjects)
                m.update(duration);
            this.time += duration;
            return;
        }
        const fps = this.frameRate;
        const totalFrames = Math.max(1, Math.round(duration * fps));
        const t0 = { t0: performance.now() };
        for (let i = 1; i <= totalFrames; i++) {
            const dt = duration / totalFrames;
            w.update_mobjects(dt);
            for (const m of this.mobjects)
                m.update(dt);
            this.time += dt;
            this.render_frame();
            await this.paceFraction(i / totalFrames, duration, t0);
        }
    }
    /**
     * Execute one timeline segment over the fraction window [f0, f1].
     * f1 >= 1 finishes the segment (finish + removers). Used by seek() and
     * playTimeline(); never records (replay only).
     */
    async execSegment(seg, f0, f1, realTime = false) {
        const SIM_STEPS = 10;
        if (seg.kind === "wait") {
            const span = seg.duration * (f1 - f0);
            if (realTime && !this.headless) {
                const fps = this.frameRate;
                const totalFrames = Math.max(1, Math.round(span * fps));
                const t0 = { t0: performance.now() };
                const w = new Wait({ run_time: span });
                for (let i = 1; i <= totalFrames; i++) {
                    const dt = span / totalFrames;
                    w.update_mobjects(dt);
                    if (seg.updates)
                        for (const m of this.mobjects)
                            m.update(dt);
                    this.time += dt;
                    this.render_frame();
                    await this.paceFraction(i / totalFrames, span, t0);
                }
            }
            else {
                for (let i = 1; i <= SIM_STEPS; i++) {
                    const dt = span / SIM_STEPS;
                    if (seg.updates)
                        for (const m of this.mobjects)
                            m.update(dt);
                    this.time += dt;
                }
                this.render_frame();
            }
            return;
        }
        const runTime = seg.runTime;
        const span = runTime * (f1 - f0);
        for (const a of seg.anims)
            a.begin();
        if (realTime && !this.headless) {
            const fps = this.frameRate;
            const totalFrames = Math.max(1, Math.round(span * fps));
            const t0 = { t0: performance.now() };
            for (let i = 1; i <= totalFrames; i++) {
                const alpha = f0 + ((f1 - f0) * i) / totalFrames;
                const dt = span / totalFrames;
                for (const a of seg.anims) {
                    a.interpolate(Math.min(1, alpha));
                    a.update_mobjects?.(dt);
                }
                for (const m of this.mobjects)
                    m.update(dt);
                this.time += dt;
                this.render_frame();
                await this.paceFraction(i / totalFrames, span, t0);
            }
        }
        else {
            for (let i = 1; i <= SIM_STEPS; i++) {
                const alpha = f0 + ((f1 - f0) * i) / SIM_STEPS;
                const dt = span / SIM_STEPS;
                for (const a of seg.anims) {
                    a.interpolate(Math.min(1, alpha));
                    a.update_mobjects?.(dt);
                }
                for (const m of this.mobjects)
                    m.update(dt);
                this.time += dt;
            }
            this.render_frame();
        }
        if (f1 >= 1) {
            for (const a of seg.anims)
                a.finish();
            for (const a of seg.anims) {
                if (a.remover) {
                    this.remove(...this.moversOf([a]));
                }
            }
            this.render_frame();
        }
    }
    /**
     * Jump the scene to timeline time `t` (requires `directed` mode).
     * Restores pristine first-appearance states, then re-simulates segments
     * without sleeping. Direct mutations made between plays (outside
     * animations/updaters) after an object's first appearance are not
     * reproduced — prefer `.animate` for scrub-safe motion.
     */
    async seek(t) {
        t = Math.min(Math.max(0, t), this.getDuration());
        const extras = this.mobjects.filter((m) => !this.initialStates.has(m.uuid));
        for (const m of this.appearanceOrder) {
            const snap = this.initialStates.get(m.uuid);
            if (snap)
                m.become(snap.copy());
        }
        this.mobjects = [
            ...this.appearanceOrder.filter((m) => this.initialStates.has(m.uuid)),
            ...extras,
        ];
        this.time = 0;
        for (const seg of this.segments) {
            const len = seg.kind === "play" ? seg.runTime : seg.duration;
            if (this.time + len <= t + 1e-9) {
                await this.execSegment(seg, 0, 1);
            }
            else if (this.time < t) {
                await this.execSegment(seg, 0, (t - this.time) / len);
                break;
            }
            else {
                break;
            }
        }
        this.render_frame();
    }
    /**
     * Replay the recorded timeline in real time starting at `from`
     * (requires `directed` mode). Honors pause + speed.
     */
    async playTimeline(from = 0) {
        await this.seek(from);
        // Segments always start at timeline 0; `from` only selects skips.
        let cursor = 0;
        for (const seg of this.segments) {
            const len = seg.kind === "play" ? seg.runTime : seg.duration;
            const segStart = cursor;
            const segEnd = cursor + len;
            cursor = segEnd;
            if (segEnd <= from + 1e-9)
                continue;
            const f0 = segStart < from ? (from - segStart) / len : 0;
            await this.execSegment(seg, f0, 1, true);
        }
        this.render_frame();
    }
    /** Run construct() from start to finish (manim `-p` equivalent in the browser). */
    async render() {
        this.time = 0;
        this.render_frame();
        await this.construct();
        this.render_frame();
    }
    // ---------- recording (browser MediaRecorder) ----------
    /** Best supported recording mime type (mp4 where available, else webm). */
    static supportedRecordingMime() {
        const candidates = [
            "video/mp4",
            "video/webm;codecs=h264",
            "video/webm;codecs=vp9",
            "video/webm",
        ];
        if (typeof MediaRecorder === "undefined")
            return "video/webm";
        for (const c of candidates) {
            try {
                if (MediaRecorder.isTypeSupported(c))
                    return c;
            }
            catch {
                // ignore and try the next candidate
            }
        }
        return "video/webm";
    }
    startRecording(mimeType) {
        if (!(this.renderer instanceof CanvasRenderer)) {
            throw new Error("Recording requires the CanvasRenderer backend.");
        }
        const canvas = this.renderer.ctx?.canvas;
        if (!canvas || typeof canvas.captureStream !== "function") {
            throw new Error("Recording requires a browser <canvas>.");
        }
        const stream = canvas.captureStream(this.frameRate);
        this.recordedChunks = [];
        const mime = mimeType ?? Scene.supportedRecordingMime();
        this.recorder = new MediaRecorder(stream, { mimeType: mime });
        this.recorder.ondataavailable = (e) => {
            if (e.data.size)
                this.recordedChunks.push(e.data);
        };
        this.recorder.start();
    }
    /** File extension matching the active (or best supported) recording mime. */
    recordingExtension() {
        const mime = this.recorder?.mimeType || (typeof MediaRecorder !== "undefined" ? Scene.supportedRecordingMime() : "video/webm");
        return mime.includes("mp4") ? "mp4" : "webm";
    }
    async stopRecording() {
        const rec = this.recorder;
        if (!rec)
            throw new Error("Not recording. Call startRecording() first.");
        return new Promise((resolve) => {
            rec.onstop = () => resolve(new Blob(this.recordedChunks, { type: rec.mimeType || "video/webm" }));
            rec.stop();
            this.recorder = null;
        });
    }
    /** Convenience: render a Scene subclass into a canvas. Returns the scene. */
    static async renderScene(SceneClass, canvas, opts = {}) {
        const scene = new SceneClass(canvas, opts);
        await scene.render();
        return scene;
    }
}
// ---------------- variants ----------------
export class VectorScene extends Scene {
    async construct() { }
}
export class MovingCameraScene extends Scene {
    constructor(canvasOrCtx, opts = {}) {
        super(canvasOrCtx, { ...opts, camera: opts.camera ?? new MovingCamera() });
        this.camera = this.camera;
    }
}
export class ThreeDScene extends MovingCameraScene {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "cameraOrientation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
    }
    set_camera_orientation(opts) {
        this.cameraOrientation = { ...this.cameraOrientation, ...opts };
    }
    setCameraOrientation(o) {
        this.set_camera_orientation(o);
    }
    move_camera(opts = {}) {
        this.set_camera_orientation(opts);
        return this.wait(opts.run_time ?? 1);
    }
}
export class ZoomedScene extends MovingCameraScene {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "zoomedCamera", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new MovingCamera()
        });
    }
}
//# sourceMappingURL=scene.js.map