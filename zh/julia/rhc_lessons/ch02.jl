# 公开 RHC 队列：X=性别，A=是否 RHC，Y=30 日死亡；全部量由原始记录计算。
# 核心定义见EIFCase.jl的BEGIN_CH02段；本讲仍只研究终点事件均值。
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "RHCCase.jl"))
using .RHCCase
using Printf

data = rhc_data()
direction = point_direction(data, 4) # 第4格：x=0,a=1,y=1；索引从1开始。
p = [c.p for c in data.cells]
t = 0.01
pt = linear_path(p, direction.score, t)
new_mean = sum(pt[i] * c.y for (i,c) in enumerate(data.cells))
@printf("原风险=%.6f，新风险=%.6f，变化率=%.6f\n", data.marginal_risk, new_mean, (new_mean-data.marginal_risk)/t)
@printf("直接导数=%.6f，IF×score配对=%.6f\n", direction.derivative, direction.pairing)
for (i,c) in enumerate(data.cells)
    @printf("(%d,%d,%d): h=%+.6f, score=%+.6f\n", c.x, c.a, c.y, direction.h[i], direction.score[i])
end
