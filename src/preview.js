'use strict';

/**
 * Generates docs/index.html — a specimen sheet for the theme, and the site
 * GitHub Pages serves from the docs/ folder on main.
 *
 * The mock editor windows are painted from the same palette module the themes
 * are built from, so a preview can never show colours the theme does not ship.
 * The page chrome follows the viewer's light/dark preference by wearing the
 * theme itself: Dawn in light, Lagoon in dark.
 *
 *   node src/preview.js
 */

const fs = require('fs');
const path = require('path');
const { variants, alpha } = require('./palette');
const { contrast, deltaE, level } = require('./contrast');

const OUT = path.join(__dirname, '..', 'docs', 'index.html');
const REPO = 'ceharsh24/lagoon';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------------------------------------------------------------------------
// The specimen. Hand-tokenised so the roles are exact rather than guessed by a
// regex highlighter: what you see is the role map the theme actually assigns.
// ---------------------------------------------------------------------------
const SAMPLE = [
  [['cm', '// Every accent has to clear 4.5:1 against the ground it sits on.']],
  [],
  [['imp', 'import'], ['pun', ' { '], ['fn', 'contrast'], ['pun', ', '], ['kw', 'type'], ['txt', ' '], ['ty', 'Hex'], ['pun', ' } '], ['imp', 'from'], ['txt', ' '], ['str', '"./contrast"'], ['pun', ';']],
  [],
  [['kw', 'const'], ['txt', ' '], ['const', 'MIN_RATIO'], ['op', ' = '], ['num', '4.5'], ['pun', ';']],
  [],
  [['imp', 'export'], ['txt', ' '], ['kw', 'interface'], ['txt', ' '], ['ty', 'Swatch'], ['pun', ' {']],
  [['prop', '  role'], ['pun', ': '], ['ty', 'string'], ['pun', ';']],
  [['prop', '  hex'], ['pun', ': '], ['ty', 'Hex'], ['pun', ';']],
  [['prop', '  locked'], ['op', '?'], ['pun', ': '], ['ty', 'boolean'], ['pun', ';']],
  [['pun', '}']],
  [],
  [['imp', 'export'], ['txt', ' '], ['kw', 'class'], ['txt', ' '], ['ty', 'Palette'], ['pun', ' {']],
  [['prop', '  #entries'], ['op', ' = '], ['kw', 'new'], ['txt', ' '], ['ty', 'Map'], ['pun', '<'], ['ty', 'string'], ['pun', ', '], ['ty', 'Swatch'], ['pun', '>();']],
  [],
  [['fn', '  constructor'], ['pun', '('], ['kw', 'private'], ['txt', ' '], ['kw', 'readonly'], ['txt', ' '], ['param', 'ground'], ['pun', ': '], ['ty', 'Hex'], ['pun', ') {}']],
  [],
  [['fn', '  add'], ['pun', '('], ['param', 'role'], ['pun', ': '], ['ty', 'string'], ['pun', ', '], ['param', 'hex'], ['pun', ': '], ['ty', 'Hex'], ['pun', '): '], ['self', 'this'], ['pun', ' {']],
  [['ctl', '    if'], ['pun', ' ('], ['fn', 'contrast'], ['pun', '('], ['txt', 'hex'], ['pun', ', '], ['self', 'this'], ['pun', '.'], ['prop', 'ground'], ['pun', ') '], ['op', '<'], ['txt', ' '], ['const', 'MIN_RATIO'], ['pun', ') {']],
  [['ctl', '      throw'], ['txt', ' '], ['kw', 'new'], ['txt', ' '], ['ty', 'RangeError'], ['pun', '('], ['str', '`'], ['esc', '${'], ['txt', 'role'], ['esc', '}'], ['str', ' fails at '], ['esc', '${'], ['txt', 'hex'], ['esc', '}'], ['str', '`'], ['pun', ');']],
  [['pun', '    }']],
  [['self', '    this'], ['pun', '.'], ['prop', '#entries'], ['pun', '.'], ['fn', 'set'], ['pun', '('], ['txt', 'role'], ['pun', ', { '], ['prop', 'role'], ['pun', ', '], ['prop', 'hex'], ['pun', ', '], ['prop', 'locked'], ['pun', ': '], ['bool', 'false'], ['pun', ' });']],
  [['ctl', '    return'], ['txt', ' '], ['self', 'this'], ['pun', ';']],
  [['pun', '  }']],
  [],
  [['kw', '  get'], ['txt', ' '], ['fn', 'accents'], ['pun', '(): '], ['ty', 'Swatch'], ['pun', '[] {']],
  [['ctl', '    return'], ['pun', ' ['], ['op', '...'], ['self', 'this'], ['pun', '.'], ['prop', '#entries'], ['pun', '.'], ['fn', 'values'], ['pun', '()].'], ['fn', 'filter'], ['pun', '(('], ['param', 's'], ['pun', ') '], ['kw', '=>'], ['txt', ' '], ['op', '!'], ['txt', 's'], ['pun', '.'], ['prop', 'locked'], ['pun', ');']],
  [['pun', '  }']],
  [['pun', '}']],
];

