# EIF 课程约定

## 真实公开资料接入状态（2026-10-16）

真实公开RWS优先，可调整病种与终点。现已保存Ng等2021的107条真实肺癌用药记录于`shared/data/public/ng-2021-nsclc/`，来源、许可、原始哈希随文件保留。网页`public-data.html`和Julia脚本提供实际原始数据核查，不进行未经支持的临床结局编码。PFS时间/状态配对、起点、删失仍未核实；全部107条包括1条突变Negative记录保留。检查标记不等于确认错误，不自动排除。

下文固定200人及已知真值仍是八讲数学推导的合成例子。真实队列尚未完成贯穿八讲的临床分析迁移，不能沿用20pp真值、充分二元混杂或完整12个月结局假定。下一步先找到定义充分可核查的数据并固定方案，再实施相应估计；若有删失，需扩展观察模型与方法，不能直接复用完整结局EIF。真实资料的独立审查见`zh/reviews/public-data-design.md`。


正文与界面以中文为主，英文采用 British English spellings。读者仅学过基础应用生物统计，是 semiparametric statistics 的门外汉。可从样本均值、比例、分组比较、标准误及应用回归经验出发；不预设熟练掌握条件概率记号、条件期望、一元或多元求导、线性代数、潜在结局识别、极限与渐近记号。score、Hilbert space、渐近线性更不是先修知识。

## 低先修的教学入口（2026-10-14 用户补充）

工具在首次需要时从数值操作引入，而非要求读者课前补学数学：第1章从样本平均连接概率权重，解释求和与变化率；第2章从绝对/相对变化解释 score，先使用 h/p 再介绍 log 写法；第3章从“组内比例”引入条件概率与条件均值，并讲明因果识别假设；第4章用新旧比值的相减推导商式、用两项乘积的展开解释乘积法则；第5章示范先组内再组间平均及固定组内常数的提出；第6章把函数写成每个单元的一列数，从加权平方误差引入内积、正交与投影；第7章从重复抽样与标准误解释 CLT、√n 及余项；第8章用四条记录解码经验平均，并把 logistic fluctuation 联系到熟悉的二元结局回归。

每章先让读者知道“本次在算什么”，再给符号和名称。必要的推导保留在主线，不用“技术说明可跳过”掩盖逻辑缺口；一般连续模型、抽象存在性和极限证明的补充可放展开项供第二遍阅读。正文中的 log/exp、内积和渐近记号均须就地解释作用。交互要允许不先记公式也能核对数值，习题答案需解释为什么，而非仅列结果。新读者约定下的审查另见 zh/reviews/audience-accessibility.md，不能将旧版教学审查自动算作本轮通过。

写作补充（2026-10-16）：对分配律、合并同类项等已直观的基础运算，直接说明所做的运算及其理由，不额外增加类比。逐步推导与符号释义仍保留；图示直接呈现乘法、求和、提取公因子及消项。

主线：先规定因果问题与估计目标、区分识别和估计 → 改变加权平均 → 分布方向 → 三机制 → 商式求导构建 ATE 梯度 → 所有平滑方向验证 → 模型的合法方向与投影 → 估计误差及效率 → 一阶修正与 targeting。

## 标准术语的中英对应（2026-10-15 用户反馈）

标准数学、统计及因果术语在每章首次正式引入或解释时，同时给出中文与规范英文，例如泛函（functional）、方向导数（directional derivative）、内积（inner product）和切空间（tangent space）；缩写同时展开英文全称。中文仍须解释这个工具在当前计算中的含义，不能仅靠英文替代教学。后续重复使用保留简短中文，局部符号回看按原约定继续，不给每次出现都堆叠英文。

明确区分函数（function）与本课将分布映为目标数值的泛函（functional），以及路径得分（score）与倾向得分（propensity score）。不要将“正交”或“有效”在不同语境下机械译为同一术语：分别指明正交的对象、统计效率或有效推断的条件。英文采用 British spellings，例如 normalisation、centring、standardisation、randomised。

