# 方差与SE的加权计算见EIFCase.jl的BEGIN_CH07段。
# 两套函数都按当前频数表平均，不能当作已知真实分布的效率界。
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "EIFCase.jl"))
using .EIFCase
using Printf

data = case_data(joinpath(@__DIR__, "..", "..", "..", "shared", "data", "rws-counts.csv"))
initial_values = eif_values(data.initial_fit, data.cells)
initial_moments = if_variance(data, initial_values)
@printf("初始拟合函数：mean=%.8f，second_moment=%.8f，variance=%.8f，se=%.8f（%.4f个百分点）\n", initial_moments.mean, initial_moments.second_moment, initial_moments.variance, initial_moments.se, 100initial_moments.se)

saturated_values = eif_values(data.empirical_model, data.cells)
saturated_moments = if_variance(data, saturated_values)
@printf("饱和经验分布函数：mean=%.8f，second_moment=%.8f，variance=%.8f，se=%.8f（%.4f个百分点）\n", saturated_moments.mean, saturated_moments.second_moment, saturated_moments.variance, saturated_moments.se, 100saturated_moments.se)
println("两套都是当前表的经验量，不是已知真实分布的效率界，也不是一次样本的实际估计误差。")
println("第8讲更新Q后还要重新计算；这两套SE都不是更新后的SE。")
