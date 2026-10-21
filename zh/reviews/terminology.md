# 全书中英文术语：独立审查

日期：2026-10-15。**状态：ch00—ch08冻结稿中英文术语独立审查通过；三项短命名建议已实际复核关闭，无未关闭项。**唯一写入本记录，不改章节、共享代码或旧审查。已读`docs/COURSE_CONTRACT.md`、`docs/STYLE_GUIDE.md`，并初步定位ch00—ch08中核心术语及紧邻数学语境；无需重复检索已有核验文献。

## 独立判定原则

术语必须对应当前对象与运算，不能只在括号中机械加入一个看似相关的英文。中文含义和适用条件保留，英文为读者对照文献提供索引，不替代原推导。首次命名及跨章重新正式定义处应就地给中英文；已定义后的普通复现不必每次重复。缩写须在首次正式使用处连同全名解释。

只对标准数学/统计概念或当前实际定义的对象作术语补充，不要求每个普通动词、控件名或算术连词都翻译。不把正文变成词典，不为补译引入尚未需要的新概念。原中文若本来正确，应保留而非改成只有英文。英文采用British English，如normalisation、centring、orthogonalisation、randomised；canonical、regular等不因中文习惯改变数学含义。

最终逐章查看实际定义/公式/例子与新增英语的对应关系，尤其核对平方根、概率权重、极限箭头和模型限制，而不是只查字符串是否出现。术语补全不赋予此前未证明的效率、正则性或因果识别结论。

## 关键映射及不可混同项

| 当前中文/对象 | 应用英文 | 数学判定边界 |
|---|---|---|
| 函数 | function | 给输入配输出的一般规则；D(z;P)固定P后为z的函数。不能把function一律译成泛函。 |
| 泛函 | functional | 当前Ψ输入一套分布并输出一个目标数；不要译为functionality，也不要说任意函数必为当前分布目标。 |
| 方向导数 | directional derivative | 沿选定合法分布方向的目标变化率，是一个数；不等于score或完整梯度函数。 |
| 路径可微性/沿路径可微性 | pathwise differentiability | 目标沿全部指定合法路径的导数具有连续线性表示；不是仅一条路径可导，也不是pathwise derivative这一单个导数对象。 |
| 路径得分/路径score | path score / score function of a submodel | 对数密度沿路径的起点导数，本章有限模型为h/p；与propensity score不同。可直接保留通行词score并解释当前用途。 |
| 倾向评分/处理概率 | propensity score | g(x)=P(A=1|X=x)，是概率；不能用来命名可为负或超过1的路径score。 |
| 归一化 | normalisation | 调整质量使总和/积分为1；如组内除分母或指数倾斜除总质量，不是减均值。 |
| 中心化 | centring | 减去指定分布下的均值，使其平均0；不是normalisation，也不等于单位方差standardisation。 |
| 范数 | norm / L²(P) norm | √E_P[f²]；单位与f一致。 |
| 平方范数 | squared norm / squared L²(P) norm | E_P[f²]；单位为f单位平方，均值零时才等于方差。不能给1.0975/0.16之类平方量标成未平方norm。 |
| 内积 | inner product | 本书为E_P[fh]，使用指定概率加权；一般不自动等于协方差。 |
| 正交/正交补 | orthogonality / orthogonal complement | 对模型允许方向的加权内积为0；不是每格乘积都0。 |
| 正交投影 | orthogonal projection | 在指定闭线性空间内最小化加权平方误差；不是简单删除变量或因果调整。 |
| 切空间 | tangent space | 合法路径score的闭线性张成；受统计模型限制，不是任意方向集合。 |
| 规范梯度/典范梯度 | canonical gradient | T内代表全部合法方向导数的唯一函数；与模型外可添加的正交成分区分。 |
| Riesz表示定理 | Riesz representation theorem | 当前为Hilbert空间中连续线性泛函的唯一内积代表；不因同名而搬用测度表示定理。 |
| 正则估计量 | regular estimator | 本书是沿n^−1/2局部备择以各自目标中心化后的极限稳定；不是regularised estimator（加惩罚/正则化的估计量）。 |
| 正则性/正则条件 | regularity / regularity conditions | 需按估计量或路径上下文说明；不能把任意光滑混合都称regular submodel。 |
| 渐近线性 | asymptotic linearity | 在√n尺度上可忽略的余项之外为观测贡献平均；不是目标对概率的精确线性。 |
| 正则渐近线性估计量 | regular asymptotically linear estimator (RAL estimator) | 同时满足两类条件；不能只因残差形式便称RAL。 |
| 中心极限定理 | central limit theorem (CLT) | iid且有限方差等本章条件下√n平均贡献的分布极限，不是样本结果逐次相等。 |
| 依概率收敛/概率收敛 | convergence in probability | 对任意ε>0，偏离超过ε的概率趋0；区别于确定性收敛或几乎必然收敛。 |
| 依分布收敛/分布收敛 | convergence in distribution | 随机变量分布趋近极限分布，对应箭头d；不等于每次抽样数值趋向某常数。 |
| 双重稳健 | double robustness | 此处乘积余项带来的总体一致性结构；不与正交性或有效推断无条件互换。 |
| 正交性（nuisance语境） | Neyman orthogonality | 对干扰量的局部一阶不敏感性；须区别Hilbert空间函数间正交，不能仅见同名便视为同一命题。 |
| 交叉拟合 | cross-fitting | 用不同样本部分拟合和评估贡献以控制经验过程项；不等于一般交叉验证调参。 |
| 对数似然/得分 | log-likelihood / score | logistic更新中对ε求导的score，与第2章沿t的路径score有关但需说明所求参数；不误称propensity。 |

