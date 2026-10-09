import { mobjectsToSvg } from "./svg.js";
export class SvgRenderer {
    constructor(camera) {
        Object.defineProperty(this, "camera", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lastSvg", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
        });
        this.camera = camera;
    }
    render(mobjects, opts = {}) {
        this.lastSvg = mobjectsToSvg(mobjects, this.camera, {
            background: opts.backgroundColor,
            backgroundOpacity: opts.backgroundOpacity,
        });
    }
    clear() {
        this.lastSvg = "";
    }
    resize(pixelWidth, pixelHeight) {
        this.camera.pixelWidth = pixelWidth;
        this.camera.pixelHeight = pixelHeight;
    }
    snapshot() {
        return this.lastSvg || null;
    }
}
//# sourceMappingURL=svg_renderer.js.map