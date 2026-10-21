# Run: Rscript --vanilla tests/R/kernel-tests.R
# Independent source counts, finite-distribution identities and actual fits.
script_argument <- grep("^--file=", commandArgs(), value = TRUE)
if (!length(script_argument)) stop("Run this test with Rscript")
test_file <- normalizePath(sub("^--file=", "", script_argument[1]),
                           mustWork = TRUE)
root <- normalizePath(file.path(dirname(test_file), "..", ".."))
source(file.path(root, "shared", "R", "RHCCase.R"))

assert_close <- function(actual, expected, tolerance = 1e-10) {
  stopifnot(is.numeric(actual), is.numeric(expected),
            length(actual) == length(expected), all(is.finite(actual)),
            all(is.finite(expected)), all(abs(actual - expected) <= tolerance))
}
assert_error <- function(expression) {
  failed <- tryCatch({ force(expression); FALSE }, error = function(e) TRUE)
  if (!failed) stop("Expected an error: ", deparse(substitute(expression)))
}

# Use base R's separate CSV parser for independent row/count verification.
raw_independent <- read.csv(DEFAULT_SOURCE, colClasses = "character",
  check.names = FALSE, na.strings = NULL, strip.white = FALSE)
rows <- read_rhc_rows()
stopifnot(identical(rows, raw_independent), nrow(rows) == 5735,
          ncol(rows) == 63, rows$ptid[1] == "00005",
          rows$age[1] == " 70.25098")
independent_counts <- as.vector(table(factor(raw_independent$dth30,
  levels = c("No", "Yes")), factor(raw_independent$swang1,
  levels = c("No RHC", "RHC")), factor(raw_independent$sex,
  levels = c("Female", "Male"))))
counts <- rhc_counts(rows)
assert_close(counts$n, independent_counts, 0)
assert_close(counts$n, c(1143, 494, 558, 348, 1320, 594, 796, 482), 0)
stopifnot(sum(rows$dth30 == "Yes") == 1918,
          sum(rows$swang1 == "RHC") == 2184,
          sum(rows$sex == "Male") == 3192,
          identical(rhc_counts(rows[nrow(rows):1, ]), counts),
          identical(dim(rhc_observations(rows)), c(5735L, 3L)))
data <- case_data(counts)
assert_close(data$groups$n, c(1637, 906, 1914, 1278), 0)
assert_close(data$groups$events, c(494, 348, 594, 482), 0)
assert_close(mean_if(data)$risk, 1918 / 5735)
assert_close(mean_if(data)$mean, 0)
stopifnot(!any(c("h", "offset") %in% names(data$groups)))

# CSV failure cases preserve records, including multiline fields and BOM.
stopifnot(identical(csv_records('\ufeffa,b\r\n"x,y","line1\nline2"\r\n'),
  list(c("a", "b"), c("x,y", "line1\nline2"))),
  identical(csv_records('a,b\n"a""b",\n'),
    list(c("a", "b"), c('a"b', ""))))
for (bad in c('a\n"unfinished', 'a\n"closed"trailing', 'a\nb"c')) {
  assert_error(csv_records(bad))
}
bad_rows <- rows
bad_rows$sex[1] <- "unknown"; assert_error(rhc_observations(bad_rows))
assert_error(rhc_observations(rows[FALSE, ]))
temporary <- tempfile(fileext = ".csv")
write_rhc_counts(temporary, rows)
assert_close(read_counts(temporary)$n, counts$n, 0)
writeLines(c("sex,swang1,dth30", "Male,RHC,No"), temporary)
assert_error(read_rhc_rows(temporary))
writeLines(c("x,a,y,n", paste0("id", 1:8, ",", counts$x, ",",
  counts$a, ",", counts$y, ",", counts$n)), temporary)
assert_error(read_counts(temporary))
duplicate_source <- paste0(readChar(DEFAULT_SOURCE,
  file.info(DEFAULT_SOURCE)$size, useBytes = TRUE),
  readLines(DEFAULT_SOURCE, n = 2L)[2], "\n")
writeChar(duplicate_source, temporary, eos = NULL)
assert_error(read_rhc_rows(temporary))
unlink(temporary)

