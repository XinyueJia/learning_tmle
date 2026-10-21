import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRhc,prepareRhc} from '../shared/js/rhc.js';
import {correctionBridge,fittedLawAverage} from '../shared/js/eif-correction.js';
const near=(actual,expected,tol=1e-12)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<tol,`${actual} != ${expected}`);
const fixture=()=>({n:4,rows:[{a:0,y:0},{a:0,y:1},{a:1,y:0},{a:1,y:1}],g:[.5,.5,.5,.5],q0:[.25,.25,.25,.25],q1:[.75,.75,.75,.75],H:[-2,-2,2,2]});

test('fitted law enumerates four conditional outcomes with independently calculable masses',()=>{
 const law=fittedLawAverage([.5],[.25],[.75],.5),row=law.conditional[0];
 assert.deepEqual(row.cells.map(c=>[c.a,c.y]),[[0,0],[0,1],[1,0],[1,1]]);
 assert.deepEqual(row.cells.map(c=>c.mass),[.375,.125,.125,.375]);
 assert.deepEqual(row.cells.map(c=>c.weightedResidual),[.5,-1.5,-1.5,.5]);
 near(row.mass,1);near(law.mean,0);near(law.residualMean,0);
 near(fittedLawAverage([.5],[.25],[.75],0).mean,.5);
 for(const args of [[[],[],[],0],[null,[.25],[.75],0],[[0],[.25],[.75],0],[[1],[.25],[.75],0],[[.5],[0],[.75],0],[[.5],[.25],[],0],[[.5],[.25],[.75],NaN]])assert.throws(()=>fittedLawAverage(...args));
});

test('a single hand-calculable sample separates canonical EIF and the AIPW estimating function',()=>{
 const fit=fixture(),before=JSON.stringify(fit),out=correctionBridge(fit),[initial,aipw,half,tmle]=out.stages;
 near(initial.plugin,.5);near(initial.residualMean,-.5);near(initial.empiricalMean,-.5);near(initial.modelMean,0);
 assert.deepEqual(initial.rows.map(r=>r.value),[.5,-1.5,-1.5,.5]);
 near(aipw.theta,0);near(aipw.empiricalMean,0);near(aipw.modelMean,.5);near(aipw.plugin,.5);
 assert.equal(aipw.isCanonicalAtFittedLaw,false);assert.equal(initial.isCanonicalAtFittedLaw,true);
 for(let i=0;i<4;i++){
  near(aipw.rows[i].qa,initial.rows[i].qa);near(aipw.rows[i].g,initial.rows[i].g);
  near(aipw.rows[i].value-initial.rows[i].value,.5);
 }
 assert(Math.abs(half.empiricalMean)>.01);near(half.modelMean,0);near(tmle.empiricalMean,0);near(tmle.modelMean,0);
 near(tmle.epsilon,-Math.log(3)/2,1e-11);near(tmle.theta,0);
 for(const s of out.stages)for(let i=0;i<4;i++){assert.equal(s.rows[i].a,fit.rows[i].a);assert.equal(s.rows[i].y,fit.rows[i].y);near(s.rows[i].g,.5);}
 assert.equal(JSON.stringify(fit),before);assert.equal(out.trueTarget,null);assert.equal(out.trueError,null);
});

test('RHC whole-cohort versions agree with separately reviewed numerical oracles and Bernoulli normalisation',()=>{
 const rows=readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8')),fit=prepareRhc(rows),snapshot=JSON.stringify(fit);
 const out=correctionBridge(fit),[initial,aipw,half,tmle]=out.stages;
 // Oracles were independently enumerated over every W,A,Y by the mathematical reviewer.
 near(initial.theta,.08649885590233014);near(initial.empiricalMean,.00346913930676823);
 near(aipw.theta,.08996799520909782);near(aipw.empiricalMean,0);near(aipw.modelMean,-.0034691393067671932);
 near(tmle.theta,.08997972473530423);near(tmle.epsilon,.003576966662876657);near(tmle.empiricalMean,0);
 assert(Math.abs(half.empiricalMean)>1e-4);assert(Math.abs(half.empiricalMean)<Math.abs(initial.empiricalMean));
 for(const stage of out.stages){
  assert.equal(stage.rows.length,5735);near(stage.modelResidualMean,0);
  near(stage.modelMean,stage.isCanonicalAtFittedLaw?0:initial.theta-aipw.theta);
  for(let i=0;i<5735;i++){
   const r=stage.rows[i];assert.equal(r.row,i+1);assert.equal(r.a,rows[i].a);assert.equal(r.y,rows[i].y);near(r.g,fit.g[i]);
   assert(r.q0>0&&r.q0<1&&r.q1>0&&r.q1<1);near(r.value,r.correction+r.contrast-r.theta);
  }
  near(stage.modelFirst.cells.reduce((s,c)=>s+c.mass,0),1);
 }
 assert.equal(JSON.stringify(fit),snapshot);
});
