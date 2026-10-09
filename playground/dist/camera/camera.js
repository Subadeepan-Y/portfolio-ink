import { config } from "../config.js";
export class Camera {
    constructor(opts = {}) {
        Object.defineProperty(this, "backgroundColor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "backgroundOpacity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "frameCenter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "frameWidth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "frameHeight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pixelWidth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pixelHeight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.backgroundColor = opts.background_color ?? config.background_color;
        this.backgroundOpacity = opts.background_opacity ?? config.background_opacity;
        const fc = opts.frame_center ?? config.frame_center;
        this.frameCenter = [fc[0] ?? 0, fc[1] ?? 0, fc[2] ?? 0];
        this.frameWidth = opts.frame_width ?? config.frame_width;
        this.frameHeight = opts.frame_height ?? config.frame_height;
        this.pixelWidth = opts.pixel_width ?? config.pixel_width;
        this.pixelHeight = opts.pixel_height ?? config.pixel_height;
    }
    reset() {
        this.frameCenter = [...config.frame_center];
        this.frameWidth = config.frame_width;
        this.frameHeight = config.frame_height;
        return this;
    }
    get pixelsPerUnitX() {
        return this.pixelWidth / this.frameWidth;
    }
    get pixelsPerUnitY() {
        return this.pixelHeight / this.frameHeight;
    }
    /** Manim coords -> canvas pixels (origin top-left, y down). */
    manimToCanvas(p) {
        const [x, y] = [p[0] ?? 0, p[1] ?? 0];
        const px = ((x - this.frameCenter[0] + this.frameWidth / 2) / this.frameWidth) * this.pixelWidth;
        const py = ((this.frameHeight / 2 - (y - this.frameCenter[1])) / this.frameHeight) * this.pixelHeight;
        return [px, py];
    }
    canvasToManim(px, py) {
        const x = (px / this.pixelWidth) * this.frameWidth - this.frameWidth / 2 + this.frameCenter[0];
        const y = this.frameHeight / 2 - (py / this.pixelHeight) * this.frameHeight + this.frameCenter[1];
        return [x, y, 0];
    }
    /** Scale factor converting manim stroke_width -> canvas px. */
    strokeScale() {
        return (this.pixelHeight / 1080) * 1.5;
    }
    copy() {
        const c = new Camera();
        c.backgroundColor = this.backgroundColor;
        c.backgroundOpacity = this.backgroundOpacity;
        c.frameCenter = [...this.frameCenter];
        c.frameWidth = this.frameWidth;
        c.frameHeight = this.frameHeight;
        c.pixelWidth = this.pixelWidth;
        c.pixelHeight = this.pixelHeight;
        return c;
    }
}
export class MovingCamera extends Camera {
    constructor(opts = {}) {
        super(opts);
        Object.defineProperty(this, "frame", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.frame = new MovingCameraFrame(this);
    }
}
/** The movable frame (manim's MovingCameraScene.camera.frame). Animatable via .animate. */
export class MovingCameraFrame {
    constructor(camera) {
        Object.defineProperty(this, "camera", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "center", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "width", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "height", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // duck-type Mobject bits so Scene.add(frame) doesn't crash if attempted
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
        this.camera = camera;
        this.center = [...camera.frameCenter];
        this.width = camera.frameWidth;
        this.height = camera.frameHeight;
    }
    get_center() { return [...this.center]; }
    get_width() { return this.width; }
    get_height() { return this.height; }
    move_to(p) {
        const v = [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0];
        this.center = v;
        this.sync();
        return this;
    }
    set_width(w) {
        const s = w / this.width;
        this.width = w;
        this.height *= s;
        this.sync();
        return this;
    }
    scale(s) {
        this.width *= s;
        this.height *= s;
        this.sync();
        return this;
    }
    sync() {
        this.camera.frameCenter = [...this.center];
        this.camera.frameWidth = this.width;
        this.camera.frameHeight = this.height;
    }
}
//# sourceMappingURL=camera.js.map