# Frozen mathematical fixture, separate from the clinical source.
synthetic <- case_data(file.path(root, "shared", "data", "rws-counts.csv"))
assert_close(synthetic$empirical_model$q,
             matrix(c(.7, .8, .2, .5), 2, 2))
assert_close(synthetic$initial_fit$q, matrix(c(.6, .56, .6, .56), 2, 2))
assert_close(synthetic$initial_estimate, -.04)
assert_close(ate(synthetic$empirical_model), .2)
assert_close(mean_if(synthetic)$risk, .58)
assert_close(if_variance(synthetic, mean_if(synthetic)$values)$variance, .2436)
assert_close(eif_values(synthetic$empirical_model, synthetic$cells),
             c(.775, -.475, -4.1, .9, 1.1, -3.9, -.525, .725))

# Eight point directions and seven spanning contrasts at both distributions.
for (current in list(data, synthetic)) {
  p <- current$cells$p
  values <- eif_values(current$empirical_model, current$cells)
  assert_close(sum(p * values), 0)
  for (index in 1:8) {
    direction <- point_direction(current, index)
    assert_close(sum(direction$h), 0)
    assert_close(sum(p * direction$score), 0)
    assert_close(direction$derivative, direction$pairing)
    assert_close(direction$derivative, mean_if(current)$values[index])
    check <- direction_check(current, direction$score)
    assert_close(check$pairing, values[index])
    assert_close(check$finite_difference, values[index], 2e-8)
    path <- linear_path(p, direction$score, .01)
    assert_close(sum(path * current$cells$y) - mean_if(current)$risk,
                 .01 * direction$derivative)
  }
  for (index in 1:7) {
    h <- as.numeric(seq_len(8L) == index) - as.numeric(seq_len(8L) == 8L)
    check <- direction_check(current, h / p)
    assert_close(check$finite_difference, check$pairing, 2e-8)
  }

  # Pure mechanism paths keep all other mechanisms fixed, cell by cell.
  model <- current$empirical_model; cells <- current$cells
  sx <- cells$x - model$px[2]
  sa <- cells$a - model$g[cells$x + 1]
  sy <- ifelse(cells$x == 0 & cells$a == 1,
                cells$y - model$q[2, 1], 0)
  paths <- lapply(list(sx, sa, sy), function(s) {
    model_from_probabilities(cells, linear_path(p, s, .1))
  })
  assert_close(paths[[1]]$g, model$g)
  assert_close(paths[[1]]$q, model$q)
  assert_close(paths[[2]]$px, model$px)
  assert_close(paths[[2]]$q, model$q)
  assert_close(ate(paths[[2]]), ate(model))
  assert_close(paths[[3]]$px, model$px)
  assert_close(paths[[3]]$g, model$g)
  expected_q <- model$q
  expected_q[2, 1] <- expected_q[2, 1] +
    .1 * expected_q[2, 1] * (1 - expected_q[2, 1])
  assert_close(paths[[3]]$q, expected_q)

  demo <- projection_demo(current, b = 2)
  assert_close(demo$projection, demo$canonical)
  assert_close(demo$candidate_second_moment,
    demo$projection_second_moment + demo$residual_second_moment)
  for (basis in demo$basis) {
    assert_close(weighted_inner(p, demo$residual, basis), 0)
  }
  moments <- if_variance(current)
  assert_close(moments$variance, moments$second_moment)
  assert_close(moments$se, sqrt(moments$variance / current$n))
  shifted <- if_variance(current, values + 2)
  assert_close(shifted$mean, 2)
  assert_close(shifted$variance, moments$variance)
  assert_close(shifted$second_moment, moments$variance + 4)

  initial <- case_at(current)
  targeted <- solve_case(current)
  stopifnot(abs(initial$score) > 1e-6, targeted$converged,
            abs(targeted$score) < 1e-12, abs(targeted$eif_mean) < 1e-12,
            targeted$log_likelihood > initial$log_likelihood,
            all(targeted$updated_fit$q > 0 & targeted$updated_fit$q < 1))
  assert_close(targeted$estimate, ate(model))
  assert_close(targeted$eif_mean, targeted$score)
  for (epsilon in c(-.1, 0, .1)) {
    delta <- 1e-5
    low <- fluctuation_score(current, epsilon - delta)
    at <- fluctuation_score(current, epsilon)
    high <- fluctuation_score(current, epsilon + delta)
    assert_close((high$log_likelihood - low$log_likelihood) / (2 * delta),
                  at$score, 1e-8)
    assert_close((high$score - low$score) / (2 * delta), at$slope, 1e-8)
    stopifnot(at$slope < 0)
  }
}
assert_close(if_variance(synthetic)$variance, 1.0975)
assert_close(case_at(synthetic)$score, .24)
assert_close(case_at(synthetic)$eif_variance, 1.5824)
assert_close(solve_case(synthetic)$epsilon, .16223923963495762)
assert_close(solve_case(synthetic)$se, .07807888305377421)