一般术语还须核对expectation/conditional expectation、conditional probability、product/quotient rule、Cauchy–Schwarz inequality、logit/odds、consistency、identification、empirical distribution、estimand/estimator/estimate、efficiency bound等实际使用。使用贝叶斯的组内权重时可称Bayes' rule/Bayes' theorem，不能把频率条件分母解释成新干预概率。

## 编辑进行中的初步观察

现有中文推导已经区分多项容易混淆对象：ch01的函数与随机输入、ch03路径score/propensity score、ch04中心化、ch06平方范数与模型投影、ch07极限分布与余项。这些正确区分应由新增英文加强，不能为“统一术语”而削弱。

定位时部分英文全名尚待编辑者补齐，例如ch00泛函、ch07 CLT/依概率与依分布收敛等。因章节正在并行编辑，本记录不把暂时缺项作为冻结稿缺陷；最终只以冻结后的实际源作判断。如发现含义已错而非暂缺英文，将立即给lead具体位置与建议。

已将审查启动时九章所有独立/行内TeX片段保存为临时只读源基准，用于冻结后核对公式是否保持。该基准不声称先前完全未经其他编辑，也不替代对新增中英文含义的独立审核。

## 最终关闭条件

收到冻结通知后，逐章核验实际新增术语和紧邻数学对象，记录准确性、一致性及中文/公式保留情况；必要时指出具体未关闭项，修复后复核。此处当前仅给出原则和基准，未标最终通过。本轮不运行或声称浏览器测试；任何构建/测试证据明确归属实际执行者。

## 冻结ch00—ch04的实际独立审查

已读取五章实际新增术语及其紧邻数学/统计语境。**这五章通过，未发现需关闭的核心术语误配或明显漏项。**这不是对仍在编辑的ch05—ch08预先通过。

| 章 | 实际核对重点与结论 |
|---|---|
| 00 | functional对应观察分布到目标数，function对应观测记录到IF值；potential outcomes/identification/standardisation均与潜在风险及共同目标权重一致。estimand/estimator/estimate、plug-in estimation、statistical model/efficiency、regular estimator/asymptotic variance分别指目标、规则、结果、代入方式及给定模型的正则大样本比较。valid inference没有被误译为statistical efficiency。通过。 |
| 01 | probability distribution/expectation/statistical model、point mass、distributive law、indicator function/index/summation、derivative/limit/difference quotient、function/random variable均与当前位置对象相符。英文没有将索引当数值、点质量当指示符、差商当零分母求值或随机函数输出当改变原概率。通过。 |
| 02 | absolute rate of change说明是原概率刻度而非绝对值；vector只是有序数列；路径得分score为h/p，区别于propensity score。natural logarithm、derivative、directional derivative和gradient各对应实际对数、变化率及导数代表，未将梯度和一个方向导数混同。通过。 |
| 03 | joint probability、conditional probability、chain rule、conditional mean和statistical functional配对正确；此处chain rule是概率链式分解，没有冒称微分复合函数法则。standardisation使用共同目标人群权重；Bayes’ rule/normalisation用组内分母；倾向得分不与路径score混同。potential outcome/conditional exchangeability及ATE/CATE仍保留因果识别条件。通过。 |
| 04 | joint distribution、quotient rule、product rule、residual、conditional expectation及centring与比值差分、乘积变化、实际处理残差及减去指定均值一致。centring不是把概率再归一化；EIF名称未替代后续所有方向/效率证明。通过。 |

对启动快照实际逐项比较，这五章的所有独立与行内TeX片段均保持相同；本轮读取到的中文定义、推导及条件没有因补译被删弱。没有要求将每个普通动词或已定义的重复词都加括号，新增英文未变成大词典。

完成本节时，全书审查进度为等待ch05—ch08冻结；其最终结论见后续各节。本审查未运行浏览器，不将构建或其他代理报告当作术语含义核验。


