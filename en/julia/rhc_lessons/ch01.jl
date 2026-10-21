# Chapter 1: read original public RHC records and compute mean 30-day mortality.
# include executes another file to make its reading functions available here.
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "RHCCase.jl"))
# using brings exported module functions into the current script.
using .RHCCase
# DEFAULT_SOURCE is the absolute path to the original CSV frozen with this project.
rows = read_rhc_rows(DEFAULT_SOURCE)
# One row represents one patient; no exclusions, imputation or resampling occur here.
observations = rhc_observations(rows)
# length counts patients, corresponding to n in the formula.
n = length(observations)
# Patient outcome Y: 1 when original dth30 is Yes, otherwise 0.
y = [person.y for person in observations]
# sum adds binary indicators, so events counts deaths.
events = sum(y)
# Division / gives the sample mean: μ̂ = (Y₁ + … + Yₙ) / n.
risk = events / n
# Each patient’s influence value: Dᵢ = Yᵢ − μ̂.
influence = y .- risk
# .- subtracts elementwise; sum then adds the influence values.
mean_influence = sum(influence) / n
# Aggregate the same original records by (X,A,Y) for subsequent derivations.
data = rhc_data(DEFAULT_SOURCE)
# mean_if weights by cell counts and should agree with the patient-level result above.
check = mean_if(data)
# Require grouped and patient-level risks to agree and the patient influence mean to be near zero.
@assert isapprox(check.risk, risk) && abs(mean_influence) < 1e-12
println("Original patient count n = ", n, "; 30-day deaths = ", events)
println("Sample death risk μ̂ = ", risk)
println("IF for Y=0 = ", -risk, "; IF for Y=1 = ", 1-risk)
println("Patient-level IF mean = ", mean_influence, "; IF mean weighted by group counts = ", check.mean)
# This is the full cohort’s descriptive mean; this chapter does not yet estimate treatment effects.
