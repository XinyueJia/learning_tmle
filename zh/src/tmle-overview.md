<!-- tmle-step:0 -->
### ① 保留三列初始风险预测

前面已经拟合了结局回归。现在把它的输出接到患者表中：实际处理下的预测用来计算残差；两种处理下的预测用来比较同一基线人群的风险。三列都来自同一个初始$Q$。

$$
\widehat Q_{A,i}=\widehat Q(A_i,W_i),\qquad
\widehat Q_{1,i}=\widehat Q(1,W_i),\qquad
\widehat Q_{0,i}=\widehat Q(0,W_i).
$$

> **符号回看：** $i$为原患者行号；$W_i$为该人的基线，$A_i$为实际处理。$\widehat Q_{A,i}$用于和实际结局$Y_i$比较；$\widehat Q_{1,i}$、$\widehat Q_{0,i}$分别在输入RHC和未RHC时预测死亡风险。下标0和1表示处理水平，帽号表示已拟合，所有预测均为概率。

**交给下一步：** 一列实际处理下的预测，以及两列供标准化使用的预测。

<!-- tmle-step:1 -->
### ② 从AIPW的加权残差提取$H$

第①步保留了初始风险预测。回到本章第2节的AIPW：它先计算标准化风险差，再加上逐人加权残差$C_i$的平均。前面按RHC与未RHC分组定义的$C_i$，可以合在一行写：

$$
C_i=\underbrace{\left\{\frac{A_i}{\widehat g_i}
-\frac{1-A_i}{1-\widehat g_i}\right\}}_{H_{A,i}}
(Y_i-\widehat Q_{A,i}).
$$

> **符号回看：** $C_i$是第$i$人的校正贡献；$Y_i$是实际死亡结局，$\widehat Q_{A,i}=\widehat Q(A_i,W_i)$是初始预测。$\widehat g_i=\widehat g(W_i)$是拟合RHC概率；$A_i$取0或1，因此花括号自动选中相应组的权重。我们把这个残差前的系数记为$H_{A,i}$。

**$H_{A,i}$就是前面IPW的带符号逆概率权重。** IPW用它乘实际结局，AIPW用它乘“实际结局减初始预测”。为后面更新两臂预测，分别保留两种输入下的系数：

$$
H_{1,i}=\frac1{\widehat g_i},\qquad
H_{0,i}=-\frac1{1-\widehat g_i},\qquad
H_{A,i}=A_iH_{1,i}+(1-A_i)H_{0,i}.
$$

> **符号回看：** $H_{1,i}$、$H_{0,i}$分别对应输入RHC与未RHC，$H_{A,i}$按实际处理选其中一个。$H$无量纲；负号来自“RHC风险减未RHC风险”。在TMLE更新中，这个系数称为clever covariate（巧妙协变量）。

<div class="tmle-ipw-placeholder"></div>

**现在把同一项$C_i$放回初始拟合EIF。** 它还要加上个人预测风险差相对全体平均的偏离：

$$
\widehat D_i^{\mathrm{init}}
=\underbrace{C_i}_{H_{A,i}(Y_i-\widehat Q_{A,i})}
+(\widehat Q_{1,i}-\widehat Q_{0,i})
-\widehat\psi_{\mathrm{gcomp}}.
$$

> **符号回看：** $\widehat D_i^{\mathrm{init}}$是初始拟合EIF对第$i$条记录的输出；$\widehat Q_{1,i}-\widehat Q_{0,i}$是该人的初始预测风险差，$\widehat\psi_{\mathrm{gcomp}}$是全部5735人预测风险差的平均。这里所有$Q$、$g$及中心值均来自初始拟合。

所以，逐人的EIF输出一般与$C_i$不同；对全体取平均，额外的中心化项才会消掉。将每一项分别求和：

$$
\begin{aligned}
\frac1n\sum_{i=1}^n\widehat D_i^{\mathrm{init}}
&=\frac1n\sum_{i=1}^n C_i
 +\frac1n\sum_{i=1}^n(\widehat Q_{1,i}-\widehat Q_{0,i})
 -\frac1n\sum_{i=1}^n\widehat\psi_{\mathrm{gcomp}}\\
&=\frac1n\sum_{i=1}^n C_i
 +\widehat\psi_{\mathrm{gcomp}}
 -\frac n n\widehat\psi_{\mathrm{gcomp}}\\
&=\frac1n\sum_{i=1}^n C_i.
\end{aligned}
$$

> **符号回看：** $n=5735$；求和覆盖全部患者。第二行中，预测风险差的平均按定义等于$\widehat\psi_{\mathrm{gcomp}}$；最后一项则把同一个中心值加了$n$次，再除以$n$。相消的是这两项，加权残差平均仍可非零。

