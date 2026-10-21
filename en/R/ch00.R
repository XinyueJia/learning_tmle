# Chapter 0: real-object workbook for initial Q/g
# Input: frozen original public RHC CSV; output: chapter objects and terminal checks; base R only.
# commandArgs(FALSE) reads the startup arguments. grep matches the start of a string using ^, and value=TRUE retains the matched strings. The result is a character vector of length zero or one locating the file run by Rscript.
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames() reads the call frames. vapply applies a function to each frame, requiring one character string per result. When source() runs a script, ofile records its path; frames without a path return an empty string.
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if selects the source path: use the last non-empty ofile when called through source(); otherwise remove the --file= prefix. Code pasted into the R console at the project root defaults to this lesson’s script path. The output is one path string; [] indexing starts at 1.
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("en", "R", "ch00.R")
# length checks that the path has one element. 1L is integer 1, and !is.na excludes missing values. stopifnot requires every condition to be TRUE and stops otherwise.
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname extracts the script directory. file.path joins the path two levels up to the project root; normalizePath requires that directory to exist. The result is independent of the current working directory.
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source reads and executes the shared R definitions for reading the CSV, mathematical functions and manual model fitting. Only base R is used; no TMLE package is required.
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# read_rhc_rows reads the official original CSV. The shared file locates DEFAULT_SOURCE. rows is a 5735×63 data.frame; each row represents the same original patient.
rows <- read_rhc_rows(DEFAULT_SOURCE)
# Encode the original sex, swang1 and dth30 fields as the binary columns x, a and y. Return an n×3 data.frame in the original row order.
observations <- rhc_observations(rows)
# $ selects column y by name. This numeric vector has length n: 1 means death within 30 days, and 0 means survival at 30 days. Its dim is NULL.
y <- observations$y
# length counts vector elements, returning the integer cohort size n=5735. For a data.frame, nrow counts patient rows while length counts variable columns.
n <- length(y)
# prepare_full constructs a 17-column design including an intercept from the 15 original baseline variables. It fits g and Q and returns a list containing the initial models.
fit <- prepare_full(rows)
# Extract the n×17 numeric design matrix from the list. Age scaling uses a standard deviation calculated with denominator n; race uses white as its reference category.
design <- fit$design
# Extract actual RHC treatment as a numeric vector a of length n. Later predictions change only a newly constructed treatment-input column.
a <- fit$a
# Extract the fitted outcome vector, which has length n and agrees with observations$y in every patient row.
y <- fit$y
# Extract the fitted outcome regression as a list. Its coefficients vector has 18 entries, one for each column of the outcome design matrix.
q_fit <- fit$q_fit
# Extract the fitted treatment regression as a list. It contains 17 coefficients and n fitted treatment probabilities.
g_fit <- fit$g_fit
# Show the fit performed inside prepare_full: use the n×17 matrix and n actual A values in Newton iteration with likelihood backtracking, returning the fitted g list.
g_fit <- fit_logistic(design, a)
# cbind joins the n×17 baseline design and n-element a column to make an n×18 matrix. fit_logistic uses outcome y and returns the same 18 Q coefficients.
q_fit <- fit_logistic(cbind(design, a), y)
# Read the fitted n-item RHC probabilities; g and mortality risk Q predict different events.
g <- g_fit$probabilities
# rep(1,n) creates n ones. cbind forms an n×18 design; %*% performs matrix multiplication, drop converts the n×1 result to a vector, and expit converts each entry to a risk.
q1 <- expit(drop(cbind(design, rep(1, n)) %*% q_fit$coefficients))
# Using the same coefficients and W, create a new prediction-input column with A=0 for everyone. Return n q0 values without overwriting actual a.
q0 <- expit(drop(cbind(design, rep(0, n)) %*% q_fit$coefficients))
# R applies *, + and - elementwise. In each patient row, a=1 selects q1 and a=0 selects q0, producing an n-element vector of observed-arm predictions.
qa <- a * q1 + (1 - a) * q0
# Save the selected predictions. R’s copy-on-modify semantics preserve this saved value when qa is reassigned later, enabling an independent check.
qa_selected <- qa
# Join the same design with actual a and directly calculate risks under actual treatment. These should equal the row-by-row selected predictions.
qa <- expit(drop(cbind(design, a) %*% q_fit$coefficients))
# Subtract the two predictions for each patient, then sum all n differences and divide by the full cohort size to obtain the initial standardised risk difference.
initial_estimate <- sum(q1 - q0) / n
# Check the patient, death and RHC-recipient counts against the original cohort totals. Stop immediately if any count differs.
stopifnot(n == 5735L, sum(y) == 1918, sum(a) == 2184)
# dim returns the matrix’s two integer dimensions; identical checks both values and types. The Q coefficient vector must have 18 entries.
stopifnot(identical(dim(design), c(n, 17L)), length(q_fit$coefficients) == 18L)
# all combines elementwise checks into one logical value. Direct and selected predictions must differ by less than tolerance; actual A must remain unchanged.
stopifnot(all(abs(qa - qa_selected) < 1e-14), all(a == observations$a))
# c joins three vectors only for checking strict probability bounds. Any endpoint fails the check; no truncation is applied.
stopifnot(all(c(g, q0, q1) > 0), all(c(g, q0, q1) < 1))
# cat displays existing scalars and matrix dimensions; \n starts a new line. Multiply a probability difference by 100 to express percentage points.
cat("n =", n, "; design =", dim(design), "; initial risk difference =", initial_estimate, "\n")
# Baseline variables may still omit confounding; the initial standardised association cannot directly be interpreted as a clinical causal effect.
