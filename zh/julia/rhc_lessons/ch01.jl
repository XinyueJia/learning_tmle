# 第1讲：直接读取公开 RHC 原始记录，计算 30 日死亡均值。
# include 执行另一个文件，使读取函数可以在这里使用。
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "RHCCase.jl"))
# using 把模块导出的函数名带到当前脚本。
using .RHCCase
# DEFAULT_SOURCE 是随项目冻结的原始 CSV 的绝对路径。
rows = read_rhc_rows(DEFAULT_SOURCE)
# 一行对应一位患者；这里没有删人、补值或重采样。
observations = rhc_observations(rows)
# length 数出总人数，对应数学式里的 n。
n = length(observations)
# 每位患者的 Y：原字段 dth30 为 Yes 时等于 1，否则等于 0。
y = [person.y for person in observations]
# sum 把 0/1 相加，所以 events 就是死亡人数。
events = sum(y)
# 除法 / 得到样本均值：μ̂ = (Y₁ + … + Yₙ) / n。
risk = events / n
# 每位患者的影响值：Dᵢ = Yᵢ − μ̂。
influence = y .- risk
# 点号 .- 表示逐个相减；sum 再将影响值加起来。
mean_influence = sum(influence) / n
# 相同的原始记录可以按(X,A,Y)组合汇总人数，便于后续推导。
data = rhc_data(DEFAULT_SOURCE)
# mean_if 用各格人数加权，应与上面的逐人结果一致。
check = mean_if(data)
# @assert 让两个实际计算不一致时立即停止。
@assert isapprox(check.risk, risk) && abs(mean_influence) < 1e-12
println("原始患者数 n = ", n, "；30 日死亡人数 = ", events)
println("样本死亡风险 μ̂ = ", risk)
println("Y=0 的 IF = ", -risk, "；Y=1 的 IF = ", 1-risk)
println("逐人 IF 平均 = ", mean_influence, "；按组人数加权 IF 平均 = ", check.mean)
# 这是全队列的描述性均值；本讲尚未估计处理效果。
