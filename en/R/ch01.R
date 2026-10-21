# Chapter 1: continuous introductory R workbook on means, paths and influence values
# Input: frozen original public RHC CSV; output: chapter objects and terminal checks; base R only.
# commandArgs(FALSE) reads the startup arguments. grep matches the start of a string using ^, and value=TRUE retains the matched strings. The result is a character vector of length zero or one locating the file run by Rscript.
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames() reads the call frames. vapply applies a function to each frame, requiring one character string per result. When source() runs a script, ofile records its path; frames without a path return an empty string.
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if selects the source path: use the last non-empty ofile when called through source(); otherwise remove the --file= prefix. Code pasted into the R console at the project root defaults to this lesson’s script path. The output is one path string; [] indexing starts at 1.
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("en", "R", "ch01.R")
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
# sum adds the n binary indicators, returning the death-count scalar 1918. <- assigns the result on the right to the name on the left.
events <- sum(y)
# / divides the death count by the cohort size. Dividing these two scalars gives one sample 30-day mortality risk on the probability scale.
risk <- events / n
# c combines 0 and 1 into a two-element numeric vector. These entries are the two possible outcomes, rather than individual patient records.
support_y <- c(0, 1)
# function(v) defines a rule for one outcome category. == compares each patient’s outcome with v; mean treats TRUE as 1 and FALSE as 0. vapply applies this rule to both categories and requires one number per result, giving p length two.
p <- vapply(support_y, function(v) mean(y == v), numeric(1))
# * multiplies each outcome support value by its probability; sum reduces the two products to one mean. The fixed reference is the empirical outcome distribution.
mu <- sum(p * support_y)
# Choose outcome 1 to receive the added probability mass. z is one numeric scalar and must be either 0 or 1.
z <- 1
# Set the dimensionless replacement proportion to 0.1. With t between 0 and 1, the calculation changes probability weights rather than patients’ recorded y values.
t <- 0.1
# %in% checks membership in the allowed outcome categories. is.finite excludes NA and infinity; stopifnot checks that the path step is valid.
stopifnot(z %in% support_y, is.finite(t), t >= 0, t <= 1)
# == compares both categories with the selected outcome; as.numeric converts FALSE/TRUE to 0/1, giving a two-element point-mass probability vector.
point <- as.numeric(support_y == z)
# Evaluate the parentheses first. A scalar scales the vector element by element; adding the two components gives a new two-element probability vector.
p_t <- (1 - t) * p + t * point
# Multiply the unchanged outcome support by the new probabilities, then sum the two products to obtain the new mean mu_t.
mu_t <- sum(p_t * support_y)
# Subtract the original mean mu from the new mean mu_t. The result delta is one probability difference.
delta <- mu_t - mu
# Subtract the fixed original mean from the selected outcome to obtain the path derivative for this chapter’s mean target.
derivative <- z - mu
# if selects only one branch. At t=0, return NA_real_ instead of computing 0/0; otherwise return the rate of change.
rate <- if (t == 0) NA_real_ else delta / t
# Multiplication precedes addition when computing the new mean. For the mean target, this is an exact linear identity.
linear_mean <- mu + t * derivative
# Subtract the fixed scalar mu from each of the two possible outcomes. The two-element result tabulates D(y)=y−mu under the fixed reference distribution P.
support_D <- support_y - mu
# Apply the same subtraction to all n observed outcomes, returning a numeric vector of patient influence values. Its length is n and its dim is NULL.
influence <- y - risk
# sum adds all n entries; division by n gives one mean. Small floating-point rounding errors are allowed.
mean_influence <- sum(influence) / n
# Weight the two tabulated influence values by their original outcome probabilities and sum. This gives the same mean as averaging the n patient influence values.
grouped_mean_D <- sum(p * support_D)
# Fix the old D and just replace the distribution weights; this time the average is usually non-zero.
old_mean_D <- sum(p_t * support_D)
# Subtract the new mean mu_t from both possible outcomes to tabulate a different influence function in a two-element vector.
new_support_D <- support_y - mu_t
# The new function’s weighted mean under the new distribution is again zero. This differs from the previous line, which uses the old function.
new_mean_D <- sum(p_t * new_support_D)
# Subtract each death indicator from 1 to obtain n survival indicators in the same patient order.
alive <- 1 - y
# Sum the survival indicators and divide by the full cohort size to obtain one 30-day survival probability.
survival <- sum(alive) / n
# Subtract the survival mean from each patient’s survival indicator, giving n values. These are the negatives of the corresponding mortality-mean influence values.
survival_influence <- alive - survival
# Reread the original CSV and summarise it by (x,a,y) cell and (a,x) stratum. Return a list describing the fixed empirical reference distribution.
data <- rhc_data(DEFAULT_SOURCE)
# mean_if uses empirical cell probabilities to calculate the outcome mean and the mean influence value. Return both quantities in a list for comparison with the patient-level calculation.
check <- mean_if(data)
# Check the official cohort and event counts and independent exact-fraction benchmarks for the weighted means of the two outcome categories.
stopifnot(n == 5735L, events == 1918, abs(mu - 1918 / 5735) < 1e-14)
# Check the n patient influence values, two outcome-category probabilities and valid probability sum. Patient rows and outcome support points are different alignments.
stopifnot(length(influence) == n, length(p_t) == 2L, abs(sum(p_t) - 1) < 1e-14, all(p_t >= 0))
# || is short-circuit OR: when t=0 yields NA, skip the undefined rate-of-change check; otherwise check exact linearity and the rate of change.
stopifnot(abs(mu_t - linear_mean) < 1e-14, is.na(rate) || abs(rate - derivative) < 1e-12)
# Require all three correctly centred means to be zero within numerical tolerance. Positive and negative influence values may cancel; individual values need not be zero.
stopifnot(abs(mean_influence) < 1e-12, abs(grouped_mean_D) < 1e-12, abs(new_mean_D) < 1e-12)
# Check that averaging the old function under new weights equals the mean change; that survival IF values are the negatives of mortality IF values; and that grouped and patient-level risks agree.
stopifnot(abs(old_mean_D - delta) < 1e-14, all(abs(survival_influence + influence) < 1e-14), abs(check$risk - risk) < 1e-14)
# cat displays existing objects in order. Semicolons in text separate displayed values; \n starts a new line. No new statistic is calculated.
cat("n =", n, "; events =", events, "; risk =", risk, "; mu_t =", mu_t, "\n")
# Display three distinct quantities separately: the patient-level mean, the old function averaged under new weights, and the new function averaged under new weights.
cat("mean_influence =", mean_influence, "; old_mean_D =", old_mean_D, "; new_mean_D =", new_mean_D, "\n")
# This chapter describes the mean in the same public cohort, without estimating an RHC treatment effect; unknown true P0 differs from empirical Pn.
