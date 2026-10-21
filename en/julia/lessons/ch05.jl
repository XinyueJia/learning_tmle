# See BEGIN_CH05 in EIFCase.jl for numerical checks of general directions.
# Compute the gradient at the full empirical distribution; do not treat misspecified initial Q as the true model.
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "EIFCase.jl"))
using .EIFCase
using Printf

data = case_data(joinpath(@__DIR__, "..", "..", "..", "shared", "data", "rws-counts.csv"))
model = data.empirical_model
score = [(c.x-model.px[2]) + (c.a-model.g[c.x+1]) +
         (c.y-model.q[c.a+1,c.x+1]) for c in data.cells]
check = direction_check(data, score)
@printf("Mixed direction: difference quotient=%.9f, Gradient pairing=%.9f\n", check.finite_difference, check.pairing)
outcome_score = [c.y-model.q[c.a+1,c.x+1] for c in data.cells]
outcome_check = direction_check(data, outcome_score)
@printf("Outcome direction: difference quotient=%.9f, Gradient pairing=%.9f\n", outcome_check.finite_difference, outcome_check.pairing)
point = point_direction(data, 4) # The same (0,1,1) point direction as Chapter 2.
point_check = direction_check(data, point.score)
@printf("Same point direction: mean derivative=%.6f, ATE derivative pairing=%.6f\n", point.derivative, point_check.pairing)

p = [c.p for c in data.cells]
for j in 1:7
    h = zeros(8)
    h[j] = 1.0
    h[8] = -1.0
    contrast = direction_check(data, h ./ p)
    @printf("Contrast direction %d: direct finite difference=%.9f, Gradient pairing=%.9f\n", j, contrast.finite_difference, contrast.pairing)
end
println("Finite-direction checks help find errors; the conclusion for all directions still relies on the proof in the text.")
