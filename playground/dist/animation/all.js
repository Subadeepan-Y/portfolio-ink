// Animation system — port of manim/animation/{animation,creation,fading,transform,movement,rotation,growth,numbers,indication,composition,updaters}.py
import { ORIGIN, TAU, PI } from "../constants.js";
import { Group, toVec3, isAnimationBuilder, alignPointOrder } from "../mobject/base.js";
import { morphPair } from "../utils/curve.js";
import { Dot } from "../mobject/geometry.js";
import { lerpVec, interpolate, smooth, linear, rush_into, sub, mulScalar, } from "../utils/math.js";
import { ManimColor } from "../utils/color.js";
export function optsRunTime(o, fallback = 1) {
    return o.run_time ?? o.runTime ?? fallback;
}
export function optsRate(o, fallback = smooth) {
    return o.rate_func ?? o.rateFunc ?? fallback;
}
function snapshotPoints(m) {
    return { points: m.points.map((p) => [...p]), subs: m.submobjects.map((s) => s.copy()) };
}
/** Base Animation — mirrors manim.Animation public surface. */
export class Animation {
    constructor(mobject, opts = {}) {
        Object.defineProperty(this, "mobject", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "run_time", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "rate_func", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lag_ratio", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "remover", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "suspend_mobject_updating", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "startSnapshot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.mobject = mobject;
        this.run_time = optsRunTime(opts, 1);
        this.rate_func = optsRate(opts);
        this.lag_ratio = opts.lag_ratio ?? opts.lagRatio ?? 0;
        this.remover = opts.remover ?? false;
        this.suspend_mobject_updating = opts.suspend_mobject_updating ?? true;
    }
    get runTime() { return this.run_time; }
    get rateFunc() { return this.rate_func; }
    begin() {
        this.startSnapshot = this.mobject.copy();
    }
    finish() { }
    interpolate(_alpha) { }
    update_mobjects(_dt) {
        this.mobject.update(_dt);
    }
    updateMobjects(dt) { this.update_mobjects(dt); }
    get_moving_mobjects() { return [this.mobject]; }
    clean_up_from_scene(_scene) { }
    /** Interpolate with rate function applied (helper for subclasses). */
    eased(alpha) {
        return this.rate_func(alpha);
    }
}
// ---------------- Wait ----------------
export class Wait extends Animation {
    constructor(opts = {}) {
        super(new Group(), opts);
        this.run_time = optsRunTime(opts, 1);
        this.rate_func = linear;
    }
}
// =====================================================================
// Creation
// =====================================================================
export class Create extends Animation {
    constructor(mobject, opts = {}) {
        super(mobject, { run_time: 1, ...opts });
    }
    interpolate(alpha) {
        const t = this.eased(alpha);
        const m = this.mobject;
        if (!this.startSnapshot)
            return;
        const start = this.startSnapshot;
        // Reveal cubics progressively: interpolate point count.
        const full = start.points;
        const n = full.length;
        const shown = Math.floor(t * n);
        const partial = full.slice(0, shown);
        // partial last cubic: interpolate toward next anchor for smoothness
        if (shown < n && shown > 0) {
            const frac = t * n - shown;
            const prev = full[shown - 1];
            const next = full[shown];
            partial.push(lerpVec(prev, next, frac));
        }
        m.points = partial.map((p) => [...p]);
        // submobjects: reveal one by one
        m.submobjects.forEach((s, i) => {
            const total = m.submobjects.length;
            const local = total === 0 ? 1 : (t * total - i);
            const sub = s;
            const src = this.startSnapshot.submobjects[i];
            if (!src)
                return;
            if (local <= 0) {
                sub.points = [];
            }
            else if (local >= 1) {
                sub.points = src.points.map((p) => [...p]);
            }
            else {
                const nn = Math.floor(local * src.points.length);
                sub.points = src.points.slice(0, nn).map((p) => [...p]);
            }
        });
    }
    begin() {
        super.begin();
        // keep full in snapshot; clear live
        this.mobject.points = [];
        for (const s of this.mobject.submobjects)
            s.points = [];
    }
    finish() {
        if (this.startSnapshot)
            this.mobject.become(this.startSnapshot);
    }
}
export class Uncreate extends Animation {
    constructor(mobject, opts = {}) {
        super(mobject, { run_time: 1, ...opts });
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
export class DrawBorderThenFill extends Animation {
    constructor(mobject, opts = {}) {
        super(mobject, { run_time: 2, ...opts });
    }
    interpolate(alpha) {
        const m = this.mobject;
        if (!this.startSnapshot)
            return;
        const src = this.startSnapshot;
        const t = this.eased(alpha);
        // first half: border draw; second half: fill fade in
        const drawT = Math.min(1, t * 2);
        const n = src.points.length;
        const shown = Math.floor(drawT * n);
        m.points = src.points.slice(0, shown).map((p) => [...p]);
        const fillT = Math.max(0, t * 2 - 1);
        if ("fillOpacity" in m) {
            m.fillOpacity = src.fillOpacity * fillT;
        }
    }
    finish() {
        if (this.startSnapshot)
            this.mobject.become(this.startSnapshot);
    }
}
export class Write extends DrawBorderThenFill {
    constructor(mobject, opts = {}) {
        super(mobject, opts);
        this.run_time = optsRunTime(opts, 1);
    }
}
export class ShowIncreasingSubsets extends Animation {
    constructor(mobject, opts = {}) {
        super(mobject, opts);
    }
    interpolate(alpha) {
        const t = this.eased(alpha);
        const n = this.mobject.submobjects.length;
        if (!this.startSnapshot)
            return;
        const shown = Math.floor(t * n);
        this.mobject.submobjects.forEach((s, i) => {
            if (i < shown) {
                s.become(this.startSnapshot.submobjects[i]);
            }
            else {
                s.points = [];
            }
        });
    }
    finish() {
        if (this.startSnapshot)
            this.mobject.become(this.startSnapshot);
    }
}
export class ShowSubmobjectsOneByOne extends ShowIncreasingSubsets {
}
// =====================================================================
// Fading
// =====================================================================
function setOpacityRecursive(m, opacity, base) {
    const v = m;
    if (typeof v["fillOpacity"] === "number") {
        const b = base?.get(m) ?? 1;
        void b;
        v["fillOpacity"] = (v["__baseFill"] ?? v["fillOpacity"]) * opacity;
    }
    if (typeof v["strokeOpacity"] === "number") {
        v["strokeOpacity"] = (v["__baseStroke"] ?? v["strokeOpacity"]) * opacity;
    }
    for (const s of m.submobjects)
        setOpacityRecursive(s, opacity, base);
}
export class FadeIn extends Animation {
    constructor(mobject, opts = {}) {
        super(mobject, opts);
        Object.defineProperty(this, "shiftAmount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "scaleFactor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.shiftAmount = (opts.shift ? toVec3(opts.shift) : null);
        this.scaleFactor = opts.scale ?? 1;
    }
    begin() {
        super.begin();
        // stash base opacities
        for (const m of this.mobject.family) {
            const r = m;
            if (typeof r["fillOpacity"] === "number")
                r["__baseFill"] = r["fillOpacity"];
            if (typeof r["strokeOpacity"] === "number")
                r["__baseStroke"] = r["strokeOpacity"];
        }
        this.interpolate(0);
    }
    interpolate(alpha) {
        if (!this.startSnapshot)
            return;
        const t = this.eased(alpha);
        this.mobject.become(this.startSnapshot);
        for (const m of this.mobject.family) {
            const r = m;
            if (typeof r["fillOpacity"] === "number")
                r["fillOpacity"] = (r["__baseFill"] ?? 1) * t;
            if (typeof r["strokeOpacity"] === "number")
                r["strokeOpacity"] = (r["__baseStroke"] ?? 1) * t;
        }
        if (this.shiftAmount) {
            const off = (1 - t);
            this.mobject.shift([this.shiftAmount[0] * off, this.shiftAmount[1] * off, this.shiftAmount[2] * off]);
        }
        if (this.scaleFactor !== 1) {
            const s = 1 + (this.scaleFactor - 1) * (1 - t);
            void s;
        }
    }
    finish() {
        if (this.startSnapshot) {
            this.mobject.become(this.startSnapshot);
            for (const m of this.mobject.family) {
                const r = m;
                delete r["__baseFill"];
                delete r["__baseStroke"];
            }
        }
    }
}
export class FadeOut extends Animation {
    constructor(mobject, opts = {}) {
        super(mobject, opts);
        Object.defineProperty(this, "shiftAmount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.shiftAmount = opts.shift ? toVec3(opts.shift) : null;
    }
    begin() {
        super.begin();
        for (const m of this.mobject.family) {
            const r = m;
            if (typeof r["fillOpacity"] === "number")
                r["__baseFill"] = r["fillOpacity"];
            if (typeof r["strokeOpacity"] === "number")
                r["__baseStroke"] = r["strokeOpacity"];
        }
    }
    interpolate(alpha) {
        if (!this.startSnapshot)
            return;
        const t = 1 - this.eased(alpha);
        this.mobject.become(this.startSnapshot);
        for (const m of this.mobject.family) {
            const r = m;
            if (typeof r["fillOpacity"] === "number")
                r["fillOpacity"] = (r["__baseFill"] ?? 1) * t;
            if (typeof r["strokeOpacity"] === "number")
                r["strokeOpacity"] = (r["__baseStroke"] ?? 1) * t;
        }
        if (this.shiftAmount) {
            const k = this.eased(alpha);
            this.mobject.shift([this.shiftAmount[0] * k, this.shiftAmount[1] * k, this.shiftAmount[2] * k]);
        }
    }
    finish() {
        for (const m of this.mobject.family) {
            const r = m;
            if (typeof r["fillOpacity"] === "number")
                r["fillOpacity"] = 0;
            if (typeof r["strokeOpacity"] === "number")
                r["strokeOpacity"] = 0;
            delete r["__baseFill"];
            delete r["__baseStroke"];
        }
    }
}
export class FadeTransform extends Animation {
    constructor(mobject, target, opts = {}) {
        super(mobject, opts);
        Object.defineProperty(this, "target", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.target = target;
    }
    begin() {
        super.begin();
        const snap = this.startSnapshot;
        snap.match_points(this.target);
        snap.points = alignPointOrder(snap.points, this.target.points);
    }
    interpolate(alpha) {
        if (!this.startSnapshot)
            return;
        const t = this.eased(alpha);
        // cross-fade + morph (match point counts)
        const a = this.startSnapshot.copy();
        a.match_points(this.target);
        const b = this.target.copy();
        const n = Math.max(a.points.length, b.points.length);
        const out = [];
        for (let i = 0; i < n; i++) {
            const pa = a.points[Math.min(i, a.points.length - 1)] ?? [0, 0, 0];
            const pb = b.points[Math.min(i, b.points.length - 1)] ?? [0, 0, 0];
            out.push(lerpVec(pa, pb, t));
        }
        this.mobject.points = out;
        // opacity crossfade
        const ra = this.mobject;
        const sa = this.startSnapshot;
        const sb = this.target;
        for (const k of ["fillOpacity", "strokeOpacity"]) {
            if (typeof sa[k] === "number" || typeof sb[k] === "number") {
                ra[k] = interpolate(typeof sa[k] === "number" ? sa[k] : 1, typeof sb[k] === "number" ? sb[k] : 1, t);
            }
        }
    }
    finish() {
        this.mobject.become(this.target);
    }
}
export class FadeTransformPieces extends FadeTransform {
}
// =====================================================================
// Transform
// =====================================================================
export class Transform extends Animation {
    constructor(mobject, target, opts = {}) {
        super(mobject, opts);
        Object.defineProperty(this, "target", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pathFunc", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Arc-even fitted target from the morph pipeline (finish() uses `target`). */
        Object.defineProperty(this, "morphTarget", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.target = target;
        this.pathFunc = opts.path_func ?? opts.pathFunc;
    }
    begin() {
        super.begin();
        // Fit both sides through the arc-even morph pipeline (subpath pairing,
        // even resampling, smooth refit; cyclic order alignment for single runs)
        // so any shape morphs into any other without jitter. finish() still
        // snaps to the original target object.
        const snap = this.startSnapshot;
        const fitted = morphPair(snap.points, this.target.points);
        snap.points = fitted.paired ? fitted.src : alignPointOrder(fitted.src, fitted.tgt);
        this.morphTarget = fitted.tgt;
    }
    interpolate(alpha) {
        if (!this.startSnapshot)
            return;
        const t = this.eased(alpha);
        const a = this.startSnapshot.points;
        const b = this.morphTarget ?? this.target.points;
        const n = Math.max(a.length, b.length);
        const out = [];
        for (let i = 0; i < n; i++) {
            const pa = a[Math.min(i, a.length - 1)] ?? [0, 0, 0];
            const pb = b[Math.min(i, b.length - 1)] ?? [0, 0, 0];
            out.push(this.pathFunc ? this.pathFunc(pa, pb, t) : lerpVec(pa, pb, t));
        }
        this.mobject.points = out;
        // children morph (best effort by index)
        const tn = this.target.submobjects.length;
        while (this.mobject.submobjects.length < tn) {
            this.mobject.submobjects.push(this.target.submobjects[this.mobject.submobjects.length].copy());
        }
        this.mobject.submobjects.forEach((s, i) => {
            const sa = this.startSnapshot.submobjects[Math.min(i, this.startSnapshot.submobjects.length - 1)];
            const sb = this.target.submobjects[i];
            if (sa && sb) {
                const nn = Math.max(sa.points.length, sb.points.length);
                const oo = [];
                for (let k = 0; k < nn; k++) {
                    const pa = sa.points[Math.min(k, sa.points.length - 1)] ?? [0, 0, 0];
                    const pb = sb.points[Math.min(k, sb.points.length - 1)] ?? [0, 0, 0];
                    oo.push(lerpVec(pa, pb, t));
                }
                s.points = oo;
            }
        });
    }
    finish() {
        this.mobject.become(this.target);
    }
}
export class ReplacementTransform extends Transform {
}
export class TransformFromCopy extends Transform {
    begin() {
        // keep a copy of source visible: snapshot target start from source copy
        super.begin();
    }
}
export class ClockwiseTransform extends Transform {
    constructor(m, t, o = {}) {
        super(m, t, o);
        const { clockwise_path } = requirePath();
        this.pathFunc = clockwise_path;
    }
}
export class CounterclockwiseTransform extends Transform {
    constructor(m, t, o = {}) {
        super(m, t, o);
        this.pathFunc = requirePath().counterclockwise_path;
    }
}
function requirePath() {
    // local copies to avoid import cycle
    const ccw = (a, b, t) => {
        const ang = Math.atan2(a[1] ?? 0, a[0] ?? 0);
        const ang2 = Math.atan2(b[1] ?? 0, b[0] ?? 0);
        let d = ang2 - ang;
        while (d > Math.PI)
            d -= 2 * Math.PI;
        while (d < -Math.PI)
            d += 2 * Math.PI;
        if (d < 0)
            d += 2 * Math.PI;
        const r = interpolate(Math.hypot(a[0], a[1]), Math.hypot(b[0], b[1]), t);
        const th = ang + d * t;
        return [r * Math.cos(th), r * Math.sin(th), interpolate(a[2] ?? 0, b[2] ?? 0, t)];
    };
    const cw = (a, b, t) => {
        const ang = Math.atan2(a[1] ?? 0, a[0] ?? 0);
        const ang2 = Math.atan2(b[1] ?? 0, b[0] ?? 0);
        let d = ang2 - ang;
        while (d > Math.PI)
            d -= 2 * Math.PI;
        while (d < -Math.PI)
            d += 2 * Math.PI;
        if (d > 0)
            d -= 2 * Math.PI;
        const r = interpolate(Math.hypot(a[0], a[1]), Math.hypot(b[0], b[1]), t);
        const th = ang + d * t;
        return [r * Math.cos(th), r * Math.sin(th), interpolate(a[2] ?? 0, b[2] ?? 0, t)];
    };
    return { clockwise_path: cw, counterclockwise_path: ccw };
}
export class Restore extends Animation {
    interpolate(alpha) {
        if (!this.startSnapshot)
            return;
        const target = this.mobject.target;
        if (!target)
            return;
        const t = this.eased(alpha);
        const a = this.startSnapshot.points;
        const b = target.points;
        const n = Math.max(a.length, b.length);
        const out = [];
        for (let i = 0; i < n; i++) {
            const pa = a[Math.min(i, a.length - 1)] ?? [0, 0, 0];
            const pb = b[Math.min(i, b.length - 1)] ?? [0, 0, 0];
            out.push(lerpVec(pa, pb, t));
        }
        this.mobject.points = out;
    }
    finish() {
        this.mobject.move_to_target();
    }
}
export class MoveToTarget extends Restore {
}
export class ApplyMethod extends Animation {
    constructor(mobject, methodName, args = [], opts = {}) {
        super(mobject, opts);
        Object.defineProperty(this, "methodArgs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "methodName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.methodName = methodName;
        this.methodArgs = args;
    }
    begin() {
        super.begin();
        // build target by applying method to a copy
        const copy = this.mobject.copy();
        copy[this.methodName](...this.methodArgs);
        this.mobject.target = copy;
    }
    interpolate(alpha) {
        const target = this.mobject.target;
        if (!this.startSnapshot || !target)
            return;
        const t = this.eased(alpha);
        const a = this.startSnapshot.points;
        const b = target.points;
        const n = Math.max(a.length, b.length);
        const out = [];
        for (let i = 0; i < n; i++) {
            out.push(lerpVec(a[Math.min(i, a.length - 1)] ?? [0, 0, 0], b[Math.min(i, b.length - 1)] ?? [0, 0, 0], t));
        }
        this.mobject.points = out;
    }
    finish() {
        const target = this.mobject.target;
        if (target)
            this.mobject.become(target);
    }
}
export class ApplyFunction extends Animation {
    constructor(mobject, fn, opts = {}) {
        super(mobject, opts);
        Object.defineProperty(this, "fn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.fn = fn;
    }
    begin() {
        super.begin();
    }
    interpolate(alpha) {
        if (!this.startSnapshot)
            return;
        const t = this.eased(alpha);
        this.mobject.points = this.startSnapshot.points.map((p) => {
            const q = this.fn(p);
            return lerpVec(p, q, t);
        });
    }
    finish() {
        if (this.startSnapshot) {
            this.mobject.points = this.startSnapshot.points.map((p) => toVec3(this.fn(p)));
        }
    }
}
export class ApplyPointwiseFunction extends ApplyFunction {
}
export class ApplyMatrix extends Animation {
    constructor(mobject, matrix, opts = {}) {
        super(mobject, opts);
        Object.defineProperty(this, "matrix", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.matrix = matrix;
    }
    interpolate(alpha) {
        if (!this.startSnapshot)
            return;
        const t = this.eased(alpha);
        // interpolate matrix toward target: M(t) = (1-t)I + tM
        const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        const Mt = this.matrix.map((row, i) => row.map((v, j) => interpolate(I[i][j], v, t)));
        const c = this.startSnapshot.get_center();
        this.mobject.points = this.startSnapshot.points.map((p) => {
            const rel = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
            const q = Mt.map((row) => row[0] * rel[0] + row[1] * rel[1] + row[2] * rel[2]);
            return [q[0] + c[0], q[1] + c[1], q[2] + c[2]];
        });
    }
    finish() {
        if (!this.startSnapshot)
            return;
        const c = this.startSnapshot.get_center();
        this.mobject.points = this.startSnapshot.points.map((p) => {
            const rel = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
            const q = this.matrix.map((row) => row[0] * rel[0] + row[1] * rel[1] + row[2] * rel[2]);
            return [q[0] + c[0], q[1] + c[1], q[2] + c[2]];
        });
    }
}
// =====================================================================
// Movement / Homotopy
// =====================================================================
export class Homotopy extends Animation {
    constructor(mobject, homotopy, opts = {}) {
        super(mobject, opts);
        Object.defineProperty(this, "homotopy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.homotopy = homotopy;
    }
    interpolate(alpha) {
        if (!this.startSnapshot)
            return;
        const t = this.eased(alpha);
        this.mobject.points = this.startSnapshot.points.map((p) => {
            const q = this.homotopy(p[0], p[1], p[2], t);
            return [q[0], q[1], q[2]];
        });
    }
}
export class SmoothedVectorizedHomotopy extends Homotopy {
}
export class ComplexHomotopy extends Homotopy {
}
export class PhaseFlow extends Homotopy {
    constructor(mobject, func, opts = {}) {
        const vt = opts.virtual_time ?? 1;
        super(mobject, (x, y, z, t) => {
            // Euler-integrate func for t*vt (coarse but stable for demo purposes)
            let p = [x, y, z];
            const steps = 10;
            const dt = ((t * vt) / steps) || 0;
            for (let i = 0; i < steps; i++) {
                const d = func(p);
                p = [p[0] + d[0] * dt, p[1] + d[1] * dt, p[2] + (d[2] ?? 0) * dt];
            }
            return [p[0], p[1], p[2]];
        }, opts);
    }
}
export class MoveAlongPath extends Animation {
    constructor(mobject, path, opts = {}) {
        super(mobject, opts);
        Object.defineProperty(this, "path", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.path = path;
    }
    interpolate(alpha) {
        if (!this.startSnapshot)
            return;
        const t = this.eased(alpha);
        const fn = this.path.point_from_proportion
            ?? ((tt) => {
                const pts = this.path.points;
                if (!pts.length)
                    return [0, 0, 0];
                const f = tt * (pts.length - 1);
                const i0 = Math.floor(f);
                const i1 = Math.min(i0 + 1, pts.length - 1);
                return lerpVec(pts[i0], pts[i1], f - i0);
            });
        const target = fn.call(this.path, t);
        const startCenter = this.startSnapshot.get_center();
        this.mobject.points = this.startSnapshot.points.map((p) => toVec3([p[0] + target[0] - startCenter[0], p[1] + target[1] - startCenter[1], p[2] + target[2] - startCenter[2]]));
    }
}
// =====================================================================
// Rotation
// =====================================================================
export class Rotate extends Animation {
    constructor(mobject, opts = {}) {
        super(mobject, opts);
        Object.defineProperty(this, "angle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "axis", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "aboutPoint", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "aboutEdge", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.angle = opts.angle ?? Math.PI;
        this.axis = toVec3(opts.axis ?? [0, 0, 1]);
        this.aboutPoint = opts.about_point ? toVec3(opts.about_point) : null;
        this.aboutEdge = opts.about_edge ? toVec3(opts.about_edge) : null;
    }
    interpolate(alpha) {
        if (!this.startSnapshot)
            return;
        const t = this.eased(alpha);
        const about = this.aboutPoint ?? this.aboutEdge ?? this.startSnapshot.get_center();
        // rotate startSnapshot by angle*t about `about` (inline Rodrigues)
        this.mobject.points = this.startSnapshot.points.map((p) => {
            const rel = [p[0] - about[0], p[1] - about[1], p[2] - about[2]];
            // inline Rodrigues to avoid async import weirdness
            const k = this.axis;
            const n = Math.hypot(k[0], k[1], k[2]) || 1;
            const kn = [k[0] / n, k[1] / n, k[2] / n];
            const cos = Math.cos(this.angle * t);
            const sin = Math.sin(this.angle * t);
            const d = kn[0] * rel[0] + kn[1] * rel[1] + kn[2] * rel[2];
            const cr = [kn[1] * rel[2] - kn[2] * rel[1], kn[2] * rel[0] - kn[0] * rel[2], kn[0] * rel[1] - kn[1] * rel[0]];
            return [
                about[0] + rel[0] * cos + cr[0] * sin + kn[0] * d * (1 - cos),
                about[1] + rel[1] * cos + cr[1] * sin + kn[1] * d * (1 - cos),
                about[2] + rel[2] * cos + cr[2] * sin + kn[2] * d * (1 - cos),
            ];
        });
    }
}
export class Rotating extends Animation {
    constructor(mobject, opts = {}) {
        super(mobject, { ...opts, rate_func: opts.rate_func ?? opts.rateFunc ?? linear });
        Object.defineProperty(this, "angle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "axis", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "aboutPoint", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.angle = opts.angle ?? TAU;
        this.axis = toVec3(opts.axis ?? [0, 0, 1]);
        this.aboutPoint = opts.about_point ? toVec3(opts.about_point) : null;
    }
    interpolate(alpha) {
        const r = new Rotate(this.mobject, { angle: this.angle, axis: this.axis, about_point: this.aboutPoint ?? undefined });
        if (!this.startSnapshot)
            return;
        const about = this.aboutPoint ?? this.startSnapshot.get_center();
        const t = this.eased(alpha);
        const cos = Math.cos(this.angle * t);
        const sin = Math.sin(this.angle * t);
        const n = Math.hypot(this.axis[0], this.axis[1], this.axis[2]) || 1;
        const kn = [this.axis[0] / n, this.axis[1] / n, this.axis[2] / n];
        this.mobject.points = this.startSnapshot.points.map((p) => {
            const rel = [p[0] - about[0], p[1] - about[1], p[2] - about[2]];
            const d = kn[0] * rel[0] + kn[1] * rel[1] + kn[2] * rel[2];
            const cr = [kn[1] * rel[2] - kn[2] * rel[1], kn[2] * rel[0] - kn[0] * rel[2], kn[0] * rel[1] - kn[1] * rel[0]];
            return [
                about[0] + rel[0] * cos + cr[0] * sin + kn[0] * d * (1 - cos),
                about[1] + rel[1] * cos + cr[1] * sin + kn[1] * d * (1 - cos),
                about[2] + rel[2] * cos + cr[2] * sin + kn[2] * d * (1 - cos),
            ];
        });
        void r;
    }
}
// =====================================================================
// Growth
// =====================================================================
export class GrowFromPoint extends Animation {
    constructor(mobject, point, opts = {}) {
        super(mobject, opts);
        Object.defineProperty(this, "point", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.point = toVec3(point);
    }
    interpolate(alpha) {
        if (!this.startSnapshot)
            return;
        const t = this.eased(alpha);
        this.mobject.points = this.startSnapshot.points.map((p) => lerpVec(this.point, p, t));
    }
    finish() {
        if (this.startSnapshot)
            this.mobject.become(this.startSnapshot);
    }
}
export class GrowFromCenter extends GrowFromPoint {
    constructor(mobject, opts = {}) {
        super(mobject, mobject.get_center(), opts);
    }
}
export class GrowFromEdge extends GrowFromPoint {
    constructor(mobject, edge, opts = {}) {
        super(mobject, mobject.get_edge_center(toVec3(edge)), opts);
    }
}
export class GrowArrow extends GrowFromPoint {
    constructor(mobject, opts = {}) {
        super(mobject, mobject.get_start?.() ?? mobject.get_center(), opts);
    }
}
export class SpinInFromNothing extends GrowFromCenter {
    interpolate(alpha) {
        super.interpolate(alpha);
        // add spin
        if (!this.startSnapshot)
            return;
        const t = this.eased(alpha);
        const c = this.startSnapshot.get_center();
        const ang = (1 - t) * PI;
        const cos = Math.cos(ang);
        const sin = Math.sin(ang);
        this.mobject.points = this.mobject.points.map((p) => {
            const dx = p[0] - c[0];
            const dy = p[1] - c[1];
            return [c[0] + dx * cos - dy * sin, c[1] + dx * sin + dy * cos, p[2]];
        });
    }
}
// =====================================================================
// Numbers
// =====================================================================
export class ChangingDecimal extends Animation {
    constructor(decimal, updateFunc, opts = {}) {
        super(decimal, opts);
        Object.defineProperty(this, "updateFunc", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "decimal", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.decimal = decimal;
        this.updateFunc = updateFunc;
    }
    interpolate(alpha) {
        this.decimal.set_value(this.updateFunc(this.eased(alpha)));
    }
}
export function Count(animation) { return animation; }
// =====================================================================
// Indication
// =====================================================================
export class Indicate extends Animation {
    constructor(mobject, opts = {}) {
        super(mobject, { run_time: 1, ...opts });
        Object.defineProperty(this, "color", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "scaleFactor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1.2
        });
        this.scaleFactor = opts.scale_factor ?? 1.2;
    }
    interpolate(alpha) {
        if (!this.startSnapshot)
            return;
        const t = alpha < 0.5 ? smooth(alpha * 2) : 1 - smooth((alpha - 0.5) * 2);
        const s = 1 + (this.scaleFactor - 1) * t;
        const c = this.startSnapshot.get_center();
        this.mobject.points = this.startSnapshot.points.map((p) => toVec3([c[0] + (p[0] - c[0]) * s, c[1] + (p[1] - c[1]) * s, p[2]]));
    }
    finish() {
        if (this.startSnapshot)
            this.mobject.become(this.startSnapshot);
    }
}
export class Flash extends Animation {
    constructor(mobject, opts = {}) {
        super(new Group(), opts);
        Object.defineProperty(this, "color", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        void mobject;
        this.color = opts.color;
    }
}
export class CircleIndicate extends Indicate {
    constructor(mobject, opts = {}) {
        super(mobject, opts);
    }
}
export class ShowPassingFlash extends Animation {
    constructor(mobject, opts = {}) {
        super(mobject, { run_time: 1, ...opts });
    }
    interpolate(alpha) {
        // emulate by temporarily boosting stroke width in a moving window — simplified: pulse opacity
        if (!this.startSnapshot)
            return;
        const t = this.eased(alpha);
        void t;
    }
}
export class Wiggle extends Animation {
    constructor(mobject, opts = {}) {
        super(mobject, opts);
        Object.defineProperty(this, "scaleValue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1.1
        });
        Object.defineProperty(this, "rotationAngle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.05 * TAU
        });
        this.scaleValue = opts.scale_value ?? 1.1;
        this.rotationAngle = opts.rotation_angle ?? 0.05 * TAU;
    }
    interpolate(alpha) {
        if (!this.startSnapshot)
            return;
        const t = this.eased(alpha);
        const wiggle = Math.sin(6 * Math.PI * t) * (1 - t);
        const c = this.startSnapshot.get_center();
        const s = 1 + (this.scaleValue - 1) * Math.abs(wiggle);
        const ang = this.rotationAngle * wiggle;
        const cos = Math.cos(ang);
        const sin = Math.sin(ang);
        this.mobject.points = this.startSnapshot.points.map((p) => {
            const dx = (p[0] - c[0]) * s;
            const dy = (p[1] - c[1]) * s;
            return [c[0] + dx * cos - dy * sin, c[1] + dx * sin + dy * cos, p[2]];
        });
    }
    finish() {
        if (this.startSnapshot)
            this.mobject.become(this.startSnapshot);
    }
}
export class FocusOn extends Animation {
    constructor(mobject, opts = {}) {
        super(mobject, { run_time: 2, ...opts });
    }
}
export class Pulse extends Indicate {
}
export function animRunTime(a) {
    const r = a;
    if (typeof r["run_time"] === "number")
        return r["run_time"];
    if (typeof r["runTime"] === "number")
        return r["runTime"];
    return 1;
}
export class AnimationGroup extends Animation {
    constructor(...args) {
        // manim signature: AnimationGroup(*anims, lag_ratio=0, run_time=None, ...)
        let opts = {};
        let anims = args;
        const last = args[args.length - 1];
        if (last && typeof last === "object" && !("interpolate" in last) && !(isAnimationBuilder(last))) {
            opts = last;
            anims = args.slice(0, -1);
        }
        super(new Group(...anims.flatMap((a) => (typeof a.get_moving_mobjects === "function" ? a.get_moving_mobjects() : []))), opts);
        Object.defineProperty(this, "animations", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.animations = anims.map((a) => (isAnimationBuilder(a) ? a.build() : a));
        this.lag_ratio = opts.lag_ratio ?? opts.lagRatio ?? 0;
        if (opts.run_time ?? opts.runTime) {
            this.run_time = optsRunTime(opts);
        }
        else {
            // manim default: max run_time of sub-anims
            this.run_time = Math.max(0, ...this.animations.map(animRunTime));
        }
    }
    begin() {
        for (const a of this.animations)
            a.begin();
    }
    interpolate(alpha) {
        const n = this.animations.length;
        if (!n)
            return;
        const lag = this.lag_ratio;
        for (let i = 0; i < n; i++) {
            const start = lag * i;
            const span = 1 - lag * (n - 1);
            const local = Math.min(1, Math.max(0, (alpha - start) / (span || 1)));
            this.animations[i].interpolate(local);
        }
    }
    finish() {
        for (const a of this.animations)
            a.finish();
    }
    update_mobjects(dt) {
        for (const a of this.animations)
            a.update_mobjects?.(dt);
    }
    get_moving_mobjects() {
        return this.animations.flatMap((a) => (typeof a.get_moving_mobjects === "function" ? a.get_moving_mobjects() : []));
    }
}
export class Parallel extends AnimationGroup {
    constructor(...args) {
        super(...args);
        this.lag_ratio = 0;
    }
}
export const Simultaneous = Parallel;
export class Succession extends Animation {
    constructor(...args) {
        let opts = {};
        let anims = args;
        const last = args[args.length - 1];
        if (last && typeof last === "object" && !("interpolate" in last) && !isAnimationBuilder(last)) {
            opts = last;
            anims = args.slice(0, -1);
        }
        const total = anims.reduce((s, a) => s + animRunTime(a), 0) || 1;
        super(new Group(...anims.flatMap((a) => (typeof a.get_moving_mobjects === "function" ? a.get_moving_mobjects() : []))), { ...opts, run_time: opts.run_time ?? opts.runTime ?? total });
        Object.defineProperty(this, "animations", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.animations = anims.map((a) => (isAnimationBuilder(a) ? a.build() : a));
        this.run_time = opts.run_time ?? opts.runTime ?? total;
    }
    begin() {
        for (const a of this.animations)
            a.begin();
    }
    interpolate(alpha) {
        const total = this.animations.reduce((s, a) => s + animRunTime(a), 0) || 1;
        let elapsed = alpha * total;
        for (const a of this.animations) {
            const rt = animRunTime(a);
            if (elapsed <= 0) {
                a.interpolate(0);
            }
            else if (elapsed >= rt) {
                a.interpolate(1);
            }
            else {
                a.interpolate(elapsed / rt);
            }
            elapsed -= rt;
        }
    }
    finish() {
        for (const a of this.animations)
            a.finish();
    }
    update_mobjects(dt) {
        for (const a of this.animations)
            a.update_mobjects?.(dt);
    }
}
export class LaggedStart extends AnimationGroup {
    constructor(...args) {
        super(...args);
        if (this.lag_ratio === 0)
            this.lag_ratio = 0.05;
    }
}
export function LaggedStartMap(func, group, opts = {}) {
    const anims = group.submobjects.map((m) => func(m));
    return new LaggedStart(...anims, opts);
}
// =====================================================================
// Updater-driven animations
// =====================================================================
export class UpdateFromFunc extends Animation {
    constructor(mobject, updateFunc, opts = {}) {
        super(mobject, opts);
        Object.defineProperty(this, "updateFunc", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.updateFunc = updateFunc;
    }
    interpolate(_alpha) {
        this.updateFunc(this.mobject);
    }
}
export class UpdateFromAlphaFunc extends Animation {
    constructor(mobject, updateFunc, opts = {}) {
        super(mobject, opts);
        Object.defineProperty(this, "updateFunc", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.updateFunc = updateFunc;
    }
    interpolate(alpha) {
        this.updateFunc(this.mobject, this.eased(alpha));
    }
}
export class MaintainPositionRelativeTo extends UpdateFromFunc {
    constructor(mobject, tracked, opts = {}) {
        const offset = sub(mobject.get_center(), tracked.get_center());
        super(mobject, (m) => {
            const c = tracked.get_center();
            m.move_to(toVec3([c[0] + offset[0], c[1] + offset[1], c[2] + offset[2]]));
        }, opts);
    }
}
export class Sucker extends UpdateFromFunc {
    constructor(mobject, point, opts = {}) {
        const p = toVec3(point);
        super(mobject, (m) => {
            m.shift(mulScalar(sub(p, m.get_center()), 0.1));
        }, opts);
    }
}
void rush_into;
void Dot;
void ManimColor;
void ORIGIN;
void snapshotPoints;
//# sourceMappingURL=all.js.map