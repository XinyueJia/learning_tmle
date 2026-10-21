# 公开 RHC 队列：X=性别，A=是否 RHC，Y=30 日死亡；全部量由原始记录计算。
# 一般方向数值检查见EIFCase.jl的BEGIN_CH05段。
# 这里在完整经验分布计算梯度；不是拿错设的初始Q当真模型。
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "RHCCase.jl"))
using .RHCCase
using Printf

data = rhc_data()
model = data.empirical_model
score = [(c.x-model.px[2]) + (c.a-model.g[c.x+1]) +
         (c.y-model.q[c.a+1,c.x+1]) for c in data.cells]
check = direction_check(data, score)
@printf("混合方向：差商=%.9f，梯度配对=%.9f\n", check.finite_difference, check.pairing)
outcome_score = [c.y-model.q[c.a+1,c.x+1] for c in data.cells]
outcome_check = direction_check(data, outcome_score)
@printf("结局方向：差商=%.9f，梯度配对=%.9f\n", outcome_check.finite_difference, outcome_check.pairing)
point = point_direction(data, 4) # 与第2讲相同的(0,1,1)点方向。
point_check = direction_check(data, point.score)
@printf("同一点方向：均值导数=%.6f，性别标准化风险差导数配对=%.6f\n", point.derivative, point_check.pairing)

p = [c.p for c in data.cells]
for j in 1:7
    h = zeros(8)
    h[j] = 1.0
    h[8] = -1.0
    contrast = direction_check(data, h ./ p)
    @printf("对比方向%d：直接差分=%.9f，梯度配对=%.9f\n", j, contrast.finite_difference, contrast.pairing)
end
println("有限方向检查帮助发现错误；全方向结论仍依靠正文证明。")
