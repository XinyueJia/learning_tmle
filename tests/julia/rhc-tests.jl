using Test
using Statistics: mean
include(joinpath(@__DIR__, "..", "..", "shared", "julia", "RHCCase.jl"))
using .RHCCase

const RHC_ROWS = read_rhc_rows()
const RHC_COUNTS = rhc_counts(RHC_ROWS)
const RHC_DATA = rhc_data()
const RHC_FULL = full_analysis()
rhc_close(a,b; atol=1e-10) = isapprox(a,b; atol,rtol=0)

@testset "Original RHC source independently counted" begin
    # Frozen-source counts independently verified by Python's csv.DictReader.
    @test length(RHC_ROWS) == RHC_DATA.n == 5735
    @test length(first(RHC_ROWS)) == 63
    @test [c.n for c in RHC_COUNTS] == [1143,494,558,348,1320,594,796,482]
    @test sum(r["swang1"] == "RHC" for r in RHC_ROWS) == 2184
    @test sum(r["dth30"] == "Yes" for r in RHC_ROWS) == 1918
    @test sum(r["sex"] == "Male" for r in RHC_ROWS) == 3192
    @test [g.n for g in RHC_DATA.groups] == [1637,906,1914,1278]
    @test [g.events for g in RHC_DATA.groups] == [494,348,594,482]
    @test rhc_close(mean_if(RHC_DATA).risk,1918/5735)
    @test abs(mean_if(RHC_DATA).mean) < 1e-14
    @test RHC_ROWS[1]["ptid"] == "00005"
    @test RHC_ROWS[1]["age"] == " 70.25098" # preserve raw spaces and original strings
    @test length(rhc_observations(RHC_ROWS)) == length(RHC_ROWS)
    @test rhc_counts(reverse(RHC_ROWS)) == RHC_COUNTS
    mktemp() do path, io
        Base.close(io)
        write_rhc_counts(path,RHC_ROWS)
        @test RHCCase.EIFCase.read_counts(path) == RHC_COUNTS
    end
end

@testset "CSV grammar and raw schema fail visibly" begin
    @test csv_records("\ufeffa,b\r\n\"x,y\",\"line1\nline2\"\r\n") == [["a","b"],["x,y","line1\nline2"]]
    @test csv_records("a,b\n\"a\"\"b\",\n") == [["a","b"],["a\"b",""]]
    @test_throws ArgumentError csv_records("a\n\"unfinished")
    @test_throws ArgumentError csv_records("a\n\"closed\"trailing")
    @test_throws ArgumentError csv_records("a\nb\"c")
    @test_throws ArgumentError rhc_observations([Dict("sex"=>"NA","swang1"=>"RHC","dth30"=>"No")])
    @test_throws ArgumentError rhc_observations([Dict("sex"=>"Male","swang1"=>"Yes","dth30"=>"No")])
    @test_throws ArgumentError rhc_observations([Dict("sex"=>"Male","swang1"=>"RHC","dth30"=>"")])
    @test_throws ArgumentError rhc_observations(Dict{String,String}[])
    mktemp() do path, io
        write(io,"sex,swang1,dth30\nMale,RHC,No\n"); Base.close(io)
        @test_throws ArgumentError read_rhc_rows(path)
    end
    mktemp() do path, io
        source = read(DEFAULT_SOURCE,String)
        write(io,source * split(source,'\n')[2] * "\n"); Base.close(io)
        @test_throws ArgumentError read_rhc_rows(path) # duplicate patient
    end
end

@testset "All eight finite-model lessons use actual RHC weights" begin
    p = [c.p for c in RHC_DATA.cells]
    values = eif_values(RHC_DATA.empirical_model,RHC_DATA.cells)
    @test abs(sum(p .* values)) < 1e-14
    for i in 1:8
        direction = point_direction(RHC_DATA,i)
        @test abs(sum(direction.h)) < 1e-14
        @test rhc_close(direction.derivative,direction.pairing)
        check = direction_check(RHC_DATA,direction.score)
        @test rhc_close(check.finite_difference,check.pairing;atol=2e-8)
        @test rhc_close(check.pairing,values[i])
    end
    demo = projection_demo(RHC_DATA;b=2)
    @test demo.projection ≈ demo.canonical
    @test rhc_close(demo.candidate_second_moment,demo.projection_second_moment+demo.residual_second_moment)
    @test all(b -> abs(weighted_inner(p,demo.residual,b)) < 1e-12,demo.basis)
    initial = case_at(RHC_DATA)
    final = solve_case(RHC_DATA)
    @test abs(initial.score) > 1e-6
    @test final.converged && abs(final.score) < 1e-12 && abs(final.eif_mean) < 1e-12
    @test rhc_close(final.estimate,ate(RHC_DATA.empirical_model))
    @test all(q -> 0 < q < 1,final.updated_fit.q)
    @test final.log_likelihood > initial.log_likelihood
    @test rhc_close(if_variance(RHC_DATA).se,sqrt(if_variance(RHC_DATA).variance/5735))
