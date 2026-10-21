import {renderInlineMath as math} from '../../scripts/markdown.js';

const decimal=x=>(Object.is(x,-0)?0:x).toFixed(6);
const pp=x=>(100*x).toFixed(4)+' 个百分点';
const factor=x=>x<0?`(${decimal(x)})`:decimal(x);

/** Use the same initial full-cohort trace as the six-step table. */
export function renderIpwBridge(initial){
 const {vectors:v,shown,summary:s}=initial;
 const ipw=v.y.reduce((sum,y,i)=>sum+v.h[i]*y,0)/s.n;
 const header=(title,formula,description)=>`<header><h4>${title}</h4><div>${math(formula)}</div><p>${description}</p></header>`;
 return `<figure class="to-ipw-bridge" data-to-ipw-bridge>
 <figcaption>比较同一权重乘结局与乘残差的两种运算</figcaption>
 <p>沿用上面拟合的${math('\\widehat Q')}与${math('\\widehat g')}；原始患者的${math('W,A,Y')}固定。下面各列同一水平行都对应同一条记录。</p>
 <div class="to-scroll" tabindex="0" role="region" aria-label="同六条RHC记录的逆概率权重、加权结局与加权残差对照，可横向滚动">
 <div class="to-ipw-objects">
 <section class="to-ipw-object to-ipw-weight">
 ${header('两支共用的权重','H_{A,i}','由实际处理与拟合处理概率计算')}
 ${shown.map(r=>`<div class="to-ipw-row" data-to-ipw-weight-row="${r.row}"><span>原行${r.row} · ${math(`A_i=${r.a}`)} · ${math(`\\widehat g_i=${decimal(r.g)}`)}</span><b data-to-ipw-h="${r.h}">${math(`H_{A,i}=${decimal(r.h)}`)}</b></div>`).join('')}
 <footer>${math(`${s.n}\\times1`)} 权重向量 · 前${shown.length}项</footer>
 </section>
 <section class="to-ipw-object to-ipw-outcome">
 ${header('左支 · IPW加权结局','H_{A,i}Y_i','同一个权重 × 实际死亡结局')}
 ${shown.map(r=>`<div class="to-ipw-row" data-to-ipw-outcome-row="${r.row}"><span>原行${r.row} · 实际结局 ${math(`Y_i=${r.y}`)}</span><b data-to-ipw-outcome="${r.h*r.y}">${math(`${factor(r.h)}\\times${r.y}=${decimal(r.h*r.y)}`)}</b></div>`).join('')}
 <footer>${math(`${s.n}\\times1`)} 逐人贡献 · 前${shown.length}项</footer>
 </section>
 <section class="to-ipw-object to-ipw-residual">
 ${header('右支 · AIPW的加权残差','C_i=H_{A,i}(Y_i-\\widehat Q_{A,i})','同一个权重 ×（实际结局 − 初始预测）')}
 ${shown.map(r=>`<div class="to-ipw-row" data-to-ipw-residual-row="${r.row}"><span>原行${r.row} · 初始预测 ${math(`\\widehat Q_{A,i}=${decimal(r.qa)}`)}</span><b data-to-ipw-residual="${r.score_contribution}">${math(`${factor(r.h)}\\times(${r.y}-${decimal(r.qa)})=${decimal(r.score_contribution)}`)}</b></div>`).join('')}
 <footer>${math(`${s.n}\\times1`)} 逐人校正贡献 · 前${shown.length}项</footer>
 </section>
 </div></div>
 <p class="to-data-note">显示6条，汇总使用全部${s.n}条记录。各行乘法使用未舍入值，图中小数保留6位；加权贡献采用概率差尺度。</p>
 <div class="to-ipw-averages">
 <div><h4>左支 ↓ 全体平均</h4>${math('\\widehat\\psi_{\\mathrm{IPW}}=\\frac1n\\sum_i H_{A,i}Y_i')}<b data-to-ipw-average="${ipw}">${pp(ipw)}</b><p>本图采用总人数作分母的Horvitz–Thompson形式；两臂均除以${math(`n=${s.n}`)}。</p></div>
 <div><h4>右支 ↓ 全体平均</h4>${math('\\frac1n\\sum_i H_{A,i}(Y_i-\\widehat Q_{A,i})')}<b data-to-ipw-correction="${s.initial_score}">${pp(s.initial_score)}</b><p>这是校正量；接到初始标准化结果后才得到AIPW。</p></div>
 </div>
 <p class="to-ipw-zero">例如原行1的${math('Y_i=0')}：左支贡献为0，右支仍有残差信息，因为初始预测${math('\\widehat Q_{A,i}')}大于0。</p>
 </figure>`;
}

