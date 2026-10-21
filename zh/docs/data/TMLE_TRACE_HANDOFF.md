# 第8章：同一患者表的TMLE逐列接口

`shared/js/tmle-trace.js`导出纯函数`tmleTrace`与`TMLE_TRACE_TOLERANCE=1e-12`。输入是既有`prepareRhc(rows)`结果，函数不重新拟合、不读冻结结果、不修改原记录或拟合数组，也不调用`rhcAt`。输入预测与观察列足以逐列重建同一次logistic fluctuation。

```js
import {tmleTrace} from '../../../shared/js/tmle-trace.js';
const trace = tmleTrace(fit, epsilon, {start: 0, count: 6});
```

省略epsilon时为0，窗口默认从原第1行显示6行。返回`{vectors,shown,summary,start,count,requestedCount,rowNumbers}`。

## 行与窗口

`vectors`每个数组均长为完整`fit.n`，按原始输入记录顺序排列。`shown`仅选择展示窗口，每条含1起点`row`、`age,race,x`及每个向量的同行数值。`rowNumbers`与`shown.row`一致。分页不会改变任何完整向量、epsilon或汇总。

`start`为0起点安全整数，必须落在`[0,n−1]`；`count`为正安全整数。第2窗使用`start=6,count=6`；末窗超出队列范围时截至最后一行，返回实际`count`并保留`requestedCount`。不允许空队列、空窗口、负数或小数窗口下标。

最小分析输入是`{n,rows,g,q0,q1,H?}`，其中`rows`有固定的二元`a,y`。实际RHC使用完整`prepareRhc`返回对象；手算测试只需上述字段。可选`H`若提供，必须与真实A及对应g重建的H相符，容差为`1e-12*max(1,abs(H))`。`age,race,x`只用于展示，在完整RHC输入中来自同一患者。

## 全长向量

所有`vectors`都以患者为对齐单位；数学上画作n×1，JavaScript中是长度n数组，不能冒充两个结局支持点或特征系数向量。

| key | 逐行计算 | 固定/改变 |
| --- | --- | --- |
| `a,y` | 原观察A与Y的副本 | epsilon改变时固定 |
| `g,q0,q1` | 原拟合概率副本 | 同一次targeting中固定 |
| `qa` | `a ? q1 : q0` | 按真实治疗逐行选择 |
| `offset` | `logit(qa)` | 固定 |
| `h0` | `−1/(1−g)` | 固定，严格为负 |
| `h1` | `1/g` | 固定，严格为正 |
| `h` | `a ? h1 : h0` | 固定，等于实际H |
| `shift` | `epsilon*h` | 随epsilon改变 |
| `eta` | `offset+shift` | 随epsilon改变 |
| `qstar_a` | `expit(eta)` | 真实A下的更新预测 |
| `residual` | `y−qstar_a` | 真实结局与更新预测之差 |
| `score_contribution` | `h*residual` | 逐人得分贡献，尚未平均 |
| `offset0,offset1` | `logit(q0),logit(q1)` | 固定 |
| `shift0,shift1` | `epsilon*h0,epsilon*h1` | 与观察分支使用同一个epsilon |
| `eta0,eta1` | `offset0+shift0,offset1+shift1` | 两臂各自的线性预测值 |
| `qstar0,qstar1` | `expit(eta0),expit(eta1)` | 两个干预输入的更新预测 |
| `contrast` | `qstar1−qstar0` | 逐人更新风险差 |
| `centred` | `contrast−mean(contrast)` | 以完整队列均值中心化 |
| `eif` | `score_contribution+centred` | 经验EIF值 |

`qstar_a[i]`与按真实A选出的`qstar0[i]/qstar1[i]`一致。全A=0/全A=1更新改变预测输入；观察到的A/Y保留。epsilon=0时，更新预测在浮点精度内等于原预测。正epsilon沿正h1提高qstar1、沿负h0降低qstar0，负epsilon相反；不应对两个预测列都加相同方向的shift。

