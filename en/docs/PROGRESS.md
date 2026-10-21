# Git initialisation and initial commit — 21 October 2026

The local repository uses main. The initial commit follows the PUBLISHING.md submission list: both editions, shared computations and public observations, original reference materials, tests, build tools and Pages configuration. Consult the Git log for the commit identifier. Dependencies, dist, output, releases, logs and local caches remain ignored. Publishing instructions now reflect the local Git state.

This task checked submission paths, nested repositories and the 100 MB file threshold, and passed check:pages for both editions, all 18 chapters and 34 required files. Earlier course and browser verification records remain; numerical tests were not repeated for Git operations. No remote was added, no push occurred and no deployment ran. See the root PUBLISHING.md for the next publishing steps.

---

# Learning TMLE naming — 21 October 2026

Repository examples now use learning-tmle. The English title is Learning TMLE: Notes on Influence Functions and Doubly Robust Estimation; the Chinese title is Learning TMLE：影响函数与双重稳健估计学习笔记. Shared site-config metadata supplies browser/page titles. Course headers, the rail, Markdown notes, all three READMEs, both publishing guides, package name and Actions display name are aligned. Publishing URLs and browser-test prefixes use /learning-tmle/. The existing local directory and chapter/download links remain valid.

Both editions built and passed the artifact check. All 16 relevant tests passed; Chrome checks verified exact titles and language menus at 1360/790/375 and bilingual chapter loading, state/history, TMLE and retries at 1360/375 under the new prefix. The 375px screenshot was inspected. All 18 rendered chapter articles remain byte-identical to the prior baseline. The full numerical suite was not repeated for this naming change. See VERIFICATION-learning-tmle.json. The release package is synchronised; no Git initialisation in the original project, push, deployment or background task.

---

# GitHub Pages release preparation — 21 October 2026

Added the root Chinese publishing guide with submission paths, ignored outputs, preflight commands, initial Git commands, repository settings, manual deployment and live checks. Pinned pnpm 9.15.9; the workflow uses Node 24, manual dispatch and deployment from the default branch only. CI now checks the artifact and runs Chromium repository-prefix and English-course browser tests. check:pages validates both editions, all 18 fragments, MathML, required assets, size and symbolic links. Full builds remove stale dist files first; course text and numerical engines are unchanged.

Verified from a temporary Git copy containing only submission paths: Node 24.19.0/pnpm 9.15.9 frozen installation succeeded without lockfile changes; clean build passed; artifact contains 340 files and 13,745,307 bytes. Missing fragments and symbolic links caused nonzero exits; full build removed a stale-output fixture. Of 245 tests, 242 passed, three optional Julia tests were skipped and none failed (JULIA_BIN was not set in this clean-export run; the previous full 245-pass record remains). Chrome passed bilingual prefix tests at 1360/375 and English all-chapter tests at 1360/790/375. Workflow YAML parsing and structural assertions passed.

The remote Ubuntu/Chromium job, repository settings and deployment have not been exercised. The optional local Chromium download was stopped; local browser tests used installed Chrome. No background download remains. No Git repository was initialised in the original project and no commit, push or deployment occurred. See VERIFICATION-pages-release.json and the root PUBLISHING.md.

---

# Chapters loaded on demand — 21 October 2026

Both entries now contain a small shell. Each complete chapter is built as chapters/chapter-N.html, fetched for the selected hash and shown after its interactive controllers are ready. Retained nodes preserve controls on return without duplicate listeners or fragment requests. Controllers are imported only where needed; visited chapters share one original RHC CSV request and initial fit. Newly inserted formula recalls are attached, and loading failures support retry. Navigation races cannot replace a later selection. Chapter links, languages, read markers, browser history, Julia/R, reset and TMLE remain available.

All 18 rendered chapter articles are byte-identical to the baseline. English/Chinese entries fell from 3,213,704/2,920,505 bytes to 6,041/5,738 bytes. Entry plus Chapter 0 is 735,690/725,841 bytes; total local uncompressed initial Chapter 0 loads, including styles, scripts and fonts, are about 1.02/1.01 MB. These are byte measurements, not remote Pages latency benchmarks.

