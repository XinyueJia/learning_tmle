import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {TRACE_COLUMNS as C,TRACE_STEPS as STEPS,activeColumns,traceFormula,traceCode,traceLink,traceStepCode} from '../../zh/src/tmle-trace-view.js';
import {traceMathTemplates} from '../../zh/renderers/tmle-trace-maths.js';
const map=JSON.parse(readFileSync('zh/src/julia/ch08-trace.json','utf8'));
const src=readFileSync('zh/src/chapters/ch08.md','utf8');

test('10 steps append each real vector once, with no scalar masquerading as a patient column',()=>{
 assert.equal(STEPS.length,10);const all=activeColumns(9);
 assert.equal(new Set(all).size,26);assert.equal(all.length,26);
 for(const key of all){assert(C[key]);assert(!C[key].scalar);assert.deepEqual(map.columns[key].dimensions,['n']);}
 for(let stage=1;stage<10;stage++)assert.deepEqual(activeColumns(stage).slice(0,-STEPS[stage].added.length),activeColumns(stage-1));
 for(const key of ['epsilon','n','psi','score_mean','eif_mean']){assert(C[key].scalar);assert(!all.includes(key));}
 assert.throws(()=>activeColumns(-1));assert.throws(()=>activeColumns(10));assert.throws(()=>traceLink('made_up'));
});
test('every formula operand and actual Julia assignment resolves to the same named data object',()=>{
 for(let stage=0;stage<10;stage++){
  const formula=traceFormula(stage),keys=[...formula.matchAll(/data-trace-key="([^"]+)"/g)].map(m=>m[1]);
  for(const key of keys){assert(C[key]);assert(map.columns[key]);assert(C[key].meaning.length>15);}
  for(const key of STEPS[stage].outputs){assert(map.lines.some(entry=>entry.outputs.includes(key)),`No executable assignment ${key}`);}
 }
 assert(traceFormula(3).includes('logit('));assert(!traceFormula(3).includes('data-trace-key="y"'),'Never logit(Y)');
 assert(traceFormula(6).includes('data-trace-key="h0"'));assert(!traceFormula(6).includes('data-trace-key="h"'),'Arm0 uses H0, not actual H');
 assert(traceFormula(7).includes('data-trace-key="h1"'));
 assert(traceFormula(9).includes('data-trace-key="centred"'));assert(traceFormula(9).includes('data-trace-key="score_contribution"'));
});
test('all current and line formulas compile to accessible maths retaining editable TeX',()=>{
 const html=traceMathTemplates();assert.equal((html.match(/data-trace-math=/g)||[]).length,10);
 assert.equal((html.match(/data-trace-line-math=/g)||[]).length,map.lines.filter(e=>e.formulaTex).length);
 assert(html.includes('<math'));assert(html.includes('application/x-tex'));assert(!html.includes('katex-error'));
});
test('Julia linked tokens preserve copyable code and do not highlight string/comment literals',()=>{
 const line='shift = epsilon .* h # h is a column, not a new variable';
 const html=traceCode(line);assert.equal((html.match(/data-trace-key=/g)||[]).length,3);
 const plain=html.replace(/<[^>]*>/g,'').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&amp;','&');assert.equal(plain,line);
 assert(!traceCode('println("offset", "h")').includes('data-trace-key'));
 assert.equal((traceCode('eta0 = offset0 .+ shift0').match(/data-trace-key=/g)||[]).length,3);
});
test('original derivations, exercises and original full eighth-lesson script remain in the course',()=>{
 assert(src.includes('用链式法则推导logistic更新的score'));assert(src.includes('Y_i-Y_iq_i-q_i+Y_iq_i'));assert(src.includes('double robustness'));
 assert(src.includes('data-rhc-julia="08"'));assert(src.includes('data-case-study="8"'));assert(src.includes('data-lab="8"'));
 assert(src.includes('相应的代码变量'));assert(src.includes('TMLE_EPSILON=0.003'));assert(src.includes('临床因果解释还需论证调整充分性'));
});

// Every code operand must be defined by preparation or an earlier displayed step.
test('ten code panels form a dependency-complete programme, including initial fit, g and epsilon',()=>{
 const defined=new Set();
 for(let stage=0;stage<10;stage++)for(const entry of traceStepCode(map,stage)){
  for(const key of entry.inputs)assert(defined.has(key),`step${stage+1}: ${key} must already be defined for ${entry.code}`);
  for(const key of entry.outputs)defined.add(key);
 }
 assert(defined.has('fit')&&defined.has('g')&&defined.has('epsilon')&&defined.has('eif_mean'));
 assert(traceStepCode(map,0).some(e=>e.code.startsWith('include(')));
 assert(traceStepCode(map,4).some(e=>e.code.startsWith('isfinite(epsilon)')));
});

const juliaBinary=process.env.JULIA_BIN||'julia';
const juliaAvailable=spawnSync(juliaBinary,['--version'],{encoding:'utf8'}).status===0;
test('concatenated displayed code panels actually run in a fresh Julia process', {skip:!juliaAvailable},()=>{
 const code=STEPS.flatMap((_,stage)=>traceStepCode(map,stage).map(e=>e.code)).join('\n');
 const programme=code+'\n@assert n == 5735 && sum(y) == 1918\n@assert epsilon == 0 && abs(score_mean - 0.0034691393067677457) < 1e-12\n@assert abs(psi - 0.08649885590233014) < 1e-12\n@assert abs(eif_mean-score_mean)<1e-12\nprintln("DISPLAYED_PANELS_EXECUTED")';
 const result=spawnSync(juliaBinary,['--startup-file=no','--history-file=no','-e',programme],{cwd:resolve('zh/julia'),encoding:'utf8',timeout:60000,env:{...process.env,TMLE_EPSILON:'0'}});
 assert.equal(result.status,0,result.stderr);assert(result.stdout.includes('DISPLAYED_PANELS_EXECUTED'));
});
