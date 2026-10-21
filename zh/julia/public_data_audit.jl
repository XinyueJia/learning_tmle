include(joinpath(@__DIR__, "..", "..", "shared", "julia", "PublicRWS.jl"))
using .PublicRWS

# 示例：julia --startup-file=no --history-file=no zh/julia/public_data_audit.jl all 12
# 可显式限制某一药物：julia zh/julia/public_data_audit.jl Afatinib 12
length(ARGS) <= 3 || throw(ArgumentError("Usage: public_data_audit.jl [all|Afatinib|Erlotinib|Gefitinib] [horizon_months] [csv_path]"))
drug = isempty(ARGS) ? "all" : ARGS[1]
horizon = length(ARGS) < 2 ? 12.0 : parse(Float64, ARGS[2])
path = length(ARGS) == 3 ? ARGS[3] : joinpath(@__DIR__, "..", "..", "shared", "data", "public", "ng-2021-nsclc", "source.csv")
rows = read_public_rows(path)
audit = audit_public_rows(rows; horizon, drug)

println("Ng et al. (2021) 公开原始文件审计 / public source-file audit")
println("source_n=", audit.source_n, " n=", audit.n, " drug=", audit.drug, " horizon_months=", audit.horizon)
for name in ("Afatinib", "Erlotinib", "Gefitinib")
    println("by_drug_", name, "=", audit.by_drug_counts[name])
end
for key in (:death_without_progression, :pfs_exceeds_followup, :mutation_negative,
            :provisional_pfs_early_no_progression, :provisional_os_early_alive,
            :endpoint_admissible, :endpoint_status)
    println(key, "=", getproperty(audit, key))
end
println("以上仅为字段检查；保留全部原始行。时间起点、状态与时间配对、删失规则尚未确认。")
println("早期记录数为暂定文件筛查，不能确认为临床删失或12个月结局。")
println("停止于临床终点编码之前：不构造Y，不计算临床ATE、EIF或TMLE。")
println("Clinical endpoint preparation is blocked pending source confirmation; these counts are not survival risks.")
