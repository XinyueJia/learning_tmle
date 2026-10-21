import {renderInlineMath as math} from '../markdown.js';
import {meanErrorData} from '../../shared/js/mean-error.js';
export function renderOlsError(html, data) {
 const marker='<div class="ols-error-placeholder"></div>';
 if(!html.includes(marker))return html;
 const s=meanErrorData(data.Y),i=s.outcomes.indexOf(1)>=0?s.outcomes.indexOf(1):0,y=s.outcomes[i],residual=s.sampleCentred.values[i];
 const box=(title,formula,body,kind='known')=>`<div class="oe-box oe-${kind}"><strong>${title}</strong><span>${math(formula)}</span>${body}</div>`;
 const minus='<span class="oe-op" aria-hidden="true">−</span>',equal='<span class="oe-op" aria-hidden="true">=</span>';
 const lane=(kind,title,body)=>`<h4>${title}</h4><div class="diagram-scroll oe-scroll" tabindex="0" role="region" aria-label="${title}"><div class="oe-lane" data-oe-lane="${kind}">${body}</div></div>`;
 return html.replace(marker,`<figure class="oe-visual" data-oe-visual><figcaption><strong>Distinguish a patient’s residual from the estimation error</strong></figcaption>
 <p>In the same RHC cohort, ${s.events} of ${s.n} people died within 30 days. Here only one common intercept is fitted, and the fitted value is ${math(`\\widehat\\mu_n=${s.events}/${s.n}`)}.</p>
 ${lane('residual','① Subtract the fitted value from the patient’s actual outcome',
 box('One patient\'s outcome',`y_{${i+1}}=${y}`,`<b data-oe-outcome="${y}">${y}</b><small>Original CSV row ${i+1} · Observed</small>`)+minus+
 box('The fitted value for this patient',`\\widehat y_{${i+1}}=\\widehat\\mu_n`,`<b data-oe-fitted="${s.muhat}">${s.muhat.toFixed(6)}</b><small>Fitted from all ${s.n} records<br>shared by each patient</small>`)+equal+
 box('The residual of this record',`e_{${i+1}}=y_{${i+1}}-\\widehat\\mu_n`,`<b data-oe-residual="${residual}">${residual>0?'+':''}${residual.toFixed(6)}</b><small>Both terms are known, so the residual is computable<br>There are ${s.n} residuals in total</small>`))}
 ${lane('estimation','② Subtract the true risk from the full sample risk estimate',
 box('Full-sample mortality risk estimate','\\widehat\\mu_n',`<b data-oe-estimate="${s.muhat}">${s.muhat.toFixed(6)}</b><small>Calculated from all ${s.n} records<br>An estimate for this analysis</small>`)+minus+
 box('True risk in the target population','\\mu_0', '<b>unknown</b><small>Determined by the fixed true distribution P₀<br>Its true value is unknown</small>','unknown')+equal+
 box('The error of this estimate','\\widehat\\mu_n-\\mu_0','<b data-oe-error>unknown</b><small>Magnitude and sign are unknown<br>One error for this estimate</small>','unknown'))}
 <p class="oe-note">The residual for person ${i+1} can be calculated; how far this risk estimate is from the true risk still depends on the unknown μ₀. The next step is to compare the average person-by-person differences between the two centres.</p></figure>`);
}
