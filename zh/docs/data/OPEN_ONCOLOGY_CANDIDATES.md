# Open individual-level oncology data: inspected candidates

Verified 16 October 2026. Initial screening scope: the protocol's advanced NSCLC, initial active drug comparison, and 12-month progression-or-all-cause-death endpoint. This is a source-screening report, not an effectiveness result. Only publicly served original supplementary files were inspected, without accounts or credentials. At that screening stage, inspection copies remained in temporary storage. The project has subsequently frozen all 107 original Ng records, unchanged, in [source.csv](../../../shared/data/public/ng-2021-nsclc/source.csv), with [provenance.json](../../../shared/data/public/ng-2021-nsclc/provenance.json), for the [public-data audit lesson](../../src/public-data.md). This is an audit-only adoption: `endpoint_admissible=false`; the clinical endpoint and causal analysis remain unvalidated.

**Initial screening decision, still applicable to clinical analysis:** genuine observational NSCLC records with multiple drugs are publicly downloadable. The strongest contextual candidate is Ng et al. (2021), but its endpoint documentation and internal timing checks do **not** yet support a trustworthy, complete 12-month progression-or-all-cause-death variable. None of the three inspected candidates is a verified drop-in replacement for the complete-outcome teaching model. The subsequent frozen-source audit adoption does not change this judgement. Do not silently code early censoring as no event, exclude it, or change the endpoint to obtain a convenient table.

## 1. Strongest contextual match: Ng et al. (2021)

