# See BEGIN_CH03 in EIFCase.jl for reading and four-group summary definitions.
# q[a+1,x+1]: rows index treatment a, columns index baseline x; fits use only supplied counts.
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "EIFCase.jl"))
using .EIFCase
using Printf

data = case_data(joinpath(@__DIR__, "..", "..", "..", "shared", "data", "rws-counts.csv"))
for group in data.groups
    @printf("x=%d,a=%d: Patient count=%d,Events=%d,Risk=%.6f,Initial Q=%.6f\n", group.x, group.a, group.n, group.events, group.q_observed, group.initial_q)
end
println("Empirical population proportions px = ", data.empirical_model.px)
println("Treatment probabilities g estimated by X = ", data.empirical_model.g)
@printf("Initial risk difference after fitting on A alone=%.6f\n", data.initial_estimate)
