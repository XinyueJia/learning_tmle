import {parsePublicCsv} from './public-rws.js';
import {expit,logit} from './math.js';
export const HISTORY=['cardiohx','chfhx','dementhx','psychhx','chrpulhx','renalhx','liverhx','gibledhx','malighx','immunhx','transhx','amihx'];
export const FEATURE_NAMES=['intercept','male','age_z','race_black','race_other',...HISTORY];
export function readRhc(text){
 const rows=parsePublicCsv(text.replace(/^\uFEFF/,'').replace(/^""(?=,)/,'"source_row"'));
 const number=(r,k)=>{if(!r[k]?.trim()||!Number.isFinite(Number(r[k])))throw Error(`Invalid ${k}`);return Number(r[k]);};
 return rows.map(r=>{
  if(!['Female','Male'].includes(r.sex)||!['No RHC','RHC'].includes(r.swang1)||!['No','Yes'].includes(r.dth30)||!['white','black','other'].includes(r.race))throw Error('Unknown RHC category');
  const age=number(r,'age');if(age<18||age>120)throw Error('Unexpected age');
  const history=HISTORY.map(k=>{const v=number(r,k);if(![0,1].includes(v))throw Error(`Invalid ${k}`);return v;});
  return {x:r.sex==='Male'?1:0,a:r.swang1==='RHC'?1:0,y:r.dth30==='Yes'?1:0,age,race:r.race,history};
 });
}
export function rhcCounts(rows){
 if(!rows.length)throw Error('RHC records required');
 return Array.from({length:8},(_,i)=>({x:i>>2,a:(i>>1)%2,y:i%2,n:rows.filter(r=>r.x===(i>>2)&&r.a===(i>>1)%2&&r.y===i%2).length}));
}
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const softplus=z=>Math.max(z,0)+Math.log1p(Math.exp(-Math.abs(z)));
function linearSolve(matrix,rhs){
 const m=matrix.map((row,i)=>[...row,rhs[i]]),n=rhs.length;
 for(let j=0;j<n;j++){
  let pivot=j;for(let k=j+1;k<n;k++)if(Math.abs(m[k][j])>Math.abs(m[pivot][j]))pivot=k;
  if(Math.abs(m[pivot][j])<1e-12)throw Error('Singular logistic design; no silent regularisation');
  [m[j],m[pivot]]=[m[pivot],m[j]];
  for(let k=j+1;k<n;k++){const f=m[k][j]/m[j][j];for(let l=j;l<=n;l++)m[k][l]-=f*m[j][l];}
 }
 const b=Array(n).fill(0);for(let j=n-1;j>=0;j--)b[j]=(m[j][n]-m[j].slice(j+1,n).reduce((s,v,k)=>s+v*b[j+1+k],0))/m[j][j];return b;
}
export function logisticFit(X,y){
 const n=y.length,p=X[0].length;
 if(!n||X.length!==n||X.some(r=>r.length!==p||r.some(v=>!Number.isFinite(v)))||y.some(v=>![0,1].includes(v)))throw Error('Invalid logistic inputs');
 const average=y.reduce((s,v)=>s+v,0)/n;if(!(average>0&&average<1))throw Error('Both outcome classes required');
 const gram=Array.from({length:p},(_,j)=>Array.from({length:p},(_,k)=>X.reduce((s,row)=>s+row[j]*row[k]/n,0)));
 linearSolve(gram,Array(p).fill(0)); // fail explicitly for rank deficiency even if the initial score is zero
 let beta=Array(p).fill(0);beta[0]=logit(average);
 const loss=b=>X.reduce((s,r,i)=>{const z=dot(r,b);return s+softplus(z)-y[i]*z;},0)/n;
 for(let iterations=1;iterations<=80;iterations++){
  const gradient=Array(p).fill(0),hessian=Array.from({length:p},()=>Array(p).fill(0));
  for(let i=0;i<n;i++){const q=expit(dot(X[i],beta)),w=q*(1-q),res=y[i]-q;for(let j=0;j<p;j++){gradient[j]+=X[i][j]*res/n;for(let k=0;k<p;k++)hessian[j][k]+=X[i][j]*X[i][k]*w/n;}}
  const maxScore=Math.max(...gradient.map(Math.abs));
  if(maxScore<1e-10)return {beta,iterations,converged:true,maxScore,predictions:X.map(r=>expit(dot(r,beta)))};
  const delta=linearSolve(hessian,gradient),current=loss(beta);let step=1,accepted=false;
  while(step>=2**-24){const trial=beta.map((v,j)=>v+step*delta[j]);if(loss(trial)<=current+1e-14){beta=trial;accepted=true;break;}step/=2;}
  if(!accepted)throw Error('Logistic line search failed');
 }
 throw Error('Logistic fit did not converge');
}
export function prepareRhc(rows){
 const n=rows.length;if(!n)throw Error('Empty cohort');
 const ageMean=rows.reduce((s,r)=>s+r.age,0)/n,ageSd=Math.sqrt(rows.reduce((s,r)=>s+(r.age-ageMean)**2,0)/n);
 const X=rows.map(r=>[1,r.x,(r.age-ageMean)/ageSd,+(r.race==='black'),+(r.race==='other'),...r.history]);
 const gFit=logisticFit(X,rows.map(r=>r.a));
 const qFit=logisticFit(X.map((x,i)=>[...x,rows[i].a]),rows.map(r=>r.y));
 const g=gFit.predictions;if(g.some(p=>!(p>0&&p<1)))throw Error('Estimated treatment probabilities on boundary; inspect overlap');
 const q0=X.map(x=>expit(dot([...x,0],qFit.beta))),q1=X.map(x=>expit(dot([...x,1],qFit.beta)));
 const H=rows.map((r,i)=>r.a?1/g[i]:-1/(1-g[i]));
 const initialEstimate=q1.reduce((s,q,i)=>s+q-q0[i],0)/n;
 const score=rows.reduce((s,r,i)=>s+H[i]*(r.y-(r.a?q1[i]:q0[i])),0)/n;
 return {rows,n,X,featureNames:[...FEATURE_NAMES],ageMean,ageSd,gFit,qFit,g,q0,q1,H,initialEstimate,initialScore:score,aipw:initialEstimate+score};
}
export function rhcAt(prepared,epsilon=0){
 if(!Number.isFinite(epsilon))throw Error('Finite epsilon required');
 const {rows,n,g,q0,q1,H}=prepared;
 const updated0=q0.map((q,i)=>expit(logit(q)-epsilon/(1-g[i]))),updated1=q1.map((q,i)=>expit(logit(q)+epsilon/g[i]));
 if([...updated0,...updated1].some(q=>!(q>0&&q<1)))throw Error('Targeting predictions reached a numerical probability boundary');
 const estimate=updated1.reduce((s,q,i)=>s+q-updated0[i],0)/n;
 const D=rows.map((r,i)=>H[i]*(r.y-(r.a?updated1[i]:updated0[i]))+updated1[i]-updated0[i]-estimate);
 const score=rows.reduce((s,r,i)=>s+H[i]*(r.y-(r.a?updated1[i]:updated0[i])),0)/n;
 const slope=-rows.reduce((s,r,i)=>{const q=r.a?updated1[i]:updated0[i];return s+H[i]**2*q*(1-q);},0)/n;
 const eifMean=D.reduce((s,v)=>s+v,0)/n,variance=D.reduce((s,v)=>s+(v-eifMean)**2,0)/n;
 return {epsilon,estimate,score,slope,eifMean,variance,se:Math.sqrt(variance/n),updated0,updated1,D,minQ:Math.min(...updated0,...updated1),maxQ:Math.max(...updated0,...updated1)};
}
export function solveRhc(prepared){
 let lo=-1,hi=1;
 for(let i=0;i<30&&(rhcAt(prepared,lo).score<0||rhcAt(prepared,hi).score>0);i++){if(rhcAt(prepared,lo).score<0)lo*=2;if(rhcAt(prepared,hi).score>0)hi*=2;}
 if(!(rhcAt(prepared,lo).score>=0&&rhcAt(prepared,hi).score<=0))throw Error('Cannot bracket targeting score');
 for(let iterations=1;iterations<=100;iterations++){
  const out=rhcAt(prepared,(lo+hi)/2);if(Math.abs(out.score)<1e-12)return {...out,converged:true,iterations};
  if(out.score>0)lo=out.epsilon;else hi=out.epsilon;
 }
 throw Error('TMLE targeting did not converge');
}
