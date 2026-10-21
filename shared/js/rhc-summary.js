/** Descriptive patient summaries; SD uses the sample denominator n - 1. */
export function summariseRhcPatients(rows){
 if(!Array.isArray(rows)||rows.length===0)throw new RangeError('RHC observations required');
 for(const r of rows)if(!r||![0,1].includes(r.a)||![0,1].includes(r.x)||![0,1].includes(r.y)||!Number.isFinite(r.age)||r.age<0)throw new TypeError('Invalid RHC summary observation');
 const summarise=group=>{
  const n=group.length,ageMean=n?group.reduce((sum,r)=>sum+r.age,0)/n:null;
  return {n,ageMean,ageSd:n>1?Math.sqrt(group.reduce((sum,r)=>sum+(r.age-ageMean)**2,0)/(n-1)):null,
   female:group.filter(r=>r.x===0).length,male:group.filter(r=>r.x===1).length,deaths:group.filter(r=>r.y===1).length};
 };
 return {all:summarise(rows),rhc:summarise(rows.filter(r=>r.a===1)),noRhc:summarise(rows.filter(r=>r.a===0))};
}