Build succeeded; 245 tests passed with no skips, including local Julia/R checks. Chrome passed: English all chapters at 1360/790/375; Chinese at 1360/375; bilingual lazy-loading tests under /tmle-tutorial/ at 1360/375; language-menu tests at all three widths. Checked requested chapters/modules, cached state, navigation races, history, retries, language links and solver behaviour. Default entry requests only Chapter 0 and no Chapter 8 code. See VERIFICATION-lazy-chapters.json for exact scope, hashes and logs. No deployment or background task.

---

# Language menu and English default — 21 October 2026

The Wikipedia-inspired selector combines a language icon, the current language and a chevron with a compact two-language dropdown. Native details supports keyboard activation; Escape, outside clicks and focus departure close it. Switching preserves the page, query and chapter. The root opens en/ by default; explicit zh/ URLs remain Chinese. Chapter navigation in both editions now updates only chapter links, preserving the language menu's current-language marker. Relative routes support GitHub Pages repository prefixes.

Verification: both editions built; 8 relevant tests passed; Chrome checks at 1360/790/375 passed for default English, link updates after chapter changes, switching in both directions, current-language markers, keyboard and dismissal behaviour, supporting pages and a repository prefix. No overflow or console errors. The English 375px menu screenshot was inspected. Numerical code, observations and Julia/R are unchanged; the full numerical suite was not rerun. See VERIFICATION-language-menu.json. No background task remains; no deployment was performed.

---

# Reader pages separated from author records — 21 October 2026

Both references pages now use src/sources.md: citations, reading guidance and data sources remain visible. The original docs/SOURCES.md and audit records are preserved for maintainers. Legacy audit bookmarks redirect to the references page. Patient summaries no longer link to the integrity record; a revision-history label was removed from Chinese Chapter 8.

Verification: both editions built; 8 relevant tests passed; Chrome checks at 1360/790/375 passed for bilingual references, the audit redirect and the patient summary, with no page overflow or console errors. The Chinese 790px references screenshot was inspected. Numerical code, observations and Julia/R calculations are unchanged; the full numerical suite was not rerun for this presentation change. See VERIFICATION-reader-pages.json. No background task remains.

---

# English editorial review complete — 21 October 2026

Revised the active course narrative, titles, captions and fixed-example disclosures, runtime labels, code explanations, source comments and terminal labels in natural British English. Removed stale Chapter0 references and clarified terminology where it affected mathematical interpretation. Complete derivations, exercises/answers, formulae, patient rows and computations remain intact.

Build and verification: full240-test suite passed; final10 focused checks passed; 22 English R/Julia programmes ran successfully; Chrome all-chapter tests passed at1360/790/375 under a repository prefix. Ordered maths in11 prose files and computational statements in32 programme sources were checked against the baseline;47 printed labels were polished and code maps refreshed. Exact scope and chronological checks are in VERIFICATION.json and reviews/editorial-integration.md. Source, dist and release package are synchronised. No unresolved active-course blocker or background task remains. GitHub publishing remains a separate manual step.

---

# English edition complete — 21 October 2026

The introduction and Chapters 1–8 are translated in British English, including complete maths, exercises/answers, figures, symbol recalls, Julia/R source explanations and live controls. Chapter 0 retains the empirical-distribution/variance definitions and one-step/AIPW identity. The case page is one concise table in both editions. English and Chinese share numerical code and observations; a language switch preserves the current chapter and query.

Build and final tests: 240 assertions-based tests pass with no skips; 19 English Julia/R programmes execute; English all-chapter browser tests pass at1360/790/375 under /tmle-tutorial/; Chinese all-chapter regression passes at1360/375; supporting-case/source checks pass at1360/790/375. Verification, logs and review scopes are documented. No known blocker remains in the delivered English route. No background work continues.

GitHub Pages preparation is complete: portable relative links, root language choice, .nojekyll, a manual Actions deployment workflow and publishing instructions. Next action when publication is desired: push the repository, select GitHub Actions as the Pages source and run the supplied workflow. The remote repository, settings and deployment have not been changed or verified locally.
