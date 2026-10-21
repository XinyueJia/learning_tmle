import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRhc,rhcCounts,logisticFit,prepareRhc,rhcAt,solveRhc,FEATURE_NAMES,HISTORY} from '../shared/js/rhc.js';
import {parsePublicCsv} from '../shared/js/public-rws.js';

const source=readFileSync(new URL('../shared/data/public/rhc/source.csv',import.meta.url),'utf8');
const raw=parsePublicCsv(source.replace(/^""(?=,)/,'"source_row"'));
const rows=readRhc(source),prepared=prepareRhc(rows),targeted=solveRhc(prepared);
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const near=(a,b,tolerance=1e-10)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tolerance,`${a} != ${b}`);
const csv=records=>{
 const keys=Object.keys(records[0]);
 const field=v=>`"${String(v).replaceAll('"','""')}"`;
 return [keys.map((k,i)=>field(i===0?'':k)).join(','),...records.map(r=>keys.map(k=>field(r[k])).join(','))].join('\r\n')+'\r\n';
};
const expectedG=[-.47484152371871574,.19320938845888308,-.027269317650839387,-.1216674790477176,.010255331775072199,.20601993261954732,.09869579097526042,-.5992027627777516,-.5492792644931694,-.5716814943982339,.015709960556195047,-.16893682076354638,-.4259683250076338,-.25480226978741194,.15655054089822856,.49372767616038304,.3641312918813276];
const expectedQ=[-.9781382046618333,.048830165919289514,.300175442397147,.09057456642099895,.14071527797391936,-.27866252670089386,-.3265483246665783,.3129522534951257,-.2551550285233584,-.2671413114920261,.2015604635988174,.7748914081491659,-.022801080989949412,.5487100999194484,.04320187171511458,.02425143049123235,-.3407357387834279,.4032115552410201];

test('RHC raw records reproduce independently counted observed cells without exclusions',()=>{
 assert.equal(rows.length,5735);
 assert.equal(mean(rows.map(r=>r.y))*rows.length,1918);
 assert.equal(rows.reduce((s,r)=>s+r.a,0),2184);
 assert.equal(rows.reduce((s,r)=>s+r.x,0),3192);
 assert.deepEqual(rhcCounts(rows).map(c=>c.n),[1143,494,558,348,1320,594,796,482]);
 assert.deepEqual(rhcCounts([...rows].reverse()),rhcCounts(rows));
 assert.deepEqual([rows[0].x,rows[0].a,rows[0].y],[1,0,0]);
 assert.deepEqual([rows[1].x,rows[1].a,rows[1].y],[0,1,0]);
 near(mean(rows.map(r=>r.y)),1918/5735);
 assert.throws(()=>rhcCounts([]));
});

test('RHC parser handles original quoted fields and rejects missingness rather than imputing',()=>{
 assert.equal(readRhc('\ufeff'+source).length,5735);
 assert.equal(readRhc(csv(raw.slice(0,3))).length,3);
 const quoted=raw.slice(0,2).map(r=>({...r,cat1:'a comma, a "quote" and\na newline'}));
 assert.equal(readRhc(csv(quoted)).length,2);
 for(const [key,value] of [['age','NA'],['age',''],['age','Infinity'],['sex','NA'],['swang1','Yes'],['dth30',''],['race','unknown'],['chfhx','NA'],['amihx','2']]){
  const changed=raw.slice(0,2).map(r=>({...r}));changed[0][key]=value;
  assert.throws(()=>readRhc(csv(changed)),`${key}=${value} must fail`);
 }
 for(const missing of ['age','sex','swang1','dth30','race',...HISTORY]){
  const changed=raw.slice(0,2).map(r=>{const copy={...r};delete copy[missing];return copy;});
  assert.throws(()=>readRhc(csv(changed)),`missing ${missing} must fail`);
 }
 assert.throws(()=>readRhc(source+'"broken'));
});

test('logistic Newton solver agrees with analytically solvable binomial groups',()=>{
 const X=[...Array.from({length:4},()=>[1,0]),...Array.from({length:4},()=>[1,1])];
 const fit=logisticFit(X,[1,0,0,0,1,1,1,0]);
 assert.ok(fit.converged&&fit.maxScore<1e-10);
 near(fit.beta[0],-Math.log(3));near(fit.beta[1],2*Math.log(3));
 fit.predictions.forEach((q,i)=>near(q,i<4?.25:.75));
 for(const [X,y] of [[[],[]],[[[1],[1]],[0,0]],[[[1],[NaN]],[0,1]],[[[1],[1]],[0,2]],[[[1,1],[1,1],[1,1],[1,1]],[0,1,0,1]]]) assert.throws(()=>logisticFit(X,y));
});

