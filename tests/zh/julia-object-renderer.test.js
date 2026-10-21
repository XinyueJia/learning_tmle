import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chapter1ObjectCards, expandRhcLessons} from '../../zh/renderers/rhc-code.js';
import {renderMarkdown} from '../../scripts/markdown.js';

const read=path=>readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');
const mapping=JSON.parse(read('zh/src/julia/object-map.json'));
const script=read(mapping.chapters.ch01.source);
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const marker=chapter=>`<div class="rhc-julia" data-rhc-julia="${chapter}"></div>`;
const cards=chapter1ObjectCards(script,mapping);
const rendered=renderMarkdown(cards);
const cardSection=line=>cards.split(`### 代码第${line}行\n`)[1]?.split('### 代码第')[0];

function clone(){return structuredClone(mapping);}

test('every executable line displays its exact source and verified operation',()=>{
 assert.equal((cards.match(/^### 代码第\d+行$/gm)||[]).length,17);
 assert.deepEqual([...cards.matchAll(/data-julia-line="(\d+)"/g)].map(match=>Number(match[1])),mapping.chapters.ch01.lines.map(entry=>entry.line));
 for(const entry of mapping.chapters.ch01.lines){
  const section=cardSection(entry.line);
  assert(section.includes(`\`\`\`julia\n${entry.code}\n\`\`\``),`Missing literal code line ${entry.line}`);
  assert(section.includes(`data-julia-operation="${entry.line}">${escape(entry.operation)}</p>`));
  assert(section.includes(`aria-label="代码第${entry.line}行的输入对象"`));
  assert(section.includes(`aria-label="代码第${entry.line}行的输出对象"`));
 }
 assert(!cards.includes('println将括号内文字和当前变量值输出到终端'), 'No generic print fallback remains');
});

test('each input and output has its own typed, dimensioned object card',()=>{
 for(const entry of mapping.chapters.ch01.lines){
  const section=cardSection(entry.line);
  for(const [direction,ids] of [['input',entry.inputs],['output',entry.outputs]]){
   for(const id of ids){
    const object=mapping.objects[id];
    assert(section.includes(`data-object="${id}" data-direction="${direction}"`));
    assert(section.includes(`<code>${escape(object.julia)}</code>`));
    assert(section.includes(`类型：${escape(object.type)}`));
    assert(section.includes(`维度：${escape(object.dimensionText)}`));
   }
  }
 }
 const broadcast=cardSection(19);
 assert.match(broadcast,/ov-object ov-blue" data-object="outcomes" data-direction="input" data-dim="n"/);
 assert.match(broadcast,/ov-object ov-blue" data-object="risk" data-direction="input" data-dim="1"/);
 assert.match(broadcast,/ov-object ov-orange" data-object="influence" data-direction="output" data-dim="n"/);
 const reduced=cardSection(21);
 assert.match(reduced,/data-object="mean-influence" data-direction="output" data-dim="1"/);
 assert.match(cardSection(11),/ov-object ov-slate" data-object="sample-size"/);
 assert.match(cardSection(25),/ov-object ov-orange" data-object="check-values" data-direction="output" data-dim="8"/);
 assert.match(cardSection(31),/ov-object ov-orange" data-object="check-mean" data-direction="input"/);
});

test('all mathematical operations render actual KaTeX and program setup is labelled honestly',()=>{
 const formulas=mapping.chapters.ch01.lines.filter(entry=>entry.formulaTex!==null);
 assert.equal((rendered.match(/class="equation"/g)||[]).length,formulas.length);
 assert.equal((rendered.match(/<math /g)||[]).length,formulas.length);
 for(const entry of formulas)assert(cardSection(entry.line).includes(`$$\n${entry.formulaTex}\n$$`));
 for(const line of [3,5]){
  assert(!cardSection(line).includes('$$'));
  assert(cardSection(line).includes('不计算统计量'));
 }
 assert(!rendered.includes('$$'));
 assert(!rendered.includes('### 代码'));
 assert(rendered.includes('Vector{Int}'));
 assert(rendered.includes('Vector{Float64}'));
 assert(!rendered.includes('<p>\\overline'));
});

test('first-lecture integration preserves the full 32-line script, headings and existing summary',async()=>{
 const expanded=await expandRhcLessons(marker('01'));
 const html=renderMarkdown(expanded);
 assert(expanded.includes(`\`\`\`julia\n${script.trim()}\n\`\`\``));
 assert(expanded.includes('<summary>逐行解释：输入、运算与输出</summary>'));
 assert(expanded.includes('### 代码第19行'));
 assert.equal((html.match(/class="rhc-julia-object-map"/g)||[]).length,17);
 assert.equal((html.match(/class="rhc-julia-operation"/g)||[]).length,17);
 assert.equal((html.match(/<details>/g)||[]).length,1);
 assert(!html.includes('查看本讲数学函数的源码'));
 assert(!html.includes('data-rhc-julia='));
 assert(!html.includes('$$'));
 assert(html.includes('@__DIR__'),'Markdown preserves the Julia directory macro');
 assert(html.includes('mean_influence = sum(influence) / n'));
 assert(html.includes('按组人数加权的影响值平均'));
});

test('source changes, missing explanations, duplicates and unknown objects fail instead of falling back',()=>{
 assert.throws(()=>chapter1ObjectCards(script.replace('events = sum(y)','events = 1'),mapping),/source changed at line 15/);
 assert.throws(()=>chapter1ObjectCards(script+'\nprintln(n)\n',mapping),/line count changed/);
 const missing=clone();missing.chapters.ch01.lines=missing.chapters.ch01.lines.filter(entry=>entry.line!==19);
 assert.throws(()=>chapter1ObjectCards(script,missing),/Unexplained.*19/);
 const duplicate=clone();duplicate.chapters.ch01.lines.push(duplicate.chapters.ch01.lines[0]);
 assert.throws(()=>chapter1ObjectCards(script,duplicate),/Duplicate/);
 const unknown=clone();unknown.chapters.ch01.lines[0].outputs=['invented-object'];
 assert.throws(()=>chapter1ObjectCards(script,unknown),/Unknown RHC Julia object invented-object/);
 const unknownMath=clone();unknownMath.chapters.ch01.lines[0].mathIds=['invented-formula'];
 assert.throws(()=>chapter1ObjectCards(script,unknownMath),/Unknown RHC Julia mathematical role/);
 const unexplained=clone();unexplained.chapters.ch01.lines[0].operation='';
 assert.throws(()=>chapter1ObjectCards(script,unexplained),/Missing RHC Julia operation/);
});

test('object labels, types, dimensions and beginner explanations are escaped HTML text',()=>{
 const changed=clone(),payload='<img src=x onerror="bad()">';
 const object=changed.objects.outcomes;
 object.label=payload;object.julia=payload;object.type=payload;object.dimensionText=payload;
 changed.chapters.ch01.lines.find(entry=>entry.line===13).operation=payload;
 const text=chapter1ObjectCards(script,changed);
 assert(!text.includes(payload));
 assert(text.includes(escape(payload)));
 assert(renderMarkdown(text).includes('&lt;img'));
});

test('chapters 2–8 retain their complete source scripts and shared pure-function excerpts',async()=>{
 for(let index=2;index<=8;index++){
  const chapter=String(index).padStart(2,'0');
  const expanded=await expandRhcLessons(marker(chapter));
  const actual=read(`zh/julia/rhc_lessons/ch${chapter}.jl`).trim();
  const core=read('shared/julia/EIFCase.jl');
  const startTag=`# BEGIN_CH${chapter}`,endTag=`# END_CH${chapter}`;
  const start=core.indexOf(startTag),end=core.indexOf(endTag,start);
  const excerpt=core.slice(start+startTag.length,end).trim();
  assert(expanded.includes(`\`\`\`julia\n${actual}\n\`\`\``));
  assert(expanded.includes(`\`\`\`julia\n${excerpt}\n\`\`\``));
  assert(expanded.includes('<summary>查看本讲数学函数的源码</summary>'));
  assert(!expanded.includes('rhc-julia-object-map'));
  assert(!expanded.includes('逐行解释：输入、运算与输出'));
  assert(!expanded.includes('data-rhc-julia='));
 }
});
