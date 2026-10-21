# Public RHC cohort: X=sex, A=RHC receipt, Y=30-day death; all quantities are computed from original records.
# BEGIN_CH08 defines expit, score, four-group updates, bisection and failure checks.
# This script explicitly tries epsilon values and progressively narrows the bracket; no TMLE package is called.
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "RHCCase.jl"))
using .RHCCase
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
            @printf("epsilon=%.12f, Sex-standardised risk difference=%.12f, Empirical EIF mean=%.3g, SE=%.9f\n", result.epsilon, result.estimate, result.eif_mean, result.se)
            return result
        end
        step.midpoint != lo && step.midpoint != hi || error("Bisection stopped at floating-point precision")
        lo, hi = step.lo, step.hi
    end
    error("Maximum iterations reached before finding a score root within tolerance")
end

data = rhc_data()
manual_tmle(data)

println("Standardisation here uses sex alone, without establishing sufficient confounding control; results are not clinical causal effects of RHC.")

# For the same 5735 patients, finally expand X from sex to the prespecified 17-column baseline design.
# See BEGIN_FULL_BASELINE in RHCCase.jl for logistic-regression Newton steps and likelihood backtracking.
# See BEGIN_FULL_TARGET for patient-level updates and score; no TMLE or regression packages are used.
function manual_baseline_tmle(fit; lo=-0.25, hi=0.25, tolerance=1e-12, maxiter=200)
    println("Expanded baseline columns = ", fit.feature_names)
    println("Age standardisation: mean=", fit.age_mean, ", Population SD=", fit.age_sd)
    println("g minimum/maximum=", extrema(fit.g), "; No truncation or imputation")
    initial = full_at(fit, 0.0)
    @printf("Expanded-baseline initial risk difference=%+.9f; AIPW=%+.9f; score=%+.9f\n", initial.estimate, initial.aipw, initial.score)
    for epsilon in (0.0, 0.002, 0.004)
        state = full_at(fit, epsilon)
        @printf("Patient-level trial epsilon=%.3f: score=%+.9f, Mean log likelihood=%.9f\n", epsilon, state.score, state.log_likelihood)
    end
    for iteration in 1:maxiter
        step = full_bisection_step(fit, lo, hi)
        if iteration <= 5
            @printf("Expanded-baseline bisection %d: epsilon=%.9f, score=%+.9f\n", iteration, step.midpoint, step.score)
        end
        if abs(step.score) <= tolerance
            state = full_at(fit, step.midpoint)
            @printf("Expanded-baseline epsilon=%.12f: risk0=%.9f, risk1=%.9f\n", state.epsilon, state.risk0, state.risk1)
            @printf("TMLE risk difference=%+.9f; score=%.3g; Empirical EIF mean=%.3g; Empirical SE=%.9f\n", state.estimate, state.score, state.eif_mean, state.se)
            return state
        end
        step.midpoint != lo && step.midpoint != hi || error("Expanded-baseline bisection stopped at floating-point precision")
        lo, hi = step.lo, step.hi
    end
    error("Expanded-baseline bisection did not converge within the iteration limit")
end

full_fit = prepare_full(read_rhc_rows())
manual_baseline_tmle(full_fit)
println("The expanded baseline model still omits acute illness severity; the data do not establish sufficient confounding control or the selection assumptions.")
println("Empirical SE reflects the current model’s asymptotic derivation; it does not guarantee confidence-interval coverage or clinical causal identification.")
