import {parsePublicCsv,auditPublicRows,PUBLIC_DRUGS} from '../../shared/js/public-rws.js';
const root=document.querySelector('#public-data-lab');
if(root){
 try{
  const response=await fetch('../shared/data/public/ng-2021-nsclc/source.csv');
  if(!response.ok)throw Error(`CSV HTTP ${response.status}`);
  const rows=parsePublicCsv(await response.text());auditPublicRows(rows);
  root.innerHTML=`<form class="public-controls"><label>查看哪种初始用药<select name="drug"><option value="all">全部药物</option>${PUBLIC_DRUGS.map(d=>`<option>${d}</option>`).join('')}</select></label><label>核查时点（月）<select name="horizon">${[3,6,12,24,36].map(h=>`<option value="${h}" ${h===12?'selected':''}>${h}个月</option>`).join('')}</select></label><button type="reset">重置本页</button></form><p>只改变显示筛选和核查时点；原始记录、其他字段及八讲数学模型固定。这里均为确切记录数，没有近似风险或疗效估计。</p><div class="public-results" aria-live="polite" aria-atomic="true"></div>`;
  const form=root.querySelector('form'),results=root.querySelector('.public-results');
  function update(){
   const a=auditPublicRows(rows,{drug:form.elements.drug.value,horizon:Number(form.elements.horizon.value)});
   const cards=[['n','当前记录',a.n,'人；原文件始终保留107行'],['pfs-exceeds','PFS时间 > 随访时间',a.pfsExceedsFollowup,'条；时间起点或含义需核实，并非已确认错误'],['death-no-progression','死亡=1且进展=0',a.deathWithoutProgression,'条；不能据此推断PFS事件规则'],['mutation-negative','突变字段为Negative',a.mutationNegative,'条；保留并标记，不自动按filter_$删除'],['early-pfs',`进展=0且PFS时间 < ${a.horizon}月`,a.provisionalPfsEarlyNoProgression,'条；在未验证字段配对下的暂定筛查'],['early-os',`死亡=0且随访时间 < ${a.horizon}月`,a.provisionalOsEarlyAlive,'条；同样未验证时间起点，不能编码为无事件']];
   results.innerHTML=`<p class="public-gate" data-endpoint-admissible="false"><strong>临床终点：未验证</strong> · 当前${a.drug==='all'?'全部药物':a.drug}，核查时点${a.horizon}个月。任意筛选下都不构造Y，不计算临床ATE或TMLE。</p><div class="public-cards">${cards.map(([key,title,value,note])=>`<section><h3>${title}</h3><strong data-count="${key}">${value}</strong><p>${note}</p></section>`).join('')}</div><figure class="public-bars"><figcaption>真实原始记录：按初始用药计数（单位：人，长度按当前最多人数缩放）</figcaption>${PUBLIC_DRUGS.map(d=>`<div class="public-bar-row"><span>${d}</span><div class="public-bar-track"><span style="width:${100*a.byDrugCounts[d]/Math.max(1,...Object.values(a.byDrugCounts))}%"></span></div><strong data-drug-count="${d}">${a.byDrugCounts[d]}</strong></div>`).join('')}</figure><details><summary>展开本次核查规则与字段含义</summary><p>图中药物来自Group_S。时间单位沿用原始列名的月，但时间起点及与状态的配对仍未核实；符号“&lt;”表示严格小于核查时点。全部计数由当前筛选记录逐行计算。PFS时间与随访时间比较不是误差判定；早期记录计数不是临床删失率，也不是已确认的未知结局人数。</p></details>`;
  }
  form.addEventListener('change',update);form.addEventListener('reset',()=>setTimeout(update,0));update();root.setAttribute('aria-busy','false');
 }catch(error){root.replaceChildren();const p=document.createElement('p');p.setAttribute('role','alert');p.textContent=`公开数据读取失败：${error.message}。没有用合成数据替代。`;root.append(p);root.setAttribute('aria-busy','false');}
}
