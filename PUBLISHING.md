# 发布 learning-tmle 到 GitHub Pages

仓库名称为 `learning_tmle`。英文标题为 **Learning TMLE: Notes on Influence Functions and Doubly Robust Estimation**；中文标题为 **Learning TMLE：影响函数与双重稳健估计学习笔记**。

本项目采用 GitHub Actions 从源码构建并发布；网站默认打开英文版，可切换中文。工作流仅手动触发，并只允许仓库默认分支进入部署任务。

## 需要提交哪些文件？

| 提交到 Git 的路径 | 内容 |
| --- | --- |
| `.github/workflows/pages.yml` | 构建、测试与 Pages 部署配置 |
| `package.json`、`pnpm-lock.yaml`、`editions.json` | Node/pnpm 版本要求、锁定依赖、两版课程配置 |
| `scripts/` | 构建、Pages 产物检查、语言菜单及本地工具 |
| `en/`、`zh/` | 可编辑课程、渲染器、交互、Julia/R与读者文献；忽略本地作者记录 |
| `shared/` | 数学模块、共享浏览器加载器、公开 RHC 数据及来源说明 |
| `tests/` | 数学、正文、构建结构与浏览器回归测试 |
| `.gitignore`、`README.md`、`PUBLISHING.md`、`DEVELOPMENT.md` | 忽略规则、阅读介绍、发布及维护说明 |

以下内容已由 `.gitignore` 排除：`node_modules/`、`.pnpm-store/`、`dist/`、`output/`、`releases/`、日志、系统文件和 Python 缓存。无需提交构建好的 HTML、截图或完整交付 ZIP。Actions 会自行生成 `dist/`；**不要将源码根目录作为 Pages 网站目录上传**。

开发日志、验证报告、审校与交接记录、README旧稿和工作参考材料同样留在本地：`en/docs/`（保留`PUBLISHING.md`）、`zh/docs/`、两版`reviews/`以及`zh/reference/`不会提交，也不会进入公开ZIP。课程参考文献与原始数据出处仍公开。已进入旧提交的文件不会因新增忽略规则自动从历史中消失。

## 发布前在本地检查

使用 Node.js 24 和 pnpm 9.15.9，与工作流一致。`package.json` 已声明 pnpm 版本。

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm run check:pages
pnpm test
pnpm exec playwright install chromium
EIF_BROWSER_CHANNEL=chromium pnpm run test:browser:pages
EIF_BROWSER_CHANNEL=chromium pnpm run test:browser:en
```

浏览器检查会临时启动服务，以 `/learning-tmle/` 为项目子路径测试；不会占用现有 4174 端口。CI 会安装 Chromium 及其 Linux 依赖。Julia/R 程序测试在对应运行时可用时执行；当前发布工作流不安装 Julia/R，相关测试可能显示跳过，其余数值与浏览器测试仍必须通过。

`check:pages` 检查两版入口、各九章内容文件、MathML、数据及运行资源，拒绝遗漏文件、符号链接、误带依赖/截图/ZIP目录和超过 1 GB 的发布产物。

## 第一次提交与推送

当前工作目录已从 `https://github.com/XinyueJia/learning_tmle.git` 克隆，`main` 跟踪 `origin/main`。以下完整命令供首次导入全新目录时参考。先在 GitHub 新建一个空仓库（使用 GitHub Free 时可选公开仓库），名称设为 `learning_tmle`。首次建立远端仓库时，保持为空，不额外创建 README 或 `.gitignore`。下述示例使用实际仓库地址；现有克隆无需再次初始化或添加远端。

```sh
cd /Users/xinyuejia/Projects/learning_tmle

git init -b main
git add .github .gitignore README.md PUBLISHING.md DEVELOPMENT.md package.json pnpm-lock.yaml editions.json scripts shared en zh tests
git diff --cached --stat
git commit -m "Publish Learning TMLE study notes for GitHub Pages"
git remote add origin https://github.com/XinyueJia/learning_tmle.git
git push -u origin main
```

以上初始化命令适用于目前没有 Git 仓库的目录；后续更新无需再次初始化或添加 remote。使用你平时的 GitHub 登录方式完成推送即可，Pages 工作流使用仓库自带的 `GITHUB_TOKEN`，无需额外 API key。

## 在 GitHub 上发布

1. 打开仓库 **Settings → Pages → Build and deployment**，将 **Source** 设为 **GitHub Actions**。
2. 打开 **Actions → Publish Learning TMLE to GitHub Pages → Run workflow**，选择默认分支（上述命令为 `main`），再点击运行。手动工作流文件须先存在于默认分支。
3. 等待 `build` 和 `deploy` 两个任务均成功。`build` 会安装锁定依赖、构建两版、检查产物、执行测试并验证浏览器子路径；仅在这些步骤成功后上传完整 `dist/`。
4. 从部署任务的 `github-pages` 环境链接打开网站，或回到 **Settings → Pages** 查看地址。

工作流的 Pages 部署权限为 `pages: write`、`id-token: write`，构建只读源码；部署目标为 `github-pages` 环境。若环境配置了人工批准，按仓库设置完成批准。

使用常规项目仓库时，地址是：

```text
https://xinyuejia.github.io/learning_tmle/
https://xinyuejia.github.io/learning_tmle/en/#chapter-8
https://xinyuejia.github.io/learning_tmle/zh/#chapter-8
```

根入口跳转英文；直接访问 `/zh/` 保持中文。若仓库名为 `YOUR_USERNAME.github.io`，网站位于域名根目录，去掉示例中的 `/learning_tmle/`。

## 发布后核对与更新

打开英文第0章，切换到第8章并刷新，确认公式、患者表和 TMLE 求解可用；再通过语言菜单切到中文，确认章节不变。浏览器 Network 中应能看到 `en/chapters/chapter-8.html` 或 `zh/chapters/chapter-8.html` 成功返回；只上传入口 HTML 会导致章节加载失败，因此必须由工作流上传整个 `dist/`。

以后修改源码、commit 并 push 到默认分支，再手动运行同一工作流。当前工作流不会在每次 push 后自动发布。若 Actions 中没有运行按钮，检查工作流是否已推送到默认分支；若 Pages 返回 404，检查发布源及 `deploy` 是否成功。

本地检查无法代替首次远端运行：GitHub 仓库尚未建立或关联，仓库设置、环境规则及实际线上部署仍需按上述步骤完成。

## 官方说明

- [GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [配置 Pages 发布源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Playwright 的 CI 设置](https://playwright.dev/docs/ci-intro)