## 章节依赖及验收

导读按 ch00 → ch01 → ch02 → … → ch08 阅读；原八章编号保留。按当前指定章节逐章撰写及集成。同一时间只有当前一章的作者。每章须有问题、回顾、逐步推导、实验、预测题及有理由的答案、技术展开、交接。chapter brief 放 zh/docs/chapters/chXX.md；正文放 zh/src/chapters/chXX.md；独立审查放 zh/reviews/chXX.md。只有正文、实现、独立数学审查与实际测试均完成才计为完成。

## 符号及模型

- O=(X,A,Y)，三个变量二元；Q(a,x)=E_P[Y|A=a,X=x]，g(x)=P(A=1|X=x)，π₁=g，π₀=1−g。
- τ(x)=Q(1,x)−Q(0,x) 是 CATE；ψ(P)=E_P τ(X) 是 identified ATE；其因果解释需 consistency、conditional exchangeability、positivity。
- P 是基准真实分布；P_t 是扰动分布；P̃ 或 Q̃,g̃ 是拟合模型；P_n 是经验分布。D* 是给定模型的 canonical gradient。路径 score S 不等于 propensity score g。
- 默认二元机制仅在 shared/js/math.js 的 DEFAULT_MODEL 定义：px=[.5,.5]，g=[.2,.8]，q=[[.70,.20],[.80,.50]]（q[a][x]）。章节状态各自重新 clone。
- 第1—2章也使用同一RWS队列的二元终点：Y=1{T≤12个月}，边际权重由唯一八单元配置求和，p=(.42,.58)，事件风险μ=.58。12个月无进展生存概率S(12)=1−μ=.42，其IF为−(Y−μ)。第3—8章ATE为概率差，乘100为pp。t为无量纲路径参数，T为事件时间；score S与生存函数S(12)按上下文明确区分。方差是参数单位²。

## 共享计算接口（唯一所有权：数值代理，变更由 lead 协调）

ES modules，纯函数，无 DOM、无数据采集。shared/js/math.js 导出：
DEFAULT_MODEL, MEAN_MODEL, cloneModel(), joint(model) → [{x,a,y,p}], fromJoint(cells) → model, ate(model), naive(model), mean(values,probabilities), contaminate(probabilities,index,t), pointScore(probabilities,index), eif(model,cell) → {dx,dy,total}, expectation(cells,fn), tilt(model,kind,t)（kind X/A/Y，条件归一化），mechanismScore(model,kind,cell), jointTilt(model,score,t)（8维均值零score，联合归一化，可同时改变机制）, inner(probabilities,f,h), project(probabilities,f,basis) → projection array, varianceDirect(model), varianceAnalytic(model), expit, logit, fitFromOffsets(truth,b,lambda), cleverCovariate(model,a,x), nuisanceBias(truth,fit), aipw(truth,fit), fluctuation(truth,fit,epsilon) → model, fluctuationScore(truth,fit,epsilon), tmle(truth,fit) → {epsilon,updated,estimate,score,converged,iterations}。

fit 使用与 model 相同结构；AIPW、population TMLE 以 truth.px 对目标人群积分。纯机制 tilt 的其他两因子在所有 t 保持不变。所有公开函数对非法输入失败，禁止静默截断模拟数学结论。

## 应用约定（所有权：lead）

静态 ES modules + 本地 KaTeX，Markdown 由小型构建脚本转换为 HTML；无需登录或线上服务。可编辑 TeX 源保留在 Markdown；句内公式明确用 $...$，独立公式用 $$...$$，不得将带下标的 TeX 裸写成普通正文。答案展开、表格与正文使用同一渲染器，数学输出含 MathML。长行内式与正文宽表局部滚动，只有实际溢出的行内式加入键盘焦点。每章独立挂载实验，所有控件 label、reset、键盘可达。只登记已完成正文的导航，不创建空章节。纯函数计算结果驱动表格与 SVG，图的精确曲线不得调用线性近似公式伪造。

