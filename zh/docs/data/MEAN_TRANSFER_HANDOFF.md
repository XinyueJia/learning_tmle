# 第0章§4：均值的概率转移接口

```js
import {meanTransfer} from '../../../shared/js/mean-transfer.js';
const transfer = meanTransfer(data.Y, delta);
```

`data.Y`直接取既有`objectLessonData`的完整真实结局向量，或使用`readRhc(source).map(row => row.y)`而无需拟合。必须传所有人的数值0/1，不能只传前6行、拟合概率或模拟结果。纯函数不读文件、不舍入、不改写输入；`outcomes`是保持原顺序的独立副本。

这项预览的目标临时为均值`E_PY`，基点为完整经验结局边缘分布`P_n,Y`，不是ATE，也不声称知道`P0`。`delta`是从`Y=0`支持点移到`Y=1`支持点的概率质量，可以为负；负值表示反方向。改变的是支持点权重，原患者的`Y`不改变，也不制造新患者。概率差乘100才是百分点，不能将`n*delta`当成实际改结局的人数。

| 字段 | 含义 |
| --- | --- |
| `n,events` | 完整输入人数、事件人数；`n`不表示支持点个数 |
| `outcomes` | 完整原始Y的独立副本 |
| `support,counts` | `[0,1]`及`[n-events,events]`，两行按结局支持点对齐 |
| `delta,allowed` | 原样保留的转移量及合法范围`[-p1,p0]` |
| `baseP,changedP` | `[p0,p1]`及`[p0-delta,p1+delta]` |
| `baseMean,changedMean` | `events/n`及新概率对`[0,1]`加权的均值 |
| `exactChange` | `changedMean-baseMean`，独立于IF配对路线计算 |
| `directionWeights` | `[-delta,delta]`，是有正有负、总和为0的概率改变量，不是概率分布 |
| `fixedInfluence` | `[-baseMean,1-baseMean]`，始终使用旧基点的D |
| `weightedTerms` | `[-delta*D0,delta*D1]`，两项都保留符号 |
| `pairedChange` | `sum(weightedTerms)` |
| `baseProbabilitySum,changedProbabilitySum` | 两个概率向量各自的未舍入总和 |

旧函数固定为`D(y;P)=y-baseMean`；不能随着滑块把它重新中心化成`y-changedMean`。对本均值任务，`exactChange=pairedChange=delta`，等号来自均值对概率的线性，数学上是精确关系，计算机中可能有小量浮点误差。这不能推广成ATE或所有估计量/路径的有限变化都精确等于IF配对；一般一阶近似与余项留后文。

函数允许全0、全1、单个观察及两个合法端点。即便旧经验支持点质量为0，也可以向该二元结局支持点转移概率；此时不可用除以旧零概率的逐人重加权公式。完整支持点算法仍合法，不能为实现逐人重加权而补造患者。

输入空/稀疏数组、未知值、字符串/布尔值、非0/1或非有限结局会报错；非有限、非数值或越界delta会报错。边界严格使用实际计算得到的`p0,p1`机器值，没有epsilon越界通行、clamp或隐式修正；例如`p0=0.3`时`0.1+0.2`的机器值略超界，会拒绝。合法接近端点的数值保留原值。概率各项断言在`[0,1]`，归一化总和容许`8*Number.EPSILON`的浮点计算误差，不修改概率。

验证命令：`sh scripts/node.sh --test tests/mean-transfer.test.js`。测试含独立手算、方向/符号、原CSV分类字段计数、逐条原记录重加权求新均值与IF配对、所有合法端点、全0/全1、机器浮点边界、输入保留/输出数组独立及非法输入拒绝。测试不以同一函数返回值代替独立预期值。
