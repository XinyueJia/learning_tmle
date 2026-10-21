# RHC 原始数据 → 八讲 Julia → 逐人 TMLE

本入口使用 `shared/data/public/rhc/source.csv` 中全部 **5,735 位**患者的原始记录。没有抽样、复制、删行或补值。`shared/julia/EIFCase.jl` 继续保留为通用八格数值推导工具；RHC 模块只复用其中的代数函数，从不读取原来的合成计数 CSV，也不将其常数作为研究结果。

## 运行

```sh
julia --startup-file=no zh/julia/rhc_case.jl
julia --startup-file=no zh/julia/rhc_lessons/ch01.jl
julia --startup-file=no zh/julia/rhc_lessons/ch08.jl
julia --startup-file=no tests/julia/rhc-tests.jl
```

全部代码只使用 Julia 标准库。可在任何工作目录中用脚本的绝对路径执行。`rhc_case.jl` 可接收具有原始 63 列结构的其他 CSV 路径；它不会下载或替换冻结的数据。

## 原始字段与八格手算

`read_rhc_rows(path)` 保留全部 63 个原始字段为字符串，包括未命名的行号列、带前导零的 `ptid` 以及数值中的原始空格。CSV 读取器支持引号内逗号及换行、双引号转义、CRLF 与 UTF-8 BOM；错误引号、字段数错误、缺失必要列、重复患者编号会报错，不静默跳行。

`rhc_observations(rows)` 只进行以下显式映射：

| 教学量 | 原始字段 | 0 | 1 |
| --- | --- | --- | --- |
| X | sex | Female | Male |
| A | swang1 | No RHC | RHC |
| Y | dth30 | No | Yes |

这里直接使用来源中的 `dth30`，没有根据最后联系日期自行构造生存终点。原始研究的观察窗、纳入条件及二元结局可用性应与同目录的数据来源说明一并阅读。

按 `(x,a,y)` 升序的独立原始数据计数为：

```text
x,a,y,n
0,0,0,1143
0,0,1,494
0,1,0,558
0,1,1,348
1,0,0,1320
1,0,1,594
1,1,0,796
1,1,1,482
```

总死亡人数 1,918；RHC 人数 2,184；非 RHC 人数 3,551。第 1 讲直接逐人计算 `sum(Y)/n = 1918/5735 = 0.3344376634699215`，再与八格加权结果核对。脚本共 32 行，逐步解释 `include`、`using`、`length`、`sum`、除法、广播减法及 `@assert` 与数学式的对应关系。

`rhc_counts(rows)` 独立聚合原始行。`rhc_data(path)` 将聚合结果交给通用数值函数。`write_rhc_counts(path, rows)` 可将这次计算的八格表写入另一个文件；各章运行均直接从原始数据重新计算，不依赖预写答案表。

## 八讲计算链

| 脚本 | 从真实数据实际计算的内容 |
| --- | --- |
| ch01 | 逐人死亡均值、均值 IF、八格加权核对 |
| ch02 | 保持概率和为 1 的方向、score、均值导数与 IF 配对 |
| ch03 | 四个性别×处理组的分母、事件数、经验 X 分布、按性别估计的 g 与只按 A 拟合的初始 Q |
| ch04 | H、初始风险差与尚未归零的梯度样本平均 |
| ch05 | 混合、结局、点质量及七个对比方向的有限差分与梯度配对 |
| ch06 | 仅在投影练习中把经验 g 固定，手写加权 Gram–Schmidt 投影与正交残差 |
| ch07 | 当前经验梯度的均值、二阶矩、中心化方差及 SE |
| ch08 | 手动试 epsilon、二分 score 根、logistic Q 更新；随后在同一批患者扩展到逐人基线模型 |

八格初始 Q 故意只按 A 拟合，而 g 按性别估计，让读者观察非零 targeting score。性别标准化初始风险差约为 0.073644065；更新后约为 0.073692119，epsilon 约为 0.000049827137。只按性别调整不能建立充分混杂控制。第 6 讲为几何练习而固定 g，不表示临床治疗机制已知；最终八格和逐人分析均由观测数据估计 g。

## 同一队列的逐人基线模型

`prepare_full(rows)` 的 X 设计矩阵固定为以下 17 列，顺序也是系数输出的顺序：

```text
intercept,male,age_z,race_black,race_other,
cardiohx,chfhx,dementhx,psychhx,chrpulhx,renalhx,liverhx,
gibledhx,malighx,immunhx,transhx,amihx
```

`male = 1(sex == Male)`，种族以 white 为参考组；历史字段使用原始 0/1。`age_z = (age - mean(age))/sqrt(sum((age-mean(age))^2)/n)`，分母是总体标准差。冻结数据的年龄均值为 61.37588299738448，标准差为 16.68047483037684。上述字段在当前 5,735 行均完整。遇到缺失值、未知类别、常数年龄或秩不足设计矩阵会明确失败，没有填补、删行、正则化或悄悄删除列。

