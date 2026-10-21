include(joinpath(@__DIR__, "..", "..", "shared", "julia", "EIFCase.jl"))
using .EIFCase
using Printf

function main(args)
    length(args) <= 1 || throw(ArgumentError("Usage: run_case.jl [counts.csv]"))
    path = isempty(args) ? joinpath(@__DIR__, "..", "..", "shared", "data", "rws-counts.csv") : args[1]
    data = case_data(path)
    initial = case_at(data, 0.0)
    result = solve_case(data)
    result.converged || error("TMLE root failed: $(result.reason)")
    println("key,value")
    for (key, value) in [
        ("n", data.n), ("marginal_risk", data.marginal_risk),
        ("initial_estimate", data.initial_estimate), ("score0", initial.score),
        ("epsilon", result.epsilon),
        ("qstar_x0_a0", result.updated_fit.q[1,1]),
        ("qstar_x0_a1", result.updated_fit.q[2,1]),
        ("qstar_x1_a0", result.updated_fit.q[1,2]),
        ("qstar_x1_a1", result.updated_fit.q[2,2]),
        ("score", result.score), ("slope", result.slope),
        ("log_likelihood", result.log_likelihood), ("estimate", result.estimate),
        ("eif_mean", result.eif_mean), ("eif_second_moment", result.eif_second_moment),
        ("eif_variance", result.eif_variance), ("se", result.se),
        ("converged", result.converged ? 1 : 0), ("iterations", result.iterations)]
        @printf("%s,%.17g\n", key, value)
    end
end
main(ARGS)
