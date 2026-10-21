# 第8讲：逐列追踪同一epsilon的完整R工作簿
# 输入：冻结的公开RHC原CSV；输出：本讲对象与终端核对值；仅使用base R。
# commandArgs(FALSE)读取启动参数，grep按^匹配开头，value=TRUE保留字符串。输出零项或一项字符向量，定位Rscript当前文件。
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames()读取调用环境；vapply逐个返回长度1字符。被source()调用时ofile记录当前脚本路径；没有路径的环境返回空串。
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if选择来源：source()时取最后一个非空ofile，否则去掉--file=前缀。在项目根R控制台直接运行时，默认使用本讲脚本位置；输出一个路径字符串，[]索引从1开始。
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("zh", "R", "tmle_trace.R")
# length检查路径只有一项；1L是整数1，!is.na排除缺失。stopifnot要求所有条件为TRUE，否则停止。
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname取脚本目录；file.path向上两层拼接项目根，normalizePath要求目录存在。路径不依赖当前工作目录。
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source读取并执行共享R定义，提供实际CSV读取、纯数学函数与手动拟合器。仅使用base R，无需安装TMLE软件包。
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# 读取同一5735×63原始data.frame，保留官方记录行序。
rows <- read_rhc_rows(DEFAULT_SOURCE)
# 拟合初始Q/g并返回list；更新步骤在第8讲。
fit <- prepare_full(rows)
# 读取总人数整数标量；分页不改变n。
n <- fit$n
# 从fit$a提取长度n数值向量；R复制修改语义保留初始对象，同一i对应原CSV同一患者。
a <- fit$a
# 从fit$y提取长度n数值向量；R复制修改语义保留初始对象，同一i对应原CSV同一患者。
y <- fit$y
# 从fit$g提取长度n数值向量；R复制修改语义保留初始对象，同一i对应原CSV同一患者。
g <- fit$g
# 从fit$q0提取长度n数值向量；R复制修改语义保留初始对象，同一i对应原CSV同一患者。
q0 <- fit$q0
# 从fit$q1提取长度n数值向量；R复制修改语义保留初始对象，同一i对应原CSV同一患者。
q1 <- fit$q1
# *、+、-默认逐元素运算；实际a逐行选择q1或q0，输出n项。
qa <- a * q1 + (1 - a) * q0
# logit对qa每项计算log(p/(1-p))，返回n项固定初始对数优势；每项来自初始预测qa。
offset <- logit(qa)
# 对n项初始全A=0预测逐项取logit；保持同一W，输出n项固定offset。
offset0 <- logit(q0)
# 对n项初始全A=1预测逐项取logit；沿用同一Q系数，输出n项固定offset。
offset1 <- logit(q1)
# /和-默认逐元素运算；以实际A及对应g得到n项巧妙协变量，可以为正负。
h <- a / g - (1 - a) / (1 - g)
# 一个标量−1除每项1−g，得到n项负方向，权重允许负值。
h0 <- -1 / (1 - g)
# 一个标量1除每项g，得到n项全A=1方向，不重新拟合g。
h1 <- 1 / g
# Sys.getenv读取环境变量字符串，默认"0"；as.numeric转成一个double标量，全体患者共用；默认0尚未求根。
epsilon <- as.numeric(Sys.getenv("TMLE_EPSILON", "0"))
# 检查epsilon是一个有限标量；非法字符串转换得到NA，由检查报错停止。
stopifnot(length(epsilon) == 1L, is.finite(epsilon))
# 同一个epsilon标量乘整列方向，*逐元素缩放，输出n项对数优势位移。
shift <- epsilon * h
# 同一个epsilon标量乘整列方向，*逐元素缩放，输出n项对数优势位移。
shift0 <- epsilon * h0
# 同一个epsilon标量乘整列方向，*逐元素缩放，输出n项对数优势位移。
shift1 <- epsilon * h1
# 同一行固定offset加位移，+逐元素相加；输出n项线性预测，尚在对数优势尺度。
eta <- offset + shift
# 同一行固定offset加位移，+逐元素相加；输出n项线性预测，尚在对数优势尺度。
eta0 <- offset0 + shift0
# 同一行固定offset加位移，+逐元素相加；输出n项线性预测，尚在对数优势尺度。
eta1 <- offset1 + shift1
# expit对每项线性预测计算1/(1+exp(−u))，输出n项当前epsilon的预测风险；只有求根后才称targeted。
qstar_a <- expit(eta)
# 真实死亡向量逐项减当前实际臂风险，输出n项残差；实际y不变。
residual <- y - qstar_a
# 同行H乘同行残差，产生n项score贡献；随后用sum和n计算整列平均。
score_contribution <- h * residual
# expit对每项线性预测计算1/(1+exp(−u))，输出n项当前epsilon的预测风险；只有求根后才称targeted。
qstar0 <- expit(eta0)
# expit对每项线性预测计算1/(1+exp(−u))，输出n项当前epsilon的预测风险；只有求根后才称targeted。
qstar1 <- expit(eta1)
# 同一人的两臂模型预测逐项相减得到n项；两项都是相同W的模型预测。
contrast <- qstar1 - qstar0
# sum将完整5735项预测差加总，除n得到一个标准化风险差标量；分母是完整队列人数。
psi <- sum(contrast) / n
# 每项预测差减同一个标量psi，得到n项中心化值；平均约0不表示每项0。
centred <- contrast - psi
# 同行score贡献加中心化预测差得到n项完整经验EIF；完整EIF还包含中心化预测差。
eif <- score_contribution + centred
# 先sum完整n项score贡献再除n，输出一个似然score标量；求根针对平均。
score_mean <- sum(score_contribution) / n
# 对全部n项EIF求平均得到标量；应与score_mean在浮点误差内一致，epsilon=0时保留初始模型的经验平均。
eif_mean <- sum(eif) / n
# c仅为边界核对拼接7个长度n概率向量，不改变原对象。
probabilities <- c(g, q0, q1, qa, qstar_a, qstar0, qstar1)
# 严格检查有限且位于(0,1)；浮点端点立即失败，不截断概率。
stopifnot(all(is.finite(probabilities)), all(probabilities > 0), all(probabilities < 1))
# identical检查真实A/Y取值及类型保持不变。
stopifnot(identical(a, fit$a), identical(y, fit$y))
# 显示人数、所试epsilon及风险差；求根步骤在第8讲。
cat("n =", n, "; epsilon =", epsilon, "; risk difference psi =", psi, "\n")
# 分开显示全部n人score平均与完整EIF平均，保留有限精度容差解释。
cat("score_mean =", score_mean, "; eif_mean =", eif_mean, "\n")
# qstar变量在任意epsilon下表示当前Q_epsilon，只有显式求根后才是Q*；本脚本不调用求根器。
