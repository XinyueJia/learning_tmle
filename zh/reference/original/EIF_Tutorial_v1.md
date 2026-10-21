# From Means to TMLE
## 一本可以动手验证的 Efficient Influence Function 入门教程

**读者定位**：理解回归、概率和因果推断中的 ATE，但没有系统学习过半参数统计。  
**核心目标**：不把 EIF 当作现成的 AIPW 公式，而是从目标参数对概率分布的导数出发，构建它、验证它，并理解为什么 TMLE 沿其指定的方向更新模型。  
**教学原则**：全程先使用有限、离散、各单元概率均为正的模型；在掌握构造逻辑后，再介绍一般连续分布、regular parametric submodels 和 tangent spaces。

### 全程使用的示例

令观测数据为 `O = (X, A, Y)`，其中 `X ∈ {0,1}` 是风险层级，`A ∈ {0,1}` 是治疗，`Y ∈ {0,1}` 是改善与否。设：

| X | P(X) | g(X)=P(A=1\|X) | Q(0,X) | Q(1,X) | τ(X) |
|---|---:|---:|---:|---:|---:|
| 0（低风险） | 0.50 | 0.20 | 0.70 | 0.80 | +0.10 |
| 1（高风险） | 0.50 | 0.80 | 0.20 | 0.50 | +0.30 |

这里使用 **因果识别已成立** 的思想实验：consistency、conditional exchangeability 与 positivity 成立。因而 ATE 可由观测数据分布识别：

\[
\psi(P)=\mathbb E_P\{Q(1,X)-Q(0,X)\}=0.50(0.10)+0.50(0.30)=0.20.
\]

这个 `0.20` 是 **ATE**，不是 CATE。CATE 是 `τ(x)=Q(1,x)-Q(0,x)`；对目标人群的 `X` 取期望以后才得到 ATE。

---

## 1. Mean influence function：为什么是 `Y − μ`？

### 先问一个导数问题

普通微积分研究 `f(x)` 对输入 `x` 的敏感性。统计问题中的目标参数却经常取决于一个**概率分布**，例如

\[\mu=\Psi(P)=\mathbb E_P(Y).\]

想象从一个分布 `P` 出发，用比例为 `t` 的点质量 `δ_z` 替换一小部分原来的概率质量：

\[P_t=(1-t)P+t\delta_z.\]

新均值是

\[\Psi(P_t)=(1-t)\mu+tz=\mu+t(z-\mu).\]

因此

\[\boxed{\left.\frac{d\Psi(P_t)}{dt}\right|_{t=0}=z-\mu.}\]

所以均值的 influence function 为

\[\boxed{D^*(Y;P)=Y-\mu.}\]

**为什么要中心化？** 因为分布的概率总和必须始终为 1，合法的 score function 具有均值零。取均值为零的 gradient 可以消除加任意常数产生的表示不唯一性；并且 `E_P(D*)=0`。

**动手验证**：设 `Y` 只取 `{0,1,3}`，概率是 `{0.2,0.5,0.3}`，均值 `1.4`。分别向 `0`、`1`、`3` 施加点质量，看新均值随 `t` 的斜率是否为 `−1.4`、`−0.4`、`+1.6`。

**检查问题**：`Y−μ` 为什么既叫残差，又叫分布函数的导数？答案：前者只是代数形式，后者来自 `P_t` 路径上的求导运算。

## 2. Point-mass contamination：从一个观测到一个分布方向

在有限、离散、每个单元均有正概率的样本空间，令 `o*` 是某个单元。构造

\[P_t(o)=(1-t)P(o)+t\mathbb 1(o=o^*).\]

它是一条正当的概率分布路径。其在 `t=0` 处的 **score** 为：

\[
S_{o^*}(o)=\left.\partial_t\log p_t(o)\right|_{t=0}
=\frac{\mathbb 1(o=o^*)}{p(o)}-1.
\]

如果某个均值为零的 `D` 满足对所有允许方向 `S` 都有

\[\left.\frac{d\Psi(P_t)}{dt}\right|_{t=0}=\mathbb E_P\{D(O)S(O)\},\]

那么沿着上面的点质量路径：

\[
\mathbb E_P\{D(O)S_{o^*}(O)\}
=D(o^*)-\mathbb E_P D(O)=D(o^*).
\]

这说明：**在离散模型中，point-mass contamination 的导数等于 influence function 在该观测处的取值**。

它不仅是记忆技巧，还与一般的 score–gradient 表示严格一致。对一般连续分布，将单个点质量加进来可能不是 regular parametric submodel，因此不能不加说明地把这个例子推广为全部理论定义。