这里可以分清三个对象：$\widehat\psi_{\mathrm{gcomp}}$是由初始$\widehat Q$得到的一个风险差估计；$\widehat D^{\mathrm{init}}$是由初始$\widehat Q$、$\widehat g$和这个中心值组成的函数；将它对5735位患者的输出取平均，再加回初始估计，得到**一步估计（one-step estimation）**。在当前标准化风险差的设定下，这个一步估计恰好就是AIPW：

$$
\begin{aligned}
\widehat\psi_{\mathrm{one\text{-}step}}=\widehat\psi_{\mathrm{AIPW}}
&=\widehat\psi_{\mathrm{gcomp}}
 +\frac1n\sum_{i=1}^n\widehat D_i^{\mathrm{init}}\\
&=\widehat\psi_{\mathrm{gcomp}}+\frac1n\sum_{i=1}^n C_i\\
&=\frac1n\sum_{i=1}^n
 \{\widehat Q_{1,i}-\widehat Q_{0,i}+C_i\}.
\end{aligned}
$$

> **符号回看：** $\widehat\psi_{\mathrm{one\text{-}step}}$与$\widehat\psi_{\mathrm{AIPW}}$在这里是同一个最终点估计；$\widehat\psi_{\mathrm{gcomp}}$是校正前的初始估计，$\widehat D_i^{\mathrm{init}}$是初始EIF对第$i$人的输出，$C_i$是该人的加权残差。$n=5735$，求和后除以$n$表示对全体患者取平均；帽号表示拟合或样本计算，风险差乘100后以百分点表示。

<div class="tmle-eif-aipw-placeholder"></div>

**“一步”指在完成初始拟合后，作一次EIF校正。**

**TMLE从相同的初始拟合出发，把校正落实到预测函数上。** AIPW的一步估计保留初始预测，直接得到校正后的数值；TMLE保留$\widehat g$，沿同一个$H$更新$\widehat Q$，再用更新后的预测重新标准化。把$H$设为logistic更新的协变量，score就是$H$乘更新后的残差。下一步将用这个回归拟合更新幅度，使加权残差的全体平均接近0。

<!-- tmle-step:2 -->
### ③ 拟合一次只有一个系数的logistic回归

这里的“更新$Q$”，指把**条件均值函数的初始估计$\widehat Q$变成新的估计函数$\widehat Q^*$**。可以分清三个层次：

- **初始模型参数固定。** 本例初始logistic回归已拟合的所有系数$\widehat\beta$保持原值，初始$g$也固定。
- **新增一个待估系数。** $\varepsilon$（fluctuation parameter，波动参数）控制沿$H$方向的共同调整幅度。
- **新函数产生新预测。** 拟合得到$\widehat\varepsilon$后，初始$Q$与这项调整共同定义$\widehat Q^*$；表中的更新预测是新函数在每位患者输入上的取值。

具体做法是：把初始预测的logit作为offset（固定偏置项），以实际死亡结局$Y$为响应、$H$为唯一协变量，拟合**不额外加截距**的logistic回归。对任意输入$(a,w)$，这族预测函数写成：

$$
\operatorname{logit}Q_\varepsilon(a,w)
=\underbrace{\operatorname{logit}\widehat Q(a,w)}_{\text{保留初始模型}}
+\underbrace{\varepsilon H(a,w)}_{\text{新增的调整项}}.
$$

> **符号回看：** $a$是0或1的处理输入，$w$是基线输入；$H(a,w)$是第②步$H$对任意这类输入的写法。$Q_\varepsilon$是给定$\varepsilon$后的条件均值估计函数，$\varepsilon=0$时回到$\widehat Q$。拟合时输入实际$(A_i,W_i)$，得到逐人offset和$H_{A,i}$；offset系数固定为1。唯一待估系数$\varepsilon$在全体患者间共用；$\widehat Q^*=Q_{\widehat\varepsilon}$。logit作用于预测概率，回归响应仍是0/1的$Y_i$。

你熟悉的“协变量乘残差”score在这里就是$H$乘残差。拟合$\varepsilon$会让它的全样本平均接近0：

$$
\frac1n\sum_i H_{A,i}\{Y_i-Q_{\widehat\varepsilon}(A_i,W_i)\}\approx0.
$$

> **符号回看：** $n=5735$；$\widehat\varepsilon$是拟合完成的共同系数；花括号内是更新后的逐人残差。这是对$\varepsilon$的似然score方程，$H$由倾向评分构造。数值求解在容差内停止。

