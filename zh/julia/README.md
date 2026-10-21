# 用Julia逐讲构建固定案例的手工TMLE

这里读取同一份200条上市后RWS合成记录的联合频数表，按第1—8讲累计计算；不是真实药物疗效或安全性证据，也不是调用TMLE软件包。只使用Julia Base和标准库LinearAlgebra、Printf、Test。Julia模块不读取JavaScript模型，不把构造值当作拟合时可查询的真值。

在项目根目录运行：

```sh
JULIA_DEPOT_PATH=/private/tmp/eif-tutorial-julia-depot JULIA_HISTORY=/private/tmp/eif-tutorial-julia-history julia --startup-file=no --history-file=no tests/julia/runtests.jl
JULIA_DEPOT_PATH=/private/tmp/eif-tutorial-julia-depot JULIA_HISTORY=/private/tmp/eif-tutorial-julia-history julia --startup-file=no --history-file=no zh/julia/run_case.jl
```

若`juliaup`启动器因用户配置目录的锁文件权限失败，可以把命令中的`julia`换成已有安装中实际的Julia可执行文件；不需要安装包或修改用户配置。临时depot仅用于标准库预编译缓存。

`run_case.jl`可选接收一个CSV路径；省略时读取项目根目录的`shared/data/rws-counts.csv`。所有lesson的include和默认CSV路径都基于`@__DIR__`，因此用脚本的绝对路径运行时不依赖当前工作目录。

## 逐讲接力

| 讲次 | 运行脚本 | 当讲核心与后续用途 |
| --- | --- | --- |
| 01 | `julia zh/julia/lessons/ch01.jl` | 从事件数/总人数算终点事件风险，再算二元均值IF；风险是以后组内均值的原件 |
| 02 | `julia zh/julia/lessons/ch02.jl` | 同表一格的质量守恒方向、h与score、均值IF配对；区分路径位置与方向 |
| 03 | `julia zh/julia/lessons/ch03.jl` | 汇总四组人数/事件，学习经验px、g和组内风险；仅按A汇总产生初始Q |
| 04 | `julia zh/julia/lessons/ch04.jl` | 构造H和初始经验EIF，逐项看残差贡献及其平均；保留诊断，不提前求修正值 |
| 05 | `julia zh/julia/lessons/ch05.jl` | 在完整经验模型验证ATE梯度方向配对，保留结局方向；有限检查不代替全方向证明 |
| 06 | `julia zh/julia/lessons/ch06.jl` | 按原经验概率作五基投影，说明典范梯度；只在此练习假定g已知 |
| 07 | `julia zh/julia/lessons/ch07.jl` | 用各观测组合的概率权重计算经验IF方差/SE，为更新后重新计算作准备 |
| 08 | `julia zh/julia/lessons/ch08.jl` | 手动试epsilon，显式逐次二分，更新四组Q并按经验X平均，检查经验EIF方程 |

上表简写省略了`--startup-file=no --history-file=no`及临时depot；在受限环境中可使用前面的完整形式。八份脚本可以逐讲执行，也可以各自独立运行，均不重新随机抽样。

`shared/julia/EIFCase.jl`以`# BEGIN_CH01`/`# END_CH01`至`CH08`标记各讲核心函数定义，可在对应章节连同lesson用法一起展示。第3讲的读取、验证和数据准备放在文件前部，是其他例子共同使用的输入层；其他核心函数按第1—8讲顺序保留。第3讲汇总仅保留计数与比例，不生成H或offset；H由第4讲的`clever_h`定义，第8讲更新时才向组结果加入H与offset。公共向量/概率校验和加权内积在标记段之外。完整运行先include模块；标记用于逐讲阅读，不意味着每一段都有相同的依赖。

代码可编辑：第8讲核心段完整写出平均score、平均log likelihood、导数、logistic fluctuation、逐组预测/残差、括号检查和二分求根。lesson8显示手动epsilon与二分循环；`solve_case`是供完整复算和跨语言核对的同一组底层运算，没有用外部估计包。模块定义只维护一份，lesson只展示当讲使用方式。

## 稳定接口与索引

