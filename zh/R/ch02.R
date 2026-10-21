# 第2讲：概率方向与均值导数
# 输入：冻结的公开RHC原CSV；输出：本讲对象与终端核对值；仅使用base R。
# commandArgs(FALSE)读取启动参数，grep按^匹配开头，value=TRUE保留字符串。输出零项或一项字符向量，定位Rscript当前文件。
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames()读取调用环境；vapply逐个返回长度1字符。被source()调用时ofile记录当前脚本路径；没有路径的环境返回空串。
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if选择来源：source()时取最后一个非空ofile，否则去掉--file=前缀。在项目根R控制台直接运行时，默认使用本讲脚本位置；输出一个路径字符串，[]索引从1开始。
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("zh", "R", "ch02.R")
# length检查路径只有一项；1L是整数1，!is.na排除缺失。stopifnot要求所有条件为TRUE，否则停止。
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname取脚本目录；file.path向上两层拼接项目根，normalizePath要求目录存在。路径不依赖当前工作目录。
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source读取并执行共享R定义，提供实际CSV读取、纯数学函数与手动拟合器。仅使用base R，无需安装TMLE软件包。
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# 从同一官方CSV计算各观测组合的概率及经验模型，输出list；后续所有数值由输入记录决定。
data <- rhc_data()
# 第4格是(x,a,y)=(0,1,1)；R索引从1开始。返回h、score、导数与配对的list。
direction <- point_direction(data, 4L)
# 连续两个$从data取cells表再取p列，输出长度8概率向量。
p <- data$cells$p
# 设置无量纲路径步长，一个数值标量。
t <- 0.01
# 保持格顺序计算8项新概率；共享函数拒绝非法概率。
pt <- linear_path(p, direction$score, t)
# 各观测组合的新概率乘对应结局，再对8种观测组合求和，得到一个新均值。
new_mean <- sum(pt * data$cells$y)
# 显示旧风险、新风险及变化率，除数t非零。
cat("risk =", data$marginal_risk, "; new risk =", new_mean, "; rate =", (new_mean - data$marginal_risk) / t, "\n")
# 显示直接导数和IF与score配对；两者应相同。
cat("derivative =", direction$derivative, "; IF-score pairing =", direction$pairing, "\n")
# [c(...)]选择三列；data.frame按同一格拼接h和score，print显示8行，保持原数据。
print(data.frame(data$cells[c("x", "a", "y")], h = direction$h, score = direction$score))
