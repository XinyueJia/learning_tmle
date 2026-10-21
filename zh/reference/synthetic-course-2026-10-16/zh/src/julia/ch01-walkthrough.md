<!-- julia-guide-source core sha256=ee1c2eeb7fc8f801ebdcf69ade62c6cdc3a1ed09889602766d0542bfac324034 -->
<!-- julia-guide-source lesson sha256=7ee4701caedbb875d188d0f13cb83bc4c65bf782f092491f75d6c7f29a10662e -->

<section class="julia-guide" id="ch01-julia-guide">

### Julia零基础样板：把每一行代码放回均值公式

本节沿用刚才的RWS合成数据，目标仍是**全样本12个月终点事件风险**。我们按“输入是什么→代码怎样算→输出对应哪个符号”读一遍。所有代码行从实际运行的文件提取；下面的两次循环不是另写的一套示范算法。

#### 先运行一次，再逐行读

终端（terminal）是运行命令的窗口；Julia交互窗口通常有 `julia>` 提示符。下面这条命令在终端执行。先进入解压后同时包含 `shared/` 和 `zh/` 的项目根目录：

```text
项目根目录/
├── shared/
│   ├── data/rws-counts.csv   输入：八格人数
│   └── julia/EIFCase.jl          共享函数定义
└── zh/julia/lessons/ch01.jl      中文运行入口
```

```sh
julia --startup-file=no --history-file=no zh/julia/lessons/ch01.jl
```

`julia`是执行程序，最后一段是交给它运行的脚本路径；两个 `--…=no`分别关闭个人启动文件与历史文件，便于复算，不参与数学计算。若终端提示找不到 `julia`，先使用已安装Julia的可执行路径；完整环境说明见[Julia运行说明](case-study.html)。

按整份脚本运行；下方逐行卡片用于对照阅读，函数定义与配对的 `end`需要作为完整代码块一起执行。本节末尾保留完整函数和脚本，便于复制核对。代码、表格与终端输出较宽时可横向滑动；键盘可先聚焦对应区域，再按左右键。

<div class="julia-dataflow" aria-label="第一讲代码的数据流">
<p>计数CSV → <code>data</code> → <code>mean_if(data)</code> → <code>result</code> → <code>println</code>显示结果</p>
</div>

#### 先认清输入与符号

CSV有八行聚合频数，每行是一类(X,A,Y)记录；人数加起来才是200。`data.cells`是保存这八格的向量；循环里的 `cell`只是当前一格。X与A保留在输入中用于区分格子，本讲暂不按它们调整风险。

| 数学符号 | Julia里的对应写法 | 当前含义与单位 |
| --- | --- | --- |
| $N$ | `data.n`、`total_people` | 总人数200；单位为人 |
| $j$ | 当前循环走到的格序号 | 1到8，不是患者编号，也不是Y标签 |
| $n_j$ | `cell.n` | 该格人数，例如24或56；单位为人 |
| $y_j$ | `cell.y` | 该格复合终点标签，0或1 |
| $M=\sum_j n_jy_j$ | `events` | 发生终点事件的总人数116 |
| $\widehat\mu=M/N$ | `risk`、`result.risk` | 经验终点事件风险0.58 |
| $p_j=n_j/N$ | `probability` | 当前格占全部记录的比例，八格相加为1 |
| $D_j=y_j-\widehat\mu$ | `influence`、`result.values[j]` | 当前格的均值影响值；单位为概率差/单位替换比例 |
| $\sum_jp_jD_j$ | `weighted_mean`、`result.mean` | 影响值的经验概率加权平均，数学上为0 |

> **符号回看：** 代码里的 `data.n`是大写N的总人数，`cell.n`是带下标的每格人数；`result.mean`是影响值平均，`result.risk`才是终点事件均值。**这一步：** 相同结局的一格可代表很多人，求和必须保留人数权重；点号是从数据结构取字段，不是小数点或乘号。

