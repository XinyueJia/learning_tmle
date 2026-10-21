import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bernoulliScoreObjects, glmScoreData} from '../shared/js/glm-score.js';
import {parsePublicCsv} from '../shared/js/public-rws.js';
const near=(a,b,t=1e-9)=>assert(Number.isFinite(a)&&Math.abs(a-b)<t,`${a} != ${b}`);
const expit=b=>1/(1+Math.exp(-b));
const derivative=(f,x,h=1e-5)=>(f(x+h)-f(x-h))/(2*h);
const raw=parsePublicCsv(readFileSync('shared/data/public/rhc/source.csv','utf8').replace(/^""(?=,)/,'"source_row"'));
const Y=raw.map(row=>+(row.dth30==='Yes'));

test('Bernoulli scores agree with independently differentiated log probabilities in two parametrisations',()=>{
 for(const mu of [.05,.2,.5,.8,.95])for(const y of [0,1]){
  const r=bernoulliScoreObjects(mu,y);
  near(r.scoreBeta,derivative(b=>Math.log(y?expit(b):1-expit(b)),r.beta));
  near(r.scoreMu,derivative(p=>Math.log(y?p:1-p),mu),1e-6);
  near(r.information,-derivative(b=>y-expit(b),r.beta));
 }
});
test('Mean and logit IFs match independently perturbed probabilities for both contamination directions',()=>{
 for(const mu of [.1,.33,.5,.9])for(const z of [0,1]){
  const r=bernoulliScoreObjects(mu,z);
  const target=t=>(1-t)*mu+t*z;
  near(r.ifMean,derivative(target,0));
  near(r.ifLogit,derivative(t=>Math.log(target(t)/(1-target(t))),0),1e-6);
  const ps=[1-mu,mu];
  const paired=ps.reduce((v,p,y)=>v+p*bernoulliScoreObjects(mu,y).ifMean*((y===z?1/p:0)-1),0);
  near(paired,r.ifMean);
 }
});
test('GLM-path score pairing gives the derivative of the target, with a non-zero finite-step remainder',()=>{
 for(const mu of [.1,.334,.5,.8]){
  const beta=Math.log(mu/(1-mu));
  const r=[0,1].map(y=>bernoulliScoreObjects(mu,y));
  near((1-mu)*r[0].pairing+mu*r[1].pairing,derivative(t=>expit(beta+t),0));
  near((1-mu)*r[0].scoreBeta+mu*r[1].scoreBeta,0);
  assert(Math.abs(expit(beta+.4)-mu-.4*mu*(1-mu))>1e-5);
 }
});
test('RHC visual uses all original outcomes and retains exact source row order',()=>{
 const before=[...Y],d=glmScoreData(Y);
 assert.equal(d.n,raw.length);assert.equal(d.events,raw.filter(row=>row.dth30==='Yes').length);
 assert.deepEqual(d.rows.map(r=>r.y),before);assert.deepEqual(Y,before);
 assert.equal(d.rows.length,5735);assert.equal(d.events,1918);
 near(d.information,1918*3817/5735**2);
 near(d.pairedDerivative,1918*3817/5735**2);
 d.rows.forEach((r,i)=>{assert.equal(r.record,i+1);near(r.ifLogit,r.y?5735/1918:-5735/3817);});
 assert.deepEqual(d.support.map(r=>r.count),[3817,1918]);
});
test('Interior-model boundaries fail explicitly rather than emitting infinite logit or information inverse',()=>{
 for(const mu of [0,1,-.1,1.1,NaN,Infinity])assert.throws(()=>bernoulliScoreObjects(mu,1));
 for(const y of [-1,.5,2,'1',null])assert.throws(()=>bernoulliScoreObjects(.3,y));
 for(const ys of [[],[0,0],[1,1],[0,2],null])assert.throws(()=>glmScoreData(ys));
});
