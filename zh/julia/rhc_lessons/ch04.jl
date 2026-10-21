# 公开 RHC 队列：X=性别，A=是否 RHC，Y=30 日死亡；全部量由原始记录计算。
# H及梯度定义见EIFCase.jl的BEGIN_CH04段；此处尚不更新Q。
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "RHCCase.jl"))
using .RHCCase
using Printf

data = rhc_data()
initial_d = eif_values(data.initial_fit, data.cells)
for group in data.groups
    h = clever_h(data.initial_fit, group.a, group.x)
    @printf("x=%d,a=%d: H=%+.6f\n", group.x, group.a, h)
end
correction = sum(c.p * initial_d[i] for (i,c) in enumerate(data.cells))
@printf("初始目标=%+.6f，初始拟合梯度的样本平均=%+.6f\n", data.initial_estimate, correction)
println("本讲只保存初始目标和经验梯度平均，怎样据此修正估计或更新Q在第8讲构建。")

println("此处仅按性别标准化，未建立充分混杂控制；结果不作为 RHC 临床因果效应。")