```julia
include("shared/julia/EIFCase.jl")
using .EIFCase
counts = read_counts("shared/data/rws-counts.csv")
data = case_data(counts)
initial = case_at(data, 0.0)
updated = solve_case(data)
updated.converged || error(updated.reason)
```

CSV必须有表头`x,a,y,n`及完整八个正整数单元，不重复、不省略。当前教学全正模型以外的零单元、非整数、缺格和非法标签均明确失败，不作clipping。传入顺序可变，输出统一按x、a、y排序；改变计数会重新学习全部概率。

- 标签x、a、y取0或1；Julia数组从1开始，`q[a+1,x+1]`的行是处理a、列是基线x，`px[x+1]`和`g[x+1]`按x排列。四组`groups`按x外层、a内层排列。
- `data`含`n/cells/groups/empirical_model/initial_fit/initial_estimate/observed_difference/marginal_risk`。每格保留n和经验概率p；四组含人数、事件、`q_observed/p_x/g_hat/initial_q`，不依赖H或logit。
- `mean_if(data)`返回`risk/values/mean`；`point_direction(data,index)`返回`h/score/derivative/pairing`，index为1—8的观测组合序号；`linear_path(p,score,t)`拒绝非法非正路径。
- `direction_check(data,score;step=1e-6)`返回`finite_difference/pairing/difference`，起点使用完整经验模型的梯度。`projection_demo(data;b=1.0)`返回候选、五基、投影、残差及平方范数；不把错设初始Q的经验函数叫作完整经验模型的典范梯度。
- `if_variance(data,values)`返回`mean/second_moment/variance/se`，方差是先减去加权均值再平方，不将未中心化二阶矩误作方差。
- `fluctuation_score(data,epsilon)`返回`score/slope/log_likelihood`，均按每条记录平均。`case_at(data,epsilon)`在组结果中加入`h/offset`，另返回逐组更新Q、预测事件数、残差、score贡献、`updated_fit/estimate/aipw/eif_rows/eif_mean/eif_second_moment/eif_variance/se`。
- `bisection_step(data,lo,hi)`检查单调score根的括号，返回`midpoint/score`及下一步`lo/hi`。`solve_case(data;lo=-1.0,hi=1.0,score_tol=1e-12,maxiter=200)`返回`case_at`结果及`converged/iterations/reason`。非法输入/无效括号失败；超过迭代或浮点停滞返回`converged=false`，调用者必须检查，不可把失败结果当成已解的TMLE。

## 输出与统计边界

`run_case.jl`标准输出为`key,value`，不依赖JSON包：包括n、初始值、score0、epsilon、四个`qstar_x0_a0`等组别值、score、目标风险差、经验EIF均值/二阶矩/中心方差、SE和收敛信息。风险差与SE保持概率单位；要显示百分点才乘100。无法求根或输入非法时进程失败，不输出伪成功结果。

第7讲分别计算初始拟合函数与饱和经验Q对应梯度的矩；它们和第8讲更新后函数的经验方差是不同对象。此例初始Q故意仅含A；更新后的四个Q一般不会逐点等于各组观察风险。解经验score或经验EIF均值零，不证明结局拟合正确、有限样本无偏或置信区间覆盖。更新后SE只是这组函数的经验方差除以n后开根；未验证它收敛到真EIF，不声称它是有效推断的标准误或真实效率界，不输出置信区间。

独立预期测试包含固定表的初值、方向、投影、似然导数、根与四个更新Q，以及事件16改成15但保持该组20人、另一组人数翻倍等输入扰动。预期数值只在测试中，不进入拟合算法。模块作者的测试不替代独立数学验收。

## 第一讲的逐行代码说明

第一讲的32行代码说明，对照两次显式循环与数学求和；mean_if从总人数及每格n/y自行求均值，不再只取预先算好的风险。返回risk/values/mean不变。lesson01使用println/round，并打印原始/舍入后的经验IF平均；ch01-output.txt是实际运行输出记录，Julia测试会启动脚本核对，不能把手写passed或强行设零当验证。改变计数的独立预期测试同时确认均值真的重算。

本例Y为12个月内疾病进展或全因死亡，每人最多计1次；变量events累计发生终点事件的人数。A=0为活性对照B。标准化风险差按研究药A减B计算，正号是不利方向。单独改变终点名称不能将这些合成结局变成安全性资料。
