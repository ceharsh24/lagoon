'use strict';

/**
 * Lagoon — palette source of truth.
 *
 * Neutrals are authored in HSL and accents in OKLCH, both converted to hex at
 * build time. HSL keeps the value ramps readable: the neutrals are one hue at
 * descending saturation, so "is surface1 lighter than surface0" is answerable
 * by looking at the numbers. Accents use OKLCH because HSL lightness is not
 * perceptual — at the same HSL L, yellow glows and violet recedes. Authoring
 * accent L in OKLCH makes "every accent is equally bright" true by
 * construction, which is what keeps the page calm: on a dark ground,
 * brightness is salience, and uneven salience is what reads as strain.
 *
 * Structure of a variant:
 *   neutrals  — monochromatic chrome ramp, darkest (crust) to lightest (bright)
 *   accents   — the syntax hues, one OKLCH lightness band per variant
 *   states    — diagnostics colours allowed outside the band (they should pop)
 */

/** HSL (h 0-360, s 0-100, l 0-100) to #rrggbb. */
function hsl(h, s, l) {
  const S = s / 100;
  const L = l / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = S * Math.min(L, 1 - L);
  const f = (n) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to255 = (v) => Math.round(255 * v).toString(16).padStart(2, '0');
  return `#${to255(f(0))}${to255(f(8))}${to255(f(4))}`;
}

/** OKLCH (L 0-100, C, h 0-360) to #rrggbb, chroma clamped into sRGB gamut. */
function oklch(L, C, h) {
  const toRgb = (c) => {
    const rad = (h * Math.PI) / 180;
    const A = c * Math.cos(rad);
    const B = c * Math.sin(rad);
    const l_ = L / 100 + 0.3963377774 * A + 0.2158037573 * B;
    const m_ = L / 100 - 0.1055613458 * A - 0.0638541728 * B;
    const s_ = L / 100 - 0.0894841775 * A - 1.291485548 * B;
    const [l, m, s] = [l_ ** 3, m_ ** 3, s_ ** 3];
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
  };
  let c = C;
  while (c > 0 && !toRgb(c).every((v) => v >= -1e-4 && v <= 1 + 1e-4)) c -= 0.001;
  const gamma = (v) => {
    const x = Math.min(1, Math.max(0, v));
    return x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };
  return `#${toRgb(c).map((v) => Math.round(gamma(v) * 255).toString(16).padStart(2, '0')).join('')}`;
}

/** Alpha suffix helper: rgba(hex, 0.4) -> '#rrggbb66'. */
function alpha(hex, a) {
  return hex + Math.round(a * 255).toString(16).padStart(2, '0');
}

/** Mix two hex colours in sRGB. Used for tints that must stay opaque. */
function mix(a, b, t) {
  const parse = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const c = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
}

// ---------------------------------------------------------------------------
// Lagoon — the hero dark variant.
// ---------------------------------------------------------------------------
// Chrome sits at hue 243 (indigo with a faint plum lean). Saturation falls as
// lightness rises so the light end of the ramp reads as neutral text rather
// than as tinted text.
const dark = {
  name: 'Lagoon',
  type: 'dark',
  neutrals: {
    crust: hsl(243, 30, 6.5),    // title bar, activity bar — the frame
    mantle: hsl(243, 27, 8.5),   // side bar, panel, terminal
    base: hsl(243, 24, 11),      // editor background
    elevated: hsl(243, 21, 14),  // hovers, widgets, dropdowns
    surface0: hsl(243, 19, 18),  // current-line highlight, inactive selection
    surface1: hsl(243, 17, 24),  // borders, selection
    surface2: hsl(243, 15, 32),  // scrollbar, indent guides, whitespace
    faint: hsl(243, 20, 47),     // line numbers, active indent guide — ~3:1, readable if you look
    muted: hsl(246, 22, 58),     // comments, ghost text — recedes but stays legible
    subtle: hsl(243, 22, 68),    // punctuation, inactive foreground
    text: hsl(240, 30, 87),      // foreground
    bright: hsl(240, 45, 92),    // emphasis: bold, headings, active tab
    tint: hsl(250, 26, 62),      // selection wash — desaturated, owned by no syntax role
  },
  // One lightness band, okL 74.5–77.5: no token outshines another, and none
  // outshines body text. Hue carries the meaning; brightness stays flat.
  accents: {
    teal: oklch(77, 0.115, 181),      // HERO — functions, methods, UI accent
    sky: oklch(75, 0.11, 241),        // properties, tags, links
    lavender: oklch(77.5, 0.115, 297), // keywords, control flow, storage
    orchid: oklch(74.5, 0.12, 338),   // built-ins, language constructs, units
    rose: oklch(77, 0.115, 12),       // `this` / self, HTML tags, markdown lists
    apricot: oklch(77.5, 0.115, 57),  // numbers, constants, escapes
    amber: oklch(77, 0.115, 90),      // types, classes, interfaces
    green: oklch(75, 0.11, 145),      // strings
  },
  states: {
    // Deeper and more chromatic than the band — errors pop through saturation,
    // not lightness, so a red squiggle reads urgent without glowing.
    red: oklch(67, 0.16, 25),         // errors, invalid, deletions
  },
};

