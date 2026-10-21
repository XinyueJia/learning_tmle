# 第0章对象图：只拟合初始模型。每个向量保持同一原CSV行序。
include(joinpath(@__DIR__, "..", "..", "shared", "julia", "RHCCase.jl"))
using .RHCCase
rows = read_rhc_rows(DEFAULT_SOURCE) # 输入原路径，输出n条记录。
observations = rhc_observations(rows) # 每条(x,a,y)是实际数据，不是预测。
y = [person.y for person in observations] # n项实际Y。
fit = prepare_full(rows) # 以15原始基线变量编码为17列design，拟合g与Q。
n = fit.n # 一个整数5735。
design = fit.design # n×17矩阵，含截距与编码后的变量。
a = fit.a # n项实际RHC指标，不会被预测输入覆盖。
y = fit.y # 与前面整数y取值相同，改为拟合器要求的Vector{Float64}。
q_fit = fit.q_fit # Q拟合容器，其coefficients是18项系数。
g_fit = fit.g_fit # g拟合容器，其coefficients是17项系数。
# 下面两行是prepare_full内部的拟合运算；参数顺序为(设计矩阵,结果)。
g_fit = fit_logistic(design, a) # n×17与n项A→g模型。
q_fit = fit_logistic(hcat(design, a), y) # 按列合并为n×18，以n项Y为结果。
# expit由RHCCase导出：一个实数→0与1之间概率，无需重新定义。
g = g_fit.probabilities # n项拟合RHC概率。
q1 = expit.(hcat(design, ones(n)) * q_fit.coefficients) # n×18乘18项，再逐个expit。
q0 = expit.(hcat(design, zeros(n)) * q_fit.coefficients) # 只替换预测输入，系数保持同一套。
qa = fit.a .* q1 + (1 .- fit.a) .* q0 # 同一i由实际A选取对应预测。
qa_selected = copy(qa) # 留下逐行选择的结果，用另一种计算独立核对。
qa = expit.(hcat(design, a) * q_fit.coefficients) # 实际A作为预测输入，仍是同一行。
@assert all(isapprox.(qa, qa_selected; atol=1e-14))
initial_estimate = sum(q1 .- q0) / n # n项预测差→一个初始标准化风险差。
@assert size(design) == (5735,17) && length(q_fit.coefficients) == 18
@assert n == length(a) == length(y) == length(g) == length(q0) == length(q1) == length(qa)
@assert sum(y) == 1918 && sum(a) == 2184
@assert all(0 .< g .< 1) && all(0 .< q0 .< 1) && all(0 .< q1 .< 1)
@assert all(qa[i] == (a[i] == 1 ? q1[i] : q0[i]) for i in 1:n)
@assert all(isapprox.(qa, expit.(hcat(design, a) * q_fit.coefficients); atol=1e-14))
@assert a == [person.a for person in observations] # 预测未改写实际处理。
@assert isapprox(initial_estimate, 0.08649885590233014; atol=1e-9)
println("n=", n, "; Q design=", size(hcat(design,a)), "; initial_estimate=", initial_estimate)
println("Chapter 0 object workbook assertions passed")