- Original publication: [Real-world outcomes of first- and second-generation tyrosine kinase inhibitors first-line in patients with epidermal growth factor receptor mutation-positive non-small cell lung cancer: A retrospective observational cohort study](https://doi.org/10.1371/journal.pone.0253335).
- Original data: [S1 Dataset DOI](https://doi.org/10.1371/journal.pone.0253335.s001); [direct CSV download](https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0253335.s001&type=supplementary).
- Design: retrospective hospital cohort, Taipei, June 2014–May 2019; first-line treatment chosen by physicians. The authors describe anonymisation before analysis. This is observational patient data, not randomisation, synthetic data, reconstructed Kaplan–Meier records, or an aggregate table. The paper describes first-line TKI use; it does not supply a general longitudinal washout history sufficient to independently validate every new-user eligibility rule.
- Download verified: 12,469 bytes; CSV, 107 records × 34 columns. Drug counts from `Group_S`: afatinib 47, erlotinib 33, gefitinib 27. A two-drug afatinib–gefitinib comparison would contain 74 records before any additional eligibility rules. It is not authorised or implemented by this report.
- Observed baseline fields: `Age`, `Male`, `Smoking`, `Previous_cancer`, `Concurrent_cancer`, family-history indicators, `Histologies`, `ECOG`, `c_TNM`, `Nodal_involvement`, `c_Stage_S`, `EGFR_S`. Treatment response, subsequent treatment and radiotherapy fields must not automatically be treated as baseline confounders.
- Observed outcome fields: `Progression`, `Survived`, `Death`, `Follow_up_month`, `PFS_month`, `Time_on_treatment`. `Group` pools erlotinib and gefitinib; use the explicit drug label when a specific active comparator is intended.

### Endpoint and censoring audit

The [article Methods](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0253335#sec002) specifies RECIST 1.1 progression. It does not explicitly define whether `PFS_month` counts every death, how its censoring time was obtained, or exactly which event indicator pairs with it. The public peer-review page was also inspected; no resolving codebook was found.

Direct file checks show:

- `Progression` and `Death` take 0/1; `Survived = 1 − Death` in all records. There are 27 records with `Progression=0` and `Death=1`. Therefore progression alone cannot be assumed to be the protocol's composite event flag.
- `PFS_month` exceeds `Follow_up_month` in 13 records: afatinib 3, gefitinib 5, erlotinib 5. No record has the two times exactly equal. The fields cannot safely be merged into a composite outcome without resolving their definitions and time origins.
- `PFS_month` ranges 0.99–60.98 and `Follow_up_month` 0.23–60.45. There are no values exactly 12 in either field.

The following are **conditional mechanical counts**, not validated clinical event classifications. They show what the tempting but unverified `Progression`/`PFS_month` pairing would produce. The middle column means only that the recorded time reaches 12 under that pairing. It does not prove the requested composite endpoint is known.

| Initial drug | Records | `Progression=1`, `PFS_month<12` | `PFS_month>=12` | `Progression=0`, `PFS_month<12`: unresolved before 12 |
| --- | ---: | ---: | ---: | ---: |
| Afatinib | 47 | 19 | 21 | 7 |
| Gefitinib | 27 | 9 | 10 | 8 |
| Erlotinib | 33 | 11 | 13 | 9 |
| Total | 107 | 39 | 44 | 24 |

For comparison, the equally provisional `Death`/`Follow_up_month` pairing gives deaths before 12 / recorded follow-up at least 12 / alive with recorded follow-up below 12 of 7/39/1 for afatinib, 9/17/1 for gefitinib, and 11/22/0 for erlotinib. This is an overall-survival audit only. It does not repair the progression composite or authorise changing the clinical question.

Under that same provisional OS pairing, the minimum recorded follow-up among those coded alive is 8.77 months for afatinib, 3.61 for gefitinib and 16.49 for erlotinib. Thus a three-month OS status would be mechanically complete for all 107 records; this is not evidence that the current endpoint is complete. Other horizons are recorded below for a future explicitly authorised change of question. Counts use the original fields without excluding records.

| Drug | Horizon (months) | `Death=1`, time ≤ horizon | Time ≥ horizon | `Death=0`, time < horizon: unknown |
| --- | ---: | ---: | ---: | ---: |
| Afatinib | 3 | 1 | 46 | 0 |
| Afatinib | 6 | 3 | 44 | 0 |
| Afatinib | 12 | 7 | 39 | 1 |
| Gefitinib | 3 | 3 | 24 | 0 |
| Gefitinib | 6 | 4 | 22 | 1 |
| Gefitinib | 12 | 9 | 17 | 1 |
| Erlotinib | 3 | 7 | 26 | 0 |
| Erlotinib | 6 | 7 | 26 | 0 |
| Erlotinib | 12 | 11 | 22 | 0 |

All records have nonblank `Age`, `Male`, `Smoking`, `ECOG`, `c_TNM`, `c_Stage`, and `EGFR_S`. Nonblank does not prove complete confounding control. `EGFR_S` contains one `Negative` entry despite the described mutation-positive cohort, plus inconsistent capitalisation of exon 19. `filter_$` is 0 in one record. Its exclusion rule is undocumented and must not be copied without investigation. No deletions or corrections were made.

SHA-256 of original CSV: `5194dca457f8efac8cbd771f47dee06b3aabe3885923585cd8f0d452471fbd9d`.

## 2. Larger first-line cohort: Yang et al. (2020)

- Publication: [Comparative effectiveness and cost-effectiveness of three first-line EGFR-tyrosine kinase inhibitors: Analysis of real-world data in a tertiary hospital in Taiwan](https://doi.org/10.1371/journal.pone.0231413).
- Data: [S2 Appendix DOI](https://doi.org/10.1371/journal.pone.0231413.s002); [direct XLSX download](https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0231413.s002&type=supplementary).
- Design: observational first-line EGFR-TKI cohort at National Cheng Kung University Hospital, 2011–2017. Consent and QoL availability selected 379 of 729 treated patients; 192 were propensity-score matched. This is genuine clinical data, with selection and confounding limitations.
- Verified workbook: 409,114 bytes; `Cohort` has 379 records and 10 columns, `QoL` 1,836 repeated observations, and `Cost` aggregate monthly costs. Initial treatment labels/counts: `AfatinibPO` 71, `ErlotinibPO` 57, `GefitinibPO` 251. `Cohort` labels `PSM`/`Included` identify the matched subset versus the other included records, not two independent cohorts to concatenate.
- Baseline columns: `Age`, `Gender`, `Del19`, `PerformanceStatus`, `Recurrence`, `BrainMetastasis`. Smoking is absent; performance status has one literal `NA`.
- Endpoint gap: only `FollowupTime` and `PD` accompany those variables. `PD` takes 0/1 but the workbook supplies no explicit death flag or distinct progression and death times. The article studies OS and PFS; the label `PD` alone does not establish which outcome the released time/status pair encodes. This prevents a verified progression-or-all-cause-death derivation.

Additional inspection: the article explicitly anchors clinical follow-up at EGFR-TKI initiation, with survival status verified to September 2018. The workbook's only cell comment decodes `Del19`: 0 other mutations, 1 exon 19 deletions, 2 L858R substitution. [S1 Appendix](https://doi.org/10.1371/journal.pone.0231413.s001) describes Figure B as showing both PFS and OS but supplies no mapping of `PD` to either curve. The observed pair yields matched-subset Kaplan–Meier medians of 12.17/12.67/11.5 months (afatinib/erlotinib/gefitinib). This suggests PFS but does not establish it. At 12 months, `PD=0` with `FollowupTime<12` occurs in 4/5/2 records, respectively. Even a validated mapping would therefore require handling unknown fixed-horizon outcomes.

SHA-256: `c027932ae3770c29d539ea77e122310b3d72014798979291b5fd2600c1717e62`.

## 3. Explicit event definition, weaker design match: Chen et al. (2020)

- Publication: [Early serum tumor marker levels after fourteen days of tyrosine kinase inhibitor targeted therapy predicts outcomes in patients with advanced lung adenocarcinoma](https://doi.org/10.1371/journal.pone.0240736).
- Data: [S1 Data DOI](https://doi.org/10.1371/journal.pone.0240736.s001); [direct XLS download](https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0240736.s001&type=supplementary).
- Design: prospective single-centre clinical cohort, 2012–2015, with several treatment lines and repeat recruitment on rechallenge. It is not a randomised trial; its principal comparison concerns post-treatment biomarker patterns rather than drug initiation.
- Verified workbook: 334,848 bytes, one `work file` sheet, 191 treatment episodes × 60 columns; publication describes 184 people. Drug coding explicitly names gefitinib, erlotinib, afatinib, crizotinib, LDK378 and an erlotinib-to-gefitinib category. Episode counts are 60, 88, 19, 2, 2 and 20 respectively. Baseline columns include age, sex, smoking, performance status, mutation, brain and liver metastases. There are start/PD date fields, calculated days and a `censored` field, with 19 blank censoring entries.
- Endpoint mismatch: publication PFS counts progression or **death due to cancer**, rather than all-cause death. Repeated episodes, mixed indications/lines, exclusions and post-treatment biomarker selection require substantial redesign. Its work file also contains an unnamed numerical field and date/birth-related columns without a public de-identification dictionary. Do not redistribute this raw file in the tutorial without resolving those fields. No individual values are reproduced here.

SHA-256: `cc6bc1abb3e61597a4b4ed350fbf7aeecb13a3981c839c238af6f495c980f68d`.

## Access, licence and implementation boundary

Each direct publisher URL above returned an original tabular file without login, application, DUA acceptance or credentialed portal. These are public supplementary records, not controlled-access patient files. All three article copyright notices link the Creative Commons Attribution licence and permit reuse with attribution. [PLOS licensing policy](https://journals.plos.org/plosone/s/licenses-and-copyright) specifies CC BY 4.0 for published works and permits copying, redistribution and modification with proper credit. No separate restrictive supplement notice was found. This is the observed publisher licence evidence; the public accessibility of an arbitrary file alone would not establish permission to redistribute it.

For any adoption, preserve the original citation, supplement DOI, licence link, download date, file hash and a transformation log. The Ng frozen-source audit now retains its source and provenance in the paths above. Resolve event semantics before producing any 12-month endpoint; retain unknown status and its reason. Predefine baseline-only adjustment variables, active comparator, eligibility, common time zero and censoring treatment. No candidate proves exchangeability, positivity, or full baseline ascertainment.

At the initial screening stage, the synthetic curriculum and protocol were unchanged. The subsequent public-data lesson adds a genuine Ng source audit alongside the eight-lecture synthetic mathematical example. Its 107 records have not replaced the lectures' analytical dataset, and the endpoint gate remains false. Ng et al. remains a lead for a future genuine NSCLC drug-comparison analysis; an exact analytical replacement remains unverified.

## Follow-on screen after authorisation to change disease and endpoint

16 October 2026. The user subsequently prioritised genuine public RWS data and permitted a disease/endpoint change. The earlier sections record the original NSCLC screen; that initial scope no longer restricts candidate selection. A focused follow-on search identified the following stronger candidate for **documented fixed-horizon outcome and embedded dictionary**, although it still does not validate a simple baseline-treatment causal analysis.

### Malhani et al. (2021): antiviral regimens and 28-day all-cause mortality

- Publication: [Combination of (interferon beta-1b, lopinavir/ritonavir and ribavirin) versus favipiravir in hospitalized patients with non-critical COVID-19: A cohort study](https://doi.org/10.1371/journal.pone.0252984).
- Original data: [S1 File: Study raw data](https://doi.org/10.1371/journal.pone.0252984.s006); [direct SPSS SAV download](https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0252984.s006&type=supplementary). Download verified without an account: 105,457 bytes, 243 rows × 117 variables. SHA-256: `de968408b0d2f3c73f8b91550a1b4b4fb1ed83cd9c4109fbaf2999d36dc6ac4b`.
- Original design: prospective single-centre observational cohort in Riyadh, May–September 2020. National/institutional protocol changes allocated treatment non-randomly. These are patient observations, not an RCT, simulated data or reconstructed survival records. Comparison is an active antiviral regimen versus another active regimen, rather than drug versus no treatment.
- Documented outcome/time origin: the Methods explicitly defines all-cause mortality at 28 days after hospital admission, with admission as time zero. Researchers telephoned discharged patients/families to ascertain vital status irrespective of discharge. This is clearer than the Ng PFS mapping.
- Licence/access: the article's copyright notice links Creative Commons Attribution and the data are its published supplement. The [PLOS CC BY 4.0 reuse policy](https://journals.plos.org/plosone/s/licenses-and-copyright) permits redistribution with attribution. No separate restrictive supplement notice or access gate was found. No records were placed in the repository.

The original SAV has variable labels and value labels. This inspection used that embedded dictionary, not guessed group numbering:

| Original variable | Verified dictionary / role |
| --- | --- |
| `TT_DT_Fav` | 1 favipiravir; 2 double therapy; 3 triple therapy. Six additional rows have unlabelled code 0. |
| `No_dual_removingdual` | 1 for all 222 rows in groups 1/3; 0 for the remaining 21. This agrees with the article's analysed cohort size. The excluded rows comprise 15 labelled double-therapy rows plus 6 unlabelled rows; do not describe all 21 as fully decoded double therapy. |
| `Death_28_Days` | 0 no; 1 yes. No missing values in the analysed 222 records. Favipiravir: 18/154 deaths; triple regimen: 6/68. These reproduce the publication's counts. |
| `Time_to_death_28_Days` | Numeric time, no unit-specific value labels beyond its variable name. In patients with no recorded death, it frequently stops before 28; therefore it is not a validated complete 28-day observation time. |
| `Male` | 0 female; 1 male. |
| `Covid_severity` | 0 mild; 1 moderate; 2 severe. |
| `Age`, `BMI`, `pulse_oximeter_baseline`, `news2_baseline` | Candidate admission covariates. Age, sex and BMI have no missing entries in the 222 analysed rows; baseline oximetry has one missing entry. |
| Baseline comorbidities / laboratory tests | Diabetes, hypertension, cardiovascular/cerebrovascular disease, kidney disease, malignancy, smoking and explicit `_baseline` laboratory columns are available. Laboratory missingness varies substantially. Third/seventh-day tests and subsequent supportive treatment are not baseline covariates. |

**Causal-analysis judgement:** suitable for a genuine RWS data-quality and causal-design lesson, including a fully observed published binary outcome; **not yet a defensible replacement for this tutorial's static `O=(X,A,Y)` drug-initiation case**. Antiviral receipt can begin after admission, and the publication explicitly models treatment as time-varying to address immortal-time bias. Subtracting the two onset-to-admission/treatment fields gives missing treatment delays in 14/222 records and negative delays in 22/222, so those fields do not resolve the time-zero problem reliably. Treatment months overlap but are imbalanced: triple regimen May/June/July = 8/56/4; favipiravir June/July/August/September = 63/48/42/1. Calendar-time confounding and common support remain substantive concerns. Simple baseline TMLE cannot cure those design problems.

For the released binary mortality indicator, the article's explicit 28-day follow-up supports treating discharge as distinct from loss of vital-status follow-up. For survival analyses, do not assume that a short `Time_to_death_28_Days` with `Death_28_Days=0` proves death-free follow-up through day 28; the pair requires clarification. Do not manufacture follow-up times or change post-discharge status.

The focused follow-on search also checked the public dexamethasone–methylprednisolone cohort of [Pinzón et al.](https://doi.org/10.1371/journal.pone.0252057). It was rejected as a stronger baseline causal teaching case because eligibility excludes early deaths/short treatment exposure and treatment is tied to nonconcurrent calendar periods. Its available file does not overcome those design limitations. No broader catalogue was assembled.

**Follow-on conclusion:** the antiviral dataset improves outcome and codebook clarity, but this bounded screen did not establish a public active-comparator dataset with both a validated complete fixed binary outcome and an adequately aligned baseline drug-initiation design. It should not be promoted as solving the original problem merely because its event flag is convenient.
