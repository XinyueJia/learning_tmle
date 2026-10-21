# 第0讲：初始Q/g真实对象工作簿
# 输入：冻结的公开RHC原CSV；输出：本讲对象与终端核对值；仅使用base R。
# commandArgs(FALSE)读取启动参数，grep按^匹配开头，value=TRUE保留字符串。输出零项或一项字符向量，定位Rscript当前文件。
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames()读取调用环境；vapply逐个返回长度1字符。被source()调用时ofile记录当前脚本路径；没有路径的环境返回空串。
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if选择来源：source()时取最后一个非空ofile，否则去掉--file=前缀。在项目根R控制台直接运行时，默认使用本讲脚本位置；输出一个路径字符串，[]索引从1开始。
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("zh", "R", "ch00.R")
# length检查路径只有一项；1L是整数1，!is.na排除缺失。stopifnot要求所有条件为TRUE，否则停止。
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname取脚本目录；file.path向上两层拼接项目根，normalizePath要求目录存在。路径不依赖当前工作目录。
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source读取并执行共享R定义，提供实际CSV读取、纯数学函数与手动拟合器。仅使用base R，无需安装TMLE软件包。
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# read_rhc_rows读取官方原CSV；DEFAULT_SOURCE由共享文件定位。rows为5735×63 data.frame；每行仍是同一患者。
rows <- read_rhc_rows(DEFAULT_SOURCE)
# 将原字段sex、swang1、dth30编码为x、a、y三列0/1；输出n×3 data.frame，保留原始行序。
observations <- rhc_observations(rows)
# $按名称取出y列。y是长度n的数值向量，1表示30日死亡，0表示未死亡；长度为n，dim为NULL。
y <- observations$y
# length数向量元素，返回一个整数人数n=5735。nrow数data.frame的患者行，length数其变量列。
n <- length(y)
# prepare_full以15项原始基线构建17列含截距设计并拟合g和Q，返回list；本行输出初始模型。
fit <- prepare_full(rows)
# 从list提取n×17数值矩阵design；年龄使用分母n的标准差，race以white为参考。
design <- fit$design
# 提取实际RHC的长度n数值向量a；后面只替换新建预测输入列。
a <- fit$a
# 提取拟合器保存的长度n死亡向量，与原observations$y逐项一致。
y <- fit$y
# 提取Q模型list；coefficients是18项数值向量，对应设计列。
q_fit <- fit$q_fit
# 提取g模型list；coefficients是17项，probabilities是n项。
g_fit <- fit$g_fit
# 展示prepare_full内部真实拟合：n×17矩阵与n项实际A输入Newton及似然回溯，输出g拟合list。
g_fit <- fit_logistic(design, a)
# cbind按列拼接n×17与n项a成为n×18，fit_logistic以y为结局，输出同一套18项Q系数。
q_fit <- fit_logistic(cbind(design, a), y)
# 读取拟合的n项RHC概率；g与死亡风险Q预测不同事件。
g <- g_fit$probabilities
# rep(1,n)新建n项全1输入；cbind成为n×18，%*%为矩阵乘法，drop把n×1矩阵变成向量，expit逐项转为风险。
q1 <- expit(drop(cbind(design, rep(1, n)) %*% q_fit$coefficients))
# 同一套系数和W，新建A输入全0；输出n项q0，不覆盖实际a。
q0 <- expit(drop(cbind(design, rep(0, n)) %*% q_fit$coefficients))
# R的*、+、-默认逐元素运算；每行实际A=1选q1、A=0选q0，输出n项。
qa <- a * q1 + (1 - a) * q0
# 保存选择结果；R复制修改语义让后续重新赋值qa保留此值，用于独立核对。
qa_selected <- qa
# 以实际a拼接同一design，直接计算实际臂风险；应与逐行选择相同。
qa <- expit(drop(cbind(design, a) %*% q_fit$coefficients))
# 先逐人相减得到n项，再sum并除总人数得到一个初始标准化风险差。
initial_estimate <- sum(q1 - q0) / n
# 同时核对总人数、死亡人数及RHC人数；失败立即退出。
stopifnot(n == 5735L, sum(y) == 1918, sum(a) == 2184)
# dim返回矩阵的两个整数维度，identical逐项及类型核对；Q系数必须有18项。
stopifnot(identical(dim(design), c(n, 17L)), length(q_fit$coefficients) == 18L)
# all把逐项判断汇总为一个逻辑值：直接预测与选择差异须小于容差；实际A保持不变。
stopifnot(all(abs(qa - qa_selected) < 1e-14), all(a == observations$a))
# c拼接三列只为检查严格概率边界；任何端点即失败，不截断。
stopifnot(all(c(g, q0, q1) > 0), all(c(g, q0, q1) < 1))
# cat显示已有标量与矩阵维度，\n换行。概率差乘100才是百分点。
cat("n =", n, "; design =", dim(design), "; initial risk difference =", initial_estimate, "\n")
# 基线变量仍可能遗漏混杂，初始标准化关联不能直接解释为临床因果效果。