Julia向量的第一个元素使用索引（index）1。因此 `result.values[1]`对应第一格的影响值；Y=0是结局标签，不能据此把它当作 `values[0]`来取。读取工具按X、A、Y整理格子，表里的j和结果向量都沿用这个顺序。

#### 走进函数：先把发生终点事件的人数加起来

数学上，第一次循环先计算事件人数的总和，再除以总人数：

$$
M=\sum_{j=1}^{8}n_jy_j,\qquad
\widehat\mu=\frac{M}{N}=\frac{116}{200}=0.58.
$$

> **符号回看：** j遍历八格，$n_j$是格人数，$y_j$是0/1标签，M是总终点事件人数，N是总人数。**这一步：** 每格先乘人数与标签，再相加，最后除以总人数；这与把200个人的Y相加后取平均相同。

<!-- julia-line core:1 -->
行首的 `#` 表示注释（comment），供人阅读。Julia执行时忽略这段文字；它不读取数据，也不产生数值。
<!-- /julia-line -->

<!-- julia-line core:2 -->
`function`开始定义函数（function）；`mean_if`是函数名，括号里的 `data` 是输入参数（parameter）。此时只是说明“给我数据以后按这些步骤计算”，尚未执行循环；入口脚本稍后调用 `mean_if(data)` 才会开始计算。
<!-- /julia-line -->

<!-- julia-line core:3 -->
从输入记录的 `n` 字段取出总人数，存入变量（variable）`total_people`。点号 `.` 表示取字段（field），`=`表示赋值（assignment）：先算右边，再把结果存到左边；这里是把数学里的 $N=200$ 保存下来。
<!-- /julia-line -->

<!-- julia-line core:4 -->
新建变量 `events`，先存0，准备累计发生终点事件的人数。循环随后逐项累加人数；每次调用函数都会从0重新开始。
<!-- /julia-line -->

<!-- julia-line core:5 -->
`for … in …`开始循环（loop）：依次从 `data.cells` 取出一格，暂时叫 `cell`。这张表有八格，所以循环八次；一格可能代表24人或56人，不是只代表一个人。
<!-- /julia-line -->

<!-- julia-line core:6 -->
读旧的 `events`，加上这一格的 `cell.n * cell.y`，再覆盖左边的变量。`*`是乘法；`cell.n`是 $n_j$，`cell.y`是 $y_j$。这一步是 $M_{\mathrm{new}}=M_{\mathrm{old}}+n_jy_j$：未发生终点事件格乘0，发生终点事件格乘1；第一次加 $24\times0=0$，第二次加 $56\times1=56$。
<!-- /julia-line -->

<!-- julia-line core:7 -->
这个 `end` 结束第一段 `for` 循环。八格都处理完才继续下一行；此时 `events` 已是116。它还没有结束整个函数，因为外层 `function` 的代码仍在继续。
<!-- /julia-line -->

<!-- julia-line core:8 -->
`/`表示除法；用累计终点事件人数除以总人数，存入 `risk`。对应 $\widehat\mu=M/N=116/200=0.58$。这是全样本观察终点事件风险，不是因果风险差，也不是已知真总体风险。
<!-- /julia-line -->

把循环每次增加多少、累计到多少列出来，就能看见求和符号怎样变成实际执行：

<!-- julia-trace events -->

> **符号回看：** 表中j是格序号，$n_jy_j$是本次新增终点事件人数，“累计”是执行本格之后的 `events`。**这一步：** 第1格24人均为Y=0，增加0；第2格56人均为Y=1，增加56；直到第8格完成，累计116，再除以200。

#### 第二次循环：减去同一个均值，再按概率平均

数学上，第二次循环计算每格的影响值，再求其概率加权平均：

$$
D_j=y_j-\widehat\mu,\qquad
m=\sum_{j=1}^{8}p_jD_j
=\sum_{j=1}^{8}\frac{n_j}{N}(y_j-\widehat\mu)=0.
$$

