import {getRhcData} from '../../shared/js/rhc-browser-data.js';
import {solveRhc} from '../../shared/js/rhc.js';
import {tmleTrace} from '../../shared/js/tmle-trace.js';
import {TRACE_COLUMNS as C,TRACE_STEPS as STEPS,activeColumns,traceFormula,traceLink,traceCode,traceNumber as f,escapeTrace as esc,traceStepCode} from './tmle-trace-view.js';
const pp=x=>`${(100*x).toFixed(6)} pp`;
const diagnosticTable=(caption,heads,rows)=>`<div class="table-wrap" tabindex="0" role="region" aria-label="${caption}"><table><caption>${caption}</caption><thead><tr>${heads.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export async function mount(scope = document){
const root=scope.querySelector('[data-rhc-full]');
if(root){try{
 const maths=new Map([...root.querySelectorAll('template[data-trace-math]')].map(e=>[Number(e.dataset.traceMath),e.innerHTML]));
 const rLineMaths=new Map([...root.querySelectorAll('template[data-trace-r-line-math]')].map(e=>[Number(e.dataset.traceRLineMath),e.innerHTML]));
 const lineMaths=new Map([...root.querySelectorAll('template[data-trace-line-math]')].map(e=>[Number(e.dataset.traceLineMath),e.innerHTML]));
 const [data,mapResponse,codeResponse,rMapResponse,rCodeResponse]=await Promise.all([getRhcData(),fetch('src/julia/ch08-trace.json'),fetch('julia/tmle_trace.jl'),fetch('src/R/ch08-trace.json'),fetch('R/tmle_trace.R')]);
 if([mapResponse,codeResponse,rMapResponse,rCodeResponse].some(r=>!r.ok))throw Error('真实RHC数据或代码映射无法读取');
 const fit=data.fit,mapping=await mapResponse.json(),source=await codeResponse.text();
 const rMapping=await rMapResponse.json(),rSource=await rCodeResponse.text(),rSourceLines=rSource.trimEnd().split('\n');
 if(rSourceLines.length!==rMapping.lineCount||rMapping.lines.some(e=>rSourceLines[e.line-1]!==e.code))throw Error('R行号/源码映射已漂移');
 const sourceLines=source.trimEnd().split('\n');
 if(sourceLines.length!==mapping.lineCount||mapping.lines.some(e=>sourceLines[e.line-1]!==e.code))throw Error('Julia行号/源码映射已漂移');
 if(maths.size!==STEPS.length)throw Error('对象实验缺少可访问公式，请重新构建课件');
 const state={epsilon:0,lo:-1,hi:1,iterations:0,solved:false,stage:0,start:0,row:1,pinned:null,language:root.closest('.chapter').dataset.codeLanguage||'julia'};
 const baseline=tmleTrace(fit,0);let trace=baseline;
 root.innerHTML=`<h3>用同一张真实患者表逐列构建TMLE</h3><p>全部${fit.n}人来自同一原始RHC CSV，Y是30日全因死亡。固定原始A/Y、W及初始Q/g；只沿同一个ε更新预测。指定W含15项原变量、编码为17列设计，Q再加A成为18列。临床因果解释的条件见第0章研究方案。</p>
 <div class="trace-step-list" role="group" aria-label="逐列构建的10步">${STEPS.map((s,i)=>`<button type="button" data-trace-stage="${i}" aria-pressed="${i===0}">${i+1}. ${s.title}</button>`).join('')}</div>
 <div class="trace-navigation"><button type="button" data-trace-action="back">上一步</button><button type="button" data-trace-action="next">下一步：加入新列</button><span class="trace-progress" role="status" aria-live="polite"></span></div>
 <div class="controls trace-controls"><label data-trace-key="epsilon" class="ov-orange">共同更新幅度 ε<input data-full-epsilon type="number" min="-1" max="1" step="0.001" value="0" aria-describedby="trace-epsilon-help"></label><button data-full-action="step" type="button">执行一次二分迭代</button><button data-full-action="solve" type="button">求解更新参数 ε</button><button data-full-action="reset" type="button">重置本次更新</button></div>
 <p id="trace-epsilon-help">ε是一个标量，所有人和两臂共用；未求根时下表表示当前ε。</p>
 <p role="status" class="full-status"></p><section class="trace-step-content" aria-label="当前步骤的公式和解释"></section>
 <div class="trace-row-controls"><button type="button" data-trace-action="previous-rows">上一组6行</button><button type="button" data-trace-action="next-rows">下一组6行</button><label>选择要核对的患者<select data-trace-row></select></label><button type="button" data-trace-action="clear-link">清除符号高亮</button></div>
 <p class="trace-window" role="status"></p><p class="trace-table-help">下表沿步骤向右加入列。左侧行号i固定。同一列保持颜色、变量名称和单位；表中小数仅为显示舍入。</p>
 <div class="trace-table-scroll" tabindex="0" role="region" aria-label="同一真实RHC患者表，逐步增加中间量，可横向滚动"><table class="trace-patient-table"><caption>原始患者行序保持不变；列由真实数据计算</caption><thead><tr><th scope="col" class="trace-row-key">原始行i</th><th scope="col" class="trace-w-preview">W的部分预览<br><small>age / sex / race</small></th></tr></thead><tbody></tbody></table></div>
 <div class="trace-link-note" role="status" aria-live="polite">橙色边标并注明“有更新”的单元格表示相对ε=0改变。</div>
 <div class="trace-row-path" aria-label="当前患者的预测更新路径"></div>
 <div class="lesson-language-control"><label>本步代码语言 <select data-trace-language><option value="julia">Julia运算</option><option value="r">R运算</option></select></label></div>
 <section class="trace-current-code" aria-label="本步对应的当前语言的真实代码"></section>
 <div class="full-results"></div>
 <details class="trace-all-code"><summary>查看完整Julia代码及逐行解释</summary><p>所有代码均从<a href="julia/tmle_trace.jl" download>实际工作簿</a>读取。先连续执行一次；每步代码片段使用前面已定义的变量。Julia一维Vector的size为(n,)，图中n×1表示数学列形状。代码上的点表示逐元素运算，sum才对整列加总。</p><pre tabindex="0"><code>${traceCode(source)}</code></pre><div class="trace-all-explanations"></div></details>
 <details class="trace-diagnostics"><summary>查看初始回归的设计、系数和收敛情况</summary><p>g用17列基线design；Q用design加实际A。未截断g、正则化、删人或插补。年龄均值${f(fit.ageMean)}，以n为分母的年龄标准差${f(fit.ageSd)}。g最大score绝对值${fit.gFit.maxScore.toExponential(3)}，Q为${fit.qFit.maxScore.toExponential(3)}。</p>${diagnosticTable('实际初始logistic系数',['列','g系数','Q系数'],fit.featureNames.map((name,i)=>[name,f(fit.gFit.beta[i]),f(fit.qFit.beta[i])]).concat([['A（Q最后一列）','不适用',f(fit.qFit.beta.at(-1))]]))}</details>
 <details class="trace-variance"><summary>如何用EIF方差估计标准误？</summary><div class="trace-variance-values"></div><p>本实验直接用全样本拟合。将经验SE用于置信区间，需要检查拟合收敛、余项速率与抽样依赖；临床解释还需第0章的研究设计和识别条件。正文第7节给出经验方程、误差乘积与估计误差的关系。</p></details>`;
 const input=root.querySelector('[data-full-epsilon]'),status=root.querySelector('.full-status'),panel=root.querySelector('.trace-step-content'),table=root.querySelector('.trace-patient-table'),body=table.tBodies[0],head=table.tHead.rows[0],scroll=root.querySelector('.trace-table-scroll'),rowSelect=root.querySelector('select[data-trace-row]');
 const activeMap=()=>state.language==='r'?rMapping:mapping,languageLabel=()=>state.language==='r'?'R':'Julia',currentCode=()=>state.language==='r'?rSource:source;
 const dimension=key=>C[key]?.scalar?'标量 · 1个数':`${state.language==='r'?'numeric向量':'Vector'} · ${fit.n}项（数学列${fit.n}×1）`;
 function lineCard(entry){
  const list=(keys,empty)=>keys.length?keys.map(key=>C[key]?`${traceLink(key,key)} <small>${dimension(key)}</small>`:`<code>${esc(key)}</code> <small>${esc(activeMap().columns[key]?.type||'程序定义')}</small>`).join('；'):empty;
  return `<div class="trace-line-card" data-trace-code-line="${entry.line}"><h5>工作簿第${entry.line}行</h5><pre tabindex="0"><code>${traceCode(entry.code,state.language)}</code></pre><p><b>输入：</b>${list(entry.inputs,'程序环境或本行常量')}<br><b>输出：</b>${list(entry.outputs,'执行检查、显示或控制流程')}</p><p>${esc(entry.operation)}</p>${(state.language==='r'?rLineMaths:lineMaths).has(entry.line)?`<details><summary>这行代码对应什么公式？</summary>${(state.language==='r'?rLineMaths:lineMaths).get(entry.line)}</details>`:''}</div>`;
 }
 function renderWorkbook(){const all=root.querySelector('.trace-all-code');all.querySelector('summary').textContent=`查看完整${languageLabel()}代码及逐行解释`;const link=state.language==='r'?'R/tmle_trace.R':'julia/tmle_trace.jl';all.querySelector('p').innerHTML=`从<a href="${link}" download>实际${languageLabel()}工作簿</a>连续执行；每步沿用此前变量。${state.language==='r'?'R的*、+、-对同长向量逐项运算，%*%用于矩阵乘法，sum加总。':'Julia的点号表示逐元素运算，sum对整列加总。'}数学列n×1对应n项向量。`;all.querySelector('code').innerHTML=traceCode(currentCode(),state.language);all.querySelector('.trace-all-explanations').innerHTML=activeMap().lines.map(lineCard).join('');root.querySelector('[data-trace-language]').value=state.language;root.dataset.traceLanguage=state.language;}
 renderWorkbook();
 function scalarValue(key){return {epsilon:state.epsilon,n:fit.n,psi:trace.summary.estimate,score_mean:trace.summary.score,eif_mean:trace.summary.eif_mean}[key];}
 function presentKeys(){return new Set(activeColumns(state.stage));}
 function linked(key,lock=false,position=false){
  if(!C[key])return;if(lock)state.pinned=state.pinned===key?null:key;
  const current=state.pinned||key;
  for(const el of root.querySelectorAll('[data-trace-key]')){const selected=el.dataset.traceKey===current;el.classList.toggle('trace-linked',selected);if(el.matches('button'))el.setAttribute('aria-pressed',String(selected));}
  const c=C[current],first=STEPS.findIndex(s=>(C[current].scalar?s.outputs:s.added).includes(current));
  root.querySelector('.trace-link-note').textContent=`${c.symbol} ↔ ${languageLabel()} ${current}；${dimension(current)}。${c.meaning}${c.scalar?` 当前值${scalarValue(current)}。`:!presentKeys().has(current)?` 此列将在第${first+1}步加入。`:''}`;
  if(position&&!c.scalar){const col=head.querySelector(`[data-trace-column="${current}"]`);if(col)scroll.scrollTo({left:Math.max(0,col.offsetLeft-80),behavior:'auto'});}
 }
 function clearLink(){state.pinned=null;for(const el of root.querySelectorAll('.trace-linked')){el.classList.remove('trace-linked');if(el.matches('button'))el.setAttribute('aria-pressed','false');}root.querySelector('.trace-link-note').textContent='橙色边标并注明“有更新”的单元格表示相对ε=0改变。';}
 function renderTable(){
  const keys=activeColumns(state.stage),desired=new Set(keys),added=new Set(STEPS[state.stage].added);
  for(const th of [...head.querySelectorAll('[data-trace-column]')])if(!desired.has(th.dataset.traceColumn))th.remove();
  for(const key of keys){let th=head.querySelector(`[data-trace-column="${key}"]`);if(!th){th=document.createElement('th');th.scope='col';th.dataset.traceColumn=key;head.append(th);}th.className=`ov-${C[key].colour}`;th.dataset.traceKey=key;th.innerHTML=`${traceLink(key)}<code>${key}</code><small>${C[key].label}<br>${C[key].unit} · n项</small>${added.has(key)?'<b class="trace-new-label">本步新增</b>':''}`;}
  const desiredRows=new Set(trace.rowNumbers.map(String));for(const tr of [...body.rows])if(!desiredRows.has(tr.dataset.traceRow))tr.remove();
  for(const person of trace.shown){let tr=body.querySelector(`[data-trace-row="${person.row}"]`);if(!tr){tr=document.createElement('tr');tr.dataset.traceRow=String(person.row);tr.innerHTML=`<th scope="row" class="trace-row-key">i=${person.row}</th><td class="trace-w-preview">${person.age.toFixed(1)}岁 / ${person.x?'Male':'Female'} / ${esc(person.race)}</td>`;body.append(tr);}
   tr.classList.toggle('trace-selected-row',person.row===state.row);
   for(const td of [...tr.querySelectorAll('[data-trace-key]')])if(!desired.has(td.dataset.traceKey))td.remove();
   for(const key of keys){let td=tr.querySelector(`[data-trace-key="${key}"]`);if(!td){td=document.createElement('td');td.dataset.traceKey=key;tr.append(td);}
    const value=person[key],zero=baseline.vectors[key][person.row-1],changed=Math.abs(value-zero)>1e-12;
    td.className=`ov-${C[key].colour}${added.has(key)?' trace-new-column':''}${changed?' trace-value-changed':''}`;td.dataset.value=String(value);td.dataset.changed=String(changed);td.title=`原始行${person.row}；${key}；未舍入值${value}；ε=0时${zero}`;
    td.innerHTML=`<span>${f(value)}</span>${changed?'<small class="trace-change-label">有更新</small>':''}${key==='qa'||key==='qstar_a'?`<small class="trace-origin">取${person.a?'A=1':'A=0'}</small>`:''}`;
   }
  }
  table.dataset.stage=String(state.stage);table.dataset.vectorColumns=String(keys.length);
 }
 function renderStep(){
  const step=STEPS[state.stage];panel.innerHTML=`<h4>第${state.stage+1}/10步 · ${step.title}</h4><p>${step.intro}</p><div class="diagram-scroll" tabindex="0" role="region" aria-label="本步公式，保持一行，可横向滚动"><div class="trace-formula" role="group" aria-label="本步可联动公式">${traceFormula(state.stage)}</div></div><details class="trace-formal"><summary>查看本步的完整公式</summary>${maths.get(state.stage)}</details><details class="trace-prediction"><summary>先预测，再看理由：${step.prediction}</summary><p>${step.answer}</p></details>`;
  root.querySelector('.trace-progress').textContent=`第${state.stage+1}/10步；已加入${activeColumns(state.stage).length}个逐人变量。`;
  root.querySelector('[data-trace-action=back]').disabled=state.stage===0;root.querySelector('[data-trace-action=next]').disabled=state.stage===STEPS.length-1;
  for(const button of root.querySelectorAll('[data-trace-stage]')){const current=+button.dataset.traceStage===state.stage;button.setAttribute('aria-pressed',String(current));if(current)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');}
  const entries=traceStepCode(activeMap(),state.stage);
  root.querySelector('.trace-current-code').innerHTML=`<h4>逐行解释本步${languageLabel()}代码</h4><p>以下原句来自可运行工作簿；第1步含模块载入、读取及初始拟合准备，其后从前一步继续执行。${state.language==='r'?'在项目根目录的R会话中逐步运行；也可保存到zh/R目录，再以Rscript --vanilla执行。':'若自行拼接片段，保存成zh/julia目录内的.jl文件再运行，相对路径以该文件目录为准。'}按钮中的变量名可与表列同步定位。</p>${entries.map(lineCard).join('')}`;
 }
 function renderPath(){
  const person=trace.shown.find(r=>r.row===state.row),suffix=state.stage===6?'0':state.stage===7?'1':'',q=suffix?'q'+suffix:'qa',offset='offset'+suffix,shift='shift'+suffix,eta='eta'+suffix,updated=suffix?'qstar'+suffix:'qstar_a';
  if(state.stage<3){root.querySelector('.trace-row-path').innerHTML='';return;}
  const pathKeys=state.stage===3?[q,offset]:[q,offset,shift,eta,updated];
  root.querySelector('.trace-row-path').innerHTML=`<h4>查看患者i=${person.row}的预测更新：${suffix?'预测输入A='+suffix:'实际A='+person.a}</h4><p>下面只解释一个原始行的运算，表下汇总始终用全部${fit.n}人。加号发生在logit尺度；expit才转回概率。边框注明更新量，初始Q仍固定。</p><div class="diagram-scroll" tabindex="0" role="region" aria-label="当前患者预测更新运算，可横向滚动"><div class="trace-object-chain">${pathKeys.map((key,j)=>`${j?`<span class="trace-path-arrow">${j===1?'logit →':j===2?'+':j===3?'=':'expit →'}</span>`:''}<div class="trace-value-object ov-${C[key].colour}" data-trace-key="${key}">${traceLink(key)}<strong>${f(person[key])}</strong><small>${C[key].unit}${key===shift?`<br>${f(state.epsilon)} × ${f(person[suffix?'h'+suffix:'h'])}`:''}<br>i=${person.row}；n项向量中的1项</small></div>`).join('')}</div></div>`;
 }
 function renderMetrics(){
  const s=trace.summary,items=[['人数',fit.n,'n'],['初始代入估计',pp(s.initial_estimate),null],['初始AIPW（固定）',pp(s.aipw),null]];
  if(state.stage>=5)items.push(['加权残差的平均',s.score.toExponential(2),'score_mean']);
  if(state.stage>=8)items.push([state.solved?'TMLE代入估计':'当前ε下的代入估计',pp(s.estimate),'psi']);
  if(state.stage>=9)items.push(['EIF输出的样本平均',s.eif_mean.toExponential(2),'eif_mean'],['预测风险差中心化后的平均',s.centred_mean.toExponential(2),null]);
  root.querySelector('.full-results').innerHTML=`<div class="metrics">${items.map(([label,value,key])=>`<div class="metric"${key?` data-trace-key="${key}"`:''}><div class="metric-label">${key?traceLink(key,label):label}</div><div class="metric-value">${value}</div></div>`).join('')}</div><p>所有汇总先用完整${fit.n}人计算，再截取显示窗口。${state.solved?'自动求根已完成，|score|小于10⁻¹²。':'当前ε尚未标为求根解；可手填或二分。'} 二分区间[${state.lo.toFixed(8)}, ${state.hi.toFixed(8)}]，已二分${state.iterations}步。当前ε下Qε的范围${f(s.min_q)}—${f(s.max_q)}。</p>`;
  root.querySelector('.trace-variance-values').textContent=`更新后EIF的经验方差（分母n=${fit.n}）为${f(s.variance)}，代入SE为${f(s.se)}概率差。`;
 }
 function render({stepChanged=false,position=false}={}){
  trace=tmleTrace(fit,state.epsilon,{start:state.start,count:6});input.value=String(state.epsilon);
  root.dataset.fullEpsilon=String(state.epsilon);root.dataset.fullScore=String(trace.summary.score);root.dataset.fullEstimate=String(trace.summary.estimate);root.dataset.fullN=String(fit.n);root.dataset.traceStage=String(state.stage);
  rowSelect.innerHTML=trace.rowNumbers.map(i=>`<option value="${i}" ${i===state.row?'selected':''}>原始行 i=${i}</option>`).join('');
  root.querySelector('.trace-window').textContent=`显示原始行i=${trace.rowNumbers[0]}—${trace.rowNumbers.at(-1)}；追踪i=${state.row}；完整n=${fit.n}。选行或翻页不重新拟合。`;
  root.querySelector('[data-trace-action=previous-rows]').disabled=state.start===0;root.querySelector('[data-trace-action=next-rows]').disabled=state.start+6>=fit.n;
  if(stepChanged||!panel.childElementCount)renderStep();renderTable();renderPath();renderMetrics();
  if(state.pinned)linked(state.pinned,false,position);
  else if(position){const first=STEPS[state.stage].added[0],col=head.querySelector(`[data-trace-column="${first}"]`);if(col)scroll.scrollTo({left:Math.max(0,col.offsetLeft-80)});}
 }
 const act=fn=>{try{fn();status.textContent='';}catch(e){status.textContent=e.message;}};
 input.addEventListener('change',()=>act(()=>{const value=Number(input.value);if(input.value.trim()===''||!Number.isFinite(value)||Math.abs(value)>1)throw Error('ε须为−1到1的有限数；保留上一个合法状态。');tmleTrace(fit,value);state.epsilon=value;state.solved=false;const changed=state.stage<4;state.stage=Math.max(4,state.stage);render({stepChanged:changed});}));
 rowSelect.addEventListener('change',()=>{state.row=Number(rowSelect.value);renderTable();renderPath();if(state.pinned)linked(state.pinned);});
 root.addEventListener('click',event=>act(()=>{
  const stageButton=event.target.closest('button[data-trace-stage]');if(stageButton){state.stage=+stageButton.dataset.traceStage;state.pinned=null;clearLink();render({stepChanged:true,position:true});return;}
  const action=event.target.closest('[data-full-action]')?.dataset.fullAction;
  if(action){
   if(action==='reset')Object.assign(state,{epsilon:0,lo:-1,hi:1,iterations:0,solved:false,stage:0,start:0,row:1,pinned:null});
   if(action==='step'){const mid=(state.lo+state.hi)/2,out=tmleTrace(fit,mid);if(out.summary.score>0)state.lo=mid;else state.hi=mid;state.epsilon=mid;state.iterations++;state.solved=false;state.stage=Math.max(5,state.stage);}
   if(action==='solve'){state.epsilon=solveRhc(fit).epsilon;state.solved=true;state.stage=9;}
   clearLink();render({stepChanged:true,position:action!=='reset'});if(action==='reset')scroll.scrollLeft=0;return;
  }
  const movement=event.target.closest('[data-trace-action]')?.dataset.traceAction;
  if(movement){
   if(movement==='clear-link'){clearLink();return;}
   if(movement==='next'||movement==='back'){state.stage=Math.min(9,Math.max(0,state.stage+(movement==='next'?1:-1)));clearLink();render({stepChanged:true,position:true});}
   else{state.start=Math.max(0,Math.min(fit.n-1,state.start+(movement==='next-rows'?6:-6)));state.row=state.start+1;render();}return;
  }
  const link=event.target.closest('button[data-trace-key]');if(link){const key=link.dataset.traceKey,first=STEPS.findIndex(s=>(C[key].scalar?s.outputs:s.added).includes(key));if(first>state.stage){state.stage=first;render({stepChanged:true});}linked(key,true,true);}
 }));
 root.addEventListener('pointermove',event=>{const element=event.target.closest('[data-trace-key]');if(element)linked(element.dataset.traceKey);});
 root.addEventListener('focusin',event=>{const element=event.target.closest('[data-trace-key]');if(element)linked(element.dataset.traceKey,false,true);});
 root.addEventListener('pointerleave',()=>{if(!state.pinned){const focus=root.contains(document.activeElement)?document.activeElement.closest('[data-trace-key]'):null;if(focus)linked(focus.dataset.traceKey);else clearLink();}});
 root.addEventListener('keydown',event=>{if(event.key==='Escape')clearLink();});
 root.closest('.chapter').addEventListener('eif:code-language',event=>{state.language=event.detail.language;renderWorkbook();render({stepChanged:true});if(state.pinned)linked(state.pinned);});
 render();root.dataset.fullMounted='true';root.dataset.traceMounted='true';
}catch(e){root.textContent=`多变量真实分析无法运行：${e.message}。未用合成数据代替。`;root.setAttribute('role','alert');}}

}
