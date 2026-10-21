# See BEGIN_CH06 in EIFCase.jl for the full projection implementation; no projection package is used.
# Only this exercise assumes estimated g is known and fixed; the final TMLE still learns g from supplied counts.
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "EIFCase.jl"))
using .EIFCase
using Printf

data = case_data(joinpath(@__DIR__, "..", "..", "..", "shared", "data", "rws-counts.csv"))
demo = projection_demo(data; b=1.0)
@printf("Candidate squared norm=%.6f, Projection squared norm=%.6f, Residual squared norm=%.6f\n", demo.candidate_second_moment, demo.projection_second_moment, demo.residual_second_moment)
@printf("Maximum difference between projection and canonical gradient=%.3g\n", maximum(abs.(demo.projection-demo.canonical)))
