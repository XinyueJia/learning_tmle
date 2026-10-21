# 当前真实RHC迁移交接

日期2026-10-16。真实数据贯穿第0—8章的迁移、独立逐章数学/教学审查及数值/浏览器回归已完成；不再仅为Ng核查页。来源为SUPPORT5735人/1918死亡，原CSV/hash/许可见shared/data/public/rhc/。

八讲均从原CSV读取；先sex八格，末讲同一记录扩展17列保守W矩阵，实际logistic拟合、AIPW、手填epsilon/二分/自动核对、两臂更新后同人群平均。实现shared/js/rhc.js及shared/julia/RHCCase.jl，8个独立入口zh/julia/rhc_lessons/。代码与数学接口详见RHC_JULIA_HANDOFF.md和COURSE_CONTRACT.md。

第一讲完整代数+18图、源脚本32行逐行解释；所有章保留独立实验/reset/预测答案/技术说明。旧合成源稿、旧专测在reference/synthetic-course-2026-10-16/，原数据与用户原件保留。math.js指定旧模型仍是纯数学测试基准，当前app从rhc-model引用真实经验基点。

实际验证：build9；JS96/96；RHC Julia127/127（8脚本从其他cwd运行）；跨语言23摘要/8格/35系数/17列名一致；九章Chrome1360/375回归（18图/MathML/实际交互/reset/答案/浮窗/粗粒及W手动自动TMLE/原文件字节/无页面溢出、console错误或外部请求）。截图在output/zh/playwright/rhc-*，已查看关键桌面/手机版面。旧专用生存/药品browserdriver属于历史，不冒充当前测试；browser.cjs/public-data-browser.cjs当前转接RHC全回归。

下一项工作若继续教学优化：在当前第一讲/第八讲进行真实初学者可用性研究；若做临床效应推断，先解决原研究48小时选择、24小时分类、急性严重度时序/充分混杂及抽样依赖，再考虑更灵活学习器、cross-fitting及覆盖率验证。当前不声称这些已证明，无后台工作。

当前实际多变量TMLE .08997972473530443、epsilon .003576966662876657，score约−3.4e−13；这些是复算基准，不是未知因果真值或算法硬编码。精确测试/风险/交付记录见docs/VERIFICATION.json。