test('the declared complete baseline design and both fitted score equations are reproducible',()=>{
 assert.deepEqual(prepared.featureNames,['intercept','male','age_z','race_black','race_other',...HISTORY]);
 assert.deepEqual(prepared.featureNames,FEATURE_NAMES);
 assert.equal(prepared.X.length,5735);assert.ok(prepared.X.every(x=>x.length===17));
 near(prepared.ageMean,61.37588299738448);near(prepared.ageSd,16.68047483037684);
 near(mean(prepared.X.map(x=>x[2])),0);near(mean(prepared.X.map(x=>x[2]**2)),1);
 prepared.gFit.beta.forEach((b,i)=>near(b,expectedG[i]));
 prepared.qFit.beta.forEach((b,i)=>near(b,expectedQ[i]));
 for(let j=0;j<17;j++)near(mean(rows.map((r,i)=>prepared.X[i][j]*(r.a-prepared.g[i]))),0);
 for(let j=0;j<18;j++)near(mean(rows.map((r,i)=>(j===17?r.a:prepared.X[i][j])*(r.y-(r.a?prepared.q1[i]:prepared.q0[i])))),0);
 near(Math.min(...prepared.g),.07869797540624915);near(Math.max(...prepared.g),.6819050426722195);
 assert.ok([...prepared.g,...prepared.q0,...prepared.q1].every(p=>p>0&&p<1));
 assert.throws(()=>prepareRhc([]));
 assert.throws(()=>prepareRhc(rows.map(r=>({...r,age:50}))));
});

test('individual logistic targeting agrees with likelihood derivatives at positive and negative epsilon',()=>{
 const likelihood=e=>{
  const state=rhcAt(prepared,e);
  return mean(rows.map((r,i)=>{const q=r.a?state.updated1[i]:state.updated0[i];return r.y*Math.log(q)+(1-r.y)*Math.log1p(-q);}));
 };
 for(const epsilon of [-.01,0,.003,.01]){
  const h=1e-5,at=rhcAt(prepared,epsilon),low=rhcAt(prepared,epsilon-h),high=rhcAt(prepared,epsilon+h);
  near((likelihood(epsilon+h)-likelihood(epsilon-h))/(2*h),at.score,1e-8);
  near((high.score-low.score)/(2*h),at.slope,1e-8);
  near(at.eifMean,at.score);assert.ok(at.slope<0);
  near(at.estimate,mean(at.updated1.map((q,i)=>q-at.updated0[i])));
  assert.ok([...at.updated0,...at.updated1].every(q=>q>0&&q<1));
 }
 assert.ok(likelihood(targeted.epsilon)>likelihood(0));
 assert.throws(()=>rhcAt(prepared,NaN));assert.throws(()=>rhcAt(prepared,Infinity));
 assert.throws(()=>rhcAt(prepared,1000));
});

test('negative-score analytic fixture requires a negative targeting epsilon',()=>{
 const records=Array.from({length:8},(_,i)=>({a:+(i>=4),y:i%2}));
 const fixture={rows:records,n:8,g:Array(8).fill(.5),q0:Array(8).fill(.6),q1:Array(8).fill(.8),H:records.map(r=>r.a?2:-2)};
 near(rhcAt(fixture,0).score,-.2);
 const result=solveRhc(fixture),expected=(Math.log(.6/.4)-Math.log(.8/.2))/4;
 near(result.epsilon,expected,1e-11);near(result.estimate,0,1e-11);
 assert.ok(result.epsilon<0&&result.converged);near(result.score,0,1e-12);
});

test('the public-cohort TMLE is learned and matches the independently stated reference',()=>{
 near(prepared.initialEstimate,.0864988559023306);
 near(prepared.initialScore,.0034691393067677457);
 near(prepared.aipw,.08996799520909834);
 near(targeted.epsilon,.003576966662876657);
 near(targeted.estimate,.08997972473530443);
 near(mean(targeted.updated0),.30058304496920574);near(mean(targeted.updated1),.39056276970451026);
 near(targeted.se,.013082375165239404);
 assert.ok(targeted.converged&&Math.abs(targeted.score)<1e-12);
 near(targeted.eifMean,0,1e-12);near(targeted.variance,mean(targeted.D.map(v=>(v-targeted.eifMean)**2)));
 const changed=rows.map((r,i)=>i===0?{...r,y:1}:r),refitted=solveRhc(prepareRhc(changed));
 assert.ok(Math.abs(refitted.estimate-targeted.estimate)>1e-6,'changing observed Y must change the fitted answer');
 assert.equal(changed.length,rows.length);
 assert.deepEqual(prepared.X[0].slice(0,2),[1,1]); // neither fit nor targeting mutates source features
});
