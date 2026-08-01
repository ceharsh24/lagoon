# Changelog

## 1.1.0 — 2026-08-01

A comfort pass on every variant, aimed at long sessions. 1.0 audited only a contrast *floor*;
these changes control the ceiling and the evenness, which is what the eye actually feels
over hours.

- **Accents are now authored in OKLCH and share one perceptual lightness band per variant**
  (dark: okL 74.5–77.5, was 73.6–87.0). At the same HSL lightness, yellow glows and violet
  recedes — so amber types and teal functions used to outshine everything else on the page.
  Now no token is brighter than another, and none is brighter than body text. The band, the
  ceiling, and a 1.35× max spread are enforced by the build audit.
- **Red means broken, nothing else.** A dedicated diagnostics red (`#e76761` dark, `#a01819`
  light) now carries errors, invalid code, and deletions. Rose stays a syntax colour — `this`,
  HTML/JSX tags, markdown lists — so web code no longer looks like a page of errors, and an
  error squiggle is unmistakable. The audit keeps red ΔE ≥ 22 from every syntax accent.
- **Ghost text is readable.** Inline suggestions sat at 1.96:1 — below the point of legibility.
  They now use the comment colour (4.6:1). A new `faint` neutral step (≥ 3:1) fills the hole in
  the ramp for line numbers, the active indent guide, disabled text, and ignored files.
- **Selections no longer erase syntax.** `editor.selectionForeground` is gone — token colours
  survive being selected — and the selection wash is a desaturated tint owned by no syntax role,
  instead of the keyword lavender.
- **Fewer italics.** Comments, parameters, and decorators keep them. Control flow, imports,
  `this`, tag attributes, primitives, and lifetimes sit upright — five slanted line-starts in a
  row was texture, not information.
- Bracket-pair colours pulled 30% toward the text colour: structure hints, not tokens.
- `bright` softened from 15.9:1 to 14:1; Dawn's accent chroma equalised (lavender was
  electric-violet at 0.212 while teal sat muted at 0.084 — both now near 0.12).

Documentation only. The three theme files are byte-identical to 1.0.0, so nothing changes in the
editor — this exists to correct the install instructions and to publish the usage docs, which can
only reach the Marketplace page by shipping a version.

- **Install steps named the wrong thing.** They told you to look for "Lagoon" in the Extensions
  view; the listing is **Lagoon Color Theme**, published by **Lagoon**. The Marketplace reserves
  `name` and `displayName` globally — including from extensions that are no longer listed — and
  both `lagoon` and `Lagoon` were already taken.
- Added usage documentation, which was missing entirely: following the OS between dark and light
  with `window.autoDetectColorScheme`, pinning a single variant, turning off the italics, and
  overriding individual colours from settings. The override examples are scoped to `[Lagoon]` so
  they do not leak into other themes.
- Windows and Linux keybindings listed alongside the macOS ones throughout.
- Site: code blocks constrained to the prose measure, and a horizontal overflow on narrow
  viewports fixed — grid items default to `min-width: auto`, so an unbreakable shell command was
  widening the whole page.

## 1.0.0 — 2026-07-26

First release.

- **Lagoon** — the dark variant. Editor background `#161523`, hue 243.
- **Lagoon Soft** — the ramp lifted about five points of lightness for bright rooms, accents
  dropped to match.
- **Lagoon Dawn** — light variant, same hues with the value ramp inverted.

Design notes:

- Chrome is monochromatic at hue 243, saturation falling as lightness rises across eleven steps.
- Teal carries functions, methods, decorators, and every UI accent, split-complementary to the
  indigo ground.
- Around 350 workbench keys covered, plus semantic tokens and TextMate scopes mapped to agree with
  each other.
- Contrast is enforced at build time: AAA for body text, AA for accents, and a ΔE 22 floor between
  any two accents.
