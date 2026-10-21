# 对象化运算的数据接口

`shared/js/object-data.js`只计算可展示对象，不生成HTML、CSS或展示用的舍入数值。唯一的观察数据输入是`readRhc(source.csv)`得到的有序记录，默认拟合沿用`prepareRhc(rows)`。不读取模拟样本、冻结的RHC汇总常数或图片里的数值。

## 入口与行对应

```js
import {objectLessonData, meanContamination} from '../../../shared/js/object-data.js';
const data = objectLessonData(rows, prepared, {start: 0, count: 6});
const change = meanContamination(data, {z: 1, t: 0.1});
```

第二个拟合参数可省略，函数会对所有传入记录重新拟合。已有拟合必须与传入记录的人数、顺序和用于分析的数值相符；旧拟合与改变后的观察值混用会报错。改变数据后重新调用默认入口会重新计算人数、均值、设计矩阵和预测，结果不固定为公开队列的数值。

`n`与`fullN`是所有输入患者的人数；公开原始队列为5735。`displayIndices`为从0开始的展示下标，`rowNumbers`为从1开始的原记录位置。`shown`顺序与这两个数组完全相同，每条含`index,rowNumber,x,a,y,age,race,history,w,g,q0,q1,qa,riskDifference,influence`。首窗`start=0,count=6`显示原第1—6行；下一窗`start=6,count=6`显示第7—12行。没有筛选、重排、补值或将展示行当成拟合样本。窗口只控制`shown`，所有全长数组、拟合参数及平均值仍使用完整队列。末窗实际行数为`count`，原请求保留为`requestedCount`。

首六行的真实治疗列为`[0,1,1,0,1,0]`，真实结局列为`[0,0,0,0,1,0]`。这些是原数据的实际记录，不是为了配色重新排序的例子。

## 第0章：矩阵、逐人向量、标量

| 字段 | 维度 | 含义 |
| --- | --- | --- |
| `baselineW` | n×15 | `[male,age,race,12项history]`；年龄保留原单位、种族保留字符串、性别由原读取器编码为0/1 |
| `W` / `X` | n×17 | `prepareRhc.X`的副本；截距、性别、标准化年龄、两个种族指示变量及12项病史 |
| `A` / `a` | n×1 | 真实观察到的治疗，不被全0或全1预测输入替换 |
| `Y` / `y` | n×1 | 真实观察到的30天死亡结局 |
| `g,q0,q1` | 各n×1 | 同一个完整队列拟合生成的倾向概率及全A=0/全A=1结局预测 |
| `predictionA0,predictionA1` | 各n×1 | 全0/全1的预测输入，独立于真实A，不改写观察记录 |
| `gCoefficients,qCoefficients` | 17×1、18×1 | 当前同一个拟合的系数副本；结局模型的末项对应治疗列A |
| `qa` | n×1 | 第i行按真实`A[i]`从`q1[i]`或`q0[i]`选择 |
| `riskDifference` | n×1 | `q1−q0`逐行相减后的向量 |
| `initialRiskDifference` / `initialEstimate` | 标量 | 对上一个完整n维向量取平均，公开队列约为0.0864988559023306 |

`featureNames`、`baselineFeatureNames`分别描述两种矩阵；不能将15个未展开基线变量标为17列设计矩阵。`ageMean`与`ageSd`来自完整拟合，与分页无关。原始CSV有63列；这里的15列基线矩阵不能标为完整原始CSV。`shown.w`是17列设计矩阵的对应行。结局预测可逐行核对`expit(dot([...W[i],a],qCoefficients))`，其中a为0或1；不需要第二次拟合。

## 第1章：患者行与两结局行

`mean`的字段为`n,sumY,meanY,risk,D,meanD`。其中`meanY=risk=sumY/n`；`D=Y−meanY`是n个真实患者对应的向量；`meanD`是其患者平均。公开队列的事件人数为1918，均值为1918/5735。

