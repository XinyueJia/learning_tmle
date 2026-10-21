# Chapter 3: empirical objects for three mechanisms
# Input: frozen original public RHC CSV; output: chapter objects and terminal checks; base R only.
# commandArgs(FALSE) reads the startup arguments. grep matches the start of a string using ^, and value=TRUE retains the matched strings. The result is a character vector of length zero or one locating the file run by Rscript.
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames() reads the call frames. vapply applies a function to each frame, requiring one character string per result. When source() runs a script, ofile records its path; frames without a path return an empty string.
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if selects the source path: use the last non-empty ofile when called through source(); otherwise remove the --file= prefix. Code pasted into the R console at the project root defaults to this lesson’s script path. The output is one path string; [] indexing starts at 1.
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("en", "R", "ch03.R")
# length checks that the path has one element. 1L is integer 1, and !is.na excludes missing values. stopifnot requires every condition to be TRUE and stops otherwise.
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname extracts the script directory. file.path joins the path two levels up to the project root; normalizePath requires that directory to exist. The result is independent of the current working directory.
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source reads and executes the shared R definitions for reading the CSV, mathematical functions and manual model fitting. Only base R is used; no TMLE package is required.
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# Read the original CSV, calculate empirical probabilities for the eight (x,a,y) cells and return the resulting data and model in a list. Later calculations use these same patient records.
data <- rhc_data()
# Display a multi-column table with four rows, one per (x,a) group. n, events, q_observed and initial_q are aggregated from the original CSV.
print(data$groups)
# Extract the two-element vector of empirical X probabilities, ordered as x=0 then x=1.
px <- data$empirical_model$px
# Extract the two-element vector of conditional RHC probabilities. Entry x+1 corresponds to baseline stratum x.
g <- data$empirical_model$g
# Extract the 2×2 conditional death risk matrix: row a+1, column x+1; q[1,2] is a=0, x=1.
q <- data$empirical_model$q
# Display empirical population proportions, treatment probabilities, and the standardised risk difference from the initial Q fitted using A alone.
cat("px =", px, "; g =", g, "; initial risk difference =", data$initial_estimate, "\n")
# print preserves the 2×2 risk matrix’s rows and columns. Matrix rows represent treatment arms, rather than patients.
print(q)
# Standardisation uses sex alone; sufficient confounding control is unproven, so results are not identified clinical causal effects.
