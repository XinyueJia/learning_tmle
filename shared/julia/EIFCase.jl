module EIFCase

using LinearAlgebra: dot

export read_counts, case_data, mean_if, point_direction, linear_path, ate,
       clever_h, eif_values, direction_check, weighted_inner, weighted_projection,
       projection_demo, if_variance, expit, logit, fluctuation_score,
       case_at, bisection_step, solve_case

# BEGIN_CH03
# 标签x/a/y保持0/1；数组索引由标签加1。q的行是a，列是x。
# 本模块只读取调用者传入的计数，不读取JavaScript教学模型。
function read_counts(path::AbstractString)
    lines = readlines(path)
    isempty(lines) && throw(ArgumentError("Empty counts CSV"))
    strip(lines[1]) == "x,a,y,n" || throw(ArgumentError("Expected CSV header x,a,y,n"))
    rows = NamedTuple{(:x, :a, :y, :n), Tuple{Int,Int,Int,Int}}[]
    for line in lines[2:end]
        isempty(strip(line)) && continue
        fields = split(strip(line), ',')
        length(fields) == 4 || throw(ArgumentError("Expected four integer CSV fields"))
        x, a, y, n = parse.(Int, strip.(fields))
        push!(rows, (; x, a, y, n))
    end
    checked_counts(rows)
end

function checked_counts(rows)
    length(rows) == 8 || throw(ArgumentError("The teaching model requires eight positive cells"))
    checked = NamedTuple{(:x, :a, :y, :n), Tuple{Int,Int,Int,Int}}[]
    for c in rows
        all(k -> hasproperty(c, k), (:x, :a, :y, :n)) ||
            throw(ArgumentError("Each cell needs x,a,y,n"))
        all(v -> v isa Integer && !(v isa Bool) && v in (0, 1), (c.x, c.a, c.y)) ||
            throw(ArgumentError("Cell labels must be binary integers"))
        c.n isa Integer && !(c.n isa Bool) && 0 < c.n <= typemax(Int) ||
            throw(ArgumentError("Each observed count must be a positive integer"))
        push!(checked, (x=Int(c.x), a=Int(c.a), y=Int(c.y), n=Int(c.n)))
    end
    length(Set((c.x, c.a, c.y) for c in checked)) == 8 ||
        throw(ArgumentError("Duplicate cell labels"))
    sort(checked; by=c -> (c.x, c.a, c.y))
end

function case_data(rows::AbstractVector)
    counts = checked_counts(rows)
    n = foldl((s, c) -> Base.Checked.checked_add(s, c.n), counts; init=0)
    cells = [merge(c, (p=c.n / n,)) for c in counts]
    px = [sum(c.n for c in counts if c.x == x) / n for x in 0:1]
    g = [sum(c.n for c in counts if c.x == x && c.a == 1) /
         sum(c.n for c in counts if c.x == x) for x in 0:1]
    q = [sum(c.n * c.y for c in counts if c.a == a && c.x == x) /
         sum(c.n for c in counts if c.a == a && c.x == x) for a in 0:1, x in 0:1]
    arm_risks = [sum(c.n * c.y for c in counts if c.a == a) /
                 sum(c.n for c in counts if c.a == a) for a in 0:1]
    empirical_model = (px=copy(px), g=copy(g), q=copy(q))
    initial_fit = (px=copy(px), g=copy(g), q=[arm_risks[a+1] for a in 0:1, x in 0:1])
    groups = [(x=x, a=a,
               n=sum(c.n for c in counts if c.x == x && c.a == a),
               events=sum(c.n * c.y for c in counts if c.x == x && c.a == a),
               q_observed=q[a+1,x+1], p_x=px[x+1], g_hat=g[x+1],
               initial_q=initial_fit.q[a+1,x+1]) for x in 0:1 for a in 0:1]
    (; n, cells, groups, empirical_model, initial_fit,
       marginal_risk=sum(c.p * c.y for c in cells),
       initial_estimate=ate(initial_fit), observed_difference=arm_risks[2] - arm_risks[1])
end
case_data(path::AbstractString) = case_data(read_counts(path))