> **符号回看：** $\widehat\mu=0.58$在这次循环中固定，$D_j$随该格Y改变；$p_j$是人数比例，m是影响值平均。**这一步：** 每个Y先减同一中心，再乘自己的概率权重相加；不是每个D都等于0，也不是八格等权平均。

<!-- julia-line core:9 -->
`Float64[]`建立一个空向量（vector），先没有元素，准备按格保存小数影响值。`Float64`是Julia常用的双精度浮点数（floating-point number）类型；`[]`在这里表示空容器。`values`最终有八项，不是200项，也不是八个概率。
<!-- /julia-line -->

<!-- julia-line core:10 -->
把累计加权平均的变量 `weighted_mean` 从小数0.0开始。它与 `risk` 保存不同的计算结果：`risk`是结局均值，`weighted_mean`将累计影响值的概率加权平均。
<!-- /julia-line -->

<!-- julia-line core:11 -->
开始第二次遍历同一组八格。每次又取出一格叫 `cell`；第一段循环没有删除或改写这些输入记录，人数和结局都保持原样。
<!-- /julia-line -->

<!-- julia-line core:12 -->
取这一格的结局值减去已经算好的同一个 `risk`，存入 `influence`。对应 $D_j=y_j-\widehat\mu$：y为0得到−0.58，y为1得到约0.42。循环中中心 $\widehat\mu$ 固定，不会给每格另算一个均值。
<!-- /julia-line -->

<!-- julia-line core:13 -->
`push!`把当前 `influence` 加到 `values` 的末尾。感叹号 `!` 是Julia命名惯例，提醒该函数会修改传入的容器；这里修改本次新建的输出向量，不是对数字求阶乘，也不改变CSV。依次保存后，第j项就对应第j格。
<!-- /julia-line -->

<!-- julia-line core:14 -->
用该格人数除以总人数，算出本次所用的概率权重，存入 `probability`。对应 $p_j=n_j/N$；例如56人那格权重为 $56/200=0.28$。人数已经放进这个权重，不需要再乘一次56。
<!-- /julia-line -->

<!-- julia-line core:15 -->
把本格的 `probability * influence` 加进累计变量。对应 $m_{\mathrm{new}}=m_{\mathrm{old}}+p_jD_j$；这是“每格影响值乘该格概率后相加”，不是把八个影响值等权平均。
<!-- /julia-line -->

<!-- julia-line core:16 -->
这个 `end` 结束第二段 `for`。此时 `values`已保存八格影响值，`weighted_mean`已累计全部八格的贡献；还没有执行返回。
<!-- /julia-line -->

<!-- julia-line core:17 -->
`return`把结果交还给调用处。圆括号中的结构叫命名元组（named tuple），有三个字段：`risk`、`values`、`mean`。例如 `risk=risk` 中，左边是返回字段的名称，右边是刚算好的变量；`mean=weighted_mean`把影响值的加权平均放入 `mean` 字段。这里没有打印屏幕输出。
<!-- /julia-line -->

<!-- julia-line core:18 -->
最后这个 `end` 结束整个 `function` 定义。它与第2行的 `function`配对；前两个 `end`分别与两段 `for`配对。代码缩进用于帮助阅读，结束哪个代码块由这些关键词决定。
<!-- /julia-line -->

下面两类输出分开保存：`values`保留**每格的D**，`mean`只保留**全部加权贡献的和**。一次循环执行到结尾，才同时得到完整的一列值和一个总平均。

<!-- julia-trace influence -->

> **符号回看：** $p_j$是概率，$D_j$是影响值，$p_jD_j$是对加权平均的贡献；表中数值显示至6位小数。**这一步：** 例如第2格的概率0.28乘影响值0.42，贡献0.1176；人数已包含在0.28中，不再额外乘56。最后的0.000000是显示精度下的结果，下面脚本也会打印未舍入值。

