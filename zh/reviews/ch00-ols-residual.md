# 第0章 OLS残差与估计误差衔接：独立复审

日期：2026-10-19。

结论：本轮数学与教学衔接通过。未发现需要修改正文或两幅图计算逻辑的问题。测试中发现一个因正文改写而过时的精确文字断言，主代理同步后，本代理重跑相关10项测试全部通过。

## 范围

实际阅读了 `zh/docs/COURSE_CONTRACT.md` 前55行、第0章§4、§5.1、§5.2及其符号回看，`shared/js/mean-error.js`，新图 `zh/renderers/ols-error.js` 与 `zh/src/ols-error.css`，原均值图 `zh/renderers/mean-error.js` 与 `zh/src/mean-error.js`。仅写本审查文件。

## 核验结论

- §4先定义逐人残差 `e_i=y_i−ŷ_i`，再定义全样本估计对应的标量误差 `ψ̂−ψ₀`。两个对象的输入、含义及可计算性明确，未将拟合残差视为未知真实noise。
- 残差和为0的声明限定为含截距、未加权、无惩罚的OLS拟合；RHC二元结局只截距例子用于计算共同均值，没有额外声称Gaussian noise或一般OLS残差就是EIF。
- 新图以原CSV第5条死亡记录作单人示例，拟合均值从全部5735条结局计算；第二行显示未知 `μ₀` 与未知 `μ̂−μ₀`，没有生成总体真值或将个体残差用作估计误差。
- §5.1保留固定经验参考与假想新抽样的区分，收尾回接只截距残差。§5.2明确本例 `e_i=D̂_i=D^mean_{P_n}(y_i)`，真实IF则为 `y_i−μ₀`。
- §5.2两套完整代数分别得到 `μ̂−μ₀` 与0，误差方向一致。有限样本恒等式、总体中心化、同样本中心化以及iid标准误的条件保持分开。
- 现有均值图仍保留三种中心，假设参照m只用于试算；真实IF与真实误差保持未知。前6条只是预览，全5735项参与平均和标准误计算。
- 既有logistic score桥仍解释相同数式对应不同用途；新增OLS段没有重复展开§5.2的两套代数。

## 实际运行

1. 使用Python标准库 `csv.DictReader` 独立读取原CSV：5735条记录、1918个死亡，首位死亡为第5条；前6条死亡比例为1/6，全样本比例为0.33443766346992154。
2. 使用 `bash scripts/node.sh --test tests/mean-error.test.js tests/zh/mean-error-renderer.test.js`：初次10项中9项通过，唯一失败为过时的“当前数据”文字断言。主代理将断言同步为“当前经验分布”后，本代理重跑得到10/10通过。计数、全样本计算、未知真值保护、假设中心、标准误、renderer保留全向量及§5.2四块完整推导与符号回看均通过。
3. 独立调用 `readRhc`、`meanErrorData`、`renderOlsError` 并执行断言：人数5735、死亡1918、首位死亡下标4、拟合均值1918/5735、残差 `1−1918/5735`、真实误差为null、图中第5条与全5735条标签正确、未知误差标签存在、无KaTeX错误或遗留占位符。结果通过。
4. 实际数值：第5人残差0.6655623365300785；全残差平均约6.06×10⁻¹⁶（浮点误差）；iid均值标准误0.006230503077185932。

本审查未执行浏览器布局、键盘操作、Julia/R运行或全书回归，也未独立比较全部历史图和代码的保留情况；这些应以主代理本轮实际验证记录为准。

## 审查时SHA-256

```text
342f93e3f5955422afb71745d63b91d2f06224ba7c5f06c93c6e17d87d0f550e  zh/src/chapters/ch00.md
07179e6dd6dc60b18e552223d4cd1b3657bd0faedbd27a0f317587c71fd33d80  zh/renderers/ols-error.js
726720e9b299d67efc4d3e0e90c6db2666123e67d19bc67af5b1c3f206a5ee2a  zh/src/ols-error.css
b7b88ae9750366ca37ff9a679cf68c01904bc488606980d350eb5189785f4dee  zh/renderers/mean-error.js
f7a7c5bfdc2248b0a258268d1e942f58bf3280b594af159f7e110e9c319d4714  zh/src/mean-error.js
a20a255f6058868bc72f8f3be6f1676e4ac883b307a3c084b87851a2ebfb0934  shared/js/mean-error.js
9ef4ab578be4b40ad5d97d3a7e08ffdc1f9f76aeeefee51b4996e4221556f8e8  shared/data/public/rhc/source.csv
d798c392985620f0b5378a4d8bf0d2fd9689db6bc414ae4734cae52ca1719f30  tests/zh/mean-error-renderer.test.js
```
