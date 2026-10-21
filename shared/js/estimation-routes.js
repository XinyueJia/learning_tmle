import {propensityBridge} from './propensity-bridge.js';
import {solveRhc} from './rhc.js';
const mean=xs=>xs.reduce((s,x)=>s+x,0)/xs.length;

/** Three explicit sex-only estimators; matching reads X/A and source order, never Y. */
export function estimationRoutes(rows){
 const base=propensityBridge(rows),{n,strata}=base;
 const q=[0,1].map(a=>strata.map(s=>rows.filter(r=>r.x===s.x&&r.a===a).reduce((sum,r)=>sum+r.y,0)/s.counts[a]));
 const patients=base.patients.map(r=>({...r,q0:q[0][r.x],q1:q[1][r.x],difference:q[1][r.x]-q[0][r.x],ipwContribution:(r.a?1:-1)*r.weightedY}));
 // Exact matching within each sex-specific propensity score, 1:1 without replacement.
 // RHC has different scores in the two strata. Original order breaks ties.
 const controls=strata.map(s=>patients.filter(r=>r.x===s.x&&r.a===0));
 const next=[0,0],pairs=[],unmatched=[];
 for(const treated of patients.filter(r=>r.a===1)){
  const control=controls[treated.x][next[treated.x]++];
  if(control)pairs.push({pair:pairs.length+1,treated,control,difference:treated.y-control.y});
  else unmatched.push(treated.rowNumber);
 }
 const matchedControlIds=new Set(pairs.map(p=>p.control.rowNumber));
 const targetCounts=strata.map(s=>pairs.filter(p=>p.treated.x===s.x).length);
 return {n,strata,q,patients,
  gcomp:{risk0:mean(patients.map(r=>r.q0)),risk1:mean(patients.map(r=>r.q1)),estimate:mean(patients.map(r=>r.difference)),targetCounts:base.targetCounts},
  ipw:{risk0:base.arms[0].ipwRisk,risk1:base.arms[1].ipwRisk,estimate:base.ipwDifference,targetCounts:base.targetCounts},
  psm:{pairs,m:pairs.length,unmatchedTreated:unmatched,unusedControls:patients.filter(r=>r.a===0&&!matchedControlIds.has(r.rowNumber)).map(r=>r.rowNumber),targetCounts,
   risk1:pairs.length?mean(pairs.map(p=>p.treated.y)):null,risk0:pairs.length?mean(pairs.map(p=>p.control.y)):null,
   estimate:pairs.length?mean(pairs.map(p=>p.difference)):null,
   rule:'sex-specific propensity, 1:1, without replacement, source-order tie breaking'},
 };
}

/** Preview the existing full-W AIPW and TMLE; no new fit or changed observations. */
export function qgCombination(fit){
 const tmle=solveRhc(fit);
 const rows=fit.rows.map((r,i)=>{
  const qa=r.a?fit.q1[i]:fit.q0[i],residual=r.y-qa,weight=r.a?1/fit.g[i]:-1/(1-fit.g[i]);
  return {rowNumber:i+1,a:r.a,y:r.y,g:fit.g[i],q0:fit.q0[i],q1:fit.q1[i],qa,residual,weight,weightedResidual:weight*residual,updated0:tmle.updated0[i],updated1:tmle.updated1[i]};
 });
 const correction=mean(rows.map(r=>r.weightedResidual));
 return {n:fit.n,rows,initial:fit.initialEstimate,correction,aipw:fit.initialEstimate+correction,tmle:tmle.estimate,epsilon:tmle.epsilon,score:tmle.score};
}
