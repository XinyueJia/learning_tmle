# 多语言目录约定与迁移对照

2026-10-15整理。所有命令默认从项目根目录运行；根README描述工程，zh/README描述中文学习与编辑。当前仅发布中文版，en/只预留说明，不作为已完成课件。

| 原位置 | 当前唯一位置 | 用途 |
| --- | --- | --- |
| src/chapters、src/julia | zh/src/chapters、zh/src/julia | 中文正文与逐行讲解 |
| src/app、style、图示、workbench | zh/src/ | 中文界面 |
| src/math.js、src/case-study.js | shared/js/ | 共享纯计算 |
| julia/EIFCase.jl | shared/julia/EIFCase.jl | 唯一Julia内核 |
| julia/lessons、run_case | zh/julia/ | 中文逐讲入口 |
| case-study/*.csv | shared/data/ | 唯一固定数据 |
| case-study/README.md | zh/case-study/README.md | 中文案例说明 |
| docs、reviews | zh/docs、zh/reviews | 约定、逐章交接、独立审查 |
| original、原始zh附件 | zh/reference/ | 保留原件 |
| scripts/中文图示及代码生成 | zh/renderers/ | 中文呈现 |
| scripts/build.js | scripts/build.js + zh/edition.js | 共享编排与语言入口 |
| tests/语言相关检查 | tests/zh/ | 中文教学和浏览器检查 |
| julia/test | tests/julia/ | 共享Julia断言 |
| output/playwright | output/zh/playwright/ | 原截图完整迁移，新检查同目录 |
| dist根目录中文版 | dist/zh/ | 正式课程入口 |
| 根目录交付ZIP | releases/ | 完整交付与校验值 |

`editions.json`只列已发布版本。未来添加en/edition.js、en/src、en/renderers、en/julia及对应审查/测试，不复制shared数学配置。课程内每章的实验状态保持独立。尚未实施跨语言切换按钮。

## 可运行路径

源码与构建目录保持相同的 `zh/julia/lessons/` 和 `shared/{julia,data}/`相对结构。lesson从自身目录连续上溯三级到共同根目录，再载入共享模块和CSV；run_case从zh/julia上溯两级。只下载一个lesson并不足以运行。不要把当前工作目录和脚本自身目录混淆。

浏览器从dist/zh/加载中文页面；位于dist/zh/src/app.js等模块中的../../shared/js引用，从模块自身所在的dist/zh/src/解析，指向dist/shared/js。KaTeX字体位于dist/vendor。中文版页面的模块/CSV下载使用../shared/路径。根index及sources/audit/case-study入口兼容跳转保留query与hash；旧文件下载路径不作为新接口。

## 原件和历史

迁移前原始材料、共享计算与固定数据保留字节；共享内核的注释语言也保持原样。旧审查、验证及进度中的路径是历史证据，不批量篡改为新路径。当前约定与运行说明已更新；用上表定位旧记录。迁移前完整源码和构建快照另保存于本机会话临时目录，不依赖该快照运行或打包。

首次迁移验证与审查见当前PROGRESS、VERIFICATION及reviews/file-hierarchy-*.md。打包脚本再次比较原ZIP七成员、风格参考及所有包成员与当前文件字节。
