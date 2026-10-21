import {summariseRhcPatients} from '../../shared/js/rhc-summary.js';

export function renderRhcPatientSummary(rows){
 const summary=summariseRhcPatients(rows),groups=['all','rhc','noRhc'];
 const value=(key,x)=>`<span data-rhc-stat="${key}" data-value="${x}">${['ageMean','ageSd'].includes(key)?x.toFixed(1):x}</span>`;
 const count=(key,s)=>`${value(key,s[key])}${s.n?`(${(100*s[key]/s.n).toFixed(1)}%)`:'(—)'}`;
 const items=[['Number of people','n',s=>value('n',s.n)],['Age (years), mean (SD)','age',s=>s.ageMean===null?'—':`${value('ageMean',s.ageMean)}(${s.ageSd===null?'—':value('ageSd',s.ageSd)})`],['Female, number (%)','female',s=>count('female',s)],['Male, number (%)','male',s=>count('male',s)],['All-cause deaths within 30 days, n (%)','deaths',s=>count('deaths',s)]];
 return `<div class="table-wrap" tabindex="0" role="region" aria-label="RHC patient summary"><table class="rhc-patient-summary"><caption>SUPPORT/RHC: descriptive summary of critically ill patients</caption><thead><tr><th scope="col">patient characteristics</th><th scope="col">All patients</th><th scope="col">Received RHC within the first 24 hours</th><th scope="col">No RHC received in the first 24 hours</th></tr></thead><tbody>${items.map(([label,key,format])=>`<tr data-rhc-summary-row="${key}"><th scope="row">${label}</th>${groups.map(group=>`<td data-rhc-group="${group}">${format(summary[group])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
