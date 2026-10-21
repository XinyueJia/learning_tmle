# Chapter 2: probability directions and mean derivatives
# Input: frozen original public RHC CSV; output: chapter objects and terminal checks; base R only.
# commandArgs(FALSE) reads the startup arguments. grep matches the start of a string using ^, and value=TRUE retains the matched strings. The result is a character vector of length zero or one locating the file run by Rscript.
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames() reads the call frames. vapply applies a function to each frame, requiring one character string per result. When source() runs a script, ofile records its path; frames without a path return an empty string.
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if selects the source path: use the last non-empty ofile when called through source(); otherwise remove the --file= prefix. Code pasted into the R console at the project root defaults to this lesson’s script path. The output is one path string; [] indexing starts at 1.
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("en", "R", "ch02.R")
# length checks that the path has one element. 1L is integer 1, and !is.na excludes missing values. stopifnot requires every condition to be TRUE and stops otherwise.
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname extracts the script directory. file.path joins the path two levels up to the project root; normalizePath requires that directory to exist. The result is independent of the current working directory.
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source reads and executes the shared R definitions for reading the CSV, mathematical functions and manual model fitting. Only base R is used; no TMLE package is required.
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# Read the original CSV, calculate empirical probabilities for the eight (x,a,y) cells and return the resulting data and model in a list. Later calculations use these same patient records.
data <- rhc_data()
# The fourth cell is (x,a,y)=(0,1,1); R uses one-based indexing. Return a list containing h, score, derivative and pairing.
direction <- point_direction(data, 4L)
# Two successive $ operators select the cells table from data and then its p column, producing an eight-element probability vector.
p <- data$cells$p
# Set the dimensionless path step size t to one numeric scalar.
t <- 0.01
# Calculate eight new probabilities in the same cell order; the shared function rejects invalid probabilities.
pt <- linear_path(p, direction$score, t)
# Multiply each new cell probability by the corresponding outcome, then sum the eight products to obtain the new outcome mean.
new_mean <- sum(pt * data$cells$y)
# Display the original mean, new mean and difference quotient. Here t is non-zero, so division by t is defined.
cat("risk =", data$marginal_risk, "; new risk =", new_mean, "; rate =", (new_mean - data$marginal_risk) / t, "\n")
# Display the direct derivative and the pairing of the influence function with the score. The two values should agree.
cat("derivative =", direction$derivative, "; IF-score pairing =", direction$pairing, "\n")
# [c(...)] selects three columns. data.frame joins h and score for the same cells; print displays eight rows, preserving the original data.
print(data.frame(data$cells[c("x", "a", "y")], h = direction$h, score = direction$score))