ate(model) = sum(model.px[x+1] * (model.q[2,x+1] - model.q[1,x+1]) for x in 0:1)
# END_CH03

function checked_probabilities(p)
    !isempty(p) && all(v -> v isa Real && isfinite(v) && 0 < v <= 1, p) ||
        throw(ArgumentError("Positive finite cell probabilities required"))
    abs(sum(p) - 1) <= 1e-12 || throw(ArgumentError("Probabilities must sum to one"))
    p
end
function checked_vector(v, n)
    length(v) == n && all(x -> x isa Real && isfinite(x), v) ||
        throw(ArgumentError("Finite vector of matching length required"))
    v
end

function weighted_inner(p, f, k)
    checked_probabilities(p)
    checked_vector(f, length(p)); checked_vector(k, length(p))
    dot(p .* f, k)
end

# BEGIN_CH01
# 第1讲：从聚合人数计算二元均值、各观测组合的影响值和加权平均。
function mean_if(data)
    total_people = data.n
    events = 0
    for cell in data.cells
        events = events + cell.n * cell.y
    end
    risk = events / total_people
    values = Float64[]
    weighted_mean = 0.0
    for cell in data.cells
        influence = cell.y - risk
        push!(values, influence)
        probability = cell.n / total_people
        weighted_mean = weighted_mean + probability * influence
    end
    return (risk=risk, values=values, mean=weighted_mean)
end
# END_CH01

# BEGIN_CH02
# 第2讲：t改变位置；h、score与起点导数不随t改变。
function point_direction(data, index::Integer)
    1 <= index <= length(data.cells) || throw(ArgumentError("Invalid cell index"))
    p = [c.p for c in data.cells]
    h = [(i == index ? 1.0 : 0.0) - p[i] for i in eachindex(p)]
    score = h ./ p
    influence = mean_if(data)
    derivative = sum(c.y * h[i] for (i, c) in enumerate(data.cells))
    pairing = weighted_inner(p, influence.values, score)
    (; index, h, score, derivative, pairing)
end
function linear_path(p, score, t::Real)
    checked_probabilities(p); checked_vector(score, length(p))
    isfinite(t) || throw(ArgumentError("Finite path parameter required"))
    abs(dot(p, score)) <= 1e-12 || throw(ArgumentError("Score must be centred under p"))
    updated = p .* (1 .+ t .* score)
    checked_probabilities(updated)  # 不截断；超出当前全正模型就失败。
    updated
end
# END_CH02

# BEGIN_CH04
function clever_h(model, a, x)
    a in (0, 1) && x in (0, 1) || throw(ArgumentError("Binary group labels required"))
    g = model.g[x+1]
    0 < g < 1 || throw(ArgumentError("Treatment probabilities must be strictly interior"))
    a == 1 ? 1 / g : -1 / (1 - g)
end

function eif_values(model, cells; estimate=ate(model))
    [model.q[2,c.x+1] - model.q[1,c.x+1] - estimate +
     clever_h(model, c.a, c.x) * (c.y - model.q[c.a+1,c.x+1]) for c in cells]
end
# END_CH04

# BEGIN_CH05
function model_from_probabilities(cells, p)
    checked_probabilities(p); length(cells) == length(p) || throw(ArgumentError("Length mismatch"))
    px = [sum(p[i] for (i,c) in enumerate(cells) if c.x == x) for x in 0:1]
    mass = [sum(p[i] for (i,c) in enumerate(cells) if c.a == a && c.x == x) for a in 0:1, x in 0:1]
    q = [sum(p[i] * c.y for (i,c) in enumerate(cells) if c.a == a && c.x == x) /
         mass[a+1,x+1] for a in 0:1, x in 0:1]
    (; px, g=[mass[2,x+1] / px[x+1] for x in 0:1], q)
end

