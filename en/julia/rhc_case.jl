# Run all eight chapters from frozen original public RHC data; no third-party Julia packages are needed.
# An alternative CSV must retain the original 63-column structure: julia en/julia/rhc_case.jl path.csv
include(joinpath(@__DIR__, "..", "..", "shared", "julia", "RHCCase.jl"))
using .RHCCase
using Printf

function main(path=DEFAULT_SOURCE)
    rows = read_rhc_rows(path)
    data = rhc_data(path)
    println("Original public RHC records: ", path)
    println("n=", length(rows), "; Coding: Female=0/Male=1, No RHC=0/RHC=1, dth30 No=0/Yes=1")
    println("Counts for each observed combination = ", [c.n for c in data.cells])
    mean = mean_if(data)
    @printf("Chapter 1: mortality risk=%.9f, Mean IF average=%.3g\n", mean.risk, mean.mean)
    direction = point_direction(data, 4)
    @printf("Chapter 2: direct mean derivative=%.9f, IF pairing=%.9f\n", direction.derivative, direction.pairing)
    println("Chapter 3: pX=", data.empirical_model.px, ", Estimated g=", data.empirical_model.g)
    @printf("Chapter 4: initial Q fits on A only; initial risk difference=%+.9f, Initial gradient mean=%+.9f\n", data.initial_estimate, case_at(data).eif_mean)
    check = direction_check(data, direction.score)
    @printf("Chapter 5: risk-difference finite difference=%.9f, Gradient pairing=%.9f\n", check.finite_difference, check.pairing)
    demo = projection_demo(data)
    @printf("Chapter 6: fixed-g projection error=%.3g\n", maximum(abs.(demo.projection-demo.canonical)))
    moments = if_variance(data)
    @printf("Chapter 7: saturated empirical gradient variance=%.9f, SE=%.9f\n", moments.variance, moments.se)
    result = solve_case(data)
    result.converged || error("TMLE score solver did not converge")
    @printf("Chapter 8: epsilon=%.12f, Sex-standardised risk difference=%+.9f, score=%.3g, SE=%.9f\n", result.epsilon, result.estimate, result.score, result.se)
    full = full_analysis(path)
    println("Expanded-baseline feature order = ", full.fit.feature_names)
    println("g fitted coefficients = ", full.fit.g_fit.coefficients)
    println("Q fitted coefficients (last column is A) = ", full.fit.q_fit.coefficients)
    println("Age mean/population SD = ", (full.fit.age_mean,full.fit.age_sd))
    println("Range of g = ", extrema(full.fit.g), "; Newton iterations = ", (full.fit.g_fit.iterations,full.fit.q_fit.iterations))
    @printf("Expanded baseline: initial RD=%+.12f, AIPW=%+.12f, Initial score=%+.12f\n", full.initial.estimate, full.initial.aipw, full.initial.score)
    @printf("Expanded baseline: epsilon=%.12f, risk0=%.12f, risk1=%.12f, TMLE_RD=%+.12f, score=%.3g, SE=%.12f\n", full.targeted.epsilon, full.targeted.risk0, full.targeted.risk1, full.targeted.estimate, full.targeted.score, full.targeted.se)
    println("Expanded baseline still omits acute illness severity; data do not establish sufficient confounding control or selection assumptions.")
    println("The sex-stratified model supports hand calculation; numerical convergence in either model does not establish clinical causal effects.")
    full
end

if abspath(PROGRAM_FILE) == @__FILE__
    length(ARGS) <= 1 || error("Usage: julia rhc_case.jl [original-rhc.csv]")
    main(isempty(ARGS) ? DEFAULT_SOURCE : only(ARGS))
end
