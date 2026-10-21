# Eight-cell distribution algebra. Base R only; no source data are changed.
# Labels x/a/y are 0/1; q has treatment rows and covariate columns.

.finite_vector <- function(v, n = length(v), name = "vector") {
  if (!is.numeric(v) || length(v) != n || any(!is.finite(v))) {
    stop(name, " must be a finite numeric vector of matching length")
  }
  invisible(v)
}

.finite_scalar <- function(v, name = "parameter") {
  .finite_vector(v, 1L, name)
  invisible(v)
}

.positive_integer <- function(v, name = "iteration count") {
  .finite_scalar(v, name)
  if (v <= 0 || v != floor(v)) stop(name, " must be a positive integer")
  invisible(v)
}

.checked_probabilities <- function(p) {
  .finite_vector(p, name = "probabilities")
  if (!length(p) || any(p <= 0 | p > 1) || abs(sum(p) - 1) > 1e-12) {
    stop("Positive probabilities summing to one are required")
  }
  invisible(p)
}

.checked_counts <- function(rows) {
  if (!is.data.frame(rows) || nrow(rows) != 8L ||
      !all(c("x", "a", "y", "n") %in% names(rows))) {
    stop("Eight count rows with x,a,y,n are required")
  }
  rows <- rows[, c("x", "a", "y", "n"), drop = FALSE]
  for (key in c("x", "a", "y")) {
    .finite_vector(rows[[key]], 8L, key)
    if (any(!rows[[key]] %in% 0:1)) stop("Cell labels must be binary")
  }
  .finite_vector(rows$n, 8L, "counts")
  if (any(rows$n <= 0 | rows$n != floor(rows$n)) ||
      sum(rows$n) > 2^53 - 1) {
    stop("Positive integer counts with an exactly representable total required")
  }
  if (anyDuplicated(rows[, c("x", "a", "y")])) {
    stop("Duplicate cell labels")
  }
  rows <- rows[order(rows$x, rows$a, rows$y), , drop = FALSE]
  rownames(rows) <- NULL
  rows
}

read_counts <- function(path) {
  rows <- read.csv(path, check.names = FALSE, row.names = NULL,
                   stringsAsFactors = FALSE,
                   comment.char = "", blank.lines.skip = FALSE, fill = FALSE)
  if (!identical(names(rows), c("x", "a", "y", "n"))) {
    stop("Expected CSV header x,a,y,n")
  }
  .checked_counts(rows)
}

.checked_model <- function(model) {
  .finite_vector(model$px, 2L, "px")
  .checked_probabilities(model$px)
  .finite_vector(model$g, 2L, "g")
  if (any(model$g <= 0 | model$g >= 1)) {
    stop("Treatment probabilities must be strictly interior")
  }
  if (!is.matrix(model$q) || !identical(dim(model$q), c(2L, 2L))) {
    stop("q must be a 2 by 2 matrix with treatment rows")
  }
  .finite_vector(model$q, 4L, "q")
  if (any(model$q < 0 | model$q > 1)) stop("q must contain probabilities")
  invisible(model)
}

# BEGIN_CH03
case_data <- function(rows) {
  if (is.character(rows) && length(rows) == 1L) rows <- read_counts(rows)
  counts <- .checked_counts(rows)
  n <- sum(counts$n)
  cells <- counts
  cells$p <- counts$n / n
  px <- vapply(0:1, function(x) sum(counts$n[counts$x == x]) / n, 0.0)
  g <- vapply(0:1, function(x) {
    sum(counts$n[counts$x == x & counts$a == 1]) /
      sum(counts$n[counts$x == x])
  }, 0.0)
  q <- matrix(0, 2, 2)
  for (x in 0:1) for (a in 0:1) {
    keep <- counts$x == x & counts$a == a
    q[a + 1, x + 1] <- sum(counts$n[keep] * counts$y[keep]) /
      sum(counts$n[keep])
  }
  arm_risks <- vapply(0:1, function(a) {
    keep <- counts$a == a
    sum(counts$n[keep] * counts$y[keep]) / sum(counts$n[keep])
  }, 0.0)
  empirical_model <- list(px = px, g = g, q = q)
  initial_fit <- list(px = px, g = g, q = matrix(arm_risks, 2, 2))
  groups <- do.call(rbind, lapply(0:1, function(x) {
    do.call(rbind, lapply(0:1, function(a) {
      keep <- counts$x == x & counts$a == a
      data.frame(x = x, a = a, n = sum(counts$n[keep]),
        events = sum(counts$n[keep] * counts$y[keep]),
        q_observed = q[a + 1, x + 1], p_x = px[x + 1],
        g_hat = g[x + 1], initial_q = initial_fit$q[a + 1, x + 1])
    }))
  }))
  list(n = n, cells = cells, groups = groups,
    empirical_model = empirical_model, initial_fit = initial_fit,
    marginal_risk = sum(cells$p * cells$y),
    initial_estimate = ate(initial_fit),
    observed_difference = arm_risks[2] - arm_risks[1])
}

