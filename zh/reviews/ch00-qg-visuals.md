# 第0章Q/g首次图示：独立数学与教学审查

审查日期：2026-10-17。审查范围仅为第0章首次Q/g图示及其直接数据接口；不沿用历史验收。结论：数学、教学源结构及独立数值核查通过；1项教学问题已关闭，无未关闭的数学或教学阻断项。最终CSS及caption修复已复核，数学数据源码哈希不变。lead实际执行的浏览器验收证据另列归属，本审查者未冒称亲自运行。

## 预先固定的验收门槛

1. 先分清总体函数与样本拟合函数：Q(a,w)为条件30日死亡概率，g(w)为接受RHC概率；图中实际拟合结果使用帽号。
2. 拟合与调用分开：全5735人以(W,A)预测Y拟合Q̂，以W预测A拟合ĝ。固定函数调用时，Q̂仅读取W和指定预测a，ĝ仅读取W；不得将Y送入预测或把A送入ĝ。
3. 实际A/Y原列保留。Q̂(1,W)与Q̂(0,W)固定同一患者W、行序及已拟合系数，只改变预测输入a；ĝ(W)没有处理臂切换。
4. 图用同源真实患者对象展示“哪些列进入何函数、输出哪列概率”，不能仅依赖文字比较表。展示6行必须标为全队列预览，分页不得重新拟合。
5. 原始15个基线变量与含截距、年龄标准化、race展开的17列设计矩阵分清；省略预览列需明说，不把预览宽度冒充实际维数。
6. 输出是拟合概率，既不是个人0/1结局，也不是同一人已观测的两种潜在结局；两臂预测差不自动成为个体因果效应，因果识别仍依赖既有条件。

## 已阅读的直接接口

- `zh/docs/COURSE_CONTRACT.md`：数学角色、对象化图示和第0章函数入口约定。
- `zh/docs/chapters/ch00.md`：末尾Q/g首次引入与前次集成交接。
- `zh/src/chapters/ch00.md`：§3首次Q/g定义及后续标准化目标。
- `shared/js/object-data.js`：同源患者、17列设计、原15变量、两臂预测与分页接口。
- `shared/js/rhc.js`：`prepareRhc`使用全输入队列拟合，Q以设计加实际A拟合Y，g以设计拟合A；两臂预测以同一设计分别附0/1。

## 实现审查与关闭证据

- `shared/js/qg-lesson.js:55–79`保留来源顺序的首六行；真实a/y与预测输入分开存放。Q的`inputRows`仅含行键、w、指定`predictionA`，g仅含行键、w。所有输出直接复制已有全队列拟合结果，不重新拟合或计算可见六人的概率。
- `zh/renderers/course.js:23–24`以完整原CSV生成`objectLessonData(parsedRhc,prepareRhc(parsedRhc))`。`shared/js/rhc.js`的`prepareRhc`以17列设计拟合实际A，以同一设计加实际A拟合Y；两臂预测只替换设计末列0/1。不存在将Y作为预测输入或将实际A输入g的路径。
- `zh/renderers/qg-visual.js:26–39`先独立保留真实W/A/Y，再展示一次固定函数调用，最后并排保留三列概率。三个阶段共享i，Q1/Q0共享W。函数块说明全5735人拟合后固定；展开说明区分拟合目标与调用输入。
- 维度与单位：W标题为5735×15原始基线，正文说明只预览3项、另外12项保留；展开明确17列含截距的设计，Q加处理列成为18列。输出为5735×1逐人概率；年龄单位为岁，原A/Y为0/1编码。当前源明确年龄一位小数、概率六位小数均仅为显示近似，计算保留原始精度。
- 帽号、未知总体、两种输出预测不同事件、固定W改变a、非已观察双潜在结局、非个体因果效应均有就地说明。原§3的识别假设和调整集合边界保留。

已关闭P2：初稿以可见“＋”连接5735×15的W与5735×1的预测处理列，容易误教成矩阵加法。修复后`zh/renderers/qg-visual.js:23–24`可见文字为“按列拼接”，同时明确“不做数值加法”；`zh/src/qg-visual.css`新增`.qg-join`排版。已重新读取最终源确认关闭。

最终补核：`.qg-model>span`仅作用于函数块的直接子span，避免改变KaTeX内部span布局；函数框高度固定150px，定位中心与患者body中心对应。函数框caption现为“全5735人拟合 · 现固定”，保留全队列拟合与固定调用的意思。此轮未改`rhc.js`、`object-data.js`、`qg-lesson.js`或章正文，其SHA-256与前次独立数值核查完全相同，不需重复计算相同预测。

