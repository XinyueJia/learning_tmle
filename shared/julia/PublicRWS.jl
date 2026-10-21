module PublicRWS

export read_public_rows, audit_public_rows, prepare_endpoint

# Raw supplementary-file fields are retained verbatim. No synthetic model is imported.
const REQUIRED_FIELDS = [
    "Group_S", "Age", "Male", "Previous_cancer", "Concurrent_cancer",
    "Subsequent_cancer", "Family_history_lung", "Family_history", "Smoking",
    "Histologies", "ECOG", "c_TNM", "Nodal_involvement", "c_Stage_S", "c_Stage",
    "Change_to_TKI_therapy", "Time_on_treatment", "TKI_response_S", "EGFR_S", "RT",
    "Progression", "Survived", "Death", "Follow_up_month", "Group", "Age_60",
    "ECOG_2gr", "TKI_response_4gr", "EGFR_4gr", "DCR", "ORR", "Stage_2gr",
    "filter_\$", "PFS_month",
]
const DRUGS = ("Afatinib", "Erlotinib", "Gefitinib")
const BINARY_FIELDS = [
    "Male", "Previous_cancer", "Concurrent_cancer", "Subsequent_cancer",
    "Family_history_lung", "Family_history", "Smoking", "Nodal_involvement",
    "Change_to_TKI_therapy", "RT", "Progression", "Survived", "Death", "Age_60",
    "ECOG_2gr", "filter_\$",
]
const CATEGORIES = Dict(
    "Group_S" => DRUGS,
    "Histologies" => ("Adenocarcinoma", "Non-Small cell carcinoma", "Adenocarcinoma in situ"),
    "ECOG" => ("0", "1", "2", "3", "4"),
    "c_Stage_S" => ("IIIA", "IIIB", "IV"),
    "c_Stage" => ("1", "2", "4"),
    "TKI_response_S" => ("na", "pr", "sd", "pd"),
    "EGFR_S" => ("Negative", "Exon 18", "Exon 19", "exon 19", "Exon 20", "Exon 21",
                 "Exon 18 + Exon 20", "Exon 19 + Exon 21", "Exon 20 + Exon 21"),
    "Group" => ("1", "2"),
    "TKI_response_4gr" => ("1", "2", "3", "4"),
    "EGFR_4gr" => ("1", "2", "3", "4"),
    "Stage_2gr" => ("1", "2"),
    # Empty DCR/ORR cells are present in the released file and remain empty.
    "DCR" => ("", "0", "1"), "ORR" => ("", "0", "1"),
)

"""Parse CSV records, including quoted commas/newlines, escaped quotes, CRLF and UTF-8 BOM."""
function csv_records(source::AbstractString)
    bytes = collect(codeunits(source))
    i = startswith(source, '\ufeff') ? 4 : 1
    records = Vector{String}[]
    record = String[]
    field = IOBuffer()
    state = :unquoted
    active = false
    while i <= length(bytes)
        b = bytes[i]
        if state == :quoted
            if b == 0x22
                if i < length(bytes) && bytes[i+1] == 0x22
                    write(field, b)
                    i += 1
                else
                    state = :afterquote
                end
            else
                write(field, b)
            end
        elseif b == 0x2c || b == 0x0a || b == 0x0d
            push!(record, String(take!(field)))
            state = :unquoted
            if b == 0x2c
                active = true
            else
                push!(records, record)
                record = String[]
                active = false
                if b == 0x0d && i < length(bytes) && bytes[i+1] == 0x0a
                    i += 1
                end
            end
        elseif state == :afterquote
            throw(ArgumentError("Unexpected character after closing CSV quote"))
        elseif b == 0x22
            position(field) == 0 || throw(ArgumentError("Quote inside an unquoted CSV field"))
            state = :quoted
            active = true
        else
            write(field, b)
            active = true
        end
        i += 1
    end
    state == :quoted && throw(ArgumentError("Unclosed CSV quote"))
    if active || !isempty(record)
        push!(record, String(take!(field)))
        push!(records, record)
    end
    records
end

