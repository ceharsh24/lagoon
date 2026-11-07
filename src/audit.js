'use strict';

/**
 * The build audit.
 *
 * A theme is a few hundred colour decisions, and "looks fine on my monitor" is
 * not a contrast check. The palette checks below hold the raw colours to their
 * floors against the editor background; everything after them checks the theme
 * as VS Code will draw it — each foreground on the surface it actually sits on,
 * with translucent colours flattened onto what is underneath. A palette can
 * pass while the theme fails: comment grey clears 4.5:1 on the editor and not
 * on a hover widget, an accent clears it on the editor and not on the
 * current-line highlight.
 */

const { contrast, deltaE, deltaE2000, simulate, composite, level, CVD_KINDS } = require('./contrast');

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
// floor, plus distance from every syntax accent.
const MIN_TEXT = 7.0;
const MIN_ACCENT = 4.5;
const MIN_COMMENT = 3.0;
const WANT_COMMENT = 4.5;
const MIN_FAINT = 3.0;
const MIN_DELTA_E = 22;
const MAX_ACCENT_SPREAD = 1.35;

// A flat brightness band is exactly the case where colour-vision deficiency
// hurts most: with lightness equal, hue is the only cue, and protanopia and
// deuteranopia take away the red–green half of it. Every pair of accents must
// stay at least this far apart (CIEDE2000) as those viewers see them. 3.5 is
// a floor, not a target — the dark variants clear 4.5.
const MIN_CVD_DELTA_E = 3.5;

// UI text — labels, tabs, list rows — is held to AA. Icons and deliberately
// quiet text (line numbers, disabled, ignored files) to the 3:1 that WCAG asks
// of non-text UI.
const UI_TEXT = 4.5;
const UI_QUIET = 3.0;

// Translucent washes over code — selection, find matches, word highlights —
// are transient, so every token only has to stay at 3:1 on them. The
// current-line highlight is not transient: it is wherever you are typing, so
// tokens keep their full floors there.
const MIN_ON_WASH = 3.0;

// -- What to check ------------------------------------------------------------