const ACTIVE_LINE = 19; // the `if (contrast(...))` line — shows the line highlight

/** Maps a specimen role to the colour and style the theme assigns it. */
function roleStyle(variant, role) {
  const { neutrals: n, accents: a } = variant;
  const map = {
    cm: [n.muted, 'italic'],
    txt: [n.text, ''],
    pun: [n.subtle, ''],
    op: [n.subtle, ''],
    param: [n.subtle, 'italic'],
    self: [a.rose, 'italic'],
    kw: [a.lavender, ''],
    ctl: [a.lavender, 'italic'],
    imp: [a.orchid, 'italic'],
    bool: [a.orchid, ''],
    esc: [a.apricot, ''],
    num: [a.apricot, ''],
    const: [a.apricot, ''],
    ty: [a.amber, ''],
    fn: [a.teal, ''],
    prop: [a.sky, ''],
    str: [a.green, ''],
  };
  const [color, style] = map[role] || [n.text, ''];
  return `color:${color}${style ? `;font-style:${style}` : ''}`;
}

function renderCode(variant, lines) {
  const { neutrals: n, accents: a } = variant;
  return lines
    .map((tokens, i) => {
      const num = i + 1;
      const isActive = num === ACTIVE_LINE;
      const gutterColor = isActive ? a.teal : n.surface2;
      const body = tokens.length
        ? tokens.map(([role, text]) => `<span style="${roleStyle(variant, role)}">${esc(text)}</span>`).join('')
        : '&nbsp;';
      return (
        `<div class="row"${isActive ? ` style="background:${n.surface0}"` : ''}>` +
        `<span class="ln" style="color:${gutterColor}">${num}</span>` +
        `<span class="code">${body}</span>` +
        `</div>`
      );
    })
    .join('\n');
}

/** Five activity-bar glyphs, drawn rather than shipped as icon-font glyphs. */
const ICONS = {
  files: '<path d="M3 2h6l2 2h6v12H3z"/>',
  search: '<circle cx="8" cy="8" r="5"/><path d="M12 12l4 4"/>',
  git: '<circle cx="5" cy="5" r="2.5"/><circle cx="5" cy="15" r="2.5"/><circle cx="14" cy="10" r="2.5"/><path d="M5 7.5v5M7.5 5h2a2 2 0 012 2v1"/>',
  debug: '<circle cx="10" cy="10" r="6"/><path d="M8 7.5l4 2.5-4 2.5z"/>',
  ext: '<rect x="3" y="3" width="6" height="6"/><rect x="11" y="3" width="6" height="6"/><rect x="3" y="11" width="6" height="6"/><path d="M11 11h6v6h-6z"/>',
};

function renderIcon(name, color, active) {
  return (
    `<span class="icon${active ? ' on' : ''}" style="--ic:${color}">` +
    `<svg viewBox="0 0 20 20" fill="none" stroke="${color}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${ICONS[name]}</svg>` +
    `</span>`
  );
}

const TREE = [
  { name: 'src', kind: 'folder', open: true },
  { name: 'palette.js', kind: 'file', git: 'M', depth: 1 },
  { name: 'theme.js', kind: 'file', git: 'M', depth: 1 },
  { name: 'contrast.js', kind: 'file', git: 'U', depth: 1, active: true },
  { name: 'build.js', kind: 'file', depth: 1 },
  { name: 'themes', kind: 'folder', open: true },
  { name: 'lagoon.json', kind: 'file', git: 'A', depth: 1 },
  { name: 'package.json', kind: 'file' },
  { name: 'README.md', kind: 'file' },
];

