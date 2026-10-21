# Chapter 8: complete R workbook tracing one epsilon column by column
# Input: frozen original public RHC CSV; output: chapter objects and terminal checks; base R only.
# commandArgs(FALSE) reads the startup arguments. grep matches the start of a string using ^, and value=TRUE retains the matched strings. The result is a character vector of length zero or one locating the file run by Rscript.
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames() reads the call frames. vapply applies a function to each frame, requiring one character string per result. When source() runs a script, ofile records its path; frames without a path return an empty string.
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if selects the source path: use the last non-empty ofile when called through source(); otherwise remove the --file= prefix. Code pasted into the R console at the project root defaults to this lesson’s script path. The output is one path string; [] indexing starts at 1.
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("en", "R", "tmle_trace.R")
# length checks that the path has one element. 1L is integer 1, and !is.na excludes missing values. stopifnot requires every condition to be TRUE and stops otherwise.
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname extracts the script directory. file.path joins the path two levels up to the project root; normalizePath requires that directory to exist. The result is independent of the current working directory.
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source reads and executes the shared R definitions for reading the CSV, mathematical functions and manual model fitting. Only base R is used; no TMLE package is required.
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# Read the original 5735×63 data.frame, preserving patient row order.
rows <- read_rhc_rows(DEFAULT_SOURCE)
# Fit the initial outcome and treatment regressions and return their results in a list. Chapter 8 subsequently updates the outcome predictions.
fit <- prepare_full(rows)
# Read the cohort size as one integer scalar. Pagination does not change n.
n <- fit$n
# Extract a length-n numeric vector from fit$a. R’s copy-on-modify semantics preserve the initial object; index i still identifies the same original CSV patient.
a <- fit$a
# Extract a length-n numeric vector from fit$y. R’s copy-on-modify semantics preserve the initial object; index i still identifies the same original CSV patient.
y <- fit$y
# Extract a length-n numeric vector from fit$g. R’s copy-on-modify semantics preserve the initial object; index i still identifies the same original CSV patient.
g <- fit$g
# Extract a length-n numeric vector from fit$q0. R’s copy-on-modify semantics preserve the initial object; index i still identifies the same original CSV patient.
q0 <- fit$q0
# Extract a length-n numeric vector from fit$q1. R’s copy-on-modify semantics preserve the initial object; index i still identifies the same original CSV patient.
q1 <- fit$q1
# *, + and - operate element by element by default. Actual a selects q1 or q0 for each patient, producing n entries.
qa <- a * q1 + (1 - a) * q0
# Apply logit(p)=log(p/(1-p)) to each entry of qa. The n resulting log-odds values are the fixed observed-arm offsets.
offset <- logit(qa)
# Apply logit to each initial A=0 prediction, returning n fixed offsets for the same baseline records.
offset0 <- logit(q0)
# Apply logit to each initial A=1 prediction, returning n fixed offsets from the same fitted outcome regression.
offset1 <- logit(q1)
# / and - operate element by element by default. Actual A and corresponding g produce n signed clever-covariate values.
h <- a / g - (1 - a) / (1 - g)
# Divide the scalar −1 by each entry of 1−g, producing n negative update weights for prediction input A=0.
h0 <- -1 / (1 - g)
# Divide the scalar 1 by each entry of g, producing n positive update weights for prediction input A=1. The fitted treatment probabilities remain fixed.
h1 <- 1 / g
# Sys.getenv reads an environment-variable string, defaulting to "0". as.numeric converts it to one double scalar shared by all patients. The default 0 is a trial, not a solved root.
epsilon <- as.numeric(Sys.getenv("TMLE_EPSILON", "0"))
# Require epsilon to be finite. Converting an invalid string produces NA, which makes this check stop with an error.
stopifnot(length(epsilon) == 1L, is.finite(epsilon))
# Multiply the same scalar epsilon by every entry in the direction vector. Elementwise * produces n shifts on the log-odds scale.
shift <- epsilon * h
# Multiply the same scalar epsilon by every entry in the direction vector. Elementwise * produces n shifts on the log-odds scale.
shift0 <- epsilon * h0
# Multiply the same scalar epsilon by every entry in the direction vector. Elementwise * produces n shifts on the log-odds scale.
shift1 <- epsilon * h1
# Add each fixed offset to the shift in the same row. Elementwise + produces n linear predictors on the log-odds scale.
eta <- offset + shift
# Add each fixed offset to the shift in the same row. Elementwise + produces n linear predictors on the log-odds scale.
eta0 <- offset0 + shift0
# Add each fixed offset to the shift in the same row. Elementwise + produces n linear predictors on the log-odds scale.
eta1 <- offset1 + shift1
# expit applies 1/(1+exp(−u)) to each linear predictor, giving n risk predictions at the current epsilon. Call these targeted only after solving for the root.
qstar_a <- expit(eta)
# Subtract the current risk under actual treatment from each observed death indicator, producing n residuals. Actual y remains unchanged.
residual <- y - qstar_a
# Multiply H by the residual in the same row to obtain n score contributions. Later, sum and divide by n to average the whole column.
score_contribution <- h * residual
# expit applies 1/(1+exp(−u)) to each linear predictor, giving n risk predictions at the current epsilon. Call these targeted only after solving for the root.
qstar0 <- expit(eta0)
# expit applies 1/(1+exp(−u)) to each linear predictor, giving n risk predictions at the current epsilon. Call these targeted only after solving for the root.
qstar1 <- expit(eta1)
# Subtract qstar0 from qstar1 in each patient row, producing n contrasts. Both predictions use the same baseline W for that patient.
contrast <- qstar1 - qstar0
# Sum all 5735 prediction contrasts and divide by n to obtain one standardised risk difference. The denominator is the full cohort size.
psi <- sum(contrast) / n
# Subtract the same scalar psi from each predicted risk difference, producing n centred values. A mean near 0 does not imply that each entry is 0.
centred <- contrast - psi
# Add the score contribution and centred predicted risk difference in each row to obtain n complete empirical EIF values. The complete EIF includes both terms.
eif <- score_contribution + centred
# Sum all n score contributions and divide by n, giving one likelihood score. Root finding targets this mean rather than individual contributions.
score_mean <- sum(score_contribution) / n
# Sum all n EIF values and divide by n. This scalar agrees with score_mean within floating-point error because the centred contrast averages to zero. At epsilon=0 it is the empirical mean of the initial fitted EIF.
eif_mean <- sum(eif) / n
# c joins seven length-n probability vectors only for checking bounds; the original objects remain unchanged.
probabilities <- c(g, q0, q1, qa, qstar_a, qstar0, qstar1)
# Check that every probability is finite and strictly between 0 and 1. Floating-point endpoints cause immediate failure; probabilities are not truncated.
stopifnot(all(is.finite(probabilities)), all(probabilities > 0), all(probabilities < 1))
# identical checks that both the values and types of observed A and Y remain unchanged.
stopifnot(identical(a, fit$a), identical(y, fit$y))
# Display the cohort size, trial epsilon and risk difference. Chapter 8 provides the root-finding steps.
cat("n =", n, "; epsilon =", epsilon, "; risk difference psi =", psi, "\n")
# Display the score mean and complete EIF mean over all n patients separately, retaining the explanation of numerical tolerance.
cat("score_mean =", score_mean, "; eif_mean =", eif_mean, "\n")
# qstar variables denote current Q_epsilon at arbitrary epsilon and become Q* only after explicitly solving the score equation; this script does not call a root solver.