// [foreground key, background key, floor, surface under a translucent background]
const UI_PAIRS = [
  // Chrome
  ['titleBar.activeForeground', 'titleBar.activeBackground', UI_TEXT],
  ['titleBar.inactiveForeground', 'titleBar.inactiveBackground', UI_TEXT],
  ['activityBar.foreground', 'activityBar.background', UI_QUIET],
  ['activityBar.inactiveForeground', 'activityBar.background', UI_QUIET],
  ['sideBar.foreground', 'sideBar.background', UI_TEXT],
  ['sideBarTitle.foreground', 'sideBarTitle.background', UI_TEXT],
  ['sideBarSectionHeader.foreground', 'sideBarSectionHeader.background', UI_TEXT],
  ['icon.foreground', 'sideBar.background', UI_QUIET],
  ['disabledForeground', 'sideBar.background', UI_QUIET],
  ['tab.activeForeground', 'tab.activeBackground', UI_TEXT],
  ['tab.inactiveForeground', 'tab.inactiveBackground', UI_TEXT],
  ['tab.unfocusedActiveForeground', 'tab.unfocusedActiveBackground', UI_TEXT],
  ['tab.unfocusedInactiveForeground', 'tab.inactiveBackground', UI_TEXT],
  ['tab.hoverForeground', 'tab.hoverBackground', UI_TEXT],
  ['breadcrumb.foreground', 'breadcrumb.background', UI_TEXT],
  ['breadcrumb.focusForeground', 'breadcrumb.background', UI_TEXT],
  ['panelTitle.activeForeground', 'panel.background', UI_TEXT],
  ['panelTitle.inactiveForeground', 'panel.background', UI_TEXT],
  ['statusBar.foreground', 'statusBar.background', UI_TEXT],
  ['statusBar.noFolderForeground', 'statusBar.noFolderBackground', UI_TEXT],
  ['statusBarItem.errorForeground', 'statusBar.background', UI_TEXT],
  ['statusBarItem.warningForeground', 'statusBar.background', UI_TEXT],
  ['statusBarItem.prominentForeground', 'statusBarItem.prominentBackground', UI_TEXT],
  ['commandCenter.foreground', 'commandCenter.background', UI_TEXT],
  ['commandCenter.activeForeground', 'commandCenter.activeBackground', UI_TEXT],
  ['banner.foreground', 'banner.background', UI_TEXT],

  // Filled controls: the label sits on the accent, not on the background.
  ['button.foreground', 'button.background', UI_TEXT],
  ['button.foreground', 'button.hoverBackground', UI_TEXT],
  ['button.secondaryForeground', 'button.secondaryBackground', UI_TEXT],
  ['button.secondaryForeground', 'button.secondaryHoverBackground', UI_TEXT],
  ['badge.foreground', 'badge.background', UI_TEXT],
  ['activityBarBadge.foreground', 'activityBarBadge.background', UI_TEXT],
  ['extensionButton.prominentForeground', 'extensionButton.prominentBackground', UI_TEXT],
  ['extensionButton.prominentForeground', 'extensionButton.prominentHoverBackground', UI_TEXT],
  ['extensionBadge.remoteForeground', 'extensionBadge.remoteBackground', UI_TEXT],
  ['statusBar.debuggingForeground', 'statusBar.debuggingBackground', UI_TEXT],
  ['statusBarItem.remoteForeground', 'statusBarItem.remoteBackground', UI_TEXT],

  // Lists and trees. The match highlight on the selected row is the text you
  // are reading, so it keeps the text floor there. Error and git colours on
  // the selected row only need 3:1: the row's status letter repeats the
  // information, and the selection itself is transient.
  ['list.activeSelectionForeground', 'list.activeSelectionBackground', UI_TEXT],
  ['list.inactiveSelectionForeground', 'list.inactiveSelectionBackground', UI_TEXT],
  ['list.hoverForeground', 'list.hoverBackground', UI_TEXT, 'sideBar.background'],
  ['list.highlightForeground', 'sideBar.background', UI_TEXT],
  ['list.focusHighlightForeground', 'list.activeSelectionBackground', UI_TEXT],
  ['list.highlightForeground', 'list.activeSelectionBackground', UI_TEXT],
  ['list.highlightForeground', 'list.inactiveSelectionBackground', UI_TEXT],
  ['list.errorForeground', 'sideBar.background', UI_TEXT],
  ['list.warningForeground', 'sideBar.background', UI_TEXT],
  ['list.deemphasizedForeground', 'sideBar.background', UI_TEXT],
  ['gitDecoration.addedResourceForeground', 'sideBar.background', UI_TEXT],
  ['gitDecoration.modifiedResourceForeground', 'sideBar.background', UI_TEXT],
  ['gitDecoration.deletedResourceForeground', 'sideBar.background', UI_TEXT],
  ['gitDecoration.untrackedResourceForeground', 'sideBar.background', UI_TEXT],
  ['gitDecoration.conflictingResourceForeground', 'sideBar.background', UI_TEXT],
  ['gitDecoration.ignoredResourceForeground', 'sideBar.background', UI_QUIET],
  ['list.errorForeground', 'list.activeSelectionBackground', UI_QUIET],
  ['list.warningForeground', 'list.activeSelectionBackground', UI_QUIET],
  ['gitDecoration.addedResourceForeground', 'list.activeSelectionBackground', UI_QUIET],
  ['gitDecoration.modifiedResourceForeground', 'list.activeSelectionBackground', UI_QUIET],
  ['gitDecoration.deletedResourceForeground', 'list.activeSelectionBackground', UI_QUIET],
  ['gitDecoration.untrackedResourceForeground', 'list.activeSelectionBackground', UI_QUIET],

  // Inputs, pickers, menus
  ['input.foreground', 'input.background', UI_TEXT],
  ['input.placeholderForeground', 'input.background', UI_TEXT],
  ['dropdown.foreground', 'dropdown.background', UI_TEXT],
  ['quickInput.foreground', 'quickInput.background', UI_TEXT],
  ['quickInputList.focusForeground', 'quickInputList.focusBackground', UI_TEXT],
  ['list.focusHighlightForeground', 'quickInputList.focusBackground', UI_TEXT],
  ['pickerGroup.foreground', 'quickInput.background', UI_TEXT],
  ['keybindingLabel.foreground', 'keybindingLabel.background', UI_TEXT, 'quickInput.background'],
  ['menu.foreground', 'menu.background', UI_TEXT],
  ['menu.selectionForeground', 'menu.selectionBackground', UI_TEXT],
  ['inputValidation.errorForeground', 'inputValidation.errorBackground', UI_TEXT],
  ['inputValidation.warningForeground', 'inputValidation.warningBackground', UI_TEXT],
  ['inputValidation.infoForeground', 'inputValidation.infoBackground', UI_TEXT],

  // Widgets over the editor
  ['editorWidget.foreground', 'editorWidget.background', UI_TEXT],
  ['descriptionForeground', 'editorWidget.background', UI_TEXT],
  ['descriptionForeground', 'sideBar.background', UI_TEXT],
  ['descriptionForeground', 'editor.background', UI_TEXT],
  ['errorForeground', 'editorWidget.background', UI_TEXT],
  ['textLink.foreground', 'editorHoverWidget.background', UI_TEXT],
  ['editorHoverWidget.foreground', 'editorHoverWidget.background', UI_TEXT],
  ['editorSuggestWidget.foreground', 'editorSuggestWidget.background', UI_TEXT],
  ['editorSuggestWidget.selectedForeground', 'editorSuggestWidget.selectedBackground', UI_TEXT],
  ['editorSuggestWidget.highlightForeground', 'editorSuggestWidget.background', UI_TEXT],
  ['editorSuggestWidget.focusHighlightForeground', 'editorSuggestWidget.selectedBackground', UI_TEXT],
  ['editorSuggestWidgetStatus.foreground', 'editorSuggestWidget.background', UI_TEXT],
  ['peekViewResult.fileForeground', 'peekViewResult.background', UI_TEXT],
  ['peekViewResult.lineForeground', 'peekViewResult.background', UI_TEXT],
  ['peekViewTitleLabel.foreground', 'peekViewTitle.background', UI_TEXT],
  ['peekViewTitleDescription.foreground', 'peekViewTitle.background', UI_TEXT],
  ['notifications.foreground', 'notifications.background', UI_TEXT],
  ['notificationLink.foreground', 'notifications.background', UI_TEXT],
  ['chat.slashCommandForeground', 'chat.slashCommandBackground', UI_TEXT, 'sideBar.background'],
  ['chat.avatarForeground', 'chat.avatarBackground', UI_TEXT],
  ['chat.editedFileForeground', 'sideBar.background', UI_TEXT],
  ['inlineChat.foreground', 'inlineChat.background', UI_TEXT],
  ['inlineChatInput.placeholderForeground', 'inlineChatInput.background', UI_TEXT],
  ['settings.headerForeground', 'editor.background', UI_TEXT],

  // Quiet text inside the editor. Ghost text and inlay hints are read, not
  // glanced at, so they get the full text floor; line numbers only need 3:1.
  ['editorLineNumber.foreground', 'editor.background', UI_QUIET],
  ['editorLineNumber.activeForeground', 'editor.background', UI_TEXT],
  ['editorGhostText.foreground', 'editor.background', UI_TEXT],
  ['editorInlayHint.foreground', 'editorInlayHint.background', UI_TEXT, 'editor.background'],
  ['editorInlayHint.typeForeground', 'editorInlayHint.typeBackground', UI_TEXT, 'editor.background'],
  ['editorInlayHint.parameterForeground', 'editorInlayHint.parameterBackground', UI_TEXT, 'editor.background'],
  ['editorCodeLens.foreground', 'editor.background', UI_TEXT],

  // Panel
  ['debugConsole.infoForeground', 'panel.background', UI_TEXT],
  ['debugConsole.warningForeground', 'panel.background', UI_TEXT],
  ['debugConsole.errorForeground', 'panel.background', UI_TEXT],
];