function renderTree(variant) {
  const { neutrals: n, accents: a } = variant;
  const gitColor = { M: a.amber, A: a.green, U: a.sky, D: a.rose };
  return TREE.map((item) => {
    const isFolder = item.kind === 'folder';
    const color = item.git ? gitColor[item.git] : isFolder ? n.text : n.subtle;
    const pad = 10 + (item.depth || 0) * 14;
    const bg = item.active ? `background:${n.surface0};` : '';
    const chevron = isFolder
      ? `<span class="chev" style="color:${n.subtle}">${item.open ? '▾' : '▸'}</span>`
      : '<span class="chev"></span>';
    const badge = item.git ? `<span class="git" style="color:${color}">${item.git}</span>` : '';
    return (
      `<div class="tree-row" style="${bg}padding-left:${pad}px">` +
      chevron +
      `<span style="color:${color}${isFolder ? ';font-weight:600' : ''}">${esc(item.name)}</span>` +
      badge +
      `</div>`
    );
  }).join('\n');
}

function renderWindow(variant, lines, id) {
  const { neutrals: n, accents: a } = variant;
  return `
<figure class="specimen" id="${id}">
  <div class="win" style="--crust:${n.crust};--mantle:${n.mantle};--base:${n.base};--surface1:${n.surface1};--text:${n.text};--muted:${n.muted};--subtle:${n.subtle};--bright:${n.bright};--teal:${a.teal}">
    <div class="titlebar">
      <span class="dots"><i></i><i></i><i></i></span>
      <span class="title">lagoon — src/contrast.ts</span>
    </div>
    <div class="body">
      <nav class="activitybar" aria-hidden="true">
        ${renderIcon('files', a.teal, true)}
        ${renderIcon('search', n.muted)}
        ${renderIcon('git', n.muted)}
        ${renderIcon('debug', n.muted)}
        ${renderIcon('ext', n.muted)}
        <span class="badge" style="background:${a.teal};color:${n.crust}">3</span>
      </nav>
      <aside class="sidebar">
        <div class="sb-title" style="color:${n.muted}">Explorer</div>
        ${renderTree(variant)}
      </aside>
      <div class="pane">
        <div class="tabs">
          <span class="tab on" style="border-top-color:${a.teal};background:${n.base};color:${n.bright}">contrast.ts</span>
          <span class="tab" style="color:${n.muted}">palette.js</span>
          <span class="tab" style="color:${n.muted}">theme.js<i class="mod" style="background:${a.amber}"></i></span>
        </div>
        <div class="editor">${renderCode(variant, lines)}</div>
      </div>
    </div>
    <div class="statusbar">
      <span style="color:${a.teal}">⎇ main</span>
      <span style="color:${n.subtle}">↑2 ↓0</span>
      <span style="color:${a.rose}">✕ 0</span>
      <span style="color:${a.amber}">⚠ 1</span>
      <span class="spacer"></span>
      <span style="color:${n.subtle}">Ln ${ACTIVE_LINE}, Col 34</span>
      <span style="color:${n.subtle}">Spaces: 2</span>
      <span style="color:${n.subtle}">TypeScript</span>
    </div>
  </div>
  <figcaption>
    <strong>${esc(variant.name)}</strong>
    <span class="mono">editor.background ${variant.neutrals.base}</span>
  </figcaption>
</figure>`;
}

// ---------------------------------------------------------------------------
// Palette and audit tables — the numbers come from the same functions the
// build gate uses, so the page reports measurements rather than claims.
// ---------------------------------------------------------------------------

const ROLE_NOTES = {
  teal: 'functions, methods, decorators, every UI accent',
  sky: 'properties, object keys, tag attributes',
  lavender: 'keywords, control flow, storage modifiers',
  orchid: 'imports, language constants, regex, CSS variables',
  rose: 'errors, invalid, this / self, HTML tags',
  apricot: 'numbers, constants, enum members, escapes',
  amber: 'types, classes, interfaces, namespaces',
  green: 'strings',
};

function renderSwatches(variant) {
  const { neutrals: n, accents: a } = variant;
  const bg = n.base;
  const rows = Object.entries(a).map(([name, hex]) => {
    const ratio = contrast(hex, bg);
    return `
    <div class="sw">
      <span class="chip" style="background:${bg};border-color:${n.surface1}">
        <span class="chip-dot" style="background:${hex}"></span>
        <span class="chip-code" style="color:${hex}">Aa</span>
      </span>
      <span class="sw-meta">
        <span class="sw-name">${name}</span>
        <span class="mono sw-hex">${hex}</span>
        <span class="mono sw-ratio">${ratio.toFixed(2)}:1 <b>${level(ratio).trim()}</b></span>
      </span>
      <span class="sw-note">${ROLE_NOTES[name]}</span>
    </div>`;
  });
  return rows.join('');
}

