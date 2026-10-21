# Maintaining Learning TMLE

This guide is for contributors and maintainers. Reader introductions are in [English](README.md) and [Chinese](zh/README.md).

## Build and preview

Use Node.js 24 and pnpm 9.15.9, as configured in the Pages workflow. Run commands from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm run check:pages
pnpm start
```

The preview defaults to port 4174. If another checkout is already serving that port, use `PORT=4175 pnpm start`. The optional macOS service is managed with `python3 scripts/preview-service.py`; inspect its status before installing it for a different checkout.

## Verify changes

```sh
pnpm test
pnpm exec playwright install chromium
EIF_BROWSER_CHANNEL=chromium pnpm run test:browser:pages
EIF_BROWSER_CHANNEL=chromium pnpm run test:browser:en
```

Julia/R programme tests run when their runtimes are available. Set `JULIA_BIN` when Julia is installed outside PATH. Distinguish skipped checks from successful execution in verification records.

`test:browser:pages` serves the artifact under a project prefix and checks chapter loading, state retention, history, retries, mathematical interactions and language switching. The artifact check verifies both editions, all chapter fragments and required resources. The Pages workflow installs Chromium and Linux dependencies before its browser checks.

## Source organisation

| Path | Contents |
| --- | --- |
| `en/src/chapters/`, `zh/src/chapters/` | Authored chapter text and editable TeX |
| `en/renderers/`, `zh/renderers/` | Localised build-time renderers |
| `en/src/`, `zh/src/` | Browser interactions, styling and code explanations |
| `shared/js/`, `shared/julia/`, `shared/R/` | Shared computations and numerical configuration |
| `shared/data/public/rhc/` | Original observations, attribution and provenance |
| `en/julia/`, `zh/julia/`, `en/R/`, `zh/R/` | Executable lesson programmes |
| `tests/` | Numerical, content, structure and browser checks |
| `en/docs/PUBLISHING.md` | English publishing guide |

Keep numerical calculations in shared functions and preserve the original observations and reference materials. Initial chapter loads fetch only the selected fragment; returning to a chapter retains its controls. Publish the complete `dist/`, including both `chapters/` directories.

## Publish and package

The remote is `https://github.com/XinyueJia/learning_tmle.git`; the expected site root is `https://xinyuejia.github.io/learning_tmle/`. See [publishing instructions](PUBLISHING.md) and the [English guide](en/docs/PUBLISHING.md). Deployment is manually triggered; a source edit does not itself publish the site.

To create the full local handoff bundle after a build:

```sh
python3 scripts/package.py
```

Dependencies, `dist/`, `output/` and `releases/` remain excluded from Git. Maintainer information stays in this guide and project documents rather than the reader READMEs.

## Local author records

Progress logs, verification reports, review notes, chapter briefs, working reference snapshots and archived READMEs remain local. The ignore rules exclude `en/docs/` (except its publishing guide), `zh/docs/`, both `reviews/` directories and `zh/reference/`.

Builds and tests use the authored chapters, reader bibliographies and shared source data; they do not require those local records. Public ZIP bundles exclude the same records and local screenshots/logs. Original-material integrity checks run only when the local reference archive is available.

This changes the current source snapshot, not existing Git history. Earlier commits can still contain the records until history is separately rewritten. Keep reader-facing citations in `src/sources.md` and retain public data provenance and attribution.