**检查问题**：如果把 `t` 调到 `0.30`，为什么一阶近似未必精确？答案：IF 描述 `t=0` 处的一阶变化，大扰动可能受到更高阶项影响。

## 3. Distribution decomposition：ATE 究竟依赖哪些分布部分？

观察数据的联合分布可以分解为：

\[p(o)=p(y\mid a,x)\,p(a\mid x)\,p(x).\]

分别记作结局机制 `Q(a,x)`、治疗分配机制 `g(x)` 和协变量分布 `p_X(x)`。在识别假设下：

\[\psi(P)=\sum_x p_X(x)\{Q(1,x)-Q(0,x)\}.\]

从这个式子可以看出：在保持 `p_X` 和 `Q` 不变时，**只改变 `g` 不改变 ATE functional 本身**。不过，它会改变谁的结果被观察到，因此改变估计信息的分布和效率界；`g` 仍会出现在 EIF 中。

**动手验证**：固定 `p_X=0.5` 和两组 outcome probabilities，仅将 `g(0)` 从 `0.5` 改到 `0.1`，将 `g(1)` 从 `0.5` 改到 `0.9`。真实 ATE 仍为 20 pp，但直接比较 `E[Y\mid A=1] − E[Y\mid A=0]` 会明显改变。

**检查问题**：为什么 “ATE 不直接依赖 g” 与 “EIF 依赖 g” 并不矛盾？答案：目标 functional 的值与从选择性观测数据中恢复其梯度所需的概率权重，是两个不同的问题。

## 4. Deriving the ATE EIF：三项到底从哪里来？

令

\[\tau(X)=Q(1,X)-Q(0,X),\qquad \psi=\mathbb E\tau(X).\]

### 第一项：扰动协变量分布

固定 `Q`，只改变 `p_X(x)`，这是关于 `τ(X)` 的均值问题，直接得到

\[D_X(O)=\tau(X)-\psi.\]

### 第二项：扰动条件结局

假设增加 `o*=(x*,a*,y*)` 的概率质量。对于其所属 `A=a*`、`X=x*` 单元，新条件均值为

\[
Q_t(a^*,x^*)=
\frac{(1-t)p_X(x^*)\pi_{a^*}(x^*)Q(a^*,x^*)+t y^*}
{(1-t)p_X(x^*)\pi_{a^*}(x^*)+t},
\]

其中 `π_1(x)=g(x)`，`π_0(x)=1−g(x)`。直接求导：

\[
\left.\partial_t Q_t(a^*,x^*)\right|_0
=\frac{y^*-Q(a^*,x^*)}{p_X(x^*)\pi_{a^*}(x^*)}.
\]

ATE 又会乘上目标人群权重 `p_X(x*)`，两者抵消，得到各治疗水平的影响：

\[
D_Y(O)=\frac{A}{g(X)}\{Y-Q(1,X)\}
-\frac{1-A}{1-g(X)}\{Y-Q(0,X)\}.
\]

所以完整 ATE EIF 为

\[
\boxed{
D^*(O;P)=
\underbrace{Q(1,X)-Q(0,X)-\psi(P)}_{\text{协变量分布}}
+\underbrace{\frac{A}{g(X)}\{Y-Q(1,X)\}}_{\text{治疗结局}}
-\underbrace{\frac{1-A}{1-g(X)}\{Y-Q(0,X)\}}_{\text{对照结局}}.
}
\]

**为什么恰好是这个结构？** 因为它同时收集了 `p_X` 和 `p_{Y\mid A,X}` 两种分布扰动对 ATE 的一阶贡献；治疗机制单独扰动不产生贡献。

**动手验证**：选一个离散观测 `o*`，精确计算 `ψ(P_t)`，再与 `ψ(P)+t D*(o*)` 比较。随着 `t→0`，两者斜率应相同。

## 5. Pathwise differentiability：从特殊路径扩展到任意平滑路径

在一般模型中，考虑通过真实分布 `P` 的一条 regular parametric submodel `P_t`，其 score 为

\[S(O)=\left.\frac{\partial}{\partial t}\log p_t(O)\right|_{t=0},\qquad \mathbb E_PS(O)=0.\]

**Pathwise differentiability** 意味着参数沿每个允许方向都具有可由连续线性泛函表示的导数：

\[
\boxed{\dot\Psi_P(S)=\mathbb E_P\{D^*(O;P)S(O)\}.}
\]

