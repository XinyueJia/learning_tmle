# EIF：从分布到估计

中文交互课程，面向只学过基础应用生物统计、尚不了解半参数统计的读者。第0章先从具体因果问题解释估计目标、识别与估计，再从样本均值、比例和分组比较出发，边用边解释条件期望、求导、加权投影与渐近记号，构建并验证目标分布的梯度，理解 canonical gradient、估计误差、效率界以及 AIPW/TMLE。无需先修微积分、线性代数或半参数理论。每章有逐步推导、预测题、有理由的答案、独立状态的实验和可展开的技术说明。

建议按第0章→第1章→…→第8章顺序学习。遇到新公式，先跟随数字例子说清“改变什么、求什么”，再预测并操作实验，最后回到符号推导。展开的技术说明可留到第二遍；它们补充一般性与边界，主线仍保留构建 EIF 所需的步骤。

## 阅读课程

新增第0章《我们要估计什么，为什么会走到EIF？》：从电话随访的教学问题讲清estimand、estimator、estimate，以及潜在结局如何在识别条件下接到观测分布的计算。六幅图和三个控件实验用于区分改变目标、人群和处理分配；随后解释IF、efficient及后续标准误/一阶修正的用途，再进入第1章。原第1—8章编号与深链接保留。

第0章第5节进一步分为五步：用一组风险估错的完整计算说明目标误差，再解释IF为什么是观测记录的函数、何时能连接到抽样估计误差、efficient比较的模型与正则估计范围，最后引出AIPW/TMLE。新增两套拟合风险的对照图，重绘分布—抽样—效率三层图；一项风险高估2pp分别传成ATE误差+1pp或−1pp。明确固定拟合误差、统计偏差与完整ATE IF是不同对象。

讲解方式参考用户提供的causalit文章：从问题与自然疑问出发，用具体数字连接符号；全书后续编辑遵循 `docs/STYLE_GUIDE.md`。数学按独立推导和权威来源核验，原8章没有宣称已按该文全文改写。

标准数学、统计及因果术语在每章首次正式解释处附英文名称，例如泛函（functional）、方向导数（directional derivative）、内积（inner product）和切空间（tangent space）。中文解释与推导保留，缩写给出全称；重复出现不再堆叠英文。全书约定与风格指南已记录，术语独立审查见 `reviews/terminology.md`。

第一章现在有16幅逐步静态图：先数10条记录，再追踪100份概率权重如何分出与补入；随后画出混合分布、均值加减账、步长与变化率、指示符，以及第三步的变化率查表、随机输入、带符号IF、加权抵消、两本账证明与更换平均权重。练习图放在答案展开内，技术边界图放在技术说明内。配图取标出的固定示例，章末实验仍可独立改变参数。

第一章每组独立公式后现在有默认可见的“符号回看”：点名当前字母、下标、分子分母、固定/变化对象，并用“这一步”说明相应代数动作。26组公式、4张表、16幅图及实验曲线均已覆盖；释义中的数学仍用本地KaTeX与MathML，不依赖悬停或展开。全书编辑约定已记录这项偏好，其他七章尚未逐式补提示。

第一章第二步补齐了分配律、零项归零、同类项合并、求和拆分、指示符三个选择，以及减去原均值时的完全相消。约去步长前明确要求 $t\ne0$，再解释趋近零的极限；完整推导位于正文中。

现成课程位于 `dist/`，KaTeX 样式、MathML、字体及全部计算均在本地。使用 Python 3 开启本地静态服务：

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

