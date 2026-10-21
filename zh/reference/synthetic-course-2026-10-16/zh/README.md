# EIF：从分布到估计，再亲手构建TMLE

新增[真实公开RWS资料页](http://127.0.0.1:4174/zh/public-data.html)：已接入Ng等2021的107条真实肺癌用药记录，原CSV、署名许可和SHA-256均保留。提供浏览器筛选及Julia读取核查。当前仅为真实资料练习；PFS时间/状态和删失定义尚未验证，未替换下文八讲合成表。用户已明确真实公开RWS优先，可调整病种或终点；后续须先解决设计与字段语义，再实施临床估计。

运行`julia --startup-file=no --history-file=no zh/julia/public_data_audit.jl all 12`复算真实文件；`tests/julia/public-rws-tests.jl`验证源数据和拒绝未验证终点的行为。候选及取舍见`docs/data/OPEN_ONCOLOGY_CANDIDATES.md`，独立审查见`reviews/public-data-design.md`。


中文交互课程，面向只学过基础应用生物统计、尚未系统学习半参数统计的读者。先明确估计目标与识别，再从均值的概率权重变化出发构建IF，逐步推导并验证ATE的EIF，理解切空间、效率界和估计误差，最后用Julia完成一次可逐行复算的TMLE。微积分、条件期望、加权几何与渐近记号随问题解释，不要求提前掌握半参数理论。

全书保留原有完整推导、图示、预测题、带理由的展开答案和独立状态的交互。新增贯穿主线使用**同一份200条明确标注的合成RWS记录**，不是真实药物疗效或安全性证据；每讲完成一个具体计算。教学代码使用Julia，不调用TMLE软件包。

## 打开课程

已构建的中文版页面在`dist/zh/`；以下命令均在同时包含`shared/`、`zh/`和`scripts/`的项目根目录运行，无需构建即可本地阅读：

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

打开[课程入口](http://127.0.0.1:4173/zh/#chapter-0)。当前Codex会话已有[4174课程服务](http://127.0.0.1:4174/zh/?edition=case-study#chapter-0)。保留原来的`#chapter-1`到`#chapter-8`深链接。

所有公式、字体、数据和计算都在本地，无登录、API key、追踪或真实患者数据。公式保留可编辑TeX与可访问MathML；宽公式、表格和代码可聚焦后用左右键滚动。第一章完整的16幅计算图、26组公式及47条原局部回看继续保留，新增案例公式也有就地符号及代数解释。

## 第一讲的Julia零基础样板

第一讲在原有数学推导之后，增加默认可见的逐行讲解：32个非空源码行各有中文解释，说明输入/输出及对应数学符号；两张计算账本分别跟踪事件累计与概率加权贡献。先给终端命令与文件关系，再区分函数定义/调用、赋值、字段、向量、循环、return、println及舍入；无需Julia基础。显示实际运行输出，并用预测题检查“格人数/总人数”“风险/影响值平均”是否分清。

编辑`zh/src/julia/ch01-walkthrough.md`修改讲解，`shared/julia/EIFCase.jl`的CH01和`zh/julia/lessons/ch01.jl`是真实实现；行卡片在构建时从源码提取，源码改变但解释未同步会明确失败。本轮只完成第一讲样板；其他讲保留原有Julia代码，逐行讲解不计已完成。

## 用同一个上市后RWS案例逐讲积累

临床问题：在同一适应证、同一治疗线且A/B均可选的晚期非小细胞肺癌新使用者中，首次启动匿名已上市研究药物A，与首次启动活性对照药物B相比，12个月内疾病进展或全因死亡的风险差是多少？X=0/1表示高/低基线预后风险；A=1/0表示启动研究药A/活性对照B；Y=1表示任一终点事件发生，每人最多计1次。随访从首次给药开始，即使后来停换药仍记录结局，比较初始策略而非持续用药效应。教学假定结局完整及X足以控制基线混杂，不按将来随访完整与否选人。案例数据固定，控件与reset不改变输入。

| 讲次 | 这一步实际留下什么 |
| --- | --- |
| 0 | 明确目标、人群、识别条件，下载同一张合成频数表 |
| 1 | 从116/200得到整体终点事件风险，再用Y减均值得到二元均值IF |
| 2 | 选定八格中的一格，核对质量守恒方向、score与均值梯度配对 |
| 3 | 从组人数/事件数得到经验X、g、观察风险与仅按A拟合的初始Q |
| 4 | 从目标推导H，逐组算残差贡献，保存初始拟合梯度样本平均0.24 |
| 5 | 对八个点方向和七个独立对比，重算扰动目标验证ATE梯度 |
| 6 | 在已知g的假设模型内实际加权投影，解释canonical gradient的选择 |
| 7 | 区分初始函数和饱和经验梯度，逐项算均值、二阶矩、中心方差和SE |
| 8 | 手填ε、单步二分、更新四个Q、重新plug-in，检查经验EIF方程并重算矩 |

第1—2讲直接用同一200人的二元事件风险（116/200），从时间窗编码、概率重分配、完整消项推导均值IF，并连接12个月无进展生存概率（84/200）的IF。状态未知的删失者不能编码成无事件；此处没有推导删失生存EIF。第3—8讲继续复用唯一八单元模型。第6讲投影是梯度选择/验证工具，不是最终TMLE必须额外执行的步骤。案例与独立的总体机制实验明确分开。

## 用Julia运行与修改

只用Julia Base及标准库LinearAlgebra、Printf、Test，已实际验证Julia 1.12.5。保留`zh/`与`shared/`的相对位置，在项目根目录执行：

```sh
julia --startup-file=no --history-file=no zh/julia/lessons/ch01.jl
julia --startup-file=no --history-file=no zh/julia/lessons/ch08.jl
julia --startup-file=no --history-file=no tests/julia/runtests.jl
```

`ch01.jl`至`ch08.jl`都可以独立运行。每讲网页展开的函数定义直接取自`shared/julia/EIFCase.jl`中对应的CH01—CH08标记段，调用例子直接取自实际lesson文件；可复制代码不是另一套硬编码示范。第8讲`manual_tmle`明确写出试探、二分和失败检查，能逐行打印迭代；完整模块提供同样底层计算的自动复算接口。

```sh
# 整套估计输出为key,value；可选传入另一张完整正计数CSV
julia --startup-file=no --history-file=no zh/julia/run_case.jl shared/data/rws-counts.csv
```

脚本从自身目录定位默认数据，绝对路径启动不依赖当前目录。若受限环境不能写用户缓存，可设置`JULIA_DEPOT_PATH=/private/tmp/eif-tutorial-julia-depot`；若juliaup启动器因锁权限失败，用已有安装中真实Julia二进制替代启动器，无需安装包。标签为0/1，Julia数组从1开始，Q使用`q[a+1,x+1]`。

数据和接口说明见[案例说明](case-study/README.md)、[Julia运行说明](julia/README.md)及[全书案例约定](docs/CASE_STUDY.md)。

## 编辑、构建与验证

正文和公式编辑`zh/src/chapters/chXX.md`。教学实现编辑`shared/julia/EIFCase.jl`与`zh/julia/lessons/`；浏览器交互由纯JavaScript镜像计算，和Julia对独立参考值及修改后的计数交叉核验。`shared/js/math.js`保留唯一总体配置，`shared/js/case-study.js`只从传入计数学习样本拟合，`zh/src/case-workbench.js`负责界面。

Node.js 20+与pnpm环境可先运行`pnpm install --frozen-lockfile`；当前workspace已安装依赖：

```sh
sh scripts/node.sh scripts/build.js
sh scripts/node.sh --test tests/*.test.js tests/zh/*.test.js
```

构建生成`dist/zh/index.html`（根入口自动跳转）、包含实际Julia代码的可编辑合订讲义`dist/zh/EIF_Tutorial.md`、Julia源文件和CSV下载。KaTeX使用本地资源。句中公式写成`$\Psi(P_t)$`，独立公式使用`$$...$$`；新增独立公式后保留就地“符号回看/这一步”，网页以悬停、聚焦或点按浮窗呈现，原Markdown仍可直接阅读。

保持本地服务运行并已安装Google Chrome，可运行真实浏览器检查：

```sh
EIF_URL=http://127.0.0.1:4174 sh scripts/node.sh tests/zh/browser.cjs
EIF_URL=http://127.0.0.1:4174 sh scripts/node.sh tests/zh/case-browser.cjs
# 只检查当前整合章时，例如第8讲
CASE_CHAPTERS=8 EIF_URL=http://127.0.0.1:4174 sh scripts/node.sh tests/zh/case-browser.cjs
# Julia在PATH中时的跨语言核对；也可设置JULIA_BIN为已有二进制绝对路径
sh scripts/node.sh tests/cross-language.cjs
# 第一讲逐行样板：同源32行、公式、账本、输出和键盘/布局
EIF_URL=http://127.0.0.1:4174 sh scripts/node.sh tests/zh/ch01-julia-browser.cjs
```

JS断言覆盖概率、独立有限差分、纯g路径不变性、score配对、投影、方差、总体DR与TMLE，以及样本计数拟合/求根/输入失败。Julia标准库测试覆盖相同关键数学与逐讲接口；跨语言另测默认表和两组改变计数的fixture。浏览器核对桌面1360×900与手机375×900布局、公式/回看、真实操作/reset/隔离、数据下载、网页Julia与源文件逐字相同、键盘滚动、console及无外部请求。

实际运行结果见[进度](docs/PROGRESS.md)和[验证清单](docs/VERIFICATION.json)，完整逐章独立数学/教学审查见`reviews/case-study-mathematics.md`和`reviews/case-study-pedagogy.md`。截图不是数学正确性的替代证据，也不冒称已进行实体手机、完整屏幕阅读器语音或真实初学者学习成效研究。

## 数学与数据边界

固定计数刻意使经验分布等于原教学模型；算法本身只读取观察计数，改变输入会改变估计。当前实现教学域要求八格完整且每格正整数；缺格、零单元、非法值及未收敛明确失败，不静默clipping。

默认案例初始风险差−0.04、平均score 0.24；求得ε约0.162239239635，更新后风险差0.20。这是当前表的可复算结果，不是有限样本无偏的证明。初始Q刻意忽略X，一参数更新不保证恢复全部条件风险；更新函数的经验SE只作计算演示，不据此给有效置信区间。饱和标准化与TMLE在本表的点估计相同，也不自动使误设Q所插入的SE正确。第7—8讲保留误差展开、余项、拟合一致性及cross-fitting条件的解释。

因果解释仍需consistency、conditional exchangeability及positivity等识别条件；EIF不能修复未测混杂。双重稳健、Neyman orthogonality、效率和有效推断分别说明条件。第8讲保留TMLE未必在每次有限样本比较中优于AIPW的总体对照。

## 来源、原件与交付

`docs/COURSE_CONTRACT.md`记录读者、符号及共享边界；`docs/chapters/`逐章brief和handoff；`docs/SOURCES.md`记录固定版本的原始论文与核验位置，主要为Hines等EIF教程、Fisher与Kennedy几何教程、Hernán与Robins识别教材。用户提供的causalit文章用于问题先行、数字连接符号的讲解风格，不作为未经核验的数学答案，见`docs/STYLE_GUIDE.md`与`reviews/style-reference.md`。

原材料统一在`zh/reference/`保留，解包原件在`zh/reference/original/`；原ZIP七成员逐字节核对，未继承原型“已通过测试”的陈述。指定的`Codex_Prompt_EIF_Tutorial_MultiAgent.md`此前定位未找到，记录于原型审计；以用户完整验收要求补充brief。本目录没有Git仓库，未生成commit或PR。上一版README与验收历史留在docs，不把旧测试数字当作本版结论。

```sh
EIF_URL=http://127.0.0.1:4174 sh scripts/node.sh tests/zh/rws-browser.cjs
EIF_URL=http://127.0.0.1:4174 sh scripts/node.sh tests/zh/recall-popovers-browser.cjs
python3 scripts/package.py
```

交付`releases/EIF_Tutorial_Complete.zip`及`.sha256`，包含可运行课程、正文/TeX/Julia/JS源、CSV、测试、逐章审查、实际截图和原始材料；依赖目录不打包。仅本地服务，无部署。

本轮案例专业化说明见[案例方案](docs/RWS_CASE_PROTOCOL.md)。固定数据与数学数值保留；CSV现名为shared/data/rws-counts.csv与rws-records.csv，旧followup文件名只见于历史记录。默认标准化风险差+20pp是不利疗效方向；该终点未单独评价药物安全性。

符号回看现在默认显示紧凑按钮：鼠标悬停或键盘聚焦查看，点按可保持打开；Esc、关闭按钮或外点关闭。手机使用点按。浮窗内保留全部符号解释、运算回看与可访问数学。核心推导与Julia逐行说明仍在正文。
