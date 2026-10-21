# R工作簿：同一RHC数据，从均值IF到手动TMLE

网页中第0章的对象图固定使用数学对象，第1章可选择“数学对象 / Julia运算 / R运算”。第0章工作簿的语言选择独立于对象图。各章“本章代码语言”可切换完整工作簿和逐行解释；第8章还可切换每一步的代码，公式符号、患者表列与R变量同步高亮。切换语言时使用相同的数据、维度和统计目标。

所有R代码使用base R，测试版本为R 4.5.2。网页展示对应代码；在本地R中运行工作簿，可复现其运算。保留项目的`zh/`与`shared/`目录关系，原始数据位于`shared/data/public/rhc/source.csv`。

在项目根目录的终端运行：

```sh
Rscript --vanilla zh/R/ch01.R
Rscript --vanilla zh/R/ch08.R
```

也可在项目根目录的R会话中运行：

```r
source("zh/R/ch01.R")
```

`source`读取并顺序执行保存的脚本。工作簿先载入共享函数，再读取原CSV；`<-`保存计算结果，`$`取出列或列表成员。R的`*`、`+`、`-`与`/`对同长向量逐项计算，`%*%`进行矩阵乘法，`sum`与`mean`将整列汇总。第一讲的网页解释逐行对应输入、输出、维度和数学式。

| 文件 | 本讲完成的运算 |
| --- | --- |
| ch00.R | 初始Q/g、设计矩阵、同一W的三种预测、标准化 |
| ch01.R | 死亡均值、概率替换、差商、IF、中心化与生存补集 |
| ch02.R | 概率方向、路径score、均值导数与配对 |
| ch03.R | 三机制、条件风险、初始拟合与共同标准化权重 |
| ch04.R | 逆概率权重、残差、初始梯度贡献 |
| ch05.R | 所有有限独立方向与梯度配对核对 |
| ch06.R | 五维模型的加权投影与范数分解 |
| ch07.R | 两套函数的经验矩、方差和标准误 |
| ch08.R | 按sex分层与多变量基线的手动二分、AIPW及TMLE |
| tmle_trace.R | 同一患者表逐列生成offset、H、ε、更新风险和EIF |

`tmle_trace.R`默认使用ε=0。试算其他幅度时，在R会话中：

```r
Sys.setenv(TMLE_EPSILON = "0.003")
source("zh/R/tmle_trace.R")
Sys.unsetenv("TMLE_EPSILON")
```

`Sys.setenv`将字符串作为本次试算的输入；脚本将它转成共用的数值标量ε。第8讲的`ch08.R`另外逐步打印二分中点、score和收敛结果。研究方案与识别条件见第0章；经验方差用于推断的条件见第7、8章。

共享计算定义在`shared/R/EIFCase.R`和`shared/R/RHCCase.R`，覆盖有限离散分布的代数、原始CSV读取、显式Newton回归与logistic targeting。正文读取的是实际脚本；`zh/src/R/`记录每个执行行的公式、输入、输出和解释，构建时校验源码对应关系。

从项目根目录核验：

```sh
Rscript --vanilla tests/R/kernel-tests.R
sh scripts/node.sh tests/r-cross-language.cjs
sh scripts/node.sh tests/zh/r-parallel-browser.cjs
```

语言语法参考[R官方入门手册](https://stat.ethz.ch/CRAN/doc/manuals/r-release/R-intro.html)、[向量算术](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Arithmetic.html)及[矩阵乘法](https://www.stat.math.ethz.ch/R-manual/R-devel/library/base/html/matmult.html)。
