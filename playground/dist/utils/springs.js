// Spring / physics easings — a manim-ts exclusive (Python Manim only ships
// fixed easings). Usable anywhere a `rate_func` is accepted; overshoot works
// because mobject interpolation extrapolates past the target.
/** Damped-harmonic-oscillator easing. Overshoots past 1, then settles. */
export function spring(t, opts = {}) {
    const k = opts.stiffness ?? 120;
    const c = opts.damping ?? 12;
    if (t <= 0)
        return 0;
    if (t >= 1)
        return settledSpring(1, k, c);
    return settledSpring(t, k, c);
}
function settledSpring(t, k, c) {
    const w = Math.sqrt(Math.max(1e-9, k));
    const zeta = c / (2 * w);
    if (zeta >= 1) {
        // Critically damped (and near-enough for overdamped): smooth approach.
        return 1 - Math.exp(-w * t) * (1 + w * t);
    }
    const wd = w * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * w * t);
    return (1 -
        envelope * (Math.cos(wd * t) + ((zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t))));
}
/** Gentle spring: slight overshoot, quick settle. */
export function springGentle(t) {
    return spring(t, { stiffness: 170, damping: 26 });
}
/** Wobbly spring: big overshoot, several oscillations. */
export function springWobbly(t) {
    return spring(t, { stiffness: 90, damping: 6 });
}
/** Stiff spring: fast, minimal overshoot. */
export function springStiff(t) {
    return spring(t, { stiffness: 300, damping: 30 });
}
/** Classic bounce-out easing (stays within [0, 1]). */
export function bounce(t) {
    if (t <= 0)
        return 0;
    if (t >= 1)
        return 1;
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1)
        return n1 * t * t;
    if (t < 2 / d1)
        return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1)
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
}
/** Alias with Manim-style snake_case. */
export const bounce_out = bounce;
/** Elastic snap easing (overshoots, then settles). */
export function elastic(t, opts = {}) {
    const a = opts.amplitude ?? 1;
    const p = opts.period ?? 0.4;
    if (t <= 0)
        return 0;
    if (t >= 1)
        return 1;
    const s = (p / (2 * Math.PI)) * Math.asin(Math.min(1, 1 / a));
    return a * Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
}
/** Back-out easing: slight anticipation overshoot. */
export function backOut(t, overshoot = 1.70158) {
    if (t <= 0)
        return 0;
    if (t >= 1)
        return 1;
    const u = t - 1;
    return 1 + (overshoot + 1) * u * u * u + overshoot * u * u;
}
export const back_out = backOut;
//# sourceMappingURL=springs.js.map