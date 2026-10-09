// Color system — port of manim/utils/color.py (ManimColor + palette)
// Supports hex / rgb / rgba / named colors, opacity, gradients, interpolation.
function clamp01(x) {
    return Math.min(1, Math.max(0, x));
}
export function hexToRgb(hex) {
    let h = hex.trim().replace(/^#/, "");
    if (h.length === 3)
        h = h.split("").map((c) => c + c).join("");
    if (h.length !== 6)
        throw new Error(`Invalid hex color: ${hex}`);
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    return [r, g, b];
}
export function rgbToHex(rgb) {
    const [r, g, b] = rgb;
    const to = (x) => Math.round(clamp01(x) * 255).toString(16).padStart(2, "0");
    return `#${to(r)}${to(g)}${to(b)}`;
}
export function rgbToHsl([r, g, b]) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min)
        return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r)
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g)
        h = ((b - r) / d + 2) / 6;
    else
        h = ((r - g) / d + 4) / 6;
    return [h, s, l];
}
export function hslToRgb([h, s, l]) {
    const hue2rgb = (p, q, t) => {
        if (t < 0)
            t += 1;
        if (t > 1)
            t -= 1;
        if (t < 1 / 6)
            return p + (q - p) * 6 * t;
        if (t < 1 / 2)
            return q;
        if (t < 2 / 3)
            return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    if (s === 0)
        return [l, l, l];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}
const NAMED = {
    white: "#ECEFF1", black: "#000000", red: "#FC6255", green: "#83C167",
    blue: "#58C4DD", yellow: "#FFFF00", orange: "#FF862F", pink: "#D382C7",
    purple: "#9A72AC", teal: "#31918C",
    gold: "#E8C547", maroon: "#914546", gray: "#888888", grey: "#888888",
};
export class ManimColor {
    constructor(rgb, alpha = 1) {
        Object.defineProperty(this, "rgb", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "alpha", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.rgb = [clamp01(rgb[0]), clamp01(rgb[1]), clamp01(rgb[2])];
        this.alpha = clamp01(alpha);
    }
    static from(value, alpha) {
        if (value instanceof ManimColor) {
            return alpha === undefined ? value : new ManimColor(value.rgb, alpha);
        }
        if (Array.isArray(value)) {
            if (value.length === 4)
                return new ManimColor([value[0], value[1], value[2]], value[3]);
            return new ManimColor([value[0] ?? 0, value[1] ?? 0, value[2] ?? 0], alpha ?? 1);
        }
        const s = String(value).trim();
        const lower = s.toLowerCase();
        if (NAMED[lower])
            return ManimColor.from(NAMED[lower], alpha);
        if (s.startsWith("#"))
            return new ManimColor(hexToRgb(s), alpha ?? 1);
        const rgbMatch = s.match(/rgba?\(([^)]+)\)/i);
        if (rgbMatch) {
            const parts = rgbMatch[1].split(",").map((x) => parseFloat(x.trim()));
            const scale = parts.slice(0, 3).some((x) => x > 1) ? 255 : 1;
            return new ManimColor([parts[0] / scale, parts[1] / scale, parts[2] / scale], parts[3] ?? alpha ?? 1);
        }
        throw new Error(`Cannot parse color: ${value}`);
    }
    static fromHex(hex, alpha = 1) {
        return new ManimColor(hexToRgb(hex), alpha);
    }
    toHex() {
        return rgbToHex(this.rgb);
    }
    toCss(alpha) {
        const [r, g, b] = this.rgb.map((x) => Math.round(clamp01(x) * 255));
        const a = alpha ?? this.alpha;
        if (a >= 1)
            return `rgb(${r}, ${g}, ${b})`;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    /** Canvas fill/stroke style string honoring an overriding opacity. */
    toStyle(opacity = 1) {
        return this.toCss(this.alpha * opacity);
    }
    withAlpha(a) {
        return new ManimColor(this.rgb, a);
    }
    interpolate(other, t) {
        const rgb = [
            this.rgb[0] + (other.rgb[0] - this.rgb[0]) * t,
            this.rgb[1] + (other.rgb[1] - this.rgb[1]) * t,
            this.rgb[2] + (other.rgb[2] - this.rgb[2]) * t,
        ];
        return new ManimColor(rgb, this.alpha + (other.alpha - this.alpha) * t);
    }
    /** Shift hue/lightness like manim's `shift` — minimal port. */
    shift(hue = 0, saturation = 0, lightness = 0) {
        const [h, s, l] = rgbToHsl(this.rgb);
        const rgb = hslToRgb([
            (h + hue) % 1,
            clamp01(s + saturation),
            clamp01(l + lightness),
        ]);
        return new ManimColor(rgb, this.alpha);
    }
    equals(other, eps = 1e-6) {
        return (Math.abs(this.rgb[0] - other.rgb[0]) < eps &&
            Math.abs(this.rgb[1] - other.rgb[1]) < eps &&
            Math.abs(this.rgb[2] - other.rgb[2]) < eps &&
            Math.abs(this.alpha - other.alpha) < eps);
    }
}
// Palette — Manim CE defaults (subset, hex-accurate for the most-used)
export const WHITE = ManimColor.fromHex("#ECEFF1");
export const BLACK = ManimColor.fromHex("#000000");
export const RED = ManimColor.fromHex("#FC6255");
export const RED_A = ManimColor.fromHex("#C55A4B");
export const RED_B = ManimColor.fromHex("#9A3B31");
export const RED_C = ManimColor.fromHex("#64302A");
export const RED_D = ManimColor.fromHex("#46211E");
export const RED_E = ManimColor.fromHex("#2E1512");
export const GREEN = ManimColor.fromHex("#83C167");
export const BLUE = ManimColor.fromHex("#58C4DD");
export const BLUE_A = ManimColor.fromHex("#3A87B5");
export const BLUE_B = ManimColor.fromHex("#2A5F7E");
export const BLUE_C = ManimColor.fromHex("#1E3F55");
export const BLUE_D = ManimColor.fromHex("#162B3A");
export const BLUE_E = ManimColor.fromHex("#0E1D28");
export const YELLOW = ManimColor.fromHex("#FFFF00");
export const YELLOW_A = ManimColor.fromHex("#E6C229");
export const ORANGE = ManimColor.fromHex("#FF862F");
export const GOLD = ManimColor.fromHex("#E8C547");
export const PINK = ManimColor.fromHex("#D382C7");
export const PURPLE = ManimColor.fromHex("#9A72AC");
export const TEAL = ManimColor.fromHex("#31918C");
export const TEAL_A = ManimColor.fromHex("#49A88F");
export const MAROON = ManimColor.fromHex("#914546");
export const GRAY = ManimColor.fromHex("#888888");
export const GREY = GRAY;
export const GRAY_A = ManimColor.fromHex("#DDDDDD");
export const GRAY_B = ManimColor.fromHex("#BBBBBB");
export const GRAY_C = ManimColor.fromHex("#999999");
export const GRAY_D = ManimColor.fromHex("#777777");
export const GRAY_E = ManimColor.fromHex("#555555");
export const DARK_GRAY = ManimColor.fromHex("#333333");
export const LIGHT_GRAY = ManimColor.fromHex("#CCCCCC");
export function parseColor(c, alpha) {
    return ManimColor.from(c, alpha);
}
export function interpolateColor(a, b, t) {
    return parseColor(a).interpolate(parseColor(b), t);
}
export function colorGradient(colors, n) {
    const parsed = colors.map((c) => parseColor(c));
    if (n <= 0)
        return [];
    if (parsed.length === 1)
        return Array.from({ length: n }, () => parsed[0]);
    const out = [];
    for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : i / (n - 1);
        const seg = t * (parsed.length - 1);
        const idx = Math.min(Math.floor(seg), parsed.length - 2);
        out.push(parsed[idx].interpolate(parsed[idx + 1], seg - idx));
    }
    return out;
}
/** Average of colors (used for e.g. sheen / background blends). */
export function averageColor(...colors) {
    const parsed = colors.map((c) => parseColor(c));
    const n = parsed.length;
    const rgb = [0, 0, 0];
    let a = 0;
    for (const c of parsed) {
        rgb[0] += c.rgb[0] / n;
        rgb[1] += c.rgb[1] / n;
        rgb[2] += c.rgb[2] / n;
        a += c.alpha / n;
    }
    return new ManimColor(rgb, a);
}
//# sourceMappingURL=color.js.map