ate <- function(model) {
  .checked_model(model)
  sum(model$px * (model$q[2, ] - model$q[1, ]))
}
# END_CH03

weighted_inner <- function(p, f, k) {
  .checked_probabilities(p)
  .finite_vector(f, length(p)); .finite_vector(k, length(p))
  result <- sum(p * f * k)
  .finite_scalar(result, "weighted inner product")
  result
}

# BEGIN_CH01
mean_if <- function(data) {
  total_people <- data$n
  .positive_integer(total_people, "total number of people")
  cells <- data$cells
  if (!is.data.frame(cells) || !all(c("n", "y") %in% names(cells))) {
    stop("Cells with count n and binary outcome y are required")
  }
  .finite_vector(cells$n); .finite_vector(cells$y, nrow(cells))
  if (!nrow(cells) || any(cells$n <= 0 | cells$n != floor(cells$n)) ||
      any(!cells$y %in% 0:1) || sum(cells$n) != total_people) {
    stop("Positive integer cell counts must sum to n; y must be binary")
  }
  events <- 0
  for (i in seq_len(nrow(cells))) {
    events <- events + cells$n[i] * cells$y[i]
  }
  risk <- events / total_people
  values <- numeric(nrow(cells))
  weighted_mean <- 0
  for (i in seq_len(nrow(cells))) {
    influence <- cells$y[i] - risk
    values[i] <- influence
    probability <- cells$n[i] / total_people
    weighted_mean <- weighted_mean + probability * influence
  }
  list(risk = risk, values = values, mean = weighted_mean)
}
# END_CH01

# BEGIN_CH02
point_direction <- function(data, index) {
  .positive_integer(index, "cell index")
  p <- data$cells$p
  .checked_probabilities(p)
  if (index > length(p)) stop("Invalid cell index")
  h <- as.numeric(seq_along(p) == index) - p
  score <- h / p
  derivative <- sum(data$cells$y * h)
  pairing <- weighted_inner(p, mean_if(data)$values, score)
  list(index = index, h = h, score = score,
       derivative = derivative, pairing = pairing)
}

linear_path <- function(p, score, t) {
  .checked_probabilities(p); .finite_vector(score, length(p))
  .finite_scalar(t, "path parameter")
  if (abs(sum(p * score)) > 1e-12) stop("Score must be centred under p")
  updated <- p * (1 + t * score)
  .checked_probabilities(updated)
  updated
}
# END_CH02

# BEGIN_CH04
clever_h <- function(model, a, x) {
  .finite_scalar(a, "a"); .finite_scalar(x, "x")
  if (!a %in% 0:1 || !x %in% 0:1) stop("Binary group labels required")
  .finite_vector(model$g, 2L, "g")
  g <- model$g[x + 1]
  if (g <= 0 || g >= 1) stop("Treatment probability must be interior")
  if (a == 1) 1 / g else -1 / (1 - g)
}

eif_values <- function(model, cells, estimate = ate(model)) {
  .checked_model(model); .finite_scalar(estimate, "estimate")
  if (!is.data.frame(cells) || !all(c("x", "a", "y") %in% names(cells))) {
    stop("Cells must contain x,a,y")
  }
  for (key in c("x", "a", "y")) {
    .finite_vector(cells[[key]], nrow(cells), key)
    if (any(!cells[[key]] %in% 0:1)) stop("Binary cell labels required")
  }
  vapply(seq_len(nrow(cells)), function(i) {
    x <- cells$x[i]; a <- cells$a[i]; y <- cells$y[i]
    model$q[2, x + 1] - model$q[1, x + 1] - estimate +
      clever_h(model, a, x) * (y - model$q[a + 1, x + 1])
  }, 0.0)
}
# END_CH04

