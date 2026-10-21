import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRhc} from '../../shared/js/rhc.js';
import {referenceScenarios,renderReferenceCalibration} from '../../zh/renderers/tmle-calibration.js';

test('reference demonstration agrees with raw patient averages and independently reconstructed residual corrections',()=>{
 const rows=readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8'));
 const groups=[0,1].map(x=>rows.filter(r=>r.x===x));
 const g=groups.map(rs=>rs.reduce((s,r)=>s+r.a,0)/rs.length);
 const q=[0,1].map(a=>groups.map(rs=>{const arm=rs.filter(r=>r.a===a);return arm.reduce((s,r)=>s+r.y,0)/arm.length;}));
 const target=rows.reduce((s,r)=>s+q[1][r.x]-q[0][r.x],0)/rows.length;
 const scenarios=referenceScenarios();
 for(const [j,s] of scenarios.entries()){
  const gf=g.map(v=>(1-s.lambda)*v+s.lambda*.5);
  const qf=[[q[0][0]+s.b,q[0][1]+s.b*.5],[q[1][0]-s.b*.5,q[1][1]-s.b]];
  const h=r=>r.a/gf[r.x]-(1-r.a)/(1-gf[r.x]);
  const initial=rows.reduce((sum,r)=>sum+qf[1][r.x]-qf[0][r.x],0)/rows.length;
  const correction=rows.reduce((sum,r)=>sum+h(r)*(r.y-qf[r.a][r.x]),0)/rows.length;
  const final=rows.reduce((sum,r)=>sum+s.updated.q[1][r.x]-s.updated.q[0][r.x],0)/rows.length;
  const score=rows.reduce((sum,r)=>sum+h(r)*(r.y-s.updated.q[r.a][r.x]),0)/rows.length;
  const remainder=rows.reduce((sum,r)=>sum+(gf[r.x]-g[r.x])*((s.updated.q[1][r.x]-q[1][r.x])/gf[r.x]+(s.updated.q[0][r.x]-q[0][r.x])/(1-gf[r.x])),0)/rows.length;
  assert(Math.abs(s.reference-target)<1e-12);assert(Math.abs(s.initial-initial)<1e-12);
  assert(Math.abs(s.aipw-initial-correction)<1e-12);assert(Math.abs(s.tmle-final)<1e-12);
  assert(Math.abs(s.score-score)<1e-12);assert(Math.abs(score)<1e-12);
  assert(Math.abs(final-target+score-remainder)<1e-12);
  if(j<2){assert(Math.abs(final-target)<1e-12);assert(Math.abs(s.aipw-target)<1e-12);}
  else {assert(final-target>.003);assert(Math.abs(s.aipw-target)>.002);}
 }
 const html=renderReferenceCalibration();
 assert.equal((html.match(/data-to-reference-case=/g)||[]).length,3);
 assert.equal((html.match(/data-to-ref-value=/g)||[]).length,9);
 assert.equal((html.match(/role="img"/g)||[]).length,3);
 for(const s of scenarios)assert(html.includes(`data-to-ref-error="${s.tmle-s.reference}"`));
});
