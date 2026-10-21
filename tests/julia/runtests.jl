using Test
include(joinpath(@__DIR__, "..", "..", "shared", "julia", "EIFCase.jl"))
using .EIFCase

const CSV_PATH = joinpath(@__DIR__, "..", "..", "shared", "data", "rws-counts.csv")
const COUNTS = read_counts(CSV_PATH)
const DATA = case_data(COUNTS)
close(actual, expected; atol=1e-11) = isapprox(actual, expected; atol, rtol=0)

@testset "CSV counts determine all fitted quantities" begin
    @test DATA.n == 200
    @test [c.n for c in DATA.cells] == [24,56,4,16,16,4,40,40]
    @test close(sum(c.p for c in DATA.cells), 1)
    @test [g.n for g in DATA.groups] == [80,20,20,80]
    @test [g.events for g in DATA.groups] == [56,16,4,40]
    @test all(close.(DATA.empirical_model.px, [.5,.5]))
    @test all(close.(DATA.empirical_model.g, [.2,.8]))
    @test all(close.(DATA.empirical_model.q, [.7 .2; .8 .5]))
    @test all(close.(DATA.initial_fit.q, [.6 .6; .56 .56]))
    @test close(DATA.initial_estimate, -.04)
    @test close(DATA.observed_difference, -.04)
    @test close(DATA.marginal_risk, 116 / 200)
    @test [clever_h(DATA.initial_fit, g.a, g.x) for g in DATA.groups] ≈ [-1.25,5,-5,1.25]
    @test case_data(reverse(COUNTS)).empirical_model == DATA.empirical_model
end

@testset "Chapter 3 aggregation runs without later H or logit definitions" begin
    @test all(g -> !hasproperty(g, :h) && !hasproperty(g, :offset), DATA.groups)
    source = read(joinpath(@__DIR__, "..", "..", "shared", "julia", "EIFCase.jl"), String)
    chapter3 = split(split(source, "# BEGIN_CH03"; limit=2)[2], "# END_CH03"; limit=2)[1]
    standalone_module = Module(:ChapterThreeOnly)
    Base.include_string(standalone_module, chapter3, "chapter3_core.jl")
    standalone = Base.invokelatest(getfield(standalone_module, :case_data), COUNTS)
    @test standalone.n == 200
    @test close(standalone.initial_estimate, -.04)
    @test standalone.groups == DATA.groups
end

@testset "Mean IF and mass-conserving point directions" begin
    result = mean_if(DATA)
    @test close(result.risk, .58)
    @test close(result.mean, 0)
    @test result.values ≈ [-.58,.42,-.58,.42,-.58,.42,-.58,.42]
    @test close(if_variance(DATA, result.values).variance, .2436)
    @test close(if_variance(DATA, result.values).se, sqrt(.2436 / 200))
    direction = point_direction(DATA, 4)
    @test close(sum(direction.h), 0)
    @test close(direction.derivative, .42)
    @test close(direction.pairing, .42)
    @test close(direction.score[4], 11.5)
    @test all(close.(direction.score[[1,2,3,5,6,7,8]], -ones(7)))
    pt = linear_path([c.p for c in DATA.cells], direction.score, .1)
    @test close(sum(pt[i] * c.y for (i,c) in enumerate(DATA.cells)), .622)
    @test close(pt[4], .172)
    @test_throws ArgumentError point_direction(DATA, 0)
    @test_throws ArgumentError linear_path([c.p for c in DATA.cells], direction.score, 2)
    @test_throws ArgumentError linear_path([c.p for c in DATA.cells], ones(8), .01)
end

@testset "Chapter 1 readable loops and displayed script output" begin
    minimal = (n=200, cells=[(n=c.n, y=c.y) for c in COUNTS])
    result = mean_if(minimal)
    @test close(result.risk, 116 / 200)
    @test length(result.values) == 8
    @test result.values ≈ [-.58,.42,-.58,.42,-.58,.42,-.58,.42]
    @test abs(result.mean) < 1e-12
    @test !hasproperty(minimal, :marginal_risk)
    changed_cells = [(n=c.n + (c.x == 0 && c.a == 1 ? (c.y == 1 ? -1 : 1) : 0), y=c.y) for c in COUNTS]
    changed_result = mean_if((n=200, cells=changed_cells))
    @test close(changed_result.risk, 115 / 200)
    @test close(changed_result.values[2], .425)
    @test abs(changed_result.mean) < 1e-12
    result.values[1] = 999
    @test close(mean_if(minimal).values[1], -.58)
    lesson = joinpath(@__DIR__, "..", "..", "zh", "julia", "lessons", "ch01.jl")
    expected_output = read(joinpath(@__DIR__, "..", "..", "zh", "julia", "lessons", "ch01-output.txt"), String)
    actual_output = cd(tempdir()) do
        read(`$(Base.julia_cmd()) --startup-file=no --history-file=no $lesson`, String)
    end
    @test actual_output == expected_output
