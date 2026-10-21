# English rendering and code-map translation review

Scope: all English renderer modules except `course.js`; explanatory strings in `en/src/R/*.json` and `en/src/julia/*.json`. British English is used. Chinese source files and shared mathematical modules were not edited.

Human-facing headings, controls, captions, accessible names, code explanations, dimensions, labels and TeX text labels were translated. Edition-specific reads and runnable commands use `en/`; shared imports and mathematical engines remain shared. Markdown imports use the English wrapper. No English supplement route was added.

The initial translation draft used Google Translate as an aid. A batch draft showed phrase spill between snippets and was replaced with independent text-block translations before final review. Manual editorial corrections cover the EIF/AIPW/TMLE distinction, fixed versus empirical distributions, residual subtraction order, inverse treatment weights, 30-day outcome definitions, standardisation terminology, R startup/indexing explanations, bisection, and complete standalone object labels. All 18 Chapter 1 formula-recall paragraphs were rewritten in natural English while preserving their exact inline-mathematics multisets. A further 335 JSON prose fields received source-keyed manual corrections after the runtime metadata handoff.

`julia-display-comments.js` localises nine known Chinese comments in displayed excerpts from shared `EIFCase.jl`. Both `rhc-code.js` and historical `case-code.js` use it. Only displayed comment text changes: shared files and executable statements remain unchanged. Unknown Chinese display comments fail explicitly. The executable shared downloads retain their original source.

Checks actually run:

- `node --check` passed for all 25 existing owned renderer modules, followed by successful imports of all 25. The added comment helper was imported and exercised separately.
- Static HTML class, id, data attributes and accessibility relationships matched their Chinese-renderer originals exactly in the existing modules.
- No Chinese characters remained in owned renderer human-facing strings or JSON explanatory fields. The comment helper’s source keys use Unicode escapes.
- All 12 JSON files parsed; keys and array lengths matched the originals. All 151 non-null `formulaTex` structures matched apart from translated `\\text{...}` labels.
- The final JSON prose pass read the runtime agent’s current files and asserted that code, source, line/count and hash metadata were unchanged by that pass.
- Stripping comments from the localised shared Julia excerpt produced text exactly equal to the original with comments stripped; no Chinese remained in the localised excerpt.

No build, browser interaction, visual layout review or executable lesson run was performed by this agent. The lead owns those checks. Historical synthetic helpers (`chapter0-visuals.js`, `case-code.js`, `julia-walkthrough.js`) have translated strings but did not receive the same full pedagogical prose review as the active RHC pathway; the legacy walkthrough route is omitted by the lead. The shared mathematical engines, true-target assumptions, patient rows and numerical logic were not independently re-derived here.

Terminology decisions: use standardisation for averaging predicted risks over a target baseline distribution; retain normalisation for rescaling a probability component. Use estimating function for candidate-centred U, EIF at the current fitted distribution, empirical mean over original records, trial update for unsolved epsilon, and solved update for Q*. AIPW modifies the final scalar while TMLE modifies Q and re-evaluates the target. A zero empirical equation does not establish a zero true estimation error.
