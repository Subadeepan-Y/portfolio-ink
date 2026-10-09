// Interactivity — a manim-ts exclusive. Python Manim renders offline; here
// scenes are alive: drag mobjects, bind sliders to ValueTrackers, react to
// hover and clicks, all in manim coordinates.
import { VMobject, VGroup, toVec3 } from "./mobject/base.js";
import { Line, Dot } from "./mobject/geometry.js";
import { Text, DecimalNumber, ValueTracker } from "./mobject/extras.js";
import { Scene } from "./scene/scene.js";
import { ORIGIN } from "./constants.js";
function flattenOutline(m, samplesPerCurve = 8) {
    const out = [];
    for (const [p0, p1, p2, p3] of m.get_cubic_tuples()) {
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
function pointInRing(p, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i];
        const b = poly[j];
        if (p[1] < Math.min(a[1], b[1]) || p[1] >= Math.max(a[1], b[1]))
            continue;
        const x = a[0] + ((p[1] - a[1]) * (b[0] - a[0])) / (b[1] - a[1] || 1e-18);
        if (x > p[0])
            inside = !inside;
    }
    return inside;
}
export class InteractiveScene extends Scene {
    constructor(canvasOrCtx, opts = {}) {
        // Event-only surfaces (test mocks) carry listeners but no 2D context —
        // keep those away from the renderer and wire events only.
        const isEventOnly = !!canvasOrCtx &&
            typeof canvasOrCtx.addEventListener === "function" &&
            typeof canvasOrCtx.getContext !== "function";
        super(isEventOnly ? null : (canvasOrCtx ?? null), opts);
        /** Event surface (usually the same <canvas> being rendered to). */
        Object.defineProperty(this, "eventSurface", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "downHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        Object.defineProperty(this, "moveHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        Object.defineProperty(this, "upHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        Object.defineProperty(this, "hoverTarget", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "boundDown", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "boundMove", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "boundUp", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        if (canvasOrCtx && typeof canvasOrCtx.addEventListener === "function") {
            this.attach(canvasOrCtx);
        }
    }
    /** Wire pointer events. Move/up listen on window when available (drag continues off-canvas). */
    attach(surface) {
        this.detach();
        this.eventSurface = surface;
        const wb = typeof window !== "undefined" && typeof window.addEventListener === "function"
            ? window
            : surface;
        this.boundDown = (e) => this.emit(this.downHandlers, e);
        this.boundMove = (e) => this.emit(this.moveHandlers, e);
        this.boundUp = (e) => this.emit(this.upHandlers, e);
        surface.addEventListener("pointerdown", this.boundDown);
        wb.addEventListener("pointermove", this.boundMove);
        wb.addEventListener("pointerup", this.boundUp);
        return this;
    }
    detach() {
        if (this.eventSurface && this.boundDown) {
            this.eventSurface.removeEventListener("pointerdown", this.boundDown);
        }
        const wb = typeof window !== "undefined" && typeof window.removeEventListener === "function"
            ? window
            : this.eventSurface;
        if (wb && this.boundMove)
            wb.removeEventListener("pointermove", this.boundMove);
        if (wb && this.boundUp)
            wb.removeEventListener("pointerup", this.boundUp);
        this.eventSurface = null;
        return this;
    }
    emit(handlers, e) {
        if (!this.eventSurface)
            return;
        const p = this.manimFromEvent(e);
        for (const h of [...handlers])
            h(p, e);
    }
    /** Client-pixel event → manim coordinates (handles CSS scaling). */
    manimFromEvent(e) {
        const s = this.eventSurface;
        const rect = s.getBoundingClientRect();
        const sx = s.width / Math.max(1, rect.width);
        const sy = s.height / Math.max(1, rect.height);
        return this.camera.canvasToManim((e.clientX - rect.left) * sx, (e.clientY - rect.top) * sy);
    }
    manim_from_event(e) {
        return this.manimFromEvent(e);
    }
    /** Deepest mobject under a manim point (topmost wins; filled shapes use exact outline test). */
    pick(point) {
        const p = toVec3(point);
        for (let i = this.mobjects.length - 1; i >= 0; i--) {
            const hit = this.deepPick(this.mobjects[i], p);
            if (hit)
                return hit;
        }
        return null;
    }
    deepPick(m, p) {
        for (let i = m.submobjects.length - 1; i >= 0; i--) {
            const hit = this.deepPick(m.submobjects[i], p);
            if (hit)
                return hit;
        }
        return this.hits(m, p) ? m : null;
    }
    hits(m, p) {
        const { min, max } = m.get_bounds();
        if (p[0] < min[0] || p[0] > max[0] || p[1] < min[1] || p[1] > max[1])
            return false;
        if (m instanceof VMobject && m.fillOpacity > 0) {
            const ring = flattenOutline(m);
            if (ring.length >= 3)
                return pointInRing(p, ring);
        }
        return true;
    }
    onPointerDown(h) {
        this.downHandlers.add(h);
        return () => void this.downHandlers.delete(h);
    }
    onPointerMove(h) {
        this.moveHandlers.add(h);
        return () => void this.moveHandlers.delete(h);
    }
    onPointerUp(h) {
        this.upHandlers.add(h);
        return () => void this.upHandlers.delete(h);
    }
    /** Hover enter/leave hooks for a mobject (checked on every pointer move). */
    onHover(m, enter, leave) {
        return this.onPointerMove((p) => {
            const hit = this.pick(p) === m;
            if (hit && this.hoverTarget !== m) {
                this.hoverTarget = m;
                enter();
            }
            else if (!hit && this.hoverTarget === m) {
                this.hoverTarget = null;
                leave();
            }
        });
    }
    /** Make a mobject draggable. Returns a controller with `detach()`. */
    makeDraggable(target, opts = {}) {
        return new Draggable(this, target, opts);
    }
    make_draggable(target, opts = {}) {
        return this.makeDraggable(target, opts);
    }
}
export class Draggable {
    constructor(scene, target, opts = {}) {
        Object.defineProperty(this, "scene", {
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
        Object.defineProperty(this, "opts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "dragging", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "grabOffset", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [0, 0, 0]
        });
        Object.defineProperty(this, "offs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.scene = scene;
        this.target = target;
        this.opts = opts;
        this.offs.push(scene.onPointerDown((p) => {
            const hit = scene.pick(p);
            if (hit !== target && !(hit && target.family.includes(hit)))
                return;
            this.dragging = true;
            const c = target.get_center();
            this.grabOffset = [c[0] - p[0], c[1] - p[1], c[2] - p[2]];
            if (opts.bringToFront ?? true)
                scene.bring_to_front(target);
            opts.onGrab?.();
        }), scene.onPointerMove((p) => {
            if (!this.dragging)
                return;
            let want = [p[0] + this.grabOffset[0], p[1] + this.grabOffset[1], p[2] + this.grabOffset[2]];
            if (opts.constrain)
                want = opts.constrain(want);
            target.move_to(want);
            scene.render_frame();
            opts.onDrag?.(target.get_center());
        }), scene.onPointerUp(() => {
            if (!this.dragging)
                return;
            this.dragging = false;
            opts.onRelease?.();
        }));
    }
    detach() {
        for (const off of this.offs)
            off();
        this.offs = [];
        this.dragging = false;
    }
}
/** Horizontal slider bound to a ValueTracker (drag the knob, read the value). */
export class Slider extends VGroup {
    constructor(opts = {}) {
        super();
        Object.defineProperty(this, "tracker", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "knob", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "track", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "readout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "min", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "max", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "changeHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        Object.defineProperty(this, "drag", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.min = opts.min ?? 0;
        this.max = opts.max ?? 1;
        const len = opts.length ?? 4;
        const x0 = -len / 2;
        const x1 = len / 2;
        this.tracker = new ValueTracker(opts.value ?? this.min);
        this.track = new Line([x0, 0, 0], [x1, 0, 0], {
            stroke_color: opts.track_color,
            stroke_width: 6,
        });
        this.knob = new Dot([x0, 0, 0], {
            radius: 0.18,
            fill_color: opts.knob_color,
            fill_opacity: 1,
            stroke_width: 0,
        });
        this.readout = new DecimalNumber(this.tracker.get_value(), { font_size: 30 });
        this.readout.next_to(this.knob, [0, 1, 0], 0.25);
        this.readout.add_updater(() => {
            this.readout.set_value(this.tracker.get_value());
            this.readout.next_to(this.knob, [0, 1, 0], 0.25);
        });
        const caption = opts.label ? new Text(opts.label, { font_size: opts.font_size ?? 28 }) : null;
        if (caption) {
            caption.next_to(this.track, [0, -1, 0], 0.4);
            this.add(caption);
        }
        this.add(this.track, this.knob, this.readout);
        this.set_value(this.tracker.get_value());
    }
    get_value() {
        return this.tracker.get_value();
    }
    getValue() {
        return this.get_value();
    }
    set_value(v) {
        const t = Math.min(1, Math.max(0, (v - this.min) / (this.max - this.min || 1)));
        const c = this.track.get_center();
        const half = this.track.get_length() / 2;
        this.knob.move_to([c[0] - half + t * half * 2, c[1], 0]);
        this.tracker.set_value(this.min + t * (this.max - this.min));
        this.readout.set_value(this.tracker.get_value());
        this.readout.next_to(this.knob, [0, 1, 0], 0.25);
        for (const h of this.changeHandlers)
            h(this.tracker.get_value());
        return this;
    }
    setValue(v) {
        return this.set_value(v);
    }
    on_change(h) {
        this.changeHandlers.add(h);
        return () => void this.changeHandlers.delete(h);
    }
    onChange(h) {
        return this.on_change(h);
    }
    /** Constrain-drag the knob along the track; keeps tracker + readout in sync. */
    attach(scene) {
        const geom = () => ({
            c: this.track.get_center(),
            half: this.track.get_length() / 2,
        });
        const sync = () => {
            const { c, half } = geom();
            const t = (this.knob.get_center()[0] - (c[0] - half)) / (half * 2 || 1);
            this.tracker.set_value(this.min + t * (this.max - this.min));
            this.readout.set_value(this.tracker.get_value());
            this.readout.next_to(this.knob, [0, 1, 0], 0.25);
            for (const h of this.changeHandlers)
                h(this.tracker.get_value());
        };
        this.drag = new Draggable(scene, this.knob, {
            constrain: (p) => {
                const { c, half } = geom();
                const x = Math.min(c[0] + half, Math.max(c[0] - half, p[0]));
                return [x, c[1], 0];
            },
            onDrag: sync,
        });
        return this;
    }
    detach() {
        this.drag?.detach();
        this.drag = null;
        return this;
    }
}
void ORIGIN;
//# sourceMappingURL=interaction.js.map