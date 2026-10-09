import { VMobject } from "../mobject/base.js";
import { Text, ImageMobject } from "../mobject/extras.js";
function esc(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
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
function fmtFactory(decimals) {
    return (n) => {
        const v = +n.toFixed(decimals);
        return Object.is(v, -0) ? "0" : String(v);
    };
}
function vmobjectPath(m, camera, f) {
    const tuples = m.get_cubic_tuples();
    if (!tuples.length)
        return "";
    let d = "";
    const [sx, sy] = camera.manimToCanvas(tuples[0][0]);
    d += `M ${f(sx)} ${f(sy)}`;
    for (const [, p1, p2, p3] of tuples) {
        const [x1, y1] = camera.manimToCanvas(p1);
        const [x2, y2] = camera.manimToCanvas(p2);
        const [x3, y3] = camera.manimToCanvas(p3);
        d += ` C ${f(x1)} ${f(y1)} ${f(x2)} ${f(y2)} ${f(x3)} ${f(y3)}`;
    }
    if (isClosedPath(m.points))
        d += " Z";
    const attrs = [`d="${d}"`];
    if (m.fillColor && m.fillOpacity > 0) {
        attrs.push(`fill="${m.fillColor.toHex()}"`);
        if (m.fillOpacity < 1)
            attrs.push(`fill-opacity="${f(m.fillOpacity)}"`);
    }
    else {
        attrs.push(`fill="none"`);
    }
    if (m.strokeWidth > 0 && m.strokeOpacity > 0) {
        attrs.push(`stroke="${m.strokeColor.toHex()}"`);
        if (m.strokeOpacity < 1)
            attrs.push(`stroke-opacity="${f(m.strokeOpacity)}"`);
        attrs.push(`stroke-width="${f(Math.max(0.5, m.strokeWidth * camera.strokeScale()))}"`);
        attrs.push(`stroke-linecap="${m.capStyle}"`);
        attrs.push(`stroke-linejoin="${m.jointType}"`);
    }
    else {
        attrs.push(`stroke="none"`);
    }
    return `<path ${attrs.join(" ")}/>`;
}
function textSvg(t, camera, f) {
    const c = t.get_center();
    const [px, py] = camera.manimToCanvas(c);
    const pxHeight = Math.max(4, t.fontSize * (camera.pixelHeight / 720));
    const color = t.textColor ??
        t.get_fill_color() ??
        t.get_stroke_color();
    const opacity = Math.max(t.get_fill_opacity(), 0.999);
    const lines = t.text.split("\n");
    const lineH = pxHeight * 1.1;
    const y0 = py - ((lines.length - 1) * lineH) / 2;
    const spans = lines
        .map((ln, i) => `<tspan x="${f(px)}" dy="${i === 0 ? f(y0 - py) : f(lineH)}">${esc(ln)}</tspan>`)
        .join("");
    const attrs = [
        `x="${f(px)}"`,
        `y="${f(py)}"`,
        `text-anchor="middle"`,
        `dominant-baseline="middle"`,
        `font-family="${esc(t.font)}"`,
        `font-size="${f(pxHeight)}"`,
        `font-weight="${t.fontWeight ?? "normal"}"`,
        `fill="${color.toHex()}"`,
    ];
    if (opacity < 1)
        attrs.push(`fill-opacity="${f(opacity)}"`);
    return `<text ${attrs.join(" ")}>${spans}</text>`;
}
function mobjectSvg(m, camera, f) {
    if (m instanceof Text) {
        const self = textSvg(m, camera, f);
        const kids = m.submobjects.map((s) => mobjectSvg(s, camera, f)).join("");
        return kids ? `<g>${self}${kids}</g>` : self;
    }
    if (m instanceof ImageMobject) {
        const img = m;
        if (img.url) {
            const { min, max } = m.get_bounds();
            const [x0, y0] = camera.manimToCanvas([min[0], max[1], 0]);
            const [x1, y1] = camera.manimToCanvas([max[0], min[1], 0]);
            return `<image href="${esc(img.url)}" x="${f(x0)}" y="${f(y0)}" width="${f(Math.max(1, x1 - x0))}" height="${f(Math.max(1, y1 - y0))}"/>`;
        }
        // No URL — fall through to the placeholder rectangle path below.
    }
    if (m instanceof VMobject) {
        const self = vmobjectPath(m, camera, f);
        const kids = m.submobjects.map((s) => mobjectSvg(s, camera, f)).join("");
        if (!self)
            return kids ? `<g>${kids}</g>` : "";
        return kids ? `<g>${self}${kids}</g>` : self;
    }
    const kids = m.submobjects.map((s) => mobjectSvg(s, camera, f)).join("");
    return kids ? `<g>${kids}</g>` : "";
}
/** Render mobjects to a standalone SVG document string. */
export function mobjectsToSvg(mobjects, camera, opts = {}) {
    const W = Math.round(camera.pixelWidth);
    const H = Math.round(camera.pixelHeight);
    const f = fmtFactory(opts.decimals ?? 2);
    const bg = opts.background === undefined ? camera.backgroundColor : opts.background;
    const bgOpacity = opts.backgroundOpacity ?? 1;
    const parts = [];
    if (bg && bgOpacity > 0) {
        const op = bgOpacity < 1 ? ` fill-opacity="${f(bgOpacity)}"` : "";
        parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="${esc(bg)}"${op}/>`);
    }
    for (const m of mobjects) {
        const s = mobjectSvg(m, camera, f);
        if (s)
            parts.push(s);
    }
    return (`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" ` +
        `viewBox="0 0 ${W} ${H}">${parts.join("")}</svg>`);
}
//# sourceMappingURL=svg.js.map