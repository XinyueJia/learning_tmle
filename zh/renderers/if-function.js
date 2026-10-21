import {renderInlineMath as math} from '../../scripts/markdown.js';

/** Preview only: the mean rule is derived in Chapter 1; no ATE rule is substituted. */
export function renderIfFunction(html, data) {
 const marker='<div class="if-function-placeholder"></div>';
 if(!html.includes(marker))return html;
 const {n,sumY,meanY}=data.mean, values=data.grouped.D;
 if(!Number.isInteger(n)||n<=0||!Number.isInteger(sumY)||sumY<0||sumY>n||values.length!==2||values.some((d,y)=>Math.abs(d-(y-meanY))>1e-14))throw Error('Invalid empirical mean preview');
 const f=value=>(value>0?'+':'')+value.toFixed(6);
 const panels=[0,1].map(y=>`<div data-if-result="${y}"${y?' hidden':''}>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="输入、固定函数和输出，可横向滚动">
 <div class="if-flow">
 <div class="if-cell if-input"><span>一次输入 · 一个结局值</span><strong>${math(`y=${y}`)}</strong><small>${y?'30日内死亡':'已知30日存活'} · 1个数</small></div>
 <span class="if-arrow" aria-hidden="true">→</span>
 <div class="if-cell if-rule"><span>固定的函数 · 均值目标</span><strong>${math('D^{\\mathrm{mean}}_P:y\\mapsto y-\\mu')}</strong><small>总是减去同一个参考均值</small></div>
 <span class="if-arrow" aria-hidden="true">→</span>
 <div class="if-cell if-output"><span>一次输出 · 一个带符号的实数</span><strong data-if-number="${values[y]}">${f(values[y])}</strong><small>概率差 / 单位替换比例 · 1个数</small></div>
 </div></div>
 <p class="if-substitution">代入这一次输入：${math(`D^{\\mathrm{mean}}_P(${y})=${y}-\\frac{${sumY}}{${n}}=\\frac{${y*n-sumY}}{${n}}`)}。小数仅为显示近似，分数为精确值。</p>
 <p class="if-meaning">${y?'正号：向死亡结局增加一点概率权重，死亡均值会上升。':'负号：向存活结局增加一点概率权重，死亡均值会下降。'}输出是变化率；在这个二元结局分布中，以${math('0\\le t\\le1')}的比例替换为当前输入对应的结局时，均值变化精确为${math(`tD^{\\mathrm{mean}}_P(${y})`)}。第一讲将从加权平均逐步推导。</p>
 </div>`).join('');
 return html.replace(marker,`<figure class="if-function" data-if-function data-default-input="0">
 <figcaption><strong>分别将存活和死亡结局代入均值IF</strong><br>先以“全队列30日死亡均值”认识函数的输入与输出。</figcaption>
 <div class="if-context"><strong>先固定目标、参考分布与均值</strong><p>目标：${math('\\Psi_{\\mathrm{mean}}(P)=\\mathbb E_P[Y]')}；参考${math('P=P_{\\mathrm{ref}}=P_n')}是这${n}条真实RHC完整记录的经验分布。这个均值规则只读取它的结局边缘${math('P_{n,Y}')}：0/1两种结局的概率相加为1。${sumY}个死亡、${n-sumY}个存活，因此固定${math(`\\mu=${sumY}/${n}`)}（约${(meanY*100).toFixed(2)}%）。</p><p>这条均值规则只读取结局${math('y')}。每次调用都使用上面固定的参考均值。</p></div>
 <div class="if-controls"><label for="if-observation">现在代入哪一个结局值？<select id="if-observation" data-if-input><option value="0">y = 0：30日存活</option><option value="1">y = 1：30日内死亡</option></select></label><button type="button" data-if-reset>重置输入</button></div>
 <div class="if-results" aria-live="polite" aria-atomic="true">${panels}</div>
 <p class="if-boundary">输入是一个0/1结局值；输出是增加这类结局权重时，均值的变化率。负值表示下降，正值表示上升。第4章会为ATE构建读取整条${math('o=(w,a,y)')}的规则。</p>
 </figure>`);
}
