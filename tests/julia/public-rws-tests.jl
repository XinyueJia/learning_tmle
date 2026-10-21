using Test
using SHA
include(joinpath(@__DIR__, "..", "..", "shared", "julia", "PublicRWS.jl"))
using .PublicRWS

const PUBLIC_CSV = joinpath(@__DIR__, "..", "..", "shared", "data", "public", "ng-2021-nsclc", "source.csv")
const PUBLIC_ROWS = read_public_rows(PUBLIC_CSV)
const EXPECTED_HEADERS = split("Group_S,Age,Male,Previous_cancer,Concurrent_cancer,Subsequent_cancer,Family_history_lung,Family_history,Smoking,Histologies,ECOG,c_TNM,Nodal_involvement,c_Stage_S,c_Stage,Change_to_TKI_therapy,Time_on_treatment,TKI_response_S,EGFR_S,RT,Progression,Survived,Death,Follow_up_month,Group,Age_60,ECOG_2gr,TKI_response_4gr,EGFR_4gr,DCR,ORR,Stage_2gr,filter_\$,PFS_month", ',')

# The expected source totals below come from an independent CSV audit, not from
# another call to the function under test. Raw checksum detects changed inputs.
@testset "Frozen public source and original fields" begin
    @test bytes2hex(sha256(read(PUBLIC_CSV))) == "5194dca457f8efac8cbd771f47dee06b3aabe3885923585cd8f0d452471fbd9d"
    @test length(PUBLIC_ROWS) == 107
    @test length(EXPECTED_HEADERS) == 34
    @test Set(keys(first(PUBLIC_ROWS))) == Set(EXPECTED_HEADERS)
    @test first(PUBLIC_ROWS)["Age"] == "82"
    @test first(PUBLIC_ROWS)["PFS_month"] == "0.99"
    @test count(r -> isempty(r["DCR"]), PUBLIC_ROWS) == 2
    @test count(r -> isempty(r["ORR"]), PUBLIC_ROWS) == 2
    @test count(r -> r["EGFR_S"] == "exon 19", PUBLIC_ROWS) == 1
end

@testset "Descriptive file checks and endpoint refusal" begin
    result = audit_public_rows(PUBLIC_ROWS)
    @test result.n == 107
    @test result.source_n == 107
    @test result.by_drug_counts == Dict("Afatinib" => 47, "Erlotinib" => 33, "Gefitinib" => 27)
    @test result.death_without_progression == 27
    @test result.pfs_exceeds_followup == 13
    @test result.mutation_negative == 1
    @test result.provisional_pfs_early_no_progression == 24
    @test result.provisional_os_early_alive == 2
    @test result.endpoint_admissible === false
    @test result.endpoint_status == "unverified_time_status_pairing"
    @test !hasproperty(result, :Y)
    @test !hasproperty(result, :ate)
    @test !hasproperty(result, :risk)
    @test_throws ArgumentError prepare_endpoint(PUBLIC_ROWS)
    @test_throws ArgumentError prepare_endpoint(PUBLIC_ROWS; endpoint="12m_os")
    @test_throws ArgumentError prepare_endpoint(PUBLIC_ROWS; endpoint="custom", source_confirmed=true)
    @test_throws ArgumentError prepare_endpoint(Dict{String,String}[])
    for (name, n) in (("afatinib", 47), ("Erlotinib", 33), ("GEFITINIB", 27))
        filtered = audit_public_rows(PUBLIC_ROWS; drug=name)
        @test filtered.n == n
        @test filtered.source_n == 107
        @test sum(values(filtered.by_drug_counts)) == n
        @test filtered.endpoint_admissible === false
    end
    @test PUBLIC_ROWS == read_public_rows(PUBLIC_CSV)
    for horizon in (0, -1, Inf, NaN, true, "12")
        @test_throws ArgumentError audit_public_rows(PUBLIC_ROWS; horizon)
    end
    @test_throws ArgumentError audit_public_rows(PUBLIC_ROWS; drug="unknown")
    @test_throws ArgumentError audit_public_rows(PUBLIC_ROWS; drug=1)
end

