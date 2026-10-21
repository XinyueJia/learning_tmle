import {renderInlineMath as math} from '../markdown.js';
const fmt=value=>(value>0?'+':'')+value.toFixed(6);
const rule='D^{\\mathrm{mean}}_P';
export function renderIfNotation(html,data){
 const marker='<div class="if-notation-placeholder"></div>';
 if(!html.includes(marker))return html;
 const {n,sumY,meanY}=data.mean,rows=data.shown;
 if(!rows.length||rows.some(row=>Math.abs(row.influence-(row.y-meanY))>1e-14))throw Error('Inconsistent real-record influence preview');
 const branch=[0,1].map(y=>{
  const count=y?sumY:n-sumY,p=count/n,d=data.grouped.D[y];
  return `<div class="ifn-branch" data-ifn-outcome="${y}" data-ifn-probability="${p}" data-ifn-output="${d}"><strong>${math(`Y=${y}`)}: ${y?'Draw the death outcome':'Draw a survival outcome'}</strong><span>The same rule outputs ${math(`${rule}(${y})`)} = ${fmt(d)}</span><small>The probability of this outcome: ${count}/${n} ≈ ${(100*p).toFixed(2)}%</small><div class="ifn-prob-track" aria-hidden="true"><i style="width:${100*p}%"></i></div></div>`;
 }).join('');
 const vector=(isOutput)=>`<div class="ifn-vector ${isOutput?'ifn-output':'ifn-input'}" data-ifn-vector="${isOutput?'value':'outcome'}"><header><strong>${math(isOutput?`${rule}(y_i)`:'y_i')}</strong><span>${isOutput?'Calculated influence value':'True observed death indicator'}</span><small>List all ${n} items; only ${rows.length} items are displayed here</small></header>${rows.map(row=>`<div class="ifn-row" data-ifn-row="${row.rowNumber}" data-ifn-value="${isOutput?row.influence:row.y}"><small>i=${row.rowNumber}</small><b>${isOutput?fmt(row.influence):row.y}</b></div>`).join('')}<footer>⋮<br>The remaining records remain in their original order</footer></div>`;
 return html.replace(marker,`<figure class="if-notation" data-ifn-visual style="--ifn-body-half:${rows.length*38/2}px">
 <figcaption><strong>Compare the possible output of a random outcome to the actual output of a known record</strong></figcaption>
 <h4>What might the IF return before a new outcome is drawn?</h4>
 <p>First, fix the reference distribution ${math('P=P_{\\mathrm{ref}}=P_n')} and the mean value ${math(`\\mu=${sumY}/${n}`)} formed by these ${n} real records, and then imagine drawing a new outcome value ${math('Y')} from its outcome marginal ${math('P_{n,Y}')}. This is a thought experiment of drawing new outcomes from a reference distribution.</p>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="Two possible outputs for new observations under fixed reference distribution, scrollable sideways"><div class="ifn-branch-flow"><div class="ifn-unknown"><strong>${math(`${rule}(Y)`)}</strong><span>The outcome has not yet been drawn</span><small>Rules fixed<br>The output depends on the drawn outcome.</small></div><span class="ifn-arrow" aria-hidden="true">→</span><div class="ifn-branches">${branch}</div></div></div>
 <p class="ifn-note">These two possible outputs and their probabilities describe the random variable ${math(`${rule}(Y)`)}. It allows us to discuss "how the output will fluctuate"; after drawing a specific outcome, it will fall on one of the known numbers. The probability bars share a 0-100% scale.</p>
 <h4>Substituting the known outcomes into IF one by one, what influence values are obtained?</h4>
 <p>Go back to rows ${rows[0].rowNumber}-${rows.at(-1).rowNumber} of the same CSV. At this point the outcome is known, so each output is determined. Lowercase ${math('y_i')} is the actual outcome of the ${math('i')} record; ${math(`${rule}(y_i)`)} is the number obtained after calling the rule once.</p>
 <div class="ifn-controls"><label>Choose an observed record<select data-ifn-select>${rows.map(row=>`<option value="${row.rowNumber}">Original row i=${row.rowNumber} · Y=${row.y}</option>`).join('')}</select></label><button type="button" data-ifn-reset>Reset check line</button></div>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="The true outcome column generates the influence value column item by item through the same fixed rule, which can be scrolled horizontally."><div class="ifn-vector-flow">${vector(false)}<span class="ifn-arrow" aria-hidden="true">→</span><div class="ifn-fixed-rule"><strong>${math(`${rule}(y)=y-\\mu`)}</strong><span>Use the same rule for each line</span><small>Subtract from every outcome<br>The fixed mean ${sumY}/${n}</small></div><span class="ifn-arrow" aria-hidden="true">→</span>${vector(true)}</div></div>
 <div class="ifn-equations" aria-live="polite">${rows.map((row,i)=>`<p data-ifn-equation="${row.rowNumber}"${i?' hidden':''}>Record ${row.rowNumber}: ${math(`${rule}(y_{${row.rowNumber}})=${rule}(${row.y})=${row.y}-\\frac{${sumY}}{${n}}=\\frac{${row.y*n-sumY}}{${n}}`)}, about ${fmt(row.influence)}.</p>`).join('')}</div>
 <p class="ifn-note">A vector preserves each value’s correspondence to its patient record. Averaging summarises the full column as one number. The figure previews ${rows.length} rows, and the complete vector has ${n} entries. The next section follows the form of "calculate one by one and then average", using the true distribution ${math('P_0')} as the base point to explain the estimation error.</p>
 </figure>`);
}
