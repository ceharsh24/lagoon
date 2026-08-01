# Lagoon

A VS Code theme in three variants: **Lagoon** (dark), **Lagoon Soft** (dimmed dark),
and **Lagoon Dawn** (light).

A lagoon is the one place where water reads as two colours at once: luminous teal across the
shallows, deep indigo where the floor drops away. That is the palette — monochromatic indigo
chrome, one glowing teal accent, pastel syntax that never raises its voice.

**[See the full specimen sheet →](https://ceharsh24.github.io/lagoon/)**

## Where the design came from

The ten most-installed dark themes on the marketplace agree on far more than their branding
suggests. Their editor backgrounds:

| Theme | Background | Hue | Saturation |
| --- | --- | --- | --- |
| One Dark Pro | `#282c34` | 220° | 12% |
| Dracula | `#282a36` | 231° | 15% |
| Tokyo Night | `#1a1b26` | 235° | 22% |
| Catppuccin Mocha | `#1e1e2e` | 240° | 23% |
| Night Owl | `#011627` | 207° | 95% |
| Nord | `#2e3440` | 220° | 16% |
| Ayu Mirage | `#1f2430` | 225° | 21% |

Every one is a desaturated blue between 205° and 240°. Not one is neutral grey, and not one is
black. Figma's colour-combination guide gives the reason: dark blue reads as tranquil and
reliable, which is what you want from a surface you stare at for eight hours.

Three more things they share. Foreground is never pure white — always a blue-tinted off-white
around 75–90% lightness. The syntax map is effectively standardised: green strings, orange
numbers, purple keywords, yellow types, blue functions. And the themes still gaining installs,
Catppuccin and Tokyo Night, are the pastel ones. Saturation restraint is what people mean when
they call a theme easy on the eyes; the loud themes sit much further down the list.

Lagoon keeps all of that and changes one thing.

## The palette

**Chrome is monochromatic.** Every panel, border, and background is hue 243 — indigo with a faint
plum lean — with saturation falling as lightness rises, so the light end of the ramp reads as text
rather than as tinted text. Depth comes from value alone, which is why the UI has almost no
visible borders.

**Structural tokens are analogous.** Teal → sky → lavender carry functions, properties, and
keywords. Those are the tokens you see most often, so the dominant impression is one calm cool
family rather than a fruit salad.

**Attention tokens are split-complementary to the ground.** Apricot and amber sit opposite the
indigo, so numbers and types pop without shouting.

**Teal is the hero.** Functions, methods, decorators, and every UI accent — cursor, focus ring,
badges, active tab, buttons — are teal rather than the conventional blue. Teal is
split-complementary to the indigo ground, which is the relationship the ground was chosen for.
Functions are the accent you see most often, so that single substitution is what the theme
feels like.

| Role | Colour | Dark | Dawn |
| --- | --- | --- | --- |
| Functions, methods, decorators, UI accent | teal | `#4dccb8` | `#087970` |
| Properties, object keys, tag attributes | sky | `#69b7ed` | `#126aa4` |
| Keywords, control flow, storage | lavender | `#bda6f6` | `#6b58ad` |
| Imports, language constants, regex | orchid | `#dd8ec7` | `#933f74` |
| `this` / self, HTML tags, markdown lists | rose | `#f495a1` | `#a74955` |
| Numbers, constants, enum members | apricot | `#eda26a` | `#a8572d` |
| Types, classes, interfaces | amber | `#d1b157` | `#856103` |
| Strings | green | `#80c182` | `#33753d` |
| Errors, invalid, deletions | red | `#e76761` | `#a01819` |
| Comments, ghost text | muted, italic | `#817cab` | `#6d6996` |
| Punctuation, operators, parameters | subtle | `#9d9bbf` | `#575676` |

Accents are authored in OKLCH and share one perceptual lightness band per variant
(±1.5 L), so no token glows above another — hue carries the meaning, brightness
stays flat. Red is a state, not a syntax colour: it sits below the band and gets
its urgency from chroma, so error squiggles read as errors and nothing else
borrows their colour.

## Contrast is enforced, not eyeballed

`npm run build` refuses to write a theme that fails its own audit:

- Body text must clear **7:1** (WCAG AAA) against the editor background — code is read for hours.
- Every accent must clear **4.5:1** (AA). Accents carry meaning through hue as well as luminance,
  so AA is the right bar for them.
- Comments must clear **3:1**. They are meant to recede, but not to become unreadable.
- Filled UI elements — buttons, badges — are checked for the label against the accent, not
  against the background.
- No two accents may land closer than **ΔE 22** (CIE76). Two syntax roles that look like the same
  colour are worse than an ugly palette.
- Accents also have a **ceiling**: none may be brighter than body text, and the brightest accent
  may exceed the dimmest by at most **1.35×**. A floor alone lets one token glow above the rest,
  and uneven glow is what makes a theme tiring over hours.
- The `faint` step (line numbers, active indent guide) must clear **3:1** — quiet, but readable
  without leaning in.

Current numbers, dark variant: body text 12.3:1, accents 7.5–9.1:1, closest accent pair ΔE 23.

## Install

**From the Extensions view** — press `⇧⌘X` (`Ctrl+Shift+X` on Windows and Linux) and search
`Lagoon`. It is listed as **Lagoon Color Theme**, published by **Lagoon**. Click Install.

**From the command line:**

```bash
code --install-extension lagoon.lagoon-color-theme
```

**From a release build** — download `lagoon-color-theme-1.0.1.vsix` from the
[latest release](https://github.com/ceharsh24/lagoon/releases/latest), then:

```bash
code --install-extension lagoon-color-theme-1.0.1.vsix
```

**From source** — clone straight into your extensions directory:

```bash
git clone https://github.com/ceharsh24/lagoon.git ~/.vscode/extensions/lagoon
```

> If `code` is not a recognised command, run **Shell Command: Install 'code' command in PATH**
> from the command palette (`⇧⌘P`) once, then reopen your terminal. The Extensions view and the
> clone-from-source route both work without it.

## Using it

### Pick a variant

Open the theme picker with `⌘K ⌘T` (`Ctrl+K Ctrl+T`) and choose **Lagoon**, **Lagoon Soft**, or
**Lagoon Dawn**. Arrow through the list to preview each one live before committing — nothing is
saved until you press Enter.

The picker writes this for you, so you can also set it by hand:

```json
{
  "workbench.colorTheme": "Lagoon"
}
```

| Variant | Use it when |
| --- | --- |
| **Lagoon** | the default — a dark room, or a screen you look at for hours |
| **Lagoon Soft** | a bright room, where full contrast on near-black starts to glare |
| **Lagoon Dawn** | daylight, projectors, and anything printed |

### Follow the system, dark to light

Shipping a light variant is only useful if you never have to think about it. Point VS Code at both
and it will move between them when your OS does:

```json
{
  "window.autoDetectColorScheme": true,
  "workbench.preferredDarkColorTheme": "Lagoon",
  "workbench.preferredLightColorTheme": "Lagoon Dawn"
}
```

Substitute `Lagoon Soft` for the dark entry if you work somewhere bright.

### If you don't want the italics

Comments, parameters, and decorators are italic by design — it separates them from
surrounding tokens without spending another colour. If your editor font has no true italic, or you
just dislike them, override the styles rather than editing the theme:

```json
{
  "editor.tokenColorCustomizations": {
    "[Lagoon]": {
      "textMateRules": [
        {
          "scope": ["comment", "keyword.control.flow", "variable.parameter"],
          "settings": { "fontStyle": "" }
        }
      ]
    }
  }
}
```

Scoping the block to `[Lagoon]` keeps the change from leaking into your other themes. Repeat it for
`[Lagoon Soft]` and `[Lagoon Dawn]` if you switch between them.

### Override a single colour

```json
{
  "workbench.colorCustomizations": {
    "[Lagoon]": {
      "editor.background": "#12111d"
    }
  }
}
```

Any key from the [theme colour reference](https://code.visualstudio.com/api/references/theme-color)
works here. To change the palette wholesale rather than patch it, see
[Changing a colour](#changing-a-colour) below and rebuild from source.

### Semantic highlighting

The theme maps semantic tokens as well as TextMate scopes, and the two agree with each other, so an
identifier does not change colour when a language server finishes loading. It is on by default;
if you have turned it off globally, this restores it:

```json
{
  "editor.semanticHighlighting.enabled": true
}
```

## Publishing a new version

The extension is published under the `lagoon` publisher. `vsce` needs an Azure DevOps Personal
Access Token with **Marketplace → Manage** scope, against **all accessible organizations**:

```bash
npx @vscode/vsce login lagoon     # paste the PAT once; stored in the system keychain
npm run build                     # regenerate themes, icon, and site — and run the audit
npx @vscode/vsce publish          # or: publish minor / publish patch to bump first
```

`vsce publish` refuses to publish a version that already exists, so bump `version` in
`package.json` (or let `publish minor` do it) before republishing.

## Changing a colour

Colours live in `src/palette.js` — neutrals in HSL so the value ramps stay legible, accents in
OKLCH so equal perceptual brightness is guaranteed by the numbers. Edit there and rebuild — the
JSON in `themes/` is build output, and editing it directly both gets overwritten and skips the
contrast gate.

```bash
npm run build     # regenerate all three variants and audit them
npm run check     # audit only, non-zero exit on failure
npm run preview   # regenerate docs/index.html
```

| File | What it holds |
| --- | --- |
| `src/palette.js` | the three variants — neutrals in HSL, accents in OKLCH |
| `src/theme.js` | role assignments — which token gets which colour, ~350 UI keys |
| `src/contrast.js` | WCAG contrast and CIELAB ΔE |
| `src/build.js` | generates `themes/*.json`, runs the audit |
| `src/preview.js` | generates `docs/index.html`, the GitHub Pages site |

Token roles are defined once in `src/theme.js` and shared across all three variants, so the
themes stay recognisably the same design — only the palette numbers differ. Semantic tokens and
TextMate scopes are both mapped, and mapped to agree with each other, so an identifier does not
change colour when a language server wakes up.

## Licence

MIT.
