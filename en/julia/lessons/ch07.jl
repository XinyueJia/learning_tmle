# See BEGIN_CH07 in EIFCase.jl for weighted variance and SE calculations.
# Both functions are averaged over the current frequency table; neither is an efficiency bound at a known true distribution.
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "EIFCase.jl"))
using .EIFCase
using Printf

data = case_data(joinpath(@__DIR__, "..", "..", "..", "shared", "data", "rws-counts.csv"))
initial_values = eif_values(data.initial_fit, data.cells)
initial_moments = if_variance(data, initial_values)
@printf("Initial fitted function: mean=%.8f, second_moment=%.8f, variance=%.8f, se=%.8f (%.4f percentage points)\n", initial_moments.mean, initial_moments.second_moment, initial_moments.variance, initial_moments.se, 100initial_moments.se)

saturated_values = eif_values(data.empirical_model, data.cells)
saturated_moments = if_variance(data, saturated_values)
@printf("Saturated empirical-distribution function: mean=%.8f, second_moment=%.8f, variance=%.8f, se=%.8f (%.4f percentage points)\n", saturated_moments.mean, saturated_moments.second_moment, saturated_moments.variance, saturated_moments.se, 100saturated_moments.se)
println("Both are empirical quantities for this table, rather than an efficiency bound at a known true distribution or the actual estimation error of one sample.")
println("Recompute after updating Q in Chapter 8; neither SE is the updated SE.")
