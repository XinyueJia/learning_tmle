const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
(async()=>{
 const root=join(__dirname,'..');
 const {readRhc,rhcCounts,prepareRhc,rhcAt,solveRhc}=await import('../shared/js/rhc.js');
 const rows=readRhc(readFileSync(join(root,'shared/data/public/rhc/source.csv'),'utf8'));
 const prepared=prepareRhc(rows),js=solveRhc(prepared),initial=rhcAt(prepared,0);
 // Include the actual Julia runner. Its shared module rereads the original CSV;
 // the machine-output harness contains no coefficients, counts or target answers.
 const expression=`
 include("zh/julia/rhc_case.jl")
 r=RHCCase.full_analysis()
 d=RHCCase.rhc_data()
 println("key,value")
 for (k,v) in ["n"=>r.fit.n,"events"=>sum(r.fit.y),"treated"=>sum(r.fit.a),
  "marginal_risk"=>sum(r.fit.y)/r.fit.n,"age_mean"=>r.fit.age_mean,"age_sd"=>r.fit.age_sd,
  "min_g"=>minimum(r.fit.g),"max_g"=>maximum(r.fit.g),
  "initial_estimate"=>r.initial.estimate,"score0"=>r.initial.score,"aipw"=>r.initial.aipw,
  "epsilon"=>r.targeted.epsilon,"risk0"=>r.targeted.risk0,"risk1"=>r.targeted.risk1,
  "estimate"=>r.targeted.estimate,"score"=>r.targeted.score,"slope"=>r.targeted.slope,
  "eif_mean"=>r.targeted.eif_mean,"variance"=>r.targeted.eif_variance,"se"=>r.targeted.se,
  "min_q"=>min(minimum(r.targeted.q0),minimum(r.targeted.q1)),
  "max_q"=>max(maximum(r.targeted.q0),maximum(r.targeted.q1)),"converged"=>Int(r.targeted.converged)]
  println(k,",",v)
 end
 for (i,c) in enumerate(d.cells);println("cell_",i,",",c.n);end
 for (i,v) in enumerate(r.fit.g_fit.coefficients);println("gcoef_",i,",",v);end
 for (i,v) in enumerate(r.fit.q_fit.coefficients);println("qcoef_",i,",",v);end
 for (i,v) in enumerate(r.fit.feature_names);println("feature_",i,",",v);end
 `;
 const output=execFileSync(process.env.JULIA_BIN||'julia',['--startup-file=no','--history-file=no','-e',expression],{cwd:root,encoding:'utf8',timeout:60000});
 const lines=output.trim().split(/\r?\n/);assert.equal(lines.shift(),'key,value');
 const julia=Object.fromEntries(lines.map(line=>{const [key,value]=line.split(',');return [key,key.startsWith('feature_')?value:Number(value)];}));
 const near=(actual,expected,label,tolerance=1e-9)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tolerance,`${label}: ${actual} != ${expected}`);
 const fixture=[1143,494,558,348,1320,594,796,482];
 assert.deepEqual(rhcCounts(rows).map(c=>c.n),fixture);
 fixture.forEach((n,i)=>assert.equal(julia[`cell_${i+1}`],n));
 const summaries={n:rows.length,events:rows.reduce((s,r)=>s+r.y,0),treated:rows.reduce((s,r)=>s+r.a,0),marginal_risk:1918/5735,
  age_mean:prepared.ageMean,age_sd:prepared.ageSd,min_g:Math.min(...prepared.g),max_g:Math.max(...prepared.g),
  initial_estimate:initial.estimate,score0:initial.score,aipw:prepared.aipw,epsilon:js.epsilon,
  risk0:js.updated0.reduce((s,v)=>s+v,0)/rows.length,risk1:js.updated1.reduce((s,v)=>s+v,0)/rows.length,
  estimate:js.estimate,score:js.score,slope:js.slope,eif_mean:js.eifMean,variance:js.variance,se:js.se,min_q:js.minQ,max_q:js.maxQ,converged:1};
 for(const [key,value] of Object.entries(summaries))near(julia[key],value,key);
 prepared.gFit.beta.forEach((v,i)=>near(julia[`gcoef_${i+1}`],v,`g coefficient ${i+1}`));
 prepared.qFit.beta.forEach((v,i)=>near(julia[`qcoef_${i+1}`],v,`Q coefficient ${i+1}`));
 prepared.featureNames.forEach((name,i)=>assert.equal(julia[`feature_${i+1}`],name));
 near(js.estimate,.08997972473530443,'JavaScript independent public-data reference',1e-11);
 near(julia.estimate,.08997972473530443,'Julia independent public-data reference',1e-11);
 assert.equal(julia.n,5735);assert.equal(julia.events,1918);assert.equal(julia.treated,2184);
 assert.ok(Math.abs(julia.score)<1e-12&&Math.abs(js.score)<1e-12);
 console.log(`PASS RHC raw-count and 17-feature Julia/JavaScript cross-check: n=${julia.n}, RD=${julia.estimate}, epsilon=${julia.epsilon}`);
 console.log(`PASS ${Object.keys(summaries).length} summaries, 8 observed cells, 35 coefficients and 17 feature names; independent RD fixture=0.08997972473530443`);
})().catch(error=>{console.error(error);process.exitCode=1;});