对于 `O=(X,A,Y)`，联合密度的对数导数可分解为

\[S(O)=S_X(X)+S_A(A\mid X)+S_Y(Y\mid A,X),\]

其中

\[E(S_X)=0,\qquad E(S_A\mid X)=0,\qquad E(S_Y\mid A,X)=0.\]

- 只沿 `S_X` 扰动：`E(D*S_X)=E[(τ−ψ)S_X]`，与 `p_X` 的导数一致。
- 只沿 `S_A` 扰动：`E(D*S_A)=0`，因为 `ψ` 在固定 `p_X,Q` 时不依赖治疗分配。
- 只沿 `S_Y` 扰动：`E(D*S_Y)` 给出两个 outcome mean 沿该方向的导数之差；逆概率权重使整合恢复到 `p_X` 尺度。

这就通过一般 score 路径验证了第四节从点质量导出的 EIF，而不只是用一个特殊扰动来猜测。

**动手验证**：在有限样本空间使用指数倾斜 `p_t(o)∝p(o)exp[tS(o)]`，分别设置 `S=S_X`、`S=S_A` 或 `S=S_Y`，比较真实导数与 `E(D*S)`。

## 6. Tangent space：什么使 influence function 变得 efficient？

所有 regular parametric submodel 的 score 的闭线性张成空间叫 **tangent space** `T⊂L²₀(P)`。`L²₀(P)` 是所有均值零、二阶可积函数构成的 Hilbert 空间，内积定义为

\[\langle f,h\rangle_P=E_P[f(O)h(O)].\]

在合适的连续性条件下，pathwise derivative 是这个空间上的连续线性泛函，因此可以由 Riesz representation theorem 表示。位于 tangent space 内、代表该导数的梯度称为 **canonical gradient**，也就是 EIF。

在一个受限模型中，一个合法 influence function 可以写成

\[D=D^*+u,\qquad u\in T^\perp.\]

由正交性，

\[\Vert D\Vert_P^2=\Vert D^*\Vert_P^2+\Vert u\Vert_P^2\ge \Vert D^*\Vert_P^2.\]

因此 **efficient** 不是指该函数在数值上“更灵敏”，而是指它在满足全部允许路径的导数约束下拥有最小的 `L²(P)` 范数（等价于这里的最小方差）。

特别地：在完整的非参数模型中，tangent space 等于整个 `L²₀(P)`，不存在额外正交分量，所以 mean-zero gradient 是唯一的。

**动手验证**：在示意性二维 Hilbert 空间，令 `T` 为水平轴、`D*=(1,0)`，其他 IF 为 `(1,u)`；无论怎么改变 `u`，在 `T` 上的内积均相同，但范数平方从 `1` 增到 `1+u²`。注意这是一张几何示意图，不是 ATE 的实际 tangent-space 维度。

## 7. Semiparametric efficiency：为什么 EIF 方差是效率下界？

在适当的正则模型和渐近条件下，任何 regular asymptotically linear estimator 的根号 n 尺度渐近方差不低于 `Var(D*)`；在 `n` 个 i.i.d. 观测下，估计量自身的方差相应满足渐近下界

\[\boxed{\operatorname{Var}(\hat\psi)\gtrsim E_P[D^*(O;P)^2]/n \qquad (n\rightarrow\infty).}\]

对于当前二元结局 ATE 例子，因 EIF 的构成项彼此正交，

\[
\operatorname{Var}(D^*)=
\operatorname{Var}\{\tau(X)\}
+E\left[\frac{Q(1,X)(1-Q(1,X))}{g(X)}
+\frac{Q(0,X)(1-Q(0,X))}{1-g(X)}\right].
\]

这条公式直接暴露了 positivity 的作用：当 `g(X)` 接近 0 或 1 时，即使目标 ATE 没有变化，可达到的估计精度也可能大幅下降。

**动手验证**：固定 outcome mechanism，令 `g(0)=r`、`g(1)=1−r`，把 `r` 从 `0.50` 调到 `0.05`，观察 EIF 方差界和理论标准误的变化。

## 8. From EIF to TMLE：targeting 为什么指向这条路径？

先使用任意学习方法得到 `Qhat(a,x)` 和 `ghat(x)`。将 EIF 写成

\[D^*(O;Q,g,\psi)=H_g(A,X)\{Y-Q(A,X)\}+Q(1,X)-Q(0,X)-\psi,\]

其中

\[H_g(A,X)=\frac{A}{g(X)}-\frac{1-A}{1-g(X)}.\]

