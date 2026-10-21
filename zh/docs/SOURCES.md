# 参考文献与适用条件

核验日期：2026-10-13。以下均为作者论文的 arXiv primary sources，已在线打开全文；不是仅凭摘要推断。数学审查者未运行浏览器验收。

## Hines et al.

- [版本与作者记录](https://arxiv.org/abs/2107.00681)：固定 v3，2021-12-01。
- [全文 HTML](https://arxiv.org/html/2107.00681v3)；[PDF](https://arxiv.org/pdf/2107.00681v3)。HTML 页面显示的渲染日期不等于论文版本日期。
- §3.2，式 (1)–(4)：混合路径、score、导数的期望表示；该节先假设扰动分布被基准分布支配。
- §3.3，Example 1：均值 IF 是观测减均值。Example 5，式 (7)：处理臂潜在结局均值的逆概率残差加条件均值再中心化；ATE 可独立取两臂之差。
- §3.3，式 (8)–(9)：score 内积表示；§4.2，式 (14)：将估计误差分解为经验平均、经验过程及余项。
- §4.2，Targeted learning，式 (15)–(16)：targeting 归零经验 IF，渐近结论仍依赖余项及经验过程条件。
- §4.3：sample splitting、cross-fitting；§4.4：乘积余项、Cauchy–Schwarz 控制、positivity 与 nuisance 收敛速度。

使用边界：论文的连续点质量推导采用形式化 Dirac 计算。本教程选择有限正概率空间，再证明一般合法 score 的表示，不把连续点污染直接称为 regular submodel。§4.4 使用其自身的余项符号约定，引用时须保留完整展开式；本教程 AIPW 总体偏差的独立代数见 [AUDIT.md](AUDIT.md)。

## Fisher & Kennedy

- [版本与作者记录](https://arxiv.org/abs/1810.03260)：固定 v3，2019-10-27。
- [PDF](https://arxiv.org/pdf/1810.03260v3)，36 页，页码以下按 PDF 页序从 1 起计。
- §3，PDF pp. 6–12，式 (3.1)–(3.9)：从分布路径及线性近似到 one-step；Definition 3.1，PDF p. 10，式 (3.5) 同时规定方向导数与 mean-zero。
- PDF p. 10：单独增加某个概率会破坏总质量 1，必须伴随别处减少概率；可用于第 1–2 章的教学桥梁。
- §4，PDF pp. 13–19，式 (4.2)–(4.5)：二阶余项、bias 与估计误差；sample splitting 或经验过程条件不能省略。
- PDF p. 9 脚注 1：作者将负号吸收入 R2 定义。因此不能跨论文只抄余项符号而不写展开方向。

使用边界：该文的图用于解释一阶修正及余项，不能替代本教程有限空间精确曲线的数值计算，也不能推出有限样本 TMLE 总比 AIPW 更准确。

## 项目中保存了哪些参考材料？

已阅读 `original/EIF_Tutorial_v1.md`、`original/build_eif_tutorial.py`、`original/test_eif_html.py` 及原 HTML 最后的脚本。原 HTML 脚本与 builder 中 `js` 字串逐字一致。

`Codex_Prompt_EIF_Tutorial_MultiAgent.md` 未取得：lead 已报告搜索未找到。本记录不虚构其内容、要求或审阅状态。中文causalit材料后来于2026-10-15按用户要求完整阅读，现作为讲解风格参考；用途及数学边界见下面新增记录，仍不是公式正确性的权威依据。


## 因果推断与回归估计的参考资料

### Hernán & Robins, Causal Inference: What If

- [作者正式下载页](https://miguelhernan.org/whatifbook)，2026-10-15在线打开；该页链接当前PDF为 [19 August 2026版本](https://miguelhernan.org/s/hernanrobins_WhatIf_19aug26.pdf)。作者页说明版本可能修订，因此本次固定版本和哈希，而不将其他旧版本页码自动套用。
- 直接web工具读取旧Harvard链接不可达，当前PDF又超过工具大小限制；lead以curl实际取得11,315,465字节PDF，SHA256为`a1067af923e9156bb95fbe4b0d18699bd0723e9c902bdc74465cf7782820b1b5`，用pdftotext读取相关章节。PDF只作临时核验，没有打包书籍全文。
- 实际定位并阅读第1章§1.1–1.2的潜在结局/平均效应，第2章§2.3印刷页19–20的标准化，以及第3章§3.2–3.4印刷页29–33的可交换性、正值性和一致性。第0章只概述这些条件怎样将潜在结局目标接到观测分布，不声称介绍了全书或验证了所有因果识别情形。
- 本教程的示例运算由共享计算内核完成。EIF与regular效率的用途沿用上方已核验Hines/Fisher记录及本项目独立审查，不以本书导读段落替代证明。

### causalit：双重稳健回归

已实际完整读取本地`zh/因果推断之Doubly Robust Regression-causalit的文章.md`（349行，42,203字节，SHA256 `9892356b37eb476520b5f1c8b87a6dc65e3e62d5b933f706fec3790952d92a4f`）。原出处为 [因果推断之Doubly Robust Regression](https://zhuanlan.zhihu.com/p/682351612)，本次使用用户提供的本地文本，未声称网页与其版本一致。

采纳其从问题出发、以自然疑问连接数字和公式的叙述方式，形成`docs/STYLE_GUIDE.md`并用于第0章。未复制长句或夸张修辞。具体来源与不继承的数学表述见`reviews/style-reference.md`；条件残差均值零、ATE/CATE、双稳健与正交性、经验方程与无偏及连续路径边界仍分别按独立数学核验处理。原参考文件保持不变，并随交付包保存。

## SUPPORT/RHC数据与原始研究

[Connors et al.1996原研究](https://pubmed.ncbi.nlm.nih.gov/8782638/)，JAMA276:889–897；[官方数据说明](https://hbiostat.org/data/repo/rhc.html)与[变量字典](https://hbiostat.org/data/repo/crhc)。官方CSV5735行、1918个30日死亡；原文Methods明确确认所有人的死亡日期或180日存活。研究入组日起30日状态与原死亡日期全部相符，不能仅按临床最后联系日另造删失。源字节、许可、日期原点和核查证据见shared/data/public/rhc/provenance.json及docs/data/RHC_SOURCE.md。

原研究排除48小时死亡/出院者且以首24小时分类RHC；不会因此变成即时随机策略。急性生理值使用首日最异常值，可能晚于操作。原ADL/DASI询问入院前状态，不能只因日3收集就称处理后状态；本实现未纳入这些含缺失/代理与校准语义的字段。由保守基线W编码得到的17列设计矩阵用于实际多变量方法演示，但临床充分混杂和选择识别未证。

Data obtained from http://hbiostat.org/data courtesy of the Vanderbilt University Department of Biostatistics。仓库授权使用并要求研究引文及致谢，不冒称CC BY。来源与临床/数学独立审查见reviews/rhc-design.md及rhc-ch00–08.md。


## R语言实现的参考资料

R语法与数据对象核查使用R官方文档：[入门手册](https://stat.ethz.ch/CRAN/doc/manuals/r-release/R-intro.html)、[向量算术](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Arithmetic.html)、[矩阵乘法](https://www.stat.math.ethz.ch/R-manual/R-devel/library/base/html/matmult.html)、[表格读取](https://www.stat.ethz.ch/R-manual/R-devel/library/utils/html/read.table.html)。本项目R代码采用base R，运行记录版本R4.5.2。数学目标与临床资料来源沿用本书此前文献及RHC官方原CSV。


## 倾向得分、匹配与IPW的参考文献

用户再次指定causalit文章；本轮复读其开篇观察性比较→IPW→AIPW→IF的叙事，沿用此前style-reference.md的独立数学核查。文章未展开PSM，本轮自行补充设计用途；原文E[Y/e(X)]不能代替两臂ATE加权式，故从条件期望独立展开两臂。

- Rosenbaum & Rubin (1983), [The central role of the propensity score in observational studies for causal effects](https://academic.oup.com/biomet/article-abstract/70/1/41/240879)，Biometrika70:41–55，doi10.1093/biomet/70.1.41。实际读取出版社摘要，支持倾向得分是给定观测基线的处理分配概率，及其用于匹配的历史来源。DOI入口及PDF镜像本轮未成功，未声称复核全文定理；课程未将估计分数接近当作样本完全平衡证明。
- Cole & Hernán (2008), [Constructing Inverse Probability Weights for Marginal Structural Models](https://pmc.ncbi.nlm.nih.gov/articles/PMC2732954/)，AJE168:656–664，doi10.1093/aje/kwn164。实际读取摘要、引言、§Exchangeability及§Positivity开头，核查逆概率权重、识别条件及权重/模型诊断的用途；本文纵向HIV结果不移植到RHC数值，也不据其声称本课程处理了纵向混杂。

本轮RHC分组表数字从原CSV独立计算。sex分层饱和倾向下的精确重加权及与标准化风险的相等，由逐行权重与独立分层计数公式核验。PSM只作设计说明，不输出匹配后患者或PSM效应；完整目标人群ATE与处理者ATT、删去不可匹配者后的人群变化均明确。总体观测恒等式与样本HT/Hájek规则分开；因果解释沿用RHC设计审查。最终独立数学/教学审查见reviews/ch00-propensity-bridge.md。


## 如何区分标准化、IPW与匹配的目标？

本轮复用上节已核的倾向得分/加权来源和此前标准化/因果识别来源，不重复将摘要当全文定理。PSM从上一轮设计介绍升级为可复现的sex层内精确倾向得分、1:1无放回配对；原行序打破同分。这里明确本项目选择的教学设计，未归称原RHC论文或causalit文章的匹配算法。

独立审查从原CSV用Python csv/Fraction重建全部2184对，并逐对核对JS；匹配对死亡分别830与642，估计为47/546。全队列sex标准化与处理者sex标准化是不同目标，后者用全对照层风险计算约0.07324830640188844，也不等于具体选对照的匹配估计约0.08608058608058608。正文分别说明目标与样本规则。新增Q/g组合图复用原第8讲多变量W拟合及既有AIPW/TMLE实现；不会把不同调整集、不同目标的几个数当作比较方法优劣的证据。审查的独立计算、亲自视觉检查与读取测试日志范围详见reviews/ch00-three-routes.md。


## 如何区分分布平均与样本平均？

复用上方已核验Hines §4.2一阶/估计方程/targeting及§4.3–4.4条件，无重复检索。第0章P̂_init、U(Q,g;θ)和两种平均是本项目为教学明确区分的记号；具体代数从本项目ATE泛函及Bernoulli拟合分布独立核算，记录reviews/ch00-correction-centres.md。经验零与模型中心化分开，校正加号对应目标减初始估计的一阶部分，未把该近似当有限样本恒等式。


第0章“为何更新Q”的续作复用上方targeting来源记录。双臂Z拆分、代入结构范围和Q*重算AIPW的关系由本项目公式独立核验（reviews/ch00-why-target-q.md）；贡献与预测的图均由原RHC数据及原拟合核计算，不借用模拟病例或作者图片。对本书一维风险差更新，只声称两臂校正之差归零。


## 讲解TMLE时采用的参考资料

- 用户提供的 `zh/reference/因果推断之Doubly Robust Regression-causalit的文章.md`：用于观察“已有估计→为什么还要改进→公式从何而来”的问题递进。文件完整保留，原文的数学表述不作为本课新结论的依据。
- [KHStats, An Illustrated Guide to TMLE, Part II](https://www.khstats.com/blog/tmle/tutorial-pt2)：本轮重读算法各步，参考在同一数据对象上逐步连接直觉、公式和运算的组织方式。第0章继续使用已有真实RHC对象图和自身推导，不复制文章图像、代码或数学断言。

本轮数学边界由既有来源与独立审读核对，详见reviews/ch00-narrative.md。调整的是中文叙事和正文顺序。


## GLM score与IF有什么联系？

重新在线核查Kennedy (2017), [Semiparametric theory, v1, §4](https://arxiv.org/html/1709.06418v1)：参数score是对数密度导数，路径score将这个概念推广到子模型；式(4)用IF与路径score的期望表示目标导数。本轮Bernoulli似然、信息和两种目标IF在正文中独立逐步推导，另有独立数学审读与有限差分验证。未把一般有效score的公式直接当作任意GLM或任意估计量的IF。原有Hines与Fisher/Kennedy的来源记录继续适用。


## 双重稳健估计的导读参考

重新阅读用户的causalit本地文章及[KHStats Part II](https://www.khstats.com/blog/tmle/tutorial-pt2)。借鉴前者的问题→回归/IPW→残差组合→追问构造依据的顺序，以及后者把数据对象与计算并排呈现的方式；本次三个图全部由本项目RHC数据与计算生成。保留已有Hines/Fisher来源核验和独立DR偏差推导，未继承参考文中的ATE/CATE混用、预测正确即逐人残差零、有限样本无偏等说法。重要结论由本次独立审查reviews/ch00-concise-dr.md再次核验；不把风格参考当作数学验收。


## TMLE算法步骤的参考资料

再次在线读取[KHStats Part II算法步骤](https://www.khstats.com/blog/tmle/tutorial-pt2)的Q/g、fluctuation、更新、标准化与EIF方差部分，借鉴依序增加数据对象的组织方式。课程继续使用独立开发的RHC模型/数值实现及既有Hines/Fisher理论记录，中文解说为本课程重新撰写。没有沿用原文把logit解释成作用于观测Y、把建模步骤直接等同于可靠推断或笼统否定g-computation标准误的表述。局部算法方程和SE由独立审查者从Bernoulli likelihood及原CSV重新核算，见reviews/ch00-tmle-overview.md。
