import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRhc,prepareRhc,solveRhc} from '../../shared/js/rhc.js';
import {renderTmleOverview,OVERVIEW_COLUMNS} from '../../zh/renderers/tmle-overview.js';
const source=readFileSync('zh/src/tmle-overview.md','utf8');
const rows=readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8')),fit=prepareRhc(rows),out=solveRhc(fit);
const html=renderTmleOverview(source,fit);
test('six authored algorithm steps render accessible formulas, aligned columns and no language-specific code',()=>{
 assert.equal((html.match(/data-to-panel=/g)||[]).length,6);
 assert.equal((html.match(/data-to-patient=/g)||[]).length,6);
 assert.equal((html.match(/data-to-flow-row=/g)||[]).length,6);
 assert.equal((html.match(/class="formula-recall"/g)||[]).length,12);
 assert(html.includes('<math'));assert(!html.includes('katex-error'));assert(!/<pre|<code/.test(html));
 assert(!/\$[Qg]\$/.test(html),'nested disclosure symbols must render too');
 assert(source.includes('不额外加截距'));assert(source.includes('全体患者间共用'));
 assert(source.includes('推断条件'));assert(source.includes('分母$n$'));
 assert.equal(OVERVIEW_COLUMNS.filter(c=>c[2]===5)[0][0],'eif');
 assert.throws(()=>renderTmleOverview('missing steps',fit),/six authored steps/);
});
test('displayed targeting results agree with independent likelihood differences, direct EIF sums and cross-language benchmarks',()=>{
 const values=[...html.matchAll(/data-to-number="([^"]+)"/g)].map(m=>+m[1]);
 for(const v of [.003576966662876657,.08997972473530443,.013082375165239402])assert(values.some(x=>Math.abs(x-v)<1e-12));
 // Build log probabilities directly from the linear predictor; do not call the trace kernel.
 const likelihood=e=>rows.reduce((s,r,i)=>{const q=r.a?fit.q1[i]:fit.q0[i],h=r.a?1/fit.g[i]:-1/(1-fit.g[i]),z=Math.log(q/(1-q))+e*h;return s+r.y*z-Math.log1p(Math.exp(z));},0)/rows.length;
 const at=.002,delta=1e-5;
 const derivative=(likelihood(at+delta)-likelihood(at-delta))/(2*delta);
 const score=rows.reduce((s,r,i)=>{const q=r.a?fit.q1[i]:fit.q0[i],h=r.a?1/fit.g[i]:-1/(1-fit.g[i]);return s+h*(r.y-1/(1+Math.exp(-(Math.log(q/(1-q))+at*h))));},0)/rows.length;
 assert(Math.abs(score-derivative)<1e-8);
 assert(Math.abs((likelihood(out.epsilon+delta)-likelihood(out.epsilon-delta))/(2*delta))<1e-8);
 const d=rows.map((r,i)=>{const h=r.a?1/fit.g[i]:-1/(1-fit.g[i]),q1=1/(1+(1-fit.q1[i])/fit.q1[i]*Math.exp(-out.epsilon/fit.g[i])),q0=1/(1+(1-fit.q0[i])/fit.q0[i]*Math.exp(out.epsilon/(1-fit.g[i])));return h*(r.y-(r.a?q1:q0))+q1-q0-out.estimate;});
 const mean=d.reduce((a,b)=>a+b)/d.length,variance=d.reduce((s,x)=>s+(x-mean)**2,0)/d.length;
 assert(Math.abs(mean)<1e-12);assert(values.some(v=>Math.abs(v-variance)<1e-12));assert(values.some(v=>Math.abs(v-Math.sqrt(variance/d.length))<1e-12));
});

test('one shared epsilon produces patient-specific changes and solves the single full-cohort residual equation',()=>{
 const eps=Number(html.match(/data-to-common-epsilon="([^"]+)"/)[1]);
 const hs=[...html.matchAll(/data-to-direction-h="([^"]+)"/g)].map(m=>+m[1]);
 const shifts=[...html.matchAll(/data-to-direction-shift="([^"]+)"/g)].map(m=>+m[1]);
 const qs=[...html.matchAll(/data-to-direction-prediction="([^"]+)"/g)].map(m=>+m[1]);
 assert.equal(hs.length,2);assert(hs[0]<0&&hs[1]>0);
 for(let i=0;i<2;i++){
  const h=rows[i].a?1/fit.g[i]:-1/(1-fit.g[i]),q=rows[i].a?fit.q1[i]:fit.q0[i],odds=q/(1-q)*Math.exp(eps*h);
  assert(Math.abs(hs[i]-h)<1e-12);assert(Math.abs(shifts[i]-eps*h)<1e-12);assert(Math.abs(qs[i]-odds/(1+odds))<1e-12);
 }
 const scores=[...html.matchAll(/data-to-direction-score="([^"]+)"/g)].map(m=>+m[1]);assert.equal(scores.length,3);
 for(let j=0;j<3;j++){
  const e=[0,eps/2,eps][j],expected=rows.reduce((sum,r,i)=>{const q=r.a?fit.q1[i]:fit.q0[i],h=r.a?1/fit.g[i]:-1/(1-fit.g[i]),odds=q/(1-q)*Math.exp(e*h);return sum+h*(r.y-odds/(1+odds));},0)/rows.length;
  assert(Math.abs(scores[j]-expected)<1e-12);
 }
 assert(scores[0]>scores[1]&&scores[1]>scores[2]);assert(Math.abs(scores[2])<1e-12);
 assert(source.includes('自动为0'));assert(source.includes('本例选定的logistic更新路径'));assert(source.includes('$Q$在所有基线下的预测质量'));
});

