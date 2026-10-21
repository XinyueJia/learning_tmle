# Chapter 4: cell-by-cell EIF components
# Input: frozen original public RHC CSV; output: chapter objects and terminal checks; base R only.
# commandArgs(FALSE) reads the startup arguments. grep matches the start of a string using ^, and value=TRUE retains the matched strings. The result is a character vector of length zero or one locating the file run by Rscript.
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames() reads the call frames. vapply applies a function to each frame, requiring one character string per result. When source() runs a script, ofile records its path; frames without a path return an empty string.
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if selects the source path: use the last non-empty ofile when called through source(); otherwise remove the --file= prefix. Code pasted into the R console at the project root defaults to this lesson’s script path. The output is one path string; [] indexing starts at 1.
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("en", "R", "ch04.R")
# length checks that the path has one element. 1L is integer 1, and !is.na excludes missing values. stopifnot requires every condition to be TRUE and stops otherwise.
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname extracts the script directory. file.path joins the path two levels up to the project root; normalizePath requires that directory to exist. The result is independent of the current working directory.
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source reads and executes the shared R definitions for reading the CSV, mathematical functions and manual model fitting. Only base R is used; no TMLE package is required.
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# Read the original CSV, calculate empirical probabilities for the eight (x,a,y) cells and return the resulting data and model in a list. Later calculations use these same patient records.
data <- rhc_data()
# Evaluate the fitted EIF at all eight observed combinations using the initial Q and g, producing eight values. Q is not updated here.
initial_d <- eif_values(data$initial_fit, data$cells)
# mapply reads a and x together from each group-table row. clever_h returns one weight per row, giving a vector of length four.
h <- mapply(function(a, x) clever_h(data$initial_fit, a, x), data$groups$a, data$groups$x)
# Join the group identifiers and H to display four rows. H may be positive or negative.
print(data.frame(data$groups[c("x", "a")], h = h))
# Multiply each observed combination’s empirical probability by its initial EIF value, then sum to obtain one empirical mean. No correction has yet been applied.
correction <- sum(data$cells$p * initial_d)
# Display the initial standardised risk difference and empirical EIF mean separately. A non-zero mean does not make individual residuals invalid.
cat("initial estimate =", data$initial_estimate, "; empirical EIF mean =", correction, "\n")
# Adjustment here uses sex alone; Chapter 8 constructs the AIPW correction and Q update.
