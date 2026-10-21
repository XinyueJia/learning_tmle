# 最终实现集成审查

审查范围：只读 `src/app.js`、`src/math.js`、`tests/browser.cjs` 与 `docs/NUMERICS.md`。本次只写此报告，没有修改内核、界面、测试或章节。内核 21 项测试在此前执行中已全部通过；本次没有重复执行。没有启动浏览器，因此本报告不宣称 browser pass，也不代替章节数学与教学审查。

结论：未发现当前八章控件范围内的阻断性计算或状态隔离错误。发现一处不影响当前控件网格的 formatter 阈值端点问题，具体列于最后。

## 配置、计算与状态隔离

第 1–2 章使用内核唯一冻结的 `MEAN_MODEL`，其余各章从 `cloneModel()` 建立独立二元机制模型。第 3 章直接读取冻结 `DEFAULT_MODEL` 仅用于控件初值，实际计算使用新的 clone；切换机制先重置本章 inputs，再只改变所选因素。第 4–8 章各自建立局部 base/model/truth，没有写回默认配置或另一章实例。

`wire` 保存每个 root 自己的 input/select defaults，事件查询、数值读取、结果替换及 reset 都限定在该 root。第 8 章 preset 只改本章 b、lambda、trial epsilon，并运行本章 update；preset 不覆盖 reset defaults。因此第 1 章状态不会被第 8 章 preset/reset 修改，反向亦然。导航只改变 hidden/title/read status，不重建或共用各实验的控制状态。

第 1 章精确曲线重新加权，均值线性式在此例确实精确。第 2 章 h/S/D 与配对使用基准 P，t 只改变路径位置。第 3 章 ATE 与 naive 使用内核；补充条件人群权重和两臂均值采用一致的八点概率。第 4 章商式量、当前 ATE 与中心差分来自真实污染路径，并区分精确曲线和切线。第 5 章 pure X/A/Y 使用条件 tilt，J 使用公开 jointTilt；pair 与 score 留在起点。第 6 章 actual weighted projection 与每个八点 candidate 的直接范数一致。第 7 章按每个 r 重新求方差与 V/n，没有用单调近似曲线；文本明确最低点稍小于 .5。分数、概率差、pp、概率差² 与标准误的换算一致。

## 第 8 章 targeting 与反例

拟合由 `fitFromOffsets` 生成，H 使用 `cleverCovariate`，初始和更新后 bias 使用 `nuisanceBias`。自动更新使用 checked-root `tmle`；手动 epsilon 仅进入另一份 `fluctuation` 与其 score，不覆盖自动 updated/estimate。四个 presets 分别为 Q 正确 `(b=0,lambda=1)`、g 正确 `(.12,0)`、两者错 `(.12,.5)`、两者正确 `(0,0)`，均重置 trial epsilon 为零。

自动 score residual 为零时，界面仍独立计算 `B(Q*,g_fit)` 与估计误差，没有把答案写成零或设成 AIPW 偏差。默认两者错时，一次只读数值核对得到：AIPW `.20197802197802203`，TMLE `.23467032254607073`，自动 epsilon `.28317549621922705`，更新后 bias `.034670322546070664`。这确实是“targeting score 为零但 nuisance product 不为零”的反例，且 TMLE 在此例比 AIPW 更远离真值 `.2`。这些值来自 API 实算，界面没有 hard-coded estimates。

## 声明控件范围与显示边界

第 1 章 t=1 的零概率只传给允许边界的 mean/contaminate。第 2 章 t∈[−.1,.3] 对三个 z 都保持正概率。第 3 章 px∈[.1,.9]、g/q∈[.05,.95] 满足内核域；第 4 章八个污染点的 t∈[0,.15] 与起点差分 ±10⁻⁶ 也位于正概率域。第 5 章 X/A/Y/J 的 t∈[−3,3] 保持可表示的正模型；第 6 章 b 只改变候选向量；第 7 章 r∈[.05,.5] 与列出的正 n 合法。

