# BEGIN_CH08核心段给出expit、score、四组更新、二分与失败检查的全部定义。
# 本脚本显式手动试epsilon，再逐次缩小括号；没有调用TMLE软件包。
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "EIFCase.jl"))
using .EIFCase
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
            @printf("epsilon=%.12f，ATE=%.12f，经验EIF平均=%.3g，SE=%.9f\n", result.epsilon, result.estimate, result.eif_mean, result.se)
            return result
        end
        step.midpoint != lo && step.midpoint != hi || error("二分因浮点精度停止")
        lo, hi = step.lo, step.hi
    end
    error("达到最大迭代数，尚未得到满足容差的score根")
end

data = case_data(joinpath(@__DIR__, "..", "..", "..", "shared", "data", "rws-counts.csv"))
manual_tmle(data)
