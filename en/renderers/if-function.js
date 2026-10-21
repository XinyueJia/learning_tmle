import {renderInlineMath as math} from '../markdown.js';

/** Preview only: the mean rule is derived in Chapter 1; no ATE rule is substituted. */
export function renderIfFunction(html, data) {
 const marker='<div class="if-function-placeholder"></div>';
 if(!html.includes(marker))return html;
 const {n,sumY,meanY}=data.mean, values=data.grouped.D;
 if(!Number.isInteger(n)||n<=0||!Number.isInteger(sumY)||sumY<0||sumY>n||values.length!==2||values.some((d,y)=>Math.abs(d-(y-meanY))>1e-14))throw Error('Invalid empirical mean preview');
 const f=value=>(value>0?'+':'')+value.toFixed(6);
 const panels=[0,1].map(y=>`<div data-if-result="${y}"${y?' hidden':''}>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="Inputs, fixed functions and outputs, horizontal scrollable">
 <div class="if-flow">
 <div class="if-cell if-input"><span>One input · One outcome value</span><strong>${math(`y=${y}`)}</strong><small>${y?'Death within 30 days':'Known to survive for 30 days'} · 1 number</small></div>
 <span class="if-arrow" aria-hidden="true">→</span>
 <div class="if-cell if-rule"><span>Fixed function · mean target</span><strong>${math('D^{\\mathrm{mean}}_P:y\\mapsto y-\\mu')}</strong><small>Always subtract the same reference mean</small></div>
 <span class="if-arrow" aria-hidden="true">→</span>
 <div class="if-cell if-output"><span>One output · A signed real number</span><strong data-if-number="${values[y]}">${f(values[y])}</strong><small>Probability difference / unit replacement proportion · 1 number</small></div>
 </div></div>
 <p class="if-substitution">Substitute this input: ${math(`D^{\\mathrm{mean}}_P(${y})=${y}-\\frac{${sumY}}{${n}}=\\frac{${y*n-sumY}}{${n}}`)}. Decimals are shown as approximations only, fractions are exact values.</p>
 <p class="if-meaning">${y?'Positive sign: Adding a little probability weight to the death outcome will increase the mortality mean.':'Negative sign: Add a little probability weight to the survival outcome, and the mortality mean will decrease.'} The output is a rate of change; in this binary outcome distribution, when a proportion ${math('0\\le t\\le1')} is replaced by the outcome corresponding to the current input, the mean change is exactly ${math(`tD^{\\mathrm{mean}}_P(${y})`)}. Chapter 1 derives this step by step from the weighted average.</p>
 </div>`).join('');
 return html.replace(marker,`<figure class="if-function" data-if-function data-default-input="0">
 <figcaption><strong>Evaluate the mean IF at the survival and death outcomes</strong><br>Use the whole cohort’s mean 30-day mortality to understand the function’s input and output.</figcaption>
 <div class="if-context"><strong>First fix the target, reference distribution and mean</strong><p>Target: ${math('\\Psi_{\\mathrm{mean}}(P)=\\mathbb E_P[Y]')}; reference ${math('P=P_{\\mathrm{ref}}=P_n')} is the empirical distribution of these ${n} complete RHC records. This mean rule only reads its outcome marginal ${math('P_{n,Y}')}: the probabilities of the two 0/1 outcomes add up to 1. ${sumY} died and ${n-sumY} survived, so ${math(`\\mu=${sumY}/${n}`)} (about ${(meanY*100).toFixed(2)}%) is fixed.</p><p>This mean rule only reads the outcome ${math('y')}. Each call uses the reference mean fixed above.</p></div>
 <div class="if-controls"><label for="if-observation">Which outcome value is substituted now?<select id="if-observation" data-if-input><option value="0">y = 0: alive at 30 days</option><option value="1">y = 1: Death within 30 days</option></select></label><button type="button" data-if-reset>Reset input</button></div>
 <div class="if-results" aria-live="polite" aria-atomic="true">${panels}</div>
 <p class="if-boundary">The input is a 0/1 outcome value; the output is the rate of change of the mean when increasing the weight of this outcome. Negative values indicate a decrease, positive values indicate an increase. Chapter 4 will build rules for reading the entire ${math('o=(w,a,y)')} for ATE.</p>
 </figure>`);
}
