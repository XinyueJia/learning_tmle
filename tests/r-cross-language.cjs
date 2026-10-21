/* Run explicitly with: node tests/r-cross-language.cjs
 * Real base-R execution, original CSV arithmetic, and JavaScript comparisons.
 * This deliberately lives outside the default *.test.js browser-free suite.
 */
const assert = require('node:assert/strict');
const {readFileSync, existsSync} = require('node:fs');
const {resolve} = require('node:path');
const {spawnSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const {pathToFileURL} = require('node:url');
const {tmpdir} = require('node:os');

const root = resolve(__dirname, '..');
const sourcePath = resolve(root, 'shared/data/public/rhc/source.csv');
const source = readFileSync(sourcePath, 'utf8');
const rscript = process.env.RSCRIPT || (existsSync('/usr/local/bin/Rscript') ? '/usr/local/bin/Rscript' : 'Rscript');
const mean = x => x.reduce((s, v) => s + v, 0) / x.length;
const inner = (p, x, y) => p.reduce((s, v, i) => s + v * x[i] * y[i], 0);
const expit = x => x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x));
const logit = x => Math.log(x) - Math.log1p(-x);
let assertions = 0;
function near(actual, expected, tolerance = 2e-10, label = '') {
  assertions++;
  assert.ok(Number.isFinite(actual) && Number.isFinite(expected) &&
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
  `${label}: ${actual} != ${expected} (tolerance ${tolerance})`);
}
function vector(actual, expected, tolerance = 2e-10, label = '') {
  assert.ok(actual, `Missing R result ${label}`);
  assert.equal(actual.length, expected.length, `${label} length`);
  actual.forEach((v, i) => near(v, expected[i], tolerance, `${label}[${i + 1}]`));
}

// An independent CSV state machine: no course data loader or frozen counts.
function csv(text) {
  const result = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {field += '"'; i++;}
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {row.push(field); field = '';}
    else if (ch === '\n') {row.push(field.replace(/\r$/, '')); result.push(row); row = []; field = '';}
    else field += ch;
  }
  assert.equal(quoted, false, 'CSV quotes must close');
  if (field.length || row.length) {row.push(field); result.push(row);}
  const header = result.shift();
  return result.map(r => {assert.equal(r.length, header.length); return Object.fromEntries(header.map((k, i) => [k, r[i]]));});
}

