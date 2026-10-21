# 第3讲：三机制的经验对象
# 输入：冻结的公开RHC原CSV；输出：本讲对象与终端核对值；仅使用base R。
# commandArgs(FALSE)读取启动参数，grep按^匹配开头，value=TRUE保留字符串。输出零项或一项字符向量，定位Rscript当前文件。
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames()读取调用环境；vapply逐个返回长度1字符。被source()调用时ofile记录当前脚本路径；没有路径的环境返回空串。
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if选择来源：source()时取最后一个非空ofile，否则去掉--file=前缀。在项目根R控制台直接运行时，默认使用本讲脚本位置；输出一个路径字符串，[]索引从1开始。
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("zh", "R", "ch03.R")
# length检查路径只有一项；1L是整数1，!is.na排除缺失。stopifnot要求所有条件为TRUE，否则停止。
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname取脚本目录；file.path向上两层拼接项目根，normalizePath要求目录存在。路径不依赖当前工作目录。
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source读取并执行共享R定义，提供实际CSV读取、纯数学函数与手动拟合器。仅使用base R，无需安装TMLE软件包。
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# 从同一官方CSV计算各观测组合的概率及经验模型，输出list；后续所有数值由输入记录决定。
data <- rhc_data()
# 显示4×多列分组表，每行对应一个(x,a)；n、events、q_observed、initial_q均由原CSV聚合。
print(data$groups)
# 提取长度2经验X概率向量，依次对应x=0、1。
px <- data$empirical_model$px
# 提取长度2条件RHC概率向量，位置x+1对应基线类别x。
g <- data$empirical_model$g
# 提取2×2条件死亡风险矩阵：行a+1、列x+1；q[1,2]是a=0,x=1。
q <- data$empirical_model$q
# 显示经验人群比例、处理概率及仅按A拟合初始Q后的标准化风险差。
cat("px =", px, "; g =", g, "; initial risk difference =", data$initial_estimate, "\n")
# print保留矩阵行列形状显示2×2风险，不把矩阵行误读为患者。
print(q)
# 这里只按性别标准化，充分混杂控制未得到证明；结果不是已识别的临床因果效应。
