# 第7讲：经验IF方差与SE
# 输入：冻结的公开RHC原CSV；输出：本讲对象与终端核对值；仅使用base R。
# commandArgs(FALSE)读取启动参数，grep按^匹配开头，value=TRUE保留字符串。输出零项或一项字符向量，定位Rscript当前文件。
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames()读取调用环境；vapply逐个返回长度1字符。被source()调用时ofile记录当前脚本路径；没有路径的环境返回空串。
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if选择来源：source()时取最后一个非空ofile，否则去掉--file=前缀。在项目根R控制台直接运行时，默认使用本讲脚本位置；输出一个路径字符串，[]索引从1开始。
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("zh", "R", "ch07.R")
# length检查路径只有一项；1L是整数1，!is.na排除缺失。stopifnot要求所有条件为TRUE，否则停止。
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname取脚本目录；file.path向上两层拼接项目根，normalizePath要求目录存在。路径不依赖当前工作目录。
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source读取并执行共享R定义，提供实际CSV读取、纯数学函数与手动拟合器。仅使用base R，无需安装TMLE软件包。
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# 从同一官方CSV计算各观测组合的概率及经验模型，输出list；后续所有数值由输入记录决定。
data <- rhc_data()
# 初始拟合Q/g在8种观测组合上的EIF值，输出8项向量。
initial_values <- eif_values(data$initial_fit, data$cells)
# 按当前格概率计算平均、二阶矩、中心方差及SE，返回list。
initial_moments <- if_variance(data, initial_values)
# 在完整经验分布饱和模型上计算8项EIF，区别于初始仅按A的Q。
saturated_values <- eif_values(data$empirical_model, data$cells)
# 同样概率加权得到第二套经验矩list。
saturated_moments <- if_variance(data, saturated_values)
# 按名称显示两套经验平均、二阶矩、方差、SE；不能当作已知P0效率界。
print(list(initial = initial_moments, saturated = saturated_moments))
# 两个概率差SE分别乘100换成百分点；方差换成百分点平方时乘10000。
cat("initial SE in percentage points =", 100 * initial_moments$se, "; saturated =", 100 * saturated_moments$se, "\n")
# 这些量不等于一次样本的实际估计误差；第8讲更新Q后须重新计算SE。