# 第5讲：在经验全模型的起点验证ATE方向，不用初始错设Q伪装真梯度。
function direction_check(data, score; step::Real=1e-6)
    isfinite(step) && step > 0 || throw(ArgumentError("Positive finite difference step required"))
    p = [c.p for c in data.cells]
    plus = model_from_probabilities(data.cells, linear_path(p, score, step))
    minus = model_from_probabilities(data.cells, linear_path(p, score, -step))
    finite_difference = (ate(plus) - ate(minus)) / (2step)
    pairing = weighted_inner(p, eif_values(data.empirical_model, data.cells), score)
    (; finite_difference, pairing, difference=finite_difference - pairing)
end
# END_CH05

# BEGIN_CH06
function weighted_projection(p, f, basis)
    checked_probabilities(p); checked_vector(f, length(p))
    orthonormal = Vector{Float64}[]
    for b in basis
        checked_vector(b, length(p))
        original_norm = sqrt(weighted_inner(p, b, b))
        original_norm > 0 || throw(ArgumentError("Basis must have full column rank"))
        v = Float64.(b) / original_norm
        for pass in 1:2, u in orthonormal
            v -= weighted_inner(p, v, u) * u
        end
        vnorm = sqrt(weighted_inner(p, v, v))
        vnorm > 1e-12 || throw(ArgumentError("Basis is rank deficient at numerical precision"))
        push!(orthonormal, v / vnorm)
    end
    result = zeros(length(p))
    for u in orthonormal
        result += weighted_inner(p, f, u) * u
    end
    result
end

# 第6讲：仅此练习将计数估计的g当已知固定；最终TMLE仍由输入计数学习g。
function projection_demo(data; b::Real=1.0)
    isfinite(b) || throw(ArgumentError("Finite candidate coefficient required"))
    model = data.empirical_model
    p = [c.p for c in data.cells]
    canonical = eif_values(model, data.cells)
    u = [c.a - model.g[c.x+1] for c in data.cells]
    basis = [[c.x - model.px[2] for c in data.cells]]
    append!(basis, [[c.x == x && c.a == a ? c.y - model.q[a+1,x+1] : 0.0
                     for c in data.cells] for x in 0:1 for a in 0:1])
    candidate = canonical + b * u
    projection = weighted_projection(p, candidate, basis)
    residual = candidate - projection
    (; basis, canonical, u, candidate, projection, residual,
       candidate_second_moment=weighted_inner(p, candidate, candidate),
       projection_second_moment=weighted_inner(p, projection, projection),
       residual_second_moment=weighted_inner(p, residual, residual))
end
# END_CH06

# BEGIN_CH07
function if_variance(data, values=eif_values(data.empirical_model, data.cells))
    checked_vector(values, length(data.cells))
    mean = sum(c.p * values[i] for (i,c) in enumerate(data.cells))
    second_moment = sum(c.p * values[i]^2 for (i,c) in enumerate(data.cells))
    variance = sum(c.p * (values[i] - mean)^2 for (i,c) in enumerate(data.cells))
    (; mean, second_moment, variance, se=sqrt(variance / data.n))
end
# END_CH07

# BEGIN_CH08
function expit(z::Real)
    isfinite(z) || throw(ArgumentError("Finite log odds required"))
    z >= 0 ? 1 / (1 + exp(-z)) : exp(z) / (1 + exp(z))
end
function logit(q::Real)
    isfinite(q) && 0 < q < 1 || throw(ArgumentError("Probability must be strictly interior"))
    log(q) - log1p(-q)
end
softplus(z) = max(z, zero(z)) + log1p(exp(-abs(z)))

# 组结果的H与offset在更新阶段才补充，第3讲计数汇总不依赖它们。
function fluctuation_groups(data)
    [merge(group, (h=clever_h(data.initial_fit, group.a, group.x),
                   offset=logit(group.initial_q))) for group in data.groups]
end

# 平均条件对数似然、score及其导数，均只依赖观察组计数。
function fluctuation_score(data, epsilon::Real)
    isfinite(epsilon) || throw(ArgumentError("Finite fluctuation parameter required"))
    score = 0.0; slope = 0.0; log_likelihood = 0.0
    for group in fluctuation_groups(data)
        eta = group.offset + epsilon * group.h
        isfinite(eta) || throw(ArgumentError("Updated log odds are not representable"))
        q = expit(eta)
        score += group.h * (group.events - group.n * q) / data.n
        slope -= group.n * group.h^2 * q * (1 - q) / data.n
        log_likelihood -= (group.events * softplus(-eta) +
                           (group.n - group.events) * softplus(eta)) / data.n
    end
    all(isfinite, (score, slope, log_likelihood)) ||
        throw(ArgumentError("Fluctuation summary is not representable"))
    (; score, slope, log_likelihood)
