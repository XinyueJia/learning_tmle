# Chapter 8: AIPW and explicit manual bisection for TMLE
# Input: frozen original public RHC CSV; output: chapter objects and terminal checks; base R only.
# commandArgs(FALSE) reads the startup arguments. grep matches the start of a string using ^, and value=TRUE retains the matched strings. The result is a character vector of length zero or one locating the file run by Rscript.
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames() reads the call frames. vapply applies a function to each frame, requiring one character string per result. When source() runs a script, ofile records its path; frames without a path return an empty string.
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if selects the source path: use the last non-empty ofile when called through source(); otherwise remove the --file= prefix. Code pasted into the R console at the project root defaults to this lesson’s script path. The output is one path string; [] indexing starts at 1.
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("en", "R", "ch08.R")
# length checks that the path has one element. 1L is integer 1, and !is.na excludes missing values. stopifnot requires every condition to be TRUE and stops otherwise.
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname extracts the script directory. file.path joins the path two levels up to the project root; normalizePath requires that directory to exist. The result is independent of the current working directory.
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source reads and executes the shared R definitions for reading the CSV, mathematical functions and manual model fitting. Only base R is used; no TMLE package is required.
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# Read the original CSV, calculate empirical probabilities for the eight (x,a,y) cells and return the resulting data and model in a list. Later calculations use these same patient records.
data <- rhc_data()
# Manually try three epsilon scalars in sequence. The for loop only evaluates the score; it does not solve for a root.
for (epsilon in c(0, 0.1, 0.2)) {
# Calculate one empirical score for each trial coefficient using the fixed initial offset and H.
  cat("trial epsilon =", epsilon, "; score =", fluctuation_score(data, epsilon)$score, "\n")
# End the manual trial loop; the original data and fitted models remain fixed.
}
# Set the lower endpoint of the root bracket for the sex-stratified calculation.
lo <- -1
# Set the upper endpoint of the root bracket for the sex-stratified calculation.
hi <- 1
# Set the tolerance for the score’s absolute value. Approximate zero remains distinct from exact zero.
tolerance <- 1e-12
# Check that the non-increasing score brackets a root between the interval endpoints; stop if it does not.
stopifnot(fluctuation_score(data, lo)$score >= 0, fluctuation_score(data, hi)$score <= 0)
# NULL marks a root result that has not yet been calculated. Store the updated object after a successful solve.
targeted <- NULL
# Run at most 200 explicit bisection steps, calculating one interval midpoint each time.
for (iteration in 1:200) {
# The shared pure function returns midpoint, score and the narrower lo/hi bracket.
  step <- bisection_step(data, lo, hi)
# Display the first five bisection steps for checking; all iterations follow the same rule.
  if (iteration <= 5) cat("bisection", iteration, "; epsilon =", step$midpoint, "; score =", step$score, "\n")
# abs takes the score’s absolute value. Enter the success branch only when it meets the specified tolerance.
  if (abs(step$score) <= tolerance) {
# Update the four Q values using the solved midpoint, standardise using empirical X proportions, and calculate the complete empirical EIF and SE.
    targeted <- case_at(data, step$midpoint)
# break exits the innermost for loop, retaining the successful targeted object.
    break
# End the convergence-check branch.
  }
# Stop when floating-point precision makes the midpoint equal an endpoint, so the interval cannot be narrowed further.
  stopifnot(step$midpoint != lo, step$midpoint != hi)
# Replace the lower bound with the new bound selected by the sign of the score.
  lo <- step$lo
# Replace the upper bound with the new bound selected by the sign of the score.
  hi <- step$hi
# End the bisection loop. targeted remains NULL if convergence has not been reached.
}
# Report failure explicitly if the iteration limit is reached without a result meeting tolerance.
if (is.null(targeted)) stop("Eight-cell bisection did not converge")
# Display the four updated Q values and score contributions. Standardise both arms using the original empirical X weights.
print(targeted$groups)
# Display the sex-stratified TMLE risk difference, empirical EIF mean within tolerance, and SE. Adjustment here uses sex only.
cat("eight-cell epsilon =", targeted$epsilon, "; estimate =", targeted$estimate, "; EIF mean =", targeted$eif_mean, "; SE =", targeted$se, "\n")
# Reread the same 5,735 original patient records. Expanding the adjustment set does not change the cohort.
rows <- read_rhc_rows(DEFAULT_SOURCE)
# Construct the baseline design in a fixed column order: n×17 for g and n×18 for Q. Age scaling uses denominator n, white is the race reference, and there is no regularisation or implicit truncation.
fit <- prepare_full(rows)
# epsilon=0 retains the initial prediction and returns the initial standardised risk difference, AIPW and empirical score.
initial <- full_at(fit, 0)
# Display the design columns and age-standardisation parameters so readers can check the fixed adjustment set.
cat("baseline columns =", fit$feature_names, "; age mean =", fit$age_mean, "; age SD =", fit$age_sd, "\n")
# range displays the minimum and maximum across all n fitted g values. Keep the initial plug-in estimate, AIPW and score distinct.
cat("g range =", range(fit$g), "; initial =", initial$estimate, "; AIPW =", initial$aipw, "; score =", initial$score, "\n")
# Manually try three update coefficients with the full baseline model, then find the root by bisection.
for (epsilon in c(0, 0.002, 0.004)) {
# For each patient, calculate the update using fixed offset plus epsilon×H, then calculate the score and mean log likelihood.
  trial <- full_at(fit, epsilon)
# Display the mean score and mean log likelihood over all 5,735 patients; the denominator is the full cohort size.
  cat("full trial epsilon =", epsilon, "; score =", trial$score, "; log likelihood =", trial$log_likelihood, "\n")
# End the manual trials for the full baseline model.
}
# Set the lower bisection bound for the full baseline model’s score.
lo <- -0.25
# Set the upper bisection bound for the full baseline model’s score.
hi <- 0.25
# Check that the non-increasing score for the full baseline model brackets a root. Stop explicitly if this fails.
stopifnot(full_at(fit, lo)$score >= 0, full_at(fit, hi)$score <= 0)
# Use NULL to mark that no result for the full baseline model has yet met tolerance.
full_targeted <- NULL
# Start up to 200 explicit bisection steps for the full baseline model.
for (iteration in 1:200) {
# Evaluate the midpoint score and narrow the bracket using the same fit, keeping all initial Q and g values fixed.
  step <- full_bisection_step(fit, lo, hi)
# Display the midpoint and score for the first five patient-level bisection steps so readers can check them manually.
  if (iteration <= 5) cat("full bisection", iteration, "; epsilon =", step$midpoint, "; score =", step$score, "\n")
# Check the full n-patient score against the same prespecified tolerance, 1e−12.
  if (abs(step$score) <= tolerance) {
# Name the result targeted only after solving for the root. Both arms use the same epsilon and are standardised over the same n patients.
    full_targeted <- full_at(fit, step$midpoint)
# Exit the bisection loop for the full baseline model.
    break
# End the convergence branch for the full baseline model.
  }
# Stop immediately when floating-point precision prevents further narrowing, avoiding false convergence.
  stopifnot(step$midpoint != lo, step$midpoint != hi)
# Keep the new lower bound of the bracket containing the root.
  lo <- step$lo
# Keep the new upper bound of the bracket containing the root.
  hi <- step$hi
# End the full baseline model’s bisection loop.
}
# Report an error when iterations are exhausted; success is defined by the score tolerance.
if (is.null(full_targeted)) stop("Full baseline bisection did not converge")
# Display the solved coefficient, each arm’s mean risk over all n patients, and the standardised risk difference.
cat("full epsilon =", full_targeted$epsilon, "; risk0 =", full_targeted$risk0, "; risk1 =", full_targeted$risk1, "; TMLE =", full_targeted$estimate, "\n")
# Display the likelihood score, full EIF mean and empirical SE separately. See this chapter’s technical notes for finite-sample and inference conditions.
cat("full score =", full_targeted$score, "; EIF mean =", full_targeted$eif_mean, "; empirical SE =", full_targeted$se, "\n")
# The full baseline still omits acute illness severity; data do not establish sufficient confounding control or the selection assumptions.
