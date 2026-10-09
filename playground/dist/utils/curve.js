const EPS = 1e-9;
function d2(a, b) {
    const dx = (a[0] ?? 0) - (b[0] ?? 0);
    const dy = (a[1] ?? 0) - (b[1] ?? 0);
    const dz = (a[2] ?? 0) - (b[2] ?? 0);
    return dx * dx + dy * dy + dz * dz;
}
function v3(p) {
    return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0];
}
/**
 * Split flat points into cubic tuples, auto-detecting 4-per-cubic vs
 * shared-anchor layout by junction continuity (separators connect by
 * construction, so they validate transparently). Falls back to a greedy
 * stride walk for mixed/legacy arrays.
 */
export function chunkCubics(points) {
    const n = points.length;
    if (n < 4)
        return [];
    const four = (i) => [points[i], points[i + 1], points[i + 2], points[i + 3]];
    if (n % 4 === 0 && junctionsClean(points, 4)) {
        const out = [];
        for (let i = 0; i + 3 < n; i += 4)
            out.push(four(i));
        return out;
    }
    if ((n - 1) % 3 === 0 && junctionsClean(points, 3)) {
        const out = [];
        for (let i = 0; i + 3 < n; i += 3)
            out.push(four(i));
        return out;
    }
    // Last resort: greedy stride walk that also steps over 4-wide
    // duplicate-anchor separators.
    const out = [];
    let i = 0;
    while (i + 3 < n) {
        const c = four(i);
        out.push(c);
        if (isJumpCubic(c) && i + 4 < n && d2(points[i + 3], points[i + 4]) < EPS * EPS)
            i += 4;
        else
            i += 3;
    }
    return out;
}
/** True when every `step`-grid junction connects end-to-start. */
function junctionsClean(points, step) {
    const n = points.length;
    for (let i = 0; i + step < n; i += step) {
        if (d2(points[i + step - 1], points[i + step]) > 1e-12)
            return false;
    }
    return true;
}
/**
 * Pen-up separator: first three points coincide (p3 = jump target).
 * Preserved exactly by affine transforms and lerps, so runs survive morphs.
 */
export function isJumpCubic(c, eps = EPS) {
    return d2(c[0], c[1]) < eps * eps && d2(c[1], c[2]) < eps * eps;
}
/**
 * Split flat points into connected runs (separators dropped, disconnected
 * junctions also split). Each run is a flat point array.
 */
export function splitSubpaths(points, eps = EPS) {
    const runs = [];
    let cur = [];
    const pushRun = () => {
        if (cur.length)
            runs.push(cur);
        cur = [];
    };
    const cubics = chunkCubics(points);
    if (!cubics.length) {
        if (points.length)
            runs.push(points.map((p) => [...p]));
        return runs;
    }
    cubics.forEach((c, i) => {
        if (isJumpCubic(c, eps)) {
            pushRun();
            return;
        }
        if (cur.length) {
            const prevEnd = cur[cur.length - 1];
            if (d2(prevEnd, c[0]) > eps * eps)
                pushRun(); // disconnected junction
        }
        if (!cur.length)
            cur.push(v3(c[0]), v3(c[1]), v3(c[2]), v3(c[3]));
        else
            cur.push(v3(c[1]), v3(c[2]), v3(c[3]));
    });
    pushRun();
    return runs;
}
/** Point on a cubic at t. */
export function cubicPoint(c, t) {
    const [p0, p1, p2, p3] = c;
    const mt = 1 - t;
    return [
        mt ** 3 * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t ** 3 * p3[0],
        mt ** 3 * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t ** 3 * p3[1],
        mt ** 3 * p0[2] + 3 * mt * mt * t * p1[2] + 3 * mt * t * t * p2[2] + t ** 3 * p3[2],
    ];
}
/** Arc length of one cubic (jumps contribute 0). */
export function cubicLength(c, samples = 16) {
    if (isJumpCubic(c))
        return 0;
    let len = 0;
    let prev = cubicPoint(c, 0);
    for (let i = 1; i <= samples; i++) {
        const p = cubicPoint(c, i / samples);
        len += Math.sqrt(d2(prev, p));
        prev = p;
    }
    return len;
}
/**
 * Evenly spaced samples (count points, endpoints included) over flat points,
 * parameterized by true arc length. Jump separators are skipped (zero length).
 */
