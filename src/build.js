'use strict';

/**
 * Generates themes/*.json from the palette, after auditing the result.
 *
 * The audit is the point of having a build step at all — see src/audit.js for
 * what it checks and why. Nothing is written unless every variant passes, so a
 * committed theme is always one that cleared the gate.
 *
 *   node src/build.js          audit, then write themes if everything passes
 *   node src/build.js --check  audit only, non-zero exit on failure
 */

const fs = require('fs');
const path = require('path');
const { variants } = require('./palette');
const { buildTheme } = require('./theme');
const { auditVariant, MIN_COMMENT, MIN_ACCENT, MIN_DELTA_E, MIN_CVD_DELTA_E } = require('./audit');

const OUT_DIR = path.join(__dirname, '..', 'themes');
const CHECK_ONLY = process.argv.includes('--check');

const slug = (name) => name.toLowerCase().replace(/\s+/g, '-');
const built = [];
let failed = 0;

for (const variant of Object.values(variants)) {
  const theme = buildTheme(variant);
  const report = auditVariant(variant, theme);
  built.push({ variant, theme });

  console.log(`\n\x1b[1m${variant.name}\x1b[0m  (${variant.type}, editor bg ${variant.neutrals.base})`);
  for (const r of report.rows) {
    const flag = r.ratio < MIN_COMMENT ? '\x1b[31m' : r.ratio < MIN_ACCENT ? '\x1b[33m' : '\x1b[32m';
    console.log(`  ${flag}${r.level}\x1b[0m ${r.ratio.toFixed(2).padStart(5)}:1  ${r.hex}  ${r.label}`);
  }
  console.log(`  closest accent pair: ${report.closest.pair} at ΔE ${report.closest.d.toFixed(1)} (floor ${MIN_DELTA_E})`);
  console.log(`  closest with colour-blindness: ${report.cvdClosest.pair} at ΔE2000 ${report.cvdClosest.d.toFixed(1)}, ${report.cvdClosest.kind} (floor ${MIN_CVD_DELTA_E})`);
  console.log(`  ${report.pairsChecked} colour pairs checked as drawn; tightest: ${report.worst.label} at ${report.worst.ratio.toFixed(2)}:1 (floor ${report.worst.min})`);

  for (const w of report.warnings) console.log(`  \x1b[33mwarn\x1b[0m  ${w}`);
  for (const f of report.failures) console.log(`  \x1b[31mfail\x1b[0m  ${f}`);
  failed += report.failures.length;
}

console.log('');
if (failed) {
  console.error(`\x1b[31m${failed} audit failure(s)${CHECK_ONLY ? '' : ' — no themes written'}.\x1b[0m`);
  process.exit(1);
}

if (!CHECK_ONLY) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const { variant, theme } of built) {
    const file = path.join(OUT_DIR, `${slug(variant.name)}.json`);
    fs.writeFileSync(file, JSON.stringify(theme, null, 2) + '\n');
    console.log(`wrote themes/${path.basename(file)}`);
  }
}
console.log('\x1b[32mAll variants pass.\x1b[0m');
