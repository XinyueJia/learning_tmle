# 读取与四组汇总的完整定义见EIFCase.jl的BEGIN_CH03段。
# q[a+1,x+1]：行是处理a，列是基线x；所有拟合只用传入计数。
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "EIFCase.jl"))
using .EIFCase
using Printf

data = case_data(joinpath(@__DIR__, "..", "..", "..", "shared", "data", "rws-counts.csv"))
for group in data.groups
    @printf("x=%d,a=%d: 人数=%d,事件=%d,风险=%.6f,初始Q=%.6f\n", group.x, group.a, group.n, group.events, group.q_observed, group.initial_q)
end
println("经验人群比例 px = ", data.empirical_model.px)
println("按X估计的处理概率 g = ", data.empirical_model.g)
@printf("只按A拟合后的初始风险差=%.6f\n", data.initial_estimate)
