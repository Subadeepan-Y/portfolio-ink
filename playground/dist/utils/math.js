// ---------- vectors ----------
export function vec(...xs) {
    return xs.slice();
}
export function add(a, b) {
    const n = Math.max(a.length, b.length);
    const out = new Array(n).fill(0);
    for (let i = 0; i < n; i++)
        out[i] = (a[i] ?? 0) + (b[i] ?? 0);
    return out;
}
export function sub(a, b) {
    const n = Math.max(a.length, b.length);
    const out = new Array(n).fill(0);
    for (let i = 0; i < n; i++)
        out[i] = (a[i] ?? 0) - (b[i] ?? 0);
    return out;
}
export function mulScalar(v, s) {
    return v.map((x) => x * s);
}
export function divScalar(v, s) {
    return v.map((x) => x / s);
}
export function dot(a, b) {
    let s = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++)
        s += a[i] * b[i];
    return s;
}
export function cross(a, b) {
    const [a1, a2, a3] = [a[0] ?? 0, a[1] ?? 0, a[2] ?? 0];
    const [b1, b2, b3] = [b[0] ?? 0, b[1] ?? 0, b[2] ?? 0];
    return [a2 * b3 - a3 * b2, a3 * b1 - a1 * b3, a1 * b2 - a2 * b1];
}
export function norm(v) {
    return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}
