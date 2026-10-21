# 原版审计与新稿检查依据

日期：2026-10-13。范围：原 Markdown、builder、原 HTML 尾部 JavaScript、原 Python 浏览器脚本的静态阅读，另加下述独立数学推导。没有运行浏览器测试。新章只有在作者稿、实现和实际测试分别完成后才能验收；本记录不授予任何未审阅章节“通过”。

## 原稿、实现与测试的具体问题

| 位置 | 发现及影响 | 修复要求 |
|---|---|---|
| 原稿 §1–2 | 第1章直接命名 D*；未交代为什么一个点的导数足以构造整个均值方向表示。第2章点路径只给 t≥0 污染直觉，未明确双侧局部邻域。 | 第1章先从合法总质量守恒扰动导出中心化，再于技术展开说明唯一性；第2章给负 t 合法范围并区分连续点污染。 |
| builder `upd1`，约 lines 86–90 | “真实均值”与切线都用 `mu+t0*d`，曲线重合本身没有独立验证意义。 | 精确曲线先形成扰动概率，再计算加权均值；切线独立使用基准导数。 |
| builder `plot`，约 line 76 | 通用纵轴固定 `100*v` 及 `%`，将均值分数 1.4 标为140%，将 EIF 方差也标百分比。 | 按章节提供单位与 formatter；均值为分数，方差为概率差平方，ATE 可显示 pp。 |
| 原稿 §4 | 商式求导只报结果，未逐行展示分子/分母的导数及 product rule；点污染同时改变 X、A、Y 机制，却在“扰动条件结局”小节呈现。 | 写明联合点污染，分别提取 X 与 Y 的一阶项，显示 p_X 抵消并说明 g 的变化无独立贡献。 |
| 原稿 §5 与 `tiltedPsi` | 文本用联合指数倾斜 `p_t(o)∝p(o)exp(tS)` 描述纯机制实验；代码实际为条件归一化，仅修改一个因子。条件均值零只保证别的因子一阶不变，并不保证任意 t 不变。 | 文本与实现都定义条件倾斜，明确每个 t 下其余两个因子固定。现有纯 A 实现正确，不能误报为旧 bug。 |
| builder `verify`，约 line 187 | 纯 A 路径只验证 ATE 不变，若根本没修改 g 也会通过。 | 验证 g_t 确实改变，同时 Q_t、p_X,t 不变；用重构联合分布确认因子，而非仅查 ATE。 |
| 原稿 §6 | 只给抽象二维轴图，尚未在实际有限模型说明合法 score 的空间、七维维数及投影。 | 由8种观测组合归一化约束导出七维 L²₀(P)；受限例子必须明确限制及 tangent，并实际计算加权投影。 |
| 原稿 §7 | 从最小范数直接跳到估计方差界，未定义估计器 IF 与渐近线性、regularity。 | 用渐近展开与 CLT 连接 estimator IF；用路径局部偏移解释 regularity 迫使同样的导数约束，再用投影或 Cauchy–Schwarz 得效率界。 |
| 原稿 §8 | logistic fluctuation 被称作“沿 EIF score 方向”；其 Bernoulli score 实际是 H(Y−Q)，只对应结局部分；全 EIF 的 X 部分由经验 X 分布及 plug-in 中心化解决。 | 明确 score 的精确组成，逐项证明经验 EIF 为零，避免暗示该条件结局路径 score 等于全 EIF。 |
| builder `modifiedQ`、`tmleCalc` | 公共模拟依赖 clamp；TMLE 固定区间二分却不检查根是否 bracketed、不报告是否收敛。默认控件范围内 clamp 未触发，但不能作为通用数值接口。 | 非法模型显式失败；显式检查 score 单调性、根区间、最终残差及收敛状态。 |
| 原稿 §8 | DR 恒等式正确，但“一个模型正确”的总体积分不能推出有限样本无偏或有效置信区间。 | 分开一致性、orthogonality、root-n 推断；后者另需 positivity、nuisance 收敛、乘积误差 o_p(n^−1/2)、经验过程控制。 |
| `test_eif_html.py` | 硬编码 `/mnt/data`、`/usr/bin/chromium`；只打印 passed/errors/控件文本，没有 assert，若 self-test false 或报 pageerror 仍可能退出0。 | lead 在当前环境实际运行可迁移浏览器验收，关键数值、控制交互、错误及可达性都用断言，不把日志当测试通过。 |