# Population DR is a weighted expectation identity, not an inference claim.
truth <- synthetic$empirical_model
population_aipw <- function(nuisance) {
  ate(nuisance) + sum(synthetic$cells$p *
    eif_values(nuisance, synthetic$cells))
}
wrong_q <- truth; wrong_q$q <- matrix(c(.4, .6, .55, .7), 2, 2)
wrong_g <- truth; wrong_g$g <- c(.35, .6)
both_wrong <- wrong_q; both_wrong$g <- wrong_g$g
assert_close(population_aipw(wrong_q), ate(truth))
assert_close(population_aipw(wrong_g), ate(truth))
remainder <- sum(truth$px * (both_wrong$g - truth$g) *
  ((both_wrong$q[2, ] - truth$q[2, ]) / both_wrong$g +
   (both_wrong$q[1, ] - truth$q[1, ]) / (1 - both_wrong$g)))
assert_close(population_aipw(both_wrong) - ate(truth), remainder)
stopifnot(abs(remainder) > 1e-3)

# Real full analysis: declared matrix, original outcomes and score equations.
fit <- prepare_full(rows)
stopifnot(fit$n == 5735, identical(dim(fit$design), c(5735L, 17L)),
          identical(fit$feature_names, c("intercept", "male", "age_z",
            "race_black", "race_other", "cardiohx", "chfhx", "dementhx",
            "psychhx", "chrpulhx", "renalhx", "liverhx", "gibledhx",
            "malighx", "immunhx", "transhx", "amihx")),
          identical(fit$q_feature_names, c(fit$feature_names, "A")))
assert_close(fit$age_mean, 61.37588299738448)
assert_close(fit$age_sd, 16.68047483037684)
assert_close(mean(fit$design[, 3]), 0)
assert_close(mean(fit$design[, 3]^2), 1)
stopifnot(fit$g_fit$converged, fit$q_fit$converged,
          fit$g_fit$score_maximum < 1e-10,
          fit$q_fit$score_maximum < 1e-10,
          all(c(fit$g, fit$q0, fit$q1) > 0),
          all(c(fit$g, fit$q0, fit$q1) < 1))
assert_close(drop(crossprod(fit$design, fit$a - fit$g)) / fit$n,
             numeric(17), 1e-10)
q_observed <- fit$a * fit$q1 + (1 - fit$a) * fit$q0
assert_close(drop(crossprod(cbind(fit$design, fit$a), fit$y - q_observed)) /
               fit$n, numeric(18), 1e-10)
assert_close(range(fit$g), c(.07869797540624915, .6819050426722195))
initial <- full_at(fit)
targeted <- solve_full(fit)
assert_close(initial$estimate, .0864988559023306)
assert_close(initial$aipw, .08996799520909834)
assert_close(targeted$epsilon, .003576966662876657)
assert_close(targeted$risk0, .30058304496920574)
assert_close(targeted$risk1, .39056276970451026)
assert_close(targeted$estimate, .08997972473530443)
assert_close(targeted$se, .013082375165239404)
stopifnot(targeted$converged, abs(initial$score) > .003,
          abs(targeted$score) < 1e-12, abs(targeted$eif_mean) < 1e-12,
          targeted$log_likelihood > initial$log_likelihood,
          all(c(targeted$q0, targeted$q1) > 0),
          all(c(targeted$q0, targeted$q1) < 1))
