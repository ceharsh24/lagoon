# Changelog

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
