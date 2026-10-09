// Animations finishing Manim parity — port of manim/animation/{creation
// (Unwrite, AddTextLetterByLetter), indication (Circumscribe), transform
// (Swap, CyclicReplace), changing (AnimatedBoundary), speedmodifier
// (ChangeSpeed), transform_matching_parts}.py
import { Animation, Transform, FadeIn, FadeOut, optsRunTime, } from "./all.js";
import { Mobject, VMobject, VGroup, Group, toVec3, alignPointOrder } from "../mobject/base.js";
import { Rectangle, Circle } from "../mobject/geometry.js";
import { lerpVec, interpolate, linear, smooth } from "../utils/math.js";
import { parseColor, BLUE, YELLOW, GREEN, RED } from "../utils/color.js";
// =====================================================================
// Creation additions
// =====================================================================
/** Reverse of Write — progressively erases the mobject. */
export class Unwrite extends Animation {
    constructor(mobject, opts = {}) {
        super(mobject, { run_time: 1, rate_func: linear, ...opts });
    }
    interpolate(alpha) {
        const t = this.eased(alpha);
        const m = this.mobject;
        if (!this.startSnapshot)
            return;
        const full = this.startSnapshot.points;
        const n = full.length;
        const shown = Math.floor((1 - t) * n);
        m.points = full.slice(0, shown).map((p) => [...p]);
    }
    finish() {
        this.mobject.points = [];
    }
}
/** Reveals submobjects (e.g. letters) one by one at a linear pace. */
export class AddTextLetterByLetter extends Animation {
    constructor(mobject, opts = {}) {
        const n = Math.max(1, mobject.submobjects.length);
        super(mobject, { run_time: opts.run_time ?? opts.runTime ?? Math.min(10, Math.max(1, n * 0.2)), rate_func: linear, ...opts });
    }
    begin() {
        super.begin();
        for (const s of this.mobject.submobjects)
            s.points = [];
        if (!this.mobject.submobjects.length)
            this.mobject.points = [];
    }
    interpolate(alpha) {
        if (!this.startSnapshot)
            return;
        const t = this.eased(alpha);
        const kids = this.mobject.submobjects;
        if (!kids.length) {
            // Fall back to a Create-style reveal for single-part mobjects.
            const full = this.startSnapshot.points;
            const shown = Math.floor(t * full.length);
            this.mobject.points = full.slice(0, shown).map((p) => [...p]);
            return;
        }
        const n = kids.length;
        kids.forEach((s, i) => {
            const local = t * n - i;
            const src = this.startSnapshot.submobjects[i];
            if (!src)
                return;
            if (local <= 0)
                s.points = [];
            else if (local >= 1)
                s.points = src.points.map((p) => [...p]);
            else {
                const nn = Math.floor(local * src.points.length);
                s.points = src.points.slice(0, nn).map((p) => [...p]);
            }
        });
    }
    finish() {
        if (this.startSnapshot)
            this.mobject.become(this.startSnapshot);
    }
}
// =====================================================================
// Indication additions
// =====================================================================
/** Draws a temporary rectangle/circle around a mobject, then fades it. */
export class Circumscribe extends Animation {
    constructor(mobject, opts = {}) {
        super(mobject, { run_time: 1, ...opts });
        Object.defineProperty(this, "shape", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "target", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.target = mobject;
        const buff = opts.buff ?? 0.2;
        const color = opts.color ?? YELLOW;
        let s;
        const shapeOpt = opts.shape ?? "rectangle";
        if (shapeOpt instanceof VMobject) {
            s = shapeOpt.copy();
        }
        else if (shapeOpt === "circle") {
            const w = Math.max(mobject.get_width(), mobject.get_height()) / 2 + buff;
            s = new Circle({ radius: Math.max(0.3, w), stroke_color: color, stroke_width: 4 });
        }
        else {
            s = new Rectangle({
                width: Math.max(0.5, mobject.get_width() + buff * 2),
                height: Math.max(0.5, mobject.get_height() + buff * 2),
                stroke_color: color,
                stroke_width: 4,
            });
        }
        s.set_fill(null);
        s.move_to(mobject.get_center());
        this.shape = s;
    }
    get_moving_mobjects() {
        return [this.target, this.shape];
    }
    interpolate(alpha) {
        // Keep the outline glued to the target, with an in/out opacity envelope.
        this.shape.move_to(this.target.get_center());
        const t = this.eased(alpha);
        const env = t < 0.2 ? smooth(t / 0.2) : t > 0.6 ? 1 - smooth((t - 0.6) / 0.4) : 1;
        this.shape.set_stroke(undefined, Math.max(0, Math.min(1, env)), undefined);
    }
    finish() {
        this.shape.set_stroke(undefined, 0, undefined);
    }
}
// =====================================================================
// Transform additions
// =====================================================================
/** Cyclically swaps the positions of the given mobjects. */
export class Swap extends Animation {
    constructor(...args) {
        let opts = {};
        let movers = args;
        const last = args[args.length - 1];
        if (last && typeof last === "object" && !(last instanceof Mobject)) {
            opts = last;
            movers = args.slice(0, -1);
        }
        super(new Group(...movers), opts);
        Object.defineProperty(this, "movers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fromCenters", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.movers = movers;
    }
    get_moving_mobjects() {
        return [...this.movers];
    }
    begin() {
        super.begin();
        this.fromCenters = this.movers.map((m) => m.get_center());
    }
    interpolate(alpha) {
        const t = this.eased(alpha);
        const n = this.movers.length;
        if (!n)
            return;
        // Drive every mover from its recorded start center toward the next
        // mover's start center, recomputed from scratch each frame (exact).
        this.movers.forEach((m, i) => {
            const from = this.fromCenters[i];
            const to = this.fromCenters[(i + 1) % n];
            const want = [
                from[0] + (to[0] - from[0]) * t,
                from[1] + (to[1] - from[1]) * t,
                from[2] + (to[2] - from[2]) * t,
            ];
            const now = m.get_center();
            m.shift([want[0] - now[0], want[1] - now[1], want[2] - now[2]]);
        });
    }
}
/** Each mobject morphs into the next one, cyclically. */
export class CyclicReplace extends Animation {
    constructor(...args) {
        let opts = {};
        let movers = args;
        const last = args[args.length - 1];
        if (last && typeof last === "object" && !(last instanceof Mobject)) {
            opts = last;
            movers = args.slice(0, -1);
        }
        super(new Group(...movers), opts);
        Object.defineProperty(this, "movers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "snapshots", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.movers = movers;
    }
    get_moving_mobjects() {
        return [...this.movers];
    }
    begin() {
        super.begin();
        this.snapshots = this.movers.map((m) => {
            const c = m.copy();
            return c;
        });
        const n = this.movers.length;
        this.movers.forEach((m, i) => {
            m.match_points(this.snapshots[(i + 1) % n]);
        });
        this.snapshots.forEach((s, i) => {
            const next = this.snapshots[(i + 1) % n];
            s.match_points(next);
            s.points = alignPointOrder(s.points, next.points);
        });
    }
    interpolate(alpha) {
        const t = this.eased(alpha);
        const n = this.movers.length;
        if (!n)
            return;
        // Re-derive from snapshots each frame so interpolation is exact.
        this.movers.forEach((m, i) => {
            const a = this.snapshots[i].copy();
            a.match_points(this.snapshots[(i + 1) % n]);
            const b = this.snapshots[(i + 1) % n];
            const nn = Math.max(a.points.length, b.points.length);
            const out = [];
            for (let k = 0; k < nn; k++) {
                const pa = a.points[Math.min(k, a.points.length - 1)] ?? [0, 0, 0];
                const pb = b.points[Math.min(k, b.points.length - 1)] ?? [0, 0, 0];
                out.push(toVec3(lerpVec(pa, pb, t)));
            }
            m.points = out;
        });
    }
    finish() {
        const n = this.movers.length;
        this.movers.forEach((m, i) => m.become(this.snapshots[(i + 1) % n]));
    }
}
// =====================================================================
// Changing: AnimatedBoundary
// =====================================================================
/** Vibrating, color-cycling rectangular boundary around a mobject. */
export class AnimatedBoundary extends Animation {
    constructor(mobject, opts = {}) {
        super(mobject, { run_time: 2, rate_func: linear, ...opts });
        Object.defineProperty(this, "boundary", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "target", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "colors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cycleRate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.target = mobject;
        this.colors = opts.colors ?? [BLUE, GREEN, YELLOW, RED];
        this.cycleRate = opts.cycle_rate ?? 1;
        const buff = opts.buff ?? 0.3;
        this.boundary = new Rectangle({
            width: Math.max(0.5, mobject.get_width() + buff * 2),
            height: Math.max(0.5, mobject.get_height() + buff * 2),
            stroke_width: 5,
        });
        this.boundary.set_fill(null);
        this.boundary.move_to(mobject.get_center());
    }
    get_moving_mobjects() {
        return [this.target, this.boundary];
    }
    interpolate(alpha) {
        const cyc = (alpha * this.cycleRate) % 1;
        const seg = cyc * this.colors.length;
        const i = Math.floor(seg) % this.colors.length;
        const j = (i + 1) % this.colors.length;
        const col = parseColor(this.colors[i]).interpolate(parseColor(this.colors[j]), seg - Math.floor(seg));
        this.boundary.move_to(this.target.get_center());
        this.boundary.set_stroke(col, 1, 4 + 2 * Math.abs(Math.sin(alpha * Math.PI * 2)));
    }
    finish() {
        this.boundary.set_stroke(undefined, 0, undefined);
    }
}
// =====================================================================
// Speed modifier
// =====================================================================
/**
 * Replays an animation with piecewise speed multipliers.
 * `speedinfo` maps normalized start-times to speed factors, e.g.
 * `{ 0.3: 2 }` plays double-speed from 30% on.
 */
export class ChangeSpeed extends Animation {
    constructor(anim, speedinfo = {}, opts = {}) {
        const innerRt = anim.run_time ??
            anim.runTime ??
            1;
        super(anim.mobject ?? new Group(), { run_time: opts.run_time ?? opts.runTime ?? innerRt, ...opts });
        Object.defineProperty(this, "inner", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "speedinfo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.inner = anim;
        this.speedinfo = speedinfo;
    }
    /** Remap global alpha through the piecewise speed profile. */
    remap(alpha) {
        const keys = Object.keys(this.speedinfo)
            .map(Number)
            .filter((k) => k > 0 && k < 1)
            .sort((a, b) => a - b);
        const bounds = [0, ...keys, 1];
        // Speed inside [bounds[i], bounds[i+1]) is speedinfo[bounds[i]] ?? 1.
        let area = 0;
        let total = 0;
        for (let i = 0; i < bounds.length - 1; i++) {
            const speed = this.speedinfo[bounds[i]] ?? 1;
            const len = bounds[i + 1] - bounds[i];
            total += len * speed;
            if (alpha > bounds[i]) {
                area += (Math.min(alpha, bounds[i + 1]) - bounds[i]) * speed;
            }
        }
        if (total === 0)
            return alpha;
        return Math.min(1, Math.max(0, area / total));
    }
    begin() {
        this.inner.begin();
    }
    interpolate(alpha) {
        this.inner.interpolate(this.rate_func(this.remap(alpha)));
    }
    finish() {
        this.inner.finish();
    }
    update_mobjects(dt) {
        this.inner.update_mobjects?.(dt);
    }
    get_moving_mobjects() {
        const g = this.inner;
        return typeof g.get_moving_mobjects === "function" ? g.get_moving_mobjects() : [];
    }
}
// =====================================================================
// Transform-matching (TransformMatchingShapes / TransformMatchingTex)
// =====================================================================
function mobjectParts(m) {
    return m.submobjects.length ? [...m.submobjects] : [m];
}
class TransformMatchingAbstract extends Animation {
    constructor(mobject, target, opts = {}) {
        super(mobject, opts);
        Object.defineProperty(this, "target", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "runners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.target = target;
    }
    begin() {
        super.begin();
        const srcParts = mobjectParts(this.mobject);
        const tgtParts = mobjectParts(this.target);
        const used = new Set();
        const runners = [];
        // Greedy in-order matching on keys.
        const pendingFadeIn = [];
        srcParts.forEach((s) => {
            const k = this.keyOf(s);
            const j = tgtParts.findIndex((t, idx) => !used.has(idx) && this.keyOf(t) === k);
            if (j >= 0) {
                used.add(j);
                runners.push(new Transform(s, tgtParts[j], { run_time: this.run_time }));
            }
            else {
                runners.push(new FadeOut(s, { run_time: this.run_time }));
            }
        });
        tgtParts.forEach((t, idx) => {
            if (!used.has(idx))
                pendingFadeIn.push(t);
        });
        // Stage unmatched target parts as invisible children so they can fade in.
        for (const t of pendingFadeIn) {
            const ghost = t.copy();
            for (const m of ghost.family) {
                const r = m;
                if (typeof r["fillOpacity"] === "number")
                    r["fillOpacity"] = 0;
                if (typeof r["strokeOpacity"] === "number")
                    r["strokeOpacity"] = 0;
            }
            this.mobject.add(ghost);
            runners.push(new FadeIn(ghost, { run_time: this.run_time }));
        }
        this.runners = runners;
        for (const r of runners)
            r.begin();
    }
    interpolate(alpha) {
        const t = this.eased(alpha);
        for (const r of this.runners)
            r.interpolate(t);
    }
    finish() {
        for (const r of this.runners)
            r.finish();
        this.mobject.become(this.target);
    }
    update_mobjects(dt) {
        for (const r of this.runners)
            r.update_mobjects?.(dt);
    }
}
/** Pairs submobjects with identical shape signatures and transforms them. */
export class TransformMatchingShapes extends TransformMatchingAbstract {
    keyOf(part) {
        return `${part.constructor.name}:${part.points.length}`;
    }
}
/** Pairs submobjects with identical text and transforms them. */
export class TransformMatchingTex extends TransformMatchingAbstract {
    keyOf(part) {
        const g = part;
        if (typeof g.get_text === "function")
            return `tex:${g.get_text()}`;
        return `${part.constructor.name}:${part.points.length}`;
    }
}
export { optsRunTime as _optsRunTime };
void interpolate;
void Circle;
void VGroup;
//# sourceMappingURL=missing.js.map