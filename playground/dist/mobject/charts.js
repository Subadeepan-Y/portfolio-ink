// Live charts — a manim-ts exclusive. Animated BarChart / LineChart with
// dataset transitions and streaming pushes (think live dashboards, which
// offline Python Manim cannot do).
import { Mobject, VMobject, VGroup } from "./base.js";
import { Rectangle, Line, Dot } from "./geometry.js";
import { Text, DecimalNumber } from "./extras.js";
import { Animation } from "../animation/all.js";
import { lerpVec, interpolate } from "../utils/math.js";
import { parseColor, colorGradient, BLUE, WHITE } from "../utils/color.js";
import { ORIGIN } from "../constants.js";
/** Bar chart with animated transitions and streaming pushes. */
export class BarChart extends VGroup {
    constructor(values, opts = {}) {
        super();
        Object.defineProperty(this, "values", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "yMin", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "yMax", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "chartWidth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "chartHeight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "barColors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "bars", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new VGroup()
        });
        Object.defineProperty(this, "labels", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new VGroup()
        });
        Object.defineProperty(this, "baselineY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        this.values = [...values];
        this.yMin = Math.min(opts.y_min ?? 0, ...values, 0);
        this.yMax = Math.max(opts.y_max ?? 0, ...values, 1);
        this.chartWidth = opts.width ?? 8;
        this.chartHeight = opts.height ?? 4;
        const colors = opts.bar_colors ?? BLUE;
        this.barColors = Array.isArray(colors)
            ? colorGradient(colors, Math.max(2, values.length)).map((c) => c.toHex())
            : values.map(() => colors);
        if (opts.title) {
            const title = new Text(opts.title, { font_size: opts.font_size ?? 32 });
            title.move_to([0, this.chartHeight / 2 + 0.7, 0]);
            this.add(title);
        }
        this.rebuild();
    }
    barGeom(i, n) {
        const slot = this.chartWidth / Math.max(1, n);
        const w = slot * 0.62;
        const x = -this.chartWidth / 2 + slot * (i + 0.5);
        const v = this.values[i] ?? 0;
        const h = ((v - this.yMin) / (this.yMax - this.yMin || 1)) * this.chartHeight;
        return { x, w, h };
    }
    /** Refresh bar/line geometry from current data (public for transitions). */ rebuild() {
        this.remove(this.bars, this.labels);
        this.bars = new VGroup();
        this.labels = new VGroup();
        const n = this.values.length;
        this.baselineY = (-this.yMin / (this.yMax - this.yMin || 1)) * this.chartHeight - this.chartHeight / 2;
        // axis line
        const axis = new Line([-this.chartWidth / 2, this.baselineY, 0], [this.chartWidth / 2, this.baselineY, 0], { stroke_width: 2 });
        this.bars.add(axis);
        this.values.forEach((v, i) => {
            const { x, w, h } = this.barGeom(i, n);
            const bar = new Rectangle({ width: w, height: Math.max(0.02, h) });
            bar.set_fill(this.barColors[i % this.barColors.length], 0.9);
            bar.set_stroke(this.barColors[i % this.barColors.length], 1, 1);
            bar.move_to([x, this.baselineY + Math.max(0.02, h) / 2, 0]);
            this.bars.add(bar);
            const label = new DecimalNumber(v, {
                num_decimal_places: Number.isInteger(v) ? 0 : 1,
                font_size: 24,
            });
            label.next_to(bar, [0, 1, 0], 0.12);
            this.labels.add(label);
        });
        this.add(this.bars, this.labels);
    }
    /** Animate to a new dataset (bar heights + labels morph). */
    transition_to(data, opts = {}) {
        return new ChartTransition(this, [...data], opts);
    }
    transitionTo(data, opts = {}) {
        return this.transition_to(data, opts);
    }
    /** Append a value (dropping the oldest) — the streaming primitive. */
    push(value, maxLen) {
        this.values.push(value);
        const n = maxLen ?? this.values.length - 1;
        while (this.values.length > Math.max(1, n))
            this.values.shift();
        this.yMax = Math.max(this.yMax, value, 1);
        this.rebuild();
        return this;
    }
}
/** Line chart with animated transitions and streaming pushes. */
export class LineChart extends VGroup {
    constructor(points, opts = {}) {
        super();
        Object.defineProperty(this, "points2D", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
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
        Object.defineProperty(this, "yMin", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "yMax", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "chartWidth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "chartHeight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "line", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "dots", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new VGroup()
        });
        Object.defineProperty(this, "color", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.points2D = points.map(([x, y]) => [x, y]);
        const xs = points.map(([x]) => x);
        const ys = points.map(([, y]) => y);
        this.xMin = opts.x_min ?? Math.min(...xs, 0);
        this.xMax = opts.x_max ?? Math.max(...xs, 1);
        this.yMin = opts.y_min ?? Math.min(...ys, 0);
        this.yMax = opts.y_max ?? Math.max(...ys, 1);
        this.chartWidth = opts.width ?? 8;
        this.chartHeight = opts.height ?? 4;
        this.color = opts.color ?? BLUE;
        this.line = new VMobject({});
        if (opts.title) {
            const title = new Text(opts.title, { font_size: 32 });
            title.move_to([0, this.chartHeight / 2 + 0.7, 0]);
            this.add(title);
        }
        this.rebuild();
    }
    dataToPoint(x, y) {
        const px = ((x - this.xMin) / (this.xMax - this.xMin || 1) - 0.5) * this.chartWidth;
        const py = ((y - this.yMin) / (this.yMax - this.yMin || 1) - 0.5) * this.chartHeight;
        return [px, py, 0];
    }
    /** Refresh bar/line geometry from current data (public for transitions). */ rebuild() {
        this.remove(this.line, this.dots);
        this.line = new VMobject({});
        const pts = this.points2D.map(([x, y]) => this.dataToPoint(x, y));
        if (pts.length >= 2)
            this.line.set_points_smoothly(pts);
        this.line.set_stroke(this.color, 1, 4);
        this.dots = new VGroup(...pts.map((p) => new Dot(p, { radius: 0.07, color: this.color, fill_opacity: 1 })));
        this.add(this.line, this.dots);
    }
    transition_to(data, opts = {}) {
        return new LineChartTransition(this, data.map(([x, y]) => [x, y]), opts);
    }
    transitionTo(data, opts = {}) {
        return this.transition_to(data, opts);
    }
    push(point, maxLen) {
        this.points2D.push(point);
        const n = maxLen ?? this.points2D.length - 1;
        while (this.points2D.length > Math.max(2, n))
            this.points2D.shift();
        const xs = this.points2D.map(([x]) => x);
        this.xMin = Math.min(...xs);
        this.xMax = Math.max(...xs);
        this.rebuild();
        return this;
    }
}
/** Morphs a BarChart to new values (heights + labels interpolate). */
export class ChartTransition extends Animation {
    constructor(chart, data, opts = {}) {
        super(chart, { run_time: 1, ...opts });
        Object.defineProperty(this, "chart", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "from", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "to", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "targetLen", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.chart = chart;
        this.targetLen = data.length;
        this.from = [...chart.values];
        const n = Math.max(this.from.length, data.length);
        while (this.from.length < n)
            this.from.push(0);
        this.to = [...data];
        while (this.to.length < n)
            this.to.push(0);
    }
    interpolate(alpha) {
        const t = this.eased(alpha);
        this.chart.values = this.from.map((v, i) => interpolate(v, this.to[i], t));
        this.chart.yMax = Math.max(...this.chart.values, 1);
        this.chart.rebuild();
    }
    finish() {
        this.chart.values = this.to.slice(0, this.targetLen);
        this.chart.yMax = Math.max(...this.chart.values, 1);
        this.chart.rebuild();
    }
}
/** Morphs a LineChart to new points. */
export class LineChartTransition extends Animation {
    constructor(chart, data, opts = {}) {
        super(chart, { run_time: 1, ...opts });
        Object.defineProperty(this, "chart", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "from", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "to", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "targetLen", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.chart = chart;
        this.targetLen = data.length;
        const n = Math.max(chart.points2D.length, data.length);
        const pad = (arr) => {
            const out = arr.map(([x, y]) => [x, y]);
            const last = out[out.length - 1] ?? [0, 0];
            while (out.length < n)
                out.push([...last]);
            return out;
        };
        this.from = pad(chart.points2D);
        this.to = pad(data);
    }
    interpolate(alpha) {
        const t = this.eased(alpha);
        this.chart.points2D = this.from.map(([x0, y0], i) => [interpolate(x0, this.to[i][0], t), interpolate(y0, this.to[i][1], t)]);
        this.chart.rebuild();
    }
    finish() {
        this.chart.points2D = this.to.slice(0, this.targetLen).map(([x, y]) => [x, y]);
        this.chart.rebuild();
    }
}
void Mobject;
void lerpVec;
void parseColor;
void ORIGIN;
void WHITE;
//# sourceMappingURL=charts.js.map