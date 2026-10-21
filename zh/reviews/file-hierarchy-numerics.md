# 文件层级迁移：独立数值与Julia路径审计

日期：2026-10-15。**结论：本次指定的共享数值文件保留与Julia新路径运行审计通过，无未关闭项。**仅编辑本记录，未修改实现、数据或其他审查。迁移前已独立读取原VERIFICATION及加载路径并保留校验值；迁移后以`/private/tmp/eif-hierarchy-baseline-20261015`快照、新源码和dist三方实际比较，不以root构建成功代替本次验证。

## 共享内核与数据逐字保留

以下每项均已实际读取字节并断言“迁移前文件＝新共享文件＝dist对应共享文件”；不仅比较文件名或最终数值。相对路径均以当前项目根目录为起点。

| 原位置 | 新源码位置（dist内同名路径） | SHA256 |
| --- | --- | --- |
| src/math.js | shared/js/math.js | 7aaf48a2d6ca654c6d14308c2fd3d0daae2860644efca8030a69a3ab01cbbdc5 |
| src/case-study.js | shared/js/case-study.js | a9bd518a4022a07e28a5905efdecaa3a7324510b7b6076502e69938cb54ccf76 |
| julia/EIFCase.jl | shared/julia/EIFCase.jl | f3438d7d9a0f4b483f77b2531ca3c119183110213a8d84a7b1da1a90ac837462 |
| case-study/followup-counts.csv | shared/data/followup-counts.csv | 300d0c5e36dc7556e73257af186b87ccc6ff66af14411418947ef7b800bda2bf |
| case-study/followup-records.csv | shared/data/followup-records.csv | 99b2315d1b39974d1669f7b916faf7a47459d07ddf967d9012dd0a2d67fdeeff |

因此数学定义、参数/概率、固定200条合成记录、CH01两循环及其余Julia计算本身未随迁移改变。两个JS文件仍相邻，case-study的`./math.js`相对导入无需修改；本次实际导入新源码及dist模块均成功。

## 八讲入口、runner及测试加载路径

对8份lesson和run_case逐行作实际diff：全部变化只发生在`joinpath(@__DIR__, …)`的模块加载或默认CSV定位语句。八讲均从`zh/julia/lessons/`上溯到根目录的shared/julia及shared/data；runner从`zh/julia/`上溯到同一共享目录。计算、输出、手动二分循环、停止条件、返回字段和打印格式均逐字保留。九份新源码入口与`dist/zh/julia/`对应文件也逐字相等。

第一讲ch01-output.txt在快照、新源码和dist三方逐字相同。`tests/julia/runtests.jl`与原suite的实际diff只有5处路径定位：模块include、CSV、单独读取模块源码、第一讲lesson及输出fixture；原数值断言和测试逻辑未改变。本文不将这些路径检查称为重新运行全套suite。

`@__DIR__`以脚本位置为起点，故这些默认路径不依赖调用者工作目录。显式传入CSV参数仍按调用者给定的文件路径读取；本次另以绝对路径临时CSV验证了这一接口，未偷改为固定默认数据。

## 独立真实运行

本审查者实际使用既有Julia 1.12.5真实二进制，`--startup-file=no --history-file=no`、临时depot，所有进程工作目录均为`/private/tmp`：

- 快照旧路径的8份lesson、新源码`zh/julia/lessons/`的8份lesson、`dist/zh/julia/lessons/`的8份lesson，共24个新进程全部exit0。每一讲三方stdout逐字相等。
- 快照、新源码及dist的run_case默认运行共3个新进程全部exit0，三方完整机器可读stdout逐字相等。新旧路径确实读取到共享模块/数据，而非依赖当前目录的旧文件。
- 第一讲stdout另与实际保留fixture逐字核对，风险.58、两类影响值−.58/.42、原始加权平均6.938893903907228e−17与round后0.0均保留。
- runner解析后另按先前从观察计数独立建立的参考值核对：N200、风险.58、初始目标−.04、score0=.24、epsilon=.16223923963495762、更新目标.20、中心方差1.2192623957849897、SE .07807888305377421及converged=1，容限10^−11内通过。
- 用临时CSV把八格计数改为[27,53,4,16,16,4,40,40]，从/tmp分别运行新源码及dist的runner，均exit0且stdout逐字相同；目标.21875、epsilon=.15405689316121896符合既有独立参考，排除了新路径静默读取固定默认表的情况。

另实际导入`shared/js/case-study.js`与`dist/shared/js/case-study.js`，对默认风险、目标、根、更新方差/SE和上述改计数目标/根执行独立临时断言，均通过。这是数值模块导入/执行验证，不是浏览器UI操作。

## 结论范围

此次仅改变目录及相对路径，指定共享内核和数据逐字保留，8讲源码与dist的Julia运行行为亦逐字保留。先前独立数学审查对均值与ATE区分、经验分布/拟合分布、投影假设模型、错误Q与经验SE、score归零不证明无偏/有效推断等结论不因本次迁移扩大或削弱。

**指定数值迁移审计已关闭，无需修订。**未由本审查者运行全套Julia/JS suite、真实浏览器、release打包或解压副本测试；root正在执行的这些工作及其结果须以root的实际记录为准。本记录不替代正文链接、界面和发布包的另项验收。
