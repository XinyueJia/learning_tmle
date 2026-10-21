module RHCCase

# Reuse distribution algebra, never the synthetic example's CSV or constants.
include("EIFCase.jl")
using .EIFCase
using LinearAlgebra: dot, rank, Symmetric
using Statistics: mean

export DEFAULT_SOURCE, csv_records, read_rhc_rows, rhc_observations, rhc_counts,
       rhc_data, write_rhc_counts, mean_if, point_direction, linear_path, ate,
       clever_h, eif_values, direction_check, weighted_inner, weighted_projection,
       projection_demo, if_variance, expit, logit, fluctuation_score,
       case_at, bisection_step, solve_case, FULL_FEATURES, prepare_full,
       fit_logistic, full_at, full_bisection_step, solve_full, full_analysis

const DEFAULT_SOURCE = normpath(joinpath(@__DIR__, "..", "data", "public", "rhc", "source.csv"))
const SOURCE_FIELDS = split(",cat1,cat2,ca,sadmdte,dschdte,dthdte,lstctdte,death,cardiohx,chfhx,dementhx,psychhx,chrpulhx,renalhx,liverhx,gibledhx,malighx,immunhx,transhx,amihx,age,sex,edu,surv2md1,das2d3pc,t3d30,dth30,aps1,scoma1,meanbp1,wblc1,hrt1,resp1,temp1,pafi1,alb1,hema1,bili1,crea1,sod1,pot1,paco21,ph1,swang1,wtkilo1,dnr1,ninsclas,resp,card,neuro,gastr,renal,meta,hema,seps,trauma,ortho,adld3p,urin1,race,income,ptid", ',')

# BEGIN_RAW_READ
"""Stdlib CSV reader: quoted commas/newlines, doubled quotes, CRLF and UTF-8 BOM."""
function csv_records(source::AbstractString)
    bytes = collect(codeunits(source))
    i = startswith(source, '\ufeff') ? 4 : 1
    records = Vector{String}[]
    record = String[]
    field = IOBuffer()
    state = :unquoted
    active = false
    while i <= length(bytes)
        b = bytes[i]
        if state == :quoted
            if b == 0x22
                if i < length(bytes) && bytes[i+1] == 0x22
                    write(field, b); i += 1
                else
                    state = :afterquote
                end
            else
                write(field, b)
            end
        elseif b == 0x2c || b == 0x0a || b == 0x0d
            push!(record, String(take!(field)))
            state = :unquoted
            if b == 0x2c
                active = true
            else
                push!(records, record)
                record = String[]
                active = false
                if b == 0x0d && i < length(bytes) && bytes[i+1] == 0x0a
                    i += 1
                end
            end
        elseif state == :afterquote
            throw(ArgumentError("Unexpected character after closing CSV quote"))
        elseif b == 0x22
            position(field) == 0 || throw(ArgumentError("Quote inside unquoted CSV field"))
            state = :quoted
            active = true
        else
            write(field, b)
            active = true
        end
        i += 1
    end
    state == :quoted && throw(ArgumentError("Unclosed CSV quote"))
    if active || !isempty(record)
        push!(record, String(take!(field)))
        push!(records, record)
    end
    records
end

"""Read all original RHC fields as strings; no exclusions, imputation or recoding."""
function read_rhc_rows(path::AbstractString=DEFAULT_SOURCE)
    records = csv_records(read(path, String))
    isempty(records) && throw(ArgumentError("Empty RHC CSV"))
    headers = first(records)
    length(headers) == length(SOURCE_FIELDS) && length(unique(headers)) == length(headers) &&
        Set(headers) == Set(SOURCE_FIELDS) || throw(ArgumentError("Expected the original 63 unique RHC headers, including the empty row-index header"))
    rows = Dict{String,String}[]
    for (i, fields) in enumerate(records[2:end])
        length(fields) == length(headers) || throw(ArgumentError("RHC row $i: wrong field count; no rows were dropped"))
        push!(rows, Dict(zip(headers, fields)))
    end
    isempty(rows) && throw(ArgumentError("RHC CSV has no observations"))
    # Validate only the fields used by this deliberately coarse demonstration.
    rhc_observations(rows)
    identifiers = [r["ptid"] for r in rows]
    all(id -> !isempty(id) && id != "NA", identifiers) || throw(ArgumentError("Missing RHC patient identifier"))
    length(unique(identifiers)) == length(rows) || throw(ArgumentError("Duplicate RHC patient identifier"))
    rows
end

"""X: Female=0/Male=1; A: No RHC=0/RHC=1; Y: dth30 No=0/Yes=1."""
function rhc_observations(rows)
    isempty(rows) && throw(ArgumentError("At least one RHC observation is required"))
    observations = NamedTuple{(:x,:a,:y),Tuple{Int,Int,Int}}[]
    for (i, r) in enumerate(rows)
        all(k -> haskey(r, k), ("sex", "swang1", "dth30")) || throw(ArgumentError("RHC row $i: missing sex, swang1 or dth30"))
        r["sex"] in ("Female", "Male") || throw(ArgumentError("RHC row $i: unexpected sex"))
        r["swang1"] in ("No RHC", "RHC") || throw(ArgumentError("RHC row $i: unexpected swang1"))
        r["dth30"] in ("No", "Yes") || throw(ArgumentError("RHC row $i: unexpected dth30"))
        push!(observations, (x=Int(r["sex"] == "Male"), a=Int(r["swang1"] == "RHC"), y=Int(r["dth30"] == "Yes")))
    end
    observations
