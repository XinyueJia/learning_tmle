# Read the original RHC cohort and reproduce the declared logistic analysis.
# source() works from any working directory and into a caller's environment.
.rhc_module_dir <- local({
  files <- vapply(sys.frames(), function(frame) {
    if (!is.null(frame$ofile)) return(as.character(frame$ofile))
    candidate <- frame$file
    if (is.character(candidate) && length(candidate) == 1L &&
        basename(candidate) == "RHCCase.R") candidate else ""
  }, "")
  files <- files[nzchar(files)]
  if (!length(files)) {
    files <- sub("^--file=", "", grep("^--file=", commandArgs(), value = TRUE))
  }
  if (!length(files)) stop("Source RHCCase.R from its saved file")
  dirname(normalizePath(files[length(files)], mustWork = TRUE))
})
source(file.path(.rhc_module_dir, "EIFCase.R"), local = TRUE)

DEFAULT_SOURCE <- normalizePath(file.path(.rhc_module_dir, "..", "data",
  "public", "rhc", "source.csv"), mustWork = FALSE)
SOURCE_FIELDS <- strsplit(paste0(
  ",cat1,cat2,ca,sadmdte,dschdte,dthdte,lstctdte,death,cardiohx,chfhx,",
  "dementhx,psychhx,chrpulhx,renalhx,liverhx,gibledhx,malighx,immunhx,",
  "transhx,amihx,age,sex,edu,surv2md1,das2d3pc,t3d30,dth30,aps1,",
  "scoma1,meanbp1,wblc1,hrt1,resp1,temp1,pafi1,alb1,hema1,bili1,",
  "crea1,sod1,pot1,paco21,ph1,swang1,wtkilo1,dnr1,ninsclas,resp,",
  "card,neuro,gastr,renal,meta,hema,seps,trauma,ortho,adld3p,urin1,",
  "race,income,ptid"), ",", fixed = TRUE)[[1]]

# BEGIN_RAW_READ
# Strict CSV grammar: quoted commas/newlines, escaped quotes, CRLF and BOM.
# Return records as lists of character vectors; preserve spaces and "NA" text.
csv_records <- function(text) {
  if (!is.character(text) || length(text) != 1L || is.na(text)) {
    stop("One CSV text string is required")
  }
  text <- sub("^\ufeff", "", text)
  chars <- strsplit(text, "", fixed = TRUE)[[1]]
  total <- length(chars)
  records <- list(); record <- character(); field <- character()
  state <- "unquoted"; active <- FALSE; i <- 1L
  while (i <= total) {
    ch <- chars[i]
    if (state == "quoted") {
      if (ch == '"') {
        if (i < total && chars[i + 1L] == '"') {
          field <- c(field, '"'); i <- i + 1L
        } else state <- "afterquote"
      } else field <- c(field, ch)
    } else if (ch %in% c(",", "\n", "\r")) {
      record <- c(record, paste0(field, collapse = ""))
      field <- character(); state <- "unquoted"
      if (ch == ",") active <- TRUE else {
        records[[length(records) + 1L]] <- record
        record <- character(); active <- FALSE
        if (ch == "\r" && i < total && chars[i + 1L] == "\n") i <- i + 1L
      }
    } else if (state == "afterquote") {
      stop("Unexpected character after closing CSV quote")
    } else if (ch == '"') {
      if (length(field)) stop("Quote inside unquoted CSV field")
      state <- "quoted"; active <- TRUE
    } else {
      field <- c(field, ch); active <- TRUE
    }
    i <- i + 1L
  }
  if (state == "quoted") stop("Unclosed CSV quote")
  if (active || length(record)) {
    record <- c(record, paste0(field, collapse = ""))
    records[[length(records) + 1L]] <- record
  }
  records
}

