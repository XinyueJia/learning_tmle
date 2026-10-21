import {summariseRhcPatients} from '../../shared/js/rhc-summary.js';

export function renderRhcPatientSummary(rows){
 const summary=summariseRhcPatients(rows),groups=['all','rhc','noRhc'];
 const value=(key,x)=>`<span data-rhc-stat="${key}" data-value="${x}">${['ageMean','ageSd'].includes(key)?x.toFixed(1):x}</span>`;
 const count=(key,s)=>`${value(key,s[key])}${s.n?`（${(100*s[key]/s.n).toFixed(1)}%）`:'（—）'}`;
 const items=[['人数','n',s=>value('n',s.n)],['年龄（岁），均值（SD）','age',s=>s.ageMean===null?'—':`${value('ageMean',s.ageMean)}（${s.ageSd===null?'—':value('ageSd',s.ageSd)}）`],['女性，人数（%）','female',s=>count('female',s)],['男性，人数（%）','male',s=>count('male',s)],['30日全因死亡，人数（%）','deaths',s=>count('deaths',s)]];
 return `<div class="table-wrap" tabindex="0" role="region" aria-label="RHC患者摘要表"><table class="rhc-patient-summary"><caption>SUPPORT/RHC重症患者的描述性摘要</caption><thead><tr><th scope="col">患者特征</th><th scope="col">全体患者</th><th scope="col">首24小时接受RHC</th><th scope="col">首24小时未接受RHC</th></tr></thead><tbody>${items.map(([label,key,format])=>`<tr data-rhc-summary-row="${key}"><th scope="row">${label}</th>${groups.map(group=>`<td data-rhc-group="${group}">${format(summary[group])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
