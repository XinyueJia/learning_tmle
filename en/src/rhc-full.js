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
 if([mapResponse,codeResponse,rMapResponse,rCodeResponse].some(r=>!r.ok))throw Error('Could not read original RHC data or code mapping');
 const fit=data.fit,mapping=await mapResponse.json(),source=await codeResponse.text();
 const rMapping=await rMapResponse.json(),rSource=await rCodeResponse.text(),rSourceLines=rSource.trimEnd().split('\n');
 if(rSourceLines.length!==rMapping.lineCount||rMapping.lines.some(e=>rSourceLines[e.line-1]!==e.code))throw Error('R line/source mapping has drifted');
 const sourceLines=source.trimEnd().split('\n');
 if(sourceLines.length!==mapping.lineCount||mapping.lines.some(e=>sourceLines[e.line-1]!==e.code))throw Error('Julia line/source mapping has drifted');
 if(maths.size!==STEPS.length)throw Error('Object experiment lacks accessible formulae; rebuild the course');
 const state={epsilon:0,lo:-1,hi:1,iterations:0,solved:false,stage:0,start:0,row:1,pinned:null,language:root.closest('.chapter').dataset.codeLanguage||'julia'};
 const baseline=tmleTrace(fit,0);let trace=baseline;
 root.innerHTML=`<h3>Build TMLE column by column from the same patient records</h3><p>All ${fit.n} patients come from the same original RHC CSV; Y denotes all-cause death within 30 days. Hold original A/Y, W and initial Q/g fixed; update predictions using one common ε. W contains 15 original variables encoded as a 17-column design; Q adds A for 18 columns. See Chapter 0’s study protocol for the conditions required for a clinical causal interpretation.</p>
 <div class="trace-step-list" role="group" aria-label="Ten steps to build columns">${STEPS.map((s,i)=>`<button type="button" data-trace-stage="${i}" aria-pressed="${i===0}">${i+1}. ${s.title}</button>`).join('')}</div>
 <div class="trace-navigation"><button type="button" data-trace-action="back">Previous step</button><button type="button" data-trace-action="next">Next step: add columns</button><span class="trace-progress" role="status" aria-live="polite"></span></div>
 <div class="controls trace-controls"><label data-trace-key="epsilon" class="ov-orange">Shared update parameter ε<input data-full-epsilon type="number" min="-1" max="1" step="0.001" value="0" aria-describedby="trace-epsilon-help"></label><button data-full-action="step" type="button">Perform one bisection iteration</button><button data-full-action="solve" type="button">Solve for update parameter ε</button><button data-full-action="reset" type="button">Reset this update</button></div>
 <p id="trace-epsilon-help">ε is one scalar shared by everyone and both arms; before solving the equation, the table shows the current trial ε.</p>
 <p role="status" class="full-status"></p><section class="trace-step-content" aria-label="Formula and explanation for the current step"></section>
 <div class="trace-row-controls"><button type="button" data-trace-action="previous-rows">Previous 6 rows</button><button type="button" data-trace-action="next-rows">Next 6 rows</button><label>Select a patient to check<select data-trace-row></select></label><button type="button" data-trace-action="clear-link">Clear symbol highlighting</button></div>
 <p class="trace-window" role="status"></p><p class="trace-table-help">Each step adds columns to the right. Row i stays fixed on the left. Each column retains its colour, variable name and unit; decimals are rounded only for display.</p>
 <div class="trace-table-scroll" tabindex="0" role="region" aria-label="Same real RHC patient table, with intermediate quantities added step by step; scroll horizontally"><table class="trace-patient-table"><caption>Original patient order is preserved; columns are computed from real data</caption><thead><tr><th scope="col" class="trace-row-key">Original row i</th><th scope="col" class="trace-w-preview">Partial preview of W<br><small>age / sex / race</small></th></tr></thead><tbody></tbody></table></div>
 <div class="trace-link-note" role="status" aria-live="polite">Orange borders and “Updated” labels mark cells that changed relative to ε=0.</div>
 <div class="trace-row-path" aria-label="Prediction update path for the current patient"></div>
 <div class="lesson-language-control"><label>Code language for this step <select data-trace-language><option value="julia">Julia operations</option><option value="r">R operations</option></select></label></div>
 <section class="trace-current-code" aria-label="Actual code in the selected language for this step"></section>
 <div class="full-results"></div>
 <details class="trace-all-code"><summary>View full Julia code and line-by-line explanations</summary><p>All code is read from the <a href="julia/tmle_trace.jl" download>actual workbook</a>. Execute it in sequence; each step uses variables defined earlier. A one-dimensional Julia Vector has size (n,); n×1 denotes the mathematical column shape. Dots denote elementwise operations; sum adds the entire column.</p><pre tabindex="0"><code>${traceCode(source)}</code></pre><div class="trace-all-explanations"></div></details>
 <details class="trace-diagnostics"><summary>View initial regression designs, coefficients and convergence</summary><p>g uses 17 baseline design columns; Q adds observed A. There is no g truncation, regularisation, patient exclusion or imputation. Mean age is ${f(fit.ageMean)} and age SD with denominator n is ${f(fit.ageSd)}. Maximum absolute score is ${fit.gFit.maxScore.toExponential(3)} for g and ${fit.qFit.maxScore.toExponential(3)} for Q.</p>${diagnosticTable('Actual initial logistic coefficients',['Column','g coefficients','Q coefficients'],fit.featureNames.map((name,i)=>[name,f(fit.gFit.beta[i]),f(fit.qFit.beta[i])]).concat([['A (last Q column)','Not applicable',f(fit.qFit.beta.at(-1))]]))}</details>
 <details class="trace-variance"><summary>How does EIF variance estimate the standard error?</summary><div class="trace-variance-values"></div><p>This experiment fits on the full sample. Using an empirical SE for confidence intervals requires checks on fit convergence, remainder rates and sampling dependence; clinical interpretation also requires Chapter 0’s study design and identification conditions. Section 7 relates the empirical equation, error products and estimation error.</p></details>`;
 const input=root.querySelector('[data-full-epsilon]'),status=root.querySelector('.full-status'),panel=root.querySelector('.trace-step-content'),table=root.querySelector('.trace-patient-table'),body=table.tBodies[0],head=table.tHead.rows[0],scroll=root.querySelector('.trace-table-scroll'),rowSelect=root.querySelector('select[data-trace-row]');
 const activeMap=()=>state.language==='r'?rMapping:mapping,languageLabel=()=>state.language==='r'?'R':'Julia',currentCode=()=>state.language==='r'?rSource:source;
 const dimension=key=>C[key]?.scalar?'Scalar · one number':`${state.language==='r'?'Numeric vector':'Vector'} · ${fit.n} entries (mathematical column ${fit.n}×1)`;
 function lineCard(entry){
  const list=(keys,empty)=>keys.length?keys.map(key=>C[key]?`${traceLink(key,key)} <small>${dimension(key)}</small>`:`<code>${esc(key)}</code> <small>${esc(activeMap().columns[key]?.type||'Program definition')}</small>`).join('; '):empty;
  return `<div class="trace-line-card" data-trace-code-line="${entry.line}"><h5>Workbook line ${entry.line}</h5><pre tabindex="0"><code>${traceCode(entry.code,state.language)}</code></pre><p><b>Inputs: </b>${list(entry.inputs,'Program environment or constants on this line')}<br><b>Outputs: </b>${list(entry.outputs,'Checks, display or control flow')}</p><p>${esc(entry.operation)}</p>${(state.language==='r'?rLineMaths:lineMaths).has(entry.line)?`<details><summary>Which formula corresponds to this line?</summary>${(state.language==='r'?rLineMaths:lineMaths).get(entry.line)}</details>`:''}</div>`;
 }
 function renderWorkbook(){const all=root.querySelector('.trace-all-code');all.querySelector('summary').textContent=`View full ${languageLabel()} code and line-by-line explanations`;const link=state.language==='r'?'R/tmle_trace.R':'julia/tmle_trace.jl';all.querySelector('p').innerHTML=`Execute the <a href="${link}" download>actual ${languageLabel()} workbook</a> in sequence; each step reuses earlier variables. ${state.language==='r'?'R applies *, + and - elementwise to equal-length vectors; %*% is matrix multiplication and sum adds entries.':'Julia dots denote elementwise operations; sum adds the full column.'} Mathematical column n×1 represents an n-element vector.`;all.querySelector('code').innerHTML=traceCode(currentCode(),state.language);all.querySelector('.trace-all-explanations').innerHTML=activeMap().lines.map(lineCard).join('');root.querySelector('[data-trace-language]').value=state.language;root.dataset.traceLanguage=state.language;}
 renderWorkbook();
 function scalarValue(key){return {epsilon:state.epsilon,n:fit.n,psi:trace.summary.estimate,score_mean:trace.summary.score,eif_mean:trace.summary.eif_mean}[key];}
 function presentKeys(){return new Set(activeColumns(state.stage));}
 function linked(key,lock=false,position=false){
  if(!C[key])return;if(lock)state.pinned=state.pinned===key?null:key;
  const current=state.pinned||key;
  for(const el of root.querySelectorAll('[data-trace-key]')){const selected=el.dataset.traceKey===current;el.classList.toggle('trace-linked',selected);if(el.matches('button'))el.setAttribute('aria-pressed',String(selected));}
  const c=C[current],first=STEPS.findIndex(s=>(C[current].scalar?s.outputs:s.added).includes(current));
  root.querySelector('.trace-link-note').textContent=`${c.symbol} ↔ ${languageLabel()} ${current}; ${dimension(current)}. ${c.meaning}${c.scalar?` Current value: ${scalarValue(current)}.`:!presentKeys().has(current)?` This column is added at step ${first+1}.`:''}`;
  if(position&&!c.scalar){const col=head.querySelector(`[data-trace-column="${current}"]`);if(col)scroll.scrollTo({left:Math.max(0,col.offsetLeft-80),behavior:'auto'});}
 }
 function clearLink(){state.pinned=null;for(const el of root.querySelectorAll('.trace-linked')){el.classList.remove('trace-linked');if(el.matches('button'))el.setAttribute('aria-pressed','false');}root.querySelector('.trace-link-note').textContent='Orange borders and “Updated” labels mark cells that changed relative to ε=0.';}
 function renderTable(){
  const keys=activeColumns(state.stage),desired=new Set(keys),added=new Set(STEPS[state.stage].added);
  for(const th of [...head.querySelectorAll('[data-trace-column]')])if(!desired.has(th.dataset.traceColumn))th.remove();
  for(const key of keys){let th=head.querySelector(`[data-trace-column="${key}"]`);if(!th){th=document.createElement('th');th.scope='col';th.dataset.traceColumn=key;head.append(th);}th.className=`ov-${C[key].colour}`;th.dataset.traceKey=key;th.innerHTML=`${traceLink(key)}<code>${key}</code><small>${C[key].label}<br>${C[key].unit} · n entries</small>${added.has(key)?'<b class="trace-new-label">Added in this step</b>':''}`;}
  const desiredRows=new Set(trace.rowNumbers.map(String));for(const tr of [...body.rows])if(!desiredRows.has(tr.dataset.traceRow))tr.remove();
  for(const person of trace.shown){let tr=body.querySelector(`[data-trace-row="${person.row}"]`);if(!tr){tr=document.createElement('tr');tr.dataset.traceRow=String(person.row);tr.innerHTML=`<th scope="row" class="trace-row-key">i=${person.row}</th><td class="trace-w-preview">${person.age.toFixed(1)} years / ${person.x?'Male':'Female'} / ${esc(person.race)}</td>`;body.append(tr);}
   tr.classList.toggle('trace-selected-row',person.row===state.row);
   for(const td of [...tr.querySelectorAll('[data-trace-key]')])if(!desired.has(td.dataset.traceKey))td.remove();
   for(const key of keys){let td=tr.querySelector(`[data-trace-key="${key}"]`);if(!td){td=document.createElement('td');td.dataset.traceKey=key;tr.append(td);}
    const value=person[key],zero=baseline.vectors[key][person.row-1],changed=Math.abs(value-zero)>1e-12;
    td.className=`ov-${C[key].colour}${added.has(key)?' trace-new-column':''}${changed?' trace-value-changed':''}`;td.dataset.value=String(value);td.dataset.changed=String(changed);td.title=`Original row ${person.row}; ${key}; unrounded value ${value}; at ε=0: ${zero}`;
    td.innerHTML=`<span>${f(value)}</span>${changed?'<small class="trace-change-label">Updated</small>':''}${key==='qa'||key==='qstar_a'?`<small class="trace-origin">From ${person.a?'A=1':'A=0'}</small>`:''}`;
   }
  }
  table.dataset.stage=String(state.stage);table.dataset.vectorColumns=String(keys.length);
 }
 function renderStep(){
  const step=STEPS[state.stage];panel.innerHTML=`<h4>Step ${state.stage+1}/10 · ${step.title}</h4><p>${step.intro}</p><div class="diagram-scroll" tabindex="0" role="region" aria-label="Formula for this step, kept on one line; scroll horizontally"><div class="trace-formula" role="group" aria-label="Linked formula for this step">${traceFormula(state.stage)}</div></div><details class="trace-formal"><summary>View the full formula for this step</summary>${maths.get(state.stage)}</details><details class="trace-prediction"><summary>${step.prediction}</summary><p>${step.answer}</p></details>`;
  root.querySelector('.trace-progress').textContent=`Step ${state.stage+1}/10; ${activeColumns(state.stage).length} patient-level variables added.`;
  root.querySelector('[data-trace-action=back]').disabled=state.stage===0;root.querySelector('[data-trace-action=next]').disabled=state.stage===STEPS.length-1;
  for(const button of root.querySelectorAll('[data-trace-stage]')){const current=+button.dataset.traceStage===state.stage;button.setAttribute('aria-pressed',String(current));if(current)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');}
  const entries=traceStepCode(activeMap(),state.stage);
  root.querySelector('.trace-current-code').innerHTML=`<h4>Line-by-line explanation of this step’s ${languageLabel()} code</h4><p>These lines come from the executable workbook. Step 1 loads modules, reads data and prepares initial fits; later steps continue from the preceding step. ${state.language==='r'?'Run step by step in an R session at the project root; alternatively save in en/R and run with Rscript --vanilla.':'If combining snippets yourself, save a .jl file in en/julia before running; relative paths are resolved from that file’s directory.'} Variable-name buttons locate the corresponding table columns.</p>${entries.map(lineCard).join('')}`;
 }
 function renderPath(){
  const person=trace.shown.find(r=>r.row===state.row),suffix=state.stage===6?'0':state.stage===7?'1':'',q=suffix?'q'+suffix:'qa',offset='offset'+suffix,shift='shift'+suffix,eta='eta'+suffix,updated=suffix?'qstar'+suffix:'qstar_a';
  if(state.stage<3){root.querySelector('.trace-row-path').innerHTML='';return;}
  const pathKeys=state.stage===3?[q,offset]:[q,offset,shift,eta,updated];
  root.querySelector('.trace-row-path').innerHTML=`<h4>Inspect the prediction update for patient i=${person.row}: ${suffix?'Prediction input A='+suffix:'Observed A='+person.a}</h4><p>This explains operations for one original row; summaries below the table always use all ${fit.n} patients. Addition occurs on the logit scale; expit returns probabilities. Borders mark updates; initial Q stays fixed.</p><div class="diagram-scroll" tabindex="0" role="region" aria-label="Prediction update operations for the current patient; scroll horizontally"><div class="trace-object-chain">${pathKeys.map((key,j)=>`${j?`<span class="trace-path-arrow">${j===1?'logit →':j===2?'+':j===3?'=':'expit →'}</span>`:''}<div class="trace-value-object ov-${C[key].colour}" data-trace-key="${key}">${traceLink(key)}<strong>${f(person[key])}</strong><small>${C[key].unit}${key===shift?`<br>${f(state.epsilon)} × ${f(person[suffix?'h'+suffix:'h'])}`:''}<br>i=${person.row}; one entry of an n-element vector</small></div>`).join('')}</div></div>`;
 }
 function renderMetrics(){
  const s=trace.summary,items=[['Patient count',fit.n,'n'],['Initial plug-in estimate',pp(s.initial_estimate),null],['Initial AIPW (fixed)',pp(s.aipw),null]];
  if(state.stage>=5)items.push(['Mean weighted residual',s.score.toExponential(2),'score_mean']);
  if(state.stage>=8)items.push([state.solved?'TMLE plug-in estimate':'Plug-in estimate at current ε',pp(s.estimate),'psi']);
  if(state.stage>=9)items.push(['Empirical mean of the fitted EIF',s.eif_mean.toExponential(2),'eif_mean'],['Mean centred prediction contrast',s.centred_mean.toExponential(2),null]);
  root.querySelector('.full-results').innerHTML=`<div class="metrics">${items.map(([label,value,key])=>`<div class="metric"${key?` data-trace-key="${key}"`:''}><div class="metric-label">${key?traceLink(key,label):label}</div><div class="metric-value">${value}</div></div>`).join('')}</div><p>All summaries use all ${fit.n} patients before the display window is selected. ${state.solved?'Automatic root finding is complete; |score| is below 10⁻¹².':'Current ε is not marked as a solved root; enter a trial value or bisect.'} Bisection interval [${state.lo.toFixed(8)}, ${state.hi.toFixed(8)}], after ${state.iterations} steps. Qε ranges from ${f(s.min_q)} to ${f(s.max_q)} at current ε.</p>`;
  root.querySelector('.trace-variance-values').textContent=`Empirical variance of the current fitted EIF (denominator n=${fit.n}) is ${f(s.variance)}; plug-in SE is ${f(s.se)} in units of probability difference.`;
 }
 function render({stepChanged=false,position=false}={}){
  trace=tmleTrace(fit,state.epsilon,{start:state.start,count:6});input.value=String(state.epsilon);
  root.dataset.fullEpsilon=String(state.epsilon);root.dataset.fullScore=String(trace.summary.score);root.dataset.fullEstimate=String(trace.summary.estimate);root.dataset.fullN=String(fit.n);root.dataset.traceStage=String(state.stage);
  rowSelect.innerHTML=trace.rowNumbers.map(i=>`<option value="${i}" ${i===state.row?'selected':''}>Original row i=${i}</option>`).join('');
  root.querySelector('.trace-window').textContent=`Showing original rows i=${trace.rowNumbers[0]}—${trace.rowNumbers.at(-1)}; tracking i=${state.row}; full n=${fit.n}. Selecting rows or changing pages does not refit models.`;
  root.querySelector('[data-trace-action=previous-rows]').disabled=state.start===0;root.querySelector('[data-trace-action=next-rows]').disabled=state.start+6>=fit.n;
  if(stepChanged||!panel.childElementCount)renderStep();renderTable();renderPath();renderMetrics();
  if(state.pinned)linked(state.pinned,false,position);
  else if(position){const first=STEPS[state.stage].added[0],col=head.querySelector(`[data-trace-column="${first}"]`);if(col)scroll.scrollTo({left:Math.max(0,col.offsetLeft-80)});}
 }
 const act=fn=>{try{fn();status.textContent='';}catch(e){status.textContent=e.message;}};
 input.addEventListener('change',()=>act(()=>{const value=Number(input.value);if(input.value.trim()===''||!Number.isFinite(value)||Math.abs(value)>1)throw Error('ε must be finite and between −1 and 1; the previous valid state is retained.');tmleTrace(fit,value);state.epsilon=value;state.solved=false;const changed=state.stage<4;state.stage=Math.max(4,state.stage);render({stepChanged:changed});}));
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
}catch(e){root.textContent=`The multivariable real-data analysis could not run: ${e.message}. No synthetic data were substituted.`;root.setAttribute('role','alert');}}

}
