'use strict';

/**
 * Noctilucent — palette source of truth.
 *
 * Every colour is authored in HSL and converted to hex at build time. HSL keeps
 * the value ramps readable: the neutrals are one hue at descending saturation,
 * so "is surface1 lighter than surface0" is answerable by looking at the numbers
 * instead of by squinting at hex.
 *
 * Structure of a variant:
 *   neutrals  — monochromatic chrome ramp, darkest (crust) to lightest (bright)
 *   accents   — the syntax hues
 *   git/diff  — states that need their own tuning against the background
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
// Noctilucent — the hero dark variant.
// ---------------------------------------------------------------------------
// Chrome sits at hue 243 (indigo with a faint plum lean). Saturation falls as
// lightness rises so the light end of the ramp reads as neutral text rather
// than as tinted text.
const dark = {
  name: 'Noctilucent',
  type: 'dark',
  neutrals: {
    crust: hsl(243, 30, 6.5),    // title bar, activity bar — the frame
    mantle: hsl(243, 27, 8.5),   // side bar, panel, terminal
    base: hsl(243, 24, 11),      // editor background
    elevated: hsl(243, 21, 14),  // hovers, widgets, dropdowns
    surface0: hsl(243, 19, 18),  // current-line highlight, inactive selection
    surface1: hsl(243, 17, 24),  // borders, selection
    surface2: hsl(243, 15, 32),  // scrollbar, indent guides, whitespace
    muted: hsl(246, 22, 58),     // comments — recedes but stays legible
    subtle: hsl(243, 22, 68),    // punctuation, inactive foreground
    text: hsl(240, 30, 87),      // foreground
    bright: hsl(240, 45, 96),    // emphasis: bold, headings, active tab
  },
  accents: {
    teal: hsl(170, 66, 64),      // HERO — functions, methods, UI accent
    sky: hsl(205, 82, 73),       // properties, tags, links
    lavender: hsl(256, 74, 78),  // keywords, control flow, storage
    orchid: hsl(322, 66, 74),    // built-ins, language constructs, units
    rose: hsl(350, 78, 73),      // errors, invalid, `this`, deletions
    apricot: hsl(24, 88, 72),    // numbers, constants, escapes
    amber: hsl(44, 82, 71),      // types, classes, interfaces
    green: hsl(128, 44, 68),     // strings
  },
};

// ---------------------------------------------------------------------------
// Noctilucent Soft — same accents, background lifted for bright rooms.
// ---------------------------------------------------------------------------
// The ramp is raised ~5 points of lightness. Accents drop ~4 points to hold
// their contrast against the lighter base.
const soft = {
  name: 'Noctilucent Soft',
  type: 'dark',
  neutrals: {
    crust: hsl(243, 26, 11),
    mantle: hsl(243, 23, 13.5),
    base: hsl(243, 21, 16.5),
    elevated: hsl(243, 19, 20),
    surface0: hsl(243, 17, 24),
    surface1: hsl(243, 15, 30),
    surface2: hsl(243, 14, 38),
    muted: hsl(246, 20, 60),
    subtle: hsl(243, 20, 71),
    text: hsl(240, 28, 89),
    bright: hsl(240, 42, 97),
  },
  accents: {
    teal: hsl(170, 62, 60),
    sky: hsl(205, 76, 69),
    lavender: hsl(256, 68, 75),
    orchid: hsl(322, 60, 70),
    rose: hsl(350, 72, 69),
    apricot: hsl(24, 82, 68),
    amber: hsl(44, 76, 66),
    green: hsl(128, 40, 63),
  },
};

// ---------------------------------------------------------------------------
// Noctilucent Dawn — the light variant.
// ---------------------------------------------------------------------------
// Same hues, inverted value ramp. Light backgrounds need the opposite accent
// treatment: lightness drops well below 50% and saturation climbs, otherwise
// pastels wash out to illegibility on white.
const dawn = {
  name: 'Noctilucent Dawn',
  type: 'light',
  neutrals: {
    crust: hsl(240, 32, 92),
    mantle: hsl(240, 38, 96),
    base: hsl(240, 44, 98.5),
    elevated: hsl(240, 40, 97),
    surface0: hsl(240, 30, 93.5),
    surface1: hsl(240, 24, 87),
    surface2: hsl(240, 18, 74),
    muted: hsl(246, 18, 50),
    subtle: hsl(243, 16, 40),
    text: hsl(240, 26, 22),
    bright: hsl(240, 38, 11),
  },
  accents: {
    teal: hsl(176, 66, 28),
    sky: hsl(205, 80, 38),
    lavender: hsl(256, 58, 50),
    orchid: hsl(322, 58, 42),
    rose: hsl(348, 70, 45),
    apricot: hsl(22, 80, 40),
    amber: hsl(38, 82, 33),
    green: hsl(132, 50, 32),
  },
};

module.exports = { hsl, alpha, mix, variants: { dark, soft, dawn } };
