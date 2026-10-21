# 共享数值内核

`shared/js/math.js` 是无 DOM、无依赖、无状态修改的 ES module。矩阵索引一律为 `q[a][x]`。本页给出数值域、精确接口与求解规则，便于各章独立使用同一组定义。

## 模型与数值域

`DEFAULT_MODEL = {px:[.5,.5], g:[.2,.8], q:[[.70,.20],[.80,.50]]}`；默认 identified ATE 为 `.20`，observational contrast 为 `−.04`，EIF 方差为 `1.0975`。常量及其子数组被冻结。`cloneModel(model = DEFAULT_MODEL)` 返回独立副本。

`MEAN_MODEL = {values:[0,1,3], probabilities:[.2,.5,.3]}`，均值为 `1.4`。

二元机制模型要求所有八单元概率为正：`px` 长度为 2、每项正且和为 1；`g` 长度为 2；`q` 为 2×2；`g,q` 每项严格位于 `(0,1)`。任何非法输入、非有限数、缺少坐标或维度错误均抛异常。模型输出同样经过验证。概率归一化的浮点容差为 `1e−12`；代码不重新归一化输入，也不裁剪概率。

普通概率数组允许零值，但 `pointScore` 和 `project` 要求每项正。`contaminate` 可以返回边界分布；如需再调用 `fromJoint`，各八单元仍必须正。`expit` 使用分支公式避免指数上溢，对极端有限输入可因浮点舍入返回 0 或 1；`logit` 只接受 `(0,1)`。若 tilt/fluctuation 的输出已浮点饱和到边界，模型验证会明确抛异常，不做静默 clipping。无法有限表示的权重、score、方差等也抛异常。

## 有限分布接口

| 接口 | 返回与约定 |
| --- | --- |
| `mean(values, probabilities)` | 加权均值；数组必须同长、非空 |
| `contaminate(probabilities, index, t)` | `(1−t)p + tδ_index`；所有返回概率必须合法。允许合法的负 `t` 邻域 |
| `pointScore(probabilities, index)` | 向量 `1(i=index)/p_i−1` |
| `joint(model)` | 八个 `{x,a,y,p}`，顺序为先 `x`、再 `a`、最后 `y`，坐标都从 0 到 1 |
| `fromJoint(cells)` | 用 marginalisation 与条件商恢复模型；接受任意顺序，要求恰好八个不重复且正概率单元 |
| `ate(model)` | `Σ_x px[x](q[1][x]−q[0][x])` |
| `naive(model)` | `E[Y|A=1]−E[Y|A=0]` |
| `eif(model, cell)` | `{dx,dy,total}`；`dx=τ(x)−ψ`，`dy=H_g(a,x)(y−q[a][x])`，`total=dx+dy` |
| `expectation(cells, fn)` | `Σ cells[i].p × fn(cell,i)`，不修改输入；不限制传入单元个数 |

`tilt(model, kind, t)` 只更新指定机制。对 `X`，`px[1]` 更新为 `expit(logit(px[1])+t)`；对 `A`，每个 `g[x]` 使用同样的 logistic tilt；对 `Y`，每个 `q[a][x]` 使用同样的 logistic tilt。它们等价于该条件 Bernoulli 分布的指数倾斜，并在相应条件分布内归一化。其他两个机制的数值在所有合法 `t` 保持原样。

`mechanismScore(model, kind, cell)` 对 `X/A/Y` 分别返回 `x−px[1]`、`a−g[x]`、`y−q[a][x]`。这些是公共同参数 tilt 的 score；完整的七维 tangent space 还允许各条件单元独立系数。

第 5 章接口扩展经 lead 批准：`jointTilt(model, score, t) → model`。`score` 是按 `joint(model)` 的 `x→a→y` 顺序排列的八维有限向量，要求基准加权均值的绝对值 `≤1e−10`；超过容差抛异常。函数不自动中心化 score。它构造

\[
p_t(o_i)=\frac{p(o_i)\exp\{tS_i\}}{\sum_j p(o_j)\exp\{tS_j\}},
\]

先求 `log(p_i)+t score_i`，减去最大 log weight，再指数化并归一化，最后经 `fromJoint` 恢复机制。这是一般 joint 路径，三个机制均可改变；它不承诺 pure-mechanism invariance。与条件 tilt 相同，非有限指数或浮点下溢后无法保持正概率的路径会抛异常，不做 clipping。若 score 仅在容差内近似均值零，严格的 log-likelihood 导数为 `S−E_P[S]`。