# BEGIN_CH05
model_from_probabilities <- function(cells, p) {
  .checked_probabilities(p)
  if (!is.data.frame(cells) || nrow(cells) != length(p) ||
      !all(c("x", "a", "y") %in% names(cells))) stop("Cell length mismatch")
  for (key in c("x", "a", "y")) {
    .finite_vector(cells[[key]], length(p), key)
    if (any(!cells[[key]] %in% 0:1)) stop("Binary cell labels required")
  }
  px <- vapply(0:1, function(x) sum(p[cells$x == x]), 0.0)
  mass <- q <- matrix(0, 2, 2)
  for (x in 0:1) for (a in 0:1) {
    keep <- cells$x == x & cells$a == a
    mass[a + 1, x + 1] <- sum(p[keep])
    if (mass[a + 1, x + 1] <= 0) stop("Every treatment group needs mass")
    q[a + 1, x + 1] <- sum(p[keep] * cells$y[keep]) /
      mass[a + 1, x + 1]
  }
  list(px = px, g = mass[2, ] / px, q = q)
}

direction_check <- function(data, score, step = 1e-6) {
  .finite_scalar(step, "difference step")
  if (step <= 0) stop("Positive finite difference step required")
  p <- data$cells$p
  plus <- model_from_probabilities(data$cells, linear_path(p, score, step))
  minus <- model_from_probabilities(data$cells, linear_path(p, score, -step))
  finite_difference <- (ate(plus) - ate(minus)) / (2 * step)
  pairing <- weighted_inner(p,
    eif_values(data$empirical_model, data$cells), score)
  list(finite_difference = finite_difference, pairing = pairing,
       difference = finite_difference - pairing)
}
# END_CH05

# BEGIN_CH06
weighted_projection <- function(p, f, basis) {
  .checked_probabilities(p); .finite_vector(f, length(p))
  if (is.matrix(basis)) basis <- lapply(seq_len(ncol(basis)),
                                       function(j) basis[, j])
  if (!is.list(basis)) stop("Basis must be a list or matrix of columns")
  orthonormal <- list()
  for (b in basis) {
    .finite_vector(b, length(p))
    original_norm <- sqrt(weighted_inner(p, b, b))
    if (original_norm <= 0) stop("Basis must have full column rank")
    v <- b / original_norm
    for (pass in 1:2) for (u in orthonormal) {
      v <- v - weighted_inner(p, v, u) * u
    }
    vnorm <- sqrt(weighted_inner(p, v, v))
    if (vnorm <= 1e-12) stop("Basis is rank deficient at numerical precision")
    orthonormal[[length(orthonormal) + 1L]] <- v / vnorm
  }
  result <- numeric(length(p))
  for (u in orthonormal) result <- result + weighted_inner(p, f, u) * u
  result
}

projection_demo <- function(data, b = 1) {
  .finite_scalar(b, "candidate coefficient")
  model <- data$empirical_model; cells <- data$cells; p <- cells$p
  canonical <- eif_values(model, cells)
  u <- cells$a - model$g[cells$x + 1]
  basis <- list(cells$x - model$px[2])
  for (x in 0:1) for (a in 0:1) {
    basis[[length(basis) + 1L]] <- ifelse(cells$x == x & cells$a == a,
      cells$y - model$q[a + 1, x + 1], 0)
  }
  candidate <- canonical + b * u
  projection <- weighted_projection(p, candidate, basis)
  residual <- candidate - projection
  list(basis = basis, canonical = canonical, u = u, candidate = candidate,
    projection = projection, residual = residual,
    candidate_second_moment = weighted_inner(p, candidate, candidate),
    projection_second_moment = weighted_inner(p, projection, projection),
    residual_second_moment = weighted_inner(p, residual, residual))
}
# END_CH06

# BEGIN_CH07
if_variance <- function(data,
    values = eif_values(data$empirical_model, data$cells)) {
  p <- data$cells$p
  .checked_probabilities(p); .finite_vector(values, length(p))
  .positive_integer(data$n, "sample size")
  mean <- sum(p * values)
  second_moment <- sum(p * values^2)
  variance <- sum(p * (values - mean)^2)
  .finite_vector(c(mean, second_moment, variance), name = "IF moments")
  list(mean = mean, second_moment = second_moment, variance = variance,
       se = sqrt(variance / data$n))
}
# END_CH07

# BEGIN_CH08
expit <- function(z) {
  .finite_vector(z, name = "log odds")
  result <- numeric(length(z))
  positive <- z >= 0
  result[positive] <- 1 / (1 + exp(-z[positive]))
  ez <- exp(z[!positive])
  result[!positive] <- ez / (1 + ez)
  result
}

logit <- function(q) {
  .finite_vector(q, name = "probability")
  if (any(q <= 0 | q >= 1)) stop("Probability must be strictly interior")
  log(q) - log1p(-q)
}

.softplus <- function(z) pmax(z, 0) + log1p(exp(-abs(z)))

fluctuation_groups <- function(data) {
  groups <- data$groups
  groups$h <- vapply(seq_len(nrow(groups)), function(i) {
    clever_h(data$initial_fit, groups$a[i], groups$x[i])
  }, 0.0)
  groups$offset <- logit(groups$initial_q)
  groups
}

