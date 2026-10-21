import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parsePublicCsv,validatePublicRows,auditPublicRows,preparePublicEndpoint} from '../shared/js/public-rws.js';
const raw=await readFile('shared/data/public/ng-2021-nsclc/source.csv');
const rows=parsePublicCsv(raw.toString('utf8'));
test('public source checksum, original shape and attribution are frozen',async()=>{
 const p=JSON.parse(await readFile('shared/data/public/ng-2021-nsclc/provenance.json','utf8'));
 assert.equal(createHash('sha256').update(raw).digest('hex'),'5194dca457f8efac8cbd771f47dee06b3aabe3885923585cd8f0d452471fbd9d');
 assert.equal(raw.length,12469);assert.equal(rows.length,107);assert.equal(Object.keys(rows[0]).length,34);
 assert.equal(p.clinical_endpoint_admissible,false);assert(JSON.stringify(p).includes('10.1371/journal.pone.0253335'));assert(JSON.stringify(p).includes('CC BY'));
 assert.deepEqual(await readFile('dist/shared/data/public/ng-2021-nsclc/source.csv'),raw);
});
test('independently counted source facts are assertions, not causal endpoint labels',()=>{
 const a=auditPublicRows(rows);assert.equal(a.n,107);assert.deepEqual(a.byDrugCounts,{Afatinib:47,Erlotinib:33,Gefitinib:27});
 assert.equal(a.deathWithoutProgression,27);assert.equal(a.pfsExceedsFollowup,13);assert.equal(a.mutationNegative,1);
 assert.equal(a.provisionalPfsEarlyNoProgression,24);assert.equal(a.provisionalOsEarlyAlive,2);
 assert.equal(a.endpointAdmissible,false);assert.equal(a.endpointStatus,'unverified_time_status_pairing');
});
test('drug and horizon controls preserve raw records and never authorise endpoint construction',()=>{
 const before=JSON.stringify(rows),a=auditPublicRows(rows,{drug:'afatinib',horizon:12});
 assert.equal(a.n,47);assert.deepEqual(a.byDrugCounts,{Afatinib:47,Erlotinib:0,Gefitinib:0});
 assert.equal(a.provisionalPfsEarlyNoProgression,7);assert.equal(a.provisionalOsEarlyAlive,1);
 const early=auditPublicRows(rows,{horizon:3});assert.equal(early.provisionalOsEarlyAlive,0);assert.equal(early.endpointAdmissible,false);
 for(const h of [3,6,12,24,36]){assert.equal(auditPublicRows(rows,{horizon:h}).endpointAdmissible,false);assert.throws(()=>preparePublicEndpoint(rows,{horizon:h}),/not validated/);}
 assert.equal(JSON.stringify(rows),before);
});
test('source changes alter actual audit counts, no canned output',()=>{
 const modified=structuredClone(rows);modified[0].PFS_month='0.5';
 assert.equal(rows[0].PFS_month,'0.99');assert.equal(auditPublicRows(modified).pfsExceedsFollowup,12);
});
test('CSV parser handles quotes, escaped quotes, BOM, embedded newline and CRLF without recoding',()=>{
 assert.deepEqual(parsePublicCsv('\ufeffname,value\r\n"a,b","c""d"\r\n"e\nf",0\r\n'),[{name:'a,b',value:'c"d'},{name:'e\nf',value:'0'}]);
 for(const text of ['a,a\n1,2','a,b\n1','a,b\n"x,2','a,b\n"x"q,2','a,b\n1,2\n\n'])assert.throws(()=>parsePublicCsv(text));
});
test('invalid source values and filters fail instead of dropping or imputing records',()=>{
 for(const [key,value] of [['Group_S','drug A'],['Age',''],['ECOG','1.5'],['Progression','2'],['Death','NaN'],['Follow_up_month','-1'],['PFS_month','0'],['EGFR_S','']]){
  const modified=structuredClone(rows);modified[0][key]=value;assert.throws(()=>validatePublicRows(modified),key);
 }
 for(const horizon of [0,-1,Infinity,NaN,'12'])assert.throws(()=>auditPublicRows(rows,{horizon}));
 assert.throws(()=>auditPublicRows(rows,{drug:'B'}));assert.throws(()=>validatePublicRows([]));
});
