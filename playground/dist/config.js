// Global config — port of manim/_config.py (ManimConfig singleton).
// In Python, `from manim import config` gives a shared mutable config.
// Here `config` is a live singleton with the same field names.
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_FRAME_HEIGHT, DEFAULT_FRAME_RATE, DEFAULT_FRAME_WIDTH, DEFAULT_PIXEL_HEIGHT, DEFAULT_PIXEL_WIDTH, } from "./constants.js";
const QUALITY_MAP = {
    low: { pixel_width: 854, pixel_height: 480, frame_rate: 15 },
    medium: { pixel_width: 1280, pixel_height: 720, frame_rate: 30 },
    high: { pixel_width: 1920, pixel_height: 1080, frame_rate: 60 },
    fourk: { pixel_width: 3840, pixel_height: 2160, frame_rate: 60 },
    l: { pixel_width: 854, pixel_height: 480, frame_rate: 15 },
    m: { pixel_width: 1280, pixel_height: 720, frame_rate: 30 },
    h: { pixel_width: 1920, pixel_height: 1080, frame_rate: 60 },
    k: { pixel_width: 3840, pixel_height: 2160, frame_rate: 60 },
};
export class ManimConfig {
    constructor(opts = {}) {
        Object.defineProperty(this, "pixel_width", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: DEFAULT_PIXEL_WIDTH
        });
        Object.defineProperty(this, "pixel_height", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: DEFAULT_PIXEL_HEIGHT
        });
        Object.defineProperty(this, "frame_width", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: DEFAULT_FRAME_WIDTH
        });
        Object.defineProperty(this, "frame_height", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: DEFAULT_FRAME_HEIGHT
        });
        Object.defineProperty(this, "frame_rate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: DEFAULT_FRAME_RATE
        });
        Object.defineProperty(this, "background_color", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: DEFAULT_BACKGROUND_COLOR
        });
        Object.defineProperty(this, "background_opacity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "transparent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "frame_center", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [0, 0, 0]
        });
        Object.defineProperty(this, "disable_caching", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "quality", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "medium"
        });
        Object.defineProperty(this, "preview", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "save_last_frame", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "write_to_movie", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "output_file", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
        });
        Object.defineProperty(this, "media_dir", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "./media"
        });
        Object.defineProperty(this, "verbosity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "WARNING"
        });
        this.update(opts);
    }
    update(opts) {
        if (opts.quality && QUALITY_MAP[opts.quality]) {
            const q = QUALITY_MAP[opts.quality];
            this.pixel_width = q.pixel_width;
            this.pixel_height = q.pixel_height;
            this.frame_rate = q.frame_rate;
            this.quality = opts.quality;
        }
        for (const [k, v] of Object.entries(opts)) {
            if (k === "quality" && QUALITY_MAP[String(v)])
                continue;
            if (k === "frame_center" && Array.isArray(v)) {
                this.frame_center = [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0];
                continue;
            }
            this[k] = v;
        }
        return this;
    }
    get frame_size() {
        return [this.pixel_width, this.pixel_height];
    }
    get aspect_ratio() {
        return this.pixel_width / this.pixel_height;
    }
    /** Pixels per manim unit (x). */
    get pixelsPerUnitX() {
        return this.pixel_width / this.frame_width;
    }
    get pixelsPerUnitY() {
        return this.pixel_height / this.frame_height;
    }
    copy() {
        const c = new ManimConfig();
        Object.assign(c, JSON.parse(JSON.stringify({ ...this })));
        c.frame_center = [...this.frame_center];
        return c;
    }
}
/** Global shared config — `import { config } from "manim-ts"`. */
export const config = new ManimConfig();
export function setConfig(opts) {
    return config.update(opts);
}
//# sourceMappingURL=config.js.map