end
# END_RAW_READ

# BEGIN_RHC_COUNTS
"""Count original observations, preserving every row and every observed event."""
function rhc_counts(rows)
    totals = zeros(Int, 2, 2, 2)
    for observation in rhc_observations(rows)
        totals[observation.x+1, observation.a+1, observation.y+1] += 1
    end
    [(x=x, a=a, y=y, n=totals[x+1,a+1,y+1]) for x in 0:1 for a in 0:1 for y in 0:1]
end

"""
Read the original public cohort and fit only sex-stratified empirical summaries.
The standardised statistical risk difference is not a fully adjusted clinical
causal estimate: exchangeability given sex alone is not established.
"""
rhc_data(path::AbstractString=DEFAULT_SOURCE) = EIFCase.case_data(rhc_counts(read_rhc_rows(path)))

function write_rhc_counts(path::AbstractString, rows=read_rhc_rows())
    counts = rhc_counts(rows)
    # Validate the eight positive cells before writing an output file.
    EIFCase.case_data(counts)
    open(path, "w") do io
        println(io, "x,a,y,n")
        for c in counts
            println(io, "$(c.x),$(c.a),$(c.y),$(c.n)")
        end
    end
    path
end
# END_RHC_COUNTS

# BEGIN_FULL_BASELINE
const HISTORY_FIELDS = ["cardiohx", "chfhx", "dementhx", "psychhx", "chrpulhx",
    "renalhx", "liverhx", "gibledhx", "malighx", "immunhx", "transhx", "amihx"]
const FULL_FEATURES = ["intercept", "male", "age_z", "race_black", "race_other", HISTORY_FIELDS...]

