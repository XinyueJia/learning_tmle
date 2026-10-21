/** R expressions mirror the same operands and use the shared RHC base-R API. */
export const R_STAGE_CODE={
 source:'rows <- read_rhc_rows(DEFAULT_SOURCE)\nobservations <- rhc_observations(rows)\ny <- observations$y',
 fit:'g_fit <- fit_logistic(design, a)\nq_fit <- fit_logistic(cbind(design, a), y)',
 select:'qa <- fit$a * q1 + (1 - fit$a) * q0',
 estimate:'initial_estimate <- sum(q1 - q0) / n',
 'patient-mean':'events <- sum(y)\nrisk <- events / n',
 'weighted-mean':'support_y <- c(0, 1)\np <- vapply(support_y, function(v) mean(y == v), numeric(1))\nmu <- sum(p * support_y)',
 reweight:'point <- as.numeric(support_y == z)\np_t <- (1 - t) * p + t * point',
 'changed-mean':'mu_t <- sum(p_t * support_y)\ndelta <- mu_t - mu',
 'change-rate':'derivative <- z - mu\nrate <- if (t == 0) NA_real_ else delta / t\nlinear_mean <- mu + t * derivative',
 'linear-mean':'derivative <- z - mu\nrate <- if (t == 0) NA_real_ else delta / t\nlinear_mean <- mu + t * derivative',
 'lookup-rate':'support_D <- support_y - mu\nderivative <- z - mu',
 'lookup-if':'support_D <- support_y - mu\nderivative <- z - mu',
 'patient-if':'influence <- y - risk',
 'mean-if':'mean_influence <- sum(influence) / n',
 'grouped-centre':'support_D <- support_y - mu\ngrouped_mean_D <- sum(p * support_D)',
 'old-new':'old_mean_D <- sum(p_t * support_D)\nnew_support_D <- support_y - mu_t\nnew_mean_D <- sum(p_t * new_support_D)',
 survival:'alive <- 1 - y\nsurvival <- sum(alive) / n\nsurvival_influence <- alive - survival'
};
export const R_STAGE_NOTES={
 source:'read_rhc_rows reads the original CSV as a data.frame; rhc_observations encodes fields as columns x, a and y. observations$y extracts the outcome as a numeric vector in original row order.',
 fit:'fit_logistic takes a design matrix and response vector and returns a list of coefficients and fitted probabilities. cbind combines 17 design columns and observed a into 18 Q inputs; fitting g uses the 17 design columns to predict a.',
 predict:'cbind binds input columns; %*% multiplies an n×18 matrix by 18 coefficients, giving an n×1 matrix of linear predictors. drop removes the single-column dimension and expit converts entries to probabilities. rep(1,n) or rep(0,n) sets the treatment input to the same model.',
 select:'R applies * and + elementwise to equal-length vectors. A=1 retains q1 and A=0 retains q0; fit$a extracts observed treatment from the initial fit list.',
 estimate:'q1 - q0 forms n prediction contrasts. sum adds the full column; dividing by n outputs one probability difference.',
 'patient-mean':'sum(y) adds all n binary outcomes to count deaths; events / n divides two scalar values to obtain the sample death proportion.',
 'weighted-mean':'c(0,1) creates the two-point outcome support. vapply computes mean(y == v) for each outcome code v, giving two probabilities; numeric(1) requires one numeric output per call. p * support_y multiplies elementwise; sum gives the fixed reference mean mu.',
 reweight:'support_y == z compares entries; as.numeric converts TRUE/FALSE to 1/0. Scalars 1-t and t multiply the full vectors, which are then added elementwise to give two new probabilities.',
 'changed-mean':'p_t * support_y multiplies each outcome by its new probability; sum gives the new mean mu_t. Subtract the fixed original mu to obtain the mean change delta.',
 'change-rate':'z - mu gives the rate. if selects a branch: when t=0, NA_real_ marks the undefined quotient; otherwise compute delta/t. mu + t*derivative gives the exact linear result.',
 'linear-mean':'z - mu gives the rate. if selects a branch: when t=0, NA_real_ marks the undefined quotient; otherwise compute delta/t. mu + t*derivative gives the exact linear result.',
 'lookup-rate':'support_y - mu subtracts the same scalar mu from both outcomes, returning two influence values; z - mu evaluates the selected input.',
 'lookup-if':'support_y - mu subtracts the same scalar mu from both outcomes, returning two influence values; z - mu evaluates the selected input.',
 'patient-if':'y - risk subtracts the same fixed reference mean from all n outcomes, preserving original row order in an n-element vector.',
 'mean-if':'sum(influence) adds all n influence values, then divides by n. Centring at this sample mean gives 0 in exact arithmetic; machine calculations may have rounding error.',
 'grouped-centre':'p and support_D are two-element vectors. * multiplies row by row and sum adds the products, weighting by original distribution probabilities.',
 'old-new':'The first line retains original support_D and changes only probabilities to p_t. The second defines a different rule using new mu_t; the third averages its outputs using new probabilities.',
 survival:'1 - y complements each outcome; sum(alive) / n gives 30-day survival probability. alive - survival gives survival influence values with signs opposite to the death-mean IF.'
};
export function rObjectName(value){
 return value.replaceAll('q_fit.coefficients','q_fit$coefficients').replaceAll('g_fit.probabilities','g_fit$probabilities').replaceAll('fit.a','fit$a').replaceAll('ones(n)','rep(1,n)').replaceAll('zeros(n)','rep(0,n)').replaceAll(' .* ',' * ').replaceAll(' .- ',' - ');
}
export function rObjectToken(value){
 return rObjectName(value).replaceAll('q_fit = ', 'q_fit <- ').replaceAll('g_fit = ', 'g_fit <- ').replaceAll('expit.(hcat(','expit(drop(cbind(').replaceAll('hcat(','cbind(').replaceAll(') *',') %*%').replaceAll('.*','*').replaceAll('.-','-').replaceAll('.−','−');
}
export function rStageCode(stage,scenario='one'){
 if(stage==='predict'){
  const q=scenario==='observed'?'qa':scenario==='one'?'q1':'q0',a=scenario==='observed'?'a':scenario==='one'?'rep(1,n)':'rep(0,n)';
  return `${q} <- expit(drop(cbind(design, ${a}) %*% q_fit$coefficients))`;
 }
 if(!R_STAGE_CODE[stage])throw Error(`Missing R object code ${stage}`);
 return R_STAGE_CODE[stage];
}