read_rhc_rows <- function(path = DEFAULT_SOURCE) {
  size <- file.info(path)$size
  if (length(size) != 1L || is.na(size)) stop("RHC source file is unavailable")
  text <- readChar(path, nchars = size, useBytes = TRUE)
  records <- csv_records(text)
  if (!length(records)) stop("Empty RHC CSV")
  headers <- records[[1L]]
  if (length(headers) != length(SOURCE_FIELDS) || anyDuplicated(headers) ||
      !setequal(headers, SOURCE_FIELDS)) {
    stop("Expected the original 63 unique RHC headers, including empty index")
  }
  records <- records[-1L]
  if (!length(records)) stop("RHC CSV has no observations")
  if (any(lengths(records) != length(headers))) {
    stop("RHC CSV row has wrong field count; no rows were dropped")
  }
  rows <- as.data.frame(do.call(rbind, records), stringsAsFactors = FALSE,
                        optional = TRUE)
  names(rows) <- headers
  rhc_observations(rows)
  if (any(!nzchar(rows$ptid) | rows$ptid == "NA") ||
      anyDuplicated(rows$ptid)) stop("Missing or duplicate patient identifier")
  rows
}

rhc_observations <- function(rows) {
  if (!is.data.frame(rows) || !nrow(rows) ||
      !all(c("sex", "swang1", "dth30") %in% names(rows))) {
    stop("RHC observations require sex,swang1,dth30 columns and at least one row")
  }
  allowed <- list(sex = c("Female", "Male"),
                  swang1 = c("No RHC", "RHC"), dth30 = c("No", "Yes"))
  for (key in names(allowed)) {
    if (anyNA(rows[[key]]) || any(!rows[[key]] %in% allowed[[key]])) {
      stop("Unexpected or missing RHC category: ", key)
    }
  }
  data.frame(x = as.integer(rows$sex == "Male"),
             a = as.integer(rows$swang1 == "RHC"),
             y = as.integer(rows$dth30 == "Yes"))
}
# END_RAW_READ

# BEGIN_RHC_COUNTS
rhc_counts <- function(rows) {
  observations <- rhc_observations(rows)
  counts <- data.frame(x = rep(0:1, each = 4),
                       a = rep(rep(0:1, each = 2), 2), y = rep(0:1, 4))
  index <- observations$x * 4L + observations$a * 2L + observations$y + 1L
  counts$n <- tabulate(index, nbins = 8L)
  counts
}

# Sex-standardised association; sex alone does not establish exchangeability.
rhc_data <- function(path = DEFAULT_SOURCE) {
  case_data(rhc_counts(read_rhc_rows(path)))
}

write_rhc_counts <- function(path, rows = read_rhc_rows()) {
  counts <- .checked_counts(rhc_counts(rows))
  write.table(counts, path, sep = ",", row.names = FALSE, col.names = TRUE,
              quote = FALSE)
  invisible(path)
}
# END_RHC_COUNTS

# BEGIN_FULL_BASELINE
HISTORY_FIELDS <- c("cardiohx", "chfhx", "dementhx", "psychhx", "chrpulhx",
  "renalhx", "liverhx", "gibledhx", "malighx", "immunhx", "transhx", "amihx")
FULL_FEATURES <- c("intercept", "male", "age_z", "race_black", "race_other",
                   HISTORY_FIELDS)