function renderRamp(variant) {
  const { neutrals: n } = variant;
  const order = ['crust', 'mantle', 'base', 'elevated', 'surface0', 'surface1', 'surface2', 'muted', 'subtle', 'text', 'bright'];
  return order
    .map((k) => `<div class="step"><span class="step-fill" style="background:${n[k]}"></span><span class="mono step-label">${k}</span><span class="mono step-hex">${n[k]}</span></div>`)
    .join('');
}

function closestPair(variant) {
  const entries = Object.entries(variant.accents);
  let best = { pair: '', d: Infinity };
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const d = deltaE(entries[i][1], entries[j][1]);
      if (d < best.d) best = { pair: `${entries[i][0]} / ${entries[j][0]}`, d };
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const D = variants.dark;
const L = variants.dawn;
const S = variants.soft;
const pair = closestPair(D);
const minRatio = Math.min(...Object.values(D.accents).map((h) => contrast(h, D.neutrals.base)));

const DESCRIPTION =
  'A teal-on-indigo VS Code theme in three variants. Monochromatic indigo chrome, ' +
  'pastel split-complementary syntax, and contrast enforced at build time.';

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lagoon — a teal-on-indigo VS Code theme</title>
<meta name="description" content="${DESCRIPTION}">
<link rel="icon" type="image/png" href="icon.png">
<meta name="theme-color" content="${D.neutrals.crust}" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="${L.neutrals.crust}" media="(prefers-color-scheme: light)">
<meta property="og:type" content="website">
<meta property="og:title" content="Lagoon — a teal-on-indigo VS Code theme">
<meta property="og:description" content="${DESCRIPTION}">
<meta property="og:image" content="https://${REPO.split('/')[0]}.github.io/${REPO.split('/')[1]}/icon.png">
<meta name="twitter:card" content="summary">
<style>
  /* Page tokens. Light wears Lagoon Dawn, dark wears Lagoon, so the
     page is itself a specimen of the theme rather than a description of it. */
  :root {
    --ground: ${L.neutrals.crust};
    --ground-alt: ${L.neutrals.mantle};
    --ink: ${L.neutrals.text};
    --ink-dim: ${L.neutrals.subtle};
    --ink-faint: ${L.neutrals.muted};
    --rule: ${L.neutrals.surface1};
    --accent: ${L.accents.teal};
    --accent-soft: ${alpha(L.accents.teal, 0.1)};
    --glow: transparent;
    --shadow: 0 1px 2px ${alpha(L.neutrals.bright, 0.06)}, 0 12px 32px ${alpha(L.neutrals.bright, 0.08)};
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --ground: ${D.neutrals.crust};
      --ground-alt: ${D.neutrals.mantle};
      --ink: ${D.neutrals.text};
      --ink-dim: ${D.neutrals.subtle};
      --ink-faint: ${D.neutrals.muted};
      --rule: ${D.neutrals.surface1};
      --accent: ${D.accents.teal};
      --accent-soft: ${alpha(D.accents.teal, 0.12)};
      --glow: ${alpha(D.accents.teal, 0.16)};
      --shadow: 0 1px 2px ${alpha('#000000', 0.4)}, 0 24px 64px ${alpha('#000000', 0.5)};
    }
  }
  :root[data-theme="light"] {
    --ground: ${L.neutrals.crust};
    --ground-alt: ${L.neutrals.mantle};
    --ink: ${L.neutrals.text};
    --ink-dim: ${L.neutrals.subtle};
    --ink-faint: ${L.neutrals.muted};
    --rule: ${L.neutrals.surface1};
    --accent: ${L.accents.teal};
    --accent-soft: ${alpha(L.accents.teal, 0.1)};
    --glow: transparent;
    --shadow: 0 1px 2px ${alpha(L.neutrals.bright, 0.06)}, 0 12px 32px ${alpha(L.neutrals.bright, 0.08)};
  }
  :root[data-theme="dark"] {
    --ground: ${D.neutrals.crust};
    --ground-alt: ${D.neutrals.mantle};
    --ink: ${D.neutrals.text};
    --ink-dim: ${D.neutrals.subtle};
    --ink-faint: ${D.neutrals.muted};
    --rule: ${D.neutrals.surface1};
    --accent: ${D.accents.teal};
    --accent-soft: ${alpha(D.accents.teal, 0.12)};
    --glow: ${alpha(D.accents.teal, 0.16)};
    --shadow: 0 1px 2px ${alpha('#000000', 0.4)}, 0 24px 64px ${alpha('#000000', 0.5)};
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--ground);
    color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    font-size: 17px;
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
  }

  .mono, code, .win, .sw-hex, .sw-ratio, .step-label, .step-hex {
    font-family: ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace;
    font-variant-numeric: tabular-nums;
  }

  .wrap { max-width: 1140px; margin: 0 auto; padding: 0 24px; }
  .prose { max-width: min(64ch, 100%); }

  /* Grid and flex items default to min-width: auto, which means an unbreakable
     string — a shell command, a long hex row — sets a floor under the track and
     pushes the whole page sideways. Anything that can hold code needs an
     explicit floor of zero so its own overflow container does the scrolling. */
  .stack > *, ol.steps > li, .sw, .pane, .editor, pre, .scroll { min-width: 0; }

  /* ---- Masthead ---- */
  header { padding: clamp(48px, 9vw, 96px) 0 clamp(32px, 5vw, 56px); }
  .mark {
    display: block; width: 76px; height: 76px; border-radius: 17px;
    margin: 0 0 26px; box-shadow: var(--shadow);
  }
  .eyebrow {
    font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace;
    font-size: 0.75rem; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--accent); margin: 0 0 20px;
  }
  h1 {
    font-family: ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, monospace;
    font-size: clamp(2.4rem, 7vw, 4.25rem);
    font-weight: 600; letter-spacing: -0.035em; line-height: 1.02;
    margin: 0 0 24px; text-wrap: balance;
  }
  h1 .dim { color: var(--ink-faint); }
  .lede { font-size: 1.2rem; color: var(--ink-dim); margin: 0; text-wrap: pretty; }

  .facts { display: flex; flex-wrap: wrap; gap: 12px; margin: 36px 0 0; padding: 0; list-style: none; }
  .facts li {
    font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace;
    font-size: 0.8125rem; font-variant-numeric: tabular-nums;
    padding: 7px 13px; border: 1px solid var(--rule); border-radius: 999px;
    color: var(--ink-dim); background: var(--ground-alt);
  }
  .facts b { color: var(--accent); font-weight: 600; }
  .repo-link {
    font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace;
    font-size: 0.8125rem; margin: 28px 0 0;
  }

  /* ---- Sections ---- */
  section { padding: clamp(40px, 6vw, 72px) 0; border-top: 1px solid var(--rule); }
  section > .wrap > .label {
    font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace;
    font-size: 0.6875rem; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--ink-faint); margin: 0 0 10px;
  }
  h2 { font-size: 1.75rem; font-weight: 650; letter-spacing: -0.02em; margin: 0 0 14px; text-wrap: balance; }
  h3 { font-size: 1.0625rem; font-weight: 650; margin: 32px 0 8px; }
  p { margin: 0 0 16px; }
  a { color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: 3px; }
  a:focus-visible, .win:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

  /* ---- Hero glow: the lagoon cloud, only visible at night ---- */
  .hero-specimen { position: relative; }
  .hero-specimen::before {
    /* Horizontal inset stays at 0: the gradient fades out by 72% of the box, so
       bleeding sideways adds nothing visible and does widen the scroll area. */
    content: ""; position: absolute; inset: -8% 0 20%;
    background: radial-gradient(58% 52% at 50% 42%, var(--glow), transparent 72%);
    filter: blur(46px); pointer-events: none; z-index: 0;
  }
  .hero-specimen .specimen { position: relative; z-index: 1; }

  /* ---- Editor specimen ---- */
  .specimen { margin: 0; }
  .win {
    background: var(--base); border: 1px solid var(--surface1); border-radius: 10px;
    overflow: hidden; box-shadow: var(--shadow); font-size: 12.5px; line-height: 1.62;
  }
  .titlebar {
    background: var(--crust); display: flex; align-items: center; gap: 12px;
    padding: 9px 12px; border-bottom: 1px solid var(--crust);
  }
  .dots { display: flex; gap: 6px; }
  .dots i { width: 9px; height: 9px; border-radius: 50%; background: var(--surface1); }
  .title { color: var(--muted); font-size: 11.5px; }

  .body { display: grid; grid-template-columns: 44px 190px 1fr; min-height: 300px; }

  .activitybar {
    background: var(--crust); display: flex; flex-direction: column; align-items: center;
    gap: 4px; padding: 10px 0; position: relative;
  }
  .icon { display: grid; place-items: center; width: 40px; height: 38px; position: relative; }
  .icon svg { width: 19px; height: 19px; }
  .icon.on::before {
    content: ""; position: absolute; left: 0; top: 5px; bottom: 5px; width: 2px; background: var(--ic);
  }
  .activitybar .badge {
    position: absolute; top: 30px; left: 22px; min-width: 15px; height: 15px; border-radius: 999px;
    font-size: 9.5px; font-weight: 700; display: grid; place-items: center; padding: 0 4px;
  }

  .sidebar { background: var(--mantle); padding: 8px 0; overflow: hidden; }
  .sb-title { font-size: 10.5px; letter-spacing: 0.11em; text-transform: uppercase; padding: 3px 12px 9px; }
  .tree-row { display: flex; align-items: center; gap: 5px; padding: 2.5px 8px 2.5px 0; white-space: nowrap; }
  .chev { width: 11px; display: inline-block; font-size: 9px; flex: none; }
  .git { margin-left: auto; padding-right: 10px; font-size: 10.5px; font-weight: 700; }

  .pane { display: flex; flex-direction: column; min-width: 0; background: var(--base); }
  .tabs { background: var(--crust); display: flex; }
  .tab {
    padding: 8px 15px 8px; font-size: 11.5px; border-top: 2px solid transparent;
    display: inline-flex; align-items: center; gap: 7px; white-space: nowrap;
  }
  .tab .mod { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
  .editor { padding: 10px 0 16px; overflow-x: auto; }
  .row { display: flex; }
  .ln { flex: none; width: 46px; text-align: right; padding-right: 18px; user-select: none; }
  .code { white-space: pre; padding-right: 20px; }

  .statusbar {
    background: var(--crust); display: flex; align-items: center; gap: 15px;
    padding: 5px 14px; font-size: 11px;
  }
  .statusbar .spacer { flex: 1; }

  figcaption {
    display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px;
    margin-top: 14px; font-size: 0.8125rem; color: var(--ink-faint);
  }
  figcaption strong { color: var(--ink); font-size: 0.9375rem; }

  .stack { display: grid; gap: clamp(40px, 6vw, 64px); }

  /* ---- Swatches ---- */
  .swatches { display: grid; gap: 1px; background: var(--rule); border: 1px solid var(--rule); border-radius: 10px; overflow: hidden; margin-top: 28px; }
  .sw { display: grid; grid-template-columns: 66px minmax(190px, 240px) 1fr; align-items: center; gap: 18px; background: var(--ground); padding: 13px 18px; }
  .chip { display: inline-flex; align-items: center; justify-content: center; gap: 5px; width: 66px; height: 38px; border-radius: 7px; border: 1px solid; }
  .chip-dot { width: 11px; height: 11px; border-radius: 50%; }
  .chip-code { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 13px; font-weight: 600; }
  .sw-meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
  .sw-name { font-weight: 650; font-size: 0.9375rem; }
  .sw-hex { font-size: 0.78125rem; color: var(--ink-faint); }
  .sw-ratio { font-size: 0.78125rem; color: var(--ink-dim); }
  .sw-ratio b { color: var(--accent); font-weight: 600; }
  .sw-note { font-size: 0.875rem; color: var(--ink-dim); }

  /* ---- Neutral ramp ---- */
  .ramp { display: grid; grid-template-columns: repeat(auto-fit, minmax(84px, 1fr)); gap: 2px; margin-top: 28px; border-radius: 10px; overflow: hidden; }
  .step { display: flex; flex-direction: column; }
  /* The darkest step is the same value as the page ground, so every swatch needs
     an edge of its own or crust reads as a hole in the ramp. */
  .step-fill { height: 76px; outline: 1px solid var(--rule); outline-offset: -1px; }
  .step-label { font-size: 0.6875rem; padding: 7px 6px 1px; color: var(--ink); }
  .step-hex { font-size: 0.625rem; padding: 0 6px 8px; color: var(--ink-faint); }

  /* ---- Steps (a real sequence, hence the numbers) ---- */
  ol.steps { counter-reset: s; list-style: none; padding: 0; margin: 26px 0 0; display: grid; gap: 22px; max-width: min(68ch, 100%); }
  ol.steps li { counter-increment: s; padding-left: 44px; position: relative; }
  ol.steps li::before {
    content: counter(s); position: absolute; left: 0; top: 1px;
    width: 27px; height: 27px; border-radius: 50%;
    background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent);
    font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 0.75rem; font-weight: 700;
    display: grid; place-items: center;
  }
  pre {
    background: var(--ground-alt); border: 1px solid var(--rule); border-radius: 8px;
    padding: 13px 16px; overflow-x: auto; font-size: 0.8125rem; margin: 12px 0 0;
    color: var(--ink);
  }

  table { width: 100%; border-collapse: collapse; margin-top: 26px; font-size: 0.9375rem; }
  th, td { text-align: left; padding: 11px 14px; border-bottom: 1px solid var(--rule); vertical-align: top; }
  th {
    font-family: ui-monospace, "SF Mono", Menlo, monospace; font-weight: 600;
    font-size: 0.6875rem; letter-spacing: 0.13em; text-transform: uppercase; color: var(--ink-faint);
  }
  td.hex { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 0.8125rem; color: var(--ink-dim); white-space: nowrap; }
  .scroll { overflow-x: auto; }

  footer { border-top: 1px solid var(--rule); padding: 36px 0 60px; color: var(--ink-faint); font-size: 0.875rem; }

  @media (max-width: 760px) {
    .body { grid-template-columns: 38px 1fr; }
    .sidebar { display: none; }
    .sw { grid-template-columns: 66px 1fr; }
    .sw-note { grid-column: 2; }
  }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
