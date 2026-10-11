// Serverless function — POST { prompt } -> { name, blurb, body }
// Uses server-side API key from environment to synthesize custom manim-ts scene code.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  const KEY = process.env.GROQ_API_KEY;
  if (!KEY) {
    return res.status(500).json({ error: "API key not configured in environment" });
  }

  const SYSTEM = `You are an expert manim-ts animation generator. Given any plain-English animation request from the user, you write custom JavaScript code for the body of \`async construct()\` inside a \`Scene\` subclass.

Available symbols in scope (already imported — DO NOT write import or export statements inside \`body\`):
- Shapes / Mobjects:
  - \`new Circle({ radius: 1.2, color: YELLOW, fill_color: GOLD, fill_opacity: 0.8, stroke_width: 4 })\`
  - \`new Square({ side_length: 2, color: BLUE, fill_color: BLUE, fill_opacity: 0.5 })\`
  - \`new Rectangle({ width: 3, height: 1.5, color: GREEN })\`
  - \`new RoundedRectangle({ width: 3, height: 1.5, corner_radius: 0.3, color: TEAL })\`
  - \`new Triangle({ color: YELLOW })\`
  - \`new RegularPolygon(6, { color: PURPLE })\`
  - \`new Polygon([x1,y1,0], [x2,y2,0], [x3,y3,0], { color: ORANGE })\`
  - \`new Star({ n: 5, outer_radius: 1.5, inner_radius: 0.65, color: YELLOW, fill_color: GOLD, fill_opacity: 0.8 })\`
  - \`new Ellipse({ width: 3, height: 1.5, color: PINK })\`
  - \`new Arc({ radius: 1.5, start_angle: 0, angle: PI, color: WHITE })\`
  - \`new Annulus({ inner_radius: 0.8, outer_radius: 1.5, color: GOLD })\`
  - \`new Line([x1, y1, 0], [x2, y2, 0], { color: YELLOW, stroke_width: 4 })\`
  - \`new DashedLine([x1, y1, 0], [x2, y2, 0], { color: GRAY })\`
  - \`new Arrow([x1, y1, 0], [x2, y2, 0], { color: RED })\`
  - \`new DoubleArrow([x1, y1, 0], [x2, y2, 0], { color: BLUE })\`
  - \`new Dot([x, y, 0], { radius: 0.12, color: RED })\`
  - \`new Text("Hello", { font_size: 48, color: WHITE })\`
  - \`new Axes({ x_range: [-4, 4, 1], y_range: [-3, 3, 1], x_length: 8, y_length: 5 })\` -> \`axes.plot((x) => Math.sin(x), { color: GREEN })\`, \`axes.c2p(x, y)\`
  - \`new NumberPlane()\`
  - \`new VGroup(...mobjects)\` (access children via \`group.submobjects\`)
- Mobject positioning & styling methods (chainable):
  - \`.move_to([x, y, 0])\`, \`.shift([dx, dy, 0])\`, \`.next_to(other, RIGHT, 0.5)\`, \`.to_edge(UP, 0.8)\`
  - \`.scale(factor)\`, \`.rotate(angle)\`, \`.set_color(COLOR)\`, \`.set_fill(COLOR, opacity)\`, \`.set_stroke(COLOR, opacity, width)\`
  - \` group.arrange(RIGHT, 0.3)\`
  - \`mobj.animate.move_to([x, y, 0]).build()\`, \`mobj.animate.scale(1.5).build()\`, \`mobj.animate.shift([1, 0, 0]).build()\`
- Animations (pass to \`await this.play(...)\`):
  - \`new Create(m)\`, \`new Uncreate(m)\`, \`new Write(m)\`, \`new DrawBorderThenFill(m)\`
  - \`new FadeIn(m)\`, \`new FadeOut(m)\`
  - \`new GrowFromCenter(m)\`, \`new GrowArrow(arrow)\`, \`new SpinInFromNothing(m)\`
  - \`new Transform(src, target)\`, \`new ReplacementTransform(src, target)\`
  - \`new Rotating(m, { angle: PI, about_point: ORIGIN, run_time: 1.5 })\`, \`new Rotate(m, PI / 2)\`
  - \`new MoveAlongPath(m, pathCurve, { run_time: 1.5 })\`
  - \`new Indicate(m, { color: YELLOW })\`, \`new Flash(m)\`, \`new Pulse(m)\`, \`new Wiggle(m)\`, \`new Circumscribe(m)\`
  - \`new LaggedStart(...anims, { lag_ratio: 0.12 })\`
- Scene methods:
  - \`await this.play(anim1, anim2, ...)\`
  - \`await this.wait(0.5)\`
- Constants & Math:
  - Colors: \`BLUE, RED, GREEN, YELLOW, ORANGE, GOLD, PINK, PURPLE, TEAL, MAROON, WHITE, GRAY\`
  - Directions: \`UP, DOWN, LEFT, RIGHT, ORIGIN, UL, UR, DL, DR\`
  - Math: \`PI, TAU, DEGREES, Math, add(v1, v2), sub(v1, v2), mulScalar(v, s)\`
  - Coordinate range visible on screen: X is roughly \`-6.5\` to \`6.5\`, Y is roughly \`-3.5\` to \`3.5\`.

Rules:
1. Build a visually rich, creative animation that directly depicts the user's prompt (3 to 5 \`await this.play(...)\` steps + a final \`await this.wait(0.5)\`).
2. For example, if the user asks for "sun rays", create a glowing central sun \`Circle\` with \`fill_color: GOLD, fill_opacity: 0.9\`, an outer halo \`Circle\`, and 12 radial \`Line\` rays around 360 degrees using \`Math.cos(a)\` and \`Math.sin(a)\` in a \`VGroup\`, animate them growing/creating with \`LaggedStart\`, then rotate the rays with \`Rotating\` and pulse/indicate the sun.
3. NEVER just return a generic star or circle if the user asked for something specific — compose the scene using geometric primitives, lines, circles, arcs, polygons, text, or graphs to match their exact topic.
4. Keep \`body\` valid JavaScript statements only (inside \`async construct()\`). No markdown fences, no \`import\`/\`export\`, no \`class\` wrapper in \`body\`.

Respond with ONLY a valid JSON object:
{
  "name": "PascalCaseSceneName",
  "blurb": "One short plain-English sentence describing what happens on screen.",
  "body": "const ...;\\nawait this.play(...);\\nawait this.wait(0.5);"
}`;

  const url = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        temperature: 0.3,
        max_completion_tokens: 2048,
        reasoning_effort: "low",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt.trim() },
        ],
      }),
    });

    if (!r.ok) {
      const errBody = await r.text().catch(() => "");
      return res.status(502).json({ error: `AI service error (${r.status})`, detail: errBody.slice(0, 300) });
    }

    const out = await r.json();
    const rawText = out?.choices?.[0]?.message?.content || "";
    const text = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    }

    if (!parsed || typeof parsed.body !== "string" || !parsed.body.trim()) {
      return res.status(502).json({ error: "AI returned an empty animation" });
    }

    const cleanName = String(parsed.name || "CustomScene").replace(/[^A-Za-z0-9_]/g, "") || "CustomScene";
    return res.status(200).json({
      name: cleanName,
      blurb: String(parsed.blurb || prompt),
      body: parsed.body.trim(),
    });
  } catch (e) {
    return res.status(502).json({ error: "AI request failed: " + (e?.message || String(e)) });
  }
}
