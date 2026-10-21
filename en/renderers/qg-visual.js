import {renderInlineMath as math} from '../markdown.js';
import {qgLessonData} from '../../shared/js/qg-lesson.js';
import {OBJECT_COLOURS} from '../src/object-grammar.js';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const symbol=key=>key==='g'?'\\widehat g(W)':`\\widehat Q(${key==='q1'?1:0},W)`;
const colour=key=>OBJECT_COLOURS[key==='g'?'propensity':key];
const rowLabel=row=>`<small>i=${row.rowNumber}</small>`;
function matrix(lesson){
 return `<div class="qg-object qg-matrix ov-teal" data-qg-column="w"><header><strong>${math('W')}</strong><small>Input: baseline variables for the same patients · ${lesson.n} × ${lesson.fit.baselineCount}</small><small>3 variables shown; all 12 history indicators are retained</small><div class="qg-matrix-head"><span>original row</span><span>age/years</span><span>sex</span><span>race</span></div></header>${lesson.sourceRows.map(row=>`<div class="qg-row" data-qg-row="${row.rowNumber}">${rowLabel(row)}<span>${row.age.toFixed(1)}</span><span>${row.x?'Male':'Female'}</span><span>${escape(row.race)}</span></div>`).join('')}<footer>W stays fixed when the treatment input changes<br>The same i identifies the same patient throughout</footer></div>`;
}
function vector(lesson,{key,title,label,values,notes,original=false,input=false,comparison=false}){
 const cls=original?`qg-original ov-${key==='a'?'amber':'blue'}`:input?'qg-vector-input ov-amber':`ov-${colour(key)}`;
 return `<div class="qg-object ${cls}" data-qg-column="${key}"${comparison?` data-qg-comparison="${key}"`:''}><header><strong>${math(title)}</strong><small>${label}</small><small>${lesson.n} × 1 · One ${original||input?'code':'probability'} per person</small></header>${lesson.sourceRows.map((row,i)=>`<div class="qg-row" data-qg-row="${row.rowNumber}" data-qg-value="${values[i]}">${rowLabel(row)}<b>${original||input?values[i]:values[i].toFixed(6)}</b></div>`).join('')}<footer>${notes}</footer></div>`;
}
export function renderQgVisual(html,data){
 const marker='<div class="qg-visual-placeholder"></div>';
 if(!html.includes(marker))return html;
 const lesson=qgLessonData(data),{n,sourceRows}=lesson;
 const out=(key,comparison=false)=>vector(lesson,{key,title:symbol(key),label:key==='g'?'Output: probability of receiving RHC':'Output: probability of death within 30 days',values:lesson.calls[key].shownValues,notes:key==='g'?'Predicted event: A=1<br>Receive RHC':'Predicted event: Y=1<br>Death within 30 days',comparison});
 const calls=['q1','q0','g'].map(key=>{
  const call=lesson.calls[key],isQ=key!=='g';
  const label=isQ?`Keep Q̂ fixed and supply treatment value ${call.predictionA}`:'Keep ĝ fixed and supply only W';
  const aInput=isQ?`<span class="qg-operator qg-join">Join columns</span>${vector(lesson,{key:'prediction-a',title:`a_{\\mathrm{input}}=${call.predictionA}`,label:'Treatment input for prediction',values:sourceRows.map(()=>call.predictionA),notes:'Input for this call<br>Observed A remains in the original record',input:true})}`:'';
  return `<section class="qg-call" data-qg-call="${key}"${key==='q1'?'':' hidden'}><p class="qg-read-note">${isQ?`Combine W with a treatment input column containing ${call.predictionA} for every patient. This forms the input to Q̂.`:'Read W to predict the probability of receiving RHC. During fitting, observed A is the response used to estimate g.'}</p><div class="diagram-scroll" tabindex="0" role="region" aria-label="Patient input and probability output of ${escape(label)}, scroll horizontally"><div class="qg-strip">${matrix(lesson)}${aInput}<span class="qg-operator" aria-label="Feed into fixed function">→</span><div class="qg-model"><small>Fitted using all ${n} patients · Now fixed</small><strong>${math(isQ?'\\widehat Q':'\\widehat g')}</strong><span>${isQ?'Read W and the specified a':'Read only W'}</span><small>${isQ?'Returns mortality risk within 30 days':'Returns the probability of receiving RHC'}</small></div><span class="qg-operator" aria-label="output">→</span>${out(key)}</div></div></section>`;
 }).join('');
 const original=vector(lesson,{key:'a',title:'A',label:'Actual RHC treatment: 1/0',values:sourceRows.map(r=>r.a),notes:'Actual treatment of patients<br>For checking and line-by-line selection',original:true})+vector(lesson,{key:'y',title:'Y',label:'Observed death within 30 days: 1/0',values:sourceRows.map(r=>r.y),notes:'Actual patient outcomes<br>Used for fitting and checking predictions',original:true});
 return html.replace(marker,`<figure class="qg-visual" data-qg-visual style="--qg-half-height:${lesson.shownN*38/2}px">
 <figcaption><strong>Use the same six patients to compare the inputs and outputs of Q̂ and ĝ</strong><br>Check what each function reads and which event it predicts.</figcaption>
 <p>The figure previews rows ${sourceRows[0].rowNumber}–${sourceRows.at(-1).rowNumber} in the original CSV order. Fitting uses all ${n} patients. Probabilities are rounded to six decimal places and ages to one; calculations use full precision.</p>
 <h4>① First check the patient’s baseline, actual treatment and outcome</h4>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="Baseline, original treatment, and outcome columns for the same six patients, scrollable horizontally"><div class="qg-strip" data-qg-source>${matrix(lesson)}${original}</div></div>
 <details class="qg-history"><summary>View the 12 medical history indicators for these six patients</summary><p>The figure shows age, sex and race. Each row also retains the following medical history indicators from the original CSV: 1 means present and 0 means absent.</p>${sourceRows.map(row=>`<p data-qg-row="${row.rowNumber}"><strong>i=${row.rowNumber}</strong>: ${row.history.map((v,j)=>`${escape(lesson.baselineFeatureNames[j+3])}=${v}`).join('; ')}</p>`).join('')}<p>The original W has 15 variables; when fitting, it is encoded into a 17-column design matrix (including intercept, age standardisation and race indicator columns). Q adds the treatment column, giving 18 columns. The figure previews 3 variables for readability.</p></details>
 <h4>② Check which columns are read and output for each function call</h4>
 <div class="qg-controls"><label>Select a function call<select data-qg-mode><option value="q1">Q̂(1,W): Input A all 1, predict death</option><option value="q0">Q̂(0,W): Input A all 0, predict death</option><option value="g">ĝ(W): Read only W, predict receipt of RHC</option></select></label><label>Check the same patient<select data-qg-select-row>${sourceRows.map(row=>`<option value="${row.rowNumber}">Original row i=${row.rowNumber}</option>`).join('')}</select></label><button type="button" data-qg-reset>Reset figure</button></div>
 <p data-qg-status role="status"></p><div class="qg-calls">${calls}</div>
 <h4>③ Compare the probability of death with the probability of receiving RHC</h4>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="Three columns of probability predictions for the same six patients, scrollable horizontally"><div class="qg-strip" data-qg-compare>${out('q1',true)}${out('q0',true)}${out('g',true)}</div></div>
 <p class="qg-compare-note">${math('\\widehat Q(1,w_i)')} and ${math('\\widehat Q(0,w_i)')} use the same baseline for patient ${math('i')}, changing only the treatment input to Q̂; ${math('\\widehat g(w_i)')} predicts the probability of receiving RHC given this baseline. The hat indicates that these probabilities are obtained by fitting the sample; the three columns give mortality risk under each treatment input and the probability of receiving RHC.</p>
 <details class="qg-fit-context"><summary>When fitting the model, aren't A and Y also used?</summary><p>Fit Q using all ${n} patients, predicting Y from W and actual A; fit g by predicting actual A from W. These steps estimate the two functions. Once fixed, a call to Q reads W and a specified treatment a; a call to g reads W. This previews the initial regressions fitted to the full cohort in Chapter 8.</p></details>
 </figure>`);
}
