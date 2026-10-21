# 目录迁移与 Julia 入门路径说明：独立教学复核

日期：2026-10-15。此次仅审核目录整理、链接与第一讲 Julia 路径解释，不重写课程，不重审后七讲逐行教学。唯一编辑本文件；所有移动、代码与构建由 root 负责。

实际读取根 README、`zh/README.md`、`zh/docs/FILE_HIERARCHY.md`、`zh/julia/README.md`、`zh/case-study/README.md`及第一讲 guide 的目录/命令/include/CSV解释；另对照第一讲实际脚本与当前构建的32行卡片、页面本地链接。检查 en 的预留说明和文件范围，仅为核对目录约定。没有运行 Julia 或浏览器，没有将迁移前截图当作新结构证据。

**最终结论：本轮目录、运行说明、链接及第一讲迁移接口通过，无未关闭问题。** 一处相对模块路径起点不明确的文案已先报告 root 并实际复核修正。下列结论以当前文件与指定最终截图为依据，不自动重用旧课程通过状态。

## 新目录对读者的含义清楚

根 README 解释工程结构，中文版学习/编辑说明放在 zh；正文、逐行稿、界面、审查与原件留在语言目录，数值纯函数/Julia内核/固定CSV共用 shared。当前只发布中文，en只有README说明；实际 en 文件范围与说明一致，dist未生成空英文课件目录。未来英文可独立编辑界面和讲解、共用同一输入与内核，未承诺已实现跨语言切换按钮，也未要求复制一套数学配置。

旧审查中的路径保留为历史，并由迁移对照表帮助定位；没有把旧路径批量改成仿佛当时已存在的新结构。新说明中的编辑、测试、截图和交付位置均指向当前组织：zh/src、shared、tests/zh及tests/julia、output/zh/playwright与releases。

根服务命令仍以dist为服务根，中文入口明确为 `/zh/`，章节片段保留。源码根目录与dist发布目录内均保留zh和shared相对结构，读者没有被要求只下载一个lesson即可运行。

## 第一讲三层上溯与终端入口相符

第一讲终端命令已是 `julia --startup-file=no --history-file=no zh/julia/lessons/ch01.jl`，命令在包含shared与zh的根目录执行。顶部目录树显示共享模块、共享CSV与中文运行脚本，不再沿用旧julia/case-study相邻结构。

实际lesson的include与data_file都使用三次 `".."`。逐行解释准确给出路径：从zh/julia/lessons出发，第一次到zh/julia，第二次到zh，第三次到共同根，再进入shared/julia或shared/data。它还保留关键区分：终端用相对脚本命令时需从根目录执行；脚本内部以 `@__DIR__`为起点，因此用绝对脚本路径从别处启动仍可找到输入。run_case位于zh/julia，说明另写两层上溯，没有误套lesson的三层。

独立按路径解析确认：源码树和dist树各自从zh/julia/lessons三层上溯，都找到实际存在的shared/julia/EIFCase.jl及shared/data/followup-counts.csv。没有通过把工作目录当脚本目录来“解释成功”。数学计算、函数返回与显示之间的教学关系仍与32行稿一致。

## 当前构建与链接核对

独立解码 `dist/zh/index.html`，32张卡片仍覆盖核心18个非空行与脚本14个非空行，每张与当前shared内核/zh脚本对应源行逐字相同。迁移后include/CSV两行的三次上溯已实际进入卡片，不是只改文字而展示旧代码。八讲当前终端命令均含正确zh/julia/lessons编号路径。

根README和zh/README的全部本地Markdown链接按各自文档位置解析均存在。当前课程HTML中的本地链接也逐一解析存在，包括共享模块、共享数据、八份lesson、合订讲义、案例说明及来源页。页面的共享下载链接从dist/zh出发使用 `../shared/`，中文lesson则在julia/lessons下；两种相对位置未混同。

最初目录说明直接说“从dist/zh加载页面；../../shared/js位于dist/shared/js”，缺少模块路径起点。本审查先报告root，当前已改为：`dist/zh/src/app.js`等模块中的引用从模块所在 `dist/zh/src/`解析，指向dist/shared/js。这样与HTML页面下载链接的起点不同，读者可按实际路径逐级核对。该项文案建议已关闭。

## 最终指定截图与执行归属

实际使用 `view_image` 查看新 `output/zh/playwright/hierarchy-1360.png` 与 `hierarchy-375.png`。桌面可读第13—17行卡片的概率、累计和返回内容；手机可读同组中文解释，长代码在局部区域横滚，未挤出中文说明。新结构下这些代表卡片仍保持行号、代码和数学说明对应，公式正常渲染。

两张指定图的截取位置并非顶部目录树或include/CSV卡片，因此不声称从图中看见了三层路径；该部分结论来自实际新稿、脚本和构建逐字核对。root另报告新hierarchy浏览器检查及完整第一讲walkthrough在1360/375均实际退出0。这些执行归root，本审查者未亲自运行Chrome/Julia，也未进行真实初学者测试。

**本轮已关闭，无待改项。** 迁移保持的是已核对的课程与第一讲入口；英文版和后七讲逐行稿仍依文档所述处于未编写/未完成范围，不因目录预留而获得通过。