export function resampleEven(points, count) {
    const cubics = chunkCubics(points).filter((c) => !isJumpCubic(c));
    if (count <= 0)
        return [];
    if (!cubics.length) {
        const p = points.length ? v3(points[0]) : [0, 0, 0];
        return Array.from({ length: count }, () => [...p]);
    }
    if (count === 1)
        return [cubicPoint(cubics[0], 0)];
    const lens = cubics.map((c) => cubicLength(c));
    const total = lens.reduce((a, b) => a + b, 0);
    if (total < 1e-12) {
        const p = cubicPoint(cubics[0], 0);
        return Array.from({ length: count }, () => [...p]);
    }
    const out = [];
    let ci = 0;
    let acc = 0;
    for (let k = 0; k < count; k++) {
        const s = (total * k) / (count - 1);
        while (ci < cubics.length - 1 && acc + lens[ci] < s) {
            acc += lens[ci];
            ci++;
        }
        const local = lens[ci] < 1e-12 ? 0 : (s - acc) / lens[ci];
        out.push(cubicPoint(cubics[ci], Math.min(1, Math.max(0, local))));
    }
    return out;
}
/** Catmull-Rom samples → smooth cubic chain (shared-anchor layout). */
export function smoothFitPoints(samples) {
    const P = samples.map(v3);
    if (P.length < 2)
        return P.map((p) => [...p]);
    if (P.length === 2) {
        const [a, b] = P;
        return [
            [...a],
            [a[0] + ((b[0] - a[0]) / 3), a[1] + ((b[1] - a[1]) / 3), a[2] + ((b[2] - a[2]) / 3)],
            [a[0] + ((2 * (b[0] - a[0])) / 3), a[1] + ((2 * (b[1] - a[1])) / 3), a[2] + ((2 * (b[2] - a[2])) / 3)],
            [...b],
        ];
    }
    const pts = [[...P[0]]];
    for (let i = 0; i < P.length - 1; i++) {
        const p0 = P[Math.max(0, i - 1)];
        const p1 = P[i];
        const p2 = P[i + 1];
        const p3 = P[Math.min(P.length - 1, i + 2)];
        pts.push([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p1[2] + (p2[2] - p0[2]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[2] - (p3[2] - p1[2]) / 6], [...p2]);
    }
    return pts;
}
/**
 * Join runs with pen-up separators. The separator is exactly 3 points
 * ([prevEnd ×2, nextStart]) so the joined array stays stride-clean and
 * chunking keeps working; the renderer lifts the pen at such cubics.
 */
export function joinSubpaths(runs) {
    const out = [];
    runs.forEach((run) => {
        if (!run.length)
            return;
        if (out.length) {
            const pe = v3(out[out.length - 1]);
            const ns = v3(run[0]);
            out.push([...pe], [...pe], [...ns]);
        }
        for (const p of run)
            out.push([...p]);
    });
    return out;
}
function fitRun(run, samples) {
    return smoothFitPoints(resampleEven(run, samples));
}
/**
 * Fit two point sets for jitter-free morphing: split into subpath runs,
 * pair runs by order, resample each pair evenly by arc length, refit smooth
 * cubics, rejoin with separators. Returns fresh { src, tgt } with identical
 * counts, plus `paired` (true when multi-run pairing applied — callers must
 * NOT cyclically realign those, it would break run correspondence).
 */
export function morphPair(srcPts, tgtPts) {
    const srcRuns = splitSubpaths(srcPts);
    const tgtRuns = splitSubpaths(tgtPts);
    if (srcRuns.length > 1 && srcRuns.length === tgtRuns.length) {
        const srcFitted = [];
        const tgtFitted = [];
        srcRuns.forEach((run, i) => {
            const other = tgtRuns[i];
            const ka = Math.max(2, chunkCubics(run).length);
            const kb = Math.max(2, chunkCubics(other).length);
            const K = Math.min(256, Math.max(16, 4 * Math.max(ka, kb)));
            srcFitted.push(fitRun(run, K));
            tgtFitted.push(fitRun(other, K));
        });
        return { src: joinSubpaths(srcFitted), tgt: joinSubpaths(tgtFitted), paired: true };
    }
    const ka = Math.max(2, chunkCubics(srcPts).length);
    const kb = Math.max(2, chunkCubics(tgtPts).length);
    const K = Math.min(256, Math.max(16, 4 * Math.max(ka, kb)));
    return { src: fitRun(srcPts, K), tgt: fitRun(tgtPts, K), paired: false };
}
//# sourceMappingURL=curve.js.map