## 全队列标量

`summary.n`始终是完整队列人数；公开原始RHC为5735。其余均为标量：

| key | 含义 |
| --- | --- |
| `epsilon` | 当前手动或求根得到的波动系数 |
| `initial_estimate` | 原始`mean(q1−q0)` |
| `initial_score` | 原始`mean(h*(y−qa))` |
| `aipw` | 固定的初始one-step值：`initial_estimate+initial_score` |
| `score` | 当前`mean(score_contribution)` |
| `estimate` | 当前`mean(contrast)` |
| `centred_mean` | 当前`mean(centred)`，仅有浮点误差 |
| `eif_mean` | 当前`mean(eif)`；应与score在浮点容差内相等 |
| `variance` | `mean((eif−eif_mean)^2)`，分母为n |
| `se` | `sqrt(variance/n)` |
| `min_q,max_q` | 两臂全部更新预测中的最小值/最大值 |
| `slope` | 得分对epsilon的导数：`−mean(h^2*qstar_a*(1−qstar_a))` |
| `log_likelihood` | 当前真实A下Bernoulli平均log likelihood |

`aipw`是初始one-step参照，epsilon改变时不变；不要把它标成当前`estimate+score`。任意epsilon下`centred_mean≈0`，但`eif_mean≈score`一般不为0，必须求解经验得分方程后才能显示近似零。方差在任意epsilon下都按当前EIF自己的均值中心化，不能直接以EIF平方均值替代。

公开队列检查点：

- 初始风险差约`0.0864988559023306`，初始score约`0.0034691393067677457`，初始AIPW约`0.08996799520909834`。
- 使用epsilon=`0.003576966662876657`，更新风险差约`0.08997972473530443`，SE约`0.013082375165239404`，score绝对值小于`1e-12`。
- 这些数值只用于测试回归；实现没有硬编码它们。扩展W是课程已声明的保守调整集合，数值检查不证明因果识别或有限样本无偏。

## 数值失败与边界

g、q0、q1及所有更新预测都必须严格位于(0,1)。任一长度不符、非二元观察值、非有限epsilon/H/中间结果/方差或浮点概率端点会显式报错。没有clipping、正则、插补或静默删行。即使某人的真实A=0，未观察到的A=1分支达到边界也会失败，反之亦然。展示层应给出失败信息，不把无法计算的数值当成0。

保留原始浮点数；`1e-12`用于得分方程/经验零检查及可选H的一致性检查。没有为展示将EIF均值强制设为0。无论epsilon是否解出，这里只展示同一个给定拟合下的一步完整运算。

## 实际测试

```sh
sh scripts/node.sh --test tests/tmle-trace.test.js tests/rhc.test.js
```

`tmle-trace.test.js`有7项测试：

1. 四人可手算输入：g=.5、q0=.25、q1=.75，逐列核对H、offset、残差、得分贡献、中心化与EIF；初始score=−.5，方差=1，SE=.5。
2. 解析负epsilon根`−log(3)/2`：两臂更新概率均为.5，score/EIF均值/风险差均为0。
3. 不同患者g与正负epsilon：独立Bernoulli似然中心差分验证score，score中心差分验证slope，核对观察分支与两臂预测、两臂显式offset/shift/eta。
4. 全部5735名原RHC患者：固定回归参照、1918个真实事件、直接从A/Y和两臂更新预测重新汇总完整经验score。
5. 首窗、下一窗与末窗保留患者身份/行次序，完整向量及所有汇总完全相同。
6. 冻结输入下函数可运行；返回数组改动不会改写输入拟合或观察记录。
7. 错误维度、非二元值、端点概率、非有限值、陈旧H、非法窗口，以及仅未观察分支达到概率边界时均失败。

这些测试不通过调用`rhcAt`验证自身；可手算例题、独立似然与公开队列回归分别提供不同来源的检查。
