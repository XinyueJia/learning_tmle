# 从冻结的公开 RHC 原始数据运行全部八讲；不需要第三方 Julia 包。
# 可传入另一份具有原始 63 列结构的 CSV：julia zh/julia/rhc_case.jl path.csv
include(joinpath(@__DIR__, "..", "..", "shared", "julia", "RHCCase.jl"))
using .RHCCase
using Printf

function main(path=DEFAULT_SOURCE)
    rows = read_rhc_rows(path)
    data = rhc_data(path)
    println("公开 RHC 原始记录：", path)
    println("n=", length(rows), "；映射 Female=0/Male=1，No RHC=0/RHC=1，dth30 No=0/Yes=1")
    println("各观测组合的人数 = ", [c.n for c in data.cells])
    mean = mean_if(data)
    @printf("第1讲：死亡风险=%.9f，均值IF平均=%.3g\n", mean.risk, mean.mean)
    direction = point_direction(data, 4)
    @printf("第2讲：均值直接导数=%.9f，IF配对=%.9f\n", direction.derivative, direction.pairing)
    println("第3讲：pX=", data.empirical_model.px, "，估计g=", data.empirical_model.g)
    @printf("第4讲：初始Q只按A拟合，初始风险差=%+.9f，初始梯度平均=%+.9f\n", data.initial_estimate, case_at(data).eif_mean)
    check = direction_check(data, direction.score)
    @printf("第5讲：风险差差分=%.9f，梯度配对=%.9f\n", check.finite_difference, check.pairing)
    demo = projection_demo(data)
    @printf("第6讲：固定g投影误差=%.3g\n", maximum(abs.(demo.projection-demo.canonical)))
    moments = if_variance(data)
    @printf("第7讲：饱和经验梯度方差=%.9f，SE=%.9f\n", moments.variance, moments.se)
    result = solve_case(data)
    result.converged || error("TMLE score solver did not converge")
    @printf("第8讲：epsilon=%.12f，性别标准化风险差=%+.9f，score=%.3g，SE=%.9f\n", result.epsilon, result.estimate, result.score, result.se)
    full = full_analysis(path)
    println("扩展基线特征顺序 = ", full.fit.feature_names)
    println("g拟合系数 = ", full.fit.g_fit.coefficients)
    println("Q拟合系数（末列为A） = ", full.fit.q_fit.coefficients)
    println("年龄均值/总体SD = ", (full.fit.age_mean,full.fit.age_sd))
    println("g范围 = ", extrema(full.fit.g), "；Newton迭代数 = ", (full.fit.g_fit.iterations,full.fit.q_fit.iterations))
    @printf("扩展基线：初始RD=%+.12f，AIPW=%+.12f，初始score=%+.12f\n", full.initial.estimate, full.initial.aipw, full.initial.score)
    @printf("扩展基线：epsilon=%.12f，risk0=%.12f，risk1=%.12f，TMLE_RD=%+.12f，score=%.3g，SE=%.12f\n", full.targeted.epsilon, full.targeted.risk0, full.targeted.risk1, full.targeted.estimate, full.targeted.score, full.targeted.se)
    println("扩展基线仍省略急性病情严重程度；充分混杂控制与选择机制假设未被数据证明。")
    println("只按性别分层的模型用于手算；两个模型都不能凭数值收敛建立临床因果效果结论。")
    full
end

if abspath(PROGRAM_FILE) == @__FILE__
    length(ARGS) <= 1 || error("Usage: julia rhc_case.jl [original-rhc.csv]")
    main(isempty(ARGS) ? DEFAULT_SOURCE : only(ARGS))
end
