# 第0章同患者Q/g图：共享数据接口

`shared/js/qg-lesson.js`只消费已有的`objectLessonData`结果，不读取新患者、不拟合、不计算新的预测概率。`qgLessonData(data)`固定选择完整队列的前六个位置；若队列不足六行则显示全部。`data.shown/start/count`不改变此图的患者。

`sourceRows`每行含`index/rowNumber`、15项原始`w`、17列既有`design`、`x/age/race/history`、真实`a/y`及初始`q1/q0/g`。`history`包含按`HISTORY`排序的全部12项，不截断、不补造。`rowNumber`是所提供队列的一起始位置；默认原CSV按原顺序传入，因此对应原文件行号。子队列不能声称其行号就是原CSV编号。

`calls.q1/q0/g`的`values`保留全n人预测，`shownValues`为六行投影。`dimensions`是完整n×1，`shownDimensions`为实际显示行数×1。Q的`inputColumns`为`['w','predictionA']`，g为`['w']`。`inputRows`仅含显示行的`rowNumber/w`，Q另含全1或全0的`predictionA`；真实`a/y`保持在`sourceRows`，均不是这三次固定函数调用的输入。Q输出30日死亡概率，g输出实际接受RHC的概率；两者事件不可混称。

原始W为15个基线变量，设计为17列（截距、male、标准化age、race两指示列、12项history），Q另加预测A列。`featureNames`由既有数据复制，`fit.n/scope`明确使用上游完整n人拟合，图不将六行称为拟合样本。函数检查维度、编码对齐、有限值和概率边界，不通过重新拟合或重新预测核对上游模型。

`qgLessonView(lesson,key='q1')`仅增加`selectedKey/selectedCall/readingColumns`；所有源行和三列输出持续保留。选择视图不改任何输入或预测，视图共享已构造lesson的对象供只读渲染。`qgLessonData`的新数组与原输入分离，支持冻结输入。

验证命令：`node --test tests/qg-lesson.test.js`。2026-10-17实际8/8通过：CSV哈希与六行全部原始字段；全n人的三概率从原设计与拟合系数独立手算；真实1000人子队列改变拟合及维度；人工三人fixture；输入不可变；错误与稀疏数组拒绝；切换保留三列。未由此测试确认浏览器呈现或临床因果识别。
