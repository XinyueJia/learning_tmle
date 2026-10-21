const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {readFileSync}=require('node:fs');
(async()=>{
 const {parsePublicCsv,auditPublicRows}=await import('../shared/js/public-rws.js');
 const rows=parsePublicCsv(readFileSync('shared/data/public/ng-2021-nsclc/source.csv','utf8'));
 const keys={n:'n',death_without_progression:'deathWithoutProgression',pfs_exceeds_followup:'pfsExceedsFollowup',mutation_negative:'mutationNegative',provisional_pfs_early_no_progression:'provisionalPfsEarlyNoProgression',provisional_os_early_alive:'provisionalOsEarlyAlive'};
 for(const [drug,horizon,n,early] of [['all',12,107,2],['Afatinib',12,47,1],['all',3,107,0]]){
  const stdout=execFileSync(process.env.JULIA_BIN||'julia',['--startup-file=no','--history-file=no','zh/julia/public_data_audit.jl',drug,String(horizon)],{encoding:'utf8',timeout:60000});
  const values=Object.fromEntries([...stdout.matchAll(/([A-Za-z_]+)=([^\s]+)/g)].map(m=>[m[1],m[2]]));
  const js=auditPublicRows(rows,{drug,horizon});
  assert.equal(Number(values.n),n);assert.equal(Number(values.provisional_os_early_alive),early);
  for(const [jk,key] of Object.entries(keys))assert.equal(Number(values[jk]),js[key],`${drug}/${horizon} ${jk}`);
  for(const d of ['Afatinib','Erlotinib','Gefitinib'])assert.equal(Number(values['by_drug_'+d]),js.byDrugCounts[d]);
  assert.equal(values.endpoint_admissible,'false');assert.equal(js.endpointAdmissible,false);
  console.log(`PASS public Julia/JavaScript independent count fixtures: ${drug}, ${horizon} months, n=${n}, endpoint unverified`);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