end

@testset "Initial empirical equation is not already solved" begin
    initial = case_at(DATA, 0)
    @test close(initial.estimate, -.04)
    @test close(initial.score, .24)
    @test close(initial.aipw, .20)
    @test close(initial.eif_mean, .24)
    @test close(initial.eif_second_moment, 1.64)
    @test close(initial.eif_variance, 1.5824)
    @test close(initial.se, sqrt(1.5824 / 200))
    @test [g.h for g in initial.groups] ≈ [-1.25,5,-5,1.25]
    @test [g.offset for g in initial.groups] ≈ [log(3/2),log(14/11),log(3/2),log(14/11)]
    @test [g.score_contribution for g in initial.groups] ≈ [-.05,.12,.20,-.03]
end

@testset "ATE gradients agree with independently expected directions" begin
    values = eif_values(DATA.empirical_model, DATA.cells)
    @test values ≈ [.775,-.475,-4.1,.9,1.1,-3.9,-.525,.725]
    @test close(ate(DATA.empirical_model), .20)
    for index in 1:8
        direction = point_direction(DATA, index)
        check = direction_check(DATA, direction.score)
        @test close(check.pairing, values[index])
        @test close(check.finite_difference, values[index]; atol=2e-8)
    end
    mixed = [(c.x-.5) + (c.a-DATA.empirical_model.g[c.x+1]) +
             (c.y-DATA.empirical_model.q[c.a+1,c.x+1]) for c in DATA.cells]
    @test close(direction_check(DATA, mixed).pairing, .07)
    @test close(direction_check(DATA, mixed).finite_difference, .07; atol=2e-8)
    treatment = [c.a-DATA.empirical_model.g[c.x+1] for c in DATA.cells]
    @test close(direction_check(DATA, treatment).pairing, 0)
    @test close(direction_check(DATA, treatment).finite_difference, 0; atol=2e-8)
end

@testset "Known-g projection removes only the orthogonal candidate component" begin
    demo = projection_demo(DATA; b=2)
    expected = [.775,-.475,-4.1,.9,1.1,-3.9,-.525,.725]
    @test demo.projection ≈ expected
    @test demo.residual ≈ [-.4,-.4,1.6,1.6,-1.6,-1.6,.4,.4]
    @test close(demo.projection_second_moment, 1.0975)
    @test close(demo.residual_second_moment, .64)
    @test close(demo.candidate_second_moment, 1.7375)
    p = [c.p for c in DATA.cells]
    for basis in demo.basis
        @test close(weighted_inner(p, demo.residual, basis), 0)
    end
    @test_throws ArgumentError weighted_projection(p, expected, [ones(8),ones(8)])
end

@testset "Empirical variance is labelled separately from a true efficiency bound" begin
    moments = if_variance(DATA)
    @test close(moments.mean, 0)
    @test close(moments.variance, 1.0975)
    @test close(moments.se, .07407766195029054)
    @test close(moments.second_moment, 1.0975)
    shifted = if_variance(DATA, eif_values(DATA.empirical_model, DATA.cells) .+ 2)
    @test close(shifted.mean, 2)
    @test close(shifted.variance, 1.0975)
    @test close(shifted.second_moment, 5.0975)
end

@testset "Average likelihood derivatives are score and negative curvature" begin
    for epsilon in (-.1,0.0,.1,.2)
        h = 1e-5
        low = fluctuation_score(DATA, epsilon-h)
        high = fluctuation_score(DATA, epsilon+h)
        current = fluctuation_score(DATA, epsilon)
        @test close((high.log_likelihood-low.log_likelihood)/(2h), current.score; atol=1e-8)
        @test close((high.score-low.score)/(2h), current.slope; atol=1e-8)
        @test current.slope < 0
    end
    @test close(fluctuation_score(DATA, 0).slope, -1.52)
    @test close(fluctuation_score(DATA, 0).log_likelihood,
                (60log(.6)+40log(.4)+56log(.56)+44log(.44))/200)