**AIPW / one-step** 保留初始 `Qhat`，直接把 EIF 的经验均值加到 initial plug-in estimator 中：

\[\hat\psi_{\rm one-step}=\hat\psi_{\rm plug-in}+\mathbb P_n D^*(\hat Q,\hat g,\hat\psi_{\rm plug-in}).\]

**TMLE** 则使用一个沿 EIF 所对应 score 方向构造的 fluctuation submodel。例如对二元结局，使用 logistic fluctuation：

\[\operatorname{logit} Q_\epsilon(A,X)
=\operatorname{logit}\hat Q(A,X)+\epsilon H_{\hat g}(A,X).\]

以 Bernoulli likelihood 拟合 `ε`，使 score equation 成立：

\[\mathbb P_n\big[H_{\hat g}(A,X)\{Y-\hat Q^*(A,X)\}\big]=0.\]

用更新后的 `Q*` 再做 plug-in：

\[\hat\psi_{\rm TMLE}=\mathbb P_n[\hat Q^*(1,X)-\hat Q^*(0,X)].\]

这同时使得经验 EIF 均值为零：

\[\boxed{\mathbb P_n D^*(\hat Q^*,\hat g,\hat\psi_{\rm TMLE})=0.}\]

**为什么要这样做？** 因为在 EIF 给出的目标参数敏感方向上使经验 score 归零，可在适当条件下消除一阶偏差，并得到渐近线性估计。对于 logistic fluctuation，更新后的预测仍保持在 `[0,1]` 内。

### 从 EIF 到 double robustness 的进一步联系

令真函数为 `(Q₀,g₀)`，暂把估计函数记成 `(Q̃,g̃)`。在总体期望下，AIPW 函数与真实 ATE 的偏差恰好可以表示为两个 nuisance 误差的乘积：

\[
\mathbb E\{D^*(O;\tilde Q,\tilde g,\psi_0)\}
=\mathbb E_X\left[(\tilde g-g_0)
\left\{\frac{\tilde Q(1,X)-Q_0(1,X)}{\tilde g}
+\frac{\tilde Q(0,X)-Q_0(0,X)}{1-\tilde g}\right\}\right].
\]

因此若整个 outcome model 正确，或 propensity model 正确，期望中的偏差为零。这是 AIPW / ATE 设定下的 double robustness；它与更一般的 Neyman orthogonality 密切相关，但不能把所有 orthogonal score 都无条件视为 doubly robust。

**动手验证**：分别设置「只有 Q 正确」「只有 g 正确」「两者都错」，对比 OR、AIPW 和 TMLE。这里用总体积分作为演示，不应将其误认为有限样本无偏的证明。

---

## 读完之后应能回答的五个问题

1. 为什么 `Y−E(Y)` 不只是残差，而且是均值泛函沿点质量路径的导数？
2. 为什么 EIF 的定义要涉及所有 regular parametric submodels，而不仅是一条添加观测的路径？
3. 为什么在 ATE functional 不直接依赖 `g(X)` 时，EIF 中却必须出现 `1/g(X)` 与 `1/[1−g(X)]`？
4. 为什么 EIF 叫 *efficient*？它的方差与 tangent-space projection 有什么关系？
5. 为什么 TMLE 要拟合 fluctuation parameter `ε`，而不是直接修正最后的 ATE 数值？

## 范围与限制

本教程讨论的是在 nonparametric i.i.d. observation model 下识别的二元处理 ATE。并非所有 estimands 的 EIF 都有同样形式；连续暴露、纵向治疗、缺失机制、clustered data 等问题需要不同的模型、路径和 EIF。一般情况下还需检查 positivity、identification、nuisance functions 的收敛速度、empirical process / cross-fitting 条件。对学习器训练误差和区间覆盖率的具体检验留给下一版的 Monte Carlo 单元。

## 理论依据与延伸阅读

- Hines O, Dukes O, Diaz-Ordaz K, Vansteelandt S. **Demystifying Statistical Learning Based on Efficient Influence Functions**. *The American Statistician* 76(3), 292–304 (2022). https://arxiv.org/abs/2107.00681  
- Fisher A, Kennedy EH. **Visually Communicating and Teaching Intuition for Influence Functions**. *The American Statistician* 75(2), 162–172 (2021). https://arxiv.org/abs/1810.03260
- 用户提供的《因果推断之 Doubly Robust Regression》（causalit）可作为启发性的中文扩展阅读，但本教程统一了 ATE/CATE 的定义，并区分 Neyman orthogonality 与 double robustness。
