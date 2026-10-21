# 第5讲：多方向核对
# 输入：冻结的公开RHC原CSV；输出：本讲对象与终端核对值；仅使用base R。
# commandArgs(FALSE)读取启动参数，grep按^匹配开头，value=TRUE保留字符串。输出零项或一项字符向量，定位Rscript当前文件。
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames()读取调用环境；vapply逐个返回长度1字符。被source()调用时ofile记录当前脚本路径；没有路径的环境返回空串。
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if选择来源：source()时取最后一个非空ofile，否则去掉--file=前缀。在项目根R控制台直接运行时，默认使用本讲脚本位置；输出一个路径字符串，[]索引从1开始。
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("zh", "R", "ch05.R")
# length检查路径只有一项；1L是整数1，!is.na排除缺失。stopifnot要求所有条件为TRUE，否则停止。
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname取脚本目录；file.path向上两层拼接项目根，normalizePath要求目录存在。路径不依赖当前工作目录。
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source读取并执行共享R定义，提供实际CSV读取、纯数学函数与手动拟合器。仅使用base R，无需安装TMLE软件包。
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# 从同一官方CSV计算各观测组合的概率及经验模型，输出list；后续所有数值由输入记录决定。
data <- rhc_data()
# 采用完整经验分布的饱和模型list，作为梯度验证的数学基点。
model <- data$empirical_model
# 取8行格表，按x,a,y顺序排列；保持后续向量对齐。
cells <- data$cells
# R矩阵用双列索引矩阵逐格取元素；cbind第一列是行a+1，第二列是列x+1，输出8项。
q_at_cell <- model$q[cbind(cells$a + 1L, cells$x + 1L)]
# 三种中心化机制方向逐项相加，输出8项混合score；g按x+1索引。
score <- (cells$x - model$px[2]) + (cells$a - model$g[cells$x + 1L]) + (cells$y - q_at_cell)
# 对合法概率路径计算中心差商及梯度配对，返回list。
check <- direction_check(data, score)
# 只取结局机制中心化残差，输出8项；另外两机制固定。
outcome_score <- cells$y - q_at_cell
# 用同一经验基点检查纯结局方向。
outcome_check <- direction_check(data, outcome_score)
# 重用第2讲同一(0,1,1)点方向，输出包含score和均值导数的list。
point <- point_direction(data, 4L)
# 相同score此时对性别标准化风险差求导；目标已不同于均值。
point_check <- direction_check(data, point$score)
# list按名称保留三套检查，print分别显示，避免混合不同目标导数。
print(list(mixed = check, outcome = outcome_check, point = point_check))
# 读取8项经验格概率，作为h转score的逐项除数。
p <- cells$p
# for循环让j依次取1至7；大括号开始本次循环体，构造七个独立质量转移方向。
for (j in 1:7) {
# numeric(8)创建长度8全零数值向量；每次循环重新创建。
  h <- numeric(8) 
# []按1起始位置把第j格质量增量设为1。
  h[j] <- 1
# 第8种组合设−1，与第j格+1相抵，确保h和为0。
  h[8] <- -1
# /逐项除法把质量方向h变成score；共享函数在全正概率路径上使用预设中心差分步长。
  contrast_check <- direction_check(data, h / p)
# 显示本次独立方向的直接差商与梯度配对。
  cat("direction", j, "; finite difference =", contrast_check$finite_difference, "; pairing =", contrast_check$pairing, "\n")
# 结束循环体；七个数值检查辅助发现错误，全方向结论仍依靠正文证明。
}