## 数学边界

有限正概率模型允许局部双侧点质量路径；t≥0 是污染解释，负 t 仅在概率正的邻域合法。连续分布的点质量通常不支配于 P，不能直接当 regular submodel。均值线性才有任意合法 t 的精确一阶式。全非参数八单元 tangent space 为七维 L²₀(P)；受限模型必须明示模型。效率界针对 regular 渐近估计，不是有限样本排名。DR 是乘积余项恒等式；orthogonality 是局部导数性质；有效推断另需收敛速度、positivity、cross-fitting/经验过程条件。

## 子代理范围

作者仅写当前 zh/src/chapters/chXX.md 与 zh/docs/chapters/chXX.md；数学审查者仅写当前 zh/reviews/chXX.md 及文献记录；数值代理仅写 shared/js/math.js、tests/math.test.js 与接口说明；lead 集成 UI、构建、浏览器测试与进度。教学审查者后期仅写 zh/reviews/pedagogy.md；不得覆盖作者文件。2026-10-14 读者入口修订中，author 仅负责第1章，lead 顺序修订第2–8章；独立数学审查者仅写 zh/reviews/audience-mathematics.md，教学审查者仅写 zh/reviews/audience-accessibility.md。

## 公式的就地回看约定（2026-10-14 用户反馈）

列出每组独立公式时，在紧邻位置回看本组的符号含义与代数动作，避免读者必须向前找定义。同一aligned连续推导视作一组；提示要点名实际出现的随机/选定输入、原/新分布、目标/原均值、索引、权重与单位，按本组需要选择，不重复整本词典。有运算就说明代入、分配、拆和、提出不随索引改变的常数、相消或非零约分的理由；新概念仍先在主文定义，回看不能代替推导。数值式则回看分子、分母、各数的角色及单位。公式表和同一计算图也有局部提示，重复记号跨段再次出现时按读者需要提醒。

可编辑正文使用单行Markdown `> **符号回看：** ... **这一步：** ...`；正文中的TeX仍以$...$标记，源码中无特殊组件依赖。构建后是默认可见的role=note小段，公式照常含MathML；不用悬停或展开才能读。计算图统一调用renderFormulaRecall(source)，符号的释义只描述图所示运算，不另建模型或硬编码计算结果。

本轮先在正在优化的第一章完整落实：26个独立公式组、4张公式表、16幅图及实验公式。后续逐章优化遵循同一约定；本条不表示其他七章已经逐式添加或验收。

## 第0章及参考风格的增补（2026-10-15）

第0章为用户要求的概念导读，不替代第1—8章推导。明确estimand/estimator/estimate、潜在结局目标及识别桥梁、统计模型内的IF/efficient含义与有条件的估计误差联系。新读者默认从第0章进入，原#chapter-1至#chapter-8链接及编号保持。第0章只有概念和同一离散模型下的标准化计算，不向第1章传递未经证明的ATE EIF、全部平滑方向或效率结论。

第0章和第3—8章读取唯一DEFAULT_MODEL；上市后RWS应用情境使用匿名药物与合成数据，不是具体产品的临床证据。新增chapter0Data显式支持人群构成、目标量和处理分配三个控制：改人群是另一个目标人群；改ATE/干预风险是在改汇总问题；只改处理机制保留组内Q与当前目标人群，因此不改变该因果目标。第0章有限求和单独支持无质量基线组的端点，核心一般模型的全正约束未修改。

用户指定causalit文章的讲解风格已形成[STYLE_GUIDE.md](STYLE_GUIDE.md)：问题先行，数字引出符号，公式说明目的与步骤，每个新术语有用途，保持每组公式回看。原8章未全文重写；后续按此逐章优化。风格原文仅作叙事参考，数学边界见zh/reviews/style-reference.md与SOURCES.md。

