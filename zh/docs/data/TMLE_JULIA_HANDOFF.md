# 第8章逐列TMLE：Julia工作簿交接

`zh/julia/tmle_trace.jl` 直接读取同一份冻结RHC原始CSV，用导出的 `prepare_full(rows)` 拟合初始模型，再把每个更新对象保存为独立变量。没有新包、静默截断、删人或插补；没有调用TMLE软件包。原来的第8讲脚本和前七章文件保持不变。

## 运行与输入

在同时包含 `shared/`、`zh/` 的项目根目录运行：

```sh
julia --startup-file=no --history-file=no zh/julia/tmle_trace.jl
TMLE_EPSILON=0.002 julia --startup-file=no --history-file=no zh/julia/tmle_trace.jl
TMLE_EPSILON=-0.002 julia --startup-file=no --history-file=no zh/julia/tmle_trace.jl
```

默认epsilon为0，表示查看固定初始模型处的状态，尚未求根。`TMLE_EPSILON` 是环境变量字符串，`parse(Float64, ...)` 将它转为所有患者共用的一个标量。脚本始终从文件自身所在目录定位输入，也能由其他工作目录启动。

`prepare_full` 返回初始拟合容器；基线原始变量为15项，实际编码的设计矩阵为5735×17，Q模型再加实际A成为5735×18。`fit.a`、`fit.y` 是浮点0/1向量，`copy` 为工作簿建立独立副本。没有调用 `full_analysis` 或 `solve_full`，因此读取初始fit不会提前执行TMLE求根。

## 稳定变量接口

| 变量 | 类型与维度 | 作用 |
| --- | --- | --- |
| `rows`、`fit` | 原始字典向量、初始拟合容器 | 准备输入；不是逐列更新预测 |
| `n` | Int标量 | 同一批5735人的总人数 |
| `a`、`y` | Float64向量，各n项 | 实际处理与实际死亡，始终保留原始行序 |
| `g`、`q0`、`q1` | Float64向量，各n项 | 固定初始倾向得分与两臂风险预测 |
| `qa` | n项 | 以实际a逐行选q1或q0 |
| `offset`、`offset0`、`offset1` | 各n项 | 实际A、预测A=0、预测A=1对应的固定初始logit |
| `h`、`h0`、`h1` | 各n项 | 实际A、预测A=0、预测A=1对应的clever covariate |
| `epsilon` | Float64标量 | 所有患者和两臂共用的更新幅度 |
| `shift`、`shift0`、`shift1` | 各n项 | epsilon逐项乘对应方向 |
| `eta`、`eta0`、`eta1` | 各n项 | 对应offset逐项加shift |
| `qstar_a` | n项 | 对eta逐项expit，得到实际A对应的更新风险 |
| `residual`、`score_contribution` | 各n项 | y−qstar_a，再逐项乘h |
| `qstar0`、`qstar1` | 各n项 | 对eta0、eta1分别逐项expit；W不变 |
| `contrast` | n项 | 同行qstar1−qstar0，尚未平均 |
| `psi` | Float64标量 | 对全部n项contrast求和再除以n |
| `centred`、`eif` | 各n项 | contrast逐项减psi；再与score_contribution同行相加 |
| `score_mean`、`eif_mean` | Float64标量 | 对全部n项贡献各自求和除以n |

共有26个逐人向量。Julia `Vector` 的实际 `size` 是 `(n,)`；图中可以把它画成数学上的n×1竖列，但不能称作Julia矩阵。`.*`、`./`、`.+`、`.-` 与 `logit.`、`expit.` 都是逐元素运算（broadcast），没有矩阵求逆或矩阵乘法。`sum(...) / n` 才把整列收缩为一个标量。

两臂各有完整的 `offset → shift → eta → qstar` 对象，前端可直接读取，不能为了画图再建立一套计算。实际A始终用于qa与h的行选择；预测A=0与A=1时保持W、初始g和epsilon相同。

## 精确源码映射

`zh/src/julia/ch08-trace.json` 的结构为：

```text
version: 1
source: zh/julia/tmle_trace.jl
lineCount: 56
columns[key]: {key, label, symbol, type, dimensions}
lines: [{line, code, inputs, outputs, operation, formulaTex, dimensions}]
```

每个 `line` 从1开始，`code` 是实际文件中逐字相同的一行。56行脚本有40个执行行，全部有中文入门解释与对象对应；注释只帮助阅读。赋值行的 `outputs` 与左侧Julia变量名完全相同；准备、检查和显示行也有说明，不用伪造数值输出。`inputs` 只列实际依赖变量，例如qstar0依赖eta0，而不是前端自行展开的另一条表达式。

`dimensions` 是该行所有输入输出键到维度数组的映射；`["n"]` 为向量，`[]` 为标量或单个容器，其真实类型见 `columns`。两行纯模块准备没有数学公式，`formulaTex` 为null；其他公式均通过KaTeX严格解析。

前端应按 `source`、`line`、`code` 校验后显示实际源码；不可固定行号、静默丢弃说明或从注释猜测算法。`operation` 明确指出输入、逐元素运算和输出，以及何时对全体求平均。实际临床数据值仍由同一数据内核提供。

## 已完成的验证

运行：

```sh
node --test tests/zh/tmle-julia-trace.test.js
```

测试优先使用 `JULIA_BIN`；未指定时寻找现有Julia安装中的直接可执行文件，以免沙箱阻止juliaup创建配置锁。每次测试创建临时 `JULIA_DEPOT_PATH` 并清理，不安装新包；通过 `--compiled-modules=no` 避免写入用户预编译缓存。Julia不可用时运行项明确显示跳过，不把静态检查当成执行通过。

验证包含：

- 40个执行行逐字对应；源码漂移、缺行、重复和未知列会使测试失败。
- 26个向量与5个数值标量类型、维度及实际赋值输出一致；全部公式可解析。
- 实际执行默认0、+0.002、−0.002和求得的根epsilon；每次从原CSV拟合，检查5735人、1918个死亡、17列基线设计。
- 对全部5735行、全部26列与JS `tmleTrace(fit, epsilon).vectors` 跨语言核对；psi对应 `summary.estimate`，score_mean对应 `summary.score`。
- 与共享Julia `full_at` 独立核对更新风险、风险差、分数和EIF均值；以平均Bernoulli对数似然的中心差分检查分数，并比较解析负斜率。
- 逐行检查实际A选择的更新预测、严格0到1概率范围、原A/Y及初始g/Q不变；核对centred平均近零、EIF平均约等于分数平均。
- 非有限epsilon和极端epsilon导致的浮点概率端点都显式失败，不裁切到可接受范围。

当前数据的求根epsilon约为0.003576966663；对应风险差约0.089979724735，分数与经验EIF平均约−3.4×10⁻¹³。默认epsilon=0时分数平均约0.003469139307，不能把默认状态说成已经完成targeting。这些是可重新运行的核对结果，没有写进计算公式。

经验EIF平均约零是当前模型和经验分布下的数值方程，不证明每个残差为零、有限样本无偏、区间覆盖率或临床因果识别。指定基线仍省略急性病情严重程度，原队列选择与处理时间窗的边界继续适用。
