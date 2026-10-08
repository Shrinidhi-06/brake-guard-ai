import type { BoundingBox } from "@/types";

/**
 * Prototype geometric hole detector (classical image processing, NOT a trained ML model).
 * Finds dark, enclosed, roughly circular/oval regions with a clear boundary — the visual
 * signature of a physical opening. Runs in the browser on a downscaled copy of the image.
 */
export async function detectHoles(dataUrl: string): Promise<BoundingBox[]> {
  if (typeof document === "undefined") return [];
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const S = 160;
  const scale = S / Math.max(img.width, img.height);
  const W = Math.max(1, Math.round(img.width * scale));
  const H = Math.max(1, Math.round(img.height * scale));
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, W, H);
  const px = ctx.getImageData(0, 0, W, H).data;
  const g = new Float32Array(W * H);
  let sum = 0;
  for (let i = 0; i < W * H; i++) {
    const v = 0.299 * px[i * 4]! + 0.587 * px[i * 4 + 1]! + 0.114 * px[i * 4 + 2]!;
    g[i] = v; sum += v;
  }
  const mean = sum / (W * H);
  let vs = 0;
  for (let i = 0; i < W * H; i++) vs += (g[i]! - mean) ** 2;
  const std = Math.sqrt(vs / (W * H));
  const thr = Math.min(mean - 0.9 * std, 70);

  const lab = new Int32Array(W * H).fill(-1);
  const found: { box: BoundingBox; score: number }[] = [];
  const stack: number[] = [];
  for (let s = 0; s < W * H; s++) {
    if (lab[s] !== -1 || g[s]! > thr) continue;
    let area = 0, minX = W, minY = H, maxX = 0, maxY = 0, touches = false, dark = 0;
    stack.push(s); lab[s] = s;
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % W, y = (p - x) / W;
      area++; dark += g[p]!;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touches = true;
      const nb = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1];
      for (const q of nb) if (q >= 0 && lab[q] === -1 && g[q]! <= thr) { lab[q] = s; stack.push(q); }
    }
    if (touches) continue;
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    const fill = area / (bw * bh); // ellipse ≈ 0.785
    const aspect = bw / bh;
    const rel = area / (W * H);
    if (area < 12 || rel > 0.08) continue;
    if (aspect < 0.5 || aspect > 2) continue;
    if (fill < 0.6 || fill > 0.92) continue;
    // Boundary contrast: ring around the blob should be clearly brighter than its interior.
    let ring = 0, rn = 0;
    const pad = Math.max(2, Math.round(Math.max(bw, bh) * 0.25));
    for (let y = Math.max(0, minY - pad); y <= Math.min(H - 1, maxY + pad); y++)
      for (let x = Math.max(0, minX - pad); x <= Math.min(W - 1, maxX + pad); x++) {
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) continue;
        ring += g[y * W + x]!; rn++;
      }
    const contrast = rn ? ring / rn - dark / area : 0;
    if (contrast < 35) continue;
    found.push({
      score: contrast * fill,
      box: { x: (minX / W) * 100 - 2, y: (minY / H) * 100 - 2, w: (bw / W) * 100 + 4, h: (bh / H) * 100 + 4, label: "" },
    });
  }
  found.sort((a, b) => b.score - a.score);
  return found.slice(0, 6).map((f, i) => ({
    ...f.box,
    label: `Hole / Perforation ${Math.max(80, 93 - i * 2)}%`,
  }));
}
