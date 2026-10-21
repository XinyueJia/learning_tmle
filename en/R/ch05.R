# Chapter 5: checks in multiple directions
# Input: frozen original public RHC CSV; output: chapter objects and terminal checks; base R only.
# commandArgs(FALSE) reads the startup arguments. grep matches the start of a string using ^, and value=TRUE retains the matched strings. The result is a character vector of length zero or one locating the file run by Rscript.
script_argument <- grep("^--file=", commandArgs(FALSE), value = TRUE)
# sys.frames() reads the call frames. vapply applies a function to each frame, requiring one character string per result. When source() runs a script, ofile records its path; frames without a path return an empty string.
source_files <- vapply(sys.frames(), function(frame) if (is.null(frame$ofile)) "" else frame$ofile, character(1))
# if selects the source path: use the last non-empty ofile when called through source(); otherwise remove the --file= prefix. Code pasted into the R console at the project root defaults to this lesson’s script path. The output is one path string; [] indexing starts at 1.
script_path <- if (any(nzchar(source_files))) tail(source_files[nzchar(source_files)], 1) else if (length(script_argument)) sub("^--file=", "", script_argument[1]) else file.path("en", "R", "ch05.R")
# length checks that the path has one element. 1L is integer 1, and !is.na excludes missing values. stopifnot requires every condition to be TRUE and stops otherwise.
stopifnot(length(script_path) == 1L, !is.na(script_path))
# dirname extracts the script directory. file.path joins the path two levels up to the project root; normalizePath requires that directory to exist. The result is independent of the current working directory.
project_root <- normalizePath(file.path(dirname(script_path), "..", ".."), mustWork = TRUE)
# source reads and executes the shared R definitions for reading the CSV, mathematical functions and manual model fitting. Only base R is used; no TMLE package is required.
source(file.path(project_root, "shared", "R", "RHCCase.R"))
# Read the original CSV, calculate empirical probabilities for the eight (x,a,y) cells and return the resulting data and model in a list. Later calculations use these same patient records.
data <- rhc_data()
# Use a list representing the saturated model of the full empirical distribution as the mathematical reference point for checking gradients.
model <- data$empirical_model
# Extract the eight-cell table in x, a, y order, keeping subsequent vectors aligned.
cells <- data$cells
# A two-column index matrix selects individual entries from the R matrix. The first cbind column gives row a+1 and the second gives column x+1, producing eight values.
q_at_cell <- model$q[cbind(cells$a + 1L, cells$x + 1L)]
# Add the three centred mechanism directions element by element to obtain eight mixed-score values. Index g using x+1.
score <- (cells$x - model$px[2]) + (cells$a - model$g[cells$x + 1L]) + (cells$y - q_at_cell)
# Calculate a central difference quotient and gradient pairing along a valid probability path; return a list.
check <- direction_check(data, score)
# Keep only the centred residual of the outcome mechanism, producing eight values; hold the other two mechanisms fixed.
outcome_score <- cells$y - q_at_cell
# Check the pure outcome direction at the same empirical reference point.
outcome_check <- direction_check(data, outcome_score)
# Reuse Chapter 2’s point direction at (0,1,1), returning a list with the score and mean derivative.
point <- point_direction(data, 4L)
# Pair the same score with the derivative of the sex-standardised risk difference. This target differs from the mean.
point_check <- direction_check(data, point$score)
# Store the three checks by name in a list and print them separately, keeping derivatives of different targets distinct.
print(list(mixed = check, outcome = outcome_check, point = point_check))
# Read the eight empirical cell probabilities as elementwise divisors when converting h to a score.
p <- cells$p
# The for loop assigns j the values 1 to 7. The opening brace begins the loop body, constructing seven independent probability-mass transfer directions.
for (j in 1:7) {
# numeric(8) creates a numeric vector of eight zeros, newly created on each iteration.
  h <- numeric(8) 
# Using one-based [] indexing, set the mass increment in cell j to 1.
  h[j] <- 1
# Set the eighth increment to −1 to offset +1 in cell j, ensuring that h sums to 0.
  h[8] <- -1
# Elementwise / converts the mass direction h into a score. The shared function uses a fixed central-difference step on paths with strictly positive probabilities.
  contrast_check <- direction_check(data, h / p)
# Display the direct difference quotient and gradient pairing for this independent direction.
  cat("direction", j, "; finite difference =", contrast_check$finite_difference, "; pairing =", contrast_check$pairing, "\n")
# End the loop. These seven numerical checks help detect errors; the result for all directions still relies on the proof in the text.
}
