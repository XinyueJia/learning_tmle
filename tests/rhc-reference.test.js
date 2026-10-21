import test from 'node:test';import assert from 'node:assert/strict';
import * as M from '../shared/js/math.js';import {RHC_MODEL} from '../shared/js/rhc-model.js';
import {CASE_COUNTS,caseData,caseAt,solveCase,caseDirections,caseProjection,caseEmpiricalMoments} from '../shared/js/case-study.js';
const near=(a,b,tol=1e-9)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
test('real5735 table replaces generated counts and gives independently standardised contrast',()=>{
 const d=caseData();assert.equal(d.n,5735);assert.deepEqual(CASE_COUNTS.map(c=>c.n),[1143,494,558,348,1320,594,796,482]);near(d.marginalRisk,1918/5735);near(M.ate(d.empiricalModel),(2543/5735)*(348/906-494/1637)+(3192/5735)*(482/1278-594/1914));
 const solved=solveCase();near(solved.estimate,.07369211904730705);near(solved.score,0,1e-12);near(solved.eifMean,0,1e-12);assert(solved.groups.every(g=>g.qUpdated>0&&g.qUpdated<1));assert.notEqual(caseAt(0).eifMean,0);
});
test('all observed point and independent contrast directions match rebuilt finite differences',()=>{
 const d=caseDirections();assert.equal(d.points.length,8);assert.equal(d.contrasts.length,7);for(const r of [...d.points,...d.contrasts]){near(r.numerical,r.paired,2e-7);near(r.scoreMean,0);}
});
test('real-reference mechanism paths preserve other mechanisms throughout allowed range',()=>{
 for(const kind of ['X','A','Y'])for(const t of [-3,-1,0,.5,3]){
  const out=M.tilt(RHC_MODEL,kind,t);near(M.joint(out).reduce((s,c)=>s+c.p,0),1);
  if(kind!=='X')assert.deepEqual(out.px,RHC_MODEL.px);if(kind!=='A')assert.deepEqual(out.g,RHC_MODEL.g);if(kind!=='Y')assert.deepEqual(out.q,RHC_MODEL.q);if(kind==='A')near(M.ate(out),M.ate(RHC_MODEL));
 }
 for(const kind of ['X','A','Y']){const cells=M.joint(RHC_MODEL),derivative=(M.ate(M.tilt(RHC_MODEL,kind,1e-5))-M.ate(M.tilt(RHC_MODEL,kind,-1e-5)))/2e-5;near(M.expectation(cells,c=>M.eif(RHC_MODEL,c).total*M.mechanismScore(RHC_MODEL,kind,c)),derivative,1e-8);}
});
test('actual reference variance, projection orthogonality and norm decomposition agree independently',()=>{
 near(M.varianceDirect(RHC_MODEL),M.varianceAnalytic(RHC_MODEL));const p=caseProjection(undefined,2);near(p.maxError,0);near(p.candidateSecondMoment,p.projectedSecondMoment+M.inner(p.cells.map(c=>c.p),p.removed,p.removed));for(let i=0;i<8;i++)near(p.projected[i],p.D[i]);
 const v=caseEmpiricalMoments();near(v.se,.01297075118833977);near(v.eifMean,0);near(v.eifSecondMoment,v.eifVariance);
});
