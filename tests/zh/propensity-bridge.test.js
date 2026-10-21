import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {propensityBridge} from '../../shared/js/propensity-bridge.js';
import {readRhc} from '../../shared/js/rhc.js';
import {renderPropensityBridge} from '../../zh/renderers/propensity-bridge.js';
import {renderMarkdown} from '../../scripts/markdown.js';
const rows=readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8'));
const close=(actual,expected)=>assert(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
// Source cross-tabulation, independently read and verified in RHC_SOURCE.md.
const counts=[[[1143,494],[558,348]],[[1320,594],[796,482]]];
const totals=[2543,3192],n=5735;
test('sex-only propensities and IPW masses reproduce the independent source cross-tabulation',()=>{
 const out=propensityBridge(rows);
 assert.equal(out.n,n);assert.deepEqual(out.targetCounts,totals);
 for(let x=0;x<2;x++)close(out.strata[x].g,(counts[x][1][0]+counts[x][1][1])/totals[x]);
 for(let a=0;a<2;a++){
  assert.deepEqual(out.arms[a].counts,counts.map(stratum=>stratum[a][0]+stratum[a][1]));
  close(out.arms[a].mass,n);out.arms[a].weightedCounts.forEach((mass,x)=>close(mass,totals[x]));
 }
 for(const r of out.patients){
  const nx=totals[r.x],na=counts[r.x][r.a][0]+counts[r.x][r.a][1];
  close(r.pActual,na/nx);close(r.weight,nx/na);
 }
});
test('row-weighted outcomes equal independent stratum standardisation, with full-n rather than arm-n denominators',()=>{
 const out=propensityBridge(rows),risks=[0,1].map(a=>counts.reduce((sum,stratum,x)=>sum+totals[x]/n*stratum[a][1]/(stratum[a][0]+stratum[a][1]),0));
 for(let a=0;a<2;a++)close(out.arms[a].ipwRisk,risks[a]);
 close(out.ipwDifference,risks[1]-risks[0]);
 close(out.crudeDifference,830/2184-1088/3551);

});
test('propensity and weights depend on X/A, while original Y and source order are retained',()=>{
 const saved=JSON.stringify(rows),out=propensityBridge(rows),flipped=propensityBridge(rows.map(r=>({...r,y:1-r.y})));
 assert.equal(JSON.stringify(rows),saved);
 for(let i=0;i<n;i++){
  assert.equal(out.patients[i].rowNumber,i+1);assert.equal(out.patients[i].y,rows[i].y);
  assert.equal(flipped.patients[i].weight,out.patients[i].weight);
  assert.equal(flipped.patients[i].g,out.patients[i].g);
 }
 close(flipped.ipwDifference,-out.ipwDifference);
});
test('missing strata, one-arm strata and invalid records fail explicitly rather than receiving repaired weights',()=>{
 for(const bad of [[],null,[{x:0,a:0,y:0}],[{x:0,a:0,y:0},{x:0,a:1,y:1}],rows.map((r,i)=>i? r:{...r,x:2}),rows.map((r,i)=>i?r:{...r,y:NaN})])assert.throws(()=>propensityBridge(bad));
});
test('chapter-0 rendering supplies real-data maths-only diagrams before IF, native scroll regions and a complete two-arm derivation',()=>{
 const md=readFileSync('zh/src/supplements/ch00-details.md','utf8'),html=renderPropensityBridge(renderMarkdown(md),rows);
 for(const marker of ['propensity-imbalance-placeholder','propensity-routes-placeholder','propensity-weighting-placeholder'])assert(!html.includes(marker));
 assert(html.indexOf('data-ps-imbalance')<html.indexOf('qg-introduction'));
 assert(html.indexOf('data-ps-weighting')<html.indexOf('已经有了点估计'));
 assert.equal((html.match(/data-ps-row=/g)||[]).length,6);
 assert(html.includes('Horvitz–Thompson')&&html.includes('Hájek')&&html.includes('ATT'));
 assert(html.includes('law of total expectation')&&html.includes('average treatment effect on the treated'));
 const plots=[...html.matchAll(/<figure class="ps-visual"[\s\S]*?<\/figure>/g)].map(m=>m[0]);
 assert.equal(plots.length,3);
 for(const plot of plots){assert(!/<pre|<code|data-julia-name|data-r-name/.test(plot));assert(!plot.includes('katex-error'));}
 assert(plots[1].includes('tabindex="0" role="region"'));
 assert(html.includes('<math'));
});