"""Unpenalised logistic regression by explicit Newton steps and likelihood line search."""
function fit_logistic(design::Matrix{Float64}, outcome::Vector{Float64}; tolerance=1e-10, maxiter=100)
    n, k = size(design)
    n == length(outcome) && n > k || throw(ArgumentError("Logistic design/outcome dimensions invalid"))
    all(isfinite, design) && all(y -> y in (0,1), outcome) || throw(ArgumentError("Finite design and binary outcome required"))
    0 < mean(outcome) < 1 || throw(ArgumentError("Logistic outcome must contain both labels"))
    rank(design) == k || throw(ArgumentError("Logistic design is rank deficient; no columns were silently removed"))
    coefficients = zeros(k)
    coefficients[1] = logit(mean(outcome))
    likelihood(beta) = -sum(outcome[i] * EIFCase.softplus(-dot(design[i,:], beta)) +
        (1-outcome[i]) * EIFCase.softplus(dot(design[i,:], beta)) for i in 1:n) / n
    for iteration in 0:maxiter
        eta = design * coefficients
        probabilities = expit.(eta)
        all(p -> 0 < p < 1, probabilities) || throw(ArgumentError("Logistic probability reached a floating-point endpoint"))
        score = design' * (outcome - probabilities) / n
        if maximum(abs.(score)) <= tolerance
            return (; coefficients, probabilities, iterations=iteration, converged=true,
                    score_maximum=maximum(abs.(score)), log_likelihood=likelihood(coefficients))
        end
        iteration < maxiter || error("Logistic regression failed its score tolerance")
        weights = probabilities .* (1 .- probabilities)
        information = Symmetric(design' * (design .* weights) / n)
        direction = information \ score
        all(isfinite, direction) && dot(score, direction) > 0 || error("Invalid logistic Newton direction")
        current = likelihood(coefficients)
        step = 1.0
        accepted = false
        for backtrack in 1:60
            candidate = coefficients + step * direction
            if likelihood(candidate) >= current + 1e-4 * step * dot(score, direction)
                coefficients = candidate
                accepted = true
                break
            end
            step /= 2
        end
        accepted || error("Logistic likelihood line search failed")
    end
    error("Unreachable logistic fit state")
end

"""
Use every original observation and a declared complete baseline feature set.
No missing-value filling, row deletion, propensity clipping or regularisation.
Acute pretreatment severity is omitted: causal sufficiency is not established.
"""
function prepare_full(rows)
    observations = rhc_observations(rows)
    n = length(rows)
    age = Float64[]
    for (i, row) in enumerate(rows)
        all(k -> haskey(row,k), ["age", "race", HISTORY_FIELDS...]) || throw(ArgumentError("RHC row $i: missing baseline column"))
        value = tryparse(Float64, row["age"])
        value !== nothing && isfinite(value) && value > 0 || throw(ArgumentError("RHC row $i: invalid or missing age"))
        push!(age, value)
        row["race"] in ("white", "black", "other") || throw(ArgumentError("RHC row $i: unknown or missing race"))
        all(k -> row[k] in ("0", "1"), HISTORY_FIELDS) || throw(ArgumentError("RHC row $i: nonbinary or missing history"))
    end
    age_mean = mean(age)
    age_sd = sqrt(sum((age .- age_mean).^2) / n)
    age_sd > 0 || throw(ArgumentError("Age has zero population standard deviation"))
    design = zeros(n, length(FULL_FEATURES))
    for (i, (row, person)) in enumerate(zip(rows, observations))
        design[i,:] = [1.0, person.x, (age[i]-age_mean)/age_sd,
            Float64(row["race"] == "black"), Float64(row["race"] == "other"),
            [parse(Float64,row[k]) for k in HISTORY_FIELDS]...]
    end
    a = Float64[p.a for p in observations]
    y = Float64[p.y for p in observations]
    g_fit = fit_logistic(design, a)
    q_fit = fit_logistic(hcat(design, a), y)
    q0 = expit.(hcat(design, zeros(n)) * q_fit.coefficients)
    q1 = expit.(hcat(design, ones(n)) * q_fit.coefficients)
    g = g_fit.probabilities
    h = a ./ g - (1 .- a) ./ (1 .- g)
    (; n, feature_names=copy(FULL_FEATURES), q_feature_names=[FULL_FEATURES..., "A"],
       age_mean, age_sd, design, a, y, g_fit, q_fit, g, q0, q1, h)
end
# END_FULL_BASELINE

# BEGIN_FULL_TARGET
"""Individual logistic targeting at epsilon, with g and initial Q held fixed."""
function full_at(fit, epsilon::Real=0.0)
    isfinite(epsilon) || throw(ArgumentError("Finite fluctuation parameter required"))
    q0 = [expit(logit(fit.q0[i]) - epsilon / (1-fit.g[i])) for i in 1:fit.n]
    q1 = [expit(logit(fit.q1[i]) + epsilon / fit.g[i]) for i in 1:fit.n]
    all(q -> 0 < q < 1, [q0; q1]) || throw(ArgumentError("Targeted Q reached a floating-point endpoint"))
    q_observed = fit.a .* q1 + (1 .- fit.a) .* q0
    score = mean(fit.h .* (fit.y - q_observed))
    slope = -mean(fit.h.^2 .* q_observed .* (1 .- q_observed))
    estimate = mean(q1 - q0)
    values = fit.h .* (fit.y - q_observed) + q1 - q0 .- estimate
    eif_mean = mean(values)
    eif_variance = mean((values .- eif_mean).^2)
    log_likelihood = mean(fit.y .* log.(q_observed) + (1 .- fit.y) .* log1p.(-q_observed))
    (; epsilon=Float64(epsilon), q0, q1, q_observed, score, slope, log_likelihood,
       risk0=mean(q0), risk1=mean(q1), estimate, aipw=estimate+score,
       eif_values=values, eif_mean, eif_variance, se=sqrt(eif_variance/fit.n))
end

function full_bisection_step(fit, lo::Real, hi::Real)
    isfinite(lo) && isfinite(hi) && lo < hi || throw(ArgumentError("Finite increasing bracket required"))
    full_at(fit,lo).score >= 0 && full_at(fit,hi).score <= 0 || throw(ArgumentError("Bracket must contain the decreasing score root"))
    midpoint = lo/2 + hi/2
    score = full_at(fit,midpoint).score
    next_lo = score > 0 ? midpoint : lo
    next_hi = score < 0 ? midpoint : hi
    score == 0 && (next_lo = next_hi = midpoint)
    (; midpoint, score, lo=next_lo, hi=next_hi)
end

function solve_full(fit; lo=-0.25, hi=0.25, tolerance=1e-12, maxiter=200)
    isfinite(tolerance) && 0 < tolerance <= 1e-6 || throw(ArgumentError("Invalid score tolerance"))
    maxiter > 0 || throw(ArgumentError("Positive iteration count required"))
    # The fixed public cohort fits inside this explicit bracket; a failure is visible.
    full_at(fit,lo).score >= 0 && full_at(fit,hi).score <= 0 || throw(ArgumentError("Full-analysis score root is outside bracket"))
    for iteration in 1:maxiter
        step = full_bisection_step(fit,lo,hi)
        if abs(step.score) <= tolerance
            return merge(full_at(fit,step.midpoint), (; converged=true, iterations=iteration))
        end
        step.midpoint != lo && step.midpoint != hi || error("Full-analysis bisection stagnated")
        lo,hi = step.lo,step.hi
    end
    error("Full-analysis bisection did not reach tolerance")
end

"""Baseline-adjusted analysis; all identification and selection assumptions remain external."""
function full_analysis(path::AbstractString=DEFAULT_SOURCE)
    fit = prepare_full(read_rhc_rows(path))
    (; fit, initial=full_at(fit,0.0), targeted=solve_full(fit))
end
# END_FULL_TARGET

end # module