独立测试使用 `raw=[2,−1,4,3,−.5,7,−2,1]` 按基准 P 中心化，核对 `t=0`、likelihood 中心差分、ATE 导数的独立 `ΣpDS`、`t∈[−3,3]` 的正概率与归一化，并验证尺寸/NaN/未中心化/指数溢出/概率下溢等错误显式失败。

## 加权几何与效率方差

`inner(probabilities,f,h)` 接受两个与概率同长的数值向量，返回 `Σ_i p_i f_i h_i`。`project(probabilities,f,basis)` 的 `basis` 是向量数组，例如 `[sx, sy00, sy10, sy01, sy11]`。基向量无需正交；函数用两轮 weighted modified Gram–Schmidt 构建正交标准基，再求投影。空基返回零向量；零基、重复基或数值上近乎秩亏的基（标准化后的残差范数 `≤1e−12`）抛异常。函数不隐含中心化，调用者应显式选择所声明模型的 tangent space。

实际 known-g 八单元模型使用 `T_X ⊕ T_Y`，维度 5。可用 `x−px[1]` 与四个 `1(X=x,A=a)(y−q[a][x])` 张成。两个 `T_A` 条件治疗方向与此空间正交；测试直接在这八个观察单元验证 projection 和范数分解。

`varianceDirect(model)` 枚举八单元并求 `E[D*²]`。`varianceAnalytic(model)` 独立使用

\[
\operatorname{Var}\{\tau(X)\}+\sum_x p_X(x)\left[\frac{Q(1,x)\{1-Q(1,x)\}}{g(x)}+\frac{Q(0,x)\{1-Q(0,x)\}}{1-g(x)}\right].
\]

这两个结果为参数单位平方；概率差的方差转为 pp² 需乘 `100²`。

## Population AIPW 与 targeting

`aipw(truth,fit)` 精确枚举总体 residual correction，返回

\[
\sum_x p_{0X}(x)\{\widetilde Q(1,x)-\widetilde Q(0,x)\}+E_{P_0}[H_{\widetilde g}(A,X)\{Y-\widetilde Q(A,X)\}].
\]

目标积分始终使用 `truth.px`，不使用 `fit.px`。这使 population AIPW 在任一 nuisance 正确时恢复 identified ATE。偏差乘积的符号为 `(fit.g−truth.g)` 乘以两个正分母下的 `(fit.q−truth.q)` 误差之和。

`fluctuation(truth,fit,epsilon)` 返回使用 `truth.px`、原 `fit.g` 和新 `q` 的模型。新结局预测为

\[
Q_\epsilon(a,x)=\operatorname{expit}\{\operatorname{logit}\widetilde Q(a,x)+\epsilon H_{\widetilde g}(a,x)\},\quad H_{\widetilde g}(a,x)=\frac{a}{\widetilde g(x)}-\frac{1-a}{1-\widetilde g(x)}.
\]

`fluctuationScore(truth,fit,epsilon)` 返回 `E_truth[H_fit(Y−Q_epsilon)]`。它直接计算四个条件单元，不对已经饱和的预测做 `logit`，所以 bracket 可在模型表示范围之外评估 score。这个 score 是负 Bernoulli population loss 的导数，其导数为 `−E_truth[H_fit² Q_epsilon(1−Q_epsilon)]`。

`tmle(truth,fit)` 返回 `{epsilon,updated,estimate,score,converged,iterations}`。它先检查零更新，然后从 `[-1,1]` 开始扩展 bracket（最多 60 次）；确认 score 的两端异号后，用保留 bracket 的 Newton 步求根，Newton 步越界或不可用时改用二分。绝对 score 容差为 `1e−12`，最多 200 次求解。无法 bracket、无法收敛或最终模型无法表示时抛异常，不返回声称成功的近似解。成功结果 `converged=true`，`estimate` 对 `truth.px` 积分。零更新成功时 `iterations=0`。

这是总体积分演示，不能推断有限样本无偏、拟合器收敛速度或置信区间覆盖率。Tests 使用独立枚举、公式及中心有限差分检验数学恒等式，未以函数自身计算其 expected output。

## 执行验证

```sh
/Users/xinyuejia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/math.test.js
```

测试覆盖概率归一化、合法负污染、边界与非法输入、均值精确污染、八个点方向、七个独立平滑方向及其线性组合、任意 score 的条件分解、三机制 likelihood score、纯 `g` tilt 的 invariance、known-g weighted projection、范数分解、两种方差、DR bias product、population 双稳健恢复、logistic loss/score 导数、预测范围及 TMLE bracket/convergence。

## 第 1–2 章 UI 数值审查

