'use strict';

/**
 * Generates icon.png — the marketplace icon, drawn from the palette.
 *
 * The mark is the water glyph: two wave strokes on the indigo ground, the upper
 * one in the hero teal and the lower one sunk toward the background, so the pair
 * carries the theme's whole idea — luminous teal over deep indigo — in a shape
 * that survives being scaled down to 32px in a marketplace list.
 *
 * Concentric depth rings were the first attempt and read as a loading spinner.
 *
 * PNG is written by hand — a theme has no business pulling an image library in
 * for one 512px square, and zlib is already in the standard library.
 *
 *   node src/icon.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { variants, mix } = require('./palette');

const SIZE = 512;
// Two destinations: the repo root for the extension manifest, and docs/ so the
// Pages site can reference it (anything outside docs/ is not published).
const OUT = path.join(__dirname, '..', 'icon.png');
const OUT_SITE = path.join(__dirname, '..', 'docs', 'icon.png');

const { neutrals: n, accents: a } = variants.dark;

// Two wave strokes. Fractions of SIZE so the mark scales with the canvas.
// The lower wave is mixed toward the background rather than just darkened: it
// should read as the same water seen deeper, not as a grey copy.
const WAVES = [
  { cy: 0.395, colour: a.teal, glow: 0.62 },
  { cy: 0.625, colour: mix(a.teal, n.base, 0.5), glow: 0.22 },
];

const AMPLITUDE = 0.058;
const WAVELENGTH = 0.66;
const THICKNESS = 0.072; // stroke width, so the cap radius is half this
const X0 = 0.17;
const X1 = 0.83;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Hermite smoothstep between two edges. */
function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

const parseHex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/**
 * Approximates a wave's centreline as a polyline. Four-pixel chords deviate
 * from this curvature by well under a tenth of a pixel, so treating the stroke
 * as a chain of segments is exact for drawing purposes.
 */
function waveSegments(cy) {
  const k = (2 * Math.PI) / (WAVELENGTH * SIZE);
  const amp = AMPLITUDE * SIZE;
  const x0 = X0 * SIZE;
  const x1 = X1 * SIZE;
  const pts = [];
  for (let x = x0; x < x1; x += 4) pts.push([x, cy * SIZE + amp * Math.sin(k * (x - x0))]);
  pts.push([x1, cy * SIZE + amp * Math.sin(k * (x1 - x0))]);

  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) segs.push([...pts[i], ...pts[i + 1]]);
  return segs;
}

/**
 * Distance in pixels from (x, y) to the nearest point on a polyline.
 *
 * Clamping the projection to each segment is what gives the stroke round caps,
 * and it stays continuous everywhere — an earlier version used a slope-corrected
 * vertical distance with a special case past the endpoints, and the mismatch
 * between the two formulas printed a visible seam up the icon at each cap.
 */
function distToSegments(x, y, segs) {
  let best = Infinity;
  for (let i = 0; i < segs.length; i++) {
    const [ax, ay, bx, by] = segs[i];
    const vx = bx - ax;
    const vy = by - ay;
    const wx = x - ax;
    const wy = y - ay;
    const len = vx * vx + vy * vy;
    let t = len ? (wx * vx + wy * vy) / len : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dx = wx - t * vx;
    const dy = wy - t * vy;
    const d = dx * dx + dy * dy;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

function render() {
  const px = Buffer.alloc(SIZE * SIZE * 4);
  const half = SIZE / 2;
  const aa = 1.2; // feather width in pixels
  const halfStroke = (THICKNESS * SIZE) / 2;

  const ocean = parseHex(n.crust);
  const deep = parseHex(n.base);
  const waves = WAVES.map((w) => ({ ...w, rgb: parseHex(w.colour), segs: waveSegments(w.cy) }));

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (x + 0.5 - half) / half;
      const dy = (y + 0.5 - half) / half;

      // Ground: a faint radial lift toward the centre so the square does not
      // read as flat black, deepest in the corners.
      const vignette = smoothstep(0.1, 1.15, Math.hypot(dx, dy));
      let col = deep.map((c, i) => c + (ocean[i] - c) * vignette);

      for (const w of waves) {
        const d = distToSegments(x + 0.5, y + 0.5, w.segs);

        // Glow first, so the stroke paints over its own halo rather than being
        // washed out by it — that inversion is what made the first draft look
        // like a hole ringed by light.
        const g = w.glow * Math.exp(-Math.pow(Math.max(0, d - halfStroke) / (0.075 * SIZE), 2));
        col = col.map((c, i) => clamp(c + w.rgb[i] * g * 0.55, 0, 255));

        const inside = 1 - smoothstep(halfStroke - aa, halfStroke + aa, d);
        if (inside > 0) col = col.map((c, i) => c + (w.rgb[i] - c) * inside);
      }

      const o = (y * SIZE + x) * 4;
      px[o] = col[0];
      px[o + 1] = col[1];
      px[o + 2] = col[2];
      px[o + 3] = 255;
    }
  }
  return px;
}

// -- Minimal PNG encoder ----------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(pixels, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  // Each scanline is prefixed with its filter type. Filter 0 (none) keeps this
  // simple; the bands compress well regardless.
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const png = encodePNG(render(), SIZE);
fs.writeFileSync(OUT, png);
fs.mkdirSync(path.dirname(OUT_SITE), { recursive: true });
fs.writeFileSync(OUT_SITE, png);
console.log(`wrote icon.png and docs/icon.png (${SIZE}×${SIZE}, ${(png.length / 1024).toFixed(1)} kB)`);