/** Show the initial-centre identity before introducing any updated Q. */
export function renderEifAipwBridge(initial){
 const {shown,summary:s}=initial;
 return `<figure class="to-eif-aipw" data-to-eif-aipw>
 <figcaption>为什么逐人的EIF与加权残差不同，全体平均却相同？</figcaption>
 <p>沿用上图的${math('C_i')}，加上个人预测风险差，再减去同一个初始中心${math('\\widehat\\psi_{\\mathrm{gcomp}}')}。</p>
 <div class="to-scroll" tabindex="0" role="region" aria-label="同一RHC原行1和2的加权残差与完整初始拟合EIF输出，可横向滚动"><div class="to-eif-records">
 <div class="to-eif-record-heading"><span>原行</span><span>${math('C_i')}<br>加权残差</span><strong>＋</strong><span>${math('\\widehat Q_{1,i}-\\widehat Q_{0,i}')}<br>个人预测风险差</span><strong>−</strong><span>${math('\\widehat\\psi_{\\mathrm{gcomp}}')}<br>同一个全体平均</span><strong>＝</strong><span>${math('\\widehat D_i^{\\mathrm{init}}')}<br>完整EIF输出</span></div>
 ${shown.slice(0,2).map(r=>`<div class="to-eif-record" data-to-eif-row="${r.row}"><b>${r.row}</b><span data-to-eif-c="${r.score_contribution}">${math(decimal(r.score_contribution))}</span><strong>＋</strong><span data-to-eif-contrast="${r.contrast}">${math(decimal(r.contrast))}</span><strong>−</strong><span data-to-eif-centre="${s.initial_estimate}">${math(decimal(s.initial_estimate))}</span><strong>＝</strong><span data-to-eif-output="${r.eif}">${math(decimal(r.eif))}</span></div>`).join('')}
 </div></div>
 <p class="to-data-note">两行只作逐人对照，单位为概率差；小数显示6位。下面各个平均均使用全${s.n}人，使用初始拟合与同一个中心值。</p>
 <div class="to-eif-average"><h4>对全部患者平均，中心化项消掉</h4>
 <div class="to-scroll" tabindex="0" role="region" aria-label="全体初始EIF平均等于加权残差平均，可横向滚动"><div class="to-ipw-sum">
 <span>${math('\\frac1n\\sum_i C_i')}<br><b>${pp(s.initial_score)}</b></span><strong>＋</strong>
 <span>${math('\\frac1n\\sum_i(\\widehat Q_{1,i}-\\widehat Q_{0,i})-\\widehat\\psi_{\\mathrm{gcomp}}')}<br><b data-to-eif-centred-average="${s.centred_mean}">${(s.centred_mean*100).toExponential(2)} ≈ 0 个百分点</b></span><strong>＝</strong>
 <span>${math('\\frac1n\\sum_i\\widehat D_i^{\\mathrm{init}}')}<br><b data-to-eif-average="${s.eif_mean}">${pp(s.eif_mean)}</b></span>
 </div></div></div>
 <div class="to-ipw-route"><h4>加回初始估计，得到AIPW</h4>
 <div class="to-scroll" tabindex="0" role="region" aria-label="初始标准化加初始拟合EIF平均得到AIPW，可横向滚动"><div class="to-ipw-sum"><span>初始标准化<br><b>${pp(s.initial_estimate)}</b></span><strong>＋</strong><span>初始拟合EIF平均<br><b>${pp(s.eif_mean)}</b></span><strong>＝</strong><span>AIPW<br><b data-to-ipw-aipw="${s.aipw}">${pp(s.aipw)}</b></span></div></div>
 </div>
 </figure>`;
}
