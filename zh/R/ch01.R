# 第1讲：均值、路径与影响值的连续R入门工作簿
# 输入：冻结的公开RHC原CSV；输出：本讲对象与终端核对值；仅使用base R。
# commandArgs(FALSE)读取启动参数，grep按^匹配开头，value=TRUE保留字符串。输出零项或一项字符向量，定位Rscript当前文件。
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames()读取调用环境；vapply逐个返回长度1字符。被source()调用时ofile记录当前脚本路径；没有路径的环境返回空串。
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if选择来源：source()时取最后一个非空ofile，否则去掉--file=前缀。在项目根R控制台直接运行时，默认使用本讲脚本位置；输出一个路径字符串，[]索引从1开始。
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("zh", "R", "ch01.R")
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
# sum将n项0/1相加，返回死亡人数标量1918；<-把右侧结果赋给左侧名字。
events <- sum(y)
# /是除法；两个标量相除得到样本30日死亡风险，单位为概率。
risk <- events / n
# c把0、1合成长度2数值向量。此处两项表示可能结局类别，分别对应结局0与1。
support_y <- c(0, 1)
# function(v)是接收一个结局的规则；==逐人判断，mean将TRUE当1、FALSE当0平均。vapply对两个类别分别调用并要求每次输出一个数，p长度2。
p <- vapply(support_y, function(v) mean(y == v), numeric(1))
# *按同一结局逐项相乘，sum把两项收缩为均值标量；这里冻结参考为经验结局分布。
mu <- sum(p * support_y)
# 选择接收新增权重的结局1；z是一个数值标量，仅允许0或1。
z <- 1
# 设置无量纲替换比例0.1；t取0至1，数学上改变概率权重，不修改原患者y。
t <- 0.1
# %in%检查属于允许类别；is.finite排除NA、无穷大，stopifnot检查合法路径步长。
stopifnot(z %in% support_y, is.finite(t), t >= 0, t <= 1)
# ==对两类逐项判断，as.numeric把FALSE/TRUE变成0/1；输出长度2点质量概率向量。
point <- as.numeric(support_y == z)
# 括号先运算；标量乘向量是逐元素缩放，两组分相加得到长度2新概率。
p_t <- (1 - t) * p + t * point
# 结局支持不变，只换新概率；逐项乘再求和得到新均值标量。
mu_t <- sum(p_t * support_y)
# 两个均值标量相减，delta单位为概率差。
delta <- mu_t - mu
# 选择的结局减冻结原均值，得到均值路径导数；目标为本讲的均值。
derivative <- z - mu
# if只选择一个分支；t为0时不做0/0，返回数值缺失NA_real_。非零t时返回一个变化率。
rate <- if (t == 0) NA_real_ else delta / t
# 乘法先于加法，计算一个新均值；对均值目标这是精确线性恒等式。
linear_mean <- mu + t * derivative
# R将一个标量从两项分别减去，输出长度2函数值表；固定P下D(y)=y−mu。
support_D <- support_y - mu
# 同一规则应用到全部n位患者，返回长度n数值向量；长度为n，dim为NULL。
influence <- y - risk
# 先sum全部n项再除n，得到一个平均；浮点下允许极小误差。
mean_influence <- sum(influence) / n
# 按原概率对两项函数表加权求和，得到与逐人平均相同的标量。
grouped_mean_D <- sum(p * support_D)
# 固定旧D，仅换新分布权重；这次平均通常非零。
old_mean_D <- sum(p_t * support_D)
# 以新均值为中心建立另一条函数的长度2值表。
new_support_D <- support_y - mu_t
# 新函数在新分布下的加权平均重新为零；与上一行使用旧函数的量不同。
new_mean_D <- sum(p_t * new_support_D)
# 逐人取0/1补集，返回长度n存活指标向量，行序不变。
alive <- 1 - y
# 存活指标先相加再除全部人数，得到一个30日存活风险标量。
survival <- sum(alive) / n
# 每位患者存活指标减存活均值，得到n项；等于死亡均值影响值的反号。
survival_influence <- alive - survival
# 同一原始CSV按(x,a,y)组合及(a,x)分组分别汇总，返回list；对应冻结的经验参考分布。
data <- rhc_data(DEFAULT_SOURCE)
# mean_if用各观测组合的概率计算均值及加权IF平均，输出list供独立核对。
check <- mean_if(data)
# 核对官方人数和事件数，以及两类加权均值的独立分数基准。
stopifnot(n == 5735L, events == 1918, abs(mu - 1918 / 5735) < 1e-14)
# 检查n项患者影响值、2项类别概率和合法概率和；患者与结局支持两种对齐不可混淆。
stopifnot(length(influence) == n, length(p_t) == 2L, abs(sum(p_t) - 1) < 1e-14, all(p_t >= 0))
# ||是短路或：t=0产生NA的分支无需检查未定义变化率；其余情况核对精确线性和变化率。
stopifnot(abs(mu_t - linear_mean) < 1e-14, is.na(rate) || abs(rate - derivative) < 1e-12)
# 要求三种正确中心化平均在数值容差内为零；患者间贡献可以互相抵消。
stopifnot(abs(mean_influence) < 1e-12, abs(grouped_mean_D) < 1e-12, abs(new_mean_D) < 1e-12)
# 核对旧函数新权重的平均等于均值变化、存活IF逐项反号，以及按组和逐人风险一致。
stopifnot(abs(old_mean_D - delta) < 1e-14, all(abs(survival_influence + influence) < 1e-14), abs(check$risk - risk) < 1e-14)
# cat按次序显示对象，分号文字只是分隔符；\n是换行，不计算新的统计量。
cat("n =", n, "; events =", events, "; risk =", risk, "; mu_t =", mu_t, "\n")
# 分开显示逐人平均、旧函数新权重平均与新函数新权重平均，避免把三个量混为同一对象。
cat("mean_influence =", mean_influence, "; old_mean_D =", old_mean_D, "; new_mean_D =", new_mean_D, "\n")
# 本讲描述同一公开队列的均值，不估计RHC处理效果；未知真实P0与经验Pn不同。
