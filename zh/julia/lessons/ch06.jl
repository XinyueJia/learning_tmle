# 投影的完整实现见EIFCase.jl的BEGIN_CH06段，不调用投影软件包。
# 仅本练习假定估计出的g已知固定；最终TMLE仍按输入计数学习g。
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "EIFCase.jl"))
using .EIFCase
using Printf

data = case_data(joinpath(@__DIR__, "..", "..", "..", "shared", "data", "rws-counts.csv"))
demo = projection_demo(data; b=1.0)
@printf("候选平方范数=%.6f，投影平方范数=%.6f，残差平方范数=%.6f\n", demo.candidate_second_moment, demo.projection_second_moment, demo.residual_second_moment)
@printf("投影与典范梯度的最大差=%.3g\n", maximum(abs.(demo.projection-demo.canonical)))
