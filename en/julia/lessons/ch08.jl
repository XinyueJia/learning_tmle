# BEGIN_CH08 defines expit, score, four-group updates, bisection and failure checks.
# This script explicitly tries epsilon values and progressively narrows the bracket; no TMLE package is called.
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "EIFCase.jl"))
using .EIFCase
using Printf

function manual_tmle(data; lo=-1.0, hi=1.0, tolerance=1e-12, maxiter=200)
    # Each score is the group sum of H×(observed events−predicted events), divided by total patient count.
    for epsilon in (0.0, 0.1, 0.2)
        @printf("Trial epsilon=%.3f: score=%+.9f\n", epsilon, fluctuation_score(data, epsilon).score)
    end
    fluctuation_score(data, lo).score >= 0 && fluctuation_score(data, hi).score <= 0 ||
        error("Initial bracket does not contain the score root")
    for iteration in 1:maxiter
        step = bisection_step(data, lo, hi)
        if iteration <= 5
            @printf("Bisection %d: epsilon=%.9f, score=%+.9f\n", iteration, step.midpoint, step.score)
        end
        if abs(step.score) <= tolerance
            # case_at computes expit(offset+epsilon×H) in each group, then averages over empirical X proportions.
            result = case_at(data, step.midpoint)
            for group in result.groups
                @printf("x=%d,a=%d: Qstar=%.12f, Score contribution=%+.12f\n", group.x, group.a, group.q_updated, group.score_contribution)
            end
            @printf("epsilon=%.12f, ATE=%.12f, Empirical EIF mean=%.3g, SE=%.9f\n", result.epsilon, result.estimate, result.eif_mean, result.se)
            return result
        end
        step.midpoint != lo && step.midpoint != hi || error("Bisection stopped at floating-point precision")
        lo, hi = step.lo, step.hi
    end
    error("Maximum iterations reached before finding a score root within tolerance")
end

data = case_data(joinpath(@__DIR__, "..", "..", "..", "shared", "data", "rws-counts.csv"))
manual_tmle(data)
