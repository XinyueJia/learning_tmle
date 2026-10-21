import {readFile} from 'node:fs/promises';
import {OBJECT_COLOURS} from '../src/object-grammar.js';

const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const fieldColour = {'check-risk':'risk','check-values':'influence','check-mean':'mean-influence'};
const cardStyle = 'display:inline-flex;flex-direction:column;gap:4px;padding:8px;max-width:100%;overflow-wrap:anywhere;vertical-align:top';

function objectChip(id, direction, objects) {
 const object=objects[id], colour=OBJECT_COLOURS[fieldColour[id]||id]||'slate';
 const dimensions=object.dimensions.length?object.dimensions.join(' × '):['Int','Float64'].includes(object.type)?'1':'container-or-no-value';
 return `<span class="ov-object ov-${colour}" data-object="${escape(id)}" data-direction="${direction}" data-dim="${escape(dimensions)}" style="${cardStyle}"><strong>${escape(object.label)}</strong><code>${escape(object.julia)}</code><small>类型：${escape(object.type)}</small><small>维度：${escape(object.dimensionText)}</small></span>`;
}

/** Fail rather than silently replacing missing source correspondence with a comment. */
export function chapter1ObjectCards(script, mapping) {
 const chapter=mapping.chapters.ch01, source=script.trimEnd().split('\n');
 if(source.length!==chapter.lineCount)throw Error('RHC Julia source line count changed');
 const executable=source.flatMap((code,index)=>code.trim()&&!code.trimStart().startsWith('#')?[index+1]:[]);
 const entries=new Map();
 for(const entry of chapter.lines){
  if(entries.has(entry.line))throw Error(`Duplicate RHC Julia explanation at line ${entry.line}`);
  if(!executable.includes(entry.line)||entry.code!==source[entry.line-1])throw Error(`RHC Julia source changed at line ${entry.line}`);
  if(!entry.operation)throw Error(`Missing RHC Julia operation at line ${entry.line}`);
  for(const id of [...entry.inputs,...entry.outputs])if(!mapping.objects[id])throw Error(`Unknown RHC Julia object ${id}`);
  for(const id of entry.mathIds)if(!mapping.allowedMathIds.includes(id))throw Error(`Unknown RHC Julia mathematical role ${id}`);
  entries.set(entry.line,entry);
 }
 for(const line of executable)if(!entries.has(line))throw Error(`Unexplained RHC Julia line ${line}`);
 return executable.map(line=>{
  const entry=entries.get(line);
  const inputs=entry.inputs.map(id=>objectChip(id,'input',mapping.objects)).join(' ');
  const outputs=entry.outputs.map(id=>objectChip(id,'output',mapping.objects)).join(' ');
  const objectMap=`<div class="rhc-julia-object-map" data-julia-line="${line}" data-operation="${escape(entry.kind)}"><div class="ov-expression" role="group" aria-label="代码第${line}行的输入对象"><strong>输入对象</strong> ${inputs||'<span>无已有数据对象输入；载入程序定义。</span>'}</div><div class="ov-expression" role="group" aria-label="代码第${line}行的输出对象"><strong>输出对象</strong> ${outputs}</div></div>`;
  const formula=entry.formulaTex===null?'<p class="rhc-julia-no-formula">本行准备程序名称或定义，不计算统计量。</p>':`$$\n${entry.formulaTex}\n$$`;
  return `### 代码第${line}行\n\n\`\`\`julia\n${entry.code}\n\`\`\`\n\n${objectMap}\n\n${formula}\n\n<p class="rhc-julia-operation" data-julia-operation="${line}">${escape(entry.operation)}</p>\n`;
 }).join('\n');
}

export async function expandRhcLessons(md){
 for(const [marker,chapter] of [...md.matchAll(/<div class="rhc-julia" data-rhc-julia="(0[1-8])"><\/div>/g)]){
  const script=await readFile(`zh/julia/rhc_lessons/ch${chapter}.jl`,'utf8');
  let extra='';
  if(chapter==='01'){
   const mapping=JSON.parse(await readFile('zh/src/julia/object-map.json','utf8'));
   extra='\n\n<details><summary>逐行解释：输入、运算与输出</summary>\n\n'+chapter1ObjectCards(script,mapping)+'\n\n</details>';
  }
  const core=await readFile('shared/julia/EIFCase.jl','utf8'),tag=`# BEGIN_CH${chapter}`,stop=`# END_CH${chapter}`,start=core.indexOf(tag),end=core.indexOf(stop,start);
  const definitions=chapter==='01'?'':`\n\n<details><summary>查看本讲数学函数的源码</summary>\n\n下列函数由RHCCase复用，计数来自真实原文件；它们没有内置真实总体答案。\n\n\`\`\`julia\n${core.slice(start+tag.length,end).trim()}\n\`\`\`\n\n</details>`;
  md=md.replace(marker,()=>`运行前输入是[同一份RHC原始CSV](../shared/data/public/rhc/source.csv)。读取与拟合定义见[RHCCase.jl](../shared/julia/RHCCase.jl)，完整[本讲脚本](julia/rhc_lessons/ch${chapter}.jl)可编辑；所有脚本可从其他工作目录运行，只须保留zh/与shared/相对位置。\n\n\`\`\`sh\njulia --startup-file=no --history-file=no zh/julia/rhc_lessons/ch${chapter}.jl\n\`\`\`\n\n\`\`\`julia\n${script.trim()}\n\`\`\`\n${extra}${definitions}`);
 }
 return md;
}
