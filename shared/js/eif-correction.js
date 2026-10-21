import {tmleTrace} from './tmle-trace.js';
import {solveRhc} from './rhc.js';
const average=xs=>xs.reduce((s,x)=>s+x,0)/xs.length;

/** Explicitly integrate the estimating function over a fitted Bernoulli law.
 * W has its observed empirical distribution. Each W atom has four possible
 * (A,Y) values, rather than retaining only the actually observed pair.
 */
export function fittedLawAverage(g,q0,q1,theta){
 if(![g,q0,q1].every(xs=>Array.isArray(xs)&&xs.length===g.length)||g.length===0||!Number.isFinite(theta))throw Error('Aligned probability vectors and finite candidate required');
 for(const xs of [g,q0,q1])for(const p of xs)if(!Number.isFinite(p)||p<=0||p>=1)throw Error('Fitted probabilities must be strictly between 0 and 1');
 const conditional=g.map((gi,i)=>{
  const cells=[];
  for(const a of [0,1])for(const y of [0,1]){
   const q=a?q1[i]:q0[i],pa=a?gi:1-gi,py=y?q:1-q,h=a?1/gi:-1/(1-gi);
   const mass=pa*py,residual=y-q,weightedResidual=h*residual,value=weightedResidual+q1[i]-q0[i]-theta;
   cells.push({a,y,pa,py,mass,h,q,residual,weightedResidual,value,weightedValue:mass*value});
  }
  return {row:i+1,cells,mass:cells.reduce((s,c)=>s+c.mass,0),residualMean:cells.reduce((s,c)=>s+c.mass*c.weightedResidual,0),mean:cells.reduce((s,c)=>s+c.weightedValue,0)};
 });
 return {n:g.length,conditional,mean:average(conditional.map(r=>r.mean)),residualMean:average(conditional.map(r=>r.residualMean))};
}

/** All versions use the same observed rows, initial g and empirical W.
 * Only AIPW changes theta alone. TMLE changes Q and then plugs it in.
 * U(theta) is called the fitted-law EIF only at theta=Psi(that law).
 */
export function correctionBridge(fit){
 const initial=tmleTrace(fit,0),target=solveRhc(fit),thetaA=initial.summary.aipw;
 const definitions=[['initial',0,null],['aipw',0,thetaA],['half',target.epsilon/2,null],['tmle',target.epsilon,null]];
 const stages=definitions.map(([key,epsilon,candidate])=>{
  const trace=epsilon===0?initial:tmleTrace(fit,epsilon);
  const q0=epsilon===0?[...fit.q0]:trace.vectors.qstar0,q1=epsilon===0?[...fit.q1]:trace.vectors.qstar1;
  const plugin=average(q1.map((q,i)=>q-q0[i])),theta=candidate===null?plugin:candidate;
  const rows=fit.rows.map((r,i)=>{
   const qa=r.a?q1[i]:q0[i],h=r.a?1/fit.g[i]:-1/(1-fit.g[i]),residual=r.y-qa,correction=h*residual,contrast=q1[i]-q0[i];
   return {row:i+1,a:r.a,y:r.y,x:r.x,age:r.age,g:fit.g[i],q0:q0[i],q1:q1[i],qa,h,residual,correction,contrast,theta,value:correction+contrast-theta};
  });
  const model=fittedLawAverage(fit.g,q0,q1,theta);
  return {key,epsilon,n:fit.n,theta,plugin,rows,empiricalMean:average(rows.map(r=>r.value)),residualMean:average(rows.map(r=>r.correction)),contrastMean:average(rows.map(r=>r.contrast)),modelMean:model.mean,modelResidualMean:model.residualMean,modelFirst:model.conditional[0],isCanonicalAtFittedLaw:key!=='aipw',qVersion:epsilon===0?'initial':key==='tmle'?'targeted':'intermediate',gVersion:'initial',wVersion:'empirical'};
 });
 return {n:fit.n,initial:initial.summary.initial_estimate,correction:initial.summary.initial_score,aipw:thetaA,tmle:target.estimate,epsilon:target.epsilon,tolerance:1e-12,stages,trueTarget:null,trueError:null};
}