**为什么一个共同$\varepsilon$就够？** 当前要估计的是一个总体风险差。每次用当前$Q$重新标准化，EIF中“个人预测风险差减去全体平均”的那部分，经验平均自动为0。余下需要用更新解决的，就是上面这一条加权残差平均为0的方程。

在本例选定的logistic更新路径上，$H$固定，改变一个$\varepsilon$就能连续改变这个汇总数；下图展示了本次拟合找到的有限根。因此，一个$\varepsilon$足以完成这次针对目标的校正。这个判断依赖于我们选中了与EIF相配的方向，而不仅仅因为目标是一个数。$Q$在所有基线下的预测质量，仍需要靠初始回归的学习与模型检查。

**共同$\varepsilon$也会产生不同的逐人调整。** 每个人实际加到logit上的量是$\varepsilon$乘自己的$H$；符号、大小随处理和基线而变。下面用同一CSV的前两位患者对照，再看全5735人的方程如何接近0。

<div class="tmle-direction-placeholder"></div>

<!-- tmle-step:3 -->
### ④ 把同一个$\varepsilon$应用到两臂预测

第③步已经得到新的估计函数$\widehat Q^*$。现在分别输入每个人的$(1,W_i)$和$(0,W_i)$，算出两臂预测。每次求值都先将初始预测转成logit，加上同一个$\widehat\varepsilon$乘相应的$H$，再用expit转回概率。这里的expit是logit的反函数。

$$
\widehat Q^*_{a,i}
=\operatorname{expit}\{\operatorname{logit}\widehat Q_{a,i}
+\widehat\varepsilon H_{a,i}\},\qquad a\in\{0,1\}.
$$

> **符号回看：** $a$是本次输入的处理水平，$\widehat Q_{a,i}$与$H_{a,i}$取对应臂的那一列。星号表示更新后的$Q$；两臂共用第③步拟合的$\widehat\varepsilon$。更新在logit尺度相加，输出回到0到1之间的死亡概率。实际$W$、$A$、$Y$及初始$g$保持不变。

**交给下一步：** 更新后的两列死亡风险。下面可对照同一患者在更新前后经历的运算。

<!-- tmle-step:4 -->
### ⑤ 用更新后的$Q$重新标准化

现在回到最初的研究问题。对每个人，用更新后的RHC风险减去未RHC风险，再平均，就得到TMLE估计。它仍然是一个可以解释为“两种预测风险的平均差”的点估计。

$$
\widehat\psi_{\mathrm{TMLE}}=\frac1n\sum_{i=1}^n
(\widehat Q^*_{1,i}-\widehat Q^*_{0,i}).
$$

> **符号回看：** $\widehat\psi_{\mathrm{TMLE}}$是最终风险差；$\widehat Q^*_{1,i}$、$\widehat Q^*_{0,i}$是第④步更新后的两臂预测；平均覆盖全部$n=5735$人，结果乘100得到百分点。

**方程归零，究竟完成了什么？** 初始$Q$给出两种处理下的预测。实际死亡结局让我们计算每条记录的“实际结局减预测概率”残差，再查看这些残差怎样汇总。EIF中的$H$把它们按目标人群重新加权，再按“RHC减未RHC”汇总。这个平均值提供一项针对风险差的校正信息。

AIPW把它加到初始风险差上。TMLE则沿$H$更新$Q$，直到更新后的预测与实际结局在这项加权检查上吻合，再重新计算风险差。**归零表示这项样本内检查已满足；估计是否更接近真实目标，则是另一个需要真值才能直接判断的问题。**

<div class="tmle-calibration-placeholder"></div>

**为什么这种校正具有双重稳健性（double robustness）？** 可以沿着残差的来源理解：

- **$Q$正确时：** 在相同基线、相同处理下，预测就是平均死亡风险。这样的残差在总体中平均为0，再乘由处理与基线决定的$H$，平均仍为0。初始标准化已经给出目标；总体层面的校正不会把它推离目标。
- **$g$正确时：** 即使$Q$有偏差，正确的逆概率权重也能把各处理组观察到的残差，换算为共同目标人群中的平均预测偏差。将两臂的偏差相减，恰好补上初始风险差缺少的部分。
- **两者都有误差时：** 残差需要校正，而用于换算的权重也不准确，校正后可以留下偏差。其剩余部分同时涉及$Q$误差与$g$误差；AIPW这里涉及初始$Q$，TMLE则涉及更新后的$Q$。这就是为什么把其中一项估准会有帮助。

