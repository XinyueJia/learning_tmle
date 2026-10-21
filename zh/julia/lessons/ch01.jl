# 第1讲脚本：载入工具、读取同一份计数，再调用均值函数。
include(joinpath(@__DIR__, "..", "..", "..", "shared", "julia", "EIFCase.jl"))
using .EIFCase

data_file = joinpath(@__DIR__, "..", "..", "..", "shared", "data", "rws-counts.csv")
data = case_data(data_file)
result = mean_if(data)

println("总人数 N = ", data.n)
println("终点事件风险 = ", result.risk)
for y in 0:1
    influence = y - result.risk
    println("Y = ", y, "，D = ", round(influence; digits=6))
end
println("经验 IF 平均（舍入前） = ", result.mean)
println("经验 IF 平均（小数点后至多6位） = ", round(result.mean; digits=6))
