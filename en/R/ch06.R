# Chapter 6: projection in the known-g exercise
# Input: frozen original public RHC CSV; output: chapter objects and terminal checks; base R only.
# commandArgs(FALSE) reads the startup arguments. grep matches the start of a string using ^, and value=TRUE retains the matched strings. The result is a character vector of length zero or one locating the file run by Rscript.
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames() reads the call frames. vapply applies a function to each frame, requiring one character string per result. When source() runs a script, ofile records its path; frames without a path return an empty string.
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if selects the source path: use the last non-empty ofile when called through source(); otherwise remove the --file= prefix. Code pasted into the R console at the project root defaults to this lesson’s script path. The output is one path string; [] indexing starts at 1.
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("en", "R", "ch06.R")
# length checks that the path has one element. 1L is integer 1, and !is.na excludes missing values. stopifnot requires every condition to be TRUE and stops otherwise.
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname extracts the script directory. file.path joins the path two levels up to the project root; normalizePath requires that directory to exist. The result is independent of the current working directory.
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source reads and executes the shared R definitions for reading the CSV, mathematical functions and manual model fitting. Only base R is used; no TMLE package is required.
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# Read the original CSV, calculate empirical probabilities for the eight (x,a,y) cells and return the resulting data and model in a list. Later calculations use these same patient records.
data <- rhc_data()
# In this exercise, keep empirical g fixed and let b specify coefficients of candidate additional components. Perform the weighted linear-algebra projection manually and return a list.
demo <- projection_demo(data, b = 1)
# Display three weighted squared norms to check the Pythagorean decomposition. Each scalar has units of squared probability differences.
cat("candidate norm squared =", demo$candidate_second_moment, "; projection =", demo$projection_second_moment, "; residual =", demo$residual_second_moment, "\n")
# Subtract the two eight-element vectors, take absolute values with abs, then use max to reduce them to one maximum error.
projection_error <- max(abs(demo$projection - demo$canonical))
# Display the maximum numerical difference between the projection and the canonical gradient in this model with fixed g.
cat("maximum projection error =", projection_error, "\n")
# This exercise’s five-dimensional known-g model differs from the seven-dimensional observational model with unknown g; the final TMLE still learns g from data.
