import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRhc,prepareRhc} from '../../shared/js/rhc.js';
import {estimationRoutes,qgCombination} from '../../shared/js/estimation-routes.js';
import {renderEstimationRoutes} from '../../zh/renderers/estimation-routes.js';
import {renderMarkdown} from '../../scripts/markdown.js';
const rows=readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8')),fit=prepareRhc(rows);
const close=(a,b,tol=1e-10)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
const sourceCounts=[[[1143,494],[558,348]],[[1320,594],[796,482]]],nx=[2543,3192];
test('g-computation and ATE-IPW use the independent full-cohort sex target and all source rows',()=>{
 const out=estimationRoutes(rows),risks=[0,1].map(a=>sourceCounts.reduce((sum,c,x)=>sum+nx[x]/5735*c[a][1]/(c[a][0]+c[a][1]),0));
 for(const key of ['gcomp','ipw']){
  assert.deepEqual(out[key].targetCounts,nx);close(out[key].risk0,risks[0]);close(out[key].risk1,risks[1]);close(out[key].estimate,risks[1]-risks[0]);
 }
 assert.equal(out.patients.length,5735);for(let i=0;i<rows.length;i++)assert.equal(out.patients[i].rowNumber,i+1);
});
test('actual PSM pairs are 1:1 without replacement, ordered, exhaustive for RHC and use a distinct treated target',()=>{
 const saved=JSON.stringify(rows),out=estimationRoutes(rows),p=out.psm;
 assert.equal(p.m,2184);assert.deepEqual(p.targetCounts,[906,1278]);assert.deepEqual(p.unmatchedTreated,[]);assert.equal(p.unusedControls.length,1367);
 const used=new Set();for(const pair of p.pairs){
  assert.equal(pair.treated.a,1);assert.equal(pair.control.a,0);assert.equal(pair.treated.x,pair.control.x);assert.equal(pair.treated.g,pair.control.g);
  assert(!used.has(pair.control.rowNumber));used.add(pair.control.rowNumber);
  assert.deepEqual(rows[pair.control.rowNumber-1].y,pair.control.y);
 }
 // Independent raw-index queues; no propensity or matching function is called here.
 const queues=[0,1].map(x=>rows.flatMap((r,i)=>r.x===x&&r.a===0?[i+1]:[])),positions=[0,0];
 const expected=rows.flatMap((r,i)=>r.a===1?[[i+1,queues[r.x][positions[r.x]++]]]:[]);
 assert.deepEqual(p.pairs.map(pair=>[pair.treated.rowNumber,pair.control.rowNumber]),expected);
 const deaths=expected.reduce((s,[i,j])=>[s[0]+rows[i-1].y,s[1]+rows[j-1].y],[0,0]);
 assert.deepEqual(deaths,[830,642]);close(p.estimate,(830-642)/2184);close(p.risk1,830/2184);close(p.risk0,642/2184);
 assert.equal(JSON.stringify(rows),saved);
});
test('matching selection does not read Y, and lost matches change the retained target rather than denominator silently',()=>{
 const original=estimationRoutes(rows),changed=estimationRoutes(rows.map(r=>({...r,y:1-r.y})));
 const ids=out=>out.psm.pairs.map(p=>[p.treated.rowNumber,p.control.rowNumber]);assert.deepEqual(ids(original),ids(changed));close(original.psm.estimate,-changed.psm.estimate);
 const tiny=[{x:0,a:1,y:1},{x:0,a:1,y:0},{x:0,a:0,y:0},{x:1,a:1,y:0},{x:1,a:0,y:1},{x:1,a:0,y:0}];
 const out=estimationRoutes(tiny).psm;assert.equal(out.m,2);assert.deepEqual(out.unmatchedTreated,[2]);assert.deepEqual(out.targetCounts,[1,1]);assert.deepEqual(out.unusedControls,[6]);close(out.estimate,0);
 const html=renderEstimationRoutes('<div class="estimation-routes-placeholder"></div>',tiny);
 assert(html.includes('目标是保留的RHC处理者的sex构成'));assert(html.includes('data-psm-complete="false"'));assert(!html.includes('目标是全部RHC处理者的sex构成'));
});
test('full-W combination preserves original Q/A/Y and independently recorded AIPW/TMLE results',()=>{
 const snapshot=JSON.stringify(fit),out=qgCombination(fit);
 close(out.initial,.08649885590233014);close(out.correction,.00346913930676768);close(out.aipw,.089967995209098);close(out.tmle,.08997972473530443);assert(Math.abs(out.score)<1e-12);
 for(let i=0;i<rows.length;i++){
  const r=out.rows[i];assert.equal(r.rowNumber,i+1);assert.equal(r.y,rows[i].y);assert.equal(r.a,rows[i].a);
  close(r.qa,rows[i].a?fit.q1[i]:fit.q0[i]);close(r.residual+r.qa,rows[i].y);
  assert(r.updated0>0&&r.updated0<1&&r.updated1>0&&r.updated1<1);
 }
 assert.equal(JSON.stringify(fit),snapshot);
});
test('chapter route/combination diagrams retain maths-only objects, real values, target labels and complete symbol recalls',()=>{
 const md=readFileSync('zh/src/supplements/ch00-details.md','utf8'),html=renderEstimationRoutes(renderMarkdown(md),rows,fit);
 assert(!html.includes('estimation-routes-placeholder')&&!html.includes('qg-combination-placeholder'));
 assert(html.includes('PSM')&&html.includes('4368')&&html.includes('1367')&&html.includes('Horvitz–Thompson'));
 assert(html.indexOf('data-estimation-routes')<html.indexOf('已经有了点估计'));
 assert(html.indexOf('data-qg-combination')>html.indexOf('5.3 回到RHC风险差：把Q与g接起来'));
 for(const key of ['gcomp','ipw','psm'])assert(html.includes(`data-route-panel="${key}"`));
 assert.equal((html.match(/data-route-pair=/g)||[]).length,6);
 const newFigures=[...html.matchAll(/<figure class="er-visual"[\s\S]*?<\/figure>/g)].map(m=>m[0]);assert.equal(newFigures.length,2);
 for(const figure of newFigures){assert(!/<pre|<code|data-julia-name|data-r-name|katex-error/.test(figure));assert(figure.includes('<math'));assert(figure.includes('tabindex="0" role="region"'));}
 assert(html.includes('ATT')&&html.includes('saturated fit')&&html.includes('residual'));
 assert(md.includes('g-formula')&&md.includes('\\Psi_{X,T}(P)'));
});
