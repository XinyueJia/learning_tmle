# 第8讲逐列工作簿：同一真实RHC队列，保留原行序；不使用TMLE软件包。
# include执行共享定义；@__DIR__是当前文件目录，两个..返回项目根目录。
include(joinpath(@__DIR__, "..", "..", "shared", "julia", "RHCCase.jl"))
# using让当前脚本可以直接调用模块公开的函数。
using .RHCCase
# 读取原CSV；prepare_full仅拟合初始模型，没有执行targeting。
rows = read_rhc_rows(DEFAULT_SOURCE)
fit = prepare_full(rows)
# n是人数标量；copy保留独立副本，后续运算不覆盖实际A、Y或初始模型。
n = fit.n
a = copy(fit.a)
y = copy(fit.y)
g = copy(fit.g)
q0 = copy(fit.q0)
q1 = copy(fit.q1)
# .表示逐元素（broadcast）；A=1取q1，A=0取q0，qa仍是n项向量。
qa = a .* q1 .+ (1 .- a) .* q0
# logit.逐项转换到对数优势尺度（log-odds）；offset是固定初始预测，不是Y。
offset = logit.(qa)
offset0 = logit.(q0)
offset1 = logit.(q1)
# clever covariate提供更新方向；点除法逐行运算，不是矩阵除法。
h = a ./ g .- (1 .- a) ./ (1 .- g)
h0 = -1.0 ./ (1 .- g)
h1 = 1.0 ./ g
# ENV读取环境变量字符串；parse转为一个Float64，默认试探幅度为0。
epsilon = parse(Float64, get(ENV, "TMLE_EPSILON", "0"))
isfinite(epsilon) || throw(ArgumentError("TMLE_EPSILON must be finite"))
# 同一个标量epsilon乘整列h得到逐行位移，再与固定offset逐项相加。
shift = epsilon .* h
shift0 = epsilon .* h0
shift1 = epsilon .* h1
eta = offset .+ shift
eta0 = offset0 .+ shift0
eta1 = offset1 .+ shift1
# expit.将每项线性预测转回概率，得到实际接受处理下的更新预测。
qstar_a = expit.(eta)
residual = y .- qstar_a
score_contribution = h .* residual
# 两个反事实预测输入使用同一初始模型、同一个epsilon和同一批W。
qstar0 = expit.(eta0)
qstar1 = expit.(eta1)
# 先得到n项预测差，再对全部n人平均；psi不是某个人的因果效应。
contrast = qstar1 .- qstar0
psi = sum(contrast) / n
centred = contrast .- psi
eif = score_contribution .+ centred
# 均值为标量；eif_mean≈score_mean，因为centred的经验平均≈0。
score_mean = sum(score_contribution) / n
eif_mean = sum(eif) / n
# 浮点数达到0/1边界时显式失败，不截断概率；实际A/Y始终保持不变。
@assert all(p -> 0 < p < 1, [g; q0; q1; qa; qstar_a; qstar0; qstar1])
@assert a == fit.a && y == fit.y
println("n = ", n, "；epsilon = ", epsilon, "；风险差 psi = ", psi)
println("score_mean = ", score_mean, "；eif_mean = ", eif_mean)
# 指定基线仍可能遗漏混杂；经验方程近似零不证明临床因果识别或有限样本无偏。
