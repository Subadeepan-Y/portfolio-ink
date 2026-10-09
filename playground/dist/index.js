// manim-ts public API — mirrors `from manim import *` (Manim Community Edition).
//
// Python:  from manim import Scene, Circle, Create, FadeIn, UP, config
// TypeScript:
//   import { Scene, Circle, Create, FadeIn, UP, config } from "manim-ts";
//   class MyScene extends Scene {
//     async construct() {
//       const c = new Circle({ radius: 1, color: BLUE });
//       await this.play(new Create(c));
//       await this.wait(1);
//     }
//   }
export * from "./constants.js";
export * from "./config.js";
export * from "./utils/math.js";
export * from "./utils/color.js";
export * from "./utils/springs.js";
export * from "./mobject/base.js";
export * from "./mobject/geometry.js";
export * from "./mobject/extras.js";
export * from "./mobject/advanced.js";
export * from "./mobject/charts.js";
export * from "./animation/all.js";
export * from "./animation/missing.js";
export * from "./camera/camera.js";
export * from "./interaction.js";
export * from "./renderer/canvas_renderer.js";
export * from "./renderer/renderer.js";
export * from "./renderer/svg.js";
export * from "./renderer/svg_renderer.js";
export * from "./scene/scene.js";
// Handy default-scene runner for single-file examples:
//   import { runScene } from "manim-ts";
//   await runScene(MyScene, document.querySelector("canvas")!);
export async function runScene(SceneClass, canvas, opts = {}) {
    const { Scene } = await import("./scene/scene.js");
    return Scene.renderScene(SceneClass, canvas, opts);
}
//# sourceMappingURL=index.js.map