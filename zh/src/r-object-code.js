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
 source:'read_rhc_rows读取原CSV为data.frame；rhc_observations将字段编码为x、a、y三列。observations$y取出结局列，得到按原始行序排列的数值向量。',
 fit:'fit_logistic的输入依次为设计矩阵与结果向量，返回含系数和预测概率的list。cbind按列合并：17列design与实际a构成18列Q输入；拟合g时以17列design预测a。',
 predict:'cbind按列合并输入；%*%做矩阵乘法，n×18乘18项系数，得到n×1矩阵。drop去除单列维度，expit逐项转成概率向量。rep(1,n)或rep(0,n)给同一模型指定预测处理值。',
 select:'R的*与+对同长向量逐项运算。A=1的行保留q1，A=0的行保留q0；fit$a从初始拟合list取出实际处理向量。',
 estimate:'q1 - q0先产生n项预测差，sum将整列相加，再除以总人数n，输出一个概率差。',
 'patient-mean':'sum(y)把完整n项0/1加成死亡人数；events / n把两个单值相除，得到样本死亡比例。',
 'weighted-mean':'c(0,1)创建两项结局支持。vapply对每个结局编码v计算mean(y == v)，得到两项概率；numeric(1)声明每次返回一个数。p * support_y逐项相乘，sum加总为固定参考均值mu。',
 reweight:'support_y == z逐项比较，as.numeric将TRUE/FALSE转成1/0。标量1-t和t分别乘整列，再逐项相加，得到两项新概率。',
 'changed-mean':'p_t * support_y先逐项计算均值贡献，sum加总为新均值mu_t；再减固定原mu得到变化量delta。',
 'change-rate':'z - mu给出变化率。if选择分支：t等于0时用NA_real_标记差商未定义，其余时候计算delta/t。mu + t*derivative给出精确线性结果。',
 'linear-mean':'z - mu给出变化率。if选择分支：t等于0时用NA_real_标记差商未定义，其余时候计算delta/t。mu + t*derivative给出精确线性结果。',
 'lookup-rate':'support_y - mu将同一个标量mu从两项结局各减一次，返回两项影响值；z - mu则调用选定输入的那一个值。',
 'lookup-if':'support_y - mu将同一个标量mu从两项结局各减一次，返回两项影响值；z - mu则调用选定输入的那一个值。',
 'patient-if':'y - risk从完整n项结局各减同一个固定参考均值，输出n项向量，原始行序保留。',
 'mean-if':'sum(influence)先加总n项影响值，再除以n。这里以本样本均值为中心，实数运算的结果为0；机器计算可有舍入误差。',
 'grouped-centre':'p与support_D都是两项向量。*逐行相乘、sum再加总，对应按原分布的概率加权。',
 'old-new':'第一行保留旧support_D，只换新概率p_t。第二行以新mu_t定义另一条规则；第三行按新概率平均新规则的输出。',
 survival:'1 - y逐项取补集，sum(alive) / n得到30日生存概率；alive - survival得到与死亡均值IF逐项反号的生存影响值。'
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