这里说的是对总体分布取平均的关系。AIPW直接使用这项校正；TMLE让更新后的$Q$满足同一结构的方程。对应到实际估计，双重稳健性是：在相应正则条件下，$Q$或$g$至少一个得到一致估计时，估计量随样本量增加趋向目标。有限样本还带有抽样误差，因而一次更新可能更接近，也可能更远离真实值。我们能从本次数据直接验证的是方程与计算；双重稳健解释的是这条校正为什么在上述条件下有用。

<details>
<summary>在已知参考分布中，方程归零后还能有偏差吗？</summary>

把这5735人的sex、RHC与30日死亡联合频率固定为一个**教学参考分布（reference distribution）**，记为$P_{\mathrm{ref}}$。现在只按sex调整，参考风险差可以直接算出。下面始终对这个固定分布取平均，以便单独观察$Q$、$g$误差的作用。

“$Q$正确”指使用参考分布中每个sex与处理组合的实际死亡比例；“$g$正确”指使用每个sex组的实际RHC比例。我们有意改动这些预测，分别制造三种情形。全部情形都采用相同的TMLE更新规则。

<div class="tmle-reference-placeholder"></div>

第三种情形中，方程已归零，TMLE仍偏离参考目标。这说明**解方程与消除全部估计误差不是同一件事**。前两种情形则展示了双重稳健的总体关系：有一项正确，就能回到参考目标。

图中的参考风险差只按sex调整；上面的实际分析使用更完整的$W$调整，两者对应不同的统计目标。$P_{\mathrm{ref}}$把本次样本频率当作已知概率；真实总体$P_0$仍然未知。这个对照展示校正机制，实际RHC分析的准确性还取决于模型拟合、抽样及因果识别条件。

<details>
<summary>回看参考实验怎样改变$Q$和$g$</summary>

sex取Female、Male的顺序。$Q$正确时使用四个参考死亡比例；$Q$有误差时，将未RHC预测分别增加0.12、0.06，将RHC预测分别减少0.06、0.12。$g$正确时使用两个参考RHC比例；第一种情形把两者都设为0.5，第三种情形把各自原值向0.5移动一半。所有预测仍在0到1之间。每种情形更新时，初始$Q$与$g$固定，只拟合共同$\varepsilon$，再用更新$Q$和固定$g$检查方程。

</details>
</details>

<!-- tmle-step:5 -->
### ⑥ 用更新后的EIF研究不确定性

得到点估计后，EIF还有第二个用途。把更新后的$Q$、固定的$g$与最终风险差代回EIF，给每位患者计算一个输出。它由“加权残差”和“个人预测风险差相对全体平均的偏离”相加组成：

$$
\widehat D_i=H_{A,i}(Y_i-\widehat Q^*_{A,i})
+(\widehat Q^*_{1,i}-\widehat Q^*_{0,i})-\widehat\psi_{\mathrm{TMLE}}.
$$

> **符号回看：** $\widehat D_i$是拟合EIF对第$i$条实际记录的输出；$\widehat Q^*_{A,i}$按实际$A$选取更新预测，$H$仍由初始$g$计算。最后减去的是第⑤步的全体风险差。各人的输出可以非零；其平均接近0：第一项由第③步求解，后两项由第⑤步中心化。

先计算这些输出的**经验方差（empirical variance）**，即依据当前样本，衡量逐人输出围绕其样本平均的离散程度。在RHC队列中，将5735个EIF输出分别减去它们的平均，平方后再取平均；这里用分母$n$，即5735。通常用于无偏估计总体方差的样本方差采用$n-1$；本教程此处采用经验分布下的方差，使用$n$。这些输出的离散程度提供估计误差的尺度。在独立观测、足够重叠及拟合误差余项可忽略等推断条件下，可用下式估计标准误（standard error, SE）：

$$
\overline D=\frac1n\sum_{i=1}^n\widehat D_i,\qquad
\widehat{\mathrm{Var}}(\widehat D)=\frac1n\sum_{i=1}^n(\widehat D_i-\overline D)^2,\qquad
\widehat{\mathrm{SE}}=\sqrt{\frac{\widehat{\mathrm{Var}}(\widehat D)}n}.
$$

> **符号回看：** $\widehat D_i$是第$i$位患者的EIF输出，$\overline D$是这些输出的样本平均；$\widehat{\mathrm{Var}}(\widehat D)$是上式算出的方差，$n$是独立观测数。开平方后得到风险差的标准误。图中按同一公式计算；第7–8章再解释有效推断所需的条件和误差控制。

**EIF的两次用途连起来了：** 第②–③步用它选择更新方向和求解方程；这一步用它衡量估计的不确定性。双重稳健保证的是相应条件下的一致性，有效区间估计还需要这里的推断条件。
