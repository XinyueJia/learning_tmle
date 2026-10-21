# 公开 RHC 队列：X=性别，A=是否 RHC，Y=30 日死亡；全部量由原始记录计算。
# 读取与四组汇总的完整定义见EIFCase.jl的BEGIN_CH03段。
# q[a+1,x+1]：行是处理a，列是基线x；所有拟合只用传入计数。
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "RHCCase.jl"))
using .RHCCase
using Printf

data = rhc_data()
for group in data.groups
    @printf("x=%d,a=%d: 人数=%d,事件=%d,风险=%.6f,初始Q=%.6f\n", group.x, group.a, group.n, group.events, group.q_observed, group.initial_q)
end
println("经验人群比例 px = ", data.empirical_model.px)
println("按X估计的处理概率 g = ", data.empirical_model.g)
@printf("只按A拟合后的初始风险差=%.6f\n", data.initial_estimate)

println("此处仅按性别标准化，未建立充分混杂控制；结果不作为 RHC 临床因果效应。")
