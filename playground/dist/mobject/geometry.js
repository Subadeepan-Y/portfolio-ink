// Geometry mobjects — port of manim/mobject/geometry/{arc,line,polygram}.py
import { TAU, PI, LEFT, RIGHT, UP, DOWN, ORIGIN } from "../constants.js";
import { VMobject, toVec3 } from "./base.js";
import { add, sub, mulScalar, norm, normalize, lerpVec, angleOfVector } from "../utils/math.js";
function applyGeometryDefaults(m, o = {}) {
    if (o.color !== undefined)
        m.set_color(o.color);
    if (o.fill_color !== undefined || o.fill_opacity !== undefined)
        m.set_fill(o.fill_color ?? m.get_fill_color() ?? o.color ?? null, o.fill_opacity ?? (o.fill_color !== undefined ? 1 : m.get_fill_opacity()));
    if (o.stroke_color !== undefined || o.stroke_opacity !== undefined || o.stroke_width !== undefined)
        m.set_stroke(o.stroke_color ?? o.color ?? m.get_stroke_color(), o.stroke_opacity ?? m.get_stroke_opacity(), o.stroke_width ?? m.get_stroke_width());
    if (o.opacity !== undefined)
        m.set_opacity(o.opacity);
}
// ---------------- Tip ----------------
export class ArrowTip extends VMobject {
    constructor(opts = {}) {
        super({ fill_color: opts.color, fill_opacity: opts.fill_opacity ?? 1, stroke_width: 0 });
        Object.defineProperty(this, "length", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.35
        });
        Object.defineProperty(this, "width", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.35
        });
        this.length = opts.length ?? 0.35;
        this.width = opts.width ?? 0.35;
        // triangle pointing +x, tip at origin? Manim tip points along direction with base behind.
        const L = this.length;
        const W = this.width / 2;
        this.set_points_as_corners([
            [0, 0, 0],
            [-L, W, 0],
            [-L, -W, 0],
            [0, 0, 0],
        ]);
    }
    get_start() { return toVec3(this.points[0] ?? [0, 0, 0]); }
}
export class Line extends VMobject {
    constructor(start = LEFT, end = RIGHT, opts = {}) {
        super({ stroke_width: opts.stroke_width ?? 4 });
        applyGeometryDefaults(this, opts);
        this.put_start_and_end_on(toVec3(start), toVec3(end), opts.buff ?? 0, opts.path_arc ?? 0);
    }
    put_start_and_end_on(start, end, buff = 0, pathArc = 0) {
        let s = start;
        let e = end;
        const len = Math.hypot(e[0] - s[0], e[1] - s[1], e[2] - s[2]);
        if (buff > 0 && len > 0) {
            const dir = mulScalar(sub(e, s), 1 / len);
            s = toVec3(add(s, mulScalar(dir, buff)));
            e = toVec3(sub(e, mulScalar(dir, buff)));
        }
        if (!pathArc) {
            this.set_points_as_corners([s, e]);
        }
        else {
            // curved line: quadratic bezier via rotated midpoint
            const mid = toVec3(lerpVec(s, e, 0.5));
            const diff = sub(e, s);
            const perp = [-(diff[1] ?? 0), diff[0] ?? 0, 0];
            const pl = norm(perp) || 1;
            const offset = (Math.tan(pathArc / 2) * norm(diff)) / 2 / (pl || 1);
            const ctrl = toVec3(add(mid, mulScalar(mulScalar(perp, 1 / pl), offset)));
            // quadratic -> cubic
            const c1 = toVec3(add(mulScalar(s, 1 / 3), mulScalar(ctrl, 2 / 3)));
            const c2 = toVec3(add(mulScalar(e, 1 / 3), mulScalar(ctrl, 2 / 3)));
            this.set_points([s, c1, c2, e]);
        }
        return this;
    }
    putStartAndEndOn(s, e) { return this.put_start_and_end_on(s, e); }
    get_start() {
        const t = this.get_cubic_tuples();
        if (t.length)
            return toVec3(t[0][0]);
        return super.get_start();
    }
    get_end() {
        const t = this.get_cubic_tuples();
        if (t.length)
            return toVec3(t[t.length - 1][3]);
        return super.get_end();
    }
    get_length() {
        return this.get_arc_length();
    }
    getLength() { return this.get_length(); }
    get_angle() {
        const s = this.get_start();
        const e = this.get_end();
        return Math.atan2(e[1] - s[1], e[0] - s[0]);
    }
    getAngle() { return this.get_angle(); }
    get_slope() { return Math.tan(this.get_angle()); }
    set_length(length, about_point) {
        const cur = this.get_length() || 1;
        return this.scale(length / cur, about_point);
    }
    get_vector() { return toVec3(sub(this.get_end(), this.get_start())); }
    get_unit_vector() {
        const v = this.get_vector();
        const n = norm(v) || 1;
        return toVec3(mulScalar(v, 1 / n));
    }
}
export class DashedLine extends Line {
    constructor(start = LEFT, end = RIGHT, opts = {}) {
        super(start, end, opts);
        Object.defineProperty(this, "numDashes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 15
        });
        Object.defineProperty(this, "dashedRatio", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.5
        });
        this.numDashes = opts.num_dashes ?? 15;
        this.dashedRatio = opts.dashed_ratio ?? 0.5;
        this.buildDashes(opts.dash_length);
    }
    buildDashes(_dashLength) {
        // Represent dashes as submobject Lines.
        const s = super.get_start();
        const e = super.get_end();
        this.clear_points();
        const n = this.numDashes;
        const ratio = this.dashedRatio;
        const sub = this.submobjects;
        // clear existing dash children
        this.submobjects = [];
        for (let i = 0; i < n; i++) {
            const a = i / n;
            const b = (i + ratio) / n;
            const p1 = toVec3(lerpVec(s, e, a));
            const p2 = toVec3(lerpVec(s, e, b));
            const dash = new Line(p1, p2, {
                stroke_width: this.get_stroke_width(),
                stroke_color: this.get_stroke_color(),
                stroke_opacity: this.get_stroke_opacity(),
            });
            this.add(dash);
        }
        void sub;
    }
    get_start() {
        const first = this.submobjects[0];
        return first ? first.get_start() : super.get_start();
    }
    get_end() {
        const last = this.submobjects[this.submobjects.length - 1];
        return last ? last.get_end() : super.get_end();
    }
}
export class Arrow extends Line {
    constructor(start = LEFT, end = RIGHT, opts = {}) {
        super(start, end, opts);
        Object.defineProperty(this, "tip", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxTipRatio", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.35
        });
        this.maxTipRatio = opts.max_tip_length_to_length_ratio ?? 0.35;
        const len = this.get_length() || 1;
        const tipLen = Math.min(opts.tip_length ?? 0.35, this.maxTipRatio * len);
        this.tip = new ArrowTip({ length: tipLen, width: opts.tip_width ?? tipLen, color: this.get_stroke_color(), fill_opacity: 1 });
        this.add_tip();
    }
    add_tip() {
        const end = super.get_end();
        const angle = this.get_angle();
        // shorten shaft so tip sits at end
        const tipLen = this.tip.length;
        const dir = this.get_unit_vector();
        const shaftEnd = toVec3(sub(end, mulScalar(dir, tipLen * 0.85)));
        this.put_start_and_end_on(super.get_start(), shaftEnd);
        this.tip.rotate(angle, [0, 0, 1], [0, 0, 0]);
        this.tip.move_to(end);
        // tip already in this.submobjects? Line has none; add:
        this.add(this.tip);
    }
    get_end() {
        // arrow end = tip end
        return this.tip ? this.tip.get_center() : super.get_end();
    }
    get_tip() { return this.tip; }
}
export class Vector extends Arrow {
    constructor(direction = UP, opts = {}) {
        super(ORIGIN, toVec3(direction), opts);
    }
}
export class DoubleArrow extends Line {
    constructor(start = LEFT, end = RIGHT, opts = {}) {
        super(start, end, opts);
        Object.defineProperty(this, "tip1", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tip2", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const len = this.get_length() || 1;
        const tipLen = Math.min(opts.tip_length ?? 0.35, (opts.max_tip_length_to_length_ratio ?? 0.35) * len);
        const color = this.get_stroke_color();
        this.tip1 = new ArrowTip({ length: tipLen, width: opts.tip_width ?? tipLen, color });
        this.tip2 = new ArrowTip({ length: tipLen, width: opts.tip_width ?? tipLen, color });
        const s = super.get_start();
        const e = super.get_end();
        const angle = this.get_angle();
        const dir = this.get_unit_vector();
        const s2 = toVec3(add(s, mulScalar(dir, tipLen * 0.85)));
        const e2 = toVec3(sub(e, mulScalar(dir, tipLen * 0.85)));
        this.put_start_and_end_on(s2, e2);
        this.tip1.rotate(angle + PI, [0, 0, 1], [0, 0, 0]);
        this.tip1.move_to(s);
        this.tip2.rotate(angle, [0, 0, 1], [0, 0, 0]);
        this.tip2.move_to(e);
        this.add(this.tip1, this.tip2);
    }
}
export class CurvedArrow extends VMobject {
    constructor(start, end, opts = {}) {
        super({});
        const s = toVec3(start);
        const e = toVec3(end);
        const angle = opts.angle ?? -TAU / 4;
        // arc center computation: chord with subtended angle
        const mid = toVec3(lerpVec(s, e, 0.5));
        const chord = sub(e, s);
        const chordLen = norm(chord) || 1e-6;
        const radius = Math.abs(chordLen / 2 / Math.sin(angle / 2 || 1e-6));
        const distToCenter = Math.sqrt(Math.max(0, radius * radius - (chordLen / 2) ** 2));
        const perp = normalize([-chord[1], chord[0], 0]);
        const sign = angle > 0 ? 1 : -1;
        const center = toVec3(add(mid, mulScalar(perp, sign * distToCenter)));
        const a1 = Math.atan2(s[1] - center[1], s[0] - center[0]);
        let a2 = Math.atan2(e[1] - center[1], e[0] - center[0]);
        // ensure sweep matches sign of angle
        let sweep = a2 - a1;
        while (sweep > PI)
            sweep -= TAU;
        while (sweep < -PI)
            sweep += TAU;
        if (sign > 0 && sweep < 0)
            sweep += TAU;
        if (sign < 0 && sweep > 0)
            sweep -= TAU;
        const arc = new Arc(radius, { start_angle: a1, angle: sweep });
        arc.shift(center);
        // shaft: trim end for tip
        const tipLen = Math.min(opts.tip_length ?? 0.35, 0.35 * arc.get_arc_length());
        const total = arc.get_arc_length();
        const trimT = tipLen / (total || 1);
        const shaftEnd = arc.point_from_proportion(1 - trimT * 0.9);
        // rebuild shaft points up to shaftEnd — approximate by sampling
        const N = 24;
        const cut = Math.max(2, Math.floor(N * (1 - trimT * 0.9)));
        const sampled = [];
        for (let i = 0; i <= cut; i++)
            sampled.push(arc.point_from_proportion(i / N));
        this.set_points_smoothly(sampled);
        this.set_stroke(opts.stroke_color ?? opts.color, opts.stroke_opacity, opts.stroke_width ?? 4);
        const tipDirAngle = a1 + sweep; // tangent at end
        const tangent = [-Math.sin(a1 + sweep), Math.cos(a1 + sweep), 0];
        if (sweep < 0) {
            tangent[0] *= -1;
            tangent[1] *= -1;
        }
        void tangent;
        void shaftEnd;
        const tipAngle = Math.atan2(e[1] - sampled[sampled.length - 1][1], e[0] - sampled[sampled.length - 1][0]);
        void tipDirAngle;
        const tip = new ArrowTip({ length: tipLen, color: this.get_stroke_color() });
        tip.rotate(tipAngle, [0, 0, 1], [0, 0, 0]);
        tip.move_to(e);
        this.add(tip);
    }
}
export class Elbow extends VMobject {
    constructor(opts = {}) {
        super({});
        const w = opts.width ?? 0.2;
        applyGeometryDefaults(this, opts);
        this.set_points_as_corners([
            [w, 0, 0],
            [0, 0, 0],
            [0, w, 0],
        ]);
    }
}
const KAPPA = 0.5522847498307936;
export class Arc extends VMobject {
    constructor(radius = 1, opts = {}) {
        super({ stroke_width: opts.stroke_width ?? 4 });
        Object.defineProperty(this, "radius", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "startAngle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "angle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        applyGeometryDefaults(this, opts);
        this.radius = opts.radius ?? radius;
        this.startAngle = opts.start_angle ?? 0;
        this.angle = opts.angle ?? TAU / 4;
        this.build();
        if (opts.arc_center)
            this.shift(toVec3(opts.arc_center));
    }
    build() {
        const total = this.angle;
        const n = Math.max(1, Math.ceil(Math.abs(total) / (PI / 2)));
        const seg = total / n;
        const curves = [];
        for (let i = 0; i < n; i++) {
            const a0 = this.startAngle + i * seg;
            const a1 = a0 + seg;
            curves.push(...arcSegmentCubics(this.radius, a0, a1));
        }
        this.set_points(curves.flat());
    }
    /** Move arc so its center is at `point`. */
    move_arc_center_to(point) {
        const c = this.get_arc_center();
        return this.shift(sub(toVec3(point), c));
    }
    get_arc_center() {
        // center = start anchor - radius * radial(startAngle)
        const tuples = this.get_cubic_tuples();
        if (!tuples.length)
            return this.get_center();
        const p0 = tuples[0][0];
        const r = this.radius || 1;
        return [
            p0[0] - r * Math.cos(this.startAngle),
            p0[1] - r * Math.sin(this.startAngle),
            p0[2] ?? 0,
        ];
    }
}
function arcSegmentCubics(radius, a0, a1) {
    // cubic approximation of circular arc segment (|a1-a0| <= PI/2)
    const delta = a1 - a0;
    const k = (4 / 3) * Math.tan(delta / 4);
    const p0 = [radius * Math.cos(a0), radius * Math.sin(a0), 0];
    const p3 = [radius * Math.cos(a1), radius * Math.sin(a1), 0];
    const t0 = [-Math.sin(a0), Math.cos(a0), 0];
    const t1 = [-Math.sin(a1), Math.cos(a1), 0];
    const p1 = [p0[0] + k * radius * t0[0], p0[1] + k * radius * t0[1], 0];
    const p2 = [p3[0] - k * radius * t1[0], p3[1] - k * radius * t1[1], 0];
    return [[p0, p1, p2, p3]];
}
export class Circle extends Arc {
    constructor(opts = {}) {
        super(opts.radius ?? 1, { ...opts, start_angle: 0, angle: TAU });
        this.set_fill(opts.fill_color ?? null, opts.fill_opacity ?? 0);
    }
}
export class Ellipse extends VMobject {
    constructor(opts = {}) {
        super({});
        applyGeometryDefaults(this, opts);
        const w = (opts.width ?? 2) / 2;
        const h = (opts.height ?? 1) / 2;
        // 4 cubic segments scaled circle
        const k = KAPPA;
        this.set_points([
            [[w, 0, 0], [w, k * h, 0], [k * w, h, 0], [0, h, 0]],
            [[0, h, 0], [-k * w, h, 0], [-w, k * h, 0], [-w, 0, 0]],
            [[-w, 0, 0], [-w, -k * h, 0], [-k * w, -h, 0], [0, -h, 0]],
            [[0, -h, 0], [k * w, -h, 0], [w, -k * h, 0], [w, 0, 0]],
        ].flat());
    }
}
export class Dot extends Circle {
    constructor(point = ORIGIN, opts = {}) {
        super({ ...opts, radius: opts.radius ?? 0.08, fill_color: opts.fill_color ?? opts.color, fill_opacity: opts.fill_opacity ?? 1, stroke_width: opts.stroke_width ?? 0 });
        this.move_to(toVec3(point));
    }
}
export class SmallDot extends Dot {
    constructor(point = ORIGIN, opts = {}) {
        super(point, { ...opts, radius: 0.04 });
    }
}
export class Annulus extends VMobject {
    constructor(opts = {}) {
        super({});
        applyGeometryDefaults(this, { ...opts, fill_opacity: opts.fill_opacity ?? 1 });
        const r0 = opts.inner_radius ?? 1;
        const r1 = opts.outer_radius ?? 2;
        const a0 = opts.start_angle ?? 0;
        const sweep = opts.angle ?? TAU;
        // outer arc + inner arc reversed -> single filled ring path
        const outer = new Arc(r1, { start_angle: a0, angle: sweep });
        const inner = new Arc(r0, { start_angle: a0 + sweep, angle: -sweep });
        this.set_points([...outer.get_points(), ...inner.get_points()]);
        if (this.get_fill_color() === null)
            this.set_fill(opts.color, 1);
    }
}
export class Sector extends VMobject {
    constructor(opts = {}) {
        super({});
        applyGeometryDefaults(this, { ...opts, fill_opacity: opts.fill_opacity ?? 1 });
        const r = opts.radius ?? 1;
        const a0 = opts.start_angle ?? 0;
        const sweep = opts.angle ?? TAU / 4;
        const arc = new Arc(r, { start_angle: a0, angle: sweep });
        const center = [0, 0, 0];
        const startAnchor = arc.get_cubic_tuples()[0][0];
        const endTuples = arc.get_cubic_tuples();
        const endAnchor = endTuples[endTuples.length - 1][3];
        // path: center -> start -> arc -> center
        const pts = [center];
        // line center->start as cubic
        const h1 = toVec3(lerpVec(center, startAnchor, 1 / 3));
        const h2 = toVec3(lerpVec(center, startAnchor, 2 / 3));
        pts.push(h1, h2, toVec3(startAnchor));
        pts.push(...arc.get_points().slice(1));
        const last = toVec3(arc.get_points()[arc.get_points().length - 1]);
        const c1 = toVec3(lerpVec(last, center, 1 / 3));
        const c2 = toVec3(lerpVec(last, center, 2 / 3));
        pts.push(c1, c2, center);
        this.set_points(pts);
        if (opts.arc_center)
            this.shift(toVec3(opts.arc_center));
        void endAnchor;
    }
}
export class AnnularSector extends Annulus {
    constructor(opts = {}) {
        super(opts);
    }
}
// ---------------- Rectangle family ----------------
export class Rectangle extends VMobject {
    constructor(opts = {}) {
        super({});
        applyGeometryDefaults(this, opts);
        const w = (opts.width ?? 4) / 2;
        const h = (opts.height ?? 2) / 2;
        this.set_points_as_corners([
            [-w, -h, 0],
            [w, -h, 0],
            [w, h, 0],
            [-w, h, 0],
            [-w, -h, 0],
        ]);
    }
}
export class Square extends Rectangle {
    constructor(opts = {}) {
        const s = opts.side_length ?? 2;
        super({ ...opts, width: s, height: s });
    }
}
export class RoundedRectangle extends VMobject {
    constructor(opts = {}) {
        super({});
        applyGeometryDefaults(this, opts);
        const hw = (opts.width ?? 4) / 2;
        const hh = (opts.height ?? 2) / 2;
        const r = Math.min(opts.corner_radius ?? 0.5, hw, hh);
        const k = KAPPA * r;
        // 4 straight edges + 4 corner arcs, clockwise from bottom edge
        const pts = [];
        const corner = (cx, cy, a0) => {
            const seg = [];
            const steps = 2;
            for (let i = 0; i < steps; i++) {
                const t0 = a0 + (i / steps) * (PI / 2);
                const t1 = a0 + ((i + 1) / steps) * (PI / 2);
                seg.push(...arcSegmentCubics(r, t0, t1).map((c) => c.map((p) => [p[0] + cx, p[1] + cy, 0])).flat(2));
            }
            return seg;
        };
        void k;
        const straight = (a, b) => {
            const h1 = toVec3(lerpVec(a, b, 1 / 3));
            const h2 = toVec3(lerpVec(a, b, 2 / 3));
            return [a, h1, h2, b];
        };
        const p = (x, y) => [x, y, 0];
        pts.push(...straight(p(-hw + r, -hh), p(hw - r, -hh)));
        pts.push(...corner(hw - r, -hh + r, -PI / 2).slice(1));
        pts.push(...straight(p(hw, -hh + r), p(hw, hh - r)).slice(1));
        pts.push(...corner(hw - r, hh - r, 0).slice(1));
        pts.push(...straight(p(hw - r, hh), p(-hw + r, hh)).slice(1));
        pts.push(...corner(-hw + r, hh - r, PI / 2).slice(1));
        pts.push(...straight(p(-hw, hh - r), p(-hw, -hh + r)).slice(1));
        pts.push(...corner(-hw + r, -hh + r, PI).slice(1));
        this.set_points(pts);
    }
}
// ---------------- Polygon family ----------------
export class Polygon extends VMobject {
    constructor(...vertices) {
        super({ fill_opacity: 0 });
        const pts = vertices.map((v) => toVec3(v));
        if (pts.length) {
            this.set_points_as_corners([...pts, pts[0]]);
        }
    }
}
export class Polygram extends Polygon {
    constructor(...vertices) {
        super(...vertices);
    }
}
export class RegularPolygon extends Polygon {
    constructor(opts = {}) {
        const n = opts.n ?? 6;
        const r = opts.radius ?? 1;
        const a0 = opts.start_angle ?? 0;
        const verts = [];
        for (let i = 0; i < n; i++) {
            const a = a0 + (i / n) * TAU;
            verts.push([r * Math.cos(a), r * Math.sin(a), 0]);
        }
        super(...verts);
        applyGeometryDefaults(this, opts);
    }
}
export class Triangle extends RegularPolygon {
    constructor(opts = {}) {
        super({ n: 3, radius: opts.radius ?? 2 / Math.sqrt(3), start_angle: -PI / 2, ...opts });
    }
}
export class Star extends Polygon {
    constructor(opts = {}) {
        const n = opts.n ?? 5;
        const R = opts.outer_radius ?? 1;
        const r = opts.inner_radius ?? 0.5;
        const a0 = opts.start_angle ?? -PI / 2;
        const verts = [];
        for (let i = 0; i < 2 * n; i++) {
            const rad = i % 2 === 0 ? R : r;
            const a = a0 + (i / (2 * n)) * TAU;
            verts.push([rad * Math.cos(a), rad * Math.sin(a), 0]);
        }
        super(...verts);
        applyGeometryDefaults(this, opts);
    }
}
export class CubicBezier extends VMobject {
    constructor(a, h1, h2, b, opts = {}) {
        super({});
        applyGeometryDefaults(this, opts);
        this.set_points([toVec3(a), toVec3(h1), toVec3(h2), toVec3(b)]);
    }
}
// ---------------- Angle ----------------
export class Angle extends VMobject {
    constructor(line1, line2, opts = {}) {
        super({});
        applyGeometryDefaults(this, opts);
        const r = opts.radius ?? 0.5;
        const inter = line1.get_start();
        const d1 = normalize(sub(line1.get_end(), line1.get_start()));
        const d2 = normalize(sub(line2.get_end(), line2.get_start()));
        const a1 = Math.atan2(d1[1], d1[0]);
        let a2 = Math.atan2(d2[1], d2[0]);
        let sweep = a2 - a1;
        while (sweep > PI)
            sweep -= TAU;
        while (sweep < -PI)
            sweep += TAU;
        if (opts.other_angle)
            sweep = sweep > 0 ? sweep - TAU : sweep + TAU;
        const arc = new Arc(r, { start_angle: a1, angle: sweep });
        arc.shift(inter);
        this.become(arc);
    }
}
export class RightAngle extends Angle {
    constructor(l1, l2, opts = {}) {
        super(l1, l2, opts);
        // replace arc with square corner
        const len = opts.length ?? 0.4;
        const inter = l1.get_start();
        const d1 = normalize(sub(l1.get_end(), l1.get_start()));
        const d2 = normalize(sub(l2.get_end(), l2.get_start()));
        const p1 = toVec3(add(inter, mulScalar(d1, len)));
        const p2 = toVec3(add(add(inter, mulScalar(d1, len)), mulScalar(d2, len)));
        const p3 = toVec3(add(inter, mulScalar(d2, len)));
        this.set_points_as_corners([p1, p2, p3]);
    }
}
export class TangentLine extends Line {
    constructor(mobject, alpha, opts = {}) {
        const point = mobject.point_from_proportion(alpha);
        // numerical tangent
        const e = 1e-3;
        const p1 = mobject.point_from_proportion(Math.max(0, alpha - e));
        const p2 = mobject.point_from_proportion(Math.min(1, alpha + e));
        const dir = normalize(sub(p2, p1));
        const len = (opts.length ?? 1) / 2;
        super(toVec3(sub(point, mulScalar(dir, len))), toVec3(add(point, mulScalar(dir, len))), opts);
    }
}
// Convenience re-exports matching manim names
export { Line as LineSegment };
void UP;
void DOWN;
void angleOfVector;
//# sourceMappingURL=geometry.js.map