打开 [本地课程](http://127.0.0.1:4173)。或使用项目内的 Node 服务：

```sh
sh scripts/node.sh scripts/serve.js
```

本项目的 `node.sh` 优先使用 PATH 中的 Node，当前 Codex 环境下也能使用已检测到的 bundled Node。它会切换到项目目录。用 sh 调用不依赖解压工具是否保留脚本执行权限。服务只绑定 `127.0.0.1`，无登录、API key、遥测或患者数据。

## 编辑与构建

编辑 `src/chapters/chXX.md` 中的中文正文和 TeX 公式；实验由 `src/app.js` 的对应章节函数挂载；所有核心数学统一在 `src/math.js`。

Node.js 20+ 与 pnpm 环境：

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm start
```

当前 workspace 已安装依赖，可直接执行：

```sh
sh scripts/node.sh scripts/build.js
sh scripts/node.sh --test tests/*.test.js
```

构建只登记已有完整正文的章节，不生成空路由。输出 `dist/index.html` 与可编辑合订讲义 `dist/EIF_Tutorial.md`。句中公式使用 `$\Psi(P_t)$` 这样的 `$...$` TeX 源，独立公式使用 `$$...$$`；答案展开与表格使用同一规则。公式由本地 KaTeX 编译为 HTML+MathML，原 TeX 保留在 Markdown 和数学 annotation 中。小型静态 ES-module 应用延续原型的简单结构，计算、正文、构建与测试分离。

## 结构与验收记录

- `src/chapters/`：逐章可编辑讲义。
- `src/math.js`：唯一默认模型、概率、条件倾斜、梯度、加权投影、方差与 population targeting 纯函数。
- `src/chapter0-data.js`：第0章目标、人群、分配及原/标准化风险的纯函数，读取唯一默认模型。
- `scripts/chapter0-visuals.js`：第0章六幅可编辑HTML计算图及符号回看。
- `tests/chapter0-data.test.js`：11项独立预期值测试，包含分配/目标/人群变化、边界与非法参数、状态隔离。
- `docs/STYLE_GUIDE.md`、`reviews/style-reference.md`：用户参考文章的讲解方式及使用边界。
- `reviews/ch00-mathematics.md`、`reviews/ch00-pedagogy.md`：第0章独立审查记录。
- `src/chapter1-visual-data.js`：第一章图的数据，直接读取共享模型并计算权重、贡献和变化率。
- `scripts/chapter1-visuals.js`：可编辑的HTML/SVG图源；构建时嵌入页面，无在线图片服务。
- `tests/chapter1-visual-data.test.js`：11项独立预期值测试，覆盖每组同比缩减、27+10=37、三种方向的精确均值/变化率、随机输入的概率传递、两本账中心化、固定原IF更换权重、练习与边界。
- `tests/math.test.js`：21 项数学 assertions。
- `tests/markdown.test.js`：行内/块公式、答案、表格、代码与非法 TeX 的渲染回归，失败退出非零。
- `tests/browser.cjs`：真实 Chrome、桌面与手机 viewport 的交互/数学输出/公式/溢出/控制台断言。
- `docs/COURSE_CONTRACT.md`：读者、符号、数学边界及共享接口。
- `docs/chapters/chXX.md`：目标、推导、实验和已证／未证交接。
- `reviews/chXX.md`：独立数学核验、修订及关闭状态。
- `reviews/pedagogy.md`：原版独立教学、语言及实验对齐审查。
- `reviews/audience-accessibility.md`、`reviews/audience-mathematics.md`：按“仅基础应用生物统计”背景进行的本轮独立复审，保留初审及闭合证据。
- `docs/PROGRESS.md`：实际交付、测试及精确续作状态。
- `docs/AUDIT.md`、`docs/SOURCES.md`：原型矛盾及已在线核验的论文记录。
- `output/playwright/`：实际浏览器截图。

浏览器验证需要安装 Google Chrome，并保持本地服务运行：

```sh
sh scripts/node.sh tests/browser.cjs
# 第0章手机表格补充检查
sh scripts/node.sh tests/ch00-mobile.cjs
```

完整回归默认验收第0章与原8章，共9节；不需设置 `CHAPTER_LIMIT`。Chrome 启动可能需要运行环境允许浏览器进程。测试报告的手机检查是 375×900 viewport，桌面为 1360×900；截图不能单独证明数学或可访问性。MathML 与键盘实际检查已纳入断言，完整屏幕阅读器语音体验未测试。

## 数学范围

第1–2章用三个分数的有限分布，第0章和第3–8章统一使用同一个八单元二元模型。所有数值演示为总体积分；它们不能证明某个有限样本无偏、区间覆盖正确或 TMLE 每次优于 AIPW。普通因果 ATE 的解释依赖 consistency、conditional exchangeability 与 positivity；模型的 canonical gradient、double robustness、Neyman orthogonality 及有效推断条件分别解释。

具体数值接口与浮点边界见 `docs/NUMERICS.md`。非法概率和无法表示的路径会失败；不静默 clipping。条件倾斜固定未选择的机制，联合倾斜明确允许多机制变化。

## 原始材料与出处

`zh/` 中原始文件与 ZIP 保持原样，ZIP 无覆盖解压到 `original/`。新课程不继承原 README 的“已通过”陈述。原型的均值曲线、单位、正文/条件倾斜描述、浏览器 assertions、商式推导、切空间与渐近桥梁等问题见审计记录。

`Codex_Prompt_EIF_Tutorial_MultiAgent.md` 未在 workspace 及可访问的定位搜索范围找到；本次以用户消息的完整逐章验收规格补充已有 brief。本目录没有 Git 仓库，因此没有生成 commit 或 PR。

理论主要来源为 [Hines et al., Demystifying Statistical Learning Based on Efficient Influence Functions](https://arxiv.org/abs/2107.00681) 与 [Fisher & Kennedy, Visually Communicating and Teaching Intuition for Influence Functions](https://arxiv.org/abs/1810.03260)。固定版本、章节和公式位置见 `docs/SOURCES.md`，重要数学又从本课程 estimand 与模型独立重推。

## 实际交付验证

最新IF导读展开（2026-10-15）：第0章§5五步过渡、风险误差新图和三层路线图已完成，独立数学及教学审查关闭。51/51测试、真实Chrome九节桌面/手机回归通过；之后仅修正5个粗体边界空格，并对最终§5两viewport的强调渲染、公式/回看、图值、布局及reset/console补查通过。当前第0章6图、4公式组；其余八章及数学核心保留。详细范围见最新PROGRESS/VERIFICATION。以下为此前版本记录。

最新术语修订（2026-10-15）：九章首次正式引入的标准术语补齐英文，独立术语审查已关闭。公式源、标题与计算/UI代码保留；48/48测试通过。真实Chrome九节×1360/375完整回归通过；随后三处短命名修订已重新构建并补查第0/5/8章两种宽度的中英配对、MathML、宽度与console。新截图见 `output/playwright/terminology-*`。包内源码/运行文件与被测workspace比较，未另跑解压副本浏览器。以下为此前版本记录。

最新第0章增补（2026-10-15）：已完成可独立阅读的概念导读、五幅图与三控件实验；0→1导航、学习标记及原第1—8章深链接兼容。独立数学审查和图文教学审查均关闭。48/48自动测试通过（21核心数学、11第1章图数据、8渲染、8第0章数据），真实Chrome九节在1360×900及375×900完整回归通过；随后仅调整第0章手机六列表的局部滚动，并用 `tests/ch00-mobile.cjs` 实际验证最终表格键盘滚动、页面宽度、控件/reset和console。五图×两viewport与实验×两viewport共12张最终截图及1张表格补图已独立查看。原8章正文、核心数学、第1章图源/数据逐字保留。包内文件与被测workspace比较，未另跑解压副本浏览器。以下记录为旧版历史。

此前符号回看修订：第一章共47条局部提示（31正文/表/实验，16图），独立逐式审查 `reviews/ch01-formula-recall.md` 已关闭。新增2项渲染回归，合计40/40测试通过；最终真实Chrome八章在1360×900与375×900回归通过，检查公式与提示邻接、四表/十六图/实验覆盖、提示中的MathML、答案折叠与手机布局。26个原公式源、其他七章及数值核心与上一交付版逐字不变。包文件直接与已测workspace核对，未另跑解压副本浏览器。以下为此前版本记录。

此前第三步修订：第一章3.1—3.5连贯解释变化率查表、污染导数定义、随机输入、原概率下的数值和一般消项、固定原函数更换权重。六个推理阶段均有图；其中四幅为新增，全章现16幅。原实验与第二步消项保留。独立数学审查 `reviews/ch01-step3-mathematics.md`、教学与12张最终图截图审查 `reviews/ch01-step3-pedagogy.md` 均关闭。38/38测试通过（21核心数学、6渲染、11图数据），真实Chrome八章×1360/375最终回归通过。包内运行/源码/测试与已测试workspace直接逐字节核对；本轮没有重跑解压副本浏览器。完整证据与边界见 `docs/PROGRESS.md` 和 `docs/VERIFICATION.json`。

以下段落保留旧版验收历史，不能代替上述本轮验证。

此前第一章可视化修订：12幅实际图已经实现，新增7项图数据测试，合计34项自动测试通过。独立数学审查见 `reviews/ch01-visuals.md`；教学及指定6张手机/桌面图审查见 `reviews/ch01-visual-pedagogy.md`。lead另作全12图两viewport的实际浏览器检查，验证活动格计数、每个分数的旧/新增权重、答案图的展开与局部布局。更新ZIP解压副本的34项tests及八章两viewport浏览器回归均通过；24张配图截图已实际生成并检查。最新结果以 `docs/PROGRESS.md` 为准，下面保留此前版本的验收历史。

此前修复：八章句中公式已使用行内KaTeX，支持下标、期望、帽号/波浪号及展开答案/表格。6项渲染回归加21项数学测试共27/27通过，桌面与手机Chrome全回归通过；ZIP解压副本也通过同套验证。详细证据见 `reviews/inline-rendering.md`，此前基础读者入口验证保留如下。

2026-10-14 已按用户补充的基础应用生物统计背景顺序修订八章入口，补齐求和/差商、条件平均、log/exp、加权最小二乘、√n与误差预算，以及likelihood/链式求导。独立数学及教学复审均通过。原有完整EIF构建、一般方向验证、效率桥梁与AIPW/TMLE推导保留；没有将核心证明全部折叠成可跳过内容。此为独立教材审查，尚未进行真实初学者学习成效研究。

八章均已完成逐章独立数学与教学审查。最终 21/21 数值测试通过，真实 Chrome 的 1360×900 桌面和 375×900 手机 viewport 完整回归通过；键盘、章节隔离、reset、答案、MathML、精确数值、概率范围、无外部请求及控制台均有 assertions。桌面及手机各八章的新增入口截图已人工查看；冻结稿新增入口呈现和长公式键盘横滑也有浏览器断言。

此前句中公式版本的 ZIP 已解压验证：副本源码的 21 项数值测试及6项渲染测试全部通过（渲染依赖临时链接workspace已安装node_modules）；副本 dist 经 Python 静态服务提供，八章两 viewport 浏览器回归全部通过，包括句内MathML、裸下标/分隔符检查与长行内式键盘滚动。最终文档更新后，运行文件与该被测副本逐字节一致。原 ZIP 七个成员和 original/ 逐字节校验相等，哈希记录在 docs/ORIGINAL_MANIFEST.json。

可重新打包：

```sh
python3 scripts/package.py
```

交付包 `EIF_Tutorial_Complete.zip` 包含课程、合订讲义、源码、测试、逐章审查、实验及新增入口的实际截图和原始材料；依赖目录不打包。伴随 `.sha256` 可用于检查文件完整性。

当前 Codex 会话已启动 [课程服务](http://127.0.0.1:4174/?edition=ch00-if-bridge#chapter-0)。新环境可按前面的默认 4173 入口启动。浏览器 driver 可用 `EIF_URL=http://127.0.0.1:4174` 指定本地服务地址，用 `EIF_SCREENSHOT_DIR` 指定截图目录。

完整实际验证范围与未验证事项见 `docs/PROGRESS.md`。