end

function case_at(data, epsilon::Real=0.0)
    state = fluctuation_score(data, epsilon)
    q = similar(data.initial_fit.q)
    groups = map(fluctuation_groups(data)) do group
        updated_q = expit(group.offset + epsilon * group.h)
        0 < updated_q < 1 || throw(ArgumentError("Updated Q reached a floating-point endpoint"))
        q[group.a+1,group.x+1] = updated_q
        predicted_events = group.n * updated_q
        residual_total = group.events - predicted_events
        weighted_residual = group.h * residual_total
        merge(group, (; q_updated=updated_q, predicted_events, residual_total,
                       weighted_residual, score_contribution=weighted_residual / data.n))
    end
    updated_fit = (px=copy(data.initial_fit.px), g=copy(data.initial_fit.g), q=q)
    estimate = ate(updated_fit)
    values = eif_values(updated_fit, data.cells; estimate)
    moments = if_variance(data, values)
    eif_rows = [merge(c, (d=values[i],)) for (i,c) in enumerate(data.cells)]
    (; data, epsilon=Float64(epsilon), groups, state.score, state.slope, state.log_likelihood,
       updated_fit, estimate, aipw=estimate + state.score, eif_rows,
       eif_mean=moments.mean, eif_second_moment=moments.second_moment,
       eif_variance=moments.variance, se=moments.se)
end

function checked_bracket(data, lo, hi)
    isfinite(lo) && isfinite(hi) && lo < hi || throw(ArgumentError("Finite increasing bracket required"))
    slo = fluctuation_score(data, lo).score
    shi = fluctuation_score(data, hi).score
    slo >= 0 && shi <= 0 || throw(ArgumentError("Bracket must contain the decreasing score root"))
    (; lo=Float64(lo), hi=Float64(hi), slo, shi)
end

function bisection_step(data, lo::Real, hi::Real)
    bracket = checked_bracket(data, lo, hi)
    midpoint = bracket.lo / 2 + bracket.hi / 2
    score = fluctuation_score(data, midpoint).score
    new_lo = score > 0 ? midpoint : bracket.lo
    new_hi = score < 0 ? midpoint : bracket.hi
    score == 0 && (new_lo = new_hi = midpoint)
    (; midpoint, score, lo=new_lo, hi=new_hi)
end

function solve_case(data; lo::Real=-1.0, hi::Real=1.0, score_tol::Real=1e-12, maxiter::Integer=200)
    isfinite(score_tol) && 0 < score_tol <= 1e-6 || throw(ArgumentError("Use a positive score tolerance at most 1e-6"))
    maxiter > 0 || throw(ArgumentError("Positive maximum iteration count required"))
    bracket = checked_bracket(data, lo, hi)
    lo, hi = bracket.lo, bracket.hi
    for (epsilon, score) in ((lo, bracket.slo), (hi, bracket.shi))
        if abs(score) <= score_tol
            return merge(case_at(data, epsilon), (converged=true, iterations=0, reason="score_tolerance"))
        end
    end
    for iterations in 1:maxiter
        step = bisection_step(data, lo, hi)
        if abs(step.score) <= score_tol
            return merge(case_at(data, step.midpoint), (; converged=true, iterations, reason="score_tolerance"))
        end
        if step.midpoint == lo || step.midpoint == hi
            return merge(case_at(data, step.midpoint), (; converged=false, iterations, reason="floating_point_stagnation"))
        end
        lo, hi = step.lo, step.hi
    end
    merge(case_at(data, lo / 2 + hi / 2), (converged=false, iterations=Int(maxiter), reason="maximum_iterations"))
end
# END_CH08

end # module