</style>
</head>
<body>

<header>
  <div class="wrap">
    <img class="mark" src="icon.png" width="76" height="76" alt="Lagoon icon: two teal waves on an indigo ground">
    <p class="eyebrow">VS Code colour theme</p>
    <h1>Lagoon<span class="dim">.</span></h1>
    <p class="lede prose">A lagoon is the one place where water reads as two colours at once:
      luminous teal across the shallows, deep indigo where the floor drops away. That is the whole
      palette — monochromatic indigo chrome, one glowing teal accent, and pastel syntax that never
      raises its voice.</p>
    <p class="repo-link"><a href="https://github.com/${REPO}">github.com/${REPO}</a></p>
    <ul class="facts">
      <li>3 variants</li>
      <li>chrome hue <b>243°</b>, one hue throughout</li>
      <li>body text <b>${contrast(D.neutrals.text, D.neutrals.base).toFixed(1)}:1</b> AAA</li>
      <li>every accent <b>≥ ${minRatio.toFixed(1)}:1</b></li>
      <li>closest two accents <b>ΔE ${pair.d.toFixed(0)}</b></li>
    </ul>
  </div>
</header>

<section style="border-top: none; padding-top: 0">
  <div class="wrap hero-specimen">
    ${renderWindow(D, SAMPLE, 'lagoon')}
  </div>