已只读审查 `src/app.js` 的 `lab1/lab2` 和 `tests/zh/browser.cjs`（2026-10-13）。未发现阻断：两章使用冻结的 `MEAN_MODEL`，不修改基准概率；所有输入读取、输出及 reset 均限定于章节 root。第 1 章 `t∈[0,1]` 的边界可由 mean/contaminate 合法处理，第 2 章 `t∈[−.1,.3]` 对三个选点都保持正概率。图中的精确曲线直接重新加权计算；第 2 章 h、S、D 使用固定基准 P，在当前 t 改变时保持不变。分数、分/单位 t 及无量纲 score 与内核一致。

浏览器 assertions 当前有 reset、MathML、窄屏及第 1 章两组结果 `1.3200` / `0.2800`；建议在第 2 章完成后补以下针对性 assertions：

- 真正改变 select（当前通用循环选择最后一个 option，而两章默认已选最后项）；keyboard ArrowRight 后确认结果实际改变。
- 第 1 章 `t=1` 时 `p_t` 为选点的点质量、精确均值为 z；确认线性式与精确值两个指定 metric 都正确，而不只在整个结果文本查找数值。
- 第 2 章选 `z=0,t=−.1`，检查 `p_t=[.12,.55,.33]`、均值 `1.54`、`S=[4,−1,−1]`、`E[DS]=D(0)=−1.4`。改变 t 后检查 h、S、D 三列仍固定，且 `E[S]=E[D]=Σh=0`。
- 先改第 1 章，再改/重置第 2 章，返回第 1 章验证其控件和结果仍保留，直接覆盖章节隔离。

当前仅完成两章时，浏览器脚本需以 `CHAPTER_LIMIT=2` 执行，因为其默认值为 8；不得为通过数量检查登记未完成章节。本次只读审查没有重复运行已通过的测试。

## 第 6 章实际投影 UI 审查

已只读审查当前 `lab6`、第 6 章 brief 与浏览器新增 assertions。实现与内核一致，无阻断：独立 clone 的八单元模型固定 `g`；基为 `X−px[1]` 和四个 `1(X=x,A=a)(Y−Q(a,x))`，确实张成五维 `T_X⊕T_Y`。`U=A−g(X)` 的条件均值在每个 X 都为零，是全模型内的治疗 score 方向，与已知 g 模型的所有五个基正交。`bU` 是其缩放，属于相应正交补。`D*` 位于已知 g 模型切空间，因此实际 weighted projection 应恢复 `D*`。

范数曲线的每个点都直接形成八维 `candidate=Dstar+bU`，再调用 `M.inner(p,candidate,candidate)`；没有用恒等式替代精确曲线。界面也计算 projection/residual 及两者内积。全模型的候选配对 `M.inner(p,D,U)` 对应真实导数为零的处理方向，理论值为 `.16b`，因此非零 b 的候选仅在已知 g 模型成立。界面文字准确区分了这两个模型。

浏览器第 6 章新增测试核对 `b=2,−1,0` 的 candidate/projection/residual 范数及逐行 projection；数值与内核一致。一次只读数值核对（未重跑 18 个 kernel tests）确认其显示值分别为 `1.7375/1.0975/.6400`、`1.2575/1.0975/.1600`、`1.0975/1.0975/.0000`，orthogonality 显示均为 `0.0000000000`。

建议再补全模型配对的 UI assertions：`b=2 → .320000`、`b=−1 → −.160000`、`b=0 → .000000`，并验证 `b=−1/+1` 时表中的 `bU` 逐行反号。当前 omissions 是覆盖补强，不影响已审查实现的数学正确性。

## Overlap 路径的非单调性回归测试

新增一项针对第 7 章路径 `g=[r,1−r]` 的数值回归测试，未修改 kernel。固定默认结局机制时，八单元枚举与解析式给出

\[
V(r)=.01+\frac{.16}{r}+\frac{.23}{1-r},\qquad V'(r)=-\frac{.16}{r^2}+\frac{.23}{(1-r)^2}.
\]

因此 `V(.05)>V(.2)`，但 `V(.45)<V(.5)`，不能把更接近平衡分配表述成普遍严格降低方差。内部最优点为 `r_opt=√.16/(√.16+√.23)≈.454760870464411`。测试比较 `.05/.2/.45/.5` 与最优点两侧 `±.001`，并核对最优点的解析导数及独立八单元中心差分均近零。指定 Node 命令最终 **19/19 通过**。这项回归仅验证该路径的数值性质，不代表审查或批准第 7 章全部正文与数学论证。

## 第 8 章公开辅助接口

