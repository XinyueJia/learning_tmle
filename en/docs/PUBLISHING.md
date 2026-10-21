# Publish Learning TMLE on GitHub Pages

Use the repository name `learning-tmle`. The English title is **Learning TMLE: Notes on Influence Functions and Doubly Robust Estimation**; the Chinese edition uses **Learning TMLE：影响函数与双重稳健估计学习笔记**.

Use Node.js 24 and pnpm 9.15.9, matching the workflow; `package.json` pins the pnpm version:

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm run check:pages
pnpm test
pnpm exec playwright install chromium
EIF_BROWSER_CHANNEL=chromium pnpm run test:browser:pages
EIF_BROWSER_CHANNEL=chromium pnpm run test:browser:en
```

The generated `dist/` directory is the complete static website. Its root opens English by default; the language menu offers English and Chinese, and `/en/` and `/zh/` contain the parallel courses. Both use `shared/` for the original RHC observations and numerical engines, and `vendor/` for local KaTeX and fonts. No server-side computation, credentials or patient-data upload is needed.

All internal URLs are relative. The same build works at `https://OWNER.github.io/` and at `https://OWNER.github.io/learning-tmle/`. Keep the complete `dist/` directory structure, including each edition’s `chapters/` directory: the entry page fetches the selected chapter on demand. There is no Vite `base` setting to change.

## Files to commit

Commit `.github/`, `scripts/`, `shared/`, `en/`, `zh/`, `tests/`, `.gitignore`, `README.md`, `PUBLISHING.md`, `package.json`, `pnpm-lock.yaml` and `editions.json`. Keep the original reference materials and data attribution. The ignore rules exclude dependencies, the generated `dist/`, local evidence in `output/` and ZIP bundles in `releases/`. Actions rebuilds and publishes only `dist/`.

The local project is initialised on `main`; no remote is configured. After the initial commit, this checkout can proceed to adding a remote and pushing. [The Chinese publishing guide](../../PUBLISHING.md) includes initialisation, staging and push commands, the full submission table and troubleshooting steps.

## Publish when ready

1. Create an empty repository named `learning-tmle`, then commit and push the documented source files.
2. Under **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. In **Actions**, select **Publish Learning TMLE to GitHub Pages**, choose **Run workflow**, and select the default branch. The workflow must already be present on that branch. Only the default branch can enter the deployment job.
4. The workflow builds both editions, checks the artifact, runs the available numerical/content tests and Chromium browser checks under a repository prefix, and uploads only `dist/`. The deployment job publishes the uploaded artifact to the `github-pages` environment.

Publication is manual: the supplied workflow uses `workflow_dispatch`. This task has prepared the files locally and has not pushed the repository or published a site. GitHub repository permissions, Pages settings and the remote deployment remain to be checked when you publish.

The local JavaScript tests exercise the shared mathematical identities. Tests requiring Julia or R run when their runtimes are available; the supplied Pages workflow does not install those runtimes. The workflow installs Chromium and its Linux dependencies and runs repository-prefix browser checks. Locally, the checks use Chrome unless `EIF_BROWSER_CHANNEL=chromium` is set. Local tests do not verify the remote Ubuntu runner, repository settings or the actual deployment. See the English verification record for the checks actually performed.

The workflow follows [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Preview locally

```sh
node scripts/serve.js
```

Open `http://127.0.0.1:4174/en/` or `http://127.0.0.1:4174/zh/`. Stop an existing preview first if you start a second server on the same port. The macOS launchd preview service already configured for this project can continue serving the rebuilt `dist/` without being restarted.
