# 参考文献与延伸阅读

## 影响函数、一步估计与效率

- Hines O, Dukes O, Diaz-Ordaz K, Vansteelandt S. *Demystifying statistical learning based on efficient influence functions*. [论文与版本](https://arxiv.org/abs/2107.00681) · [全文](https://arxiv.org/html/2107.00681v3)。§3介绍分布路径、score与影响函数；§4讨论一步估计、TMLE、交叉拟合（cross-fitting）及余项条件。
- Fisher A, Kennedy EH. *Visually communicating and teaching intuition for influence functions*. [论文与版本](https://arxiv.org/abs/1810.03260) · [全文PDF](https://arxiv.org/pdf/1810.03260v3)。§3从分布变化引出线性近似与一步估计；§4讨论偏差、余项和估计误差。
- Kennedy EH. *Semiparametric theory*. [全文](https://arxiv.org/html/1709.06418v1)。§4介绍参数score、分布路径和影响函数之间的关系。

## 因果识别、标准化与加权

- Hernán MA, Robins JM. *Causal Inference: What If*. [作者提供的电子书](https://miguelhernan.org/whatifbook)。第1–3章介绍潜在结局、平均处理效应、标准化，以及一致性、可交换性和正值性。
- Rosenbaum PR, Rubin DB (1983). [The central role of the propensity score in observational studies for causal effects](https://academic.oup.com/biomet/article-abstract/70/1/41/240879). *Biometrika* 70:41–55。介绍倾向得分及其在观察性研究中的作用。
- Cole SR, Hernán MA (2008). [Constructing Inverse Probability Weights for Marginal Structural Models](https://pmc.ncbi.nlm.nih.gov/articles/PMC2732954/). *American Journal of Epidemiology* 168:656–664。讨论逆概率权重、识别条件与权重诊断。

## RHC数据与原始研究

- Connors AF Jr, Speroff T, Dawson NV, et al. (1996). *The effectiveness of right heart catheterization in the initial care of critically ill patients*. *JAMA* 276:889–897。[原始研究](https://pubmed.ncbi.nlm.nih.gov/8782638/)。
- Vanderbilt University Department of Biostatistics：[数据介绍](https://hbiostat.org/data/repo/rhc.html) · [变量字典](https://hbiostat.org/data/repo/crhc) · [数据使用许可](https://hbiostat.org/data/)。
- [患者摘要](public-data.html) · [案例与分析设置](case-study.html) · [下载原始CSV](../shared/data/public/rhc/source.csv)。

Data obtained from hbiostat.org/data courtesy of the Vanderbilt University Department of Biostatistics.

## 图解与代码学习

- [KHStats: An Illustrated Guide to TMLE, Part II](https://www.khstats.com/blog/tmle/tutorial-pt2)：用图示逐步讲解TMLE算法。
- [causalit：因果推断之Doubly Robust Regression](https://zhuanlan.zhihu.com/p/682351612)：介绍回归、加权与双重稳健估计的联系。
- R官方文档：[入门手册](https://stat.ethz.ch/CRAN/doc/manuals/r-release/R-intro.html) · [向量运算](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Arithmetic.html) · [矩阵乘法](https://www.stat.math.ethz.ch/R-manual/R-devel/library/base/html/matmult.html) · [读取表格](https://stat.ethz.ch/R-manual/R-devel/library/utils/html/read.table.html)。
