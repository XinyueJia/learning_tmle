# Chapter 1: load tools, read the same counts and call the mean function.
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "EIFCase.jl"))
using .EIFCase

data_file = joinpath(@__DIR__, "..", "..", "..", "shared", "data", "rws-counts.csv")
data = case_data(data_file)
result = mean_if(data)

println("Total patients N = ", data.n)
println("Endpoint event risk = ", result.risk)
for y in 0:1
    influence = y - result.risk
    println("Y = ", y, ", D = ", round(influence; digits=6))
end
println("Empirical IF mean (before rounding) = ", result.mean)
println("Empirical IF mean (at most six decimal places) = ", round(result.mean; digits=6))
