# Changelog

## 1.0.0 — 2026-07-26

First release.

- **Noctilucent** — the dark variant. Editor background `#161523`, hue 243.
- **Noctilucent Soft** — the ramp lifted about five points of lightness for bright rooms, accents
  dropped to match.
- **Noctilucent Dawn** — light variant, same hues with the value ramp inverted.

Design notes:

- Chrome is monochromatic at hue 243, saturation falling as lightness rises across eleven steps.
- Teal carries functions, methods, decorators, and every UI accent, split-complementary to the
  indigo ground.
- Around 350 workbench keys covered, plus semantic tokens and TextMate scopes mapped to agree with
  each other.
- Contrast is enforced at build time: AAA for body text, AA for accents, and a ΔE 22 floor between
  any two accents.
