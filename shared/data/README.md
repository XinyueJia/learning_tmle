# Current real RHC cohort and preserved teaching sources

The adopted unchanged source is `public/rhc/source.csv` (5,735 records). Its provenance, original citation and Vanderbilt repository permission are adjacent. `rhc-counts.csv` aggregates source sex, RHC and 30-day mortality into eight cells; `rhc-records.csv` expands those same cells and is a **derived reordering**, not the original row order or original patient identifier. The full-W analysis always reads the unchanged original file. Build checks the source SHA-256 and all eight counts.

The following sections describe preserved earlier fixtures. `rws-*` are synthetic and are no longer the clinical input to the course. The Ng cohort remains a separately bounded historical audit candidate.

---

# Fixed synthetic RWS observations

`rws-counts.csv` is the canonical eight-cell input; `rws-records.csv` expands exactly the same observations into 200 rows. These are synthetic teaching data, not real-world patient records or evidence about any named medicine. The counts are unchanged from the previous teaching case; only their application context and filenames have changed.

| Column | Meaning |
| --- | --- |
| x | Baseline prognostic stratum: 0 high risk, 1 low risk; a teaching simplification, not a validated clinical score |
| a | Initial treatment: 1 starts study medicine A, 0 starts active comparator medicine B |
| y | At least one progression or all-cause death within 12 months: 1 yes; 0 confirmed progression-free and alive; one binary record per person |
| n | Number of people in the cell; used only in the aggregated file |
| id | Synthetic row identifier in the expanded file; no clinical meaning |

Both treatments are assumed available for the same indication and line of therapy in advanced non-small-cell lung cancer. Follow-up begins at first treatment and continues after discontinuation or switching. The exercise assumes complete endpoint ascertainment and adequate baseline confounding control. It estimates an initial-treatment risk difference, not a sustained-treatment effect or a hazard ratio. It does not separately evaluate safety.

The numerical model is defined once in `shared/js/math.js`. Chinese protocol and explanations are in `zh/docs/RWS_CASE_PROTOCOL.md`; clinical display labels are localised rather than duplicated in the numerical engines.


## Genuine public observational source

`public/ng-2021-nsclc/source.csv` contains the unmodified 107-record public Ng et al. (2021) supplement. Its source, CC BY attribution and checksum are stored alongside it. It is distinct from the synthetic observations above. The public-data companion audits original fields but does not construct an unverified 12-month PFS endpoint or estimate a clinical treatment effect. See `zh/src/public-data.md`, `shared/js/public-rws.js` and `shared/julia/PublicRWS.jl`. Missing or ambiguous follow-up is never silently coded as no event.