## 本审查者实际运行的核查

使用bundled Node执行独立内存断言及`node --test tests/qg-lesson.test.js`，后者8/8通过。独立断言逐一核对：

- 原CSV为5735行，展示行严格为1—6；所有真实A/Y/W与同源数据逐行一致。
- 对全5735人独立以拟合系数重算`expit([design,a]βQ)`与`expit(designβg)`，三列概率最大绝对差为`1.1102230246251565e-16`。
- 所有Q/g调用输入对象不含观测a/y；保持已拟合函数与预测后，翻转仅供保留核对的A/Y列不改变三列预测。
- 输入分页改为`start:120,count:2`，该图仍保留同样首六人；所有源数据在adapter和renderer调用前后JSON完全相同。
- 渲染结果存在三种独立调用，替换marker且注明全5735人拟合。

数值例：第1行真实A=0、Y=0，但Q̂(1,w₁)=0.47880899035699953、Q̂(0,w₁)=0.38035860731336363、ĝ(w₁)=0.24552470711004298。概率不被实际结局或实际A覆盖，正好支持图中“观测值与条件概率不同”的解释。

## 精确源码快照（SHA-256）

以下为本审查实际读取的冻结快照；这些文件如再有实质修改，应重新核查，不能直接继承本次通过。

| 文件 | SHA-256 |
| --- | --- |
| `shared/data/public/rhc/source.csv` | `9ef4ab578be4b40ad5d97d3a7e08ffdc1f9f76aeeefee51b4996e4221556f8e8` |
| `shared/js/rhc.js` | `ef1cdeeb37aeed14fb240a7b742b0bb4d800bd0d2c801d0f7eddf04795b8612b` |
| `shared/js/object-data.js` | `48ea38a49844ba1110dc04f07ed51a49d1c4198c1ffc72491873655601cb1432` |
| `shared/js/qg-lesson.js` | `b648ec36230d2e53e095ca97524d199fd5e8db92bbc1c8cdafceec017dd22782` |
| `zh/src/chapters/ch00.md` | `bfb8961cf276414a1ca3a496fe906020b6ae62b616e2d949a02f9195a571a00e` |
| `zh/renderers/qg-visual.js` | `6d8825bbe0ac4444b2c507e9bada772bd8429f4641542a5a0c6594aaaf2d1864` |
| `zh/src/qg-visual.js` | `a3b42862537af1dd3bfbb4dc69bd4d6a4684cb43912cc15b4c09aebf14126dfa` |
| `zh/src/qg-visual.css` | `ec4aeac911cc5340c97ec944bd8ea0b537f47a129e756a63574f20d7374e604f` |
| `zh/renderers/course.js` | `b19cfa955d16227f1847f61438aaf8a2821f05f0bac4fa483bd8b5f9ac578462` |
| `tests/qg-lesson.test.js` | `1b7b344d8032edb06f73820ca26fccc5d171c835c40a4749b2b7f27979422055` |
| `tests/zh/qg-visual-browser.cjs` | `e6ae2dfcc4c1f6d4197b4e8cadec9071d2877854a89dfe98b5ea016a5e477cbf` |

## lead运行的浏览器及集成证据

以下由lead在本轮实际运行后报告，本审查者读取了最终专测源码、确认对应截图文件存在；没有自行重跑浏览器：

- `tests/zh/qg-visual-browser.cjs`在installed Chrome headless的1360×950与375×950通过。专测核对真实原始A/Y/W、18个概率值、三个调用的输入列角色、逐行top、函数框150px及中心位置、同行高亮、12项history、键盘展开与reset、局部键盘滚动、MathML、无文档溢出、无页面错误和无外部请求。
- 截图为`output/zh/playwright/qg-call-{q1,q0,g}-{1360,375}.png`以及`qg-full-{1360,375}.png`，八个文件已确认存在。它们属于lead浏览器运行产物。
- lead报告全JS测试165/165通过；原IF专测及九章RHC回归均在1360和375两个viewport通过。集成运行的正式记录由lead写入`zh/docs/VERIFICATION.json`，不将其计为本审查者亲自执行的测试。

## 证据边界

本审查者没有运行浏览器。上述独立教学通过指源结构、措辞及运算对象关系；桌面与375px浏览器布局、键盘操作及图形对齐的通过归属于lead实际验收，并由lead记录于`zh/docs/VERIFICATION.json`。未验证实体手机或学习成效。