模型为 `logit g(X) = X βg` 和 `logit Q(A,X) = [X,A] βQ`，初始 Q 不包含交互项。`fit_logistic` 手写 Newton 更新及对数似然回溯，两个模型在当前数据各迭代 4 次；停止条件是各列平均 score 的最大绝对值不超过 `1e-10`。没有调用回归或 TMLE 第三方包，也没有截断 propensity。

逐人 targeting 使用

```text
H(A,X) = A/g(X) - (1-A)/(1-g(X))
Qε(1,X) = expit(logit Q(1,X) + ε/g(X))
Qε(0,X) = expit(logit Q(0,X) - ε/(1-g(X)))
score(ε) = mean[H(A,X) (Y-Qε(A,X))]
ψ(ε) = mean[Qε(1,X)-Qε(0,X)]
```

二分求解 score，固定括号 `[-0.25,0.25]`、容差 `1e-12`。括号不含根、浮点概率达到 0/1、求解停滞或迭代次数不足都会失败，不将失败状态写成成功结果。第 8 讲显式逐次二分并打印早期步骤。

冻结数据的计算结果：

| 量 | 数值 |
| --- | ---: |
| g 最小值 | 0.07869797540624915 |
| g 最大值 | 0.6819050426722195 |
| 初始标准化 risk0 | 0.3017638225974237 |
| 初始标准化 risk1 | 0.3882626784997542 |
| 初始风险差 | 0.0864988559023306 |
| 初始 score | 0.0034691393067677457 |
| 初始 AIPW | 0.08996799520909834 |
| 目标更新 epsilon | 0.003576966662876657 |
| 更新后 risk0 | 0.30058304496920574 |
| 更新后 risk1 | 0.39056276970451026 |
| 更新后 TMLE 风险差 | 0.08997972473530443 |
| 更新后 score | -3.402452784305322e-13 |
| 更新后经验 SE | 0.013082375165239404 |

这些数值来自实际拟合和求根，不是程序输入。这里的扩展基线集合仍省略急性治疗前病情严重程度；没有证明条件可交换性。原研究的入组选择还需考虑早期死亡或出院的排除规则。只有在一致性、充分混杂控制、正性、结局测量和相应选择机制假设下，才可把目标解释为因果效应。score 收敛、程序正确以及更多基线列都不能证明这些假设。经验 SE 也不保证有限样本置信区间覆盖。

## 对外代码接口

```julia
include("shared/julia/RHCCase.jl")
using .RHCCase
result = full_analysis()                 # 或 full_analysis(path)
fit = result.fit
initial = result.initial
final = result.targeted
trial = full_at(fit, 0.002)              # 手动试更新参数
step = full_bisection_step(fit, -0.25, 0.25)
```

`fit` 包含 `n,feature_names,q_feature_names,age_mean,age_sd,design,a,y,g_fit,q_fit,g,q0,q1,h`。其中 `q0,q1` 永远是初始预测。`g_fit` 与 `q_fit` 分别包含 `coefficients,probabilities,iterations,converged,score_maximum,log_likelihood`。

`full_at` 返回 `epsilon,q0,q1,q_observed,score,slope,log_likelihood,risk0,risk1,estimate,aipw,eif_values,eif_mean,eif_variance,se`；这里 `q0,q1` 是当前 epsilon 更新后的预测。`aipw=estimate+score`。`solve_full` 额外返回 `converged,iterations`，它是 `full_analysis().targeted` 的来源。`rhc_case.jl` 打印特征、系数及上述数值，便于与独立 JavaScript 实现核对。

代码标记 `BEGIN_RAW_READ/END_RAW_READ`、`BEGIN_RHC_COUNTS/END_RHC_COUNTS`、`BEGIN_FULL_BASELINE/END_FULL_BASELINE`、`BEGIN_FULL_TARGET/END_FULL_TARGET` 允许正文提取实际运行的实现。八格通用代数仍位于 `EIFCase.jl` 的 `BEGIN_CH01` 至 `BEGIN_CH08` 标记内。

## 验证

`tests/julia/rhc-tests.jl` 共 127 项检查全部通过，覆盖独立原始人数、八格计数、CSV 引号及原始结构失败、各点方向有限差分、加权投影正交性、基线特征变换、两个逻辑模型 score 方程、逐人似然及 score 的有限差分、目标根、概率范围、观测结局改变导致重新拟合结果改变，以及八个脚本在项目目录外运行。原始固定计数来自单独的 Python `csv.DictReader` 聚合；测试没有拿合成教学数据充当来源。
