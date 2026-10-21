/** Sex-only, saturated propensity illustration; preserves the source order and observations. */
export function propensityBridge(rows) {
 if(!Array.isArray(rows)||!rows.length||rows.some(r=>!r||['x','a','y'].some(k=>![0,1].includes(r[k]))))throw Error('Non-empty binary X/A/Y observations required');
 const n=rows.length;
 const strata=[0,1].map(x=>{
  const subset=rows.filter(r=>r.x===x),nX=subset.length;
  const counts=[0,1].map(a=>subset.filter(r=>r.a===a).length);
  if(counts.some(count=>count===0))throw Error('Both treatments required in each sex stratum');
  return {x,n:nX,counts,g:counts[1]/nX};
 });
 const patients=rows.map((r,i)=>{
  const g=strata[r.x].g,pActual=r.a?g:1-g,weight=1/pActual;
  return {rowNumber:i+1,...r,g,pActual,weight,weightedY:weight*r.y};
 });
 const arms=[0,1].map(a=>{
  const observed=patients.filter(r=>r.a===a),counts=strata.map(s=>s.counts[a]);
  const mass=observed.reduce((s,r)=>s+r.weight,0),weightedEvents=observed.reduce((s,r)=>s+r.weightedY,0);
  return {a,n:observed.length,events:observed.reduce((s,r)=>s+r.y,0),counts,
   risk:observed.reduce((s,r)=>s+r.y,0)/observed.length,
   weightedCounts:strata.map(s=>s.counts[a]/(a?s.g:1-s.g)),mass,weightedEvents,ipwRisk:weightedEvents/n};
 });
 return {n,strata,patients,arms,targetCounts:strata.map(s=>s.n),
  crudeDifference:arms[1].risk-arms[0].risk,ipwDifference:arms[1].ipwRisk-arms[0].ipwRisk};
}
