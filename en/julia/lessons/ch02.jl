# See BEGIN_CH02 in EIFCase.jl for core definitions; this chapter still studies only the endpoint-event mean.
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "EIFCase.jl"))
using .EIFCase
using Printf

data = case_data(joinpath(@__DIR__, "..", "..", "..", "shared", "data", "rws-counts.csv"))
direction = point_direction(data, 4) # Cell 4: x=0,a=1,y=1; indices start at 1.
p = [c.p for c in data.cells]
t = 0.01
pt = linear_path(p, direction.score, t)
new_mean = sum(pt[i] * c.y for (i,c) in enumerate(data.cells))
@printf("Original risk=%.6f, New risk=%.6f, Rate of change=%.6f\n", data.marginal_risk, new_mean, (new_mean-data.marginal_risk)/t)
@printf("Direct derivative=%.6f, IF×score pairing=%.6f\n", direction.derivative, direction.pairing)
for (i,c) in enumerate(data.cells)
    @printf("(%d,%d,%d): h=%+.6f, score=%+.6f\n", c.x, c.a, c.y, direction.h[i], direction.score[i])
end
