# 第1讲对象图的连续工作簿：无需外部Julia包；只读取冻结RHC原CSV。
include(joinpath(@__DIR__, "..", "..", "shared", "julia", "RHCCase.jl"))
using .RHCCase
rows = read_rhc_rows(DEFAULT_SOURCE) # 输入路径；输出每条含63原字段的记录。
observations = rhc_observations(rows) # 输出仍按原顺序排列的(x,a,y)。
n = length(observations) # n是一个整数，不是向量。
y = [person.y for person in observations] # y是n项0/1向量。
events = sum(y) # 向量求和→一个事件人数；对应ΣᵢYᵢ。
risk = events / n # 两个标量相除→样本风险。
support_y = [0.0, 1.0] # 现在两行是可能结局，不是两位患者。
p = [count(==(v), y) / n for v in support_y] # 逐组计数除n，得2项经验概率。
mu = sum(p .* support_y) # .*逐元素乘；sum将2项加总→参考P=P_n的均值。
z = 1 # 接收新增权重的结局；只允许0或1。
t = 0.1 # 无量纲替换比例，可改0至1；不修改原y。
point = Float64.(support_y .== z) # .==逐项判断，Float64.把真假变为1.0/0.0。
p_t = (1 - t) .* p + t .* point # 保留组件加点质量组件→2项新概率。
mu_t = sum(p_t .* support_y) # 对同样结局改用新权重，得到新均值。
delta = mu_t - mu # 两个标量相减，得到实际概率差。
derivative = z - mu # 选择的结局减原均值：均值路径的导数。
rate = t == 0 ? missing : delta / t # ? :条件式；t=0时0/0未定义，用missing。
linear_mean = mu + t * derivative # 精确线性式；不是泰勒近似。
support_D = support_y .- mu # 2项函数表，规则D(y;P)=y−μ。
influence = y .- risk # 相同规则逐人应用；输出仍n项。
mean_influence = sum(influence) / n # 完整n项平均，实数恒等式为0。
grouped_mean_D = sum(p .* support_D) # 对2组按原P加权，值与上式一致。
old_mean_D = sum(p_t .* support_D) # 旧函数不变，只换新权重：通常非零。
new_support_D = support_y .- mu_t # 另一条函数D(y;P_t)，不能冒充旧D。
new_mean_D = sum(p_t .* new_support_D) # 新函数在新分布下重新中心化为0。
alive = 1 .- y # 每个实际死亡编码取补集，仍n项。
survival = sum(alive) / n # n项存活指标平均→一个30日存活概率。
survival_influence = alive .- survival # 补集的IF是原IF逐项反号。
# 直接计数与独立分数基准核对；失败抛出异常，进程非零退出。
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
# 同时检查两个z及t=0、1边界；导数用独立加权均值的有限差分核对。
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