## 独立核验：乘积偏差符号

记 e_a(x)=Q̃(a,x)−Q₀(a,x)，δg(x)=g̃(x)−g₀(x)，并令 ψ₀=E₀[Q₀(1,X)−Q₀(0,X)]。在真实条件分布下直接迭代期望：

\[
E_0[D(O;\widetilde Q,\widetilde g,\psi_0)\mid X]
=e_1-e_0-\frac{g_0}{\widetilde g}e_1
+\frac{1-g_0}{1-\widetilde g}e_0
+\tau_0(X)-\psi_0.
\]

对 X 积分后最后一项均值为0，其余项为

\[
B(\widetilde Q,\widetilde g)
=E_0\left[\delta g\left\{\frac{e_1}{\widetilde g}
+\frac{e_0}{1-\widetilde g}\right\}\right].
\]

原稿第8章的总体 AIPW 偏差 B 符号正确。若定义
ψ(Q̃)−ψ₀=−P₀D(Q̃,g̃,ψ(Q̃))−R，则 R=−B；若将 AIPW−ψ₀ 的剩余偏差记为 R2，则 R2=B。必须先写定义，不能仅凭“余项”一词改正负号。

若 c≤g̃≤1−c，Cauchy–Schwarz 给
|B|≤c^−1‖δg‖₂(‖e₁‖₂+‖e₀‖₂)。整个 Q 正确或 g 正确使 B=0；两个 nuisance 均接近真值时 B 无单一一阶误差项，但这不单独保证有效推断。

## 独立核验：合法路径与空间

有限正概率 p_j 的点路径为 p_t,j=(1−t)p_j+t1(j=k)。其严格正概率双侧范围是 −p_k/(1−p_k)<t<1（p_k<1）。score s_k,j=1(j=k)/p_j−1，均值0。所有均值零方向 s 均可由 p_t,j=p_j(1+ts_j) 在足够小的双侧邻域实现，因此8种观测组合全模型 tangent 是七维 L²₀(P)。

纯 g 路径须写作 p_t(x,a,y)=p_X(x)p_t(a|x)p(y|a,x)，其中 p_t(a|x) 条件归一化。联合 exp(tS_A) 在每个 X 下产生不同归一化常数，整体归一化一般会改变 p_X；E[S_A|X]=0 仅排除这种变化的一阶项。

## 独立核验：效率与 targeting 的桥梁

regular 渐近线性估计器具有
\(\widehat\psi-\psi_0=n^{-1}\sum_i\varphi(O_i)+o_p(n^{-1/2})\)，且 Eφ=0。路径局部扰动下 regularity 要求 E(φS)=dotψ(S)。因而 φ=D*+u、u⊥T；CLT 的渐近方差 Eφ²=ED*²+Eu² 给下界。在一维路径上也可用 |dotψ(S)|²≤Eφ²·ES²；取 S=D* 达到 ED*²。均值范数最小性只有经这一步才成为估计效率结论。

logistic Q_ε=expit(logit Q̃+εH) 的条件 Bernoulli log-likelihood 导数是 H(Y−Q_ε)，二阶导数是 −H²Q_ε(1−Q_ε)。若解出经验 score 为0，再令 ψ̂=P_n(Q*_1−Q*_0)，则 EIF 的两个经验项分别归零。这里单参数路径的 score 不是全 EIF；population 演示以 P₀ 积分也不是实际样本 TMLE 或覆盖率实验。
