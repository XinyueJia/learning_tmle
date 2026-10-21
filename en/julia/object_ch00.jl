# Chapter 0 object figures: fit initial models only. All vectors preserve original CSV row order.
include(joinpath(@__DIR__, "..", "..", "shared", "julia", "RHCCase.jl"))
using .RHCCase
rows = read_rhc_rows(DEFAULT_SOURCE) # Original path in; n records out.
observations = rhc_observations(rows) # Each (x,a,y) is observed data, not a prediction.
y = [person.y for person in observations] # n observed Y values.
fit = prepare_full(rows) # Encode 15 original baseline variables as 17 design columns; fit g and Q.
n = fit.n # One integer: 5735.
design = fit.design # n×17 matrix, including intercept and encoded variables.
a = fit.a # n observed RHC indicators; prediction inputs never overwrite them.
y = fit.y # Same values as integer y above, converted to Vector{Float64} for the fitter.
q_fit = fit.q_fit # Q fit container, with 18 coefficients.
g_fit = fit.g_fit # g fit container, with 17 coefficients.
# The next two lines are fitting operations inside prepare_full; arguments are (design matrix, response).
g_fit = fit_logistic(design, a) # n×17 design and n observed A values give the g model.
q_fit = fit_logistic(hcat(design, a), y) # Bind columns into n×18, using n Y values as response.
# RHCCase exports expit: one real number to a probability between 0 and 1; no redefinition needed.
g = g_fit.probabilities # n fitted RHC probabilities.
q1 = expit.(hcat(design, ones(n)) * q_fit.coefficients) # Multiply n×18 by 18 coefficients, then apply expit elementwise.
q0 = expit.(hcat(design, zeros(n)) * q_fit.coefficients) # Change only prediction inputs; keep the same coefficients.
qa = fit.a .* q1 + (1 .- fit.a) .* q0 # Observed A selects the corresponding prediction at the same i.
qa_selected = copy(qa) # Retain row-wise selections for an independent check by a different calculation.
qa = expit.(hcat(design, a) * q_fit.coefficients) # Observed A as prediction input, retaining the same rows.
@assert all(isapprox.(qa, qa_selected; atol=1e-14))
initial_estimate = sum(q1 .- q0) / n # n prediction contrasts give one initial standardised risk difference.
@assert size(design) == (5735,17) && length(q_fit.coefficients) == 18
@assert n == length(a) == length(y) == length(g) == length(q0) == length(q1) == length(qa)
@assert sum(y) == 1918 && sum(a) == 2184
@assert all(0 .< g .< 1) && all(0 .< q0 .< 1) && all(0 .< q1 .< 1)
@assert all(qa[i] == (a[i] == 1 ? q1[i] : q0[i]) for i in 1:n)
@assert all(isapprox.(qa, expit.(hcat(design, a) * q_fit.coefficients); atol=1e-14))
@assert a == [person.a for person in observations] # Predictions have not overwritten observed treatment.
@assert isapprox(initial_estimate, 0.08649885590233014; atol=1e-9)
println("n=", n, "; Q design=", size(hcat(design,a)), "; initial_estimate=", initial_estimate)
println("Chapter 0 object workbook assertions passed")