</section>

<section>
  <div class="wrap">
    <p class="label">How it was built</p>
    <h2>Borrowed from what already works, then pushed one degree</h2>
    <div class="prose">
      <p>The ten most-installed dark themes on the marketplace agree on more than they let on.
        One Dark Pro sits at <code>#282c34</code>, Dracula at <code>#282a36</code>, Tokyo Night at
        <code>#1a1b26</code>, Catppuccin at <code>#1e1e2e</code>, Nord at <code>#2e3440</code>.
        Every one of them is a desaturated blue between 205° and 240°. Not one uses neutral grey,
        and not one uses black.</p>
      <p>They agree on the syntax map too: green strings, orange numbers, purple keywords,
        yellow types, blue functions. And the ones still climbing the charts — Catppuccin,
        Tokyo Night — are the pastel ones. Restraint is what people actually mean when they
        call a theme easy on the eyes.</p>
      <p>Lagoon keeps all of that and changes one thing. Functions and every piece of UI
        accent are <span style="color:${D.accents.teal};font-weight:600">teal</span> instead of
        blue, which sits split-complementary to the indigo ground — the pairing the ground was
        chosen for. Functions are the accent you see most often, so that single substitution
        is what the theme feels like.</p>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="label">Accents</p>
    <h2>Eight hues, each doing one job</h2>
    <p class="prose">Ratios are measured against the editor background. The build refuses to emit a
      theme if any accent drops below 4.5:1, or if any two accents land closer than ΔE 22 —
      close enough that two different roles would start to look like the same colour.</p>
    ${`<div class="swatches">${renderSwatches(D)}</div>`}
  </div>
