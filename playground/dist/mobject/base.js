// Mobject + VMobject + (V)Group — port of manim/mobject/{mobject,vectorized_mobject}.py
//
// Naming: every public method keeps its manim (snake_case) name AND gets a
// camelCase alias, so `mob.shift(UP)` and `mob.move_to(ORIGIN)` feel exactly
// like Python manim while remaining idiomatic TS.
import { ORIGIN } from "../constants.js";
import { add, sub, mulScalar, dot, cross, norm, normalize, dist, lerpVec, rotateVector, applyMatrix, interpolate, angleOfVector, } from "../utils/math.js";
import { ManimColor, parseColor, WHITE, BLACK } from "../utils/color.js";
let __uid = 0;
export function nextUid() {
    __uid += 1;
    return `m${__uid}_${Math.random().toString(36).slice(2, 8)}`;
}
export function toVec3(p) {
    return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0];
}
export function clonePoints(pts) {
    return pts.map((p) => [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0]);
}
/**
 * Reorder `pts` (cyclic shift) to best match `target` anchor-for-anchor,
 * minimizing total anchor distance — the manim `align_points` idea that keeps
 * morphs from swirling (e.g. circle 3-o'clock start vs square corner start).
 * Operates on cubic granularity when the layout allows; never mutates inputs.
 */