function positive_number(value, field, index; allow_zero=false)
    parsed = tryparse(Float64, value)
    valid = parsed !== nothing && isfinite(parsed) && (allow_zero ? parsed >= 0 : parsed > 0)
    valid || throw(ArgumentError("Row $index: $field must be finite and $(allow_zero ? "non-negative" : "positive")"))
    parsed
end

function validate_rows(rows)
    isempty(rows) && throw(ArgumentError("The public cohort must contain at least one row"))
    for (i, row) in enumerate(rows)
        Set(keys(row)) == Set(REQUIRED_FIELDS) ||
            throw(ArgumentError("Row $i: expected the 34 original supplementary-file fields"))
        all(v -> v isa AbstractString, values(row)) ||
            throw(ArgumentError("Row $i: preserve raw field values as strings"))
        for field in BINARY_FIELDS
            row[field] in ("0", "1") || throw(ArgumentError("Row $i: invalid binary $field"))
        end
        for (field, allowed) in CATEGORIES
            row[field] in allowed || throw(ArgumentError("Row $i: invalid category for $field"))
        end
        for field in ("Age", "Follow_up_month", "PFS_month")
            positive_number(row[field], field, i)
        end
        positive_number(row["Time_on_treatment"], "Time_on_treatment", i; allow_zero=true)
        isempty(row["c_TNM"]) && throw(ArgumentError("Row $i: c_TNM must not be empty"))
    end
    rows
end

"""Read the original 34-field public CSV without recoding, imputing or excluding rows."""
function read_public_rows(path::AbstractString)
    records = csv_records(read(path, String))
    isempty(records) && throw(ArgumentError("Empty public CSV"))
    headers = first(records)
    length(headers) == 34 && length(unique(headers)) == 34 && Set(headers) == Set(REQUIRED_FIELDS) ||
        throw(ArgumentError("Expected 34 unique original supplementary-file headers"))
    rows = Dict{String,String}[]
    for (i, values) in enumerate(records[2:end])
        length(values) == 34 || throw(ArgumentError("CSV data row $i: expected 34 fields; no rows were dropped"))
        push!(rows, Dict(zip(headers, values)))
    end
    validate_rows(rows)
end

"""
    audit_public_rows(rows; horizon=12.0, drug="all")

Descriptive file checks only. Time/status pairing is unverified, so provisional
early records do not establish censoring, survival risk or clinical endpoint Y.
The optional named-drug restriction is explicit; no eligibility exclusions occur.
"""
function audit_public_rows(rows; horizon=12.0, drug="all")
    validate_rows(rows)
    horizon isa Real && !(horizon isa Bool) && isfinite(horizon) && horizon > 0 ||
        throw(ArgumentError("The audit horizon must be finite and positive"))
    drug isa AbstractString || throw(ArgumentError("drug must be all or an original drug name"))
    requested = lowercase(drug)
    requested in ("all", lowercase.(DRUGS)...) || throw(ArgumentError("Unknown drug: $drug"))
    selected = [row for row in rows if requested == "all" || lowercase(row["Group_S"]) == requested]
    by_drug_counts = Dict(name => count(r -> r["Group_S"] == name, selected) for name in DRUGS)
    (; n=length(selected), source_n=length(rows), drug=requested, horizon=Float64(horizon),
       by_drug_counts,
       death_without_progression=count(r -> r["Death"] == "1" && r["Progression"] == "0", selected),
       pfs_exceeds_followup=count(r -> parse(Float64, r["PFS_month"]) > parse(Float64, r["Follow_up_month"]), selected),
       mutation_negative=count(r -> r["EGFR_S"] == "Negative", selected),
       provisional_pfs_early_no_progression=count(r -> r["Progression"] == "0" && parse(Float64, r["PFS_month"]) < horizon, selected),
       provisional_os_early_alive=count(r -> r["Death"] == "0" && parse(Float64, r["Follow_up_month"]) < horizon, selected),
       endpoint_admissible=false, endpoint_status="unverified_time_status_pairing")
end

"""Refuse every clinical endpoint until the source time/status dictionary is confirmed."""
function prepare_endpoint(rows; endpoint="12m_pfs", kwargs...)
    throw(ArgumentError("Endpoint $endpoint is not admissible: source time origins, status/time pairing and censoring rules remain unverified. No clinical Y, ATE, EIF or TMLE is prepared."))
end

end # module
