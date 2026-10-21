import test from 'node:test';import assert from 'node:assert/strict';
import {chapter1VisualData} from '../../zh/src/chapter1-visual-data.js';
import {chapter1Figures} from '../../zh/renderers/chapter1-visuals.js';
const near=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} != ${b}`),r=1918/5735,c=3817/5735;
test('real cohort sample and probability contributions preserve observed numerator/denominator',()=>{
 const d=chapter1VisualData();assert.deepEqual(d.sample.counts,[3817,1918]);assert.equal(d.sample.total,5735);assert.equal(d.sample.events,1918);near(d.base.mean,r);near(d.base.probabilities[0],c);near(d.base.meanContributions[1],r);
});
test('probability replacement exactly retains90percent then adds10percent at1',()=>{
 const d=chapter1VisualData();near(d.replacement.retainedUnits[0],90*c);near(d.replacement.retainedUnits[1],90*r);near(d.replacement.addedUnits[1],10);near(d.replacement.afterUnits[1],90*r+10);near(d.mixture.delta,.1*c);near(d.mixture.removedMeanContribution,.1*r);
});
test('every rate and both input maps agree with independent binary algebra',()=>{
 const d=chapter1VisualData();for(const row of d.rates){near(row.rate,c);near(row.exactMean,r+row.t*c);}for(const row of d.functionMap.rows){near(row.rate,row.z-r);near(row.mean,r+.1*(row.z-r));}
});
test('influence signs, weighting, centring and changed-reference proof remain distinct',()=>{
 const d=chapter1VisualData();near(d.directions[0].d,-r);near(d.directions[1].d,c);near(d.centering.total,0);near(d.centeringProof.meanTotal,r);near(d.centeringProof.baselineTotal,r);near(d.referenceDistribution.updatedTotal,.1*c);near(d.centeringProof.unweightedMean,.5-r);
});
test('both exercises, survival complements and positivity boundary derive from real risk',()=>{
 const d=chapter1VisualData();near(d.exercises[0].mean,r+.2*c);near(d.exercises[1].mean,.2*r);near(d.survival.eventFree,c);near(d.survival.eventFreeDelta,-.1*c);near(d.boundary.minStrict,-1918/3817);assert.equal(d.survival.month,30);assert.deepEqual(d.survivalWindow.rows.map(x=>x.lastSeenMonth),[10,35,20]);
});
test('all18 rendered figures have recalls, actual counts, changed interval and in-view schematic',()=>{
 const figures=chapter1Figures();assert.equal(Object.keys(figures).length,18);for(const [id,html] of Object.entries(figures)){assert(html.includes(`id="visual-${id}"`));assert(html.includes('recall-trigger'));assert(!/200人|116人|84人|4\.2个百分点|29\/21|110天/.test(html));}assert(figures.sample.includes('3817'));assert(figures.sample.includes('1918'));assert(figures.boundary.includes('1918/3817'));assert(figures['survival-window'].includes('35天'));
});
test('returned visual arrays are independent',()=>{const a=chapter1VisualData(),b=chapter1VisualData();a.base.probabilities[0]=0;a.survivalWindow.rows[0].lastSeenMonth=99;near(b.base.probabilities[0],c);assert.equal(b.survivalWindow.rows[0].lastSeenMonth,10);});