fluctuation_score <- function(data, epsilon) {
  .finite_scalar(epsilon, "fluctuation parameter")
  groups <- fluctuation_groups(data)
  eta <- groups$offset + epsilon * groups$h
  .finite_vector(eta, name = "updated log odds")
  q <- expit(eta)
  score <- sum(groups$h * (groups$events - groups$n * q)) / data$n
  slope <- -sum(groups$n * groups$h^2 * q * (1 - q)) / data$n
  log_likelihood <- -sum(groups$events * .softplus(-eta) +
    (groups$n - groups$events) * .softplus(eta)) / data$n
  .finite_vector(c(score, slope, log_likelihood), name = "fluctuation summary")
  list(score = score, slope = slope, log_likelihood = log_likelihood)
}

case_at <- function(data, epsilon = 0) {
  state <- fluctuation_score(data, epsilon)
  groups <- fluctuation_groups(data)
  groups$q_updated <- expit(groups$offset + epsilon * groups$h)
  if (any(groups$q_updated <= 0 | groups$q_updated >= 1)) {
    stop("Updated Q reached a floating-point endpoint")
  }
  groups$predicted_events <- groups$n * groups$q_updated
  groups$residual_total <- groups$events - groups$predicted_events
  groups$weighted_residual <- groups$h * groups$residual_total
  groups$score_contribution <- groups$weighted_residual / data$n
  q <- matrix(0, 2, 2)
  q[cbind(groups$a + 1, groups$x + 1)] <- groups$q_updated
  updated_fit <- list(px = data$initial_fit$px, g = data$initial_fit$g, q = q)
  estimate <- ate(updated_fit)
  values <- eif_values(updated_fit, data$cells, estimate)
  moments <- if_variance(data, values)
  eif_rows <- transform(data$cells, d = values)
  c(list(data = data, epsilon = epsilon, groups = groups), state,
    list(updated_fit = updated_fit, estimate = estimate,
      aipw = estimate + state$score, eif_rows = eif_rows,
      eif_mean = moments$mean, eif_second_moment = moments$second_moment,
      eif_variance = moments$variance, se = moments$se))
}

.checked_bracket <- function(evaluate, lo, hi) {
  .finite_scalar(lo, "lower bracket"); .finite_scalar(hi, "upper bracket")
  if (lo >= hi) stop("Finite increasing bracket required")
  slo <- evaluate(lo)$score; shi <- evaluate(hi)$score
  if (slo < 0 || shi > 0) stop("Bracket must contain the decreasing score root")
  list(lo = lo, hi = hi, slo = slo, shi = shi)
}

bisection_step <- function(data, lo, hi) {
  .checked_bracket(function(epsilon) fluctuation_score(data, epsilon), lo, hi)
  midpoint <- lo / 2 + hi / 2
  score <- fluctuation_score(data, midpoint)$score
  next_lo <- if (score > 0) midpoint else lo
  next_hi <- if (score < 0) midpoint else hi
  if (score == 0) next_lo <- next_hi <- midpoint
  list(midpoint = midpoint, score = score, lo = next_lo, hi = next_hi)
}

solve_case <- function(data, lo = -1, hi = 1,
                       score_tol = 1e-12, maxiter = 200) {
  .finite_scalar(score_tol, "score tolerance"); .positive_integer(maxiter)
  if (score_tol <= 0 || score_tol > 1e-6) stop("Invalid score tolerance")
  bracket <- .checked_bracket(function(e) fluctuation_score(data, e), lo, hi)
  for (epsilon in c(lo, hi)) {
    if (abs(fluctuation_score(data, epsilon)$score) <= score_tol) {
      return(c(case_at(data, epsilon), list(converged = TRUE,
        iterations = 0L, reason = "score_tolerance")))
    }
  }
  for (iterations in seq_len(maxiter)) {
    step <- bisection_step(data, lo, hi)
    if (abs(step$score) <= score_tol) {
      return(c(case_at(data, step$midpoint), list(converged = TRUE,
        iterations = iterations, reason = "score_tolerance")))
    }
    if (step$midpoint == lo || step$midpoint == hi) {
      return(c(case_at(data, step$midpoint), list(converged = FALSE,
        iterations = iterations, reason = "floating_point_stagnation")))
    }
    lo <- step$lo; hi <- step$hi
  }
  c(case_at(data, lo / 2 + hi / 2), list(converged = FALSE,
    iterations = as.integer(maxiter), reason = "maximum_iterations"))
}
# END_CH08
