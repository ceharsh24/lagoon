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

/** WCAG level label for a ratio, padded so columns line up in terminal output. */
const level = (ratio) => (ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA ' : ratio >= 3 ? 'A  ' : '—  ');

module.exports = { luminance, contrast, lab, deltaE, level };
