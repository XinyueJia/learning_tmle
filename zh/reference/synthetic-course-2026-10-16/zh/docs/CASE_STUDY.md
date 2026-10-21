# 固定案例与Julia手工TMLE主线

## 真实公开资料接入状态（2026-10-16）

真实公开RWS优先，可调整病种与终点。现已保存Ng等2021的107条真实肺癌用药记录于`shared/data/public/ng-2021-nsclc/`，来源、许可、原始哈希随文件保留。网页`public-data.html`和Julia脚本提供实际原始数据核查，不进行未经支持的临床结局编码。PFS时间/状态配对、起点、删失仍未核实；全部107条包括1条突变Negative记录保留。检查标记不等于确认错误，不自动排除。

下文固定200人及已知真值仍是八讲数学推导的合成例子。真实队列尚未完成贯穿八讲的临床分析迁移，不能沿用20pp真值、充分二元混杂或完整12个月结局假定。下一步先找到定义充分可核查的数据并固定方案，再实施相应估计；若有删失，需扩展观察模型与方法，不能直接复用完整结局EIF。真实资料的独立审查见`zh/reviews/public-data-design.md`。


日期：2026-10-15。本轮目标：保留完整EIF推导，以同一份固定RWS疗效再评价教学数据贯穿第1—8讲；每章完成一个后续可调用的计算，最后用Julia和网页按样本计数亲手完成TMLE。不是仅添加章首口号或改成TMLE软件包说明书。

## 案例与数据边界

第0章研究方案为已上市抗肿瘤药的初始策略比较：同一适应证、同一治疗线且两药均可选的晚期NSCLC新使用者，A=1启动研究药A，A=0启动活性对照B；X=0/1为高/低基线预后风险；Y=1为12个月内疾病进展或全因死亡，每人最多计1次。首次给药为资格/分组/随访共同起点，停换药后继续观察，不据未来完整随访筛人。假定Y完整及X充分控制混杂，详见RWS_CASE_PROTOCOL.md。固定200条合成记录，不冒称真实患者数据/RWD/RWE。八格计数按(X,A,Y)顺序为24,56,4,16,16,4,40,40，由唯一DEFAULT_MODEL的联合概率乘200生成。shared/data/rws-counts.csv为唯一八行输入，rws-records.csv展开200人，各讲不重新抽样。

这是一张刻意构造、使经验概率等于原教学模型的频数表；这不表示一般样本比例都等于真概率。总体理论实验继续标为总体，案例手算按n/N计算P_n。算法只使用观察计数，不向未知真分布查询Q或g；改变输入计数必须相应改变估计。第一、二章直接用本表二元终点Y推导均值IF，边际权重由唯一八单元模型求和。风险.58及12个月无进展生存概率.42互补；时间轴为编码示意，CSV没有事件/删失日期，不估计删失生存曲线。

## 按章交接（顺序实施）

0：固定问题、数据来源和最终要交的手算对象。
1：从116/200算终点事件风险.58，二元均值IF为Y−.58；风险是后续组内均值的最小原件。
2：对同一表的一格作质量守恒扰动，区分位置t、h、score和导数配对；仍先验证总体结局均值，不偷换成ATE。
3：按四个(A,X)组整理人数/事件数，得到p_n(X)、g_hat和组内观察风险；初始结局拟合故意仅按A分组，Qinit(0,x)=.60、Qinit(1,x)=.56，是一个可复算的简化回归。
4：将从目标推导出的H=A/g−(1−A)/(1−g)写成四个数，组装初始经验EIF，发现初始目标−.04与平均EIF+.24。
5：验证推导的梯度配对与合法方向，并认识只解一个方向不替代全方向验证；保留后续更新所需结局方向。
6：以同一经验表做已知g的假设模型投影练习，明确这是教学模型约束，实际案例最后的g仍从计数估计；输出canonical gradient选择原则，不将改模型偷带入最终算法。
7：分别按同一表计算初始拟合函数（均值.24、二阶矩1.64、中心方差1.5824）和饱和经验梯度（均值0、方差1.0975）的矩，展示IF方差/SE，分清真分布效率界、经验plug-in方差与一次样本的实际误差；保留第8讲更新后重新计算的步骤。
8：从计数→初始Q/g→H和offset→手动找epsilon根→更新四个Q→按经验X平均→检查经验EIF方程→可选条件性SE。以score(0)=.24、epsilon约.162239239635、最终风险差.20作为该固定表的可复算结果；不将方程零或与构造值相同当成无偏/覆盖率证明。

