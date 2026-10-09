// Advanced mobjects finishing Manim parity — port of
// manim/mobject/vector_field.py, logo.py (ManimBanner),
// geometry/boolean_ops.py, and the TracedPath updater mobject.
import { VMobject, VGroup, Group, toVec3 } from "./base.js";
import { Line, Arrow, Dot, Circle, Rectangle } from "./geometry.js";
import { add, sub, mulScalar, norm, lerpVec, dist, } from "../utils/math.js";
import { parseColor, colorGradient, BLUE_A, TEAL, YELLOW, RED, GREEN, } from "../utils/color.js";
import { TAU, PI, ORIGIN } from "../constants.js";
export class TracedPath extends VMobject {
    constructor(traced_point_func, opts = {}) {
        super({});
        Object.defineProperty(this, "tracedPointFunc", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "dissipatingTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "elapsed", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "trail", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.tracedPointFunc = traced_point_func;
        this.dissipatingTime = opts.dissipating_time ?? Infinity;
        this.set_stroke(opts.stroke_color ?? YELLOW, opts.stroke_opacity ?? 1, opts.stroke_width ?? 4);
        this.set_fill(null);
        this.add_updater(() => this.updateTrail(1 / 60));
    }
    /** Advance the trail manually (Scene calls this via updaters with real dt). */
    updateTrail(dt) {
        this.elapsed += dt;
        const p = toVec3(this.tracedPointFunc());
        const last = this.trail[this.trail.length - 1];
        if (!last || dist(last.p, p) > 1e-9)
            this.trail.push({ p, t: this.elapsed });
        if (this.dissipatingTime !== Infinity) {
            const cutoff = this.elapsed - this.dissipatingTime;
            while (this.trail.length && this.trail[0].t < cutoff)
                this.trail.shift();
        }
        if (this.trail.length >= 2) {
            this.set_points_smoothly(this.trail.map((e) => e.p));
        }
        else {
            this.clear_points();
        }
        return this;
    }
    /** Current trail points (oldest first). */
    get_trail() {
        return this.trail.map((e) => [...e.p]);
    }
    update(dt = 0) {
        if (this.updatingSuspended)
            return this;
        // Run our own updater with the real dt, then the rest normally.
        for (const u of [...this.updaters])
            u(this, dt || 1 / 60);
        for (const s of this.submobjects)
            s.update(dt);
        return this;
    }
}
function rangeValues(r) {
    const [a, b, s] = r;
    const out = [];
    for (let x = a; x <= b + 1e-9; x += s)
        out.push(x);
    return out;
}
export class VectorField extends VGroup {
    constructor(func, opts = {}) {
        super();
        Object.defineProperty(this, "func", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.func = func;
        const xs = rangeValues(opts.x_range ?? [-7, 7, 1]);
        const ys = rangeValues(opts.y_range ?? [-4, 4, 1]);
        const maxLen = opts.max_len ?? 0.45;
        const minLen = opts.min_len ?? 0.05;
        // magnitude samples for color normalization
        const mags = [];
        const vecs = [];
        for (const x of xs) {
            for (const y of ys) {
                const c = [x, y, 0];
                const v = toVec3(func(c));
                const n = norm(v);
                if (n < 1e-9)
                    continue;
                mags.push(n);
                vecs.push({ c, v, n });
            }
        }
        const lo = Math.min(...mags, 0);
        const hi = Math.max(...mags, 1e-9);
        const colorOpt = opts.color;
        // A two-element array means a [min, max] gradient pair (no single
        // color in ParsableColor has exactly 2 components).
        const pair = Array.isArray(colorOpt) && colorOpt.length === 2
            ? colorOpt
            : null;
        const gradient = pair ? colorGradient(pair, 32) : null;
        for (const { c, v, n } of vecs) {
            const dir = toVec3(mulScalar(v, 1 / n));
            // saturating length (manim's default length_func behaves similarly)
            const len = Math.min(maxLen, Math.max(minLen, (maxLen * n) / (1 + n)));
            const a = toVec3(sub(c, mulScalar(dir, len / 2)));
            const b = toVec3(add(c, mulScalar(dir, len / 2)));
            let col;
            if (gradient) {
                const t = (n - lo) / (hi - lo || 1);
                col = gradient[Math.min(31, Math.floor(t * 32))];
            }
            else {
                col = colorOpt ?? YELLOW;
            }
            const arrow = new Arrow(a, b, {
                stroke_color: col,
                stroke_width: opts.stroke_width ?? 3,
                stroke_opacity: opts.opacity ?? 0.9,
                tip_length: opts.tip_length ?? Math.min(0.15, len * 0.4),
            });
            this.add(arrow);
        }
    }
}
/** Vector field with unit-length arrows (direction only). */
export class ArrowVectorField extends VectorField {
    constructor(func, opts = {}) {
        super((p) => {
            const v = toVec3(func(p));
            const n = norm(v) || 1;
            // encode unit direction with fixed magnitude so base class keeps length
            return toVec3(mulScalar(v, 1e6 / n));
        }, { max_len: 0.45, min_len: 0.45, ...opts });
    }
}
export class StreamLines extends VGroup {
    constructor(func, opts = {}) {
        super();
        Object.defineProperty(this, "func", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.func = func;
        const step = opts.seed_step ?? 1.0;
        const dt = opts.dt ?? 0.05;
        const nSteps = opts.n_steps ?? 40;
        const xs = rangeValues(opts.x_range ?? [-7, 7, step]);
        const ys = rangeValues(opts.y_range ?? [-4, 4, step]);
        for (const sx of xs) {
            for (const sy of ys) {
                const fwd = [[sx, sy, 0]];
                let p = [sx, sy, 0];
                for (let i = 0; i < nSteps; i++) {
                    const v = toVec3(func(p));
                    if (norm(v) < 1e-9)
                        break;
                    p = toVec3(add(p, mulScalar(v, dt / (norm(v) || 1))));
                    fwd.push(p);
                }
                let q = [sx, sy, 0];
                const bwd = [];
                for (let i = 0; i < nSteps; i++) {
                    const v = toVec3(func(q));
                    if (norm(v) < 1e-9)
                        break;
                    q = toVec3(sub(q, mulScalar(v, dt / (norm(v) || 1))));
                    bwd.push(q);
                }
                const samples = [...bwd.reverse(), ...fwd];
                if (samples.length < 3)
                    continue;
                const line = new VMobject({});
                line.set_points_smoothly(samples);
                line.set_stroke(opts.color ?? TEAL, opts.opacity ?? 0.7, opts.stroke_width ?? 2);
                this.add(line);
            }
        }
    }
    get_streamlines() {
        return this.submobjects;
    }
}
// =====================================================================
// ManimBanner — stylized "M" mark (inspired by the Manim logo)
// =====================================================================
export class ManimBanner extends VGroup {
    constructor(opts = {}) {
        super();
        const s = opts.scale ?? 1;
        const color = opts.color ?? BLUE_A;
        // Bold rounded "M" drawn as one smooth path.
        const m = new VMobject({});
        const P = (x, y) => [x * s, y * s, 0];
        m.set_points_smoothly([
            P(-1.4, 1.0), P(-1.4, -0.4), P(-1.35, -1.0),
            P(-0.7, -0.2), P(0, 0.35), P(0.7, -0.2),
            P(1.35, -1.0), P(1.4, -0.4), P(1.4, 1.0),
        ]);
        m.set_stroke(color, 1, 22);
        m.set_cap_style("round");
        m.set_joint_type("round");
        m.set_fill(null);
        const dot = new Dot(P(0, -1.05), { radius: 0.22 * s, fill_color: color, fill_opacity: 1, stroke_width: 0 });
        this.add(m, dot);
    }
}
// =====================================================================
// Boolean ops on flattened outlines
// (exact for convex operands; close approximation for smooth shapes
//  like circles flattened at high sample counts)
// =====================================================================
/** Flatten a VMobject's cubics into a closed polygon (XY plane). */
export function flatten_vmobject(m, samplesPerCurve = 24) {
    const tuples = m.get_cubic_tuples();
    if (!tuples.length)
        return m.points.map((p) => toVec3(p));
    const out = [];
    for (const [p0, p1, p2, p3] of tuples) {
        for (let i = 0; i < samplesPerCurve; i++) {
            const t = i / samplesPerCurve;
            const mt = 1 - t;
            out.push([
                mt ** 3 * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t ** 3 * p3[0],
                mt ** 3 * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t ** 3 * p3[1],
                0,
            ]);
        }
    }
    return out;
}
function signedArea(poly) {
    let s = 0;
    for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        s += a[0] * b[1] - b[0] * a[1];
    }
    return s / 2;
}
function segCross(a, b, c, d) {
    const rx = b[0] - a[0];
    const ry = b[1] - a[1];
    const sx = d[0] - c[0];
    const sy = d[1] - c[1];
    const denom = rx * sy - ry * sx;
    if (Math.abs(denom) < 1e-12)
        return null;
    const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / denom;
    const u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / denom;
    if (t < -1e-9 || t > 1 + 1e-9 || u < -1e-9 || u > 1 + 1e-9)
        return null;
    return { p: [a[0] + t * rx, a[1] + t * ry, 0], ta: t, tc: u };
}
function pointInPolygon(p, poly) {
    // Ray cast along +x.
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i];
        const b = poly[j];
        if (a[1] === p[1] && b[1] === p[1])
            continue;
        if (p[1] < Math.min(a[1], b[1]) || p[1] >= Math.max(a[1], b[1]))
            continue;
        const x = a[0] + ((p[1] - a[1]) * (b[0] - a[0])) / (b[1] - a[1] || 1e-18);
        if (x > p[0])
            inside = !inside;
    }
    return inside;
}
function insertIntersections(sub, clip) {
    const subIns = sub.map(() => []);
    const clipIns = clip.map(() => []);
    const mkNode = (p) => ({ p, ix: true, neighbor: null, entry: false, visited: false, idx: -1 });
    for (let i = 0; i < sub.length; i++) {
        const a = sub[i].p;
        const b = sub[(i + 1) % sub.length].p;
        if (dist(a, b) < 1e-12)
            continue;
        for (let j = 0; j < clip.length; j++) {
            const c = clip[j].p;
            const d = clip[(j + 1) % clip.length].p;
            if (dist(c, d) < 1e-12)
                continue;
            const hit = segCross(a, b, c, d);
            if (!hit)
                continue;
            let sn;
            if (hit.ta < 1e-9)
                sn = sub[i];
            else if (hit.ta > 1 - 1e-9)
                sn = sub[(i + 1) % sub.length];
            else {
                sn = mkNode(hit.p);
                subIns[i].push({ t: hit.ta, node: sn });
            }
            let cn;
            if (hit.tc < 1e-9)
                cn = clip[j];
            else if (hit.tc > 1 - 1e-9)
                cn = clip[(j + 1) % clip.length];
            else {
                cn = mkNode(hit.p);
                clipIns[j].push({ t: hit.tc, node: cn });
            }
            sn.ix = true;
            cn.ix = true;
            sn.neighbor = cn;
            cn.neighbor = sn;
        }
    }
    const splice = (nodes, ins) => {
        const out = [];
        nodes.forEach((n, i) => {
            out.push(n);
            for (const e of [...ins[i]].sort((x, y) => x.t - y.t))
                out.push(e.node);
        });
        out.forEach((n, k) => {
            n.idx = k;
        });
        return out;
    };
    return { sub: splice(sub, subIns), clip: splice(clip, clipIns) };
}
function markEntries(ring, otherPts) {
    const first = ring.findIndex((n) => n.ix);
    if (first < 0)
        return;
    const a = ring[first].p;
    const b = ring[(first + 1) % ring.length].p;
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0];
    let entry = pointInPolygon(mid, otherPts);
    for (let k = 0; k < ring.length; k++) {
        const n = ring[(first + k) % ring.length];
        if (n.ix) {
            n.entry = entry;
            entry = !entry;
        }
    }
}
function walkRing(start, rings, op) {
    const pts = [];
    let onSub = start.onSub ?? true;
    let forward = !(op === "difference" && !onSub);
    let cur = start;
    for (let guard = 0; guard < 20000; guard++) {
        cur.visited = true;
        pts.push(cur.p);
        const arr = onSub ? rings.sub : rings.clip;
        let nxt = arr[(cur.idx + (forward ? 1 : -1) + arr.length) % arr.length];
        if (nxt === start)
            break;
        if (nxt.ix) {
            // Switch rings exactly where the result boundary continues on the
            // other ring (labels are forward-traversal entry/exit flags):
            // - intersection (both rings forward): leave a ring at its EXIT nodes.
            // - difference (subject forward, clip backward): leave subject at
            //   ENTRY; leave clip at ENTRY (backward traversal flips the sense,
            //   so the cut is followed back to an entry point).
            // - union (both forward): leave subject at ENTRY, clip at EXIT.
            // - xor: switch at every crossing.
            const leave = op === "xor"
                ? true
                : op === "intersection"
                    ? !nxt.entry
                    : op === "difference"
                        ? nxt.entry
                        : onSub
                            ? nxt.entry
                            : !nxt.entry;
            if (leave && nxt.neighbor) {
                nxt = nxt.neighbor;
                onSub = !onSub;
                if (op === "difference")
                    forward = onSub;
                if (nxt === start)
                    break;
            }
        }
        cur = nxt;
    }
    return pts.length >= 3 ? pts : null;
}
/** Centroid of a ring (pivot for the perturbation below). */
function pointSegDist(p, a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-24)
        return dist(p, a);
    const t = Math.min(1, Math.max(0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
/** Minimum distance from a point to a ring (for boundary-tolerant tests). */
function distToRing(p, poly) {
    let d = Infinity;
    for (let i = 0; i < poly.length; i++) {
        d = Math.min(d, pointSegDist(p, poly[i], poly[(i + 1) % poly.length]));
    }
    return d;
}
/** Inside, or within `tol` of the boundary (boundary counts as inside). */
function insideOrOn(p, poly, tol = 1e-9) {
    return pointInPolygon(p, poly) || distToRing(p, poly) < tol;
}
/** Outside, or within `tol` of the boundary (boundary counts as outside). */
function outsideOrOn(p, poly, tol = 1e-9) {
    return !pointInPolygon(p, poly) || distToRing(p, poly) < tol;
}
function ringArea(poly) {
    return Math.abs(signedArea(poly));
}
/** Centroid of a ring (pivot for perturbation, seed probe for containment). */
function ringCentroid(poly) {
    let x = 0;
    let y = 0;
    for (const p of poly) {
        x += p[0];
        y += p[1];
    }
    const n = Math.max(1, poly.length);
    return [x / n, y / n, 0];
}
export function booleanOp(subject, clip, op, perturb = 0) {
    if (subject.length < 3 || clip.length < 3)
        return [];
    // Optional perturbation: translate the clip a touch to turn collinear
    // overlaps / grazing touches into transversal crossings. Translation (not
    // rotation) is used so near-parallel edges separate uniformly instead of
    // pivoting into new grazes. Only used as a fallback (see
    // booleanOpValidated) — clean inputs stay bit-exact.
    let clipWork = clip;
    if (perturb) {
        const dx = perturb;
        const dy = perturb * Math.SQRT2;
        clipWork = clip.map((p) => [p[0] + dx, p[1] + dy, 0]);
    }
    let sub = subject.map((p) => ({ p: [...p], ix: false, neighbor: null, entry: false, visited: false, idx: -1 }));
    let clp = clipWork.map((p) => ({ p: [...p], ix: false, neighbor: null, entry: false, visited: false, idx: -1 }));
    const spliced = insertIntersections(sub, clp);
    sub = spliced.sub;
    clp = spliced.clip;
    sub.forEach((n) => {
        n.onSub = true;
    });
    markEntries(sub, clp.map((n) => n.p));
    markEntries(clp, sub.map((n) => n.p));
    const rings = [];
    const hasIx = sub.some((n) => n.ix);
    if (hasIx) {
        for (const n of sub) {
            if (!n.ix || n.visited)
                continue;
            const startIt = op === "intersection" ? n.entry : op === "difference" ? !n.entry : true;
            if (!startIt)
                continue;
            const r = walkRing(n, { sub, clip: clp }, op);
            if (r)
                rings.push(r);
        }
        if (op === "xor") {
            for (const n of clp) {
                if (!n.ix || n.visited)
                    continue;
                n.onSub = false;
                const r = walkRing(n, { sub, clip: clp }, op);
                if (r)
                    rings.push(r);
            }
        }
    }
    // Containment seeds for loops with no crossings. Probes the centroid first
    // (robust for coincident rings), then a strictly off-boundary vertex.
    const seed = (ring, other, includeIfInside) => {
        if (ring.some((n) => n.ix) || ring.some((n) => n.visited))
            return;
        const ringPts = ring.map((n) => n.p);
        const otherPts = other.map((n) => n.p);
        const take = () => {
            ring.forEach((n) => {
                n.visited = true;
            });
            rings.push(ringPts);
        };
        if (includeIfInside === null) {
            // xor: disjoint rings both belong; coincident rings cancel out.
            const coincident = ringPts.every((p) => distToRing(p, otherPts) < 1e-9);
            if (!coincident)
                take();
            return;
        }
        const decide = (p) => {
            if (distToRing(p, otherPts) < 1e-9)
                return null; // on boundary: inconclusive
            return pointInPolygon(p, otherPts) === includeIfInside;
        };
        const c = decide(ringCentroid(ringPts));
        if (c !== null) {
            if (c)
                take();
            return;
        }
        for (const p of ringPts) {
            const d = decide(p);
            if (d !== null) {
                if (d)
                    take();
                return;
            }
        }
        // Fully coincident rings: intersection keeps, difference/xor drop.
        if (op === "intersection")
            take();
    };
    if (op === "intersection") {
        seed(sub, clp, true);
        seed(clp, sub, true);
    }
    else if (op === "difference") {
        seed(sub, clp, false);
    }
    else {
        seed(sub, clp, null);
        seed(clp, sub, null);
    }
    // Normalize winding to CCW for consistent fills.
    for (const r of rings) {
        if (signedArea(r) < 0)
            r.reverse();
    }
    return rings.filter((r) => r.length >= 3 && Math.abs(signedArea(r)) > 1e-9);
}
/**
 * Validate traced rings against the operation's invariants. Catches
 * mistraced rings (e.g. union traced instead of intersection) so the
 * caller can retry with perturbation.
 */
export function validateRings(rings, subject, clip, op, tol = 1e-6) {
    const aS = ringArea(subject);
    const aC = ringArea(clip);
    let total = 0;
    for (const r of rings) {
        total += ringArea(r);
        for (const p of r) {
            if (op === "intersection") {
                if (!insideOrOn(p, subject, tol) || !insideOrOn(p, clip, tol))
                    return false;
            }
            else if (op === "difference") {
                if (!insideOrOn(p, subject, tol) || !outsideOrOn(p, clip, tol))
                    return false;
            }
            else {
                if (!insideOrOn(p, subject, tol) && !insideOrOn(p, clip, tol))
                    return false;
            }
        }
    }
    if (op === "intersection")
        return total <= Math.min(aS, aC) + tol;
    if (op === "difference")
        return total <= aS + tol;
    return total <= aS + aC + tol;
}
/**
 * Exact-first boolean op: tries the unperturbed trace, validates it, and
 * retries with a 1e-3 perturbation only if validation fails. Clean inputs
 * stay bit-exact; degenerate inputs (shared edges, touches) still resolve.
 */
export function booleanOpValidated(subject, clip, op) {
    const exact = booleanOp(subject, clip, op, 0);
    if (validateRings(exact, subject, clip, op))
        return exact;
    // Perturbation displaces vertices by at most ~2e-3 units, so validate the
    // fallback against a proportionally scaled tolerance.
    const perturbed = booleanOp(subject, clip, op, 1e-3);
    if (validateRings(perturbed, subject, clip, op, 0.02))
        return perturbed;
    return exact;
}
function polygonToVMobject(poly, style) {
    const out = new VMobject({});
    if (poly.length >= 3) {
        out.set_points_as_corners([...poly, poly[0]]);
    }
    out.match_style(style);
    return out;
}
function flattenOperands(mobjects) {
    return mobjects.map((m) => m instanceof VMobject ? flatten_vmobject(m) : m.get_all_points().map(toVec3));
}
/** Union of VMobjects (VGroup wrapper — pixel-exact for fills). */
export class Union extends VGroup {
    constructor(...mobjects) {
        super(...mobjects);
    }
}
function ringsToMobjects(rings, style) {
    return rings.map((r) => polygonToVMobject(r, style));
}
/** Intersection of VMobject outlines. */
export class Intersection extends VMobject {
    constructor(subject, ...clips) {
        super({});
        let rings = [flatten_vmobject(subject)];
        for (const c of clips) {
            const next = [];
            for (const r of rings)
                next.push(...booleanOpValidated(r, flatten_vmobject(c), "intersection"));
            rings = next;
        }
        rings.sort((a, b) => Math.abs(signedArea(b)) - Math.abs(signedArea(a)));
        const [first, ...rest] = rings;
        if (first) {
            const built = polygonToVMobject(first, subject);
            this.points = built.points;
        }
        for (const piece of rest)
            this.add(polygonToVMobject(piece, subject));
        this.match_style(subject);
    }
}
/** Subject outline minus clip outline(s). */
export class Difference extends VMobject {
    constructor(subject, ...clips) {
        super({});
        let rings = [flatten_vmobject(subject)];
        for (const c of clips) {
            const next = [];
            for (const r of rings)
                next.push(...booleanOpValidated(r, flatten_vmobject(c), "difference"));
            rings = next;
        }
        // Keep the largest remaining piece as this mobject's outline;
        // extra disjoint pieces become submobjects.
        rings.sort((a, b) => Math.abs(signedArea(b)) - Math.abs(signedArea(a)));
        const [first, ...rest] = rings;
        if (first) {
            const built = polygonToVMobject(first, subject);
            this.points = built.points;
        }
        for (const piece of rest)
            this.add(polygonToVMobject(piece, subject));
        this.match_style(subject);
    }
}
/** Symmetric difference (exclusion) of outlines. */
export class Exclusion extends VGroup {
    constructor(a, b) {
        super();
        // Built from two validated differences (disjoint by construction),
        // which is more robust than a direct xor trace.
        this.add(new Difference(a, b), new Difference(b, a));
    }
}
void Line;
void Arrow;
void Dot;
void Circle;
void Rectangle;
void Group;
void lerpVec;
void parseColor;
void colorGradient;
void TAU;
void PI;
void ORIGIN;
void YELLOW;
void RED;
void GREEN;
//# sourceMappingURL=advanced.js.map