本次对 J 的 601 个控件位置进行了只读数值扫描，px/g/q 最小值约 `4.2297×10⁻¹¹`，最大值约 `.9999999993232408`，当前 adaptive formatter 没有把这些合法概率显示成 `0.000` 或 `1.000`。

第 8 章对 b 的 31 个位置与 lambda 的 21 个位置共 651 个模型进行了只读数值核对；manual epsilon 的 −1/0/+1 均保持 q 严格位于 `(0,1)`，范围约 `[.0009616382,.9990383618]`。自动根范围约 `[−.33305,.37252]`，最大 score residual 约 `9.064×10⁻¹³`，bias-star 恒等式最大数值误差同阶。score 图仅评估稳定的 score 函数，实际预测表仍通过严格模型验证。此扫描不是 DOM/browser 交互验收。

## 浏览器 assertions 与剩余覆盖

当前浏览器脚本覆盖八章的实际键盘改变、select 改变、reset、details、MathML、两种 viewport、console 与禁止外部请求，并包含各章主要结果断言。第 6 章已补五基配对、±b residual 反号及全模型配对；第 8 章已包含三组 recovery、默认双错反例、自动 residual 与手动预测范围。

建议后续 browser gate 显式补：第 1↔8 章 reset/preset 双向隔离；J 在 t=−3/+3 的 adaptive 概率文本；手动 epsilon 改变时 manual score/predictions 确实改变而自动 epsilon/estimate/bias-star 不变；第 8 章 details 中 bias-star 非零且与 TMLE 误差一致。这些是覆盖补强，源实现已经显示正确逻辑。本次没有运行该脚本，不能据此标记上述浏览器检查通过。

## 非阻断性 formatter 问题

`src/app.js:5` 使用严格条件 `n>.9995` 进入 `1 − small-tail` 分支。对合法概率 **恰好 `.9995`**，fallback `toFixed(3)` 会输出 `1.000`。当前扫描的 J 控件网格未命中这一值，因此当前操作范围没有观察到假边界；但 formatter 本身的端点仍不完备。建议将上侧条件改为包含该阈值（`n>=.9995`），或按最终舍入结果决定是否切换显示。这是显示问题，未发现概率计算被 clipping。

## 闭合记录

以上为首次 scoped review 的历史记录。静态复查当前 `src/app.js:5` 已使用 `n<1 && n>=.9995`；合法端点 `.9995` 现在进入 `1 − small-tail` 分支，不再 fallback 到 `1.000`。该显示问题已修复并关闭，本代理没有修改源文件。

根据 lead 提供的实际执行结果，最新 workspace 与真实 ZIP 解压版本均已通过完整 browser suite 的 1360px/375px 两个 viewport。新增并实际执行的 assertions 覆盖：首末章节 preset/reset 隔离、J 在 t=3 的 adaptive 极端概率文本、手动 epsilon=−1/+1 改变 trial score 而自动 estimate/epsilon 保持原值、第 8 章 details 中非零 `B*=.0346703225` 可见，以及窄屏表格的键盘横向滚动。结合上述静态隔离审查与完整 J 控件网格的数值扫描，原 browser 覆盖建议已闭合。

lead 另报告：真实 ZIP 中的源内核 21/21 数值测试通过，并已人工查看八章桌面图与八章 phone 图。本代理此次只静态复查阈值及新增 assertion 源码，没有自行运行浏览器或 ZIP 测试；这里的实际执行与人工截图检查结果明确归属于 lead。

最终 scoped implementation 状态：formatter 端点问题已关闭，没有剩余阻断项；数值域、共享配置、章节状态隔离、targeting 与非零 bias-star 反例，以及上述 browser gate 均已形成对应证据。本闭合记录替代首次报告中的待修 formatter 和待执行 browser 覆盖状态。
