const mean=values=>values.reduce((s,v)=>s+v,0)/values.length;
const range=values=>({min:Math.min(...values),max:Math.max(...values)});
const bounded=p=>Number.isFinite(p)&&p>0&&p<1;

/** Compare two complete routes from the SAME initial fit. Z_a is a summand,
 * not a probability prediction; Q*_a is the updated conditional probability.
 * This adapter never changes observations, fits or the targeting algorithm.
 */
export function targetComparison(bridge){
 const n=bridge?.n,initial=bridge?.stages?.find(s=>s.key==='initial'),target=bridge?.stages?.find(s=>s.key==='tmle');
 if(!Number.isSafeInteger(n)||n<1||initial?.rows?.length!==n||target?.rows?.length!==n)throw Error('Complete aligned initial and targeted stages required');
 const rows=initial.rows.map((r,i)=>{
  const t=target.rows[i];
  if(r.row!==i+1||t.row!==r.row||r.a!==t.a||r.y!==t.y||r.g!==t.g||![0,1].includes(r.a)||![0,1].includes(r.y)||
    ![r.g,r.q0,r.q1,t.q0,t.q1].every(bounded))throw Error('Initial and targeted rows must retain A/Y/g and valid probabilities');
  const augmentation0=(1-r.a)/(1-r.g)*(r.y-r.q0),augmentation1=r.a/r.g*(r.y-r.q1);
  const updatedCorrection0=(1-r.a)/(1-r.g)*(r.y-t.q0),updatedCorrection1=r.a/r.g*(r.y-t.q1);
  return {row:r.row,a:r.a,y:r.y,g:r.g,q0:r.q0,q1:r.q1,z0:r.q0+augmentation0,z1:r.q1+augmentation1,
   star0:t.q0,star1:t.q1,augmentation0,augmentation1,updatedCorrection0,updatedCorrection1,
   updatedZ0:t.q0+updatedCorrection0,updatedZ1:t.q1+updatedCorrection1};
 });
 const means={initial:[mean(rows.map(r=>r.q0)),mean(rows.map(r=>r.q1))],
  aipw:[mean(rows.map(r=>r.z0)),mean(rows.map(r=>r.z1))],
  tmle:[mean(rows.map(r=>r.star0)),mean(rows.map(r=>r.star1))],
  updatedAipw:[mean(rows.map(r=>r.updatedZ0)),mean(rows.map(r=>r.updatedZ1))]};
 const estimates=Object.fromEntries(Object.entries(means).map(([key,values])=>[key,values[1]-values[0]]));
 const updatedCorrections=[mean(rows.map(r=>r.updatedCorrection0)),mean(rows.map(r=>r.updatedCorrection1))];
 const vectors=['q0','q1','z0','z1','star0','star1'];
 const ranges=Object.fromEntries(vectors.map(key=>[key,range(rows.map(r=>r[key]))]));
 const shown=rows.slice(0,6),shownValues=shown.flatMap(r=>vectors.map(key=>r[key]));
 const domain={min:Math.min(0,Math.floor(Math.min(...shownValues))),max:Math.max(1,Math.ceil(Math.max(...shownValues)))};
 return {n,rows,shown,means,estimates,ranges,domain,epsilon:target.epsilon,
  initialCorrection:mean(rows.map(r=>r.augmentation1-r.augmentation0)),
  updatedCorrections,updatedResidualDifference:updatedCorrections[1]-updatedCorrections[0],
  gap:estimates.tmle-estimates.aipw,pluginShift:estimates.tmle-estimates.initial,
  countsOutside:[0,1].map(a=>rows.filter(r=>r['z'+a]<0||r['z'+a]>1).length),
  trueTarget:null,trueErrors:null};
}
