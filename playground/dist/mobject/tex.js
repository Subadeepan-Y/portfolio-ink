// Vector TeX — a manim-ts exclusive upgrade path for formulas.
// `Tex`/`MathTex` map commands to unicode (zero dependencies). `SvgTex` goes
// further: it typesets real LaTeX to SVG glyph paths with MathJax (pure JS,
// no LaTeX installation, no CLI) and converts every glyph into VMobject
// curves — so Write(), Create() and per-glyph TransformMatchingTex work on
// genuine math typography.
//
// MathJax is an *optional* dependency: `npm i mathjax-full`. Without it,
// `SvgTex.typeset()` throws a helpful error (and `SvgTex.available()` is false).
import { VGroup, VMobject } from "./base.js";
import { Rectangle } from "./geometry.js";
import { parseSvgPath } from "./extras.js";
import { parseColor, WHITE } from "../utils/color.js";
// Optional dependency loaded only when SvgTex actually typesets. The specifier
// is held in a variable (never a literal) so Vite/Next/webpack leave it as a
// runtime dynamic import instead of statically resolving it — the app can
// build and run without mathjax-full installed.
const MJ_MATHJAX = "mathjax-full/js/mathjax.js";
const MJ_INPUT_TEX = "mathjax-full/js/input/tex.js";
const MJ_OUTPUT_SVG = "mathjax-full/js/output/svg.js";
const MJ_LITE_ADAPTOR = "mathjax-full/js/adaptors/liteAdaptor.js";
const MJ_HANDLERS = "mathjax-full/js/handlers/html.js";
const MJ_ALL_PACKAGES = "mathjax-full/js/input/tex/AllPackages.js";
const IDENTITY = [1, 0, 0, 1, 0, 0];
function compose(m, n) {
    // apply n, then m (SVG nesting: outer transforms compose on the left)
    const [a1, b1, c1, d1, e1, f1] = m;
    const [a2, b2, c2, d2, e2, f2] = n;
    return [
        a1 * a2 + c1 * b2,
        b1 * a2 + d1 * b2,
        a1 * c2 + c1 * d2,
        b1 * c2 + d1 * d2,
        a1 * e2 + c1 * f2 + e1,
        b1 * e2 + d1 * f2 + f1,
    ];
}
function parseTransform(attr) {
    if (!attr)
        return IDENTITY;
    // SVG applies list items left-to-right (leftmost = outermost).
    let m = [...IDENTITY];
    const re = /(\w+)\(([^)]+)\)/g;
    let match;
    while ((match = re.exec(attr)) !== null) {
        const nums = match[2].trim().split(/[\s,]+/).map(Number);
        if (match[1] === "translate") {
            const [tx, ty = 0] = nums;
            m = compose(m, [1, 0, 0, 1, tx || 0, ty || 0]);
        }
        else if (match[1] === "scale") {
            const [sx, sy = sx] = nums;
            m = compose(m, [sx || 1, 0, 0, sy ?? sx ?? 1, 0, 0]);
        }
        else if (match[1] === "matrix" && nums.length === 6) {
            m = compose(m, [nums[0], nums[1], nums[2], nums[3], nums[4], nums[5]]);
        }
    }
    return m;
}
function applyAffine(p, m) {
    const [a, b, c, d, e, f] = m;
    return [a * p[0] + c * p[1] + e, b * p[0] + d * p[1] + f, 0];
}
function attr(tag, name) {
    // Leading-whitespace anchor so `d=` never matches the tail of `id="`.
    const re = new RegExp(`(?:^|\\s)${name}="([^"]*)"`);
    const m = tag.match(re);
    return m ? m[1] : null;
}
/** Split a MathJax SVG document into glyph/rect instances with transforms. */
function collectInstances(svg) {
    const defs = new Map();
    const defsSection = svg.slice(svg.indexOf("<defs>"), svg.indexOf("</defs>"));
    for (const tag of defsSection.match(/<path\b[^>]*>/g) ?? []) {
        const id = attr(tag, "id");
        const d = attr(tag, "d");
        if (id && d)
            defs.set(id, d);
    }
    const items = [];
    const stack = [IDENTITY];
    const top = () => stack[stack.length - 1];
    const tagRe = /<\/?(g|use|rect|svg|defs|mjx-container)[^>]*>/g;
    let m;
    while ((m = tagRe.exec(svg)) !== null) {
        const tag = m[0];
        const closing = tag.startsWith("</");
        const selfClosing = /\/>\s*$/.test(tag);
        const name = (tag.match(/^<\/?([a-z-]+)/) ?? [])[1];
        if (name === "g" && !closing) {
            const t = compose(top(), parseTransform(attr(tag, "transform")));
            if (selfClosing)
                continue;
            stack.push(t);
        }
        else if (name === "g" && closing) {
            if (stack.length > 1)
                stack.pop();
        }
        else if (name === "use" && !closing) {
            const href = attr(tag, "href") ?? attr(tag, "xlink:href");
            if (href) {
                const id = href.replace(/^#/, "");
                const d = defs.get(id);
                if (d) {
                    const ux = parseFloat(attr(tag, "x") ?? "0") || 0;
                    const uy = parseFloat(attr(tag, "y") ?? "0") || 0;
                    const matrix = compose(top(), [1, 0, 0, 1, ux, uy]);
                    items.push({ kind: "path", d, matrix, orderX: matrix[4] });
                }
            }
        }
        else if (name === "rect" && !closing) {
            const x = parseFloat(attr(tag, "x") ?? "0") || 0;
            const y = parseFloat(attr(tag, "y") ?? "0") || 0;
            const w = parseFloat(attr(tag, "width") ?? "0") || 0;
            const h = parseFloat(attr(tag, "height") ?? "0") || 0;
            if (w > 0 && h > 0)
                items.push({ kind: "rect", x, y, w, h, matrix: top(), orderX: top()[4] + x });
        }
    }
    return { defs, items };
}
// Module-level MathJax document cache (init is expensive).
let cachedDoc = null;
async function getMathJaxDocument() {
    if (cachedDoc)
        return cachedDoc;
    let mathjaxMod;
    try {
        // mathjax-full is optional; the variable specifier keeps bundlers from
        // resolving (and failing on) a dependency that may not be installed.
        mathjaxMod = await import(MJ_MATHJAX);
    }
    catch {
        throw new Error("[manim-ts] SvgTex needs the optional 'mathjax-full' package (pure-JS, no LaTeX install): run `npm i mathjax-full`.");
    }
    const MJ = mathjaxMod;
    const mods = (await Promise.all([
        import(MJ_INPUT_TEX),
        import(MJ_OUTPUT_SVG),
        import(MJ_LITE_ADAPTOR),
        import(MJ_HANDLERS),
        import(MJ_ALL_PACKAGES),
    ]));
    const [{ TeX }, { SVG }, { liteAdaptor }, { RegisterHTMLHandler }, { AllPackages }] = mods;
    const adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);
    const tex = new TeX({ packages: AllPackages });
    const svg = new SVG({ fontCache: "local" });
    const doc = MJ.mathjax.document("", { InputJax: tex, OutputJax: svg });
    cachedDoc = { adaptor, doc };
    return cachedDoc;
}
/** True when the optional mathjax-full dependency is installed. */
export async function texTypesettingAvailable() {
    try {
        await import(MJ_MATHJAX);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Typeset LaTeX to a VGroup of per-glyph VMobjects (manim units, centered).
 * Each glyph becomes its own child — Write() draws them in reading order and
 * TransformMatchingTex can pair identical glyphs.
 */
export async function typesetTex(texString, opts = {}) {
    const { adaptor, doc } = await getMathJaxDocument();
    const node = doc.convert(texString, { display: opts.display ?? false });
    const svg = adaptor.outerHTML(node);
    const { defs, items } = collectInstances(svg);
    void defs;
    if (!items.length)
        throw new Error(`[manim-ts] MathJax produced no glyphs for: ${texString}`);
    const placed = [];
    for (const item of items) {
        if (item.kind === "rect") {
            const corners = [
                [item.x, item.y],
                [item.x + item.w, item.y],
                [item.x + item.w, item.y + item.h],
                [item.x, item.y + item.h],
            ].map(([x, y]) => applyAffine([x, y], item.matrix));
            placed.push({ pts: corners, minX: Math.min(...corners.map((p) => p[0])) });
        }
        else {
            const raw = parseSvgPath(item.d, 1).map((p) => [p[0], -p[1], 0]);
            const pts = raw.map((p) => applyAffine(p, item.matrix));
            if (pts.length)
                placed.push({ pts, minX: Math.min(...pts.map((p) => p[0])) });
        }
    }
    // Global bbox → normalize to target height, centered, y-up.
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const g of placed) {
        for (const p of g.pts) {
            if (p[0] < minX)
                minX = p[0];
            if (p[0] > maxX)
                maxX = p[0];
            if (p[1] < minY)
                minY = p[1];
            if (p[1] > maxY)
                maxY = p[1];
        }
    }
    const targetH = opts.height ?? 0.9;
    const s = (maxY - minY || 1) === 0 ? 1 : targetH / (maxY - minY || 1);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const color = parseColor(opts.color ?? WHITE);
    // Reading order for Write(): left to right (stable for stacked layouts).
    placed.sort((a, b) => a.minX - b.minX);
    const group = new VGroup();
    for (const g of placed) {
        const vm = new VMobject({});
        vm.set_points(g.pts.map(([x, y]) => [(x - cx) * s, (cy - y) * s, 0]));
        vm.set_fill(color, 1);
        vm.set_stroke(color, 0, 0);
        group.add(vm);
    }
    return group;
}
/**
 * A TeX mobject backed by real MathJax vector glyphs. Construct instantly
 * (placeholder box keeps layout working), then `await tex.typeset()`.
 */
export class SvgTex extends VGroup {
    constructor(texString, opts = {}) {
        super();
        Object.defineProperty(this, "texString", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "targetHeight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "texColor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "displayMode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "typesetDone", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.texString = texString;
        this.targetHeight = opts.height ?? 0.9;
        this.texColor = opts.color ?? WHITE;
        this.displayMode = opts.display ?? false;
        // Placeholder so positioning works before (or without) typesetting.
        const w = Math.max(0.4, texString.length * 0.16 * this.targetHeight);
        const holder = new Rectangle({
            width: w,
            height: this.targetHeight,
            stroke_width: 0,
            fill_opacity: 0,
        });
        this.add(holder);
    }
    static async available() {
        return texTypesettingAvailable();
    }
    get_text() {
        return this.texString;
    }
    /** Replace the placeholder with typeset vector glyphs. */
    async typeset() {
        const glyphs = await typesetTex(this.texString, {
            height: this.targetHeight,
            color: this.texColor,
            display: this.displayMode,
        });
        const center = this.get_center();
        this.submobjects = [];
        this.points = [];
        this.add(...glyphs.submobjects);
        this.move_to(center);
        this.typesetDone = true;
        return this;
    }
}
//# sourceMappingURL=tex.js.map