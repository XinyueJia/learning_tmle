import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRhc} from '../../shared/js/rhc.js';
import {summariseRhcPatients} from '../../shared/js/rhc-summary.js';
import {renderRhcPatientSummary} from '../../zh/renderers/rhc-patient-summary.js';

test('patient summary uses column denominators and sample age SD on a hand-calculable cohort',()=>{
 const rows=[{a:0,x:0,y:0,age:20},{a:0,x:1,y:1,age:30},{a:1,x:0,y:1,age:40},{a:1,x:1,y:1,age:50}];
 const s=summariseRhcPatients(rows);
 assert.equal(s.all.n,4);assert.equal(s.all.ageMean,35);assert(Math.abs(s.all.ageSd-Math.sqrt(500/3))<1e-12);
 assert.equal(s.rhc.n,2);assert.equal(s.rhc.ageMean,45);assert(Math.abs(s.rhc.ageSd-Math.sqrt(50))<1e-12);
 assert.equal(s.all.female,2);assert.equal(s.noRhc.deaths,1);assert.equal(s.rhc.deaths,2);
 const text=renderRhcPatientSummary(rows).replace(/<[^>]*>/g,'');assert(text.includes('1（50.0%）'));assert(text.includes('2（100.0%）'));assert(text.includes('35.0'));
});

test('RHC summary agrees with independently computed Python csv/statistics benchmarks',()=>{
 const rows=readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8')),s=summariseRhcPatients(rows);
 // Benchmarks computed separately with Python csv.DictReader, statistics.mean and statistics.stdev.
 const expected={all:[5735,61.37588299738448,16.681929290407542,2543,3192,1918],rhc:[2184,60.749835796703294,15.630698163533834,906,1278,830],noRhc:[3551,61.76092582652774,17.287674372233937,1637,1914,1088]};
 for(const [group,want] of Object.entries(expected))for(const [i,key] of ['n','ageMean','ageSd','female','male','deaths'].entries())assert(Math.abs(s[group][key]-want[i])<1e-10,`${group}/${key}`);
 const html=renderRhcPatientSummary(rows);assert.equal((html.match(/<table /g)||[]).length,1);assert.equal((html.match(/scope="row"/g)||[]).length,5);
});

test('undefined subgroup SD is shown without fabricating zero, and invalid observations fail',()=>{
 const rows=[{a:1,x:0,y:1,age:25}],s=summariseRhcPatients(rows);
 assert.equal(s.all.ageSd,null);assert.equal(s.noRhc.ageMean,null);assert.equal(s.noRhc.ageSd,null);
 assert(!/NaN|Infinity/.test(renderRhcPatientSummary(rows)));
 assert.throws(()=>summariseRhcPatients([]),/required/);
 assert.throws(()=>summariseRhcPatients([{a:1,x:0,y:1,age:NaN}]),/Invalid/);
});
