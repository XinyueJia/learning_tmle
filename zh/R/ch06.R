# 第6讲：已知g练习的投影
# 输入：冻结的公开RHC原CSV；输出：本讲对象与终端核对值；仅使用base R。
# commandArgs(FALSE)读取启动参数，grep按^匹配开头，value=TRUE保留字符串。输出零项或一项字符向量，定位Rscript当前文件。
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames()读取调用环境；vapply逐个返回长度1字符。被source()调用时ofile记录当前脚本路径；没有路径的环境返回空串。
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if选择来源：source()时取最后一个非空ofile，否则去掉--file=前缀。在项目根R控制台直接运行时，默认使用本讲脚本位置；输出一个路径字符串，[]索引从1开始。
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("zh", "R", "ch06.R")
# length检查路径只有一项；1L是整数1，!is.na排除缺失。stopifnot要求所有条件为TRUE，否则停止。
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname取脚本目录；file.path向上两层拼接项目根，normalizePath要求目录存在。路径不依赖当前工作目录。
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source读取并执行共享R定义，提供实际CSV读取、纯数学函数与手动拟合器。仅使用base R，无需安装TMLE软件包。
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# 从同一官方CSV计算各观测组合的概率及经验模型，输出list；后续所有数值由输入记录决定。
data <- rhc_data()
# 在本练习固定经验g，b设候选附加分量系数；手工加权线性代数投影返回list。
demo <- projection_demo(data, b = 1)
# 显示三个加权平方范数标量，检查勾股分解；单位是概率差平方。
cat("candidate norm squared =", demo$candidate_second_moment, "; projection =", demo$projection_second_moment, "; residual =", demo$residual_second_moment, "\n")
# 逐格相减后abs取绝对值，max把8项收缩为一个最大误差。
projection_error <- max(abs(demo$projection - demo$canonical))
# 显示投影与典范梯度的最大数值差；该练习使用固定g的模型。
cat("maximum projection error =", projection_error, "\n")
# 本练习的已知g五维模型与观察g未知七维模型不同；最终TMLE仍从数据学习g。
