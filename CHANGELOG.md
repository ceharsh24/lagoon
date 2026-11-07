# Changelog

## Unreleased

An accessibility pass. 1.1 audited the palette against the editor background; the theme is
now audited as VS Code draws it — about 220 foreground/background pairs per variant, each on the
surface it actually sits on — and that turned up problems the palette checks could not see.

- **Accents stay distinct with colour blindness.** The flat brightness band from 1.1 left hue as
  the only cue, and red–green colour blindness removes half of it: keywords and properties
  (lavender, sky) and numbers and types (apricot, amber) were near-identical. Small lightness
  offsets inside the band raise the closest pair from ΔE2000 2.3 to 4.9 on Lagoon, 2.7 to 4.5 on
  Soft and 1.7 to 3.6 on Dawn, and the audit now enforces a floor. The 1.35× band and the
  no-brighter-than-text ceiling still hold.
- **Terminal greys are readable.** Bright black — shell autosuggestions, dimmed tool output — sat
  at 2:1; it now uses the comment colour. Dawn no longer swaps black and white, which had made
  black and bright black the same pale grey.
- **Keyboard focus is visible in lists.** A focused row had the same fill as a selected one and
  no outline, so in a multi-select list you could not see where focus was. Focus is now a teal
  outline.
- **Secondary text holds 4.5:1 on widgets.** Descriptions, inlay hints and suggest-widget status
  lines used comment grey, which only clears 4.5:1 on the editor itself.
- **Highlights no longer swamp what they highlight.** The find match was a 40% apricot wash, so
  searching for a number made the number illegible. Selection and find fills are now capped so
  every token, comments included, keeps 3:1 on them; the find match keeps its border.
- **Dawn:** a visible current-line highlight, inputs on the editor's near-white, darker text for
  inactive tabs on the frame, and a deeper teal for match highlights on a selected row.
- The minimap, Copilot chat and inline chat, and toolbars had no colours set and fell back to
  VS Code's stock blue and orange; they now follow the palette.
- JS/TS `const` bindings render as plain variables in both the grammar and the semantic layer,
  so they no longer flash apricot before the language server loads.
- `npm run build` now writes nothing unless every variant passes, as the README always said.
- Soft's error red lifted slightly so error text clears 4.5:1 on its widgets.

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

## 1.0.1 — 2026-07-26

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
