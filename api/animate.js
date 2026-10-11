// Vercel serverless function — POST { prompt } -> { scene, blurb }
// The GROQ_API_KEY lives only in Vercel env vars (server-side), never shipped to the client.

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
    return res.status(500).json({ error: "GROQ_API_KEY not set in environment" });
  }

  const SYSTEM = `You are a router for a manim-ts (TypeScript Manim port) animation playground.
The playground has exactly 6 preset scenes. You must pick ONE scene key per user prompt:

- "CreateCircle"  — draws a circle, then a square, then the circle morphs into the square. Best for: shapes, circles, squares, morphing.
- "TextScene"     — writes a title, fades in a circle below, points at it. Best for: text, titles, writing, words, labels.
- "AxesPlot"      — draws axes, plots y = x^2, slides a dot along the curve. Best for: graphs, functions, plots, curves, math charts, parabolas.
- "LaggedExample" — grows 7 squares one after another in a lagged wave. Best for: sequences, waves, growing, step-by-step, rhythm.
- "TriangleChase" — draws a line path, fades in a triangle and a dot, moves the dot along the path. Best for: paths, chasing, movement along a line, triangles.
- "StarSpin"      — draws a ring, grows a star, spins it, wiggles it. Best for: stars, spinning, rotation, wiggles.

Also write a ONE-sentence plain-English blurb describing the animation, framed as what will happen on screen.

Respond with ONLY a JSON object (no markdown fences, no commentary):
{"scene": "<one of the 6 keys>", "blurb": "<one sentence>"}`;

  const url = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt.trim() },
        ],
      }),
    });

    if (!r.ok) {
      const body = await r.text().catch(() => "");
      return res.status(502).json({ error: `Groq API error (${r.status})`, detail: body.slice(0, 300) });
    }

    const out = await r.json();
    const text = out?.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    }

    const VALID = ["CreateCircle", "TextScene", "AxesPlot", "LaggedExample", "TriangleChase", "StarSpin"];
    if (!parsed || !VALID.includes(parsed.scene)) {
      return res.status(200).json({ scene: null, blurb: prompt });
    }

    return res.status(200).json({ scene: parsed.scene, blurb: String(parsed.blurb || prompt) });
  } catch (e) {
    return res.status(502).json({ error: "Groq request failed: " + (e?.message || String(e)) });
  }
}
