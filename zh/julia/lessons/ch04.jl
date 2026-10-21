# H及梯度定义见EIFCase.jl的BEGIN_CH04段；此处尚不更新Q。
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "EIFCase.jl"))
using .EIFCase
using Printf

data = case_data(joinpath(@__DIR__, "..", "..", "..", "shared", "data", "rws-counts.csv"))
initial_d = eif_values(data.initial_fit, data.cells)
for group in data.groups
    h = clever_h(data.initial_fit, group.a, group.x)
    @printf("x=%d,a=%d: H=%+.6f\n", group.x, group.a, h)
end
correction = sum(c.p * initial_d[i] for (i,c) in enumerate(data.cells))
@printf("初始目标=%+.6f，初始拟合梯度的样本平均=%+.6f\n", data.initial_estimate, correction)
println("本讲只保存初始目标和经验梯度平均，怎样据此修正估计或更新Q在第8讲构建。")