assert_close(targeted$estimate, mean(targeted$q1 - targeted$q0))
assert_close(targeted$score, targeted$eif_mean)
for (epsilon in c(-.01, 0, .003, .01)) {
  delta <- 1e-5
  low <- full_at(fit, epsilon - delta)
  at <- full_at(fit, epsilon)
  high <- full_at(fit, epsilon + delta)
  assert_close((high$log_likelihood - low$log_likelihood) / (2 * delta),
               at$score, 1e-8)
  assert_close((high$score - low$score) / (2 * delta), at$slope, 1e-8)
  stopifnot(at$slope < 0)
}
changed <- rows; changed$dth30[1] <- "Yes"
stopifnot(abs(solve_full(prepare_full(changed))$estimate - targeted$estimate) > 1e-6)

# Invalid inputs and numerical failures are explicit, with no row/column loss.
for (bad in c(0, -1, 1.2, NaN, Inf)) {
  malformed <- counts; malformed$n <- as.numeric(malformed$n)
  malformed$n[1] <- bad; assert_error(case_data(malformed))
}
malformed <- counts; malformed$n <- rep(TRUE, 8); assert_error(case_data(malformed))
malformed <- counts; malformed$n[1] <- 0; assert_error(case_data(malformed))
malformed <- counts; malformed$x[1] <- 2; assert_error(case_data(malformed))
assert_error(case_data(counts[1:7, ]))
assert_error(case_data(counts[c(1:7, 1), ]))
assert_error(point_direction(data, 0))
assert_error(linear_path(data$cells$p, rep(1, 8), .01))
assert_error(linear_path(data$cells$p, point_direction(data, 4)$score, 2))
assert_error(weighted_inner(data$cells$p, numeric(7), numeric(8)))
assert_error(weighted_inner(data$cells$p, rep(1e300, 8), rep(1e300, 8)))
assert_error(if_variance(data, rep(1e300, 8)))
assert_error(weighted_projection(data$cells$p, numeric(8),
                                 list(rep(1, 8), rep(1, 8))))
assert_error(solve_case(synthetic, lo = .3, hi = .4))
assert_error(solve_case(synthetic, lo = 1, hi = -1))
assert_error(solve_case(synthetic, score_tol = 0))
assert_error(solve_case(synthetic, maxiter = 0))
assert_error(case_at(data, NaN)); assert_error(case_at(data, 1000))
assert_error(fluctuation_score(data, 1e308))
failed <- solve_case(synthetic, maxiter = 1)
stopifnot(!failed$converged, failed$reason == "maximum_iterations")
for (field in c("age", "race", "chfhx")) {
  changed <- rows; changed[[field]][1] <- "NA"
  assert_error(prepare_full(changed))
}
assert_error(fit_logistic(matrix(1, 10, 2), rep(0:1, 5)))
assert_error(fit_logistic(matrix(1, 10, 1), rep(1, 10)))
assert_error(fit_logistic(fit$design, fit$a, maxiter = 1))
assert_error(full_at(fit, NaN)); assert_error(full_at(fit, 1000))
assert_error(solve_full(fit, lo = .1, hi = .2))
assert_error(solve_full(fit, lo = 1, hi = -1))
assert_error(solve_full(fit, maxiter = 1))
for (field in c("a", "y", "g", "q0", "q1", "h")) {
  invalid_fit <- fit; invalid_fit[[field]] <- invalid_fit[[field]][1]
  assert_error(full_at(invalid_fit))
}
invalid_fit <- fit; invalid_fit$g[1] <- 0; assert_error(full_at(invalid_fit))

# Sourcing from another directory/environment must not rely on the current wd.
old_wd <- getwd()
setwd(tempdir())
isolated <- new.env(parent = baseenv())
sys.source(file.path(root, "shared", "R", "RHCCase.R"), envir = isolated)
assert_close(isolated$case_data(counts)$marginal_risk, 1918 / 5735)
stopifnot(file.exists(isolated$DEFAULT_SOURCE),
          exists("full_analysis", envir = isolated, inherits = FALSE))
setwd(old_wd)

cat("R kernel: raw CSV, eight directions, mechanism paths, projection,",
    "variance, population DR, logistic scores, targeting and failures passed.\n")
cat(sprintf(paste0("RHC n=%d; deaths=%d; initial=%.15f; AIPW=%.15f; ",
  "TMLE=%.15f; epsilon=%.15f; score=%.3g; SE=%.15f\n"),
  fit$n, sum(fit$y), initial$estimate, initial$aipw, targeted$estimate,
  targeted$epsilon, targeted$score, targeted$se))
