import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {readRhc,prepareRhc} from '../../shared/js/rhc.js';
import {objectLessonData} from '../../shared/js/object-data.js';
import {renderObjectStage,objectFigure,OBJECT_STAGES} from '../../zh/src/object-grammar.js';
import {renderChapter1Visuals} from '../../zh/renderers/chapter1-visuals.js';
const rows=readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8')),fit=prepareRhc(rows),d=objectLessonData(rows,fit);

test('all object expressions render without fabricated probabilities or unresolved placeholders',()=>{
 for(const stage of Object.keys(OBJECT_STAGES))for(const mode of ['math','julia']){
  const html=renderObjectStage(stage,d,{mode,t:.1,z:1});
  assert(html.includes('ov-expression'));assert.equal(html.includes('对应的可运行Julia'),mode==='julia');
  assert(!/NaN|Infinity|undefined/.test(html),stage);
 }
});
test('design, patient and coefficient rows have distinct dimensional and alignment contracts',()=>{
 const html=renderObjectStage('predict',d,{mode:'julia'});
 assert(html.includes('5735 × 18'));assert(html.includes('data-dim="5735 × 17"'));
 assert(html.includes('data-dim="18 × 1"'));assert(html.includes('data-dim="5735 × 1"'));
 const coeff=html.match(/data-object="q-coefficients"[\s\S]*?<\/footer><\/div>/)[0];
 assert(coeff.includes('data-alignment="feature"'));assert(!coeff.includes('data-record='));assert(coeff.includes('data-feature="A"'));
 assert(html.includes('expit.(hcat('));assert(html.includes(') *'));
});
test('first chapter changes primary operands while preserving fixed worked examples and unique IDs',()=>{
 const input=readFileSync('zh/src/chapters/ch01.md','utf8');
 const html=renderChapter1Visuals(input,d);
 assert(!html.includes('进展或全因死亡'),'RHC outcome is all-cause mortality only');
 assert.equal((html.match(/data-visual-id=/g)||[]).length,18);
 assert.equal((html.match(/data-object-stage=/g)||[]).length,13);
 assert.equal((html.match(/data-object-toolbar=/g)||[]).length,1);
 const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'no duplicate IDs');
 const grouped=renderObjectStage('weighted-mean',d);
 assert(grouped.includes('data-alignment="outcome"'));assert(!grouped.includes('data-record='));assert(grouped.includes('3817人'));
 assert(grouped.includes('data-dim="2 × 1"'));
});
test('t zero preserves undefined quotient and endpoints never silently recenter old IF',()=>{
 const zero=renderObjectStage('change-rate',d,{t:0,z:0});assert(zero.includes('data-quotient="undefined"'));assert(zero.includes('0/0未定义'));
 for(const z of [0,1])for(const t of [0,.1,1]){
  const html=renderObjectStage('old-new',d,{t,z});
  assert(html.includes('data-object="old-d-new-mean"'));assert(html.includes('data-object="new-d-new-mean"'));
  const old=Number(html.match(/data-object="old-d-new-mean" data-dim="1" data-value="([^"]+)"/)[1]);
  const centred=Number(html.match(/data-object="new-d-new-mean" data-dim="1" data-value="([^"]+)"/)[1]);
  assert(Math.abs(old-t*(z-1918/5735))<1e-14);assert(Math.abs(centred)<1e-14);
 }
});
test('patient display window never changes the reduction to the cohort scalar',()=>{
 const later=objectLessonData(rows,fit,{start:12,count:6});
 const html=renderObjectStage('patient-mean',later);
 assert(html.includes('data-record="13"'));assert(!html.includes('data-record="1"'));
 assert(html.includes('data-object="events" data-dim="1" data-value="1918"'));
 assert(html.includes('data-object="sample-size" data-dim="1" data-value="5735"'));
 assert(objectFigure('patient-mean',later).includes('data-object-window>13—18'));
});
const juliaBin=process.env.JULIA_BIN||'julia';
const hasJulia=spawnSync(juliaBin,['--version'],{encoding:'utf8'}).status===0;
test('both displayed object workbooks execute their real-data assertions', {skip:!hasJulia},()=>{
 for(const chapter of ['00','01']){
  const r=spawnSync(juliaBin,['--startup-file=no','--history-file=no',`zh/julia/object_ch${chapter}.jl`],{encoding:'utf8',timeout:60000});
  assert.equal(r.status,0,r.stderr);assert(r.stdout.includes('assertions passed'));
 }
});
test('embedded Julia snippets occur literally in the executable workbooks',()=>{
 const workbooks=Object.fromEntries(['00','01'].map(c=>[Number(c),readFileSync(`zh/julia/object_ch${c}.jl`,'utf8')]));
 for(const [stage,meta]of Object.entries(OBJECT_STAGES)){
  for(const scenario of ['one','zero','observed']){
   const html=renderObjectStage(stage,d,{mode:'julia',scenario});
   const snippet=html.match(/<pre tabindex="0"><code>([\s\S]*?)<\/code><\/pre>/)[1].replaceAll('&gt;','>').replaceAll('&lt;','<').replaceAll('&quot;','"').replaceAll('&amp;','&');
   for(const line of snippet.split('\n')){
    // The observed-A prediction is also a separately asserted equivalent of row selection.
    const workbook=workbooks[meta.chapter];
    assert(workbook.includes(line),`${stage}: missing executable line ${line}`);
   }
  }
 }
});
