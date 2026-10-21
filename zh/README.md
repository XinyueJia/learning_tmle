# Learning TMLE：影响函数与双重稳健估计学习笔记

<details>
<summary>🌐 简体中文</summary>

- [English](../README.md)
- **简体中文**

</details>

这份自学笔记从**影响函数**出发，逐步理解双重稳健估计与目标最大似然估计（targeted maximum likelihood estimation，TMLE）。我们沿用同一份公开的 SUPPORT/RHC 患者数据，将数学推导、直观图示和 Julia／R 运算连接起来。

## 逐章阅读

| 章节 | 本章要理解的问题 |
| --- | --- |
| [第0章：认识双重稳健估计](https://xinyuejia.github.io/learning_tmle/zh/#chapter-0) | 双重稳健估计、EIF 与 TMLE 怎样联系起来？ |
| [第1章：从死亡均值出发](https://xinyuejia.github.io/learning_tmle/zh/#chapter-1) | 为什么均值的影响函数是结局减去均值？ |
| [第2章：改变分布中的概率](https://xinyuejia.github.io/learning_tmle/zh/#chapter-2) | 概率变化怎样引出 score 与方向导数？ |
| [第3章：分解观测分布](https://xinyuejia.github.io/learning_tmle/zh/#chapter-3) | 结局风险、处理选择和基线分布怎样共同形成估计目标？ |
| [第4章：推导 ATE 的 EIF](https://xinyuejia.github.io/learning_tmle/zh/#chapter-4) | 残差、逆概率权重和中心化项分别从哪里来？ |
| [第5章：验证所有允许的方向](https://xinyuejia.github.io/learning_tmle/zh/#chapter-5) | 梯度怎样描述平滑路径上的目标变化？ |
| [第6章：找到有效梯度](https://xinyuejia.github.io/learning_tmle/zh/#chapter-6) | 模型约束、切空间和投影怎样确定 EIF？ |
| [第7章：理解估计误差](https://xinyuejia.github.io/learning_tmle/zh/#chapter-7) | EIF 怎样连接不确定性与效率界？ |
| [第8章：手动构建 AIPW 与 TMLE](https://xinyuejia.github.io/learning_tmle/zh/#chapter-8) | 怎样从同一批患者记录得到两种估计？ |

## 贯穿全书的案例

SUPPORT/RHC 公开观察性数据包含 5,735 名重症患者。处理变量记录患者在首24小时内是否接受右心导管检查（RHC），结局为30日内全因死亡。从最初的死亡均值到最终调整后的风险比较，各章使用同一批记录。

[患者摘要与数据来源](https://xinyuejia.github.io/learning_tmle/zh/public-data.html) · [参考文献与延伸阅读](https://xinyuejia.github.io/learning_tmle/zh/sources.html)

原始研究：Connors AF Jr, Speroff T, Dawson NV, et al. *The effectiveness of right heart catheterization in the initial care of critically ill patients.* JAMA. 1996;276(11):889–897。[研究记录](https://pubmed.ncbi.nlm.nih.gov/8782638/)。

数据由 Vanderbilt University Department of Biostatistics 通过 [hbiostat.org/data](https://hbiostat.org/data/repo/rhc.html) 提供。