## 唯一接口与文件所有权

lead：章节正文逐章修改、zh/docs、zh/src/app.js集成、构建、导出、整体浏览器与交付。
数值/Julia代理：仅shared/julia/**及zh/julia/**，无外部Julia包；读取shared/data/rws-counts.csv。提供逐讲可累计函数、完整TMLE、独立断言与命令行机器可读核对结果。不得读取DEFAULT_MODEL或将.20写入算法。
前端/JS代理：仅shared/js/case-study.js、zh/src/case-workbench.js、tests/case-study.test.js；不改app/build/style/正文。纯函数与DOM分离，所有答案计算。mountCaseWorkbenches(document)挂载data-case-study="0"至"8"，独立reset，不改其他实验状态。每章只显示当时可用的结果；第8章有可手工选择epsilon、单步二分、显式自动解、最后展开的完整结果。
独立数学代理：仅reviews/case-study-mathematics.md，从estimand/计数独立核验两种实现与正文，不做作者自验收。

## JS计算接口（冻结约定）

shared/js/case-study.js导出CASE_SIZE=200、CASE_COUNTS（冻结八行{x,a,y,n}，从DEFAULT_MODEL生成，不复制默认概率）、caseData(rows=CASE_COUNTS)、caseAt(epsilon=0,rows=CASE_COUNTS)、solveCase(rows=CASE_COUNTS)、countsCsv()/recordsCsv()。
caseData返回n、cells、四组groups（按x外层a内层；每组x,a,n,events,qObserved,px,gHat,h,initialQ,offset）、empiricalModel、initialFit、initialEstimate、observedDifference、marginalRisk；所有拟合只从输入计数计算。初始模型为仅含处理A的Bernoulli回归（两臂经验风险），g按X分组估计，px经验比例。
caseAt返回上述data及epsilon、每组的qUpdated/predictedEvents/residualTotal/weightedResidual/scoreContribution、score（每条记录的经验平均，不是总和）、slope、logLikelihood（平均）、updatedFit、estimate、aipw、eifRows（八格带D）、eifMean、eifSecondMoment、se。SE只作经验EIF近似，不能保证小样本覆盖。
solveCase从同一计数求根，返回caseAt结果以及converged/iterations；可以复用math.js以经验模型作积分权重，但不能把DEFAULT_MODEL作为oracle传入算法。支持不同比例/事件计数的独立测试，非法值及当前教学有限正单元外输入明确失败，不静默clipping。

## Julia约定

Base/标准库即可；一份可编辑模块shared/julia/EIFCase.jl和按章执行的例子，函数读CSV后完成1—8讲累积步骤。真实运行julia --startup-file=no --history-file=no tests/julia/runtests.jl；若环境不允许写预编译缓存，使用临时JULIA_DEPOT_PATH。英文拼写British，中文注释和符号解释为主。通过命令行输出key,value核对Julia与JS的初值、根、四个更新Q、score、最终ATE与方差。自动求根使用明确括号/容差/最大迭代与失败状态。不得依赖TMLE包代替推导。

## 验收

八章的案例不是同一段口号复制：每章有当前任务、实际计算/预测及答案、明确已得对象与下章用途。第1章先闭环，再顺序推进2…8。纯函数测试覆盖计数归一化、初值、H/score、likelihood导数、求根、预测范围、经验EIF均值及不同比例数据；两种语言互核并各有独立预期。浏览器检查所有逐章任务、答案、epsilon手动/单步求根/重置、数据导出、无跨章状态串扰、桌面/手机/公式/console。原8章推导与公式不因案例线索被删减。

补充接口：caseMeanDirection负责二元均值方向，caseDirections从重建的新概率计算有限差分，caseProjection以五基作真实投影。caseEmpiricalMoments返回饱和经验梯度的values/eifMean/eifSecondMoment/eifVariance/se，独立于caseAt(0)的初始拟合函数，不能混同两个对象。
