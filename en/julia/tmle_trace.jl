# Chapter 8 column-by-column workbook: same real RHC cohort, original row order retained; no TMLE package.
# include executes shared definitions; @__DIR__ is this file’s directory and two .. return to the project root.
include(joinpath(@__DIR__, "..", "..", "shared", "julia", "RHCCase.jl"))
# using makes the module’s public functions callable in this script.
using .RHCCase
# Read original CSV; prepare_full fits only initial models, without targeting.
rows = read_rhc_rows(DEFAULT_SOURCE)
fit = prepare_full(rows)
# n is a scalar patient count; copy retains independent copies, so later operations do not overwrite observed A/Y or initial models.
n = fit.n
a = copy(fit.a)
y = copy(fit.y)
g = copy(fit.g)
q0 = copy(fit.q0)
q1 = copy(fit.q1)
# Dots denote elementwise broadcasting; A=1 selects q1 and A=0 selects q0, giving an n-element qa vector.
qa = a .* q1 .+ (1 .- a) .* q0
# logit. converts initial probabilities to log odds, giving fixed offsets for later updates.
offset = logit.(qa)
offset0 = logit.(q0)
offset1 = logit.(q1)
# The clever covariate supplies the update direction; dotted division acts row by row rather than as matrix division.
h = a ./ g .- (1 .- a) ./ (1 .- g)
h0 = -1.0 ./ (1 .- g)
h1 = 1.0 ./ g
# ENV reads an environment-variable string; parse converts it to one Float64, with default trial value 0.
epsilon = parse(Float64, get(ENV, "TMLE_EPSILON", "0"))
isfinite(epsilon) || throw(ArgumentError("TMLE_EPSILON must be finite"))
# Multiply the whole h vector by the same scalar epsilon to obtain row-wise shifts, then add the fixed offset elementwise.
shift = epsilon .* h
shift0 = epsilon .* h0
shift1 = epsilon .* h1
eta = offset .+ shift
eta0 = offset0 .+ shift0
eta1 = offset1 .+ shift1
# expit. converts linear predictors to probabilities, giving updated observed-arm predictions.
qstar_a = expit.(eta)
residual = y .- qstar_a
score_contribution = h .* residual
# Both treatment inputs use the same fitted outcome regression, one common epsilon and the same W rows.
qstar0 = expit.(eta0)
qstar1 = expit.(eta1)
# Form n prediction contrasts, then average over all n patients; psi is not an individual causal effect.
contrast = qstar1 .- qstar0
psi = sum(contrast) / n
centred = contrast .- psi
eif = score_contribution .+ centred
# Means are scalars; eif_mean≈score_mean because the empirical mean of centred is approximately 0.
score_mean = sum(score_contribution) / n
eif_mean = sum(eif) / n
# Fail explicitly at floating-point probability boundaries 0/1; no truncation, and observed A/Y always stay fixed.
@assert all(p -> 0 < p < 1, [g; q0; q1; qa; qstar_a; qstar0; qstar1])
@assert a == fit.a && y == fit.y
println("n = ", n, "; epsilon = ", epsilon, "; Risk difference psi = ", psi)
println("score_mean = ", score_mean, "; eif_mean = ", eif_mean)
# Specified baseline variables may omit confounding; an approximately zero empirical equation does not prove clinical causal identification or finite-sample unbiasedness.
