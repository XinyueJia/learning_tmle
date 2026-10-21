# Learning TMLE：影响函数与双重稳健估计学习笔记

仓库：`learning-tmle`。英文版标题为 Learning TMLE: Notes on Influence Functions and Doubly Robust Estimation。

当前第0章是双重稳健与EIF的简短导读，配有六步TMLE算法；原详细内容保留在src/supplements/ch00-details.md及chapter-0-details.html，主课件中的补充入口暂时隐藏。页面已移除通用操作指引，标题采用自然句式。以下旧版编排记录供追溯；当前状态以docs/PROGRESS.md及docs/VERIFICATION.json为准。

当前第0—8章已迁移到同一真实SUPPORT/RHC队列，实际源码zh/src/chapters，可运行dist/zh。第1讲18图与32行Julia入门样板，第8讲按sex分层和多变量模型的手动TMLE。

完整运行、目录和测试说明见根README.md；当前方案docs/RWS_CASE_PROTOCOL.md，独立审查reviews/rhc-design.md及rhc-chXX.md。原合成版本保留reference/synthetic-course-2026-10-16/，不作当前患者来源。

第0章区分现有记录的描述与总体推断，使用同一RHC结局展示真实/估计IF及均值标准误。重复抽样在这里是推断模型中的假想比较，网页计算只使用现有数据；独立审查见reviews/ch00-sampling-if.md，实际验证范围见docs/VERIFICATION.json。

第0章§5.4可切换初始EIF、AIPW候选中心与TMLE更新阶段，并列显示原始经验分布和当前拟合分布下的平均。每步标明Q、g及中心版本；公式保留逐步消项与符号回看。

第0章§5.4第五步并列比较AIPW的逐人求和贡献与TMLE的更新风险预测，可切换RHC两臂、核对同六行与全队列平均，并说明代入结构、取值范围和一维风险差方程。


第0章按“临床问题→估计路线→误差问题→均值IF→风险差校正”连续展开；均值函数调用与误差分别在§5.1、§5.2，风险差组件在§5.3。原逐步推导和交互保留，抽象记号放入可展开补充。当前审读见reviews/ch00-narrative.md，验证及未验证范围见docs/VERIFICATION.json。


第1章承接第0章使用过的y−μ，沿概率替换、均值变化、差商与极限、函数输入输出及中心化逐步推导。原18幅图、全部旧公式与Julia/R逐行说明保留，新加一般差商的完整消项。当前独立审读见reviews/ch01-narrative.md。


第0–1章现以熟悉的logistic回归score连接IF：先保持同一RHC均值例子，再逐步比较似然导数、logit目标与均值目标的IF，以及路径score配对。三幅新增数学对象图由完整原CSV计算，原Julia/R程序和逐行说明保留。审读与实际测试记录见docs/VERIFICATION.json。


第0章现从OLS residual引出估计误差，新图用同一RHC记录对比逐人残差与未知目标误差；§5.2现有图可切换样本中心（OLS残差/估计IF）、真实中心与假设中心，保留完整代数和标准误计算。