test('IPW outcome and EIF residual branches preserve patient rows and independently summed full-cohort estimands',()=>{
 const values=name=>[...html.matchAll(new RegExp(`data-to-ipw-${name}="([^"]+)"`,'g'))].map(m=>+m[1]);
 assert.equal(values('outcome').length,6);assert.equal(values('residual').length,6);
 for(let i=0;i<6;i++){
  const r=rows[i],h=r.a/fit.g[i]-(1-r.a)/(1-fit.g[i]),q=r.a?fit.q1[i]:fit.q0[i];
  assert(Math.abs(values('h')[i]-h)<1e-12);
  assert(Math.abs(values('outcome')[i]-h*r.y)<1e-12);
  assert(Math.abs(values('residual')[i]-h*(r.y-q))<1e-12);
 }
 assert.equal(values('outcome')[0],0);assert(values('residual')[0]>0);
 let treated=0,control=0,treatedWeight=0,controlWeight=0,correction=0,standardised=0;
 rows.forEach((r,i)=>{
  if(r.a){treated+=r.y/fit.g[i];treatedWeight+=1/fit.g[i];correction+=(r.y-fit.q1[i])/fit.g[i];}
  else {control+=r.y/(1-fit.g[i]);controlWeight+=1/(1-fit.g[i]);correction-=(r.y-fit.q0[i])/(1-fit.g[i]);}
  standardised+=fit.q1[i]-fit.q0[i];
 });
 const ipw=(treated-control)/rows.length,delta=correction/rows.length;
 assert(Math.abs(values('average')[0]-ipw)<1e-12);
 assert(Math.abs(ipw-(treated/treatedWeight-control/controlWeight))>1e-4,'total-n HT denominator must not silently become arm-normalised');
 assert(Math.abs(values('correction')[0]-delta)<1e-12);
 assert(Math.abs(values('aipw')[0]-(standardised/rows.length+delta))<1e-12);
 assert(Math.abs(ipw-values('aipw')[0])>1e-4);
 assert(source.includes('逐人的EIF输出一般与$C_i$不同'));assert(source.includes('中心化项'));
});

test('initial EIF is a centred patient contribution whose full-cohort mean gives exactly the AIPW correction',()=>{
 const values=name=>[...html.matchAll(new RegExp(`data-to-eif-${name}="([^"]+)"`,'g'))].map(m=>+m[1]);
 const contrasts=rows.map((r,i)=>fit.q1[i]-fit.q0[i]);
 const centre=contrasts.reduce((sum,value)=>sum+value,0)/rows.length;
 const c=rows.map((r,i)=>{const h=r.a/fit.g[i]-(1-r.a)/(1-fit.g[i]);return h*(r.y-(r.a?fit.q1[i]:fit.q0[i]));});
 const d=c.map((value,i)=>value+contrasts[i]-centre);
 assert.equal(values('output').length,2);
 for(let i=0;i<2;i++){
  assert(Math.abs(values('c')[i]-c[i])<1e-12);
  assert(Math.abs(values('contrast')[i]-contrasts[i])<1e-12);
  assert(Math.abs(values('centre')[i]-centre)<1e-12);
  assert(Math.abs(values('output')[i]-d[i])<1e-12);
  assert(Math.abs(d[i]-c[i])>1e-3,'individual EIF and residual contribution must not be conflated');
 }
 const dmean=d.reduce((sum,value)=>sum+value,0)/rows.length,cmean=c.reduce((sum,value)=>sum+value,0)/rows.length;
 assert(Math.abs(values('centred-average')[0])<1e-12);
 assert(Math.abs(values('average')[0]-dmean)<1e-12);assert(Math.abs(dmean-cmean)<1e-12);
 const aipw=Number(html.match(/data-to-ipw-aipw="([^"]+)"/)[1]);
 assert(Math.abs(aipw-centre-dmean)<1e-12);
 // The authored order must follow quantities the reader has already met.
 const step=source.split('<!-- tmle-step:1 -->')[1].split('<!-- tmle-step:2 -->')[0];
 assert(step.indexOf('C_i=')<step.indexOf('\\widehat D_i^{\\mathrm{init}}'));
 assert(step.indexOf('tmle-ipw-placeholder')<step.indexOf('tmle-eif-aipw-placeholder'));
 assert(step.indexOf('tmle-eif-aipw-placeholder')<step.indexOf('TMLE从相同的初始拟合出发'));
});