# Unpenalised Newton regression with explicit likelihood line search.
# No automatic column removal, propensity truncation or regularisation.
fit_logistic <- function(design, outcome, tolerance = 1e-10, maxiter = 100) {
  if (!is.matrix(design) || !is.numeric(design)) stop("Numeric design required")
  n <- nrow(design); k <- ncol(design)
  .finite_vector(design, n * k, "design")
  .finite_vector(outcome, n, "outcome")
  .finite_scalar(tolerance, "score tolerance"); .positive_integer(maxiter)
  if (tolerance <= 0 || n <= k || k < 1L || any(!outcome %in% 0:1)) {
    stop("Logistic dimensions, binary outcomes or tolerance invalid")
  }
  if (mean(outcome) <= 0 || mean(outcome) >= 1) {
    stop("Logistic outcome must contain both labels")
  }
  if (qr(design)$rank != k) {
    stop("Logistic design is rank deficient; no columns were removed")
  }
  coefficients <- numeric(k)
  coefficients[1] <- logit(mean(outcome))
  likelihood <- function(beta) {
    eta <- drop(design %*% beta)
    if (any(!is.finite(eta))) return(-Inf)
    -mean(outcome * .softplus(-eta) + (1 - outcome) * .softplus(eta))
  }
  for (iteration in 0:maxiter) {
    eta <- drop(design %*% coefficients)
    probabilities <- expit(eta)
    if (any(probabilities <= 0 | probabilities >= 1)) {
      stop("Logistic probability reached a floating-point endpoint")
    }
    score <- drop(crossprod(design, outcome - probabilities)) / n
    score_maximum <- max(abs(score))
    if (score_maximum <= tolerance) {
      return(list(coefficients = coefficients, probabilities = probabilities,
        iterations = iteration, converged = TRUE,
        score_maximum = score_maximum, log_likelihood = likelihood(coefficients)))
    }
    if (iteration >= maxiter) stop("Logistic fit failed its score tolerance")
    weights <- probabilities * (1 - probabilities)
    information <- crossprod(design, design * weights) / n
    direction <- drop(solve(information, score))
    ascent <- sum(score * direction)
    if (any(!is.finite(direction)) || ascent <= 0) {
      stop("Invalid logistic Newton direction")
    }
    current <- likelihood(coefficients)
    step <- 1; accepted <- FALSE
    for (backtrack in seq_len(60L)) {
      candidate <- coefficients + step * direction
      if (likelihood(candidate) >= current + 1e-4 * step * ascent) {
        coefficients <- candidate; accepted <- TRUE; break
      }
      step <- step / 2
    }
    if (!accepted) stop("Logistic likelihood line search failed")
  }
  stop("Unreachable logistic fit state")
}

# All original observations, declared W, population age SD, white reference race.
# The chosen W does not establish clinical causal sufficiency.
prepare_full <- function(rows) {
  observations <- rhc_observations(rows)
  required <- c("age", "race", HISTORY_FIELDS)
  if (!all(required %in% names(rows))) stop("Missing baseline column")
  if (anyNA(rows[, required, drop = FALSE])) stop("Missing baseline value")
  age_input <- if (is.factor(rows$age)) as.character(rows$age) else rows$age
  if (!is.character(age_input) && !is.numeric(age_input)) {
    stop("Age must retain its original numeric values or character labels")
  }
  age <- suppressWarnings(as.numeric(age_input))
  if (any(!is.finite(age) | age <= 0)) stop("Invalid or missing age")
  if (any(!rows$race %in% c("white", "black", "other"))) {
    stop("Unknown or missing race")
  }
  for (key in HISTORY_FIELDS) {
    if (any(!rows[[key]] %in% c("0", "1"))) {
      stop("Nonbinary or missing history: ", key)
    }
  }
  n <- nrow(rows)
  age_mean <- mean(age)
  age_sd <- sqrt(mean((age - age_mean)^2))
  if (!is.finite(age_sd) || age_sd <= 0) stop("Age has zero population SD")
  history <- vapply(HISTORY_FIELDS, function(key) {
    # A factor's integer codes are not its original 0/1 labels.
    value <- rows[[key]]
    if (is.factor(value)) value <- as.character(value)
    as.numeric(value)
  }, numeric(n))
  design <- cbind(1, observations$x, (age - age_mean) / age_sd,
    as.numeric(rows$race == "black"), as.numeric(rows$race == "other"), history)
  colnames(design) <- FULL_FEATURES
  a <- as.numeric(observations$a); y <- as.numeric(observations$y)
  g_fit <- fit_logistic(design, a)
  q_fit <- fit_logistic(cbind(design, A = a), y)
  q0 <- expit(drop(cbind(design, A = 0) %*% q_fit$coefficients))
  q1 <- expit(drop(cbind(design, A = 1) %*% q_fit$coefficients))
  g <- g_fit$probabilities
  if (any(c(g, q0, q1) <= 0 | c(g, q0, q1) >= 1)) {
    stop("Initial predictions reached a floating-point endpoint")
  }
  h <- a / g - (1 - a) / (1 - g)
  list(n = n, feature_names = FULL_FEATURES,
    q_feature_names = c(FULL_FEATURES, "A"), age_mean = age_mean,
    age_sd = age_sd, design = design, a = a, y = y, g_fit = g_fit,
    q_fit = q_fit, g = g, q0 = q0, q1 = q1, h = h)
}
# END_FULL_BASELINE

