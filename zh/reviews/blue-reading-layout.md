# Blue reading theme and object layout: independent design and pedagogy review

Status: independent source and saved-image gates passed after local wording fixes; lead final browser integration acceptance completed and recorded separately below. This review is specific to the current blue theme, object-expression layout and reading-mode changes; earlier mathematical and browser reviews are not inherited as passes for the new rendering.

Ownership: this reviewer writes only this file. Reviewed the course contract and current object renderer, object CSS/runtime, and Chapter 8 trace CSS/view/runtime as direct rendering context. No numerical, Julia, chapter or implementation file is owned by this reviewer. Browser execution belongs to the lead and will be attributed separately.

## Acceptance gates

1. **Order and mathematical grouping.** Expression operands retain their existing DOM and reading order. Matrix concatenation, function arguments, parentheses, multiplication, elementwise operations and subsequent means keep their original scope. A styling change cannot move a minus sign to a different line or imply a different subtraction order.
2. **One expression row, local overflow.** Each complete graphical operation remains unwrapped. Wide operations scroll horizontally inside a clearly labelled, keyboard-focusable local region; the page itself remains within the viewport. Nested choices and concatenation groups cannot wrap internally. The beginning and end of each operation remain reachable.
3. **Row identity and alignment.** The same original patient keys align across patient operands, including nested concatenation and method-label wrappers. Titles, matrix column headers, provenance text and footers must not shift corresponding data rows. Two-row outcome-support vectors align separately and retain y=0/1 keys. Coefficient rows remain feature-aligned and explicitly distinct from patient rows; alignment must not imply a false patient-to-coefficient match.
4. **Operators and body centres.** Plus, minus, multiplication, equals and arrows are legible at reading size and vertically centred against the operand data body, rather than an uneven title/footer envelope. Larger symbols must not obscure provenance, clipping, row labels or grouping boundaries. Scalars remain recognisable as one-number outputs.
5. **Mathematical reading mode.** The generated mathematical-mode expression DOM has no Julia implementation section, code block, language-specific call syntax or implementation notes exposed visually or to assistive technology. Merely applying CSS hiding is insufficient. Keep mathematical notation, dimensions, full derivations, language-neutral pseudo-code where useful, exact units and original reference/causal limits. A mode change alters explanation, not data or calculations.
6. **Programming mode and future languages.** Julia mode retains actual executable snippets and accurate broadcasting/matrix/mean distinctions. The mathematical representation does not depend on Julia naming conventions; it can support a later R implementation without rewriting the mathematics. This round does not claim an implemented R mode.
7. **Blue/white reading surface.** The global reading surface, navigation, controls and focus affordances form a coherent blue/white theme. Semantic colours of objects remain stable and explicitly named; row identity and q0/q1 provenance never rely on colour alone. Body text, formula text, links and focus indicators remain readable against their backgrounds. Reference-inspired styling does not change clinical or mathematical content.
8. **Interaction preservation.** Paging, selection, reading-mode switches and reset retain full-n results and row identity. Local scrollers support keyboard operation and visible focus. Chapter 8 formula/column/Julia links and its persistent table continue to work through the new layout; scroll support does not intercept unrelated controls.

## Planned evidence

Inspect final generated markup and CSS for all implemented object stages in both reading modes, and inspect the trace formula/selected-row layout changes. Report concrete source blockers before source acceptance. Attribute actual viewport, keyboard, overflow and interaction tests to the lead. Saved screenshots may support a visual review, but this reviewer will not claim to have run browser tests without doing so.

## First implementation source pass

The new blue-theme layer changes reading surfaces, navigation, controls, borders and focus colours without redefining the semantic object palette or mathematical dimensions. Navy/white navigation, white main reading surfaces and blue accents form the requested hierarchy. This source inspection does not claim a pixel match to the external reference site or measured browser contrast.

The object renderer now generates a labelled, focusable local scrolling region around each expression. Final layout rules use max-content width, no wrapping, fixed operand widths and non-shrinking concatenation/method groups. Operators and arrows have larger dedicated sizes. The layout runtime aligns matching patient and outcome row starts after accounting for nested framing, then places operators and scalar value anchors against the data-row body centre. Feature coefficient vectors are excluded from patient/outcome alignment. It changes presentation margins and scroll controls only, without reading or altering numerical data.

A first-pass mode issue was reported: stage descriptions above the canvas still used implementation-oriented names such as design, qa and sum. Those descriptions have now been replaced with design matrix Z, mathematical fitted-Q labels and ordinary mathematical wording. The mathematical-mode renderer omits implementation panels at generation time, and its notes explain the same operations without language-specific broadcast syntax. Julia panels remain generated only in Julia mode. The underlying row keys, dimensions, full-n averaging and reference-distribution limits remain intact.

No source-level mathematical or teaching blocker has been identified in this pass. Actual alignment, no-wrap/overflow bounds, local scroll reachability, reading-mode accessibility and preserved interactions still require the lead's final browser evidence.

## Independent source and saved-image gate

