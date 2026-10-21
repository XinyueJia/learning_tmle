import {renderInlineMath as math} from '../../scripts/markdown.js';
import {meanErrorData} from '../../shared/js/mean-error.js';
export function renderOlsError(html, data) {
 const marker='<div class="ols-error-placeholder"></div>';
 if(!html.includes(marker))return html;
 const s=meanErrorData(data.Y),i=s.outcomes.indexOf(1)>=0?s.outcomes.indexOf(1):0,y=s.outcomes[i],residual=s.sampleCentred.values[i];
 const box=(title,formula,body,kind='known')=>`<div class="oe-box oe-${kind}"><strong>${title}</strong><span>${math(formula)}</span>${body}</div>`;
 const minus='<span class="oe-op" aria-hidden="true">−</span>',equal='<span class="oe-op" aria-hidden="true">=</span>';
 const lane=(kind,title,body)=>`<h4>${title}</h4><div class="diagram-scroll oe-scroll" tabindex="0" role="region" aria-label="${title}"><div class="oe-lane" data-oe-lane="${kind}">${body}</div></div>`;
 return html.replace(marker,`<figure class="oe-visual" data-oe-visual><figcaption><strong>分别计算患者的残差与风险估计的误差</strong></figcaption>
 <p>同一RHC队列，${s.n}人中${s.events}人在30日内死亡。这里只拟合一个共同截距，拟合值为${math(`\\widehat\\mu_n=${s.events}/${s.n}`)}。</p>
 ${lane('residual','① 用患者的实际结局减去拟合值',
 box('一位患者的结局',`y_{${i+1}}=${y}`,`<b data-oe-outcome="${y}">${y}</b><small>原CSV第${i+1}条 · 已观察</small>`)+minus+
 box('这位患者的拟合值',`\\widehat y_{${i+1}}=\\widehat\\mu_n`,`<b data-oe-fitted="${s.muhat}">${s.muhat.toFixed(6)}</b><small>由全部${s.n}条记录拟合<br>每位患者共用</small>`)+equal+
 box('这一条记录的残差',`e_{${i+1}}=y_{${i+1}}-\\widehat\\mu_n`,`<b data-oe-residual="${residual}">${residual>0?'+':''}${residual.toFixed(6)}</b><small>两项已知，因此可计算<br>全体有${s.n}个残差</small>`))}
 ${lane('estimation','② 用全样本风险估计减去真实风险',
 box('全样本死亡风险估计','\\widehat\\mu_n',`<b data-oe-estimate="${s.muhat}">${s.muhat.toFixed(6)}</b><small>由全部${s.n}条记录计算<br>这次分析的一个估计值</small>`)+minus+
 box('目标人群的真实风险','\\mu_0', '<b>未知</b><small>由固定真实P₀决定<br>当前记录没有给出真值</small>','unknown')+equal+
 box('这次估计的误差','\\widehat\\mu_n-\\mu_0','<b data-oe-error>未知</b><small>大小和方向都尚未知<br>这项估计对应一个误差</small>','unknown'))}
 <p class="oe-note">第${i+1}人的残差可计算；这项风险估计离真实风险多远，仍取决于未知的μ₀。下一步比较两种中心下逐人差值的平均。</p></figure>`);
}
