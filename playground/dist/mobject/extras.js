// Extended mobjects — port of manim/mobject/{numbers, text, table, graph, image, svg, three_d, value_tracker}.py
import { TAU, PI, LEFT, RIGHT, DOWN, ORIGIN } from "../constants.js";
import { Mobject, VMobject, VGroup, Group, toVec3 } from "./base.js";
import { Line, Dot, Rectangle, Square, Polygon } from "./geometry.js";
import { add, mulScalar, normalize, lerpVec, interpolate, rotateVector } from "../utils/math.js";
import { parseColor, WHITE, BLACK, BLUE, YELLOW } from "../utils/color.js";
// =====================================================================
// ValueTracker
// =====================================================================
export class ValueTracker extends Mobject {
    constructor(value = 0) {
        super();
        this.set_points([[value, 0, 0]]);
    }
    get_value() {
        return this.points.length ? this.points[0][0] : 0;
    }
    getValue() { return this.get_value(); }
    set_value(v) {
        this.points = [[v, 0, 0]];
        return this;
    }
    setValue(v) { return this.set_value(v); }
    interpolate(a, b, alpha) {
        return this.set_value(a + (b - a) * alpha);
    }
    copy() {
        const c = super.copy();
        return c;
    }
}
export class ComplexValueTracker extends Mobject {
    constructor(value = { re: 0, im: 0 }) {
        super();
        const v = typeof value === "number" ? { re: value, im: 0 } : value;
        this.set_points([[v.re, v.im, 0]]);
    }
    get_value() {
        const p = this.points[0] ?? [0, 0, 0];
        return [p[0], p[1]];
    }
}
export class NumberLine extends VGroup {
    constructor(opts = {}) {
        super();
        Object.defineProperty(this, "xMin", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "xMax", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "xStep", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "length", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Rotation (radians, about origin) applied to this axis — set for y-axes. */
        Object.defineProperty(this, "angle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        const [mn, mx, step] = opts.x_range ?? [-7.5, 7.5, 1];
        this.xMin = mn;
        this.xMax = mx;
        this.xStep = step;
        this.length = opts.length ?? 12;
        const line = new Line([-this.length / 2, 0, 0], [this.length / 2, 0, 0], {
            stroke_color: opts.color, stroke_width: opts.stroke_width ?? 4,
        });
        this.add(line);
        if (opts.include_ticks !== false) {
            const ts = opts.tick_size ?? 0.1;
            for (let x = Math.ceil(mn / step) * step; x <= mx + 1e-9; x += step) {
                const px = this.number_to_point(x)[0];
                const tick = new Line([px, -ts, 0], [px, ts, 0], { stroke_width: 2, stroke_color: opts.color });
                this.add(tick);
            }
        }
    }
    get_unit_size() {
        return this.length / (this.xMax - this.xMin || 1);
    }
    number_to_point(n) {
        const u = this.get_unit_size();
        return [(n - this.xMin) * u - this.length / 2, 0, 0];
    }
    numberToPoint(n) { return this.number_to_point(n); }
    point_to_number(p) {
        const u = this.get_unit_size();
        return (toVec3(p)[0] + this.length / 2) / u + this.xMin;
    }
    n2p(n) { return this.number_to_point(n); }
    p2n(p) { return this.point_to_number(p); }
    /** Position on the (possibly rotated) axis for a number. */
    number_to_point_rotated(n) {
        const p = this.number_to_point(n);
        if (!this.angle)
            return p;
        return rotateVector(p, this.angle, [0, 0, 1]);
    }
    /** Label mobjects for tick values (like manim's get_number_mobjects). */
    get_number_mobjects(x_values, opts = {}) {
        const step = this.xStep;
        const vals = x_values ?? (() => {
            const out = [];
            for (let x = Math.ceil(this.xMin / step) * step; x <= this.xMax + 1e-9; x += step) {
                out.push(Math.abs(x) < 1e-9 ? 0 : x);
            }
            return out;
        })();
        const excluded = new Set(opts.excluding ?? []);
        const dir = normalize(rotateVector(toVec3((opts.direction ?? DOWN)), this.angle, [0, 0, 1]));
        const buff = opts.buff ?? 0.25;
        const group = new VGroup();
        for (const x of vals) {
            if (excluded.has(x))
                continue;
            const isInt = Math.abs(x - Math.round(x)) < 1e-9;
            const label = new DecimalNumber(x, {
                num_decimal_places: opts.num_decimal_places ?? (isInt ? 0 : 1),
                font_size: opts.font_size ?? 30,
            });
            label.move_to(this.number_to_point_rotated(x));
            label.shift([dir[0] * buff, dir[1] * buff, 0]);
            group.add(label);
        }
        return group;
    }
    getNumberMobjects(v, o) {
        return this.get_number_mobjects(v, o);
    }
    /** Adds number labels below/beside the ticks (manim parity). */
    add_numbers(x_values, opts = {}) {
        this.add(this.get_number_mobjects(x_values, opts));
        return this;
    }
    addNumbers(v, o) {
        return this.add_numbers(v, o);
    }
}
export class Axes extends VGroup {
    constructor(opts = {}) {
        super();
        Object.defineProperty(this, "xAxis", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "yAxis", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "xLength", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "yLength", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.xLength = opts.x_length ?? 12;
        this.yLength = opts.y_length ?? 6;
        this.xAxis = new NumberLine({ x_range: opts.x_range ?? [-7.5, 7.5, 1], length: this.xLength, ...(opts.axis_config ?? {}) });
        this.yAxis = new NumberLine({ x_range: opts.y_range ?? [-4, 4, 1], length: this.yLength, ...(opts.axis_config ?? {}) });
        this.yAxis.rotate(PI / 2);
        this.yAxis.angle = PI / 2;
        this.add(this.xAxis, this.yAxis);
    }
    coords_to_point(x, y) {
        return [this.xAxis.number_to_point(x)[0], this.yAxis.number_to_point(y)[0], 0];
    }
    c2p(x, y) { return this.coords_to_point(x, y); }
    point_to_coords(p) {
        const v = toVec3(p);
        return [this.xAxis.point_to_number([v[0], 0, 0]), this.yAxis.point_to_number([v[1], 0, 0])];
    }
    p2c(p) { return this.point_to_coords(p); }
    get_graph(fn, opts = {}) {
        return new FunctionGraph(fn, {
            x_range: opts.x_range ?? [this.xAxis.xMin, this.xAxis.xMax, 0.1],
            color: opts.color,
            axes: this,
        });
    }
    getGraph(fn, o) {
        return this.get_graph(fn, o);
    }
    plot(fn, o) {
        return this.get_graph(fn, o);
    }
    get_lines_to_point(p) {
        const v = toVec3(p);
        const g = new VGroup();
        g.add(new Line([v[0], 0, 0], v), new Line([0, v[1], 0], v));
        return g;
    }
    get_x_axis() { return this.xAxis; }
    get_y_axis() { return this.yAxis; }
    getXAxis() { return this.xAxis; }
    getYAxis() { return this.yAxis; }
    /** Labels ("x", "y") placed at the axis tips. */
    get_axis_labels(x_label = "x", y_label = "y", opts = {}) {
        const fs = opts.font_size ?? 36;
        const buff = opts.buff ?? 0.3;
        const mk = (l) => l instanceof Mobject ? l : new Text(String(l), { font_size: fs });
        const xl = mk(x_label);
        const yl = mk(y_label);
        const xTip = this.xAxis.n2p(this.xAxis.xMax);
        const yTip = this.yAxis.number_to_point_rotated(this.yAxis.xMax);
        xl.move_to([xTip[0] + buff, xTip[1] - buff * 0.6, 0]);
        yl.move_to([yTip[0] + buff * 0.8, yTip[1] + buff, 0]);
        const g = new VGroup(xl, yl);
        this.add(g);
        return g;
    }
    getAxisLabels(x, y) {
        return this.get_axis_labels(x, y);
    }
    /**
     * Filled polygon of the area under `graph` between x-range bounds,
     * down to the x-axis (manim parity).
     */
    get_area(graph, x_range, opts = {}) {
        const [a, b] = x_range ?? [this.xAxis.xMin, this.xAxis.xMax];
        const K = opts.samples ?? 256;
        // Sample the graph uniformly, invert x via p2c to find the [a, b] slice.
        const pts = [];
        const xs = [];
        for (let i = 0; i <= K; i++) {
            const p = graph.point_from_proportion(i / K);
            pts.push(p);
            xs.push(this.p2c(p)[0]);
        }
        const pick = (x, fromStart) => {
            for (let i = 0; i <= K; i++) {
                const idx = fromStart ? i : K - i;
                const inside = fromStart ? xs[idx] >= x : xs[idx] <= x;
                if (inside) {
                    // linear refine with neighbor
                    const j = fromStart ? Math.max(0, idx - 1) : Math.min(K, idx + 1);
                    const t = (x - xs[j]) / (xs[idx] - xs[j] || 1e-12);
                    const A = pts[j];
                    const B = pts[idx];
                    return [
                        A[0] + (B[0] - A[0]) * t,
                        A[1] + (B[1] - A[1]) * t,
                        0,
                    ];
                }
            }
            return pts[fromStart ? 0 : K];
        };
        const pA = pick(a, true);
        const pB = pick(b, false);
        const slice = [pA];
        for (let i = 0; i <= K; i++) {
            if (xs[i] > a && xs[i] < b)
                slice.push(pts[i]);
        }
        slice.push(pB);
        const baseY = this.c2p(0, 0)[1];
        const poly = new Polygon([slice[0][0], baseY, 0], ...slice, [slice[slice.length - 1][0], baseY, 0]);
        poly.set_fill(opts.color ?? BLUE, opts.opacity ?? 0.4);
        poly.set_stroke(opts.color ?? BLUE, 1, 2);
        return poly;
    }
    getArea(g, r, o) {
        return this.get_area(g, r, o);
    }
}
export class NumberPlane extends Axes {
    constructor(opts = {}) {
        super(opts);
        // grid lines
        const grid = new VGroup();
        const [x0, x1, xs] = opts.x_range ?? [-7.5, 7.5, 1];
        const [y0, y1, ys] = opts.y_range ?? [-4, 4, 1];
        for (let x = Math.ceil(x0 / xs) * xs; x <= x1 + 1e-9; x += xs) {
            const p = this.c2p(x, 0);
            grid.add(new Line([p[0], this.c2p(0, y0)[1], 0], [p[0], this.c2p(0, y1)[1], 0], { stroke_width: 1, stroke_opacity: 0.4 }));
        }
        for (let y = Math.ceil(y0 / ys) * ys; y <= y1 + 1e-9; y += ys) {
            const p = this.c2p(0, y);
            grid.add(new Line([this.c2p(x0, 0)[0], p[1], 0], [this.c2p(x1, 0)[0], p[1], 0], { stroke_width: 1, stroke_opacity: 0.4 }));
        }
        // insert grid behind axes
        this.submobjects.unshift(...grid.submobjects);
    }
}
export class ComplexPlane extends NumberPlane {
    constructor(opts = {}) {
        super(opts);
    }
}
export class PolarPlane extends VMobject {
    constructor(opts = {}) {
        super({ stroke_opacity: 0.5, stroke_width: 1 });
        void opts;
    }
}
export class ParametricFunction extends VMobject {
    constructor(fn, opts = {}) {
        super({});
        const [t0, t1, step] = opts.t_range ?? [0, 1, 0.01];
        const pts = [];
        for (let t = t0; t <= t1 + 1e-12; t += step)
            pts.push(toVec3(fn(t)));
        this.set_points_smoothly(pts);
        this.set_stroke(opts.color, undefined, opts.stroke_width ?? 4);
    }
}
export class FunctionGraph extends ParametricFunction {
    constructor(fn, opts = {}) {
        const [x0, x1, step] = opts.x_range ?? [-7.5, 7.5, 0.1];
        const axes = opts.axes;
        super((t) => {
            const y = fn(t);
            if (axes)
                return axes.c2p(t, y);
            return [t, y, 0];
        }, { t_range: [x0, x1, step], color: opts.color, stroke_width: opts.stroke_width });
    }
}
// ---------------- numbers ----------------
export class DecimalNumber extends VMobject {
    constructor(value = 0, opts = {}) {
        super({});
        Object.defineProperty(this, "value", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "numDecimalPlaces", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 2
        });
        Object.defineProperty(this, "color", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: WHITE
        });
        Object.defineProperty(this, "fontSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 48
        });
        this.value = value;
        this.numDecimalPlaces = opts.num_decimal_places ?? 2;
        if (opts.color)
            this.color = parseColor(opts.color);
        if (opts.font_size)
            this.fontSize = opts.font_size;
        this.refreshPoints();
    }
    get_value() { return this.value; }
    set_value(v) {
        this.value = v;
        this.refreshPoints();
        return this;
    }
    get_text() {
        return this.value.toFixed(this.numDecimalPlaces);
    }
    refreshPoints() {
        // placeholder rect sized by text length (for layout)
        const s = this.get_text();
        const h = this.fontSize / 90; // manim units
        const w = Math.max(0.2, s.length * h * 0.55);
        this.set_points_as_corners([[-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0], [-w / 2, -h / 2, 0]]);
    }
}
export class Integer extends DecimalNumber {
    constructor(value = 0, opts = {}) {
        super(value, { ...opts, num_decimal_places: 0 });
    }
}
export class Variable extends VGroup {
    constructor(value = 0, label = "", opts = {}) {
        super();
        Object.defineProperty(this, "tracker", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "label", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "value", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.tracker = new ValueTracker(value);
        this.label = new Text(opts.var_string ?? label);
        this.value = new DecimalNumber(value);
        this.add(this.label, this.value);
    }
}
const LATEX_REPLACEMENTS = [
    [/\\alpha/g, "α"], [/\\beta/g, "β"], [/\\gamma/g, "γ"], [/\\delta/g, "δ"],
    [/\\epsilon/g, "ε"], [/\\theta/g, "θ"], [/\\lambda/g, "λ"], [/\\mu/g, "μ"],
    [/\\pi/g, "π"], [/\\sigma/g, "σ"], [/\\phi/g, "φ"], [/\\omega/g, "ω"],
    [/\\infty/g, "∞"], [/\\sum/g, "∑"], [/\\prod/g, "∏"], [/\\int/g, "∫"],
    [/\\sqrt\{([^}]*)\}/g, "√($1)"], [/\\frac\{([^}]*)\}\{([^}]*)\}/g, "($1)/($2)"],
    [/\\times/g, "×"], [/\\cdot/g, "·"], [/\\leq/g, "≤"], [/\\geq/g, "≥"],
    [/\\neq/g, "≠"], [/\\approx/g, "≈"], [/\\to/g, "→"], [/\\Rightarrow/g, "⇒"],
    [/[{}$\\]/g, ""],
];
export function texToUnicode(s) {
    let out = s;
    for (const [re, rep] of LATEX_REPLACEMENTS)
        out = out.replace(re, rep);
    return out.trim();
}
export class Text extends VMobject {
    constructor(text, opts = {}) {
        super({});
        Object.defineProperty(this, "text", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "font", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fontSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "textColor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fontWeight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.text = Array.isArray(text) ? text.join("") : text;
        this.font = opts.font ?? "sans-serif";
        this.fontSize = opts.font_size ?? 48;
        this.textColor = parseColor(opts.color ?? WHITE);
        this.fontWeight = opts.weight ?? "normal";
        this.set_fill(this.textColor, opts.opacity ?? 1);
        this.set_stroke(this.textColor, 0, 0);
        this.refreshPoints();
    }
    refreshPoints() {
        const lines = this.text.split("\n");
        const h = this.fontSize / 90;
        const maxLen = Math.max(...lines.map((l) => l.length), 1);
        const w = Math.max(0.2, maxLen * h * 0.55);
        const totalH = Math.max(h * 0.9, lines.length * h * 0.9);
        this.set_points_as_corners([[-w / 2, -totalH / 2, 0], [w / 2, -totalH / 2, 0], [w / 2, totalH / 2, 0], [-w / 2, totalH / 2, 0], [-w / 2, -totalH / 2, 0]]);
    }
    get_text() { return this.text; }
    set_text(t) {
        this.text = t;
        this.refreshPoints();
        return this;
    }
}
export class Paragraph extends VGroup {
    constructor(...lines) {
        super();
        const opts = (typeof lines[lines.length - 1] === "object" ? lines.pop() : {});
        for (const ln of lines)
            this.add(new Text(ln, opts));
        this.arrange(DOWN, 0.25, false);
    }
}
export class Tex extends Text {
    constructor(texString, opts = {}) {
        super(texToUnicode(texString), { ...opts, font: opts.font ?? "Georgia, 'Times New Roman', serif" });
        Object.defineProperty(this, "texString", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.texString = texString;
    }
}
export class MathTex extends Tex {
    constructor(texString, opts = {}) {
        super(texString, { ...opts, font: opts.font ?? "Georgia, 'Times New Roman', serif" });
        // math is typically italic
    }
}
export class SingleStringMathTex extends MathTex {
}
export class Code extends VGroup {
    constructor(opts = "") {
        super();
        Object.defineProperty(this, "codeString", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "language", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const o = typeof opts === "string" ? { code_string: opts } : opts;
        this.codeString = o.code_string ?? o.code ?? "";
        this.language = o.language ?? "python";
        const bg = new Rectangle({ width: 10, height: Math.max(1.5, this.codeString.split("\n").length * 0.5 + 0.6), fill_color: "#1e1e1e", fill_opacity: 1, stroke_width: 0 });
        const txt = new Text(this.codeString, { font: "monospace", font_size: o.font_size ?? 24 });
        txt.move_to(ORIGIN);
        bg.move_to(ORIGIN);
        this.add(bg, txt);
    }
}
// =====================================================================
// Matrix / Table
// =====================================================================
export class Matrix extends VGroup {
    constructor(matrix, opts = {}) {
        super();
        Object.defineProperty(this, "rows", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "bracketPair", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["[", "]"]
        });
        this.rows = matrix.map((row) => row.map((cell) => (cell instanceof Mobject ? cell : new MathTex(String(cell), cell !== undefined && opts.color ? { color: opts.color } : {}))));
        const grid = new VGroup();
        for (const row of this.rows) {
            const r = new VGroup(...row);
            r.arrange(RIGHT, 0.5, false);
            grid.add(r);
        }
        grid.arrange(DOWN, 0.35, false);
        const left = new Text("[", { font_size: 64, color: opts.bracket_color ?? opts.color });
        const right = new Text("]", { font_size: 64, color: opts.bracket_color ?? opts.color });
        const h = Math.max(1, grid.get_height() + 0.4);
        left.set_height(h);
        right.set_height(h);
        const row = new VGroup(left, grid, right);
        row.arrange(RIGHT, 0.25, false);
        this.add(row);
    }
    get_rows() { return this.rows; }
    get_columns() {
        const cols = [];
        for (let j = 0; j < (this.rows[0]?.length ?? 0); j++)
            cols.push(this.rows.map((r) => r[j]));
        return cols;
    }
    get_entries() { return this.rows.flat(); }
}
export class Table extends VGroup {
    constructor(opts = {}) {
        super();
        const data = opts.table ?? [];
        const grid = new VGroup();
        const allRows = [];
        if (opts.col_labels) {
            const header = new VGroup(...opts.col_labels);
            header.arrange(RIGHT, 0.8, false);
            grid.add(header);
            allRows.push(opts.col_labels);
        }
        data.forEach((row, i) => {
            const cells = row.map((c) => (c instanceof Mobject ? c : new Text(String(c))));
            const label = opts.row_labels?.[i];
            const rowGroup = new VGroup(...(label ? [label, ...cells] : cells));
            rowGroup.arrange(RIGHT, 0.8, false);
            grid.add(rowGroup);
            allRows.push(cells);
        });
        grid.arrange(DOWN, 0.5, false);
        this.add(grid);
        void allRows;
    }
}
export class Graph extends VGroup {
    constructor(vertexKeys, edges, opts = {}) {
        super();
        Object.defineProperty(this, "vertices", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "edges", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new VGroup()
        });
        Object.defineProperty(this, "vertexKeys", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "edgeList", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.vertexKeys = vertexKeys.map(String);
        this.edgeList = edges.map(([a, b]) => [String(a), String(b)]);
        const positions = this.computeLayout(opts);
        const r = opts.vertex_config?.radius ?? 0.25;
        const vGroup = new VGroup();
        for (const k of this.vertexKeys) {
            const dot = new Dot(positions[k] ?? ORIGIN, { radius: r, fill_color: opts.vertex_config?.color, fill_opacity: 1 });
            const g = new VGroup(dot);
            const labels = opts.labels;
            if (labels) {
                const text = typeof labels === "object" ? labels[k] : k;
                const label = text instanceof Mobject ? text : new Text(String(text ?? k), { font_size: 28 });
                label.move_to(dot.get_center());
                label.next_to(dot, DOWN, 0.15);
                g.add(label);
            }
            this.vertices[k] = g;
            vGroup.add(g);
        }
        const eGroup = new VGroup();
        for (const [a, b] of this.edgeList) {
            const pa = this.vertices[a]?.submobjects[0]?.get_center() ?? ORIGIN;
            const pb = this.vertices[b]?.submobjects[0]?.get_center() ?? ORIGIN;
            eGroup.add(new Line(pa, pb, { stroke_color: opts.edge_config?.color, stroke_width: opts.edge_config?.stroke_width ?? 3 }));
        }
        this.edges = eGroup;
        this.add(eGroup, vGroup);
    }
    computeLayout(opts) {
        if (opts.layout && typeof opts.layout === "object") {
            const out = {};
            for (const k of this.vertexKeys) {
                const v = opts.layout[k];
                out[k] = v ? toVec3(v) : ORIGIN;
            }
            return out;
        }
        const scale = opts.layout_scale ?? 3;
        const out = {};
        this.vertexKeys.forEach((k, i) => {
            const a = (i / Math.max(1, this.vertexKeys.length)) * TAU;
            out[k] = [scale * Math.cos(a), scale * Math.sin(a), 0];
        });
        return out;
    }
}
export class DiGraph extends Graph {
    constructor(v, e, opts = {}) {
        super(v, e, opts);
    }
}
// =====================================================================
// ImageMobject / SVG / 3D (Canvas-2D projections)
// =====================================================================
export class ImageMobject extends Rectangle {
    constructor(urlOrImage, opts = {}) {
        super({ width: 4, height: (opts.height ?? 3), stroke_width: 0 });
        Object.defineProperty(this, "image", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        if (typeof urlOrImage === "string") {
            this.url = urlOrImage;
            if (typeof Image !== "undefined") {
                const img = new Image();
                img.src = urlOrImage;
                img.onload = () => { this.image = img; };
                this.image = img;
            }
        }
        else {
            this.image = urlOrImage;
        }
        if (opts.height)
            this.set_height(opts.height);
    }
}
// Minimal SVG path `d` parser -> cubic points (absolute coords, y-down flipped).
export function parseSvgPath(d, scale = 0.05) {
    const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
    let i = 0;
    let cx = 0, cy = 0;
    let sx = 0, sy = 0;
    const cubics = [];
    let prevCubicCtrl = null;
    let prevQuadCtrl = null;
    const line = (x, y) => {
        const a = [cx, -cy, 0];
        const b = [x, -y, 0];
        const h1 = toVec3(lerpVec(a, b, 1 / 3));
        const h2 = toVec3(lerpVec(a, b, 2 / 3));
        if (!cubics.length)
            cubics.push(a);
        cubics.push(h1, h2, b);
        cx = x;
        cy = y;
    };
    const cubic = (x1, y1, x2, y2, x, y) => {
        if (!cubics.length) {
            const s = [cx, -cy, 0];
            cubics.push(s, [...s], [...s], [...s]);
        }
        cubics.push([x1, -y1, 0], [x2, -y2, 0], [x, -y, 0]);
        cx = x;
        cy = y;
    };
    const num = () => parseFloat(tokens[i++]);
    let cmd = "";
    while (i < tokens.length) {
        const t = tokens[i];
        if (/[MmLlHhVvCcSsQqTtAaZz]/.test(t)) {
            cmd = t;
            i++;
        }
        const rel = cmd === cmd.toLowerCase() && cmd !== "z" && cmd !== "Z";
        const C = cmd.toUpperCase();
        if (C === "M") {
            const x = num(), y = num();
            cx = rel ? cx + x : x;
            cy = rel ? cy + y : y;
            sx = cx;
            sy = cy;
            // Pen-up separator that preserves the stride layout: 4-point seed on
            // empty paths, [last ×2, point] afterwards (see utils/curve.ts).
            const p = [cx, -cy, 0];
            if (!cubics.length) {
                cubics.push(p, [...p], [...p], [...p]);
            }
            else {
                const l = cubics[cubics.length - 1];
                cubics.push([...l], [...l], p);
            }
            cmd = rel ? "l" : "L";
        }
        else if (C === "L") {
            const x = num(), y = num();
            line(rel ? cx + x : x, rel ? cy + y : y);
        }
        else if (C === "H") {
            const x = num();
            line(rel ? cx + x : x, cy);
        }
        else if (C === "V") {
            const y = num();
            line(cx, rel ? cy + y : y);
        }
        else if (C === "C") {
            const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num();
            if (rel)
                cubic(cx + x1, cy + y1, cx + x2, cy + y2, cx + x, cy + y);
            else
                cubic(x1, y1, x2, y2, x, y);
            prevCubicCtrl = [rel ? cx + x2 - x : x2, rel ? cy + y2 - y : y2];
            prevQuadCtrl = null;
        }
        else if (C === "S") {
            const x2 = num(), y2 = num(), x = num(), y = num();
            let x1 = cx, y1 = cy;
            if (prevCubicCtrl) {
                x1 = 2 * cx - prevCubicCtrl[0];
                y1 = 2 * cy - prevCubicCtrl[1];
            }
            if (rel)
                cubic(x1, y1, cx + x2, cy + y2, cx + x, cy + y);
            else
                cubic(x1, y1, x2, y2, x, y);
            prevCubicCtrl = [rel ? cx + x2 - x : x2, rel ? cy + y2 - y : y2];
        }
        else if (C === "Q") {
            const x1 = num(), y1 = num(), x = num(), y = num();
            const ax = rel ? cx + x1 : x1, ay = rel ? cy + y1 : y1;
            const bx = rel ? cx + x : x, by = rel ? cy + y : y;
            // quadratic -> cubic
            const p0 = [cx, cy];
            const c1 = [p0[0] + (2 / 3) * (ax - p0[0]), p0[1] + (2 / 3) * (ay - p0[1])];
            const c2 = [bx + (2 / 3) * (ax - bx), by + (2 / 3) * (ay - by)];
            cubic(c1[0], c1[1], c2[0], c2[1], bx, by);
            prevQuadCtrl = [ax, ay];
            prevCubicCtrl = null;
        }
        else if (C === "T") {
            const x = num(), y = num();
            let ax = cx, ay = cy;
            if (prevQuadCtrl) {
                ax = 2 * cx - prevQuadCtrl[0];
                ay = 2 * cy - prevQuadCtrl[1];
            }
            const bx = rel ? cx + x : x, by = rel ? cy + y : y;
            const p0 = [cx, cy];
            const c1 = [p0[0] + (2 / 3) * (ax - p0[0]), p0[1] + (2 / 3) * (ay - p0[1])];
            const c2 = [bx + (2 / 3) * (ax - bx), by + (2 / 3) * (ay - by)];
            cubic(c1[0], c1[1], c2[0], c2[1], bx, by);
            prevQuadCtrl = [ax, ay];
        }
        else if (C === "Z") {
            line(sx, sy);
            cx = sx;
            cy = sy;
            prevCubicCtrl = prevQuadCtrl = null;
        }
        else if (C === "A") {
            // approximate arc with straight line (full arc support is out of scope for minimal port)
            const rx = num(), ry = num(), rot = num(), laf = num(), sf = num(), x = num(), y = num();
            void rx;
            void ry;
            void rot;
            void laf;
            void sf;
            line(rel ? cx + x : x, rel ? cy + y : y);
        }
        else {
            i++;
        }
    }
    return cubics.map((p) => [p[0] * scale, p[1] * scale, 0]);
}
export class SVGMobject extends VMobject {
    constructor(svgOrPath, opts = {}) {
        super({});
        let d = svgOrPath;
        // If it looks like a file path (ends with .svg and contains no "<"), keep placeholder.
        const isPath = svgOrPath.trim().endsWith(".svg") && !svgOrPath.includes("<");
        if (svgOrPath.includes("<")) {
            const m = svgOrPath.match(/d="([^"]+)"/);
            d = m ? m[1] : "";
        }
        else if (isPath) {
            d = "M0,0 L100,0 L100,100 L0,100 Z"; // placeholder until fetch; use .loadSvg() in browser
        }
        if (d && !d.includes("<")) {
            try {
                this.set_points(parseSvgPath(d));
            }
            catch { /* keep empty */ }
        }
        this.set_fill(undefined, opts.fill_opacity ?? 1);
        if (opts.height)
            this.set_height(opts.height);
    }
    /** Load an SVG file (browser) and replace points. */
    async loadSvg(url) {
        const res = await fetch(url);
        const text = await res.text();
        const paths = [...text.matchAll(/d="([^"]+)"/g)].map((m) => m[1]);
        const all = [];
        for (const d of paths)
            all.push(...parseSvgPath(d));
        if (all.length)
            this.set_points(all);
        return this;
    }
}
export class TexSymbol extends Tex {
}
// ---------------- 3D (projected to 2D) ----------------
export class Cube extends VGroup {
    constructor(opts = {}) {
        super();
        const s = (opts.side_length ?? 2) / 2;
        const v = [
            [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
            [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s],
        ];
        // simple orthographic projection with slight tilt
        const proj = (p) => [p[0] + 0.35 * p[2], p[1] - 0.25 * p[2], 0];
        const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
        for (const [a, b] of E) {
            this.add(new Line(proj(v[a]), proj(v[b]), { stroke_width: opts.stroke_width ?? 3 }));
        }
        void opts;
    }
}
export class Sphere extends VMobject {
    constructor(opts = {}) {
        super({});
        const r = opts.radius ?? 1;
        // outline circle + two ellipses for latitude/longitude hint
        const c = new (Object.getPrototypeOf(this).constructor === Sphere ? Object : Object)();
        void c;
        const pts = [];
        // main circle
        for (let k = 0; k < 8; k++) {
            const a0 = (k / 8) * TAU;
            const a1 = ((k + 1) / 8) * TAU;
            const delta = a1 - a0;
            const kk = (4 / 3) * Math.tan(delta / 4);
            const p0 = [r * Math.cos(a0), r * Math.sin(a0), 0];
            const p3 = [r * Math.cos(a1), r * Math.sin(a1), 0];
            pts.push(p0, [p0[0] - kk * r * Math.sin(a0), p0[1] + kk * r * Math.cos(a0), 0], [p3[0] + kk * r * Math.sin(a1), p3[1] - kk * r * Math.cos(a1), 0], p3);
        }
        this.set_points(pts);
    }
}
export class Surface extends VGroup {
    constructor(fn, opts = {}) {
        super();
        const [u0, u1] = opts.u_range ?? [0, 1];
        const [v0, v1] = opts.v_range ?? [0, 1];
        const res = opts.resolution ?? 12;
        for (let i = 0; i <= res; i++) {
            const u = u0 + ((u1 - u0) * i) / res;
            const row = [];
            for (let j = 0; j <= res; j++) {
                const v = v0 + ((v1 - v0) * j) / res;
                const p = fn(u, v);
                row.push([p[0], p[1], 0]); // orthographic drop z (Canvas 2D)
            }
            const line = new VMobject({});
            line.set_points_smoothly(row);
            line.set_stroke(undefined, 0.6, 1);
            this.add(line);
        }
        for (let j = 0; j <= res; j++) {
            const v = v0 + ((v1 - v0) * j) / res;
            const col = [];
            for (let i = 0; i <= res; i++) {
                const u = u0 + ((u1 - u0) * i) / res;
                const p = fn(u, v);
                col.push([p[0], p[1], 0]);
            }
            const line = new VMobject({});
            line.set_points_smoothly(col);
            line.set_stroke(undefined, 0.6, 1);
            this.add(line);
        }
    }
}
export { Group as GroupAlias };
void LEFT;
void RIGHT;
void DOWN;
void add;
void mulScalar;
void interpolate;
void BLUE;
void YELLOW;
void BLACK;
void Polygon;
void Square;
//# sourceMappingURL=extras.js.map