## 冻结ch05—ch08的实际独立审查

已逐项读取新增英文与紧邻定义、例子和公式，未以编辑者自检替代独立判断。**实质数学映射均正确；三项短命名建议现已按末节复核关闭。**

| 章 | 实际对象与核验 |
|---|---|
| 05 | local regular path与有限正概率逐点可微路径一致；conditional expectation与组内概率加权相符。L² norm明确有平方根，是原P下均方根；Cauchy–Schwarz inequality和continuity分别对应配对界与连续线性响应。pathwise differentiability定义覆盖全部允许路径并有同一个连续线性代表，不被简化为单一路径可导。exponential tilting对应联合指数重权及全局normalisation；central finite difference对应起点双侧数值差分。DQM全名differentiability in quadratic mean正确，对应平方根密度的积分平方余项o(t²)，dominating measure与共同支配测度一致；未将连续点质量任意称regular。 |
| 06 | probability simplex、linear combination、function space、dimension、basis各自对应概率约束和有限列运算。weighted inner product为E_P[fk]，squared norm为E_P[f²]，没有误称其为未平方norm；1.0975/.16及单位²仍指平方量。orthogonality/complement/projection及closed linear span/closure与模型合法方向和加权几何一致。canonical gradient用“典范梯度”准确命名T内唯一代表；Pythagorean identity及Riesz representation theorem分别对应正交分解和连续线性泛函内积表示。semiparametric model与有限saturated model区分保留。 |
| 07 | iid全名independent and identically distributed、SE为standard error、CLT为central limit theorem均准确。convergence in distribution对应d箭头与正态极限；convergence in probability对应缩放随机余项趋0的P箭头与o_P，未与确定性o(t)互换。asymptotic linearity保留小余项；regularity/RAL是以局部新真值为中心的极限稳定，不是惩罚正则化。asymptotic variance/first-order efficient、pointwise superefficiency保留regular渐近范围；likelihood ratio及triangular array对应技术证明的乘积似然比与各n的局部分布。 |
| 08 | empirical distribution与P_n逐条1/n平均一致，empirical process term对应(P_n−P_0)(Dhat−D_0)，没有将随机拟合函数当固定真函数。bias、double robustness、Neyman orthogonality分别与有符号总体偏差、乘积结构及nuisance局部导数相符，不混同效率/推断。L² convergence/bounded in probability/cross-fitting分别对应均方根、O_P及分组拟合/评估。logistic fluctuation的实际公式为固定offset加εH；offset、likelihood、chain rule及score equation与对ε的条件结局似然求导一致，score没有误称完整EIF或propensity。 |

### 三项短命名建议

数学上下文没有错误，但为使中文名与英文形式一一对应，建议仅作短命名调整：

1. ch05“先组内、再组间（law of iterated expectations）”以“迭代期望法则（law of iterated expectations）”正式命名，同时保留原直观解释。
2. ch08“一参数更新（logistic fluctuation）”命名为“一参数logistic扰动（logistic fluctuation）”或同义短语，避免读成所有一参数更新都等同logistic族。
3. ch05“沿路径可微（pathwise differentiability）”改名词配名词的“具有沿路径可微性（pathwise differentiability）”，或形容词配pathwise differentiable。原完整定义无需更改。

已向lead反馈；除此三处编辑选择外未发现明显核心遗漏或误配。九章独立/行内TeX均已实际与启动快照逐项比较相同；公式中范数平方、极限箭头、求和权重及条件都保留。最终关闭将在确认短命名实际落盘后追加。未运行或声称浏览器测试。


## 最终冻结稿闭合

已实际复核三处最终文字：ch05“迭代期望法则（law of iterated expectations）”保留先组内再组间的有限求和解释；“具有沿路径可微性（pathwise differentiability）”名词形式对应完整定义；ch08“一参数logistic扰动（logistic fluctuation）”准确命名固定offset加εH的具体更新族。三处没有扩展或更改原定理条件与推导，全部关闭。

课程约定及风格指南也已实际补入本轮规则：每章首次正式解释处给中文与规范英文，缩写给全称；function/functional、directional derivative/pathwise differentiability、score/propensity score及正交/效率不同语境须区分。规则与九章的实际术语用法一致，并未要求每个普通词或重复出现都加英文。

最终再次实际读取九章全部独立和行内TeX，与审查启动基准逐项比较，全部相同。关键术语均已按实际数学角色核验，未发现仍需修改的核心误配或明显漏项；中文解释、已列条件及公式没有因加英文而削弱。这里的结论覆盖本轮术语编辑，并不替代其他章节推导、实现或浏览器的既有独立验收。

**最终结论：九章术语的数学与教学文字审查通过，无未关闭项。**本审查未运行构建、项目测试或浏览器；lead进行中的回归不写成本审查已通过的证据。
