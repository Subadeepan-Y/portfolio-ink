// Canvas 2D renderer — the heart of this port (replaces manim's Cairo/OpenGL renderers).
// Renders any Mobject tree onto a standard CanvasRenderingContext2D.
import { VMobject, VGroup } from "../mobject/base.js";
import { Text, Tex, ImageMobject } from "../mobject/extras.js";
function ctxOf(c) {
    return c;
}
function isClosedPath(pts, eps = 1e-6) {
    if (pts.length < 2)
        return false;
    const a = pts[0];
    const b = pts[pts.length - 1];
    const dx = (a[0] ?? 0) - (b[0] ?? 0);
    const dy = (a[1] ?? 0) - (b[1] ?? 0);
    return dx * dx + dy * dy < eps * eps;
}
export class CanvasRenderer {
    constructor(camera, ctx) {
        Object.defineProperty(this, "camera", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "ctx", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.camera = camera;
        if (ctx)
            this.setContext(ctx);
    }
    setContext(ctx) {
        this.ctx = ctx;
        return this;
    }
    attachToCanvas(canvas) {
        const ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Could not get 2d context from canvas.");
        this.setContext(ctx);
        this.syncCanvasSize(canvas);
        return this.ctx;
    }
    syncCanvasSize(canvas) {
        if (canvas.width !== this.camera.pixelWidth)
            canvas.width = Math.round(this.camera.pixelWidth);
        if (canvas.height !== this.camera.pixelHeight)
            canvas.height = Math.round(this.camera.pixelHeight);
    }
    resize(pixelWidth, pixelHeight) {
        this.camera.pixelWidth = pixelWidth;
        this.camera.pixelHeight = pixelHeight;
        const canvas = this.ctx?.canvas;
        if (canvas)
            this.syncCanvasSize(canvas);
    }
    snapshot() {
        return this.toDataURL();
    }
    clear(background, opacity = 1) {
        const ctx = ctxOf(this.ctx);
        if (!ctx)
            return;
        const w = this.camera.pixelWidth;
        const h = this.camera.pixelHeight;
        ctx.save();
        ctx.globalAlpha = 1;
        if (background && opacity <= 0) {
            ctx.clearRect(0, 0, w, h);
        }
        else {
            ctx.fillStyle = background ?? this.camera.backgroundColor;
            ctx.globalAlpha = opacity;
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }
        ctx.restore();
    }
    render(mobjects, opts = {}) {
        const ctx = this.ctx;
        if (!ctx)
            return;
        this.clear(opts.backgroundColor, opts.backgroundOpacity ?? this.camera.backgroundOpacity);
        for (const m of mobjects)
            this.drawMobject(m);
    }
    drawMobject(m) {
        const ctx = ctxOf(this.ctx);
        if (!ctx)
            return;
        // Text leaf
        if (m instanceof Text) {
            this.drawText(m);
            // Text may still have submobjects? draw them too
            for (const s of m.submobjects)
                this.drawMobject(s);
            return;
        }
        // Image leaf
        if (m instanceof ImageMobject) {
            if (!this.drawImage(m))
                this.drawVMobject(m);
            for (const s of m.submobjects)
                this.drawMobject(s);
            return;
        }
        if (m instanceof VMobject) {
            this.drawVMobject(m);
        }
        // recurse (VGroup children, dots in graphs, arrows' tips, axes grids...)
        for (const s of m.submobjects)
            this.drawMobject(s);
    }
    drawVMobject(m) {
        const ctx = ctxOf(this.ctx);
        if (!ctx)
            return;
        const tuples = m.get_cubic_tuples();
        // Points-only mobjects (single anchor, e.g. ValueTracker) draw nothing.
        if (!tuples.length) {
            // A lone Dot-like with 1 point but no curves? render tiny disc if it has fill.
            if (m.points.length === 1 && (m.fillOpacity > 0 || m.strokeWidth > 0)) {
                const [px, py] = this.camera.manimToCanvas(m.points[0]);
                const r = Math.max(1.5, (m.strokeWidth > 0 ? m.strokeWidth : 4) * this.camera.strokeScale() * 0.5);
                ctx.save();
                ctx.beginPath();
                ctx.fillStyle = (m.fillColor ?? m.strokeColor).toStyle(m.fillOpacity > 0 ? m.fillOpacity : m.strokeOpacity);
                ctx.arc(px, py, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            return;
        }
        const cam = this.camera;
        ctx.save();
        ctx.lineCap = m.capStyle;
        ctx.lineJoin = m.jointType;
        ctx.beginPath();
        let firstAnchor = tuples[0][0];
        let [sx, sy] = cam.manimToCanvas(firstAnchor);
        ctx.moveTo(sx, sy);
        for (const [p0, p1, p2, p3] of tuples) {
            // Pen-up separator (p0≈p1≈p2): lift the pen, draw nothing.
            if (Math.abs(p0[0] - p1[0]) < 1e-9 && Math.abs(p0[1] - p1[1]) < 1e-9 &&
                Math.abs(p1[0] - p2[0]) < 1e-9 && Math.abs(p1[1] - p2[1]) < 1e-9) {
                const [jx, jy] = cam.manimToCanvas(p3);
                ctx.moveTo(jx, jy);
                sx = jx;
                sy = jy;
                continue;
            }
            // break detection: degenerate jump marker from start_new_path
            const [, , , prevEnd] = [null, null, null, null];
            void prevEnd;
            const [x1, y1] = cam.manimToCanvas(p1);
            const [x2, y2] = cam.manimToCanvas(p2);
            const [x3, y3] = cam.manimToCanvas(p3);
            // If p0 is far from current pen (disconnected subpath), moveTo instead.
            const [cx0, cy0] = cam.manimToCanvas(p0);
            const dx = cx0 - sx;
            // track pen manually: pen starts at sx,sy and ends at x3,y3
            void dx;
            ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
            sx = x3;
            sy = y3;
            void p0;
        }
        // fill
        if (m.fillColor && m.fillOpacity > 0) {
            ctx.fillStyle = m.fillColor.toStyle(m.fillOpacity);
            if (isClosedPath(m.points)) {
                ctx.closePath();
                ctx.fill();
            }
            else {
                // open paths: fill anyway with nonzero rule (matches cairo behavior closely enough)
                ctx.fill("nonzero");
            }
        }
        // background stroke (wider, behind)
        if (m.backgroundStrokeWidth > 0 && m.backgroundStrokeOpacity > 0) {
            ctx.strokeStyle = m.backgroundStrokeColor.toStyle(m.backgroundStrokeOpacity);
            ctx.lineWidth = m.backgroundStrokeWidth * cam.strokeScale();
            ctx.stroke();
            // need to re-trace path for foreground stroke since stroke() consumes? Canvas keeps path; safe to stroke again.
        }
        // foreground stroke
        if (m.strokeWidth > 0 && m.strokeOpacity > 0) {
            ctx.strokeStyle = m.strokeColor.toStyle(m.strokeOpacity);
            ctx.lineWidth = Math.max(0.5, m.strokeWidth * cam.strokeScale());
            ctx.stroke();
        }
        ctx.restore();
        void firstAnchor;
    }
    drawText(t) {
        const ctx = ctxOf(this.ctx);
        if (!ctx)
            return;
        const c = t.get_center();
        const [px, py] = this.camera.manimToCanvas(c);
        const pxHeight = Math.max(4, t.fontSize * (this.camera.pixelHeight / 720));
        ctx.save();
        ctx.globalAlpha = 1;
        const color = t.textColor
            ?? t.get_fill_color()
            ?? t.get_stroke_color();
        const opacity = Math.max(t.get_fill_opacity(), 0.999);
        ctx.fillStyle = color.toStyle(opacity);
        ctx.font = `${t.fontWeight ?? "normal"} ${pxHeight}px ${t.font}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const lines = t.text.split("\n");
        const lineH = pxHeight * 1.1;
        const y0 = py - ((lines.length - 1) * lineH) / 2;
        lines.forEach((ln, i) => ctx.fillText(ln, px, y0 + i * lineH));
        ctx.restore();
    }
    drawImage(m) {
        const ctx = ctxOf(this.ctx);
        if (!ctx)
            return false;
        const img = m.image;
        if (!img) {
            // not loaded yet — draw placeholder rect via VMobject path below
            return false;
        }
        const { min, max } = m.get_bounds();
        const [x0, y0] = this.camera.manimToCanvas([min[0], max[1], 0]);
        const [x1, y1] = this.camera.manimToCanvas([max[0], min[1], 0]);
        try {
            ctx.drawImage(img, x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
            return true;
        }
        catch {
            return false;
        }
    }
    /** Capture current canvas as data URL (browser). */
    toDataURL(type = "image/png") {
        const canvas = this.ctx?.canvas;
        if (canvas && typeof canvas.toDataURL === "function") {
            return canvas.toDataURL(type);
        }
        return null;
    }
}
void VGroup;
void Tex;
//# sourceMappingURL=canvas_renderer.js.map