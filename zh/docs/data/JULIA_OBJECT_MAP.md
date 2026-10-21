# Julia、数学与图中对象的对应

`zh/src/julia/object-map.json` 是第 0、1 章可视化样板的声明式对应表，不保存另一份计算答案。正文和代码卡片应使用其中的 `operation`、`formulaTex`、`inputs`、`outputs`，数值仍由真实 RHC 数据内核计算。当前冻结队列为 5735 人、1918 个 30 日死亡；这两个核对数不会替代逐行读取。

## 文件接口

- `version` 为对应表结构版本，当前是 1。
- `objects[id]` 给出稳定语义 ID、中文名称 `label`、Julia 写法 `julia`、真实或明确标记的概念性 `type`、维度 `dimensions`、用途 `role` 和就地解释 `dimensionText`。
- `dimensions: []` 表示标量或单个容器，不会把容器里的字段误画成该容器自身的维度；`["n"]` 表示逐人向量；`["n",17]` 表示实际设计矩阵。八格容器通过 `nestedDimensions.cells: [8]` 表明它包含八项向量。
- `chapters.ch01.source` 指向不作改写的真实 32 行脚本；`lines` 对每一个非空、非注释行提供一条记录。`line` 从 1 开始，`code` 与该行源文件完全相同。
- 每条记录的 `inputs`、`outputs` 是对象 ID 数组；`mathIds` 是 `allowedMathIds` 中的数学作用 ID，并不是全书公式编号。`formulaTex` 是可交给 KaTeX 的实际公式；没有数学计算的模块载入行使用 `null`。
- `operation` 是面向没有 Julia 基础的逐行说明。`kind` 区分载入、读取、编码、提取、汇总、除法、逐元素运算、检查和显示；第 19 行另有 `broadcast`，明确一个向量与一个标量怎样得到一个向量。

`raw-records` 实际为长度 n 的字典向量，每个字典保留 63 个原始字符串字段。图中可以用 n×63 表格表示其内容，但它的 Julia 类型不是矩阵；`tableDimensions` 与 `dimensions` 因此分开保存。

## 第一讲的对象流

| 实际行 | 输入 → 输出 | 该行做什么 |
| --- | --- | --- |
| 3、5 | 模块文件 → 模块、可调用名称与原始路径 | 准备读取函数，不计算均值 |
| 7 | `source-path` → `raw-records` | 读取原始患者行 |
| 9 | `raw-records` → `observations` | 原顺序编码 x、a、y |
| 11 | `observations` → `sample-size` | n 条记录收缩为一个人数整数 |
| 13 | `observations` → `outcomes` | 从每条记录取 y，得到 n 项整数向量 |
| 15 | `outcomes` → `events` | 对 0/1 求和，得到死亡人数 |
| 17 | `events`、`sample-size` → `risk` | 人数相除，得到一个死亡比例标量 |
| 19 | `outcomes`、`risk` → `influence` | `.-` 将同一个均值从每项 Y 中减去，仍是 n 项 |
| 21 | `influence`、`sample-size` → `mean-influence` | 先求和再除以 n，得到一个影响值平均标量 |
| 23 | `source-path` → `coarse-data` | 重新读取同一原始队列并数成八格 |
| 25 | `coarse-data` → `mean-check` 及其字段 | 依人数权重独立核对逐人算法 |
| 27 | 两个风险与逐人影响值平均 → `assertion-result` | 近似风险一致、逐人平均绝对值低于容差时继续 |
| 28–31 | 已有数值 → `terminal-output` | 显示人数、风险、两个结局标签的影响值及两种平均 |

`risk` 与 `mean-influence` 都是标量，含义和公式不同。`check.values` 有 8 项，每项代表一格；`influence` 有 n 项，每项代表一位患者。八格的等权平均不会代替按人数加权。原断言实际检查 `check.risk` 与 `risk` 接近，并检查 `mean_influence` 的绝对值；它没有直接检查 `check.mean`，对应说明保留这个精确范围。

`println` 的输出对象表示终端文本这一副作用。函数返回 `Nothing`；逗号分隔标签和值。第 30 行算出两种可能结局的影响值，仅用于显示，不会生成患者预测或重新遍历队列。第 31 行分开标记逐人平均与八格加权平均。

## 第 0 章的三个代码片段

`chapters.ch00.excerpts` 包含：

1. `read-raw`：真实第一讲第 7 行，读取原始 CSV。
2. `aggregate-eight-cells`：真实第一讲第 23 行，将同一记录聚合成八格。
3. `initial-models`：明确标记为 `runnable-api-example` 的可运行 API 调用示例。它调用已导出的 `prepare_full(rows)`，读取返回的 `fit.g`、`fit.q0`、`fit.q1`，再由实际 `fit.a` 逐行选出 `qa`。

第三个例子是新写的调用方式，`source` 为 `null`，不会冒充实际文件中的连续片段。`sourceReferences` 则逐字保存真实 `prepare_full` 的设计与预测定义，以及 `full_at` 中同一选择运算的来源行。使用前先运行 `include`、`using` 和 `read-raw`。测试会直接执行这些代码，检查其输入输出尺寸和实际 A 的逐行选择。

这里使用 `prepare_full`，因为 `full_analysis` 内部还会调用 `solve_full` 完成 targeting；为了画“初始拟合”而调用 `full_analysis(...).fit` 会提前执行 TMLE。

| 对象 ID | 实际大小 | 区别 |
| --- | --- | --- |
| `baseline-w` | n×15 个原始基线变量 | sex、age、race 和 12 项既往史，是概念上的变量表 |
| `design-matrix` | n×17 个浮点设计列 | 包含截距；race 展开为两个指示列，age 使用分母 n 的标准差标准化 |
| Q 拟合输入 | n×18 | 在上述设计矩阵后加入实际 A |
| `treatment-vector`、`outcome-vector` | 各 n 项浮点数 | 实际 A、实际 Y，取值仍为 0/1；第一讲 `outcomes` 使用整数类型 |
| `propensity` | n 项概率 | 初始接受 RHC 的拟合概率 |
| `q0`、`q1` | 各 n 项概率 | 同一 W 不变，预测输入 A 分别设全 0、全 1 |
| `qa` | n 项概率 | 用实际 A 为每位患者选一臂预测 |
| `risk-difference` | n 项概率差 | 两臂逐人相减；跨人取平均之后才成为一个标准化风险差 |

这些初始模型对象不是未知总体机制，也不证明当前基线变量足以支持因果解释。第一讲仍只计算全队列描述性死亡均值。

## 验证与维护

运行 `node --test tests/zh/julia-object-map.test.js`。若 `julia` 启动器不能在当前沙箱内写配置锁，可通过 `JULIA_BIN` 指定已经安装的 Julia 可执行文件，不需要改写脚本或安装新环境。

测试核对 32 行源文件及全部 17 个实际执行行、逐字代码与来源片段、对象引用、维度与类型、标量/向量和输入/输出区别、有效 KaTeX、打印标签的含义，以及初始拟合例子确实仅使用初始 API。Julia 可用时还会对真实 CSV 实际运行例子，核对 5735×17 的设计、1918 个死亡与每一行 qa 的选择。Julia 不可用时该项明确显示为跳过，静态检查仍执行。

源文件调整后须同时检查解释是否仍准确；测试失败不能仅靠复制新代码字符串消除。对应表不修改完整第一讲脚本，不维护另一套患者、模型算法或统计答案。