export function normalize(v) {
    const n = norm(v);
    if (n === 0)
        return v.map(() => 0);
    return v.map((x) => x / n);
}
export function dist(a, b) {
    return norm(sub(a, b));
}
export function lerpVec(a, b, t) {
    return a.map((x, i) => x + ((b[i] ?? 0) - x) * t);
}
export function angleBetween(a, b) {
    const na = norm(a);
    const nb = norm(b);
    if (na === 0 || nb === 0)
        return 0;
    const c = Math.min(1, Math.max(-1, dot(a, b) / (na * nb)));
    return Math.acos(c);
}
export function rotateVector(v, angle, axis = [0, 0, 1]) {
    // Rodrigues' rotation formula
    const k = normalize(axis);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dotKV = dot(k, v);
    const cr = cross(k, v);
    return [
        v[0] * cos + cr[0] * sin + k[0] * dotKV * (1 - cos),
        v[1] * cos + cr[1] * sin + k[1] * dotKV * (1 - cos),
        v[2] * cos + cr[2] * sin + k[2] * dotKV * (1 - cos),
    ];
}
export function rotationMatrix(angle, axis) {
    const [x, y, z] = normalize(axis);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const t = 1 - c;
    return [
        [t * x * x + c, t * x * y - s * z, t * x * z + s * y],
        [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
        [t * x * z - s * y, t * y * z + s * x, t * z * z + c],
    ];
}
export function applyMatrix(m, v) {
    return m.map((row) => row.reduce((s, mij, j) => s + mij * (v[j] ?? 0), 0));
}
// ---------- interpolation ----------
export function interpolate(start, end, alpha) {
    return start + (end - start) * alpha;
}
export function integerInterpolate(start, end, alpha) {
    // port of manim.utils.interpolation.integer_interpolate
    const range = end - start + 1;
    const raw = alpha * range;
    const value = Math.floor(raw);
    const residue = raw - value;
    return [Math.min(value + start, end), residue];
}
export function listInterpolate(a, b, t) {
    return lerpVec(a, b, t);
}
export function mid(a, b) {
    return lerpVec(a, b, 0.5);
}
export function inverseInterpolate(start, end, value) {
    if (end === start)
        return 0;
    return (value - start) / (end - start);
}
// ---------- bezier ----------
export function bezier(points) {
    // De Casteljau for arbitrary degree. points: array of control points.
    const n = points.length - 1;
    const binom = (nn, k) => {
        let r = 1;
        for (let i = 1; i <= k; i++)
            r = (r * (nn - k + i)) / i;
        return r;
    };
    return (t) => {
        const dim = points[0].length;
        const out = new Array(dim).fill(0);
        for (let k = 0; k <= n; k++) {
            const b = binom(n, k) * Math.pow(1 - t, n - k) * Math.pow(t, k);
            for (let d = 0; d < dim; d++)
                out[d] += b * points[k][d];
        }
        return out;
    };
}
export function partialBezierPoints(points, a, b) {
    // port of manim.utils.bezier.partial_bezier_points — cubic only fast path + general
    if (a === 0 && b === 1)
        return points.map((p) => p.slice());
    // Use de Casteljau subdivision via sampling matrix approach:
    // General method: split at b then at a/b.
    const split = (pts, t) => {
        // returns [left, right]
        const n = pts.length;
        const tri = [pts.map((p) => p.slice())];
        for (let r = 1; r < n; r++) {
            const prev = tri[r - 1];
            const cur = [];
            for (let i = 0; i < n - r; i++)
                cur.push(lerpVec(prev[i], prev[i + 1], t));
            tri.push(cur);
        }
        const left = tri.map((row) => row[0]);
        const right = [];
        for (let r = n - 1; r >= 0; r--)
            right.push(tri[r][tri[r].length - 1]);
        return [left, right];
    };
    const [, right0] = a === 0 ? [null, points] : split(points, a);
    const base = a === 0 ? points : right0;
    // re-parameterize: need segment [0, (b-a)/(1-a)] of base
    const t2 = (b - a) / (1 - a);
    if (t2 >= 1)
        return base.map((p) => p.slice());
    const [left] = split(base, t2);
    return left;
}
export function bezierLength(points, samples = 32) {
    let len = 0;
    let prev = bezier(points)(0);
    for (let i = 1; i <= samples; i++) {
        const p = bezier(points)(i / samples);
        len += dist(prev, p);
        prev = p;
    }
    return len;
}
export function pointOnBezier(points, t) {
    return bezier(points)(t);
}
export const linear = (t) => t;
export const smooth = (t) => 3 * t * t - 2 * t * t * t; // smoothstep
export const smoother = (t) => 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3;
export const rush_into = (t) => 2 * t * t * smooth(t * 0.5 + 0.5) + t * (1 - t);
export function rushInto(t) { return rush_into(t); }
export const rush_from = (t) => 1 - rush_into(1 - t);
export const slow_into = (t) => Math.sqrt(1 - (1 - t) * (1 - t));
export const double_smooth = (t) => smooth(smooth(t));
export const there_and_back = (t) => (t < 0.5 ? smooth(t * 2) : 1 - smooth((t - 0.5) * 2));
export const there_and_back_with_pause = (t) => t < 1 / 3 ? smooth(t * 3) : t > 2 / 3 ? 1 - smooth((t - 2 / 3) * 3) : 1;
export const running_start = (t) => { void t; return smoother(t); };
export const wiggle = (t) => there_and_back(t) * Math.sin(5 * Math.PI * t);
export const squish_rate_func = (func, a = 0.4, b = 0.6) => {
    return (t) => {
        if (t < a)
            return func(0);
        if (t > b)
            return func(1);
        return func((t - a) / (b - a));
    };
};
export const lingering = (t) => squish_rate_func(smooth, 0, 0.8)(t);
export const ease_in_sine = (t) => 1 - Math.cos((t * Math.PI) / 2);
export const ease_out_sine = (t) => Math.sin((t * Math.PI) / 2);
export const ease_in_out_sine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const ease_in_quad = (t) => t * t;
export const ease_out_quad = (t) => 1 - (1 - t) * (1 - t);
export const ease_in_out_quad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const ease_in_cubic = (t) => t * t * t;
export const ease_out_cubic = (t) => 1 - Math.pow(1 - t, 3);
export const ease_in_out_cubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const ease_in_expo = (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10));
export const ease_out_expo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const ease_in_out_expo = (t) => {
    if (t === 0 || t === 1)
        return t;
    return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
};
// camelCase aliases (JS-idiomatic)
export const easeInSine = ease_in_sine;
export const easeOutSine = ease_out_sine;
export const easeInOutSine = ease_in_out_sine;
export const thereAndBack = there_and_back;
export const rushFrom = rush_from;
export const slowInto = slow_into;
export const doubleSmooth = double_smooth;
export const straight_path = (a, b, t) => lerpVec(a, b, t);
export const clockwise_path = (a, b, t) => {
    // rotate around origin halfway — simplified: slerp in XY plane
    const angle = Math.atan2(a[1] ?? 0, a[0] ?? 0);
    const angle2 = Math.atan2(b[1] ?? 0, b[0] ?? 0);
    let d = angle2 - angle;
    while (d > Math.PI)
        d -= 2 * Math.PI;
    while (d < -Math.PI)
        d += 2 * Math.PI;
    if (d > 0)
        d -= 2 * Math.PI; // force clockwise
    const r = interpolate(norm(a.slice(0, 2)), norm(b.slice(0, 2)), t);
    const th = angle + d * t;
    return [r * Math.cos(th), r * Math.sin(th), interpolate(a[2] ?? 0, b[2] ?? 0, t)];
};
export const counterclockwise_path = (a, b, t) => {
    const angle = Math.atan2(a[1] ?? 0, a[0] ?? 0);
    const angle2 = Math.atan2(b[1] ?? 0, b[0] ?? 0);
    let d = angle2 - angle;
    while (d > Math.PI)
        d -= 2 * Math.PI;
    while (d < -Math.PI)
        d += 2 * Math.PI;
    if (d < 0)
        d += 2 * Math.PI; // force ccw
    const r = interpolate(norm(a.slice(0, 2)), norm(b.slice(0, 2)), t);
    const th = angle + d * t;
    return [r * Math.cos(th), r * Math.sin(th), interpolate(a[2] ?? 0, b[2] ?? 0, t)];
};
export const spiral_path = (angle = (5 * Math.PI) / 4) => {
    return (a, b, t) => {
        const ccw = counterclockwise_path(a, b, t);
        const spiral = Math.sin(angle * t) * (1 - t);
        // push outward perpendicular — simplified
        return [ccw[0] + spiral * 0.0, ccw[1], ccw[2] ?? 0];
    };
};
export const clockwisePath = clockwise_path;
export const counterclockwisePath = counterclockwise_path;
export const straightPath = straight_path;
// ---------- space ops ----------
export function shoelace(vertices) {
    // signed area of polygon in XY
    let s = 0;
    for (let i = 0; i < vertices.length; i++) {
        const [x1, y1] = vertices[i];
        const [x2, y2] = vertices[(i + 1) % vertices.length];
        s += x1 * y2 - x2 * y1;
    }
    return s / 2;
}
export function isClockwise(points) {
    return shoelace(points) < 0;
}
export function compassToVector(dir) {
    const m = {
        UP: [0, 1, 0], DOWN: [0, -1, 0], LEFT: [-1, 0, 0], RIGHT: [1, 0, 0],
        UL: [-1, 1, 0], UR: [1, 1, 0], DL: [-1, -1, 0], DR: [1, -1, 0],
    };
    const v = m[dir.toUpperCase()];
    if (!v)
        throw new Error(`Unknown compass direction: ${dir}`);
    return v;
}
export function angleOfVector(v) {
    return Math.atan2(v[1] ?? 0, v[0] ?? 0);
}
export function normalizeAngle(a) {
    while (a > Math.PI)
        a -= 2 * Math.PI;
    while (a <= -Math.PI)
        a += 2 * Math.PI;
    return a;
}
//# sourceMappingURL=math.js.map