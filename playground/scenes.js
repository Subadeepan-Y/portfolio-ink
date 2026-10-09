// Scene definitions for the portfolio playground — JS ports of manim-ts/examples.
import {
  Scene, Circle, Square, Triangle, Star, Line, Arrow, Dot,
  Text, MathTex, Axes, VGroup,
  Create, Write, FadeIn, FadeOut, Transform, ReplacementTransform,
  GrowFromCenter, Indicate, Wiggle, Rotating, LaggedStart, MoveAlongPath,
  add,
  BLUE, RED, GREEN, YELLOW, WHITE, UP, DOWN, LEFT, RIGHT,
} from "./dist/index.js";

export class CreateCircle extends Scene {
  async construct() {
    const circle = new Circle({ radius: 1.5, color: BLUE });
    const square = new Square({ side_length: 2.5, color: RED });
    square.next_to(circle, RIGHT, 1);

    await this.play(new Create(circle));
    await this.play(new Create(square));
    await this.play(new Transform(circle, square));
    await this.wait(0.8);
  }
}

export class TextScene extends Scene {
  async construct() {
    const title = new Text("Manim in TypeScript", { font_size: 56, color: WHITE });
    title.to_edge(UP, 1);
    const circle = new Circle({ radius: 1.2, color: YELLOW });
    circle.to_edge(DOWN, 1.5);

    await this.play(new Write(title));
    await this.play(new FadeIn(circle, { scale: 0.5 }));
    await this.play(new Indicate(circle));
    await this.wait(0.8);
  }
}

export class AxesPlot extends Scene {
  async construct() {
    const axes = new Axes({
      x_range: [-3, 3, 1],
      y_range: [-2, 8, 2],
      x_length: 10,
      y_length: 5,
    });
    const graph = axes.plot((x) => x * x, { color: GREEN });
    const dot = new Dot(axes.c2p(1, 1), { radius: 0.1, color: RED });

    await this.play(new Create(axes));
    await this.play(new Create(graph));
    await this.play(new FadeIn(dot, { scale: 1.5 }));
    await this.play(dot.animate.move_to(axes.c2p(2, 4)).build());
    await this.wait(0.8);
  }
}

export class LaggedExample extends Scene {
  async construct() {
    const group = new VGroup(
      ...Array.from({ length: 7 }, () => new Square({ side_length: 0.7, color: BLUE }))
    );
    group.arrange(RIGHT, 0.3);
    await this.play(
      new LaggedStart(
        ...group.submobjects.map((s) => new GrowFromCenter(s)),
        { lag_ratio: 0.15 }
      )
    );
    await this.wait(0.6);
  }
}

export class TriangleChase extends Scene {
  async construct() {
    const tri = new Triangle({ color: YELLOW }).scale(0.8);
    const dot = new Dot(undefined, { radius: 0.14, color: RED });
    dot.move_to(tri.get_center());
    const start = tri.get_center();
    const path = new Line(start, add(start, [4, 1, 0]), { color: BLUE });

    await this.play(new Create(path));
    await this.play(new FadeIn(tri), new FadeIn(dot));
    await this.play(new MoveAlongPath(dot, path));
    await this.play(new Indicate(tri));
    await this.wait(0.6);
  }
}

export class StarSpin extends Scene {
  async construct() {
    const star = new Star({ color: YELLOW, n: 5 }).scale(1.4);
    const ring = new Circle({ radius: 2.4, color: GREEN });
    await this.play(new Create(ring));
    await this.play(new GrowFromCenter(star));
    await this.play(new Rotating(star, { angle: Math.PI * 2, about_point: star.get_center() }));
    await this.play(new Wiggle(star));
    await this.wait(0.6);
  }
}