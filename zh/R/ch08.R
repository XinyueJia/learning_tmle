# 第8讲：AIPW与显式手动二分TMLE
# 输入：冻结的公开RHC原CSV；输出：本讲对象与终端核对值；仅使用base R。
# commandArgs(FALSE)读取启动参数，grep按^匹配开头，value=TRUE保留字符串。输出零项或一项字符向量，定位Rscript当前文件。
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames()读取调用环境；vapply逐个返回长度1字符。被source()调用时ofile记录当前脚本路径；没有路径的环境返回空串。
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if选择来源：source()时取最后一个非空ofile，否则去掉--file=前缀。在项目根R控制台直接运行时，默认使用本讲脚本位置；输出一个路径字符串，[]索引从1开始。
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("zh", "R", "ch08.R")
# length检查路径只有一项；1L是整数1，!is.na排除缺失。stopifnot要求所有条件为TRUE，否则停止。
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname取脚本目录；file.path向上两层拼接项目根，normalizePath要求目录存在。路径不依赖当前工作目录。
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source读取并执行共享R定义，提供实际CSV读取、纯数学函数与手动拟合器。仅使用base R，无需安装TMLE软件包。
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# 从同一官方CSV计算各观测组合的概率及经验模型，输出list；后续所有数值由输入记录决定。
data <- rhc_data()
# 依次手动试探三个epsilon标量，for仅查看score，不自动求根。
for (epsilon in c(0, 0.1, 0.2)) {
# 用固定初始offset和H计算每个试探幅度的经验score标量。
  cat("trial epsilon =", epsilon, "; score =", fluctuation_score(data, epsilon)$score, "\n")
# 结束手动试探循环；初始数据和模型不变。
}
# 设定按sex分层计算的求根区间的下端点标量。
lo <- -1
# 设定按sex分层计算的求根区间的上端点标量。
hi <- 1
# 设置score绝对值容差，不把近似零写成精确零。
tolerance <- 1e-12
# 先核对非增score在区间两端夹住根；不满足则停止。
stopifnot(fluctuation_score(data, lo)$score >= 0, fluctuation_score(data, hi)$score <= 0)
# NULL标记求根结果尚待计算；成功后保存更新对象。
targeted <- NULL
# 最多200次显式二分，每次计算一个区间中点。
for (iteration in 1:200) {
# 共享纯函数返回midpoint、score以及缩小后的lo/hi。
  step <- bisection_step(data, lo, hi)
# 显示前5次二分以便核对，全部迭代仍按相同规则计算。
  if (iteration <= 5) cat("bisection", iteration, "; epsilon =", step$midpoint, "; score =", step$score, "\n")
# abs取score绝对值；达到预定容差才进入成功分支。
  if (abs(step$score) <= tolerance) {
# 用已求出的中点更新四组Q，按经验X比例标准化，并计算完整经验EIF与SE。
    targeted <- case_at(data, step$midpoint)
# break退出最近一层for循环，保留合格targeted对象。
    break
# 结束收敛判断分支。
  }
# 防止浮点中点等于端点时继续假装缩小区间。
  stopifnot(step$midpoint != lo, step$midpoint != hi)
# 以score符号确定的新下界替换旧下界。
  lo <- step$lo
# 以score符号确定的新上界替换旧上界。
  hi <- step$hi
# 结束二分循环；未收敛时targeted仍为NULL。
}
# 达到迭代上限仍无合格结果时显式失败，不输出伪收敛。
if (is.null(targeted)) stop("Eight-cell bisection did not converge")
# 显示4组更新Q与score贡献，同一x的两臂按原经验X权重标准化。
print(targeted$groups)
# 显示按sex分层的TMLE风险差、容差内经验EIF平均与SE；只按性别标准化。
cat("eight-cell epsilon =", targeted$epsilon, "; estimate =", targeted$estimate, "; EIF mean =", targeted$eif_mean, "; SE =", targeted$se, "\n")
# 重新读取同一5735人原记录，扩展调整变量时不换队列。
rows <- read_rhc_rows(DEFAULT_SOURCE)
# 构建固定顺序的n×17基线design，拟合g及n×18的Q；年龄分母n、white参考、无正则或隐式截断。
fit <- prepare_full(rows)
# epsilon=0保留初始预测，返回初始标准化风险差、AIPW与经验score。
initial <- full_at(fit, 0)
# 显示设计列和年龄标准化参数，读者可以核对固定调整集。
cat("baseline columns =", fit$feature_names, "; age mean =", fit$age_mean, "; age SD =", fit$age_sd, "\n")
# range显示全部n项g的最小和最大；区分初始plug-in、AIPW及score。
cat("g range =", range(fit$g), "; initial =", initial$estimate, "; AIPW =", initial$aipw, "; score =", initial$score, "\n")
# 对完整基线模型手动试探三个幅度，随后通过二分寻找根。
for (epsilon in c(0, 0.002, 0.004)) {
# 逐人计算固定offset加epsilon×H的更新、score和平均对数似然。
  trial <- full_at(fit, epsilon)
# 显示同一完整5735人平均score和对数似然，分母为全部人数。
  cat("full trial epsilon =", epsilon, "; score =", trial$score, "; log likelihood =", trial$log_likelihood, "\n")
# 结束完整基线手动试探。
}
# 设置完整基线score二分下界。
lo <- -0.25
# 设置完整基线score二分上界。
hi <- 0.25
# 确认完整基线非增score夹住根，失败明确停止。
stopifnot(full_at(fit, lo)$score >= 0, full_at(fit, hi)$score <= 0)
# 以NULL表示还没有达到容差的完整基线结果。
full_targeted <- NULL
# 开始最多200次完整基线手动二分。
for (iteration in 1:200) {
# 在同一fit上计算中点score及更新区间，保留全部初始Q/g。
  step <- full_bisection_step(fit, lo, hi)
# 显示前5次逐人二分的中点与score，便于手工核对。
  if (iteration <= 5) cat("full bisection", iteration, "; epsilon =", step$midpoint, "; score =", step$score, "\n")
# 同一个预设1e−12容差检查完整n人score。
  if (abs(step$score) <= tolerance) {
# 仅在求根后命名为targeted；两臂更新共用同一epsilon并对同一n人标准化。
    full_targeted <- full_at(fit, step$midpoint)
# 退出完整基线二分循环。
    break
# 结束完整基线收敛分支。
  }
# 浮点中点无法继续缩小时立即停止，避免假收敛。
  stopifnot(step$midpoint != lo, step$midpoint != hi)
# 保留含根的新下界标量。
  lo <- step$lo
# 保留含根的新上界标量。
  hi <- step$hi
# 结束完整基线二分循环。
}
# 迭代耗尽时明确报错；合格结果以score容差为准。
if (is.null(full_targeted)) stop("Full baseline bisection did not converge")
# 分别显示求根幅度、两臂全部n人平均风险和标准化风险差。
cat("full epsilon =", full_targeted$epsilon, "; risk0 =", full_targeted$risk0, "; risk1 =", full_targeted$risk1, "; TMLE =", full_targeted$estimate, "\n")
# 分别显示似然score、完整EIF平均和经验SE；有限样本和推断条件见本章技术说明。
cat("full score =", full_targeted$score, "; EIF mean =", full_targeted$eif_mean, "; empirical SE =", full_targeted$se, "\n")
# 完整基线仍省略急性病情严重程度；充分混杂控制与选择机制假设未由数据证明。