end

@testset "Bisection solves the observed score and updates four different Q values" begin
    first = bisection_step(DATA, -1, 1)
    @test first.midpoint == 0
    @test close(first.score, .24)
    @test first.lo == 0 && first.hi == 1
    result = solve_case(DATA)
    @test result.converged
    @test 0 < result.iterations <= 200
    @test result.reason == "score_tolerance"
    @test close(result.epsilon, .16223923963495762)
    expected_q = [.5504938029381765 .3999361660282145;
                  .7412274916740939 .6092024772922978]
    @test all(close.(result.updated_fit.q, expected_q))
    @test close(result.estimate, .20)
    @test close(result.score, 0)
    @test close(result.eif_mean, 0)
    @test close(result.eif_second_moment, 1.2192623957849897)
    @test close(result.eif_variance, 1.2192623957849897)
    @test close(result.se, .07807888305377421)
    @test result.updated_fit.q != DATA.empirical_model.q
    @test all(g -> 0 < g.q_updated < 1, result.groups)
    @test result.log_likelihood > case_at(DATA, 0).log_likelihood
end

@testset "Changing observed events or population counts changes the fitted result" begin
    changed = [c.x == 0 && c.a == 1 ? merge(c, (n=c.y == 1 ? 15 : 5,)) : c for c in COUNTS]
    data = case_data(changed)
    result = solve_case(data)
    @test data.n == 200
    @test data.groups[2].n == 20 && data.groups[2].events == 15
    @test close(data.initial_estimate, -.05)
    @test close(data.marginal_risk, .575)
    @test result.converged
    @test close(result.estimate, .175)
    @test !close(result.epsilon, .16223923963495762)
    different_population = case_data([c.x == 1 ? merge(c, (n=2c.n,)) : c for c in COUNTS])
    @test different_population.n == 300
    @test all(close.(different_population.empirical_model.px, [1/3,2/3]))
    @test close(solve_case(different_population).estimate, 7/30)
end

@testset "Malformed input and solver failure are explicit" begin
    @test_throws ArgumentError case_data(COUNTS[1:7])
    @test_throws ArgumentError case_data([COUNTS[1:7]; COUNTS[1]])
    for bad in (0,-1,1.2,NaN,Inf,true)
        @test_throws ArgumentError case_data([merge(COUNTS[1], (n=bad,)); COUNTS[2:end]])
    end
    @test_throws ArgumentError case_data([merge(COUNTS[1], (x=2,)); COUNTS[2:end]])
    @test_throws ArgumentError solve_case(DATA; lo=.3, hi=.4)
    @test_throws ArgumentError solve_case(DATA; lo=1, hi=-1)
    @test_throws ArgumentError solve_case(DATA; score_tol=0)
    @test_throws ArgumentError solve_case(DATA; maxiter=0)
    @test_throws ArgumentError case_at(DATA, NaN)
    @test_throws ArgumentError case_at(DATA, 1000)
    @test_throws ArgumentError fluctuation_score(DATA, 1e308)
    failed = solve_case(DATA; maxiter=1)
    @test !failed.converged
    @test failed.reason == "maximum_iterations"
    mktemp() do path, io
        write(io, "x,a,y,events\n0,0,0,24\n"); Base.close(io)
        @test_throws ArgumentError read_counts(path)
    end
end

@testset "Fresh results do not share mutable model arrays" begin
    first = case_data(COUNTS)
    first.initial_fit.q[1,1] = .1
    first.empirical_model.g[1] = .1
    second = case_data(COUNTS)
    @test close(second.initial_fit.q[1,1], .6)
    @test close(second.empirical_model.g[1], .2)
    state = case_at(second)
    state.updated_fit.q[1,1] = .1
    @test close(second.initial_fit.q[1,1], .6)
    @test close(case_at(second).updated_fit.q[1,1], .6)
    @test [c.n for c in COUNTS] == [24,56,4,16,16,4,40,40]
end
