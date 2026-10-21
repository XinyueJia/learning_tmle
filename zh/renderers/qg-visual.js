import {renderInlineMath as math} from '../../scripts/markdown.js';
import {qgLessonData} from '../../shared/js/qg-lesson.js';
import {OBJECT_COLOURS} from '../src/object-grammar.js';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const symbol=key=>key==='g'?'\\widehat g(W)':`\\widehat Q(${key==='q1'?1:0},W)`;
const colour=key=>OBJECT_COLOURS[key==='g'?'propensity':key];
const rowLabel=row=>`<small>i=${row.rowNumber}</small>`;
function matrix(lesson){
 return `<div class="qg-object qg-matrix ov-teal" data-qg-column="w"><header><strong>${math('W')}</strong><small>输入：同一批人的基线 · ${lesson.n} × ${lesson.fit.baselineCount}</small><small>仅预览3项；其余12项保留</small><div class="qg-matrix-head"><span>原始行</span><span>年龄/岁</span><span>sex</span><span>race</span></div></header>${lesson.sourceRows.map(row=>`<div class="qg-row" data-qg-row="${row.rowNumber}">${rowLabel(row)}<span>${row.age.toFixed(1)}</span><span>${row.x?'Male':'Female'}</span><span>${escape(row.race)}</span></div>`).join('')}<footer>W不随预测处理输入改变<br>所有图的同一i都是同一位患者</footer></div>`;
}
function vector(lesson,{key,title,label,values,notes,original=false,input=false,comparison=false}){
 const cls=original?`qg-original ov-${key==='a'?'amber':'blue'}`:input?'qg-vector-input ov-amber':`ov-${colour(key)}`;
 return `<div class="qg-object ${cls}" data-qg-column="${key}"${comparison?` data-qg-comparison="${key}"`:''}><header><strong>${math(title)}</strong><small>${label}</small><small>${lesson.n} × 1 · 每人一个${original||input?'编码':'概率'}</small></header>${lesson.sourceRows.map((row,i)=>`<div class="qg-row" data-qg-row="${row.rowNumber}" data-qg-value="${values[i]}">${rowLabel(row)}<b>${original||input?values[i]:values[i].toFixed(6)}</b></div>`).join('')}<footer>${notes}</footer></div>`;
}
export function renderQgVisual(html,data){
 const marker='<div class="qg-visual-placeholder"></div>';
 if(!html.includes(marker))return html;
 const lesson=qgLessonData(data),{n,sourceRows}=lesson;
 const out=(key,comparison=false)=>vector(lesson,{key,title:symbol(key),label:key==='g'?'输出：接受RHC的概率':'输出：30日死亡概率',values:lesson.calls[key].shownValues,notes:key==='g'?'预测事件：A=1<br>接受RHC':'预测事件：Y=1<br>30日内死亡',comparison});
 const calls=['q1','q0','g'].map(key=>{
  const call=lesson.calls[key],isQ=key!=='g';
  const label=isQ?`固定Q̂，送入预测处理值${call.predictionA}`:'固定ĝ，只读取基线W';
  const aInput=isQ?`<span class="qg-operator qg-join">按列拼接</span>${vector(lesson,{key:'prediction-a',title:`a_{\\mathrm{input}}=${call.predictionA}`,label:'新建的预测处理列',values:sourceRows.map(()=>call.predictionA),notes:'本次调用的输入<br>真实A保留在原记录中',input:true})}`:'';
  return `<section class="qg-call" data-qg-call="${key}"${key==='q1'?'':' hidden'}><p class="qg-read-note">${isQ?`将W和新建的预测处理列（全${call.predictionA}）按列拼接，构成本次预测的输入。`:'只读取W，输出接受RHC的概率。拟合g时，真实A提供要学习的结果。'}</p><div class="diagram-scroll" tabindex="0" role="region" aria-label="${escape(label)}的患者输入与概率输出，可横向滚动"><div class="qg-strip">${matrix(lesson)}${aInput}<span class="qg-operator" aria-label="送入固定函数">→</span><div class="qg-model"><small>全${n}人拟合 · 现固定</small><strong>${math(isQ?'\\widehat Q':'\\widehat g')}</strong><span>${isQ?'读取 W 和预测 a':'只读取 W'}</span><small>${isQ?'返回30日死亡概率':'返回接受RHC概率'}</small></div><span class="qg-operator" aria-label="输出">→</span>${out(key)}</div></div></section>`;
 }).join('');
 const original=vector(lesson,{key:'a',title:'A',label:'真实接受RHC：1/0',values:sourceRows.map(r=>r.a),notes:'患者实际处理<br>用于核对和逐行选择',original:true})+vector(lesson,{key:'y',title:'Y',label:'真实30日死亡：1/0',values:sourceRows.map(r=>r.y),notes:'患者实际结局<br>用于拟合与核对预测',original:true});
 return html.replace(marker,`<figure class="qg-visual" data-qg-visual style="--qg-half-height:${lesson.shownN*38/2}px">
 <figcaption><strong>将这六位患者的基线分别送入Q̂和ĝ</strong><br>先看函数读取什么，再看概率预测什么。</figcaption>
 <p>按原始CSV行序显示第${sourceRows[0].rowNumber}—${sourceRows.at(-1).rowNumber}行，拟合使用完整${n}人。这些只是便于对行的预览，概率显示六位小数、年龄显示一位小数，均为显示近似；计算使用原始精度。</p>
 <h4>① 先查看患者的基线、实际处理与结局</h4>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="同六位患者的基线与原始处理、结局列，可横向滚动"><div class="qg-strip" data-qg-source>${matrix(lesson)}${original}</div></div>
 <details class="qg-history"><summary>查看这六人的其余12项基线</summary><p>图中显示年龄、sex、race；每行还保留以下既往史的原0/1编码。1为该项存在，0为不存在。既往史编码直接读取原CSV。</p>${sourceRows.map(row=>`<p data-qg-row="${row.rowNumber}"><strong>i=${row.rowNumber}</strong>：${row.history.map((v,j)=>`${escape(lesson.baselineFeatureNames[j+3])}=${v}`).join('；')}</p>`).join('')}<p>原始W有15项变量；拟合时编码为17列设计矩阵（含截距、年龄标准化和race指示列）。Q再加入处理列，共18列。图中为便于阅读预览其中3项。</p></details>
 <h4>② 查看每次函数调用读取与输出哪些列</h4>
 <div class="qg-controls"><label>选择要追踪的调用<select data-qg-mode><option value="q1">Q̂(1,W)：输入A全1，预测死亡</option><option value="q0">Q̂(0,W)：输入A全0，预测死亡</option><option value="g">ĝ(W)：只读W，预测接受RHC</option></select></label><label>核对同一患者<select data-qg-select-row>${sourceRows.map(row=>`<option value="${row.rowNumber}">原始行 i=${row.rowNumber}</option>`).join('')}</select></label><button type="button" data-qg-reset>重置图示</button></div>
 <p data-qg-status role="status"></p><div class="qg-calls">${calls}</div>
 <h4>③ 比较死亡概率与接受RHC的概率</h4>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="同六位患者的三列概率预测，可横向滚动"><div class="qg-strip" data-qg-compare>${out('q1',true)}${out('q0',true)}${out('g',true)}</div></div>
 <p class="qg-compare-note">${math('\\widehat Q(1,w_i)')}与${math('\\widehat Q(0,w_i)')}使用相同的第${math('i')}人基线，只改变送入Q̂的处理值；${math('\\widehat g(w_i)')}回答这种基线下接受RHC多常见。帽号表示这些概率由样本拟合得到；三列依次回答两种处理输入下的死亡风险，以及接受RHC的可能性。</p>
 <details class="qg-fit-context"><summary>拟合模型时，A和Y不是也用到了吗？</summary><p>用全${n}人拟合Q时，以W与真实A预测Y；拟合g时，以W预测真实A。这是“学习规则”的阶段。规则固定以后，Q的一次调用读取W和指定的a，g的一次调用读取W。这里预览第8讲用完整队列拟合的初始回归。</p></details>
 </figure>`);
}