Source gate passed after the description clean-up. Operand order and all mathematical calculations are preserved; a local scroller surrounds the expression without changing the expression's reading order. Hidden fit details are scheduled for layout when expanded, and mutation/resize/font events refresh presentation without changing model state. Mathematical mode retains exact algebra and shapes while omitting implementation panels from the generated DOM. No R mode is claimed.

This reviewer viewed the lead-produced saved images `blue-ch0-select-1360.png`, `blue-ch0-predict-1360.png` and `blue-ch1-replacement-375.png`. They show the blue/white reading hierarchy, aligned patient row starts through concatenation, clearly separate feature coefficients, larger operators at the data-body centre, and unbroken mobile expressions with explicit horizontal reading controls. This is a review of saved pixels, not browser execution by this reviewer. The visible selection provenance and dimensions remain legible alongside colour.

The lead's preliminary browser measurements reported identical first-patient row tops for prediction operands (330 px desktop, 309 px mobile) and selection operands (355 px desktop, 294 px mobile), with no page overflow or errors in those checks. The full-stage/mode, expanded-fit, keyboard-scroll and nine-chapter browser results were subsequently completed by the lead and are recorded below.

## Lead integration acceptance

The lead reports the following actual final results. These browser and complete-suite runs were executed by the lead, not this independent reviewer. They close the rendering and integration gates while preserving the independent source/saved-image attribution above.

- `blue-reading-browser.cjs` exited 0 at both 1360 px and 375 px. Each viewport covered 46 expressions spanning all 18 object stages in both modes and expanded hidden fit/g details. Measured matching-row top error was at most 0.75 px; operator-to-data-body centre error was at most 1 px. Pure operator symbols were at least 28 px and longer operation labels at least 18 px. No-wrap structure, range Home/End, scroller arrow keys, and absence of Julia implementation code/call syntax in mathematical-mode DOM passed.
- The same checks covered equal-height, same-row Chapter 8 update chains and symbol links; all five published Chinese pages' blue/white theme; reduced-motion behaviour; and absence of page overflow, console errors and external requests. All 13 tested colour-contrast combinations passed their assertions.
- `object-browser.cjs`, `tmle-trace-browser.cjs` and the complete nine-chapter `rhc-browser.cjs` each exited 0 at both viewports.
- The complete test suite passed 154/154 with zero failures or skipped tests. This includes the existing Julia object workbooks, four-epsilon comparison of 26 × n trace values, and execution of all ten concatenated code panels in a fresh Julia process.
- The lead verified unchanged hashes for 43 original chapter, numerical-core, Julia and raw-data files.

This reviewer also inspected the saved `reading-layout.css`: companion-page long hashes/links may wrap, while preformatted source and wide tables retain local scrolling. The lead updated the legacy RHC browser reset test to identify the epsilon input explicitly, preventing the newly added scroll sliders from making its selector ambiguous. This is test targeting, not a change to the model.

No source or reported integration gate remains open. Printing, use with an actual screen reader, physical-device operation and learning effectiveness were not validated in this round. DOM omission and keyboard/browser assertions should not be represented as those unperformed checks.

## Final source snapshots

| Source | SHA-256 |
| --- | --- |
| `zh/src/object-grammar.js` | `61de1cdd9a8248a7f5dc11b430fab89e78de20bf7a71bab9dabbaa7ae15fae54` |
| `zh/src/blue-theme.css` | `f7c50d480f1f9e8801c8f6e5c02073513f80f7f5e09f29b770a7a97d9f7e7ef6` |
| `zh/src/diagram-layout.js` | `ccba2f50c38b2d2b5bf627d87b916ba31e825638cbf35e1c3e2dbc11e0ce8ac8` |
| `zh/src/object-visuals.css` | `abfdef0d9b6b57a3e2848a12e8146a11bfe7ef34ac49c2ff688c75698e2695c3` |
| `zh/src/tmle-trace.css` | `2d973586ae9d5953e81f0257129626dea7f809e7cffc129cd33c53c70d2c25cf` |
| `zh/src/rhc-full.js` | `8422f791da55f8268dc425586b7fdbc625f1b7c62d2482deaf741e95d0cc2dcf` |
| `zh/src/reading-layout.css` | `71fa9e89a1b8965900fa0c1254c15fbd63d6931bdb73f8601e4c6e274a795897` |

## Final focus-boundary follow-up

This reviewer checked the final theme selector and `zh/docs/DESIGN_SYSTEM.md`. Ordinary sidebar links on the navy background retain the light-sky focus outline. Navigation links whose hover/current state changes their background to pale blue use the later, more specific `:is(:hover, [aria-current="page"]):focus-visible` selector to switch the outline to `--theme-focus` (#005398). This preserves a visible dark boundary on the lighter state surface instead of reusing the pale outline intended for navy. No dimensions, mathematical content or data changed. The final blue-theme hash above includes this refinement.

The lead subsequently reran `blue-reading-browser.cjs` at 1360 px and 375 px, including the assertion that the current pale-background navigation link has the actual dark-blue outline colour; both exited 0. The final complete suite also passed 154/154 with zero failures or skipped tests (exit 0). These final runs were performed by the lead. All recorded gates are closed.