@testset "Counts respond to changed records and horizons" begin
    edited = deepcopy(PUBLIC_ROWS)
    edited[1]["PFS_month"] = "0.5" # First row originally has 0.99 > 0.89 months.
    edited_audit = audit_public_rows(edited)
    @test edited_audit.n == 107
    @test edited_audit.pfs_exceeds_followup == 12
    @test PUBLIC_ROWS[1]["PFS_month"] == "0.99"
    # This hand-specified record adds exactly one to every audited flag.
    extra = copy(first(PUBLIC_ROWS))
    merge!(extra, Dict("Group_S" => "Erlotinib", "Death" => "1", "Survived" => "0",
        "Progression" => "0", "PFS_month" => "2", "Follow_up_month" => "1", "EGFR_S" => "Negative"))
    changed = audit_public_rows(vcat(PUBLIC_ROWS, [extra]))
    @test changed.n == 108
    @test changed.by_drug_counts == Dict("Afatinib" => 47, "Erlotinib" => 34, "Gefitinib" => 27)
    @test changed.death_without_progression == 28
    @test changed.pfs_exceeds_followup == 14
    @test changed.mutation_negative == 2
    @test changed.provisional_pfs_early_no_progression == 25
    @test changed.provisional_os_early_alive == 2
    alive = copy(extra)
    merge!(alive, Dict("Death" => "0", "Survived" => "1", "PFS_month" => "12", "Follow_up_month" => "12"))
    boundary = audit_public_rows([alive])
    @test boundary.provisional_pfs_early_no_progression == 0
    @test boundary.provisional_os_early_alive == 0
    beyond = audit_public_rows([alive]; horizon=12.01)
    @test beyond.provisional_pfs_early_no_progression == 1
    @test beyond.provisional_os_early_alive == 1
    @test length(PUBLIC_ROWS) == 107
end

function with_csv(f, text)
    mktemp() do path, io
        write(io, text)
        close(io)
        f(path)
    end
end

function row_csv(row; header=EXPECTED_HEADERS)
    escaped = ["\"" * replace(row[field], "\"" => "\"\"") * "\"" for field in header]
    join(header, ',') * "\r\n" * join(escaped, ',') * "\r\n"
end

@testset "CSV quoting, BOM, CRLF and schema errors" begin
    @test PublicRWS.csv_records("\ufeffa,b\r\n\"x,y\",\"a\"\"b\"\r\n") == [["a", "b"], ["x,y", "a\"b"]]
    @test PublicRWS.csv_records("a,b\n\"x\ny\",\"z\r\nw\"") == [["a", "b"], ["x\ny", "z\r\nw"]]
    @test PublicRWS.csv_records("a,b\r1,\r") == [["a", "b"], ["1", ""]]
    @test PublicRWS.csv_records("\"\"") == [[""]]
    @test PublicRWS.csv_records("a,b,") == [["a", "b", ""]]
    for malformed in ("a\"b,c", "\"a\"x,b", "a,\"b")
        @test_throws ArgumentError PublicRWS.csv_records(malformed)
    end
    quoted = copy(first(PUBLIC_ROWS))
    quoted["c_TNM"] = "source text, \"quoted\"\r\n第二行"
    with_csv("\ufeff" * row_csv(quoted)) do path
        reread = read_public_rows(path)
        @test length(reread) == 1
        @test first(reread) == quoted
    end
    for malformed in ("", join(EXPECTED_HEADERS, ','),
                      row_csv(quoted; header=vcat(EXPECTED_HEADERS[1:33], ["Group_S"])),
                      row_csv(quoted; header=EXPECTED_HEADERS[1:33]),
                      row_csv(quoted) * "\r\n",
                      row_csv(quoted) * "short,row\n")
        with_csv(malformed) do path
            @test_throws ArgumentError read_public_rows(path)
        end
    end
end

@testset "Invalid values fail instead of dropping records" begin
    for (field, value) in (("Follow_up_month", "0"), ("Follow_up_month", "NaN"),
                           ("PFS_month", "Inf"), ("PFS_month", "-1"), ("Age", ""),
                           ("Time_on_treatment", "-1"), ("Death", "2"), ("Progression", ""),
                           ("Group_S", "Drug A"), ("ECOG", "5"), ("EGFR_S", "Unknown"),
                           ("DCR", "2"), ("c_TNM", ""))
        invalid = copy(first(PUBLIC_ROWS))
        invalid[field] = value
        @test_throws ArgumentError audit_public_rows([invalid])
        with_csv(row_csv(invalid)) do path
            @test_throws ArgumentError read_public_rows(path)
        end
    end
    @test_throws ArgumentError audit_public_rows(Dict{String,String}[])
    @test_throws ArgumentError audit_public_rows([Dict("Death" => "0")])
end

@testset "Runnable audit prints machine keys and refusal" begin
    script = joinpath(@__DIR__, "..", "..", "zh", "julia", "public_data_audit.jl")
    output = cd(tempdir()) do
        read(`$(Base.julia_cmd()) --startup-file=no --history-file=no $script`, String)
    end
    for line in ("by_drug_Afatinib=47", "by_drug_Erlotinib=33", "by_drug_Gefitinib=27",
                 "death_without_progression=27", "pfs_exceeds_followup=13", "mutation_negative=1",
                 "provisional_pfs_early_no_progression=24", "provisional_os_early_alive=2",
                 "endpoint_admissible=false", "endpoint_status=unverified_time_status_pairing")
        @test line in split(output, '\n')
    end
    @test occursin("不构造Y", output)
    @test occursin("not survival risks", output)
    restricted = read(`$(Base.julia_cmd()) --startup-file=no --history-file=no $script Afatinib 12 $PUBLIC_CSV`, String)
    @test occursin("source_n=107 n=47 drug=afatinib", restricted)
end
