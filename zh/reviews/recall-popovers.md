# Symbol recall popovers: independent interaction review

Date: 15 October 2026. Scope: accessibility and interaction state only. This review does not re-assess mathematical wording, TeX, Julia examples or numerical results.

## Preliminary review

The existing renderer emits an adjacent `.formula-recall[role="note"]` with the complete explanation. The planned enhancement should preserve that adjacency and content while replacing the persistent panel with a small, named, focusable trigger and a non-modal popover.

The implementation review will check these risks:

- Focus may open the popover before the following Enter/click event; that activation must keep it open rather than immediately toggle it shut.
- Escape and the close control must dismiss the popover without the unchanged hover or focus immediately reopening it.
- Moving across the gap from the trigger into the panel must allow sufficient time to enter, and focused panel content must remain available when the pointer leaves.
- The trigger needs synchronised `aria-expanded`, `aria-controls` and `aria-haspopup="dialog"`; the panel needs an accessible name and a named close control.
- Tab navigation must reach the explanation and close control without a modal focus trap. Keyboard dismissal should restore a useful focus position when appropriate.
- A panel promoted to the native top layer must close explicitly when its chapter is hidden or a containing answer is collapsed.
- Narrow screens, zoom, scrolling, resizing and long formulae must not strand content beyond the visual viewport. The explanation must support scrolling without dismissal.
- Native light dismissal and the non-native fallback must synchronise the same state, including delayed close timers.

## Evidence and status

Read-only source inspection completed for `scripts/markdown.js`, `zh/src/recall-popovers.js`, navigation and inline-maths handling in `zh/src/app.js`, and the corresponding rules in `zh/src/style.css`.

## Final static review

**Pass: no outstanding actionable findings in the inspected implementation.**

| Area | Inspected behaviour |
|---|---|
| Semantics | Each adjacent note retains its own explanation. A real button identifies a named non-modal dialog through a unique sequential ID, `aria-controls`, `aria-haspopup` and synchronised `aria-expanded`. The dialog contains a named close button. |
| Keyboard | Focus opens the local panel without stealing focus. Enter/click pins an already transiently open panel and moves focus into it. Escape and the close control dismiss it; closing from inside restores focus to the trigger. The panel does not introduce a modal focus trap. |
| Hover | Fine-pointer entry opens the local explanation. A 180 ms close delay bridges the gap; panel entry cancels it. Focus within the note prevents hover departure from dismissing the content. Hovering another trigger does not displace a pinned or actively read panel. |
| Dismissal state | Explicit dismissal suppresses immediate reopening. The `closing` guard prevents native focus restoration from re-entering the open routine. Outside pointer dismissal is explicit. Native `toggle` events synchronise the trigger state. |
| Touch | Click/tap supports opening and pinning without hover. Mobile trigger and close controls have 44 px minimum heights. Outside pointer interaction dismisses the active panel. |
| Reading and scrolling | The panel has constrained dimensions and its own scrolling area; its header stays available while scrolling. Internal scrolling does not dismiss it. Oversized inline maths receives a keyboard focus target when the panel is positioned. |
| Viewport | Positioning clamps both axes using the visual viewport's dimensions and offsets, with a 16 px margin. Window and visual-viewport changes reposition the active panel. Scrolling keeps it anchored and dismisses it if its trigger leaves the visible vertical range. |
| Scope | The renderer still processes each answer body within its original `details` element. Collapsing an ancestor answer closes the active panel; hash navigation also closes it. At most one module-managed panel is active. |
| Fallback | Browsers without the native API use the same state and event handlers with an `.is-open` class. The CSS displays that fallback explicitly. |

The initial visual-viewport concern is resolved in the reviewed source. The potential native focus-restoration re-entry is covered by the closing guard and explicit outside dismissal. These are source-level conclusions, not claims of observed browser behaviour.

## Verification boundary

No browser, screen-reader or other assistive-technology checks have been performed by this reviewer. The lead reports a successful build and 82 passing JavaScript tests; those are reported evidence, not independently executed here. This reviewer's attempted Node syntax/renderer checks could not run because `node` is unavailable on the review shell's PATH. The lead owns browser verification and screenshots. This review changes only this record; it does not edit the implementation, course content, formulae or examples.