// Surfaces code is drawn on besides the editor background itself.
const WASHES = [
  'editor.selectionBackground',
  'editor.inactiveSelectionBackground',
  'editor.findMatchBackground',
  'editor.findMatchHighlightBackground',
  'editor.selectionHighlightBackground',
  'editor.wordHighlightBackground',
  'editor.wordHighlightStrongBackground',
];

// -- Audit --------------------------------------------------------------------

function auditVariant(variant, theme) {
  const { neutrals: n, accents: a, states: st } = variant;
  const c = theme.colors;
  const isDark = variant.type === 'dark';
  const bg = n.base;
  const rows = [];
  const failures = [];
  const warnings = [];
  const fail = (msg) => failures.push(`${variant.name}: ${msg}`);

  // Palette against the editor background --------------------------------------
  const check = (label, fg, min, want) => {
    const ratio = contrast(fg, bg);
    rows.push({ label, hex: fg, ratio, level: level(ratio) });
    if (ratio < min) fail(`${label} ${fg} is ${ratio.toFixed(2)}:1 against ${bg}, needs ${min}:1`);
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
    if (ratio > textRatio) fail(`${name} at ${ratio.toFixed(2)}:1 outshines body text (${textRatio.toFixed(2)}:1)`);
  }
  const sorted = [...ratios].sort((x, y) => x[1] - y[1]);
  const [dimmest, brightest] = [sorted[0], sorted[sorted.length - 1]];
  const spread = brightest[1] / dimmest[1];
  if (spread > MAX_ACCENT_SPREAD) {
    fail(`accent band too wide — ${brightest[0]} ${brightest[1].toFixed(2)}:1 vs ${dimmest[0]} ${dimmest[1].toFixed(2)}:1 (${spread.toFixed(2)}x, max ${MAX_ACCENT_SPREAD}x)`);
  }

  // Accents must be distinguishable from each other, not just from the
  // background — for everyone, and for the one in twelve men with red–green
  // colour-vision deficiency. States join both checks: error red collapsing
  // into rose would undo the reason red exists at all.
  const entries = Object.entries({ ...a, ...st });
  const closest = { pair: '—', d: Infinity };
  const cvdClosest = { pair: '—', d: Infinity, kind: '' };
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [[n1, h1], [n2, h2]] = [entries[i], entries[j]];
      const pair = `${n1} / ${n2}`;
      const d = deltaE(h1, h2);
      if (d < closest.d) Object.assign(closest, { pair, d });
      if (d < MIN_DELTA_E) fail(`accents ${pair} are only ΔE ${d.toFixed(1)} apart, needs ${MIN_DELTA_E}`);
      for (const kind of CVD_KINDS) {
        const dc = deltaE2000(simulate(h1, kind), simulate(h2, kind));
        if (dc < cvdClosest.d) Object.assign(cvdClosest, { pair, d: dc, kind });
        if (dc < MIN_CVD_DELTA_E) fail(`accents ${pair} are only ΔE2000 ${dc.toFixed(1)} apart with ${kind}, needs ${MIN_CVD_DELTA_E}`);
      }
    }
  }

  // The theme as drawn -------------------------------------------------------------
  const surface = (key, under = 'editor.background') => composite(c[key], composite(c[under], bg));
  let pairsChecked = 0;
  const worst = { label: '—', ratio: Infinity, min: 0 };
  const pair = (label, fg, onto, min) => {
    const ratio = contrast(composite(fg, onto), onto);
    pairsChecked++;
    if (ratio / min < worst.ratio / (worst.min || 1)) Object.assign(worst, { label, ratio, min });
    if (ratio < min) fail(`${label} is ${ratio.toFixed(2)}:1, needs ${min}:1`);
  };

  for (const [fgKey, bgKey, min, under] of UI_PAIRS) {
    if (!c[fgKey] || !c[bgKey]) {
      fail(`audit pair ${fgKey} on ${bgKey} names a key the theme does not set`);
      continue;
    }
    pair(`${fgKey} on ${bgKey}`, c[fgKey], surface(bgKey, under), min);
  }

  // Tokens on the surfaces code is actually drawn on.
  // State colours drop to 3:1 on the current line: red text (invalid tokens,
  // deleted diff lines) always arrives with a second cue — a squiggle or a
  // leading minus — and holding it to 4.5:1 there would mean either pushing
  // red into rose or making the line highlight invisible.
  const tokens = [
    ['text', n.text, MIN_TEXT],
    ['punctuation', n.subtle, MIN_ACCENT],
    ['comments', n.muted, MIN_COMMENT],
    ...Object.entries(a).map(([name, hex]) => [name, hex, MIN_ACCENT]),
    ...Object.entries(st).map(([name, hex]) => [name, hex, UI_QUIET]),
  ];
  const line = surface('editor.lineHighlightBackground');
  for (const [name, hex, min] of tokens) pair(`${name} on the current-line highlight`, hex, line, min);
  for (const wash of WASHES) {
    const onto = surface(wash);
    for (const [name, hex] of tokens) pair(`${name} on ${wash}`, hex, onto, MIN_ON_WASH);
  }

  // Terminal. The neutral slot on the background's own side (black on dark,
  // bright white on light) is exempt: it is used as a background, and as text
  // it is meant to vanish. Bright black is what shells use for autosuggestions
  // and what tools use for secondary output, so it is held to the text floor.
  const term = c['terminal.background'];
  const exempt = isDark ? 'terminal.ansiBlack' : 'terminal.ansiBrightWhite';
  for (const key of Object.keys(c).filter((k) => k.startsWith('terminal.ansi'))) {
    if (key === exempt) continue;
    const min = !isDark && key === 'terminal.ansiWhite' ? UI_QUIET : UI_TEXT;
    pair(`${key} on terminal.background`, c[key], term, min);
  }
  pair('terminal.foreground on terminal.background', c['terminal.foreground'], term, MIN_TEXT);

  return { rows, failures, warnings, closest, cvdClosest, pairsChecked, worst };
}

module.exports = { auditVariant, MIN_COMMENT, MIN_ACCENT, MIN_DELTA_E, MIN_CVD_DELTA_E };
