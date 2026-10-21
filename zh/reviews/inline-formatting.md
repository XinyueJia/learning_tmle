# Inline formatting review

Status: complete. No actionable findings within the reported CJK inline-formatting scope.

The reported source in `zh/src/chapters/ch00.md` contains valid intended strong emphasis: `**识别（identification）**问的是`. The same punctuation and adjacency pattern appears elsewhere, including `**半参数模型（semiparametric model）**通常` in chapter 6. The shared Markdown renderer is the appropriate place for a targeted compatibility fix.

## Recommended scope

- Preserve Marked's native inline parsing wherever it succeeds. Handle the CJK punctuation and adjacency case within inline tokenisation.
- Avoid global substitutions over Markdown source or generated HTML: they can alter code, TeX, links and the fragments already rendered inside details.
- If the fallback recognises only plain terminology, explicitly reject embedded Markdown control syntax and leave complex spans to the native parser. If it accepts complex spans, use masked inline source to locate delimiters safely and inline tokens to render their contents.
- Keep triple asterisks and nested emphasis under the native delimiter rules unless the fallback explicitly models them.

## Verification cases

Positive cases should include the reported identification term; CJK text on both sides of a bold term beginning or ending with full-width punctuation; bold English or ordinary Chinese terms; multiple bold spans in one paragraph; formula-recall prose; and details summaries and bodies.

Preservation cases should cover inline code and fenced code containing literal bold markers; escaped asterisks; incomplete delimiters; links whose destinations contain `**`; nested emphasis and triple asterisks; inline TeX containing an asterisk; display TeX; and the existing multiline Julia details regression. For complex bold contents, either correct nested rendering or deliberate preservation of the native output is acceptable for a narrowly scoped fix; accidental truncation or changes inside protected syntax are not.

## Final implementation review

The implementation preserves native `emStrong` results first. Its fallback uses Marked's existing delimiter matching and masked inline source against an equal-length punctuation probe, then tokenises the original text. This confines the compatibility adjustment to CJK-adjacent East Asian punctuation without changing source text, code or generated HTML. It also preserves recursive emphasis, links and mathematical rendering.

Verification: `sh scripts/node.sh --test tests/markdown.test.js` passed all 14 tests. An independent exact-output probe passed five additional cases: escaped double asterisks within strong text; an HTML attribute containing punctuation and double asterisks within strong text; an unclosed span; ordinary English strong emphasis; and two bilingual strong terms in a single paragraph. Additional direct probes confirmed the reported term, punctuation at both boundaries, protected inline code and link destinations, nested emphasis, triple asterisks, escaped literal bold markers, and a TeX superscript asterisk.

The existing tests also cover display maths, literal fenced Julia code, details summaries and bodies, formula recalls and tables. No independent mathematics review or browser repetition was undertaken for this renderer-only review. Only this review file was edited by the reviewer.
