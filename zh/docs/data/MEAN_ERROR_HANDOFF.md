# 第0章§5.3：样本均值误差接口

```js
import {meanErrorData} from '../../../shared/js/mean-error.js';
const unknown = meanErrorData(data.Y);
const trial = meanErrorData(data.Y, m);
```

`data.Y`可以直接取自既有`objectLessonData`；也可用`readRhc(source).map(row => row.y)`，后者不拟合模型。必须传完整队列的数值0/1数组，不传分页行、拟合预测或模拟抽样。函数只计算，不读文件、不生成展示数值、不改写输入。

`n/events/muhat`分别为完整输入人数、事件人数和`events/n`。`outcomes`是保留顺序的独立副本。`sampleCentred={centre,values,mean}`以`muhat`为中心：逐人值为`Yᵢ−μ̂`，其完整n人平均为0（保留浮点误差）。这表示经验分布下的中心化，不是计算到了未知真实分布下的误差。

不提供基准时，`reference=null`、`referenceStatus='unknown'`、`referenceCentred=null`、`distance=null`。`symbolic`保留`populationMean='μ₀'`、`trueIF='Yᵢ − μ₀'`、`trueIFMean='(1/n)∑ᵢ(Yᵢ − μ₀)'`及`trueError='μ̂ − μ₀'`。展示层应显示未知符号，不能把null当0，更不能以μ̂自动替换μ₀。

用户明确选择`m∈[0,1]`后，`referenceStatus='assumed'`、`reference=m`，`referenceCentred={centre:m,values:Yᵢ−m,mean:sum(values)/n}`，`distance=muhat−m`。这两个数值从逐人合计与标量相减独立计算，显示它们相等的代数关系。它们仅是对假设基准m的距离；始终有`trueStatus='unknown',trueIF=null,trueError=null`，防止将试算基准冒称真实临床均值。选择m只改变中心，不改变观察结局。

`grouped`提供同一完整输入的两结局支持点核对：`alignment='outcome'`、`patientN=n`、`support=[0,1]`、`counts=[n−events,events]`、`probabilities=counts/n`。`sampleCentred`和可选`referenceCentred`含支持点的`values`、概率乘中心化值的`contributions`及其和`mean`。它们是对完整n人的分组加权，不是两名患者；不能将两支持值等权平均。

所有数组相互独立，不与输入别名；纯函数容许全0、全1结局及m=0/1。空/稀疏数组、字符串/布尔值/非0或1结局，以及非有限或越界m会报错。模块没有真实总体参数、硬编码队列人数、模型拟合或仿真。

验证命令：`sh scripts/node.sh --test tests/mean-error.test.js`。6项测试已通过：独立手算；未知总体不自动变为样本中心；原CSV完整逐人合计与原分类字段分组求和；均值/基准边界；输入/返回数组隔离及改变观察值后重算；非法输入拒绝。
