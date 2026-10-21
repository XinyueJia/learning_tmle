# 公开 RHC 队列：X=性别，A=是否 RHC，Y=30 日死亡；全部量由原始记录计算。
# BEGIN_CH08核心段给出expit、score、四组更新、二分与失败检查的全部定义。
# 本脚本显式手动试epsilon，再逐次缩小括号；没有调用TMLE软件包。
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "RHCCase.jl"))
using .RHCCase
using Printf

function manual_tmle(data; lo=-1.0, hi=1.0, tolerance=1e-12, maxiter=200)
    # 每次score都是Σ组 H×(观察事件−预测事件)/总人数。
    for epsilon in (0.0, 0.1, 0.2)
        @printf("手动epsilon=%.3f: score=%+.9f\n", epsilon, fluctuation_score(data, epsilon).score)
    end
    fluctuation_score(data, lo).score >= 0 && fluctuation_score(data, hi).score <= 0 ||
        error("起始括号没有夹住score根")
    for iteration in 1:maxiter
        step = bisection_step(data, lo, hi)
        if iteration <= 5
            @printf("二分%d: epsilon=%.9f, score=%+.9f\n", iteration, step.midpoint, step.score)
        end
        if abs(step.score) <= tolerance
            # case_at逐组计算expit(offset+epsilon×H)，再按经验X比例平均。
            result = case_at(data, step.midpoint)
            for group in result.groups
                @printf("x=%d,a=%d: Qstar=%.12f, score贡献=%+.12f\n", group.x, group.a, group.q_updated, group.score_contribution)
            end
            @printf("epsilon=%.12f，性别标准化风险差=%.12f，经验EIF平均=%.3g，SE=%.9f\n", result.epsilon, result.estimate, result.eif_mean, result.se)
            return result
        end
        step.midpoint != lo && step.midpoint != hi || error("二分因浮点精度停止")
        lo, hi = step.lo, step.hi
    end
    error("达到最大迭代数，尚未得到满足容差的score根")
end

data = rhc_data()
manual_tmle(data)

println("此处仅按性别标准化，未建立充分混杂控制；结果不作为 RHC 临床因果效应。")

# 同一批5735位患者，最后把X从性别扩展为事先列出的17列基线设计。
# 逻辑回归的Newton步骤、似然回溯见RHCCase.jl的BEGIN_FULL_BASELINE。
# 逐人更新及score见BEGIN_FULL_TARGET；仍然没有使用TMLE或回归软件包。
function manual_baseline_tmle(fit; lo=-0.25, hi=0.25, tolerance=1e-12, maxiter=200)
    println("扩展基线列 = ", fit.feature_names)
    println("年龄标准化：均值=", fit.age_mean, "，总体标准差=", fit.age_sd)
    println("g最小/最大=", extrema(fit.g), "；没有截断或填补")
    initial = full_at(fit, 0.0)
    @printf("扩展基线初始风险差=%+.9f；AIPW=%+.9f；score=%+.9f\n", initial.estimate, initial.aipw, initial.score)
    for epsilon in (0.0, 0.002, 0.004)
        state = full_at(fit, epsilon)
        @printf("逐人试epsilon=%.3f：score=%+.9f，平均对数似然=%.9f\n", epsilon, state.score, state.log_likelihood)
    end
    for iteration in 1:maxiter
        step = full_bisection_step(fit, lo, hi)
        if iteration <= 5
            @printf("扩展基线二分%d：epsilon=%.9f，score=%+.9f\n", iteration, step.midpoint, step.score)
        end
        if abs(step.score) <= tolerance
            state = full_at(fit, step.midpoint)
            @printf("扩展基线epsilon=%.12f：risk0=%.9f，risk1=%.9f\n", state.epsilon, state.risk0, state.risk1)
            @printf("TMLE风险差=%+.9f；score=%.3g；经验EIF均值=%.3g；经验SE=%.9f\n", state.estimate, state.score, state.eif_mean, state.se)
            return state
        end
        step.midpoint != lo && step.midpoint != hi || error("扩展基线二分因浮点精度停止")
        lo, hi = step.lo, step.hi
    end
    error("扩展基线二分未在最大迭代数内收敛")
end

full_fit = prepare_full(read_rhc_rows())
manual_baseline_tmle(full_fit)
println("扩展基线模型仍省略急性病情严重程度；充分混杂控制与选择机制假设未被数据证明。")
println("经验SE只描述当前模型的渐近推导，不保证置信区间覆盖或临床因果识别。")