第0章§5的IF过渡用固定真分布和两套单风险误估的拟合分布展示目标误差，不将其当成重复抽样偏差或完整ATE IF。chapter0ErrorData与原chapter0Data都克隆唯一DEFAULT_MODEL；新静态图不影响实验状态。导读将分布层的一阶表示、估计量的样本平均+余项、给定模型的regular渐近效率三层分开，再逐步连接；这些是问题与结论的导读，不取代第1—8章证明。

## 固定案例与Julia代码主线（2026-10-15）

第1—8讲的应用任务统一使用上市后RWS200条合成记录，详细数据/章节交接/代码接口见CASE_STUDY.md。第1—2章从同一二元Y直接构建均值IF，完整展示代数步骤；不得将全样本观察风险当ATE。CSV没有事件日期；时间轴只能标明为编码示意，不能伪造200人的日期。12个月状态未知者不能当Y=0；本课程尚未推导删失生存结局的EIF。总体机制实验与固定样本案例明确分开，案例状态逐章独立。手工实现用Julia，网页计算用共享纯JS模块，均只从观察计数学习拟合，跨语言核对；不得调用未知真分布选epsilon。最终手算完成不等于推断自动有效，初始结构误设/更新Q一致性与经验SE另须说明。

## Julia零基础的逐行讲解约定（2026-10-15）
默认读者没有Julia基础。当前只将第一讲做成完整样板，其他讲保留原代码，后续按用户指定逐讲展开。样板须说明终端/入口脚本/函数定义的关系；实际输入文件、所用字段、输出字段及数学符号；逐个非空源码行的语法、动作和当时的输入输出。将循环与求和账对照，区分赋值与数学等号、格人数与总人数、影响值与概率、返回与打印、下标与标签。提供有理由的预测题及真实stdout，解释浮点/舍入不改数学结论。

第一讲的行卡片从实际CH01与lesson01提取，解释稿存zh/src/julia/ch01-walkthrough.md。源段哈希/逐行覆盖是构建约束：源段改变后须同步核对解释，缺行/重复/源码漂移使构建失败。实际运行的完整源文件仍可复制；不能只展示一套脱离被测实现的简化代码。统计核心使用可读的两次显式循环，公共risk/values/mean输出接口保持。后续讲可简短回看已解释语法，新语法和数学运算须就地说明，不把八章一次性铺成无验收的逐行稿。

## 并行语言版本（2026-10-15）

当前课件及教学记录位于zh/；shared/是唯一数学内核和固定案例输入。英文版预留en/，尚未发布，不复制数值配置。目录、构建与路径约定见zh/docs/FILE_HIERARCHY.md（相对项目根目录）。历史验收中的旧路径保留当时语境。

## 上市后RWS案例语义（2026-10-15）

读者已选择疗效再评价。第0—8章统一使用同一适应证、同一治疗线的晚期NSCLC新使用者案例：A1启动研究药A、A0启动活性对照B，两者均为治疗；X0高预后风险、X1低；Y1为12个月内疾病进展或全因死亡，每人最多计一次。初始策略效应、时间零点、完整结局假定及混杂边界见RWS_CASE_PROTOCOL.md。默认+20pp是终点风险增加，不是疗效获益，不能据此单独判断安全性。临床标签集中于zh/src/case-context.js，数据和数值配置仍由shared唯一维护。CSV规范名rws-counts.csv/rws-records.csv；历史记录保留旧名。Julia首讲的局部变量events取代hospitalisations，运算及输出字段不变，逐行稿/fixture/哈希须同步。

## 符号回看显示方式（2026-10-15用户更新）

按用户最新要求，网页中的符号回看由默认嵌入长段落改为就地按钮与悬浮窗，取代此前对该类回看“默认可见”的呈现约定；不是删除释义。桌面悬停/焦点、键盘Enter/Esc、触屏点按均须可用，浮窗可移入阅读/滚动、能关闭、限于视窗，并在换章或折叠答案时关闭。正文关键推导、低先修的解释桥梁及Julia逐行说明继续保留在主线；原Markdown的符号回看文字和TeX完整保留。