async function main() {
  const RHC = await import(pathToFileURL(resolve(root, 'shared/js/rhc.js')));
  const CASE = await import(pathToFileURL(resolve(root, 'shared/js/case-study.js')));
  const {tmleTrace} = await import(pathToFileURL(resolve(root, 'shared/js/tmle-trace.js')));
  const {R_STAGE_CODE,rStageCode} = await import(pathToFileURL(resolve(root, 'zh/src/r-object-code.js')));
  for(const name of [...Array.from({length:9},(_,i)=>`ch${String(i).padStart(2,'0')}`),'ch08-trace']) {
    const mapping=JSON.parse(readFileSync(resolve(root,'zh/src/R',`${name}.json`),'utf8'));
    const sourceLines=readFileSync(resolve(root,mapping.source),'utf8').trimEnd().split('\n');
    assert.equal(mapping.lineCount,sourceLines.length,`${name} source line count`);
    const executable=sourceLines.flatMap((line,i)=>line.trim()&&!line.trim().startsWith('#')?[i+1]:[]);
    assert.deepEqual(mapping.lines.map(line=>line.line),executable,`${name} maps every executable line`);
    for(const line of mapping.lines) {
      assert.equal(line.code.trim(),sourceLines[line.line-1].trim(),`${name}:${line.line} source identity`);
      assert.ok(line.operation.trim(),`${name}:${line.line} explains the operation`);
    }
  }
  const raw = csv(source), records = RHC.readRhc(source), fit = RHC.prepareRhc(records);
  const counts = Array(8).fill(0);
  for (const r of raw) counts[4 * +(r.sex === 'Male') + 2 * +(r.swang1 === 'RHC') + +(r.dth30 === 'Yes')]++;
  assert.equal(raw.length, 5735);
  assert.equal(createHash('sha256').update(source).digest('hex'), '9ef4ab578be4b40ad5d97d3a7e08ffdc1f9f76aeeefee51b4996e4221556f8e8');
  assert.deepEqual(counts, [1143, 494, 558, 348, 1320, 594, 796, 482]);
  const mu=1918/5735, t=.1, py=[1-mu,mu], pt=py.map((v,i)=>(1-t)*v+t*i), mut=pt[1], supportD=[-mu,1-mu];
  const actualY=raw.map(r=>+(r.dth30==='Yes'));
  const stageSpecs=[
    ['source','zero',{y:actualY}],
    ['fit','zero',{'g_fit$coefficients':fit.gFit.beta,'q_fit$coefficients':fit.qFit.beta}],
    ...['one','zero','observed'].map(scenario=>['predict','zero',{[scenario==='observed'?'qa':scenario==='one'?'q1':'q0']:scenario==='observed'?records.map((r,i)=>r.a?fit.q1[i]:fit.q0[i]):fit[scenario==='one'?'q1':'q0']},scenario]),
    ['select','zero',{qa:records.map((r,i)=>r.a?fit.q1[i]:fit.q0[i])}],
    ['estimate','zero',{initial_estimate:[fit.initialEstimate]}],
    ['patient-mean','one',{events:[1918],risk:[mu]}],
    ['weighted-mean','one',{support_y:[0,1],p:py,mu:[mu]}],
    ['reweight','one',{point:[0,1],p_t:pt}],
    ['changed-mean','one',{mu_t:[mut],delta:[mut-mu]}],
    ...['change-rate','linear-mean'].map(stage=>[stage,'one',{derivative:[1-mu],rate:[1-mu],linear_mean:[mut]}]),
    ...['lookup-rate','lookup-if'].map(stage=>[stage,'one',{support_D:supportD,derivative:[1-mu]}]),
    ['patient-if','one',{influence:actualY.map(y=>y-mu)}],
    ['mean-if','one',{mean_influence:[0]}],
    ['grouped-centre','one',{support_D:supportD,grouped_mean_D:[0]}],
    ['old-new','one',{old_mean_D:[mut-mu],new_support_D:[-mut,1-mut],new_mean_D:[0]}],
    ['survival','one',{alive:actualY.map(y=>1-y),survival:[1-mu],survival_influence:actualY.map(y=>mu-y)}],
  ];
  assert.deepEqual([...new Set(stageSpecs.map(([stage])=>stage))].sort(),[...Object.keys(R_STAGE_CODE),'predict'].sort(),'every R object stage has a real-R execution');
  const stageRCode=stageSpecs.map(([stage,environment,outputs,scenario],i)=>
    `eval(parse(text=${JSON.stringify(rStageCode(stage,scenario))}),envir=${environment})\n`+
    Object.keys(outputs).map(name=>`emit("stage_${i}_${name}",eval(parse(text=${JSON.stringify(name)}),envir=${environment}))`).join('\n')).join('\n');
  const rcode = String.raw`
options(warn=2)
cat("#Runtime ",R.version.string,"\n",sep="")
source("shared/R/RHCCase.R")
emit <- function(key, value) {
  if (is.logical(value)) value <- as.integer(value)
  stopifnot(is.numeric(value), all(is.finite(value)))
  cat("@", key, "\t", length(value), "\t", paste(sprintf("%.17g", value), collapse="\t"), "\n", sep="")
}
fails <- function(expr) inherits(tryCatch({force(expr); NULL}, error=function(e)e), "error")
rows <- read_rhc_rows()
data <- rhc_data()
fit <- prepare_full(rows)
emit("counts", rhc_counts(rows)$n)
emit("raw", c(nrow(rows), ncol(rows), sum(rows$dth30=="Yes"), sum(rows$swang1=="RHC"), sum(rows$sex=="Male")))
emit("design_dim", dim(fit$design))
emit("design", as.vector(t(fit$design)))
emit("age", c(fit$age_mean, fit$age_sd))
emit("g_beta", fit$g_fit$coefficients)
emit("q_beta", fit$q_fit$coefficients)
for (name in c("a","y","g","q0","q1","h")) emit(paste0("fit_", name), fit[[name]])
emit("convergence", c(fit$g_fit$converged, fit$q_fit$converged, fit$g_fit$score_maximum, fit$q_fit$score_maximum))
emit("mean", c(mean_if(data)$risk, mean_if(data)$mean))
emit("canonical", eif_values(data$empirical_model, data$cells))
moments <- if_variance(data)
emit("moments", c(moments$mean,moments$second_moment,moments$variance,moments$se))
p <- data$cells$p
for (i in seq_len(15)) {
  h <- if (i <= 8) as.numeric(seq_len(8)==i)-p else as.numeric(seq_len(8)==(i-8))-as.numeric(seq_len(8)==8)
  direction <- direction_check(data, h/p)
  emit(paste0("direction_",i), c(direction$finite_difference,direction$pairing))
}
projection <- projection_demo(data,b=2)
for (name in c("canonical","u","candidate","projection","residual")) emit(paste0("projection_",name),projection[[name]])
emit("projection_moments", c(projection$candidate_second_moment,projection$projection_second_moment,projection$residual_second_moment))
case_root <- solve_case(data)
emit("case_root",c(case_root$epsilon,case_root$estimate,case_root$score,case_root$eif_mean,case_root$se,case_root$converged))
root <- solve_full(fit)
emit("full_root",c(root$epsilon,root$estimate,root$score,root$eif_mean,root$se,root$risk0,root$risk1,root$converged))
for (epsilon in c(0,.003,.00357696666)) {
  prefix <- paste0("trace_",sprintf("%.11f",epsilon),"_")
  Sys.setenv(TMLE_EPSILON=sprintf("%.17g",epsilon))
  env <- new.env(parent=globalenv())
  invisible(capture.output(source("zh/R/tmle_trace.R", local=env)))
  for (name in c("a","y","g","q0","q1","qa","offset","offset0","offset1","h0","h1","h","shift","shift0","shift1","eta","eta0","eta1","qstar_a","residual","score_contribution","qstar0","qstar1","contrast","centred","eif")) emit(paste0(prefix,name),env[[name]])
  emit(paste0(prefix,"summary"),c(env$n,env$epsilon,env$psi,env$score_mean,env$eif_mean))
}
for (epsilon in c(-.01,0,.003,.01)) {
  low <- full_at(fit,epsilon-1e-5); at <- full_at(fit,epsilon); high <- full_at(fit,epsilon+1e-5)
  emit(paste0("fd_",epsilon),c((high$log_likelihood-low$log_likelihood)/2e-5,at$score,(high$score-low$score)/2e-5,at$slope))
}
emit("invalid",c(fails(full_at(fit,1000)),fails(full_at(fit,NaN)),fails(linear_path(p,rep(1,8),.01)),fails(weighted_inner(p,1:7,1:8)),fails(fit_logistic(matrix(1,10,2),rep(c(0,1),5)))))
analytic <- fit_logistic(cbind(1,rep(0:1,each=4)),c(1,0,0,0,1,1,1,0))
emit("analytic_beta",analytic$coefficients)
emit("analytic_probability",analytic$probabilities)
bad <- fit; bad$g <- bad$g[-1]
bad2 <- fit; bad2$q0 <- bad2$q0[1]
emit("recycling",c(fails(full_at(bad,0)),fails(full_at(bad2,0))))
bad_age <- rows; bad_age$age[1] <- "NA"
bad_race <- rows; bad_race$race[1] <- "unknown"
bad_history <- rows; bad_history$chfhx[1] <- ""
emit("missingness",c(fails(prepare_full(bad_age)),fails(prepare_full(bad_race)),fails(prepare_full(bad_history))))
fixture_a <- rep(0:1,each=4)
fixture <- list(n=8,a=fixture_a,y=rep(0:1,4),g=rep(.5,8),q0=rep(.6,8),q1=rep(.8,8),h=ifelse(fixture_a==1,2,-2))
negative <- solve_full(fixture,lo=-.5,hi=.5)
emit("negative_root",c(negative$epsilon,negative$estimate,negative$score,negative$converged))
changed <- rows; changed$dth30[1] <- "Yes"
emit("changed_outcome",solve_full(prepare_full(changed))$estimate)
zero <- new.env(parent=globalenv()); invisible(capture.output(source("zh/R/ch00.R",local=zero)))
one <- new.env(parent=globalenv()); invisible(capture.output(source("zh/R/ch01.R",local=one)))
${stageRCode}
`;
  const execution = spawnSync(rscript, ['--vanilla', '-'], {
    cwd: root, input: rcode, encoding: 'utf8', maxBuffer: 40 * 1024 * 1024, timeout: 120000,
  });
  assert.equal(execution.error, undefined, String(execution.error));
  assert.equal(execution.status, 0, `R failed:\n${execution.stderr}\n${execution.stdout.slice(-3000)}`);
  const out = new Map();
  for (const line of execution.stdout.split('\n').filter(x => x.startsWith('@'))) {
    const [key, length, ...values] = line.slice(1).split('\t');
    assert.equal(values.length, Number(length), `${key} serialisation length`);
    assert.ok(!out.has(key), `Duplicate emitted key ${key}`);
    out.set(key, values.map(Number));
  }
  const get = key => {assert.ok(out.has(key), `Missing R result ${key}`); return out.get(key);};
  vector(get('counts'), counts, 0, 'raw CSV counts');
  vector(get('raw'), [5735,63,1918,2184,3192], 0, 'raw counts');
  vector(get('design_dim'), [5735,17], 0, 'design dimensions');
  vector(get('design'), fit.X.flat(), 2e-12, 'entire ordered design');
  vector(get('age'), [fit.ageMean,fit.ageSd], 2e-12, 'population age moments');
  vector(get('g_beta'), fit.gFit.beta, 2e-10, 'propensity coefficients');
  vector(get('q_beta'), fit.qFit.beta, 2e-10, 'outcome coefficients');
  for (const key of ['a','y','g','q0','q1','h']) vector(get(`fit_${key}`), key === 'a' || key === 'y' ? records.map(r=>r[key]) : fit[key === 'h' ? 'H' : key], 2e-10, `full fit ${key}`);
  const convergence = get('convergence');
  vector(convergence.slice(0,2), [1,1], 0, 'converged fits');
  assert.ok(convergence[2] < 1e-10 && convergence[3] < 1e-10);
  const rDesign = get('design'), rg = get('fit_g'), rq0 = get('fit_q0'), rq1 = get('fit_q1');
  const ay = raw.map(r => [+(r.swang1==='RHC'),+(r.dth30==='Yes')]);
  for (let j=0;j<18;j++) {
    if(j<17) near(mean(ay.map(([a],i)=>rDesign[17*i+j]*(a-rg[i]))),0,1e-10,`independent g score ${j}`);
    near(mean(ay.map(([a,y],i)=>(j===17?a:rDesign[17*i+j])*(y-(a?rq1[i]:rq0[i])))),0,1e-10,`independent Q score ${j}`);
  }
  vector(get('mean'),[1918/5735,0],2e-14,'mean IF');
  const p=counts.map(n=>n/5735), cells=counts.map((n,i)=>({x:i>>2,a:(i>>1)%2,y:i%2,n}));
  // Rebuild the standardisation functional directly from perturbed cell masses.
  const target = mass => [0,1].reduce((s,x)=>{
    const group = cells.map((c,i)=>({...c,p:mass[i]})).filter(c=>c.x===x);
    const px=group.reduce((s,c)=>s+c.p,0);
    const risk=a=>group.filter(c=>c.a===a).reduce((s,c)=>s+c.p*c.y,0)/group.filter(c=>c.a===a).reduce((s,c)=>s+c.p,0);
    return s+px*(risk(1)-risk(0));
  },0);
  const D=get('canonical');
  for(let i=0;i<15;i++) {
    const h=p.map((v,j)=>i<8?+(j===i)-v:+(j===i-8)-+(j===7));
    const delta=1e-6, fd=(target(p.map((v,j)=>v+delta*h[j]))-target(p.map((v,j)=>v-delta*h[j])))/(2*delta);
    const [rfd,pairing]=get(`direction_${i+1}`);
    near(rfd,fd,2e-8,`independent direction ${i+1}`);
    near(pairing,inner(p,D,h.map((v,j)=>v/p[j])),2e-12,'pairing');
    near(pairing,fd,2e-8,'derivative pairing');
  }
  const moments=CASE.caseEmpiricalMoments();
  vector(get('moments'),[moments.eifMean,moments.eifSecondMoment,moments.eifVariance,moments.se],2e-12,'moments');
  const projection=CASE.caseProjection(undefined,2);
  for(const [rkey,jkey] of [['canonical','D'],['u','treatmentPart'],['candidate','candidate'],['projection','projected'],['residual','removed']]) vector(get(`projection_${rkey}`),projection[jkey],2e-12,`projection ${rkey}`);
  const pm=get('projection_moments'); near(pm[0],pm[1]+pm[2],2e-12,'Pythagorean identity');
  near(inner(p,get('projection_residual'),get('projection_projection')),0,2e-12,'projection orthogonality');
  const maleMass=p.slice(4).reduce((s,v)=>s+v,0), basis=[cells.map(c=>c.x-maleMass)];
  for(let x=0;x<2;x++) for(let a=0;a<2;a++) {
    const members=cells.map((c,i)=>({...c,p:p[i]})).filter(c=>c.x===x&&c.a===a);
    const risk=members.reduce((s,c)=>s+c.p*c.y,0)/members.reduce((s,c)=>s+c.p,0);
    basis.push(cells.map(c=>c.x===x&&c.a===a?c.y-risk:0));
  }
  for(let j=0;j<basis.length;j++) near(inner(p,get('projection_residual'),basis[j]),0,2e-12,`independent basis orthogonality ${j+1}`);
  const caseRoot=CASE.solveCase();
  vector(get('case_root'),[caseRoot.epsilon,caseRoot.estimate,caseRoot.score,caseRoot.eifMean,caseRoot.se,1],2e-10,'eight-cell root');
  const fullRoot=RHC.solveRhc(fit);
  vector(get('full_root'),[fullRoot.epsilon,fullRoot.estimate,fullRoot.score,fullRoot.eifMean,fullRoot.se,mean(fullRoot.updated0),mean(fullRoot.updated1),1],2e-10,'full root');
  let traceEntries=0;
  for(const epsilon of [0,.003,.00357696666]) {
    const prefix=`trace_${epsilon.toFixed(11)}_`, trace=tmleTrace(fit,epsilon);
    assert.equal(Object.keys(trace.vectors).length,26);
    for(const [name,values] of Object.entries(trace.vectors)) {vector(get(prefix+name),values,2e-10,`${prefix}${name}`);traceEntries+=values.length;}
    vector(get(prefix+'summary'),[5735,epsilon,trace.summary.estimate,trace.summary.score,trace.summary.eif_mean],2e-10,'trace summary');
    const q0=get(prefix+'qstar0'),q1=get(prefix+'qstar1'), eif=get(prefix+'eif'),residual=get(prefix+'score_contribution');
    const contrast=q1.map((q,i)=>q-q0[i]),estimate=mean(contrast),centred=contrast.map(q=>q-estimate),em=mean(eif);
    // Variance includes covariance; empirical residual and contrast need not be orthogonal.
    const rmean=mean(residual), rv=mean(residual.map(v=>(v-rmean)**2)), cv=mean(centred.map(v=>v*v));
    const covariance=mean(residual.map((v,i)=>(v-rmean)*centred[i]));
    near(mean(eif.map(v=>(v-em)**2)),rv+cv+2*covariance,2e-12,'variance covariance decomposition');
    near(mean(eif),mean(residual),2e-12,'empirical EIF equation');
    for(let i=0;i<5735;i++) {
      const [a,y]=ay[i],h=a?1/rg[i]:-1/(1-rg[i]),qa=a?rq1[i]:rq0[i];
      near(q0[i],expit(logit(rq0[i])-epsilon/(1-rg[i])),2e-12,'independent q0');
      near(q1[i],expit(logit(rq1[i])+epsilon/rg[i]),2e-12,'independent q1');
      near(eif[i],h*(y-expit(logit(qa)+epsilon*h))+contrast[i]-estimate,2e-12,'independent EIF');
    }
  }
  for(const epsilon of [-.01,0,.003,.01]) {const [llfd,score,sfd,slope]=get(`fd_${epsilon}`);near(llfd,score,1e-8,'likelihood derivative');near(sfd,slope,1e-8,'score derivative');assert.ok(slope<0);}
  vector(get('invalid'),[1,1,1,1,1],0,'explicit invalid-input errors');
  vector(get('analytic_beta'),[-Math.log(3),2*Math.log(3)],2e-10,'independently solved logistic coefficients');
  vector(get('analytic_probability'),[.25,.25,.25,.25,.75,.75,.75,.75],2e-10,'independently solved logistic risks');
  vector(get('recycling'),[1,1],0,'R recycling is rejected');
  vector(get('missingness'),[1,1,1],0,'invalid source inputs cannot be imputed or dropped');
  vector(get('negative_root'),[(logit(.6)-logit(.8))/4,0,0,1],2e-10,'negative targeting root');
  assert.ok(Math.abs(get('changed_outcome')[0]-get('full_root')[1])>1e-6,'observed outcome changes must alter the fitted answer');
  stageSpecs.forEach(([stage,,outputs],i)=>{for(const [name,expected] of Object.entries(outputs)) vector(get(`stage_${i}_${name}`),expected,2e-10,`executable ${stage} ${name}`);});
  for (const filename of [...Array.from({length:9},(_,i)=>`ch${String(i).padStart(2,'0')}.R`),'tmle_trace.R']) {
    const lesson=resolve(root,'zh/R',filename);
    const result=spawnSync(rscript,['--vanilla',lesson],{cwd:tmpdir(),encoding:'utf8',timeout:60000,maxBuffer:2*1024*1024});
    assert.equal(result.error,undefined,`${filename}: ${result.error}`);
    assert.equal(result.status,0,`${filename} from outside repository:\n${result.stderr}\n${result.stdout}`);
    assert.ok(result.stdout.trim().length>0,`${filename} reports its computed result`);
  }
  const runtime=execution.stdout.split('\n').find(line=>line.startsWith('#Runtime '))?.slice(9) || 'R';
  console.log(`${runtime}: PASS; ${assertions.toLocaleString('en-GB')} numeric assertions; ${traceEntries.toLocaleString('en-GB')} trace entries (26 columns × 5,735 rows × 3 epsilon values).`);
  console.log('Verified original CSV counts/hash, full ordered design, all coefficients/predictions, score equations, 15 directions, projection, covariance, moments, both targeting roots, and finite differences. Browser behaviour is outside this harness.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
