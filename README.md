# Learning TMLE: Notes on Influence Functions and Doubly Robust Estimation

Self-study notes on constructing and verifying efficient influence functions, then building AIPW and TMLE by hand using the public SUPPORT/RHC cohort. The English and Chinese editions contain an introduction and eight chapters, interactive mathematical objects, accessible formulae, and line-by-line Julia/R explanations.

Repository: `learning-tmle`.

[English guide](en/README.md) · [发布步骤与提交清单](PUBLISHING.md) · [GitHub Pages setup](en/docs/PUBLISHING.md) · [English verification](en/docs/VERIFICATION.json)

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm start
```

Open **http://127.0.0.1:4174/en/** or **http://127.0.0.1:4174/zh/**. The root URL opens English by default; the language menu switches between editions. The static build is in `dist/`; all paths support a GitHub Pages repository prefix. `.github/workflows/pages.yml` provides manual publication through GitHub Actions. No remote publication has been performed by this local task.

Chapters load on demand; returning to a visited chapter preserves its controls. The first visit downloads only the selected chapter and its controllers. Verify repository-prefix navigation with `node tests/chapter-loading-browser.cjs`.

## 中文项目说明

## Learning TMLE：影响函数与双重稳健估计学习笔记

面向熟悉应用生物统计与广义线性模型（GLMs）的读者，中文课程包含导读和8讲，代码可选Julia或R。从真实SUPPORT/RHC队列5735人、30日死亡出发，逐步完成均值IF、分布分解、EIF推导与验证、投影、效率及AIPW/TMLE。第8讲先按sex分层手算，再用同一患者的指定多变量基线拟合和手动targeting。

[当前课程](http://127.0.0.1:4174/zh/?edition=r-parallel#chapter-0) · [患者摘要与来源](http://127.0.0.1:4174/zh/public-data.html)。课程使用医疗操作RWS；原研究确认全体死亡日期或180日存活状态。研究方案、目标的因果解释条件与统计推断条件在相应章节说明。

第0章现在是简短导读：两个回归 → 双重稳健估计 → EIF指导AIPW与TMLE。三幅图直接读取真实RHC记录和第8章的初始拟合，展示Q/g输入输出、加权残差和两种修正位置。随后可逐步阅读六步TMLE算法：初始预测→g与H→拟合ε→更新两臂Q→风险差→EIF与标准误；同一患者表逐列增加中间量，可回看初始与求解完成状态。原有推导、IPW/PSM比较、OLS/GLM桥梁与交互工作簿完整保留在[第0章补充阅读](http://127.0.0.1:4174/zh/chapter-0-details.html#chapter-0)，课件内的补充阅读入口暂时隐藏，页面和可编辑源码保留。

第1章保留完整均值IF推导、18幅图、数学/Julia/R对象视图及逐行代码解释。第8章使用同一患者表分10步加入26项中间量，显示offset、εH、更新预测、score和EIF，并联动公式、数据列与Julia/R变量。第2–7章保留既有推导与实验。

页面统一蓝白主题；宽图和公式局部横向滚动。当前验收范围见 [VERIFICATION.json](zh/docs/VERIFICATION.json)，逐次记录见 [PROGRESS.md](zh/docs/PROGRESS.md)。

## R并行选项

第0章主文只保留数学对象；其Julia/R工作簿在补充阅读页。第1章对象图可选择“数学对象 / Julia运算 / R运算”；第1–8章代码工作簿可切换Julia/R。第8章R代码接入同一患者表与公式联动，切换时保留当前步骤、ε、患者行和结果。十份R脚本使用base R，逐行对应输入、输出、维度和数学式。运行入口：

```sh
Rscript --vanilla zh/R/ch01.R
Rscript --vanilla zh/R/ch08.R
```

[完整R说明](zh/R/README.md) · [R计算模块](shared/R/RHCCase.R) · [逐列R工作簿](zh/R/tmle_trace.R)。

## 运行

macOS推荐安装本地预览服务（首次执行一次）：

```sh
python3 scripts/preview-service.py install
```

打开 http://127.0.0.1:4174/zh/。服务由macOS用户级launchd管理，独立于聊天和终端会话；登录后自动启动，进程退出后自动恢复，仅监听127.0.0.1。电脑关机或休眠期间无法访问，唤醒后可继续使用。移动项目目录前请先卸载服务，移动后重新安装；Node运行时路径改变后也需要重新安装。

```sh
python3 scripts/preview-service.py status     # 查看状态并检查HTTP响应
python3 scripts/preview-service.py restart    # 重启
python3 scripts/preview-service.py stop       # 停止，登录后仍会启动
python3 scripts/preview-service.py uninstall  # 停止并取消自动启动，保留课件
```

配置位于 `~/Library/LaunchAgents/org.eif-tutorial.preview.plist`，日志位于 `output/local-preview/`。安装使用的Node路径保存在配置中。已有其他进程占用4174时，安装器会报错，不终止其他进程。

其他系统或临时预览可使用下列命令；这种方式需要保持终端运行：

```sh
sh scripts/node.sh scripts/serve.js
```

默认端口统一为4174，可用 `PORT` 指定其他端口。构建使用Node20+，已安装的依赖见pnpm-lock；Julia仅Base和标准库，不需TMLE包。

```sh
sh scripts/node.sh scripts/build.js
sh scripts/node.sh --test tests/*.test.js tests/zh/*.test.js
julia --startup-file=no --history-file=no tests/julia/rhc-tests.jl
julia --startup-file=no --history-file=no zh/julia/rhc_lessons/ch01.jl
julia --startup-file=no --history-file=no zh/julia/rhc_lessons/ch08.jl
julia --startup-file=no --history-file=no zh/julia/rhc_case.jl
JULIA_BIN=julia sh scripts/node.sh tests/rhc-cross-language.cjs
sh scripts/node.sh tests/zh/rhc-browser.cjs
sh scripts/node.sh tests/zh/object-browser.cjs
sh scripts/node.sh tests/zh/tmle-trace-browser.cjs
sh scripts/node.sh tests/zh/blue-reading-browser.cjs
sh scripts/node.sh tests/zh/if-function-browser.cjs
sh scripts/node.sh tests/zh/qg-visual-browser.cjs
sh scripts/node.sh tests/zh/if-notation-browser.cjs
sh scripts/node.sh tests/zh/mean-error-browser.cjs
sh scripts/node.sh tests/zh/if-motivation-browser.cjs
TMLE_EPSILON=0.003 julia --startup-file=no --history-file=no zh/julia/tmle_trace.jl
julia --startup-file=no --history-file=no zh/julia/object_ch00.jl
julia --startup-file=no --history-file=no zh/julia/object_ch01.jl
python3 scripts/package.py
```

首次构建需安装锁定依赖；当前工作区已安装。浏览器测试使用Playwright和本机Chrome，默认读取4174；可设置EIF_URL。原shared数学及Ng公开核查测试仍保留，各自独立Julia进程运行；当前RHC验证不是旧版通过记录。

## 文件目录

| 路径 | 内容 |
| --- | --- |
| zh/src/chapters/ch00–08.md | 当前可编辑中文正文和TeX |
| zh/src/blue-theme.css、reading-layout.css、diagram-layout.js | 蓝白主题、局部横向阅读、数据行与运算符对齐 |
| zh/docs/DESIGN_SYSTEM.md | 配色来源、token、13组对比度断言和集成边界 |
| zh/src/chapters/ch00.md、zh/renderers/dr-intro.js、zh/src/dr-intro.css | 精简导读与真实RHC计算图 |
| zh/src/tmle-overview.md、zh/renderers/tmle-overview.js、zh/src/tmle-overview.js | 第0章六步TMLE算法、同患者表与初始/拟合状态对照 |
| shared/js/rhc-summary.js、zh/renderers/rhc-patient-summary.js | 原CSV的分组人数、年龄样本SD、性别及死亡摘要；资料页只列来源与单表 |
| zh/src/supplements/ch00-details.md | 第0章完整补充阅读，构建为chapter-0-details.html |
| shared/js/mean-transfer.js、zh/renderers/if-motivation.js、zh/src/if-motivation.js、if-motivation.css | 第0章补充页gcomp动机、概率转移与IF配对图 |
| shared/js/mean-error.js、zh/renderers/mean-error.js、zh/src/mean-error.js、mean-error.css | 第0章补充页未知P₀/经验Pₙ、逐人到误差图与假设距离试算 |
| zh/renderers/if-notation.js、zh/src/if-notation.js、if-notation.css | 第0章补充页随机输出与真实逐行输出、可展开符号回顾 |
| zh/renderers/if-function.js、zh/src/if-function.js、if-function.css | 第0章补充页真实均值IF输入→固定规则→输出图 |
| zh/src/、zh/renderers/ | 可计算界面、18幅第一讲图和实际源码展开 |
| shared/data/public/rhc/ | 未改动官方CSV、来源、许可、SHA-256 |
| shared/js/tmle-trace.js、zh/src/tmle-trace-view.js、rhc-full.js | 第8章逐列计算、统一符号key、持续表与联动 |
| zh/julia/tmle_trace.jl、zh/src/julia/ch08-trace.json | 40执行行逐列工作簿、实际源码/输入输出映射 |
| shared/js/qg-lesson.js、zh/renderers/qg-visual.js、zh/src/qg-visual.js、qg-visual.css | 第0章补充页同患者Q/g输入→固定函数→输出图 |
| shared/js/object-data.js、zh/src/object-grammar.js | 同源对象与统一图示表达，纯数据/显示分离 |
| zh/src/julia/object-map.json、zh/julia/object_ch00–01.jl | 原脚本行映射与连续对象工作簿 |
| shared/js/rhc.js、case-study.js | 多变量拟合与分组计数的纯函数 |
| shared/js/math.js | 通用数学；保留早期指定模型作测试参考，不是当前真实数据 |
| shared/julia/RHCCase.jl | 真实读取、基线回归、手动TMLE |
| zh/julia/rhc_lessons/ | 八个可独立运行的Julia逐讲脚本 |
| shared/R/、zh/R/、zh/src/R/ | R计算模块、十份工作簿及实际源码逐行映射 |
| zh/renderers/r-code.js、parallel-code.js、zh/src/reading-modes.js | R代码解释、双语言面板和本章语言同步 |
| zh/docs/、zh/reviews/ | 方案、约定、逐章brief、独立审查和实际验证 |
| zh/reference/ | 原始用户材料；synthetic-course-2026-10-16/为迁移前快照 |
| en/ | 并行英文课程、代码解释、审查与GitHub Pages说明 |
| tests/、output/zh/playwright/ | assertions及真实浏览器验证截图 |
| dist/、releases/ | 可运行静态课件、完整源码ZIP及SHA-256 |

资料来源：Connors AF Jr et al. JAMA1996;276:889–897，[官方Vanderbilt仓库](https://hbiostat.org/data/repo/rhc.html)。原文件保留原署名和仓库致谢；不冒称CC BY。Ng肺癌资料及早期合成表保留为历史/独立测试材料，不再作贯穿患者来源。

当前测试详情见zh/docs/VERIFICATION.json，编辑与交接记录见zh/docs/PROGRESS.md。
