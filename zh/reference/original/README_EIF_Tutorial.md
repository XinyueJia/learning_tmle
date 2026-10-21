# EIF Interactive Tutorial · v1

## What is included?

- `EIF_Interactive_Tutorial.html` — complete stand-alone interactive course with 8 chapters and 8 live experiments. Open it directly in a modern browser. All charts and mathematical equations render without network access.
- `EIF_Tutorial_v1.md` — editable Chinese mathematical narrative and derivations in Markdown/LaTeX.
- `Codex_Brief_EIF_Tutorial.md` — ready-to-use implementation brief for developing a maintained React/TypeScript course in Codex.
- `build_eif_tutorial.py` — reconstructs the HTML by combining the Markdown narrative, CSS, and JavaScript visualisations.
- `generate_math_svg.js` — converts all display equations to embedded SVG using `mathjax-full` for a self-contained offline output.
- `test_eif_html.py` — optional Playwright smoke test for layout, interactions and in-app numeric self-tests.

## Quick start

Open `EIF_Interactive_Tutorial.html` in Chrome, Safari, Firefox or Edge. Navigate via the chapter sidebar and experiment with the controls. The course has **no API calls and uses no real patient records**.

## Rebuild

Prerequisites: Python (with `mistune`), Node.js, and globally or locally installed `mathjax-full` (or a suitable `NODE_PATH`). Run:

```sh
python build_eif_tutorial.py
```

The script uses `npm root -g` to locate MathJax if `NODE_PATH` is unset. For a fresh environment, install mathjax-full with `npm install mathjax-full` and use the local project dependency as appropriate.

The HTML runs numeric integrity checks when opened: `window.__EIF_TESTS_PASSED__` is `true` on success. A browser smoke test can also be run via:

```sh
python test_eif_html.py
```

The example smoke test expects Playwright and a system Chromium browser; adapt the executable path for your operating system.

## Conventions and limits

All simulated ATE examples are population calculations in a finite discrete model with stated positivity and causal identification assumptions. They are designed to expose mathematical identities, **not** to support an empirical clinical claim or demonstrate finite-sample estimator unbiasedness.

## References

Hines et al. (2022) https://arxiv.org/abs/2107.00681  
Fisher & Kennedy (2021) https://arxiv.org/abs/1810.03260
