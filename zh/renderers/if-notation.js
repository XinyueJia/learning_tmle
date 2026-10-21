import {renderInlineMath as math} from '../../scripts/markdown.js';
const fmt=value=>(value>0?'+':'')+value.toFixed(6);
const rule='D^{\\mathrm{mean}}_P';
export function renderIfNotation(html,data){
 const marker='<div class="if-notation-placeholder"></div>';
 if(!html.includes(marker))return html;
 const {n,sumY,meanY}=data.mean,rows=data.shown;
 if(!rows.length||rows.some(row=>Math.abs(row.influence-(row.y-meanY))>1e-14))throw Error('Inconsistent real-record influence preview');
 const branch=[0,1].map(y=>{
  const count=y?sumY:n-sumY,p=count/n,d=data.grouped.D[y];
  return `<div class="ifn-branch" data-ifn-outcome="${y}" data-ifn-probability="${p}" data-ifn-output="${d}"><strong>${math(`Y=${y}`)}：${y?'抽到死亡结局':'抽到存活结局'}</strong><span>同一规则输出 ${math(`${rule}(${y})`)} = ${fmt(d)}</span><small>这种结局的概率：${count}/${n} ≈ ${(100*p).toFixed(2)}%</small><div class="ifn-prob-track" aria-hidden="true"><i style="width:${100*p}%"></i></div></div>`;
 }).join('');
 const vector=(isOutput)=>`<div class="ifn-vector ${isOutput?'ifn-output':'ifn-input'}" data-ifn-vector="${isOutput?'value':'outcome'}"><header><strong>${math(isOutput?`${rule}(y_i)`:'y_i')}</strong><span>${isOutput?'已经算出的影响值':'真实已观察的死亡指标'}</span><small>全列${n}项；这里只显示${rows.length}项</small></header>${rows.map(row=>`<div class="ifn-row" data-ifn-row="${row.rowNumber}" data-ifn-value="${isOutput?row.influence:row.y}"><small>i=${row.rowNumber}</small><b>${isOutput?fmt(row.influence):row.y}</b></div>`).join('')}<footer>⋮<br>其余记录仍按原始顺序保留</footer></div>`;
 return html.replace(marker,`<figure class="if-notation" data-ifn-visual style="--ifn-body-half:${rows.length*38/2}px">
 <figcaption><strong>比较随机结局的可能输出与已知记录的实际输出</strong></figcaption>
 <h4>抽取新结局前，IF可能输出什么？</h4>
 <p>先固定这${n}条真实记录形成的参考分布${math('P=P_{\\mathrm{ref}}=P_n')}和均值${math(`\\mu=${sumY}/${n}`)}，再设想按其结局边缘${math('P_{n,Y}')}抽取一个新的结局值${math('Y')}。这是一次按参考分布抽取新结局的思想实验。</p>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="固定参考分布下新观测的两种可能输出，可横向滚动"><div class="ifn-branch-flow"><div class="ifn-unknown"><strong>${math(`${rule}(Y)`)}</strong><span>输入还未抽取</span><small>规则固定<br>输出随抽到的结局而定</small></div><span class="ifn-arrow" aria-hidden="true">→</span><div class="ifn-branches">${branch}</div></div></div>
 <p class="ifn-note">这两种可能输出及其概率，描述了随机变量（random variable）${math(`${rule}(Y)`)}。它让我们讨论“输出会怎样波动”；抽到具体结局后，就落到其中一个已知数。概率条共用0—100%刻度。</p>
 <h4>将已知结局逐条代入IF，得到哪些影响值？</h4>
 <p>回到同一CSV的第${rows[0].rowNumber}—${rows.at(-1).rowNumber}行。此时结局是已知的，所以每项输出也已经确定。小写${math('y_i')}是第${math('i')}条记录的实际结局；${math(`${rule}(y_i)`)}就是给它调用一次规则后得到的数。</p>
 <div class="ifn-controls"><label>选一条真实记录核对<select data-ifn-select>${rows.map(row=>`<option value="${row.rowNumber}">原始行 i=${row.rowNumber} · Y=${row.y}</option>`).join('')}</select></label><button type="button" data-ifn-reset>重置核对行</button></div>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="真实结局列逐项通过同一固定规则生成影响值列，可横向滚动"><div class="ifn-vector-flow">${vector(false)}<span class="ifn-arrow" aria-hidden="true">→</span><div class="ifn-fixed-rule"><strong>${math(`${rule}(y)=y-\\mu`)}</strong><span>每行使用同一个规则</span><small>每一行都减去<br>固定的 ${sumY}/${n}</small></div><span class="ifn-arrow" aria-hidden="true">→</span>${vector(true)}</div></div>
 <div class="ifn-equations" aria-live="polite">${rows.map((row,i)=>`<p data-ifn-equation="${row.rowNumber}"${i?' hidden':''}>第${row.rowNumber}条记录：${math(`${rule}(y_{${row.rowNumber}})=${rule}(${row.y})=${row.y}-\\frac{${sumY}}{${n}}=\\frac{${row.y*n-sumY}}{${n}}`)}，约 ${fmt(row.influence)}。</p>`).join('')}</div>
 <p class="ifn-note">向量（vector）让我们逐项保留这些数及其对应记录；取平均才把整列压成一个数。图中预览${rows.length}行，完整向量有${n}项。下一节沿用“逐条计算再取平均”的形式，以真实分布${math('P_0')}为基点来解释估计误差。</p>
 </figure>`);
}