`grouped`另外描述同一二元结局的经验分布，`n=2`指两个结局支持点，`patientN=5735`才是对应患者数，`alignment='outcome'`。字段为`values/y=[0,1]`、`counts=[3817,1918]`、`p/probabilities=counts/patientN`、`py=p⊙y`、`D=y−meanY`、`pD=p⊙D`、`meanY=sum(py)`和`meanD=sum(pD)`。这两行不是从5735名患者只抽出两名，也不是Julia旧`mean_if(coarse_data)`的八个联合单元。此三种维度必须分别标注。

## 分布污染

`meanContamination`可以接收上述`data`，也可直接接收已解析观察记录，后者无需拟合。输入`{z,t}`中`z∈{0,1}`；概率合法性沿用`math.contaminate`的显式检查，包括合法的局部负t。

输出始终只有两个结局支持点，`n=2,patientN=原队列人数,alignment='outcome'`。不生成新患者、不改变观察到的Y、不把概率质量解释成整数患者。

| 字段 | 计算 |
| --- | --- |
| `p,y` | 原始两结局概率及支持点 |
| `retainedP` | `(1−t)p` |
| `pointP` | 点质量`δ_z` |
| `addedP` | `tδ_z` |
| `newP` | `retainedP+addedP` |
| `originalMean,newMean` | 原分布/新分布分别对y加权 |
| `delta,derivative,linearMean` | 新均值减旧均值、`z−μ`、`μ+t(z−μ)` |
| `rate` | `delta/t`；t=0时为`null`，不冒充定义出来的差商 |
| `originalD,newD` | `y−originalMean`与`y−newMean`两个不同中心 |
| `weightedY` | `newP⊙y` |
| `weightedOldD,oldMeanD` | `newP⊙originalD`及其和；一般等于`t(z−μ)`而非0 |
| `weightedNewD,newMeanD` | `newP⊙newD`及其和；新的中心化恒等式为0 |
| `originalMeanD` | `p⊙originalD`的和 |

不应将`oldMeanD`与`newMeanD`混在同一标量框中。小量浮点误差保留在数据中，只在展示层舍入。

## 对象元数据

`objects`各条含`id,colourKey,kind,symbol,label,dimensions,alignment,values`。`kind`区分`matrix/vector/scalar`；标量维度使用空数组`[]`，患者向量为`[n,1]`，两结局向量为`[2,1]`。`alignment`为`patient/outcome/cohort/feature`，避免同样画成细列后混淆行含义。系数使用`feature`，其`featureKeys`分别为17项设计特征以及17项设计特征再加A。展示颜色由共享渲染器集中规定，模块不定义CSS或十六进制颜色。

规范ID为`outcomes,treatment-vector,design-matrix,baseline-w,propensity,q0,q1,qa,risk-difference,prediction-a0,prediction-a1,q-coefficients,g-coefficients,influence,probability,support-y,support-influence,mean-contribution,if-contribution,risk,risk-scalar,events,sample-size,mean-influence`。为公式渲染保留的简写键`y,a,design,g,p,y-support,D,contrib,influence-contrib,scalar`以及`outcome-vector`均指向相同元数据对象，不另外保存另一份数值真相。相同ID跨分页保持不变。

`objects.qa.sourceIds[i]`是对应行的`q1`或`q0`；`selection='observed-treatment'`。渲染器应按该来源保持对应预测的颜色，并保留`qa`的变量名与选择运算标签。

## 检查

```sh
sh scripts/node.sh --test tests/object-data.test.js
```

七项测试以原CSV的独立字段检查人数、事件数、首六行A/Y/年龄、原行位置；检查两个展示窗口共享完整拟合与全队列均值；验证17/15列区别、逐行Q选择、逐人差值及全样本平均；分别检查患者n维和支持点2维；检查新概率对固定旧D与新D的不同期望；对改变Y且缩小到1000人的原始子队列重新拟合；拒绝陈旧、乱序、维度不合的拟合及非法概率。输出对象不会改写输入记录或拟合数组。