end

@testset "Declared baseline feature transformation and logistic score equations" begin
    fit = RHC_FULL.fit
    @test fit.n == 5735
    @test size(fit.design) == (5735,17)
    @test fit.feature_names == ["intercept","male","age_z","race_black","race_other","cardiohx","chfhx","dementhx","psychhx","chrpulhx","renalhx","liverhx","gibledhx","malighx","immunhx","transhx","amihx"]
    @test fit.q_feature_names == [fit.feature_names... ,"A"]
    @test abs(mean(fit.design[:,3])) < 1e-14
    @test rhc_close(mean(fit.design[:,3].^2),1)
    @test rhc_close(fit.age_mean,61.37588299738448)
    @test rhc_close(fit.age_sd,16.68047483037684)
    @test fit.g_fit.converged && fit.q_fit.converged
    @test fit.g_fit.score_maximum < 1e-10 && fit.q_fit.score_maximum < 1e-10
    @test maximum(abs.(fit.design'*(fit.a-fit.g)/fit.n)) < 1e-10
    qdesign = hcat(fit.design,fit.a)
    qobs = fit.a.*fit.q1 + (1 .-fit.a).*fit.q0
    @test maximum(abs.(qdesign'*(fit.y-qobs)/fit.n)) < 1e-10
    @test rhc_close(minimum(fit.g),0.07869797540624915)
    @test rhc_close(maximum(fit.g),0.6819050426722195)
    @test all(p -> 0 < p < 1,[fit.g;fit.q0;fit.q1])
    for (field,value) in (("age","NA"),("race","unknown"),("chfhx",""))
        changed = copy(RHC_ROWS)
        changed[1] = merge(changed[1],Dict(field=>value))
        @test_throws ArgumentError prepare_full(changed)
    end
    @test_throws ArgumentError fit_logistic(ones(10,2),Float64[0,1,0,1,0,1,0,1,0,1])
end

@testset "Individual targeting is an actual likelihood root with finite-difference checks" begin
    fit, initial, targeted = RHC_FULL.fit,RHC_FULL.initial,RHC_FULL.targeted
    @test targeted.converged
    @test abs(initial.score) > .003
    @test rhc_close(initial.estimate,.0864988559023306)
    @test rhc_close(initial.aipw,.08996799520909834)
    @test rhc_close(targeted.epsilon,.003576966662876657)
    @test rhc_close(targeted.risk0,.30058304496920574)
    @test rhc_close(targeted.risk1,.39056276970451026)
    @test rhc_close(targeted.estimate,.08997972473530443)
    @test abs(targeted.score) < 1e-12 && abs(targeted.eif_mean) < 1e-12
    @test rhc_close(targeted.estimate,mean(targeted.q1-targeted.q0))
    @test rhc_close(targeted.aipw,targeted.estimate)
    @test targeted.log_likelihood > initial.log_likelihood
    @test rhc_close(targeted.se,.013082375165239404)
    @test all(q -> 0 < q < 1,[targeted.q0;targeted.q1])
    for epsilon in (-.01,0.0,.003,.01)
        step = 1e-5
        low,at,high = full_at(fit,epsilon-step),full_at(fit,epsilon),full_at(fit,epsilon+step)
        @test rhc_close((high.log_likelihood-low.log_likelihood)/(2step),at.score;atol=1e-8)
        @test rhc_close((high.score-low.score)/(2step),at.slope;atol=1e-8)
        @test at.slope < 0
    end
    @test_throws ArgumentError full_at(fit,NaN)
    @test_throws ArgumentError full_at(fit,1000)
    @test_throws ArgumentError solve_full(fit;lo=.1,hi=.2)
    @test_throws ErrorException solve_full(fit;maxiter=1)
    changed = copy(RHC_ROWS)
    changed[1] = merge(changed[1],Dict("dth30"=>"Yes"))
    changed_fit = prepare_full(changed)
    @test abs(solve_full(changed_fit).estimate-targeted.estimate) > 1e-6
end

@testset "All eight RHC lesson scripts run from outside the repository" begin
    for chapter in 1:8
        lesson = joinpath(@__DIR__,"..","..","zh","julia","rhc_lessons","ch$(lpad(chapter,2,'0')).jl")
        output = cd(tempdir()) do
            read(`$(Base.julia_cmd()) --startup-file=no --history-file=no $lesson`,String)
        end
        @test !isempty(output)
    end
    @test length(readlines(joinpath(@__DIR__,"..","..","zh","julia","rhc_lessons","ch01.jl"))) == 32
end