以下三项共享 API 扩展经 lead 批准，将界面的核心数学集中到纯函数内核。

| 接口 | 返回与验证 |
| --- | --- |
| `cleverCovariate(model,a,x)` | `a/g[x]−(1−a)/(1−g[x])`；完整模型验证后，要求 a、x 为数值 0 或 1，复用内部 inverse propensity 权重与有限性验证 |
| `nuisanceBias(truth,fit)` | 对 truth.px 加权的精确 nuisance-error product，亦即 population AIPW 的带符号偏差；完整模型验证，不使用 fit.px 作为目标积分权重 |
| `fitFromOffsets(truth,b,lambda)` | 返回独立模型副本，px 使用 truth.px；q 的 control 行增加 `[b,.5b]`，treatment 行减少 `[.5b,b]`；g 使用 `(1−lambda)truth.g+lambda×.5` |

`nuisanceBias` 的公式为

\[
\sum_x p_{0X}(x)\{\widetilde g(x)-g_0(x)\}\left[\frac{\widetilde Q(1,x)-Q_0(1,x)}{\widetilde g(x)}+\frac{\widetilde Q(0,x)-Q_0(0,x)}{1-\widetilde g(x)}\right].
\]

`fitFromOffsets` 要求有限 b 与 `lambda∈[0,1]`，并验证最终模型的严格正概率域。导致预测等于或越过 0/1 的 b 会抛异常，没有 clipping；函数不会修改 truth。默认 truth、`b=.12,lambda=.5` 对应 `q=[[.82,.26],[.74,.38]]`、`g=[.35,.65]`，bias 为约 `.001978021978`。任一 nuisance 正确时 bias 为零。

新增独立 assertions 直接核对以上 q/g、四个 clever weights、signed bias、非默认 truth.px 权重、zero-bias recovery、输入隔离及非法坐标/偏移/概率错误。指定 Node 命令最终 **21/21 通过**。本次只修改共享内核、数值测试与本说明，没有修改第 8 章界面或正文。

## 2026-10-15：固定频数表与Julia样本算法

本节区分前面的总体实验。`shared/js/case-study.js`从唯一DEFAULT_MODEL生成一次200条合成计数，构建器核对CSV逐字相符；算法接口只读取传入观察计数。Julia `EIFCase.jl`从CSV重建模型，不读取JS真分布或把.20用作拟合输入。各章本地reset不改变这份数据或其他实验。

基准八格人数[24,56,4,16,16,4,40,40]，初始两臂风险.60/.56；H按(X,A)组为[−1.25,5,−5,1.25]。每记录平均score(0)=.24，初始F二阶矩1.64/均值.24/中心方差1.5824；饱和经验梯度方差1.0975是另一函数。解观察计数score得epsilon约.162239239634958；Q按(X,A)组约[.550493802938,.741227491674,.399936166028,.609202477292]，更新目标.20，平均score/EIF在1e−12容差内。更新函数中心方差1.219262395785，SE演示.078078883054；它不是无需条件的有效推断标准误。

经验中心方差始终按sum p_i(D_i−meanD)²计算，不把非零均值的二阶矩混用。当前案例完整正计数是教学实现域；零单元/缺格/非法标签/非整数/非有限数明确失败，不静默clipping。Julia bisection_step与solve_case明确检查括号/容差/迭代与浮点停滞；JS自动方法可扩展初始括号，失败抛错。网页手动输入区间为[−1,1]，与无条件保证所有合法输入根都落此区间不同。

实际测试分别记录于PROGRESS与VERIFICATION；固定参考值由独立枚举/求根得到并只出现在断言/手算答案，不进入估计算法。跨语言核对包含默认表、保持20人将处理组16事件改成15、改变另一组人数为40后的n=160表，目标分别.20/.175/.175。不同语言互核以外，各有独立参考断言，不能仅靠相互一致宣布正确。

## 第一讲Julia可读实现与逐行样板（2026-10-15）
mean_if(data)保持risk/values/mean接口，改为从data.n与cells(n,y)自行累计住院数，再逐格保存D并累计n/N权重。新10项Julia断言使用最小输入（没有预先marginal_risk或p）、独立改事件数预期、返回向量隔离及真实脚本stdout；共158项/13testsets通过。浮点平均约6.938893903907228e−17与实数中心化0区分，round只处理显示。网页两账由同一CSV构建，并用独立逐格预期校验，源码行有逐字/完整覆盖/哈希漂移失败约束。原数学内核、其他章节及病例CSV保留；当前71项JS与三fixture跨语言均通过，具体浏览器/最终版本范围见VERIFICATION。
