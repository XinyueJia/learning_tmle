include(joinpath(@__DIR__, "..", "..", "shared", "julia", "PublicRWS.jl"))
using .PublicRWS

# Example: julia --startup-file=no --history-file=no en/julia/public_data_audit.jl all 12
# Explicitly restrict to one drug: julia en/julia/public_data_audit.jl Afatinib 12
length(ARGS) <= 3 || throw(ArgumentError("Usage: public_data_audit.jl [all|Afatinib|Erlotinib|Gefitinib] [horizon_months] [csv_path]"))
drug = isempty(ARGS) ? "all" : ARGS[1]
horizon = length(ARGS) < 2 ? 12.0 : parse(Float64, ARGS[2])
path = length(ARGS) == 3 ? ARGS[3] : joinpath(@__DIR__, "..", "..", "shared", "data", "public", "ng-2021-nsclc", "source.csv")
rows = read_public_rows(path)
audit = audit_public_rows(rows; horizon, drug)

println("Ng et al. (2021) public source-file audit")
println("source_n=", audit.source_n, " n=", audit.n, " drug=", audit.drug, " horizon_months=", audit.horizon)
for name in ("Afatinib", "Erlotinib", "Gefitinib")
    println("by_drug_", name, "=", audit.by_drug_counts[name])
end
for key in (:death_without_progression, :pfs_exceeds_followup, :mutation_negative,
            :provisional_pfs_early_no_progression, :provisional_os_early_alive,
            :endpoint_admissible, :endpoint_status)
    println(key, "=", getproperty(audit, key))
end
println("These are field checks only; all original rows are retained. Time origins, status/time pairing and censoring rules remain unconfirmed.")
println("Early-record counts are provisional file screening; they do not establish clinical censoring or 12-month outcomes.")
println("Stop before clinical endpoint coding: do not construct Y or compute a clinical ATE, EIF or TMLE.")
println("Clinical endpoint preparation is blocked pending source confirmation; these counts are not survival risks.")
