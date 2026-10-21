# 旧案例选材记录归档

2026-10-21从当前读者页面移出，保留来源与选材记录。


## 原文件：zh/src/public-data.md

## 候选取舍与历史材料

此前Ng肺癌资料保留在项目中，仍只适合其既定核查范围，不强造PFS。此次选择RHC是因为原始来源、处理编码及完整30日死亡更可核查；它是医疗操作RWS，不伪称药品再评价。此前药品合成版本保存在`zh/reference/synthetic-course-2026-10-16/`，数学测试参考分布仍可在共享math.js中复核，但不再冒充当前真实患者数据。


## 原文件：zh/case-study/README.md

## 候选取舍与历史材料

此前Ng肺癌资料保留在项目中，仍只适合其既定核查范围，不强造PFS。此次选择RHC是因为原始来源、处理编码及完整30日死亡更可核查；它是医疗操作RWS，不伪称药品再评价。此前药品合成版本保存在`zh/reference/synthetic-course-2026-10-16/`，数学测试参考分布仍可在共享math.js中复核，但不再冒充当前真实患者数据。


## R并行工作簿

各讲代码可在Julia和R之间切换。第0、1章对象图还提供R运算视图，第8章的逐列代码可选R并保留公式/患者表/变量联动。R版使用同一官方CSV和base R；从项目根运行`Rscript --vanilla zh/R/ch01.R`开始，至`ch08.R`手动完成TMLE。

[完整R运行说明](R/README.md) · [第一讲R脚本](R/ch01.R) · [逐列R工作簿](R/tmle_trace.R) · [共享R计算模块](../shared/R/RHCCase.R)。网页逐行解释直接读取源码，所有工作簿保留原始行序和相同的基线编码。


## 原文件：zh/docs/SOURCES.md

## 上市后RWS疗效案例：设计依据（2026-10-15）

本次仅专业化应用情境，不改EIF公式或固定模型。设计术语与来源由scoped source verifier实际在线核验，完整支持范围/访问限制见`zh/reviews/rws-case-sources.md`（相对项目根目录）。匿名药物、晚期NSCLC、12个月终点、风险分层及全部数值是本项目教学设定，不是以下文献的临床结果。

- [FDA：Real-World Evidence及RWD/RWE定义](https://www.fda.gov/science-research/science-and-research-special-topics/real-world-evidence)。用于区分常规诊疗资料与分析所得证据；本项目合成数据不称RWD/RWE。
- [Hernán & Robins（2016）：Using Big Data to Emulate a Target Trial When a Randomized Trial Is Not Available](https://pmc.ncbi.nlm.nih.gov/articles/PMC4832051/)。已读相关正文及Table 1，支持明确资格、策略、时间零点、结局及初始策略/持续策略的区分；不将观察性比较直接称为随机试验ITT效应。
- [Yoshida, Solomon & Kim（2015）：Active-comparator design and new-user design in observational studies](https://pmc.ncbi.nlm.nih.gov/articles/PMC4486631/)。已读活性对照、新使用者及局限节；这些设计有助于可比性，不保证无未测混杂。
- [FDA July 2024最终指南：EHR与医疗理赔RWD的适用性](https://www.fda.gov/media/152503/download)。核验§IV.C p11、§IV.D pp12–13、§V.D.4 p26及§V.E.1 pp26–27；支持缺失、结局操作定义、死亡记录与混杂信息的适用性检查，不证明此教学表有监管用途。

来源没有为本例的两种匿名药物、风险大小或疗效结论背书。具体方案和现有三变量观测模型的边界见RWS_CASE_PROTOCOL.md。


## 历史候选：Ng公开RWS资料（尚未成为主分析）

Ng W-W, Lin C-C, Cheng C-Y, Jiang J-S, Kao S-J, Yeh DY (2021). [Real-world outcomes of first- and second-generation tyrosine kinase inhibitors first-line in patients with epidermal growth factor receptor mutation-positive non-small cell lung cancer: A retrospective observational cohort study](https://doi.org/10.1371/journal.pone.0253335). PLOS ONE 16(6): e0253335. [S1 Dataset](https://doi.org/10.1371/journal.pone.0253335.s001)。原CSV107行34列已保存且未修改，许可CC BY 4.0；署名、下载链接、日期及SHA-256见`shared/data/public/ng-2021-nsclc/provenance.json`。

已核查原文、原始文件及许可。该资料用于真实数据读取和字段核查；公开PFS时间/状态配对、时间起点和删失规则尚未充分核实，不作为已验证12个月复合终点。资料页不输出临床ATE/TMLE，不沿用合成20pp真值。扩大病种后的候选及因果设计缺口另见`zh/docs/data/OPEN_ONCOLOGY_CANDIDATES.md`。本次公开数据审查独立于既有EIF数学文献核验。


