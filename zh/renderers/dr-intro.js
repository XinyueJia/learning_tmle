import {renderInlineMath as math} from '../../scripts/markdown.js';
import {solveRhc} from '../../shared/js/rhc.js';
const probability=x=>(100*x).toFixed(2)+'%';
const pp=x=>(100*x).toFixed(4)+' 个百分点';
const signed=x=>(x>=0?'+':'')+x.toFixed(4);
const scroll=(label,body)=>`<div class="dr-scroll" tabindex="0" role="region" aria-label="${label}">${body}</div>`;
const arrow='<span class="dr-arrow" aria-hidden="true">→</span>';
const box=(label,body)=>`<div class="dr-box"><strong>${label}</strong><div>${body}</div></div>`;
/** Introductory figures use exactly the fitted cohort and initial models of chapter 8. */
export function renderDrIntro(html,fit){
 if(!html.includes('<div class="dr-intro-models"></div>'))return html;
 const first=fit.rows.slice(0,6),target=solveRhc(fit);
 const models=`<figure class="dr-figure" data-dr-models><figcaption>分别预测患者的死亡风险与接受RHC的概率</figcaption>
 <p class="dr-input">${fit.n}条记录：<b>W 基线</b>（sex、age、race、12项既往史） · <b>A 是否RHC</b> · <b>Y 是否30日死亡</b></p>
 ${scroll('结局回归与处理回归的输入和输出，可横向滚动',`<div class="dr-model-pair"><section class="dr-q"><h3>结局回归 Q</h3><div class="dr-flow">${box('拟合时',math('Y\\sim A+W'))}${arrow}${box('预测时',math('(1,W_i),\\ (0,W_i)'))}</div><p>固定同一人的基线，分别输入两种处理</p><table><thead><tr><th>原行</th><th>${math('\\widehat Q(1,W_i)')}<br>RHC死亡风险</th><th>${math('\\widehat Q(0,W_i)')}<br>未RHC死亡风险</th></tr></thead><tbody>${first.map((r,i)=>`<tr data-dr-q-row="${i+1}"><th>${i+1}</th><td data-q1="${fit.q1[i]}">${probability(fit.q1[i])}</td><td data-q0="${fit.q0[i]}">${probability(fit.q0[i])}</td></tr>`).join('')}</tbody></table></section><section class="dr-g"><h3>处理回归 g</h3><div class="dr-flow">${box('拟合时',math('A\\sim W'))}${arrow}${box('预测时',math('W_i'))}</div><p>输入同一人的基线，预测其处理概率</p><table><thead><tr><th>原行</th><th>${math('\\widehat g(W_i)')}<br>接受RHC的概率</th></tr></thead><tbody>${first.map((r,i)=>`<tr data-dr-g-row="${i+1}"><th>${i+1}</th><td data-g="${fit.g[i]}">${probability(fit.g[i])}</td></tr>`).join('')}</tbody></table></section></div>`)}
 <p class="dr-note">两栏保持原CSV的相同行号，预览前6人；拟合和平均使用全部${fit.n}人。图中使用第8章同一组初始logistic回归；Q两列是模型预测。</p></figure>`;
 const correction=`<figure class="dr-figure" data-dr-correction><figcaption>将逐人加权残差取平均，得到全队列的校正量</figcaption>
 ${scroll('真实RHC记录的加权残差，可横向滚动',`<table><thead><tr><th>原行</th><th>实际A / Y</th><th>实际处理下<br>预测死亡风险</th><th>残差<br>Y − 预测</th><th>乘上带符号权重</th><th>得到贡献 C</th></tr></thead><tbody>${first.map((r,i)=>{const q=r.a?fit.q1[i]:fit.q0[i],res=r.y-q,h=fit.H[i];return `<tr data-dr-residual-row="${i+1}"><th>${i+1}</th><td>${r.a} / ${r.y}</td><td>${probability(q)}</td><td>${signed(res)}</td><td>${r.a?'＋1 / ĝ':'−1 / (1 − ĝ)'}<br>= ${signed(h)}</td><td data-c="${res*h}">${signed(res*h)}</td></tr>`;}).join('')}</tbody></table>`)}
 ${scroll('从5735个贡献取平均，可横向滚动',`<div class="dr-flow dr-average">${box('全部5735人的 C','每人一个加权残差')}${arrow}${box('求和，再除以5735',`<b data-dr-correction-value="${fit.initialScore}">${pp(fit.initialScore)}</b>`)}</div>`)}
 <p class="dr-note">固定初始Q与g，用实际A和Y计算；表格只预览前6人。残差和C以概率为单位，平均后乘100显示为百分点。校正量是可计算的一阶修正，真实估计误差仍未知。</p></figure>`;
 const routes=`<figure class="dr-figure" data-dr-routes><figcaption>AIPW修正最终估计值，TMLE更新风险预测</figcaption>
 ${scroll('AIPW修正估计值的计算路径，可横向滚动',`<div class="dr-flow dr-route"><b class="dr-route-name">AIPW</b>${box('初始Q标准化',`<b data-dr-initial="${fit.initialEstimate}">${pp(fit.initialEstimate)}</b>`)}<span class="dr-arrow">＋</span>${box('初始加权残差平均',pp(fit.initialScore))}<span class="dr-arrow">＝</span>${box('修正后的风险差',`<b data-dr-aipw="${fit.aipw}">${pp(fit.aipw)}</b>`)}</div>`)}
 ${scroll('TMLE更新预测再标准化的计算路径，可横向滚动',`<div class="dr-flow dr-route"><b class="dr-route-name">TMLE</b>${box('初始Q、固定g','从同一初始拟合出发')}${arrow}${box('按EIF方向更新Q','使加权残差平均接近0')}${arrow}${box('用更新的Q标准化',`<b data-dr-tmle="${target.estimate}">${pp(target.estimate)}</b>`)}</div>`)}
 <p class="dr-note">风险差方向：RHC减未RHC。所有结果使用完整${fit.n}人和同一调整集；显示值经四舍五入。计算步骤与求解检验在第8章展开。</p></figure>`;
 return html.replace('<div class="dr-intro-models"></div>',models).replace('<div class="dr-intro-correction"></div>',correction).replace('<div class="dr-intro-routes"></div>',routes);
}
