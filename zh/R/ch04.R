# 第4讲：EIF的逐格组成
# 输入：冻结的公开RHC原CSV；输出：本讲对象与终端核对值；仅使用base R。
# commandArgs(FALSE)读取启动参数，grep按^匹配开头，value=TRUE保留字符串。输出零项或一项字符向量，定位Rscript当前文件。
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames()读取调用环境；vapply逐个返回长度1字符。被source()调用时ofile记录当前脚本路径；没有路径的环境返回空串。
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if选择来源：source()时取最后一个非空ofile，否则去掉--file=前缀。在项目根R控制台直接运行时，默认使用本讲脚本位置；输出一个路径字符串，[]索引从1开始。
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("zh", "R", "ch04.R")
# length检查路径只有一项；1L是整数1，!is.na排除缺失。stopifnot要求所有条件为TRUE，否则停止。
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname取脚本目录；file.path向上两层拼接项目根，normalizePath要求目录存在。路径不依赖当前工作目录。
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source读取并执行共享R定义，提供实际CSV读取、纯数学函数与手动拟合器。仅使用base R，无需安装TMLE软件包。
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# 从同一官方CSV计算各观测组合的概率及经验模型，输出list；后续所有数值由输入记录决定。
data <- rhc_data()
# 给定初始Q/g和8种观测组合，输出8项拟合EIF函数值；此处不更新Q。
initial_d <- eif_values(data$initial_fit, data$cells)
# mapply逐行同时取组表的a与x，clever_h返回一个权重，输出长度4向量。
h <- mapply(function(a, x) clever_h(data$initial_fit, a, x), data$groups$a, data$groups$x)
# 拼接组身份与H，显示4行；每个H可以为正或负。
print(data.frame(data$groups[c("x", "a")], h = h))
# 各观测组合的经验概率逐项乘初始EIF，再求和为一个经验平均；还没有执行任何修正。
correction <- sum(data$cells$p * initial_d)
# 分开显示初始标准化风险差及经验EIF平均，避免把均值非零误当各人残差不合法。
cat("initial estimate =", data$initial_estimate, "; empirical EIF mean =", correction, "\n")
# 这里的调整变量仅为性别；AIPW修正和Q更新到第8讲才构建。