#### 返回入口脚本：输入文件、调用函数、显示结果

刚才读的是“函数怎样定义”。现在回到 `ch01.jl`，看它如何把实际输入交给该函数。下列行号属于入口脚本，重新从第1行开始；空行只负责分段，没有计算作用。

<!-- julia-line lesson:1 -->
这行是脚本注释，说明接下来先准备输入，再调用函数。它不参与均值计算。
<!-- /julia-line -->

<!-- julia-line lesson:2 -->
`include`读取并执行另一个Julia文件；这里载入 `EIFCase.jl`中提供的函数定义。`joinpath`把目录片段连接成文件路径，双引号中的内容是字符串（string）。`@__DIR__`读作“这份脚本所在的目录”，`..`表示上一级：从 `zh/julia/lessons/`连续上溯三次，依次到 `zh/julia/`、`zh/`、项目根目录，再进入 `shared/julia/`找到模块文件。这里还没有对患者结局求平均。
<!-- /julia-line -->

<!-- julia-line lesson:3 -->
`using .EIFCase`让当前脚本可以使用刚载入模块（module）公开的函数名，例如 `case_data`和 `mean_if`。模块相当于把一组函数组织在同一个名称下；前置点号表示当前已载入的本地模块，与 `data.n`中“取字段”的点号用途不同。
<!-- /julia-line -->

<!-- julia-line lesson:5 -->
连接CSV的文件路径，存为字符串 `data_file`。从 `zh/julia/lessons/`上溯三级，依次到 `zh/julia/`、`zh/`和项目根目录，再进入 `shared/data/`。这个变量里是文件位置，不是200条数值；因为起点用 `@__DIR__`，从别的工作目录启动这份脚本也能定位同一输入。
<!-- /julia-line -->

<!-- julia-line lesson:6 -->
调用已经提供的数据读取工具 `case_data`：输入是CSV路径，输出是一份带字段的数据结构，存入 `data`。它检查八格计数并整理成 `data.n`与 `data.cells`等字段。本讲只使用总人数及每格人数/结局，计算公式就在前面的 `mean_if`里；组内机制的整理留第3讲。
<!-- /julia-line -->

<!-- julia-line lesson:7 -->
这是函数调用（function call），与前面的函数定义不同：现在把刚读好的 `data`交给 `mean_if`，实际执行两次循环；将返回的三个字段保存为 `result`。计算完成后，可以读 `result.risk`、`result.values`、`result.mean`。
<!-- /julia-line -->

<!-- julia-line lesson:9 -->
`println`将括号里的内容依次显示在屏幕上，再换行。双引号内是文字标签，逗号用于分隔要显示的内容；`data.n`提供200这个数。打印不改变数据，也不重新计算影响函数。
<!-- /julia-line -->

<!-- julia-line lesson:10 -->
先取返回结果中的 `risk` 字段，再在标签后显示0.58。`result.risk`对应 $\widehat\mu$；这里读的是已经算好的结果，不是再调用一次均值函数。
<!-- /julia-line -->

<!-- julia-line lesson:11 -->
`0:1`是包含两端的整数范围，即0和1；这段循环运行两次，依次把 `y`设为0、1。它列出两个可能结局，不是在重新遍历患者，也不是Julia数组的索引范围。
<!-- /julia-line -->

<!-- julia-line lesson:12 -->
在屏幕演示的小循环里，再用 $y-\widehat\mu$算两个可能的影响值。`y`是本次选定的0或1；这里的局部演示不修改 `result.values`。两段循环中同名的 `influence`服务于各自计算，不会使CSV里的Y改变。
<!-- /julia-line -->

<!-- julia-line lesson:13 -->
先用 `round(influence; digits=6)`给显示值保留小数点后至多6位，再交给 `println`。分号 `;`把普通输入与命名参数（keyword argument）分开；`digits=6`指定保留的小数位，而不是除以6。舍入只产生用于本次打印的新数，不覆盖原影响值。
<!-- /julia-line -->

