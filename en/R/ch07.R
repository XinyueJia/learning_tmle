# Chapter 7: empirical IF variance and SE
# Input: frozen original public RHC CSV; output: chapter objects and terminal checks; base R only.
# commandArgs(FALSE) reads the startup arguments. grep matches the start of a string using ^, and value=TRUE retains the matched strings. The result is a character vector of length zero or one locating the file run by Rscript.
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames() reads the call frames. vapply applies a function to each frame, requiring one character string per result. When source() runs a script, ofile records its path; frames without a path return an empty string.
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if selects the source path: use the last non-empty ofile when called through source(); otherwise remove the --file= prefix. Code pasted into the R console at the project root defaults to this lesson’s script path. The output is one path string; [] indexing starts at 1.
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("en", "R", "ch07.R")
# length checks that the path has one element. 1L is integer 1, and !is.na excludes missing values. stopifnot requires every condition to be TRUE and stops otherwise.
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname extracts the script directory. file.path joins the path two levels up to the project root; normalizePath requires that directory to exist. The result is independent of the current working directory.
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source reads and executes the shared R definitions for reading the CSV, mathematical functions and manual model fitting. Only base R is used; no TMLE package is required.
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# Read the original CSV, calculate empirical probabilities for the eight (x,a,y) cells and return the resulting data and model in a list. Later calculations use these same patient records.
data <- rhc_data()
# Evaluate the EIF under the initial fitted Q and g at eight observed combinations, returning an eight-element vector.
initial_values <- eif_values(data$initial_fit, data$cells)
# Calculate the mean, second moment, centred variance and SE using the current cell probabilities; return a list.
initial_moments <- if_variance(data, initial_values)
# Evaluate eight EIF values under the saturated model of the full empirical distribution, distinct from the initial Q fitted using A alone.
saturated_values <- eif_values(data$empirical_model, data$cells)
# Use the same probability weights to obtain a second list of empirical moments.
saturated_moments <- if_variance(data, saturated_values)
# Display both sets of empirical means, second moments, variances and SEs by name. These are not known efficiency bounds at P0.
print(list(initial = initial_moments, saturated = saturated_moments))
# Multiply each standard error by 100 to convert a probability difference to percentage points. A variance would instead be multiplied by 10,000 to express it in squared percentage points.
cat("initial SE in percentage points =", 100 * initial_moments$se, "; saturated =", 100 * saturated_moments$se, "\n")
# These quantities are not the actual estimation error in one sample; recompute SE after updating Q in Chapter 8.
