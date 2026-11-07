'use strict';

/** Colour measurement shared by the build audit and the preview generator. */

const srgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

const linearize = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/** WCAG 2.1 relative luminance. */
function luminance(hex) {
  const [r, g, b] = srgb(hex).map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1..21. */
function contrast(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** sRGB to CIELAB, D65. */
function lab(hex) {
  const [r, g, b] = srgb(hex).map(linearize);
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** CIE76 colour difference. Rough, but adequate for "can these two be told apart". */
function deltaE(a, b) {
  const [l1, a1, b1] = lab(a);
  const [l2, a2, b2] = lab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/**
 * CIEDE2000 colour difference. Much closer to perception than CIE76, which
 * overstates gaps between saturated colours — so this is the metric used for
 * the colour-vision check, where the margins are small.
 */
function deltaE2000(c1, c2) {
  const [L1, a1, b1] = lab(c1);
  const [L2, a2, b2] = lab(c2);
  const rad = Math.PI / 180;
  const Cbar = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7)));
  const [a1p, a2p] = [a1 * (1 + G), a2 * (1 + G)];
  const [C1p, C2p] = [Math.hypot(a1p, b1), Math.hypot(a2p, b2)];
  const hue = (b, a) => (a === 0 && b === 0 ? 0 : (Math.atan2(b, a) / rad + 360) % 360);
  const [h1p, h2p] = [hue(b1, a1p), hue(b2, a2p)];

  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);

  const Lbp = (L1 + L2) / 2;
  const Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) hbp += hbp < 360 ? 360 : -360;
    hbp /= 2;
  }
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad)
    + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp;
  const Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}

// Machado, Oliveira & Fernandes (2009), severity 1.0, applied in linear RGB.
// Protanopia and deuteranopia together cover most colour-vision deficiency —
// roughly 1 in 12 men — and both collapse the red–green axis.
const CVD = {
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
};

const unlinearize = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const toHex = (rgb) => `#${rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('')}`;

/** How `hex` appears with the given colour-vision deficiency. */
function simulate(hex, kind) {
  const c = srgb(hex).map(linearize);
  return toHex(CVD[kind].map((row) => unlinearize(Math.min(1, Math.max(0, row[0] * c[0] + row[1] * c[1] + row[2] * c[2])))));
}

/**
 * Flattens a colour that may carry an alpha suffix (#rrggbbaa) onto an opaque
 * background — which is what the eye actually sees, and what contrast has to be
 * measured against.
 */
function composite(fg, bg) {
  if (fg.length !== 9) return fg.slice(0, 7);
  const a = parseInt(fg.slice(7, 9), 16) / 255;
  const f = srgb(fg.slice(0, 7));
  const b = srgb(bg.slice(0, 7));
  return toHex(f.map((v, i) => v * a + b[i] * (1 - a)));
}

/** WCAG level label for a ratio, padded so columns line up in terminal output. */
const level = (ratio) => (ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA ' : ratio >= 3 ? 'A  ' : '—  ');

module.exports = { luminance, contrast, lab, deltaE, deltaE2000, simulate, composite, level, CVD_KINDS: Object.keys(CVD) };
