# EIF tutorial · 从分布到手工 TMLE

面向基础应用生物统计读者的交互课程，教学代码使用 Julia。贯穿案例为已上市抗肿瘤药A对活性对照B的RWS疗效再评价，使用固定合成数据。中文版包含第0章导读和第1—8讲；英文版已预留目录，尚未编写。

已加入[真实公开RWS资料页](http://127.0.0.1:4174/zh/public-data.html)：Ng等（2021）公开的107条肺癌一线EGFR-TKI记录，保留原始CSV、CC BY署名、SHA-256、浏览器筛选与Julia核查。原文及数据：[DOI](https://doi.org/10.1371/journal.pone.0253335)。公开资料的PFS时间/状态配对和删失规则尚未验证，因此当前接入的是**真实数据核查练习，尚未替换八讲的完整贯穿分析**。不会将未知12个月状态记为无事件或输出未经支持的临床TMLE。

用户已明确：真实公开RWS优先，可调整病种或终点。后续选择先核查治疗、随访起点、结局和混杂信息，再决定临床分析；不能把条件未明的数据硬接到原二元模型。候选核查见[记录](zh/docs/data/OPEN_ONCOLOGY_CANDIDATES.md)和[独立设计审查](zh/reviews/public-data-design.md)。

第一讲直接使用同一200人的12个月进展或全因死亡终点，从时间窗编码、事件风险均值到影响函数，再连接12个月无进展生存概率；完整结局是明确假定，不把失访后的未知状态记为无事件。包含18幅计算图及保留的Julia32行入门样板。

第0章5.1提供估计量组件图：样本 → 拟合人群构成与组内风险 → 标准化 → 估计值；IF在独立的误差分析层说明，并标出AIPW在输出端加校正、TMLE更新风险后重新代入的位置，以及EIF如何指导两者。保留可展开的数值核对，不提前展开完整EIF公式。

## 目录与语言版本

```text
zh/                    中文版课件、界面、Julia逐讲脚本和教学记录
  src/chapters/        可编辑正文与TeX公式
  src/julia/           Julia逐行讲解
  src/                 中文界面、图示数据、样式
  julia/               逐讲运行入口与使用说明
  renderers/           中文页面与教学图示生成
  docs/  reviews/      全书约定、进度、逐章审查及验证历史
  reference/           原始资料、原ZIP及其解包原件
  README.md            中文版学习、运行与编辑指南
en/                    英文版预留位置，目前只有说明
shared/                两种语言共用的数学与固定案例
  js/                  浏览器数值纯函数和唯一模型配置
  julia/EIFCase.jl      Julia计算内核
  data/                合成数学CSV；public/保存真实公开原始文件和来源
scripts/               共享构建、Markdown渲染、本地服务与打包
tests/                 共享数学/跨语言检查；zh/与julia/分别测试
output/zh/playwright/  中文版实际浏览器验证截图
dist/                  构建结果：zh/课件、shared/内核与数据、vendor/字体
releases/              完整交付ZIP及SHA256
editions.json          已发布语言版本注册表（当前只有zh）
```

中文正文、图示和教学记录统一在 `zh/`；共享数学只维护一份。未来英文版可在 `en/`独立编辑，使用相同输入和数值内核。详细迁移对照见 [目录约定](zh/docs/FILE_HIERARCHY.md)。

## 本地阅读

在项目根目录执行：

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

打开 [中文版](http://127.0.0.1:4173/zh/#chapter-0)。当前会话也可使用 [4174入口](http://127.0.0.1:4174/zh/#chapter-1)。原根网址会跳转到 `/zh/`，保留查询参数和章节片段。

请通过本地HTTP服务阅读。Julia脚本既能在完整源码中运行，也能在 `dist/`作为根目录运行；须完整保留其 `zh/`与`shared/`相对位置。

## 构建、运行和验证

Node.js 20+、Julia Base及标准库即可。首次构建先 `pnpm install --frozen-lockfile`；当前工作区已装前端依赖。

```sh
sh scripts/node.sh scripts/build.js
sh scripts/node.sh --test tests/*.test.js tests/zh/*.test.js
julia --startup-file=no --history-file=no tests/julia/runtests.jl
julia --startup-file=no --history-file=no zh/julia/lessons/ch01.jl
julia --startup-file=no --history-file=no tests/julia/public-rws-tests.jl
julia --startup-file=no --history-file=no zh/julia/public_data_audit.jl all 12
sh scripts/node.sh tests/public-data-cross-language.cjs
sh scripts/node.sh tests/cross-language.cjs
EIF_URL=http://127.0.0.1:4174/zh sh scripts/node.sh tests/zh/browser.cjs
EIF_URL=http://127.0.0.1:4174/zh sh scripts/node.sh tests/zh/case-browser.cjs
EIF_URL=http://127.0.0.1:4174/zh sh scripts/node.sh tests/zh/ch01-julia-browser.cjs
EIF_URL=http://127.0.0.1:4174 sh scripts/node.sh tests/zh/hierarchy-browser.cjs
EIF_URL=http://127.0.0.1:4174 sh scripts/node.sh tests/zh/rws-browser.cjs
EIF_URL=http://127.0.0.1:4174 sh scripts/node.sh tests/zh/recall-popovers-browser.cjs
EIF_URL=http://127.0.0.1:4174 sh scripts/node.sh tests/zh/ch01-survival-browser.cjs
EIF_URL=http://127.0.0.1:4174 sh scripts/node.sh tests/zh/ch00-estimator-browser.cjs
sh scripts/node.sh tests/zh/public-data-browser.cjs
python3 scripts/package.py
```

跨语言检查要求 `julia`位于PATH，也可设置 `JULIA_BIN`为已安装二进制的绝对路径。受限环境配置见 [中文版运行指南](zh/README.md)。`--locale=zh`只构建已注册中文版；未注册的语言会明确失败。

[当前进度](zh/docs/PROGRESS.md)与 [验证清单](zh/docs/VERIFICATION.json)记录实际运行结果；带旧日期或阶段名的记录保留当时路径，迁移前总记录保存在 `zh/docs/VERIFICATION-before-hierarchy.json`。完整包位于 `releases/EIF_Tutorial_Complete.zip`，其检查文件在同目录。