// ---------------------------------------------------------------------------
// Lagoon Soft — same accents, background lifted for bright rooms.
// ---------------------------------------------------------------------------
// The ramp is raised ~5 points of lightness. The accent band drops ~2 okL to
// hold a moderate contrast against the lighter base.
const soft = {
  name: 'Lagoon Soft',
  type: 'dark',
  neutrals: {
    crust: hsl(243, 26, 11),
    mantle: hsl(243, 23, 13.5),
    base: hsl(243, 21, 16.5),
    elevated: hsl(243, 19, 20),
    surface0: hsl(243, 17, 24),
    surface1: hsl(243, 15, 30),
    surface2: hsl(243, 14, 38),
    faint: hsl(243, 18, 51),
    muted: hsl(246, 20, 60),
    subtle: hsl(243, 20, 71),
    text: hsl(240, 28, 89),
    bright: hsl(240, 42, 93),
    tint: hsl(250, 24, 65),
  },
  accents: {
    teal: oklch(75, 0.115, 181),
    sky: oklch(73, 0.11, 241),
    lavender: oklch(75.5, 0.115, 297),
    orchid: oklch(72.5, 0.12, 338),
    rose: oklch(75, 0.115, 12),
    apricot: oklch(75.5, 0.115, 57),
    amber: oklch(73.5, 0.115, 90),
    green: oklch(73, 0.11, 145),
  },
  states: {
    red: oklch(65.5, 0.155, 25),
  },
};

// ---------------------------------------------------------------------------
// Lagoon Dawn — the light variant.
// ---------------------------------------------------------------------------
// Same hues, inverted value ramp. On white the band flips: accent lightness
// sits near okL 50 and the uniformity that matters is chroma — one electric
// hue among muted ones vibrates just as badly as one glowing token on dark.
const dawn = {
  name: 'Lagoon Dawn',
  type: 'light',
  neutrals: {
    crust: hsl(240, 32, 92),
    mantle: hsl(240, 38, 96),
    base: hsl(240, 44, 98.5),
    elevated: hsl(240, 40, 97),
    surface0: hsl(240, 30, 93.5),
    surface1: hsl(240, 24, 87),
    surface2: hsl(240, 18, 74),
    faint: hsl(243, 14, 58),
    muted: hsl(246, 18, 50),
    subtle: hsl(243, 16, 40),
    text: hsl(240, 26, 22),
    bright: hsl(240, 38, 11),
    tint: hsl(250, 30, 54),
  },
  accents: {
    teal: oklch(52, 0.09, 185),
    sky: oklch(50.5, 0.12, 245),
    lavender: oklch(52, 0.13, 291),
    orchid: oklch(49.5, 0.13, 344),
    rose: oklch(53, 0.125, 14),
    apricot: oklch(54.5, 0.12, 46),
    amber: oklch(51.5, 0.105, 83),
    green: oklch(50.5, 0.11, 147),
  },
  states: {
    red: oklch(45.5, 0.17, 27),
  },
};

module.exports = { hsl, oklch, alpha, mix, variants: { dark, soft, dawn } };
