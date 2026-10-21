# Chapter 1 continuous object workbook: no external Julia packages; read only the frozen original RHC CSV.
include(joinpath(@__DIR__, "..", "..", "shared", "julia", "RHCCase.jl"))
using .RHCCase
rows = read_rhc_rows(DEFAULT_SOURCE) # Path in; records retaining all 63 original fields out.
observations = rhc_observations(rows) # Outputs (x,a,y) in original row order.
n = length(observations) # n is one integer, not a vector.
y = [person.y for person in observations] # y is an n-element binary vector.
events = sum(y) # Sum the vector to count events; corresponds to ΣᵢYᵢ.
risk = events / n # Divide two scalars to obtain sample risk.
support_y = [0.0, 1.0] # These two rows now represent possible outcomes, not two patients.
p = [count(==(v), y) / n for v in support_y] # Divide each group count by n to obtain two empirical probabilities.
mu = sum(p .* support_y) # .* multiplies elementwise; sum adds two terms to give the mean of reference P=P_n.
z = 1 # Outcome receiving extra weight; must be 0 or 1.
t = 0.1 # Dimensionless replacement proportion, adjustable from 0 to 1; original y stays fixed.
point = Float64.(support_y .== z) # .== compares elementwise; Float64. converts true/false to 1.0/0.0.
p_t = (1 - t) .* p + t .* point # Retained component plus point-mass component gives two new probabilities.
mu_t = sum(p_t .* support_y) # Apply new weights to the same outcomes to obtain the new mean.
delta = mu_t - mu # Subtract two scalars to obtain the actual probability difference.
derivative = z - mu # Selected outcome minus original mean: the mean-path derivative.
rate = t == 0 ? missing : delta / t # Conditional ? : expression; at t=0, 0/0 is undefined, marked missing.
linear_mean = mu + t * derivative # Exact linear formula, not a Taylor approximation.
support_D = support_y .- mu # Two-entry function table with rule D(y;P)=y−μ.
influence = y .- risk # Apply the same rule to every patient; output still has n entries.
mean_influence = sum(influence) / n # Mean of all n entries; exactly 0 in real arithmetic.
grouped_mean_D = sum(p .* support_D) # Weight both groups under original P; agrees with the preceding mean.
old_mean_D = sum(p_t .* support_D) # Keep the original function, change only weights: generally non-zero.
new_support_D = support_y .- mu_t # A different function D(y;P_t), which cannot stand in for original D.
new_mean_D = sum(p_t .* new_support_D) # Recentring the new function under its new distribution gives 0.
alive = 1 .- y # Complement each observed death indicator; still n entries.
survival = sum(alive) / n # Average n survival indicators to obtain one 30-day survival probability.
survival_influence = alive .- survival # The complement IF reverses the sign of each original IF value.
# Check direct counts against independent fractional benchmarks; failure throws and exits non-zero.
@assert n == 5735 && events == 1918
@assert isapprox(mu, 1918 / 5735; atol=1e-14) && isapprox(risk, mu; atol=1e-14)
@assert size(y) == size(influence) == (n,) && size(p_t) == (2,)
@assert isapprox(sum(p_t), 1; atol=1e-14) && all(p_t .>= 0)
@assert isapprox(mu_t, (1-t)*1918/5735 + t*z; atol=1e-14)
@assert isapprox(mu_t, linear_mean; atol=1e-14)
@assert rate === missing || isapprox(rate, derivative; atol=1e-12)
@assert abs(mean_influence) < 1e-12 && abs(grouped_mean_D) < 1e-12
@assert isapprox(old_mean_D, delta; atol=1e-14) && abs(new_mean_D) < 1e-12
@assert all(isapprox.(survival_influence, -influence; atol=1e-14))
# Check both z values and boundaries t=0,1; verify the derivative by finite differences of independently weighted means.
for target in (0, 1), step in (0.0, 0.01, 0.1, 1.0)
    changed = (1-step) .* p + step .* Float64.(support_y .== target)
    direct = sum(changed .* support_y)
    @assert isapprox(sum(changed), 1; atol=1e-14)
    @assert isapprox(direct, 1918/5735 + step*(target-1918/5735); atol=1e-14)
    epsilon = 1e-6
    nearby = (1-epsilon) .* p + epsilon .* Float64.(support_y .== target)
    @assert isapprox((sum(nearby .* support_y)-mu)/epsilon, target-1918/5735; atol=1e-9)
end
println("n=", n, "; events=", events, "; risk=", risk, "; mu_t=", mu_t)
println("mean_influence=", mean_influence, "; old_mean_D=", old_mean_D, "; new_mean_D=", new_mean_D)
println("Chapter 1 object workbook assertions passed")
