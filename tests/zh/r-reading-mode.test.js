import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {readRhc,prepareRhc} from '../../shared/js/rhc.js';
import {objectLessonData} from '../../shared/js/object-data.js';
import {OBJECT_STAGES,renderObjectStage} from '../../zh/src/object-grammar.js';
import {expandRLessons,validateRMapping} from '../../zh/renderers/r-code.js';
import {renderMarkdown} from '../../scripts/markdown.js';
import {TRACE_STEPS,traceStepCode,traceCode} from '../../zh/src/tmle-trace-view.js';
const read=path=>readFileSync(path,'utf8');
const rows=readRhc(read('shared/data/public/rhc/source.csv')),data=objectLessonData(rows,prepareRhc(rows));
const plain=html=>html.replace(/<[^>]*>/g,' ').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
const values=html=>[...html.matchAll(/data-object="([^"]+)" data-dim="1" data-value="([^"]+)"|data-owner="([^"]+)"[^>]*><small>([^<]*)<\/small><b>([^<]*)<\/b>/g)].map(m=>m.slice(1)).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));

test('all R object stages retain mathematical values/rows/dimensions and show R operations',()=>{
 for(const stage of Object.keys(OBJECT_STAGES))for(const scenario of ['one','zero','observed']){
  const state={t:.25,z:0,scenario},math=renderObjectStage(stage,data,{...state,mode:'math'}),r=renderObjectStage(stage,data,{...state,mode:'r'});
  assert.deepEqual(values(r),values(math),`${stage}/${scenario}: displayed operands`);
  assert.deepEqual([...r.matchAll(/data-dim="([^"]+)"/g)].map(m=>m[1]).sort(),[...math.matchAll(/data-dim="([^"]+)"/g)].map(m=>m[1]).sort());
  assert(r.includes('data-code-language="r"'));assert(r.includes('data-r-name='));assert(!r.includes('data-julia-name='));
  assert(!/Julia|hcat|Float64|\.\*|\.\-|expit\./.test(plain(r)),`${stage}: R should use R syntax`);
  assert(!math.includes('class="ov-code"'));assert(!math.includes('data-r-name='));
 }
 assert(plain(renderObjectStage('predict',data,{mode:'r'})).includes('%*%'));
 assert(plain(renderObjectStage('change-rate',data,{mode:'r',t:0})).includes('NA_real_'));
});

test('each R lesson renders actual source, beginner explanations and accessible mathematics; drift fails the build',async()=>{
 for(let n=0;n<=8;n++){
  const id=String(n).padStart(2,'0'),map=JSON.parse(read(`zh/src/R/ch${id}.json`)),script=read(map.source);
  validateRMapping(script,map);const html=renderMarkdown(await expandRLessons(`{{r-code:ch${id}}}`));
  assert.equal((html.match(/data-r-line=/g)||[]).length,map.lines.length);
  assert(html.includes(`href="R/ch${id}.R"`));assert(html.includes('Rscript --vanilla'));
  assert(html.includes('<math'));assert(!html.includes('katex-error'));assert(!html.includes('{{r-code:'));
  assert.throws(()=>validateRMapping(script.replace(map.lines[0].code,map.lines[0].code+' # changed'),map),/correspondence/);
  assert.throws(()=>validateRMapping(script,{...map,lines:map.lines.slice(1)}),/Unexplained/);
  if(n===1){assert(html.includes('observations$y'));assert(html.includes('numeric(1)'));assert(html.includes('dim(y)'));}
 }
});

test('R linked code preserves strings/comments and each stage resolves its dependencies before use',()=>{
 const line='shift <- epsilon * h # epsilon and h stay literal here';
 const linked=traceCode(line,'r');assert.equal((linked.match(/data-trace-key=/g)||[]).length,3);
 assert(!traceCode("cat('epsilon', \"h\")",'r').includes('data-trace-key'));
 assert.equal(plain(linked).replace(/\s+/g,' ').trim(),line);
 const map=JSON.parse(read('zh/src/R/ch08-trace.json')),defined=new Set();
 for(let stage=0;stage<10;stage++){
  const entries=traceStepCode(map,stage);assert(entries.length>0);
  for(const entry of entries){for(const key of entry.inputs)assert(defined.has(key),`step${stage+1}: ${key} before assignment`);for(const key of entry.outputs)defined.add(key);}
 }
 for(const key of ['epsilon','q0','q1','offset','h0','h1','qstar_a','qstar0','qstar1','eif_mean'])assert(defined.has(key));
});

const rscript=process.env.RSCRIPT||'Rscript',available=spawnSync(rscript,['--version'],{encoding:'utf8'}).status===0;
test('concatenated displayed R panels execute in a fresh R process from the project root',{skip:!available},()=>{
 const map=JSON.parse(read('zh/src/R/ch08-trace.json'));
 const code=TRACE_STEPS.flatMap((_,stage)=>traceStepCode(map,stage).map(entry=>entry.code)).join('\n')+'\nstopifnot(n == 5735, sum(y) == 1918, epsilon == 0, abs(psi - 0.08649885590233014) < 1e-10, abs(score_mean - 0.0034691393067677457) < 1e-10, abs(eif_mean-score_mean)<1e-12)\n';
 const result=spawnSync(rscript,['--vanilla','-e',code],{encoding:'utf8',timeout:60000,env:{...process.env,TMLE_EPSILON:'0'}});
 assert.equal(result.status,0,result.stderr);assert(result.stdout.includes('risk difference psi'));
});
