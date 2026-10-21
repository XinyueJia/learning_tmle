# 了解RHC案例并运行分析代码


本教程采用5735名真实重症患者的公开观察性记录。第1—8讲均读取这份原CSV；第8讲既有根据分组计数手算，也有同一患者的多变量logistic拟合及手动TMLE。

## 查阅原始研究与数据来源

Connors AF Jr et al. (1996), *The effectiveness of right heart catheterization in the initial care of critically ill patients*. JAMA 276:889–897。[原研究记录](https://pubmed.ncbi.nlm.nih.gov/8782638/)；[官方介绍](https://hbiostat.org/data/repo/rhc.html)；[官方变量字典](https://hbiostat.org/data/repo/crhc)；[数据仓库使用许可](https://hbiostat.org/data/)。仓库允许带研究引文及Vanderbilt致谢使用；这是仓库许可，不冒称CC BY。

[下载未改动的原始CSV](../shared/data/public/rhc/source.csv) · [获取时间、哈希、许可证据与核查结果](../shared/data/public/rhc/provenance.json) · [来源说明](../shared/data/public/rhc/README.md)。原文件2320412字节，SHA-256为`9ef4ab578be4b40ad5d97d3a7e08ffdc1f9f76aeeefee51b4996e4221556f8e8`。保留全部5735行，不删人、不插补、不重采样。

## 如何定义处理与30日死亡？

- 首次符合SUPPORT入组标准为研究时间零点，`swang1`表示首24小时RHC：2184人RHC，3551人未RHC。
- `dth30`表示30日死亡：1918人Yes，3817人No。原论文明确全体死亡日期或180日存活已确认，结局来源包括临床记录和死亡登记。
- 原始研究入组日期与死亡日期重算30日状态，在5735行中与发布值全部一致；第30天死亡共26例，计入事件。
- `lstctdte`不是生命状态查明的唯一来源。11条No记录的该日期早于30日，不据此将已发布的完整生命状态改成删失。日期原点1960-01-01由官方R元数据确认，而非猜测。

## 分析方案与因果解释需要哪些条件？

比较首24小时RHC与未RHC的30日死亡风险标准化差。先用X=原始sex分层；第8讲将W扩展为sex、年龄、race及12项既往病史。g由这些变量预测实际RHC，Q由相同变量加A预测死亡；两者均为无正则化、带截距的主效应logistic回归。年龄用全样本均值及以n为分母的标准差标准化，race以white为参考列。原列名及系数在第8讲网页和Julia输出中可核对。没有静默截断g或改变目标人群。

原研究排除48小时内死亡或出院者，并以24小时窗分类RHC。这不是全体新ICU入院者的无偏目标试验。性别标准化只是观察关联；多变量模型也没有证明无未测混杂。急性病情强烈影响导管选择，但首日最异常生理值可能发生在操作之后，因此本教学的保守基线集合不把这些列无条件称为处理前变量。对临床因果ATE的解释仍依赖充分调整、选择、处理版本和时间对齐等实质假设。

这些限制不阻止定义统计泛函、拟合模型、构造EIF、手动解TMLE方程及复算结果；它们决定了结果能作何种因果解释。实际计算与这些解释条件都属于完整因果分析教学，不能将方程求根成功当作研究设计已通过。

## 各章如何使用这份患者记录？

| 讲次 | 从真实记录得到的成果 |
| --- | --- |
| 1 | 1918/5735的观察死亡风险，逐人Y减均值 |
| 2 | 同一联合频数表的点方向、h、score和配对 |
| 3 | 从真实人数拟合p(X)、g、Q及初始Q |
| 4 | 从商式推导EIF，再计算初始加权残差 |
| 5 | 八个点方向和七个独立方向的直接差分核对 |
| 6 | 五维已知g假设模型的实际投影，与七维观察模型区分 |
| 7 | 同一函数的经验平均、二阶矩、方差及估计误差桥梁 |
| 8 | 根据分组计数手算TMLE，再扩展指定基线变量，对同一5735人手动targeting |

[开始第一讲](index.html#chapter-1) · [前往第八讲](index.html#chapter-8) · [查看Julia模块](../shared/julia/RHCCase.jl) · [完整运行脚本](julia/rhc_case.jl)。运行命令：

```sh
julia --startup-file=no --history-file=no zh/julia/rhc_lessons/ch01.jl
julia --startup-file=no --history-file=no zh/julia/rhc_lessons/ch08.jl
julia --startup-file=no --history-file=no zh/julia/rhc_case.jl
julia --startup-file=no --history-file=no tests/julia/rhc-tests.jl
```