export function alignPointOrder(pts, target) {
    const n = pts.length;
    if (n !== target.length || n < 8)
        return pts.map((p) => [...p]);
    const cubic = n % 4 === 0;
    const unit = cubic ? 4 : 1;
    const m = n / unit;
    if (m < 2 || n > 400)
        return pts.map((p) => [...p]);
    const anchor = (arr, k) => arr[(k * unit) % n];
    let best = 0;
    let bestCost = Infinity;
    for (let s = 0; s < m; s++) {
        let cost = 0;
        for (let k = 0; k < m; k++) {
            const a = anchor(pts, (k + s) % m);
            const b = anchor(target, k);
            const dx = (a[0] ?? 0) - (b[0] ?? 0);
            const dy = (a[1] ?? 0) - (b[1] ?? 0);
            const dz = (a[2] ?? 0) - (b[2] ?? 0);
            cost += dx * dx + dy * dy + dz * dz;
            if (cost >= bestCost)
                break;
        }
        if (cost < bestCost) {
            bestCost = cost;
            best = s;
        }
    }
    if (best === 0)
        return pts.map((p) => [...p]);
    const off = best * unit;
    return [...pts.slice(off), ...pts.slice(0, off)].map((p) => [...p]);
}
export class Mobject {
    constructor(opts = {}, submobjects = []) {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "points", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "submobjects", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "updaters", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "updatingSuspended", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "dim", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 3
        });
        Object.defineProperty(this, "uuid", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: nextUid()
        });
        /** Target copy used by `.animate` / generate_target. */
        Object.defineProperty(this, "target", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        /** Saved state used by save_state / restore. */
        Object.defineProperty(this, "savedState", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        /** Arbitrary user data (e.g. labels). */
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        this.name = opts.name ?? this.constructor.name;
        if (submobjects.length)
            this.add(...submobjects);
        void opts;
    }
    // ---------- family ----------
    add(...mobjects) {
        for (const m of mobjects) {
            if (m === this)
                throw new Error("Cannot add Mobject to itself.");
            if (!this.submobjects.includes(m))
                this.submobjects.push(m);
        }
        return this;
    }
    remove(...mobjects) {
        this.submobjects = this.submobjects.filter((s) => !mobjects.includes(s));
        return this;
    }
    /** All descendants depth-first (not including self). */
    get submobjectFamily() {
        const out = [];
        const stack = [...this.submobjects];
        while (stack.length) {
            const m = stack.pop();
            out.push(m);
            stack.push(...m.submobjects);
        }
        return out;
    }
    get family() {
        return [this, ...this.submobjectFamily];
    }
    *iterFamily() {
        yield this;
        for (const s of this.submobjects)
            yield* s.iterFamily();
    }
    // ---------- updaters ----------
    add_updater(fn) {
        this.updaters.push(fn);
        return this;
    }
    addUpdater(fn) { return this.add_updater(fn); }
    remove_updater(fn) {
        this.updaters = this.updaters.filter((u) => u !== fn);
        return this;
    }
    removeUpdater(fn) { return this.remove_updater(fn); }
    clear_updaters() {
        this.updaters = [];
        return this;
    }
    clearUpdaters() { return this.clear_updaters(); }
    get_updaters() { return [...this.updaters]; }
    getUpdaters() { return this.get_updaters(); }
    has_updaters() { return this.updaters.length > 0; }
    suspend_updating() { this.updatingSuspended = true; return this; }
    resume_updating() { this.updatingSuspended = false; return this; }
    update(dt = 0) {
        if (this.updatingSuspended)
            return this;
        for (const u of [...this.updaters])
            u(this, dt);
        for (const s of this.submobjects)
            s.update(dt);
        return this;
    }
    // ---------- points ----------
    set_points(points) {
        this.points = clonePoints(points);
        return this;
    }
    setPoints(points) { return this.set_points(points); }
    get_points() { return clonePoints(this.points); }
    get_all_points() {
        const own = clonePoints(this.points);
        for (const s of this.submobjects)
            own.push(...s.get_all_points());
        return own;
    }
    getAllPoints() { return this.get_all_points(); }
    has_points() {
        if (this.points.length > 0)
            return true;
        return this.submobjects.some((s) => s.has_points());
    }
    hasPoints() { return this.has_points(); }
    clear_points() {
        this.points = [];
        return this;
    }
    add_points(points) {
        this.points.push(...clonePoints(points));
        return this;
    }
    /** Apply matrix to own points + children. */
    apply_matrix(matrix) {
        this.points = this.points.map((p) => toVec3(applyMatrix(matrix, p)));
        for (const s of this.submobjects)
            s.apply_matrix(matrix);
        return this;
    }
    applyMatrix(m) { return this.apply_matrix(m); }
    apply_function(fn) {
        this.points = this.points.map((p) => toVec3(fn(p)));
        for (const s of this.submobjects)
            s.apply_function(fn);
        return this;
    }
    applyFunction(fn) { return this.apply_function(fn); }
    apply_points_function(fn) {
        return this.apply_function(fn);
    }
    // ---------- transforms ----------
    shift(vector) {
        const v = toVec3(vector);
        this.points = this.points.map((p) => toVec3(add(p, v)));
        for (const s of this.submobjects)
            s.shift(v);
        return this;
    }
    scale(factor, about_point, about_edge) {
        const about = about_point
            ? toVec3(about_point)
            : about_edge
                ? this.get_edge_center(toVec3(about_edge))
                : this.get_center();
        this.points = this.points.map((p) => toVec3(add(about, mulScalar(sub(p, about), factor))));
        for (const s of this.submobjects)
            s.scale(factor, about);
        return this;
    }
    rotate(angle, axis = [0, 0, 1], about_point, about_edge) {
        const ax = toVec3(axis);
        const about = about_point
            ? toVec3(about_point)
            : about_edge
                ? this.get_edge_center(toVec3(about_edge))
                : this.get_center();
        this.points = this.points.map((p) => toVec3(add(about, rotateVector(toVec3(sub(p, about)), angle, ax))));
        for (const s of this.submobjects)
            s.rotate(angle, ax, about);
        return this;
    }
    flip(axis, about_point) {
        const ax = axis ? toVec3(axis) : [0, 1, 0];
        // flip = rotate PI about axis in XY... manim: flip(axis=UP) mirrors horizontally.
        // Implement as scale(-1) along perpendicular: simplest — rotate PI around axis.
        return this.rotate(Math.PI, ax, about_point ?? this.get_center());
    }
    stretch(factor, dim) {
        const c = this.get_center();
        this.points = this.points.map((p) => {
            const q = p.slice();
            q[dim] = c[dim] + (p[dim] - c[dim]) * factor;
            return q;
        });
        for (const s of this.submobjects)
            s.stretch(factor, dim);
        return this;
    }
    move_to(point_or_mobject, aligned_edge) {
        const target = point_or_mobject instanceof Mobject
            ? point_or_mobject.get_center()
            : toVec3(point_or_mobject);
        const cur = aligned_edge ? this.get_edge_center(toVec3(aligned_edge)) : this.get_center();
        return this.shift(sub(target, cur));
    }
    moveTo(p, e) { return this.move_to(p, e); }
    align_to(mobject_or_point, direction) {
        const dir = direction ? toVec3(direction) : [0, 1, 0];
        const target = mobject_or_point instanceof Mobject
            ? mobject_or_point.get_edge_center(dir)
            : toVec3(mobject_or_point);
        const cur = this.get_edge_center(dir);
        return this.shift(sub(target, cur));
    }
    alignTo(m, d) { return this.align_to(m, d); }
    next_to(mobject_or_point, direction = [1, 0, 0], buff = 0.25, aligned_edge, coor_mask) {
        const dir = normalize(toVec3(direction));
        const target = mobject_or_point instanceof Mobject
            ? mobject_or_point.get_center()
            : toVec3(mobject_or_point);
        const refEdge = mobject_or_point instanceof Mobject
            ? mobject_or_point.get_edge_center(dir)
            : target;
        const selfEdgeDir = toVec3(mulScalar(dir, -1));
        const selfEdge = this.get_edge_center(selfEdgeDir);
        let shiftVec = sub(add(refEdge, mulScalar(dir, buff)), selfEdge);
        if (coor_mask) {
            shiftVec = shiftVec.map((x, i) => (coor_mask[i] ? x : 0));
        }
        this.shift(shiftVec);
        if (aligned_edge) {
            const ae = toVec3(aligned_edge);
            // align perpendicular: project onto perpendicular plane
            const t2 = mobject_or_point instanceof Mobject
                ? mobject_or_point.get_edge_center(ae)
                : target;
            const c2 = this.get_edge_center(ae);
            const diff = sub(t2, c2);
            // remove component along dir
            const along = mulScalar(dir, dot(diff, dir));
            this.shift(sub(diff, along));
        }
        return this;
    }
    nextTo(m, d, b) {
        return this.next_to(m, d, b);
    }
    to_edge(direction, buff = 0.25, frame_width, frame_height) {
        // Manim frame: width 14.22, height 8 centered at origin.
        const FW = frame_width ?? 14.222222222222221;
        const FH = frame_height ?? 8.0;
        const dir = toVec3(direction);
        const sign = [Math.sign(dir[0]), Math.sign(dir[1]), 0];
        const frameEdge = [(FW / 2) * sign[0], (FH / 2) * sign[1], 0];
        if (sign[0] !== 0 && sign[1] !== 0) {
            // corner
            const corner = this.get_corner(toVec3([sign[0], sign[1], 0]));
            const target = [
                frameEdge[0] - sign[0] * buff,
                frameEdge[1] - sign[1] * buff,
                0,
            ];
            return this.shift(sub(target, corner));
        }
        const edge = this.get_edge_center(dir);
        const target = [
            sign[0] !== 0 ? frameEdge[0] - sign[0] * buff : edge[0],
            sign[1] !== 0 ? frameEdge[1] - sign[1] * buff : edge[1],
            0,
        ];
        return this.shift([target[0] - edge[0], target[1] - edge[1], 0]);
    }
    toEdge(d, b) { return this.to_edge(d, b); }
    to_corner(corner, buff = 0.25) {
        return this.to_edge(corner, buff);
    }
    toCorner(c, b) { return this.to_corner(c, b); }
    arrange(direction = [1, 0, 0], buff = 0.25, center = true) {
        if (this.submobjects.length === 0)
            return this;
        const dir = toVec3(direction);
        let cursor = null;
        for (const s of this.submobjects) {
            if (cursor === null) {
                // first stays; cursor = its edge
                cursor = s.get_edge_center(dir);
            }
            else {
                const selfEdge = s.get_edge_center(toVec3(mulScalar(dir, -1)));
                s.shift(add(sub(cursor, selfEdge), mulScalar(normalize(dir), buff)));
                cursor = s.get_edge_center(dir);
            }
        }
        if (center) {
            const c = this.get_center();
            this.shift(mulScalar(sub([0, 0, 0], c), 1));
        }
        return this;
    }
    // ---------- measurements ----------
    get_center() {
        const pts = this.get_all_points();
        if (pts.length === 0)
            return [0, 0, 0];
        let mn = [Infinity, Infinity, Infinity];
        let mx = [-Infinity, -Infinity, -Infinity];
        for (const p of pts) {
            for (let i = 0; i < 3; i++) {
                if (p[i] < mn[i])
                    mn[i] = p[i];
                if (p[i] > mx[i])
                    mx[i] = p[i];
            }
        }
        return [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
    }
    getCenter() { return this.get_center(); }
    get_bounds() {
        const pts = this.get_all_points();
        if (!pts.length)
            return { min: [0, 0, 0], max: [0, 0, 0] };
        const mn = [Infinity, Infinity, Infinity];
        const mx = [-Infinity, -Infinity, -Infinity];
        for (const p of pts)
            for (let i = 0; i < 3; i++) {
                if (p[i] < mn[i])
                    mn[i] = p[i];
                if (p[i] > mx[i])
                    mx[i] = p[i];
            }
        return { min: mn, max: mx };
    }
    get_edge_center(direction) {
        const dir = toVec3(direction);
        const { min, max } = this.get_bounds();
        const c = this.get_center();
        // For each axis with nonzero dir, snap to min/max; else center.
        const out = [c[0], c[1], c[2]];
        if (dir[0] > 0)
            out[0] = max[0];
        else if (dir[0] < 0)
            out[0] = min[0];
        if (dir[1] > 0)
            out[1] = max[1];
        else if (dir[1] < 0)
            out[1] = min[1];
        if (dir[2] > 0)
            out[2] = max[2];
        else if (dir[2] < 0)
            out[2] = min[2];
        return out;
    }
    getEdgeCenter(d) { return this.get_edge_center(d); }
    get_corner(direction) {
        const dir = toVec3(direction);
        const { min, max } = this.get_bounds();
        return [
            dir[0] > 0 ? max[0] : min[0],
            dir[1] > 0 ? max[1] : min[1],
            dir[2] > 0 ? max[2] : min[2],
        ];
    }
    getCorner(d) { return this.get_corner(d); }
    get_top() { return this.get_edge_center([0, 1, 0]); }
    get_bottom() { return this.get_edge_center([0, -1, 0]); }
    get_left() { return this.get_edge_center([-1, 0, 0]); }
    get_right() { return this.get_edge_center([1, 0, 0]); }
    getTop() { return this.get_top(); }
    getBottom() { return this.get_bottom(); }
    getLeft() { return this.get_left(); }
    getRight() { return this.get_right(); }
    get_width() {
        const { min, max } = this.get_bounds();
        return max[0] - min[0];
    }
    get_height() {
        const { min, max } = this.get_bounds();
        return max[1] - min[1];
    }
    get_depth() {
        const { min, max } = this.get_bounds();
        return max[2] - min[2];
    }
    getWidth() { return this.get_width(); }
    getHeight() { return this.get_height(); }
    set_width(w, stretch = false, about_point) {
        const cur = this.get_width() || 1;
        if (stretch)
            return this.stretch(w / cur, 0);
        return this.scale(w / cur, about_point);
    }
    set_height(h, stretch = false, about_point) {
        const cur = this.get_height() || 1;
        if (stretch)
            return this.stretch(h / cur, 1);
        return this.scale(h / cur, about_point);
    }
    setWidth(w) { return this.set_width(w); }
    setHeight(h) { return this.set_height(h); }
    get_x(dim = 0) { return this.get_center()[dim]; }
    set_x(x) {
        const c = this.get_center();
        return this.shift([x - c[0], 0, 0]);
    }
    set_y(y) {
        const c = this.get_center();
        return this.shift([0, y - c[1], 0]);
    }
    set_z(z) {
        const c = this.get_center();
        return this.shift([0, 0, z - c[2]]);
    }
    setX(x) { return this.set_x(x); }
    setY(y) { return this.set_y(y); }
    get_start() {
        const pts = this.get_all_points();
        return pts.length ? toVec3(pts[0]) : this.get_center();
    }
    get_end() {
        const pts = this.get_all_points();
        return pts.length ? toVec3(pts[pts.length - 1]) : this.get_center();
    }
    // ---------- target / state ----------
    generate_target() {
        this.target = this.copy();
        return this;
    }
    generateTarget() { return this.generate_target(); }
    move_to_target() {
        if (!this.target)
            throw new Error("No target generated. Call generate_target() first.");
        this.become(this.target);
        return this;
    }
    save_state() {
        this.savedState = {
            points: clonePoints(this.points),
            submobjects: this.submobjects.map((s) => s.copy()),
        };
        for (const s of this.submobjects)
            s.save_state();
        return this;
    }
    saveState() { return this.save_state(); }
    restore() {
        if (!this.savedState)
            throw new Error("No saved state. Call save_state() first.");
        this.points = clonePoints(this.savedState.points);
        this.submobjects = this.savedState.submobjects.map((s) => s.copy());
        return this;
    }
    /** Replace this mobject's data with another's (like manim's become). */
    become(other) {
        this.points = clonePoints(other.points);
        this.submobjects = other.submobjects.map((s) => s.copy());
        // copy style if both support it
        const a = this;
        const b = other;
        for (const k of ["fillColor", "fillOpacity", "strokeColor", "strokeOpacity", "strokeWidth", "sheenFactor", "backgroundStrokeColor", "backgroundStrokeOpacity", "backgroundStrokeWidth"]) {
            if (b[k] !== undefined) {
                const v = b[k];
                a[k] = v instanceof ManimColor ? v : Array.isArray(v) ? [...v] : v;
            }
        }
        if (typeof other.getStyleSnapshot === "function") {
            const snap = other.getStyleSnapshot();
            this.applyStyleSnapshot?.(snap);
        }
        this.updaters = [...other.updaters];
        return this;
    }
    match_points(other) {
        // Align point density with `other` so index-wise interpolation is
        // well-defined. Equal counts need no work (points stay as they are).
        const n = other.points.length;
        if (n === 0 || this.points.length === 0 || this.points.length === n) {
            return this;
        }
        // resample by linear interpolation over index
        const out = [];
        for (let i = 0; i < n; i++) {
            const t = n === 1 ? 0 : i / (n - 1);
            const f = t * (this.points.length - 1);
            const i0 = Math.floor(f);
            const i1 = Math.min(i0 + 1, this.points.length - 1);
            out.push(toVec3(lerpVec(this.points[i0], this.points[i1], f - i0)));
        }
        this.points = out;
        return this;
    }
    copy() {
        const Ctor = this.constructor;
        const c = Object.create(Object.getPrototypeOf(this));
        // deep copy fields
        c.name = this.name;
        c.points = clonePoints(this.points);
        c.submobjects = this.submobjects.map((s) => s.copy());
        c.updaters = [...this.updaters];
        c.updatingSuspended = this.updatingSuspended;
        c.dim = this.dim;
        c.uuid = nextUid();
        c.target = null;
        c.data = { ...this.data };
        void Ctor;
        // copy own enumerable props (style etc.)
        for (const k of Object.keys(this)) {
            if (["name", "points", "submobjects", "updaters", "target", "data", "savedState"].includes(k))
                continue;
            const v = this[k];
            if (v instanceof ManimColor)
                c[k] = v;
            else if (Array.isArray(v))
                c[k] = [...v];
            else if (v !== null && typeof v === "object") {
                try {
                    c[k] = JSON.parse(JSON.stringify(v));
                }
                catch {
                    c[k] = v;
                }
            }
            else
                c[k] = v;
        }
        return c;
    }
    deepcopy() { return this.copy(); }
    // ---------- animate builder ----------
    get animate() {
        return new AnimationBuilder(this);
    }
    // ---------- misc ----------
    get opacity() { return 1; }
    set_opacity(_o) { return this; }
    is_point_touching(_point, _buff = 0) { return false; }
    toString() {
        return `${this.constructor.name}(points=${this.points.length}, subs=${this.submobjects.length})`;
    }
}
// =====================================================================
// AnimationBuilder — `m.animate.shift(UP)` support
// =====================================================================
export class AnimationBuilder {
    constructor(mobject) {
        Object.defineProperty(this, "mobject", {
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
        Object.defineProperty(this, "__isAnimationBuilder", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "_runTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_rateFunc", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.mobject = mobject;
        this.target = mobject.copy();
        // Return a Proxy so ANY method call is forwarded to `target` and chained.
        return new Proxy(this, {
            get: (obj, prop, receiver) => {
                if (typeof prop === "string" && !(prop in obj)) {
                    const t = obj.target[prop];
                    if (typeof t === "function") {
                        return (...args) => {
                            t.apply(obj.target, args);
                            return receiver;
                        };
                    }
                }
                const v = obj[prop];
                return typeof v === "function" ? v.bind(obj) : v;
            },
        });
    }
    /** Set run_time for the built animation. */
    run_time(_rt) { this._runTime = _rt; return this; }
    runTime(rt) { return this.run_time(rt); }
    get runTimeValue() { return this._runTime; }
    get rateFuncValue() { return this._rateFunc; }
    /** Build a Transform-style animation mobject -> target. */
    build(opts = {}) {
        return new BuiltMethodAnimation(this.mobject, this.target, {
            run_time: opts.run_time ?? opts.runTime ?? this._runTime,
            rate_func: opts.rate_func ?? opts.rateFunc ?? this._rateFunc,
        });
    }
}
export function isAnimationBuilder(x) {
    return !!x && typeof x === "object" && x.__isAnimationBuilder === true;
}
/** Minimal Transform-like animation produced by `.animate` (avoids circular imports). */
export class BuiltMethodAnimation {
    constructor(m, target, opts = {}) {
        Object.defineProperty(this, "mobject", {
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
        Object.defineProperty(this, "startSnapshot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.mobject = m;
        this.target = target;
        this.run_time = opts.run_time ?? 1;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.rate_func = opts.rate_func ?? ((t) => 3 * t * t - 2 * t * t * t);
    }
    get runTime() { return this.run_time; }
    begin() {
        this.startSnapshot = this.mobject.copy();
        // align point counts so interpolation is well-defined
        this.startSnapshot.match_points(this.target);
    }
    interpolate(alpha) {
        if (!this.startSnapshot)
            return;
        const t = this.rate_func(alpha);
        const a = this.startSnapshot.points;
        const b = this.target.points;
        const n = Math.max(a.length, b.length);
        const out = [];
        for (let i = 0; i < n; i++) {
            const pa = a[Math.min(i, a.length - 1)] ?? [0, 0, 0];
            const pb = b[Math.min(i, b.length - 1)] ?? [0, 0, 0];
            out.push(toVec3(lerpVec(pa, pb, t)));
        }
        this.mobject.points = out;
        // children: simple cross-fade of counts
        if (this.target.submobjects.length) {
            while (this.mobject.submobjects.length < this.target.submobjects.length) {
                this.mobject.submobjects.push(this.target.submobjects[this.mobject.submobjects.length].copy());
            }
        }
    }
    finish() {
        this.mobject.become(this.target);
    }
    update_mobjects(dt) {
        this.mobject.update(dt);
    }
}
export class VMobject extends Mobject {
    constructor(opts = {}) {
        super(opts);
        Object.defineProperty(this, "fillColor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "fillOpacity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "strokeColor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: WHITE
        });
        Object.defineProperty(this, "strokeOpacity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "strokeWidth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 4
        });
        Object.defineProperty(this, "backgroundStrokeColor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: BLACK
        });
        Object.defineProperty(this, "backgroundStrokeOpacity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "backgroundStrokeWidth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "sheenFactor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "jointType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "round"
        });
        Object.defineProperty(this, "capStyle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "round"
        });
        if (opts.fill_color !== undefined)
            this.fillColor = parseColor(opts.fill_color);
        if (opts.fill_opacity !== undefined)
            this.fillOpacity = opts.fill_opacity;
        if (opts.stroke_color !== undefined)
            this.strokeColor = parseColor(opts.stroke_color);
        if (opts.stroke_opacity !== undefined)
            this.strokeOpacity = opts.stroke_opacity;
        if (opts.stroke_width !== undefined)
            this.strokeWidth = opts.stroke_width;
        if (opts.background_stroke_color !== undefined)
            this.backgroundStrokeColor = parseColor(opts.background_stroke_color);
        if (opts.background_stroke_opacity !== undefined)
            this.backgroundStrokeOpacity = opts.background_stroke_opacity;
        if (opts.background_stroke_width !== undefined)
            this.backgroundStrokeWidth = opts.background_stroke_width;
        if (opts.sheen_factor !== undefined)
            this.sheenFactor = opts.sheen_factor;
        if (opts.color !== undefined)
            this.set_color(opts.color, opts.opacity);
    }
    // ----- style -----
    set_fill(color, opacity) {
        if (color === null || color === undefined) {
            if (color === null) {
                this.fillColor = null;
                this.fillOpacity = 0;
            }
        }
        else {
            this.fillColor = parseColor(color);
        }
        if (opacity !== undefined)
            this.fillOpacity = opacity;
        else if (color !== undefined && color !== null)
            this.fillOpacity = 1;
        return this;
    }
    setFill(c, o) { return this.set_fill(c, o); }
    set_stroke(color, opacity, width, background = false) {
        if (background) {
            if (color === null)
                this.backgroundStrokeWidth = 0;
            else if (color !== undefined)
                this.backgroundStrokeColor = parseColor(color);
            if (opacity !== undefined)
                this.backgroundStrokeOpacity = opacity;
            if (width !== undefined)
                this.backgroundStrokeWidth = width;
            return this;
        }
        if (color === null) {
            this.strokeWidth = 0;
        }
        else if (color !== undefined)
            this.strokeColor = parseColor(color);
        if (opacity !== undefined)
            this.strokeOpacity = opacity;
        if (width !== undefined)
            this.strokeWidth = width;
        return this;
    }
    setStroke(c, o, w) { return this.set_stroke(c, o, w); }
    set_color(color, opacity) {
        this.set_fill(color, opacity ?? (this.fillOpacity || 1));
        this.set_stroke(color, opacity ?? this.strokeOpacity);
        return this;
    }
    setColor(c, o) { return this.set_color(c, o); }
    set_opacity(opacity) {
        this.fillOpacity = opacity;
        this.strokeOpacity = opacity;
        return this;
    }
    get_fill_color() { return this.fillColor; }
    get_stroke_color() { return this.strokeColor; }
    get_fill_opacity() { return this.fillOpacity; }
    get_stroke_opacity() { return this.strokeOpacity; }
    get_stroke_width() { return this.strokeWidth; }
    getStyleSnapshot() {
        return {
            fillColor: this.fillColor, fillOpacity: this.fillOpacity,
            strokeColor: this.strokeColor, strokeOpacity: this.strokeOpacity,
            strokeWidth: this.strokeWidth,
            backgroundStrokeColor: this.backgroundStrokeColor,
            backgroundStrokeOpacity: this.backgroundStrokeOpacity,
            backgroundStrokeWidth: this.backgroundStrokeWidth,
        };
    }
    applyStyleSnapshot(s) {
        const r = s;
        if (!r)
            return;
        if ("fillColor" in r)
            this.fillColor = r.fillColor;
        if ("fillOpacity" in r)
            this.fillOpacity = r.fillOpacity;
        if ("strokeColor" in r)
            this.strokeColor = r.strokeColor;
        if ("strokeOpacity" in r)
            this.strokeOpacity = r.strokeOpacity;
        if ("strokeWidth" in r)
            this.strokeWidth = r.strokeWidth;
    }
    set_sheen(factor, _direction, _family = true) {
        this.sheenFactor = factor;
        return this;
    }
    set_joint_type(joint) { this.jointType = joint; return this; }
    set_cap_style(cap) { this.capStyle = cap; return this; }
    set_background_stroke(color, opacity, width) {
        return this.set_stroke(color, opacity, width, true);
    }
    // ----- points -----
    set_points_as_corners(points) {
        // Convert corner list to cubic beziers with straight handles.
        if (points.length < 2) {
            this.points = clonePoints(points);
            return this;
        }
        const curves = [];
        for (let i = 0; i < points.length - 1; i++) {
            const a = toVec3(points[i]);
            const b = toVec3(points[i + 1]);
            const h1 = toVec3(add(mulScalar(a, 2 / 3), mulScalar(b, 1 / 3)));
            const h2 = toVec3(add(mulScalar(a, 1 / 3), mulScalar(b, 2 / 3)));
            curves.push(a, h1, h2, b);
        }
        this.points = curves;
        return this;
    }
    setPointsAsCorners(p) { return this.set_points_as_corners(p); }
    set_points_smoothly(points) {
        // Catmull-Rom -> bezier conversion for smooth curve through points.
        if (points.length < 3)
            return this.set_points_as_corners(points);
        const P = points.map(toVec3);
        const curves = [];
        for (let i = 0; i < P.length - 1; i++) {
            const p0 = P[Math.max(0, i - 1)];
            const p1 = P[i];
            const p2 = P[i + 1];
            const p3 = P[Math.min(P.length - 1, i + 2)];
            const c1 = toVec3(add(p1, mulScalar(sub(p2, p0), 1 / 6)));
            const c2 = toVec3(sub(p2, mulScalar(sub(p3, p1), 1 / 6)));
            curves.push(p1, c1, c2, p2);
        }
        this.points = curves;
        return this;
    }
    add_line_to(point) {
        const p = toVec3(point);
        if (this.points.length === 0) {
            this.points = [p];
            return this;
        }
        const last = toVec3(this.points[this.points.length - 1]);
        const h1 = toVec3(add(mulScalar(last, 2 / 3), mulScalar(p, 1 / 3)));
        const h2 = toVec3(add(mulScalar(last, 1 / 3), mulScalar(p, 2 / 3)));
        this.points.push(h1, h2, p);
        // normalize to 4-per-cubic layout when starting from single anchor:
        if (this.points.length === 4)
            return this;
        return this;
    }
    addLineTo(p) { return this.add_line_to(p); }
    add_curve_to(...points) {
        // add_curve_to(handle1, handle2, anchor)
        const pts = points.map((p) => toVec3(p));
        if (this.points.length === 0 && pts.length === 3) {
            // need a start anchor — use first handle's reflection? Use origin.
            this.points = [toVec3(ORIGIN)];
        }
        this.points.push(...pts);
        return this;
    }
    start_new_path(point) {
        // Begin a disconnected subpath (manim parity: no connecting line).
        // Encoded as a pen-up separator the renderer skips. 4-per-cubic chains
        // are first converted losslessly to shared-anchor stride (dropping exact
        // duplicate junction anchors), then the separator is 3 points
        // [last ×2, point], keeping every array stride-clean for chunking.
        const p = toVec3(point);
        if (!this.points.length) {
            this.points.push(p, toVec3(p), toVec3(p), toVec3(p));
            return this;
        }
        const last = toVec3(this.points[this.points.length - 1]);
        if (dist(last, p) < 1e-12)
            return this;
        const n = this.points.length;
        let fourClean = n % 4 === 0;
        if (fourClean) {
            for (let i = 0; i + 4 < n; i += 4) {
                if (dist(this.points[i + 3], this.points[i + 4]) > 1e-6) {
                    fourClean = false;
                    break;
                }
            }
        }
        if (fourClean) {
            // Lossless 4-per → stride conversion (drop exact duplicate anchors).
            const conv = this.points.slice(0, 4).map((q) => [...q]);
            let exact = true;
            for (let i = 4; i < n; i += 4) {
                if (dist(this.points[i], this.points[i - 1]) > 1e-9) {
                    exact = false;
                    break;
                }
                conv.push([...this.points[i + 1]], [...this.points[i + 2]], [...this.points[i + 3]]);
            }
            if (exact)
                this.points = conv;
            else {
                // Mixed chain: 4-wide separator (greedy chunking copes).
                const l = toVec3(last);
                this.points.push(l, toVec3(l), toVec3(l), p);
                return this;
            }
        }
        const l = toVec3(this.points[this.points.length - 1]);
        this.points.push(l, toVec3(l), p);
        return this;
    }
    /** Cubic tuples honoring both 4-per-cubic and shared-anchor layouts. */
    get_cubic_tuples() {
        const pts = this.points;
        if (pts.length < 4)
            return [];
        if (pts.length % 4 === 0) {
            const out = [];
            for (let i = 0; i + 3 < pts.length; i += 4)
                out.push([pts[i], pts[i + 1], pts[i + 2], pts[i + 3]]);
            return out;
        }
        // shared-anchor chain: 3n+1
        const out = [];
        for (let i = 0; i + 3 < pts.length; i += 3)
            out.push([pts[i], pts[i + 1], pts[i + 2], pts[i + 3]]);
        return out;
    }
    getCubicTuples() { return this.get_cubic_tuples(); }
    get_num_curves() { return this.get_cubic_tuples().length; }
    get_start_anchors() {
        return this.get_cubic_tuples().map((c) => c[0]);
    }
    get_end_anchors() {
        return this.get_cubic_tuples().map((c) => c[3]);
    }
    /** Point at path-length parameter t in [0,1] (arc-length approx by sampling). */
    point_from_proportion(t) {
        const tuples = this.get_cubic_tuples();
        if (!tuples.length)
            return this.get_center();
        // cumulative lengths
        const lens = tuples.map((c) => {
            let L = 0;
            let prev = c[0];
            for (let i = 1; i <= 8; i++) {
                const tt = i / 8;
                const mt = 1 - tt;
                const p = [
                    mt ** 3 * c[0][0] + 3 * mt * mt * tt * c[1][0] + 3 * mt * tt * tt * c[2][0] + tt ** 3 * c[3][0],
                    mt ** 3 * c[0][1] + 3 * mt * mt * tt * c[1][1] + 3 * mt * tt * tt * c[2][1] + tt ** 3 * c[3][1],
                    mt ** 3 * c[0][2] + 3 * mt * mt * tt * c[1][2] + 3 * mt * tt * tt * c[2][2] + tt ** 3 * c[3][2],
                ];
                L += dist(prev, p);
                prev = p;
            }
            return L;
        });
        const total = lens.reduce((a, b) => a + b, 0) || 1;
        let target = t * total;
        for (let i = 0; i < tuples.length; i++) {
            if (target <= lens[i] || i === tuples.length - 1) {
                const c = tuples[i];
                const lt = lens[i] === 0 ? 0 : target / lens[i];
                const tt = Math.min(1, Math.max(0, lt));
                const mt = 1 - tt;
                return [
                    mt ** 3 * c[0][0] + 3 * mt * mt * tt * c[1][0] + 3 * mt * tt * tt * c[2][0] + tt ** 3 * c[3][0],
                    mt ** 3 * c[0][1] + 3 * mt * mt * tt * c[1][1] + 3 * mt * tt * tt * c[2][1] + tt ** 3 * c[3][1],
                    mt ** 3 * c[0][2] + 3 * mt * mt * tt * c[1][2] + 3 * mt * tt * tt * c[2][2] + tt ** 3 * c[3][2],
                ];
            }
            target -= lens[i];
        }
        return toVec3(tuples[tuples.length - 1][3]);
    }
    pointFromProportion(t) { return this.point_from_proportion(t); }
    get_arc_length(samplePerCurve = 16) {
        let L = 0;
        for (const c of this.get_cubic_tuples()) {
            let prev = c[0];
            for (let i = 1; i <= samplePerCurve; i++) {
                const tt = i / samplePerCurve;
                const mt = 1 - tt;
                const p = [
                    mt ** 3 * c[0][0] + 3 * mt * mt * tt * c[1][0] + 3 * mt * tt * tt * c[2][0] + tt ** 3 * c[3][0],
                    mt ** 3 * c[0][1] + 3 * mt * mt * tt * c[1][1] + 3 * mt * tt * tt * c[2][1] + tt ** 3 * c[3][1],
                    mt ** 3 * c[0][2] + 3 * mt * mt * tt * c[1][2] + 3 * mt * tt * tt * c[2][2] + tt ** 3 * c[3][2],
                ];
                L += dist(prev, p);
                prev = p;
            }
        }
        return L;
    }
    // bounding utilities use anchors (already covered by base via all points incl. handles — fine)
    // fade sugar (also used by FadeIn/FadeOut but handy directly)
    fade(opacity, family = true) {
        this.fillOpacity *= opacity;
        this.strokeOpacity *= opacity;
        if (family)
            for (const s of this.submobjects)
                s.fade?.(opacity, true);
        return this;
    }
    match_style(other) {
        this.fillColor = other.fillColor;
        this.fillOpacity = other.fillOpacity;
        this.strokeColor = other.strokeColor;
        this.strokeOpacity = other.strokeOpacity;
        this.strokeWidth = other.strokeWidth;
        this.backgroundStrokeColor = other.backgroundStrokeColor;
        this.backgroundStrokeOpacity = other.backgroundStrokeOpacity;
        this.backgroundStrokeWidth = other.backgroundStrokeWidth;
        return this;
    }
    matchStyle(o) { return this.match_style(o); }
}
// =====================================================================
// Groups
// =====================================================================
export class Group extends Mobject {
    constructor(...mobjects) {
        super();
        if (mobjects.length)
            this.add(...mobjects);
    }
}
export class VGroup extends VMobject {
    constructor(...mobjects) {
        super();
        // VGroup itself has no points; children carry geometry.
        this.points = [];
        if (mobjects.length)
            this.add(...mobjects);
    }
    add(...mobjects) {
        super.add(...mobjects);
        return this;
    }
    /** Arrange children in a grid (manim parity). */
    arrange_in_grid(rows, cols, buff = 0.25, ..._rest) {
        void _rest;
        const n = this.submobjects.length;
        if (!n)
            return this;
        const c = cols ?? Math.ceil(Math.sqrt(n));
        const r = rows ?? Math.ceil(n / c);
        // compute max cell size
        let maxW = 0;
        let maxH = 0;
        for (const m of this.submobjects) {
            maxW = Math.max(maxW, m.get_width() || 1);
            maxH = Math.max(maxH, m.get_height() || 1);
        }
        this.submobjects.forEach((m, i) => {
            const row = Math.floor(i / c);
            const col = i % c;
            const x = (col - (c - 1) / 2) * (maxW + buff);
            const y = ((r - 1) / 2 - row) * (maxH + buff);
            m.move_to([x, y, 0]);
        });
        return this;
    }
    arrangeInGrid(r, c, b) {
        return this.arrange_in_grid(r, c, b);
    }
}
export class VDict extends VMobject {
    constructor(pairs) {
        super();
        Object.defineProperty(this, "keys", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        if (pairs) {
            if (Array.isArray(pairs))
                for (const [k, v] of pairs)
                    this.add_key_value_pair(k, v);
            else
                for (const [k, v] of Object.entries(pairs))
                    this.add_key_value_pair(k, v);
        }
    }
    add_key_value_pair(key, value) {
        if (this.keys.includes(key))
            this.remove_key(key);
        this.keys.push(key);
        this.add(value);
        return this;
    }
    remove_key(key) {
        const i = this.keys.indexOf(key);
        if (i >= 0) {
            this.keys.splice(i, 1);
            const sub = this.submobjects[i];
            if (sub)
                this.remove(sub);
        }
        return this;
    }
    get(key) {
        const i = this.keys.indexOf(key);
        return i >= 0 ? this.submobjects[i] : undefined;
    }
}
// Re-export color helpers commonly accessed via mobjects
export { ManimColor as Color };
void dot;
void cross;
void norm;
void normalize;
void dist;
void angleOfVector;
void interpolate;
void WHITE;
void BLACK;
//# sourceMappingURL=base.js.map