</section>

<section>
  <div class="wrap">
    <p class="label">Chrome</p>
    <h2>One hue, eleven values</h2>
    <p class="prose">Every panel, border, and background in the editor is hue 243 — an indigo with a
      faint plum lean. Saturation falls as lightness rises, so the light end of the ramp reads as
      text rather than as tinted text. Depth comes from value alone, which is why the UI has almost
      no visible borders.</p>
    <div class="ramp">${renderRamp(D)}</div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="label">Variants</p>
    <h2>Same design, three grounds</h2>
    <p class="prose">Soft lifts the ramp about five points of lightness for bright rooms and drops the
      accents to match. Dawn keeps the identical hues and inverts the value ramp — on a light ground
      the accents have to go dark and saturated, or pastels wash out to nothing.</p>
    <div class="stack" style="margin-top: 34px">
      ${renderWindow(S, SAMPLE.slice(0, 16), 'soft')}
      ${renderWindow(L, SAMPLE.slice(0, 16), 'dawn')}
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="label">Role map</p>
    <h2>What gets which colour</h2>
    <p class="prose">Semantic tokens and TextMate scopes are both mapped, and mapped to agree with
      each other — so the colour of an identifier does not change when a language server wakes up.</p>
    <div class="scroll">
      <table>
        <thead><tr><th>Token</th><th>Colour</th><th>Dark</th><th>Dawn</th></tr></thead>
        <tbody>
          ${Object.entries(ROLE_NOTES).map(([name, note]) => `<tr>
            <td>${note.charAt(0).toUpperCase() + note.slice(1)}</td>
            <td><span style="color:${D.accents[name]};font-weight:600">${name}</span></td>
            <td class="hex">${D.accents[name]}</td>
            <td class="hex">${L.accents[name]}</td>
          </tr>`).join('')}
          <tr><td>Comments</td><td><span style="color:${D.neutrals.muted};font-weight:600">muted</span>, italic</td><td class="hex">${D.neutrals.muted}</td><td class="hex">${L.neutrals.muted}</td></tr>
          <tr><td>Punctuation, operators, parameters</td><td><span style="color:${D.neutrals.subtle};font-weight:600">subtle</span></td><td class="hex">${D.neutrals.subtle}</td><td class="hex">${L.neutrals.subtle}</td></tr>
          <tr><td>Plain identifiers</td><td><span style="font-weight:600">text</span></td><td class="hex">${D.neutrals.text}</td><td class="hex">${L.neutrals.text}</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="label">Install</p>
    <h2>Three steps</h2>
    <ol class="steps">
      <li>Open the Extensions view with <code>⇧⌘X</code>, search <strong>Lagoon</strong>, and click
        Install. From a terminal instead:
        <pre>code --install-extension lagoon.lagoon</pre></li>
      <li>Open the theme picker with <code>⌘K ⌘T</code>.</li>
      <li>Pick <strong>Lagoon</strong>, <strong>Lagoon Soft</strong>, or
        <strong>Lagoon Dawn</strong>.</li>
    </ol>
    <p style="margin-top:22px">Prefer to build it yourself? Grab the <code>.vsix</code> from the
      <a href="https://github.com/${REPO}/releases/latest">latest release</a>, or clone the repo
      straight into <code>~/.vscode/extensions/lagoon</code> — no packaging step required.</p>
    <h3>Changing a colour</h3>
    <p class="prose">Edit the HSL values in <code>src/palette.js</code> and rebuild. The generated
      JSON in <code>themes/</code> is build output — editing it directly gets overwritten, and skips
      the contrast gate.</p>
    <pre>npm run build   # regenerate all three variants and audit them
npm run preview # regenerate this page</pre>
  </div>
</section>

<footer>
  <div class="wrap">
    <p>Lagoon · MIT · <a href="https://github.com/${REPO}">source</a> ·
      generated by <code>src/preview.js</code> from <code>src/palette.js</code> — the swatches and
      ratios on this page are read from the same palette the themes are built from.</p>
  </div>
</footer>

</body>
</html>
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
// .nojekyll stops Pages running the output through Jekyll, which would otherwise
// try to interpret the file and can drop paths beginning with an underscore.
fs.writeFileSync(path.join(path.dirname(OUT), '.nojekyll'), '');
console.log(`wrote docs/index.html (${(html.length / 1024).toFixed(1)} kB)`);