<!-- julia-line lesson:14 -->
这个 `end`结束 `for y in 0:1`，两个结局值都已打印。上面的函数代码块和当前脚本循环分别闭合；后面的打印仍会执行。
<!-- /julia-line -->

<!-- julia-line lesson:15 -->
显示 `result.mean`保存的原始浮点结果，即 $\sum_jp_jD_j$的机器计算值。它不是 `result.risk`，也不是八个D的普通平均；当前输出接近0的小数误差应与后面的实数恒等式一起解释。
<!-- /julia-line -->

<!-- julia-line lesson:16 -->
另外打印一次舍入后的影响值平均，方便阅读；它会显示0.0。原始 `result.mean`保留不变，所以读者可以同时核对舍入前后，不能仅凭这一行的0.0认定任意函数都是IF。
<!-- /julia-line -->

三个返回字段可这样读：

| 读取结果 | 得到什么 | 用来核对什么 |
| --- | --- | --- |
| `result.risk` | 0.58这个数 | 是否等于116/200 |
| `result.values` | 按八格排列的8项向量 | 每项是否为该格Y减0.58 |
| `result.mean` | 接近0的浮点数 | 是否按人数比例累计了影响值 |

`=`在普通语句中是存值的动作，数学公式的等号则陈述关系；例如 `weighted_mean = weighted_mean + …`读作“先读旧值，再存新值”，不是声称同一个数等于自身加上非零数。

#### 核对实际输出，也解释最后的小数误差

以下为当前脚本实际运行的输出；自动测试会重新运行脚本，核对这份输出记录。

<!-- julia-output -->

前两行给出输入规模与终点事件均值；中间两行列出两个可能结局的影响值。`6.938893903907228e-17`是科学记数法（scientific notation），表示约 $6.94\times10^{-17}$，与0的差只有约0.0000000000000000694。它来自二进制浮点数存储、乘法和加法的有限精度；不是某位患者的效应，也不是已经测得的统计偏差。

实数运算下，按本章已经证明的关系，$\sum_jp_j(y_j-\widehat\mu)=\widehat\mu-\widehat\mu\sum_jp_j=0$。机器输出用接近零来核对这条关系；最后一行的 `round`只是显示舍入，没有修复或改写原始函数值。均值零仍不足以单独证明一个候选是IF，本章先从目标变化率得到 $y-\mu$，再检验它的中心化。

**先预测，再核对一格。** 第2格有56人、Y=1。它的 `probability`、`influence`和对 `weighted_mean`的贡献各是多少？三者是否能互换？

<details><summary>答案：概率、影响值、贡献是三个对象</summary>

`probability`是 $56/200=0.28$；`influence`是 $1-0.58=0.42$；贡献是 $0.28\times0.42=0.1176$。0.28是记录频率，0.42是每单位替换比例的均值变化率，0.1176是该格对加权平均的贡献。将替换比例取1%时，实际均值变化还需乘0.01，成为0.0042，即0.42个百分点。

</details>

**再预测一个错误。** 如果把 `result.values`里的八项直接相加再除以8，会不会也得到0？

<details><summary>答案：八格不是八个等权的人</summary>

八格中四格Y=0、四格Y=1，等权平均为 $\{4(-0.58)+4(0.42)\}/8=-0.08$。这样做忽略了每格代表的人数不同；正确加权用84个无终点事件者和116个发生终点事件者的比例，才中心化到0。程序遍历八格是为了节省重复计算，数学上仍是在对200条记录平均。

</details>

本节可带走的程序对象是 `result.risk`、`result.values`、`result.mean`。它们只回答均值及其敏感性；下一讲继续用同一输入，解释一格增权时其余概率怎样变化。运行所需的完整函数与入口脚本保留在下面，可与32张逐行卡片相互核对。

</section>