# BEGIN_FULL_TARGET
.checked_full <- function(fit) {
  .positive_integer(fit$n, "sample size")
  for (key in c("a", "y", "g", "q0", "q1", "h")) {
    .finite_vector(fit[[key]], fit$n, key)
  }
  if (any(!fit$a %in% 0:1) || any(!fit$y %in% 0:1)) {
    stop("Observed treatment and outcome must be binary")
  }
  probabilities <- c(fit$g, fit$q0, fit$q1)
  if (any(probabilities <= 0 | probabilities >= 1)) {
    stop("Initial probabilities must be strictly interior")
  }
  expected_h <- fit$a / fit$g - (1 - fit$a) / (1 - fit$g)
  if (any(abs(fit$h - expected_h) > 1e-12 * (1 + abs(expected_h)))) {
    stop("H must agree with the observed treatment and fitted g")
  }
  invisible(fit)
}

full_at <- function(fit, epsilon = 0) {
  .checked_full(fit); .finite_scalar(epsilon, "fluctuation parameter")
  q0 <- expit(logit(fit$q0) - epsilon / (1 - fit$g))
  q1 <- expit(logit(fit$q1) + epsilon / fit$g)
  if (any(c(q0, q1) <= 0 | c(q0, q1) >= 1)) {
    stop("Targeted Q reached a floating-point endpoint")
  }
  q_observed <- fit$a * q1 + (1 - fit$a) * q0
  score <- mean(fit$h * (fit$y - q_observed))
  slope <- -mean(fit$h^2 * q_observed * (1 - q_observed))
  estimate <- mean(q1 - q0)
  values <- fit$h * (fit$y - q_observed) + q1 - q0 - estimate
  eif_mean <- mean(values)
  eif_variance <- mean((values - eif_mean)^2)
  log_likelihood <- mean(fit$y * log(q_observed) +
                          (1 - fit$y) * log1p(-q_observed))
  .finite_vector(c(score, slope, estimate, eif_mean, eif_variance,
                   log_likelihood), name = "full-analysis summary")
  list(epsilon = epsilon, q0 = q0, q1 = q1, q_observed = q_observed,
    score = score, slope = slope, log_likelihood = log_likelihood,
    risk0 = mean(q0), risk1 = mean(q1), estimate = estimate,
    aipw = estimate + score, eif_values = values, eif_mean = eif_mean,
    eif_variance = eif_variance, se = sqrt(eif_variance / fit$n))
}

full_bisection_step <- function(fit, lo, hi) {
  .checked_bracket(function(epsilon) full_at(fit, epsilon), lo, hi)
  midpoint <- lo / 2 + hi / 2
  score <- full_at(fit, midpoint)$score
  next_lo <- if (score > 0) midpoint else lo
  next_hi <- if (score < 0) midpoint else hi
  if (score == 0) next_lo <- next_hi <- midpoint
  list(midpoint = midpoint, score = score, lo = next_lo, hi = next_hi)
}

solve_full <- function(fit, lo = -0.25, hi = 0.25,
                       tolerance = 1e-12, maxiter = 200) {
  .finite_scalar(tolerance, "score tolerance"); .positive_integer(maxiter)
  if (tolerance <= 0 || tolerance > 1e-6) stop("Invalid score tolerance")
  .checked_bracket(function(epsilon) full_at(fit, epsilon), lo, hi)
  for (iteration in seq_len(maxiter)) {
    step <- full_bisection_step(fit, lo, hi)
    if (abs(step$score) <= tolerance) {
      return(c(full_at(fit, step$midpoint),
               list(converged = TRUE, iterations = iteration)))
    }
    if (step$midpoint == lo || step$midpoint == hi) {
      stop("Full-analysis bisection stagnated")
    }
    lo <- step$lo; hi <- step$hi
  }
  stop("Full-analysis bisection did not reach tolerance")
}

full_analysis <- function(path = DEFAULT_SOURCE) {
  fit <- prepare_full(read_rhc_rows(path))
  list(fit = fit, initial = full_at(fit), targeted = solve_full(fit))
}
# END_FULL_TARGET
