import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRhc,prepareRhc} from '../shared/js/rhc.js';
import {correctionBridge} from '../shared/js/eif-correction.js';
import {targetComparison} from '../shared/js/target-comparison.js';
const near=(a,b,t=1e-12)=>assert(Number.isFinite(a)&&Math.abs(a-b)<t,`${a} != ${b}`);
const fit=prepareRhc(readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8')));

test('same RHC rows distinguish augmented summands from bounded updated probability predictions',()=>{
 const bridge=correctionBridge(fit),snapshot=JSON.stringify(bridge),out=targetComparison(bridge);
 assert.equal(out.n,5735);assert.equal(out.rows.length,5735);assert.deepEqual(out.shown.map(r=>r.row),[1,2,3,4,5,6]);
 // Independently recomputed by the reviewer from the existing fitting kernel.
 const oracle={initial:[.30176382259742274,.38826267849975415],aipw:[.30412885976038406,.394096854969483],tmle:[.3005830449692062,.39056276970451126]};
 for(const key of Object.keys(oracle))for(const a of [0,1])near(out.means[key][a],oracle[key][a]);
 near(out.shown[0].z0,-.12377799052860222);near(out.shown[1].z1,-.1957527094804618);near(out.shown[4].z1,1.8046933000675585);
 assert.deepEqual(out.countsOutside,[3551,2184]);assert.deepEqual(out.domain,{min:-1,max:2});
 for(let i=0;i<fit.n;i++){
  const r=out.rows[i];assert.equal(r.a,fit.rows[i].a);assert.equal(r.y,fit.rows[i].y);assert.equal(r.g,fit.g[i]);
  assert(r.star0>0&&r.star0<1&&r.star1>0&&r.star1<1);
  if(r.a===0)near(r.z1,r.q1);else near(r.z0,r.q0);
 }
 assert.equal(JSON.stringify(bridge),snapshot);assert.equal(out.trueTarget,null);assert.equal(out.trueErrors,null);
});

test('targeting the contrast does not set the two arm residual means individually to zero',()=>{
 const out=targetComparison(correctionBridge(fit));
 near(out.updatedCorrections[1],.00354669331079811);near(out.updatedCorrections[0],.00354669331113840);
 assert(out.updatedCorrections.every(c=>Math.abs(c)>.003));near(out.updatedResidualDifference,0);
 near(out.estimates.updatedAipw,out.estimates.tmle);near(out.gap,.00001172952620615);
 assert(Math.abs(out.pluginShift-out.initialCorrection)>1e-6,'plugin shift is not exactly the initial residual correction');
});

test('an independent hand-calculated boundary fixture leaves direct AIPW outside while TMLE predictions remain probabilities',()=>{
 const g=.05,fixture={n:4,rows:[{a:0,y:0},{a:0,y:1},{a:1,y:0},{a:1,y:1}],g:Array(4).fill(g),q0:Array(4).fill(.2),q1:Array(4).fill(.2),H:[-1/(1-g),-1/(1-g),1/g,1/g]};
 const out=targetComparison(correctionBridge(fixture));
 // Each arm has observed death fraction1/2. Initial model has both risks1/5.
 near(out.means.aipw[1],3.2);near(out.means.aipw[0],.2+.3/(2*.95));
 assert(out.estimates.aipw>1);assert(out.estimates.tmle>=-1&&out.estimates.tmle<=1);
 assert(out.rows.every(r=>r.star0>0&&r.star0<1&&r.star1>0&&r.star1<1));
 for(const invalid of [null,{}, {n:1,stages:[]}])assert.throws(()=>targetComparison(invalid));
 const bridge=correctionBridge(fixture);bridge.stages.find(s=>s.key==='tmle').rows[0].g=.6;
 assert.throws(()=>targetComparison(bridge),/retain A\/Y\/g/);
});
