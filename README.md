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
| Functions, methods, decorators, UI accent | teal | `#67e0cc` | `#187770` |
| Properties, object keys, tag attributes | sky | `#82c4f3` | `#136eae` |
| Keywords, control flow, storage | lavender | `#b49df0` | `#5d36c9` |
| Imports, language constants, regex | orchid | `#e891c8` | `#a92d7c` |
| Errors, invalid, `this`, HTML tags | rose | `#f08496` | `#c32243` |
| Numbers, constants, enum members | apricot | `#f6ab79` | `#b85014` |
| Types, classes, interfaces | amber | `#f2d178` | `#99670f` |
| Strings | green | `#89d193` | `#297a39` |
| Comments | muted, italic | `#817cab` | `#6d6996` |
| Punctuation, operators, parameters | subtle | `#9d9bbf` | `#575676` |

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

Current numbers, dark variant: body text 12.3:1, lowest accent 7.2:1, closest accent pair ΔE 24.

## Install

**From the Extensions view** — press `⇧⌘X` (`Ctrl+Shift+X` on Windows and Linux), search for
`Lagoon`, and click Install.

**From the command line:**

```bash
code --install-extension lagoon.lagoon-color-theme
```

**From a release build** — download `lagoon-color-theme-1.0.0.vsix` from the
[latest release](https://github.com/ceharsh24/lagoon/releases/latest), then:

```bash
code --install-extension lagoon-color-theme-1.0.0.vsix
```

**From source** — clone straight into your extensions directory:

```bash
git clone https://github.com/ceharsh24/lagoon.git ~/.vscode/extensions/lagoon
```

Then restart VS Code, open the theme picker with `⌘K ⌘T` (`Ctrl+K Ctrl+T`), and pick **Lagoon**,
**Lagoon Soft**, or **Lagoon Dawn**.

> If `code` is not a recognised command, run **Shell Command: Install 'code' command in PATH**
> from the command palette (`⇧⌘P`) once, then reopen your terminal. The Extensions view and the
> clone-from-source route both work without it.

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

Colours live in `src/palette.js`, authored in HSL so the value ramps stay legible. Edit there and
rebuild — the JSON in `themes/` is build output, and editing it directly both gets overwritten and
skips the contrast gate.

```bash
npm run build     # regenerate all three variants and audit them
npm run check     # audit only, non-zero exit on failure
npm run preview   # regenerate docs/index.html
```

| File | What it holds |
| --- | --- |
| `src/palette.js` | the three variants, in HSL |
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
