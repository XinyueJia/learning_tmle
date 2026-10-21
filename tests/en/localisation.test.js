import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {renderMarkdown as renderEn} from '../../en/markdown.js';
import {renderMarkdown as renderZh} from '../../scripts/markdown.js';
import {readRhc,prepareRhc} from '../../shared/js/rhc.js';
import {renderTmleOverview} from '../../en/renderers/tmle-overview.js';
import {renderDrIntro} from '../../en/renderers/dr-intro.js';
import {renderRhcPatientSummary} from '../../en/renderers/rhc-patient-summary.js';
import {validateRMapping} from '../../en/renderers/r-code.js';
const read=p=>readFileSync(p,'utf8');
const rows=readRhc(read('shared/data/public/rhc/source.csv')),fit=prepareRhc(rows);
const han=/\p{Script=Han}/u;
const mathematicalStructure=tex=>tex.replace(/\\(?:text|mathrm|underbraceText)\{[^{}]*\}/g,'{label}').replace(/\s/g,'');
const blocks=source=>[...source.matchAll(/^\$\$\s*\n([\s\S]*?)^\$\$/gm)].map(m=>m[1]);
test('English and Chinese recalls render independently with accessible local labels',()=>{
 const en=renderEn('> **Notation recap:** $P_n$ assigns weight $1/n$ to each observation.\n\n$$\nx=1\n$$');
 assert(en.includes('Symbols')&&en.includes('Mathematical formula; scroll horizontally'));
 assert(!han.test(en));assert.equal((en.match(/class="formula-recall"/g)||[]).length,1);
 const zh=renderZh('> **符号回看：** $P_n$来自样本。');assert(zh.includes('符号回看'));assert(!zh.includes('Close symbol explanation'));
 assert(renderEn('> **Symbols:** $Q$ is the outcome regression.').includes('recall-trigger'));
});
test('all nine English chapters retain derivations, maths blocks and interactive mount identifiers',()=>{
 assert.equal(readdirSync('en/src/chapters').filter(f=>/^ch\d\d\.md$/.test(f)).length,9);
 for(let n=0;n<=8;n++){
  const name=`ch${String(n).padStart(2,'0')}.md`,en=read('en/src/chapters/'+name),zh=read('zh/src/chapters/'+name);
  assert(en.startsWith(`# Chapter ${n}:`));assert(!han.test(en),name);
  assert.deepEqual(blocks(en).map(mathematicalStructure),blocks(zh).map(mathematicalStructure),name+' mathematical structure');
  const mounts=s=>[...s.matchAll(/<div[^>]*>/g)].map(m=>m[0]);assert.deepEqual(mounts(en),mounts(zh),name+' mounts');
 }
});
test('English introduction and overview use the same real patient quantities and complete recalls',()=>{
 const overview=renderTmleOverview(read('en/src/tmle-overview.md'),fit);
 assert.equal((overview.match(/data-to-panel=/g)||[]).length,6);
 assert.equal((overview.match(/class="formula-recall"/g)||[]).length,12);
 assert(!han.test(overview));assert(!overview.includes('katex-error'));
 const nums=[...overview.matchAll(/data-to-number="([^"]+)"/g)].map(m=>+m[1]);
 for(const x of [.003576966662876657,.08997972473530443,.013082375165239402])assert(nums.some(v=>Math.abs(v-x)<1e-12));
 const intro=renderDrIntro(renderEn(read('en/src/chapters/ch00.md')),fit);assert(!han.test(intro));
 assert(intro.includes('empirical distribution')&&overview.includes('one-step'));
 const summary=renderRhcPatientSummary(rows);assert(!han.test(summary));assert(summary.includes('5735')&&summary.includes('1918'));
});
test('English R line explanations match their downloadable executable sources',()=>{
 for(const name of readdirSync('en/src/R').filter(n=>n.endsWith('.json'))){
  const map=JSON.parse(read('en/src/R/'+name));assert(existsSync(map.source),map.source);
  validateRMapping(read(map.source),map);
  assert(map.lines.every(e=>!han.test(e.operation)),name);
 }
});

test('all English mathematical-object views retain the Chinese edition patient values and dimensions',async()=>{
 const {objectLessonData}=await import('../../shared/js/object-data.js');
 const en=await import('../../en/src/object-grammar.js'),zh=await import('../../zh/src/object-grammar.js');
 const data=objectLessonData(rows,fit);
 const objects=html=>[...html.matchAll(/data-object="([^"]+)" data-dim="([^"]+)"(?: data-value="([^"]+)")?/g)].map(m=>m.slice(1)).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
 const entries=html=>[...html.matchAll(/data-owner="([^"]+)"[^>]*><small>([^<]*)<\/small><b>([^<]*)<\/b>/g)].map(m=>m.slice(1)).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
 assert.deepEqual(Object.keys(en.OBJECT_STAGES),Object.keys(zh.OBJECT_STAGES));
 for(const stage of Object.keys(en.OBJECT_STAGES))for(const mode of ['math','julia','r']){
  const state={mode,scenario:'one',t:.1,z:1},a=en.renderObjectStage(stage,data,state),b=zh.renderObjectStage(stage,data,state);
  assert.deepEqual(objects(a),objects(b),stage+'/'+mode+' dimensions/scalars');
  assert.deepEqual(entries(a),entries(b),stage+'/'+mode+' patient entries');
 }
});
