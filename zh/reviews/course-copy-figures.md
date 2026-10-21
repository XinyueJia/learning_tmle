# 渲染器图题与界面文案审校

本轮依据 `zh/docs/COURSE_CONTRACT.md`，审读 `zh/renderers/*.js`（`course.js`由主代理负责）。修改16个渲染器中的图题、小标题、展开标题、少量选项及图内标签；保留 `dr-intro.js` 三幅导读图已有的自然表述。未改数值逻辑、对象键、IDs、data属性、数学TeX、原始代码及其映射。

## 代表性修改

| 位置 | 原文 | 修订 |
| --- | --- | --- |
| qg-visual.js | 同六位真实患者，三种函数调用 | 将这六位患者的基线分别送入Q̂和ĝ |
| glm-score.js | 同一列残差，两种求导问题 | 截距score与均值IF为什么都等于残差？ |
| mean-error.js | 同一份RHC记录，减去哪个均值？ | 每条RHC结局减去不同的均值，会得到什么？ |
| ols-error.js | 两次减法：一个人的残差，一项估计的误差 | 分别计算患者的残差与风险估计的误差 |
| eif-correction.js | 同一批RHC患者：是哪条规则，在谁的分布下平均？ | 比较当前估计函数在拟合分布与经验分布下的平均 |
| chapter1-visuals.js | 同一份5735人记录：先数结局，再算事件比例 | 先统计5735人的结局，再计算死亡比例 |
| chapter1-visuals.js | 把随机结局送进同一条规则，概率沿着箭头传过去 | 将随机结局代入IF，得到两种可能的影响值 |
| tmle-calibration.js | 方程归零后，估计是否回到RHC参考目标？ | 在固定的RHC参考分布中，方程归零能否消除目标偏差？ |

短标准标签（结局回归、处理回归、初始EIF、风险差、重置等）按其用途保留，不统一扩成长问句。说明型标题优先写实际读取、运算和比较的对象。参考分布实验明确保留其固定参考背景，未将其解释为真实总体准确性验证。

## 修改文件

`chapter0-visuals.js`、`chapter1-visuals.js`、`glm-score.js`、`mean-error.js`、`propensity-bridge.js`、`if-function.js`、`if-notation.js`、`ols-error.js`、`if-motivation.js`、`qg-visual.js`、`estimation-routes.js`、`eif-correction.js`、`target-comparison.js`、`tmle-calibration.js`、`rhc-code.js`、`parallel-code.js`。

## 边界与联动

- 历史 `chapter0-visuals.js` 仍包含独立药物合成教学示例；只调整标题，不擅改数据背景或把它当作真实RHC结果。其已有教学设定说明保留。
- 初始拟合EIF、AIPW候选中心下的估计函数U、途中Qε及求根完成的Q*继续分别说明；未改变efficient、EIF与IF的边界。
- 第1章主对象图的标题来自 `zh/src/object-grammar.js`，第2–7章若由 `course.js` 或 `zh/src` 生成也不属于本代理编辑范围，需主代理联动。
- `rg` 搜索 `tests` 未发现上述旧图题的直接精确文本引用；依赖完整标题或展开文字的外部快照仍可能变化。无任何交互选择器变更。
- 本代理初次运行语法检查时shell未提供 `node`；已向主代理报告，最终构建与浏览器检查由集成环节记录，不将本次文字审读等同于已通过运行验证。
