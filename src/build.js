'use strict';

/**
 * Generates themes/*.json from the palette, then audits the result.
 *
 * The audit is the point of having a build step at all: a theme is a few hundred
 * colour decisions, and "looks fine on my monitor" is not a contrast check. Two
 * things get verified — WCAG contrast against the editor background, and
 * perceptual distance between accents, so two syntax roles can never collapse
 * into the same apparent colour.
 *
 *   node src/build.js          write themes and print the audit
 *   node src/build.js --check  audit only, non-zero exit on failure
 */

const fs = require('fs');
const path = require('path');
const { variants } = require('./palette');
const { buildTheme } = require('./theme');
const { contrast, deltaE, level } = require('./contrast');

const OUT_DIR = path.join(__dirname, '..', 'themes');
const CHECK_ONLY = process.argv.includes('--check');

// -- Thresholds -------------------------------------------------------------

// Body text is held to AAA because code is read for hours at a time. Accents
// only need AA: they carry meaning through hue as well as luminance. Comments
// are deliberately allowed to sit lower — they are meant to recede — but not
// below 3:1, where they stop being readable at small sizes.
//
// The floor is not the whole story. Accents also have a ceiling — none may be
// brighter than body text — and a band: the brightest accent may exceed the
// dimmest by at most 1.35x. Brightness is salience, and an accent that
// outshines the band pulls the eye on every line for no semantic reason.
// State colours (red) sit outside the band on purpose; they only need the
// floor, plus ΔE distance from every syntax accent.
const MIN_TEXT = 7.0;
const MIN_ACCENT = 4.5;
const MIN_COMMENT = 3.0;
const WANT_COMMENT = 4.5;
const MIN_FAINT = 3.0;
const MIN_DELTA_E = 22;
const MAX_ACCENT_SPREAD = 1.35;

function audit(variant) {
  const { neutrals: n, accents: a, states: st } = variant;
  const bg = n.base;
  const rows = [];
  const failures = [];
  const warnings = [];

  const check = (label, fg, min, want) => {
    const ratio = contrast(fg, bg);
    rows.push({ label, hex: fg, ratio, level: level(ratio) });
    if (ratio < min) failures.push(`${variant.name}: ${label} ${fg} is ${ratio.toFixed(2)}:1 against ${bg}, needs ${min}:1`);
    else if (want && ratio < want) warnings.push(`${variant.name}: ${label} ${fg} is ${ratio.toFixed(2)}:1, below the ${want}:1 target`);
  };

  check('foreground', n.text, MIN_TEXT);
  check('bright', n.bright, MIN_TEXT);
  check('subtle (punctuation)', n.subtle, MIN_ACCENT);
  check('muted (comments)', n.muted, MIN_COMMENT, WANT_COMMENT);
  check('faint (line numbers)', n.faint, MIN_FAINT);
  for (const [name, hex] of Object.entries(a)) check(name, hex, MIN_ACCENT);
  for (const [name, hex] of Object.entries(st)) check(`${name} (state)`, hex, MIN_ACCENT);

  // Ceiling and band: syntax accents live in one brightness band below text.
  const textRatio = contrast(n.text, bg);
  const ratios = Object.entries(a).map(([name, hex]) => [name, contrast(hex, bg)]);
  for (const [name, ratio] of ratios) {
    if (ratio > textRatio) failures.push(`${variant.name}: ${name} at ${ratio.toFixed(2)}:1 outshines body text (${textRatio.toFixed(2)}:1)`);
  }
  const sorted = [...ratios].sort((x, y) => x[1] - y[1]);
  const [dimmest, brightest] = [sorted[0], sorted[sorted.length - 1]];
  const spread = brightest[1] / dimmest[1];
  if (spread > MAX_ACCENT_SPREAD) {
    failures.push(`${variant.name}: accent band too wide — ${brightest[0]} ${brightest[1].toFixed(2)}:1 vs ${dimmest[0]} ${dimmest[1].toFixed(2)}:1 (${spread.toFixed(2)}x, max ${MAX_ACCENT_SPREAD}x)`);
  }

  // Accents must also be distinguishable from each other, not just from the
  // background — otherwise strings and functions read as the same token.
  // States join this check: error red collapsing into rose would undo the
  // reason red exists at all.
  const entries = Object.entries({ ...a, ...st });
  let closest = { pair: '—', d: Infinity };
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const d = deltaE(entries[i][1], entries[j][1]);
      const pair = `${entries[i][0]} / ${entries[j][0]}`;
      if (d < closest.d) closest = { pair, d };
      if (d < MIN_DELTA_E) {
        failures.push(`${variant.name}: accents ${pair} are only ΔE ${d.toFixed(1)} apart, needs ${MIN_DELTA_E}`);
      }
    }
  }

  // Filled UI elements are their own contrast problem: the label sits on the
  // accent, not on the background.
  const onAccent = variant.type === 'dark' ? n.crust : n.base;
  for (const label of ['button', 'badge']) {
    const ratio = contrast(onAccent, a.teal);
    if (ratio < MIN_ACCENT) failures.push(`${variant.name}: ${label} label ${onAccent} on ${a.teal} is ${ratio.toFixed(2)}:1`);
  }

  return { rows, failures, warnings, closest };
}

// -- Run --------------------------------------------------------------------

const slug = (name) => name.toLowerCase().replace(/\s+/g, '-');
let failed = 0;

for (const variant of Object.values(variants)) {
  const report = audit(variant);

  console.log(`\n\x1b[1m${variant.name}\x1b[0m  (${variant.type}, editor bg ${variant.neutrals.base})`);
  for (const r of report.rows) {
    const flag = r.ratio < MIN_COMMENT ? '\x1b[31m' : r.ratio < MIN_ACCENT ? '\x1b[33m' : '\x1b[32m';
    console.log(`  ${flag}${r.level}\x1b[0m ${r.ratio.toFixed(2).padStart(5)}:1  ${r.hex}  ${r.label}`);
  }
  console.log(`  closest accent pair: ${report.closest.pair} at ΔE ${report.closest.d.toFixed(1)} (floor ${MIN_DELTA_E})`);

  for (const w of report.warnings) console.log(`  \x1b[33mwarn\x1b[0m  ${w}`);
  for (const f of report.failures) {
    console.log(`  \x1b[31mfail\x1b[0m  ${f}`);
    failed++;
  }

  if (!CHECK_ONLY) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const file = path.join(OUT_DIR, `${slug(variant.name)}.json`);
    fs.writeFileSync(file, JSON.stringify(buildTheme(variant), null, 2) + '\n');
    console.log(`  wrote themes/${path.basename(file)}`);
  }
}

console.log('');
if (failed) {
  console.error(`\x1b[31m${failed} contrast failure(s).\x1b[0m`);
  process.exit(1);
}
console.log('\x1b[32mAll variants pass.\x1b[0m');
