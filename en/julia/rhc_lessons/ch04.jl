# Public RHC cohort: X=sex, A=RHC receipt, Y=30-day death; all quantities are computed from original records.
# See BEGIN_CH04 in EIFCase.jl for H and gradient definitions; Q is not updated here yet.
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
@printf("Initial target=%+.6f, Sample mean of the initially fitted gradient=%+.6f\n", data.initial_estimate, correction)
println("This chapter retains the initial target and empirical gradient mean; Chapter 8 constructs the correction and Q update.")

println("Standardisation here uses sex alone, without establishing sufficient confounding control; results are not clinical causal effects of RHC.")
